"""
PII (Personally Identifiable Information) Detection and Anonymization Service for AI Microservice
Uses Google Gemini for PII detection and anonymization
"""

import os
import structlog
import json
import re
from typing import List, Optional, Tuple
import google.generativeai as genai

from schemas.pii_schemas import (
    PIIAnalysisRequest, PIIAnalysisResponse, PIIEntity,
    PIIAnonymizationRequest, PIIAnonymizationResponse
)

logger = structlog.get_logger(__name__)


class PIIService:
    """Service for PII detection and anonymization using Google Gemini."""
    
    def __init__(self):
        """Initialize the PII service with Gemini."""
        try:
            google_api_key = os.getenv("AI_SERVICE_GOOGLE_API_KEY")
            gemini_model = os.getenv("AI_SERVICE_GEMINI_MODEL", "gemini-1.5-flash")
            
            logger.info("🔍 Initializing PII service with Gemini")
            
            # Configure Gemini API
            genai.configure(api_key=google_api_key)
            
            # Initialize Gemini model
            self.model = genai.GenerativeModel(
                model_name=gemini_model,
                generation_config={
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
            
            # Set default entities to detect
            self.default_entities = [
                "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", 
                "IBAN_CODE", "IP_ADDRESS", "LOCATION", 
                "NRP", "MEDICAL_LICENSE", "US_SSN", "US_PASSPORT", 
                "US_DRIVER_LICENSE", "CRYPTO", "US_BANK_NUMBER"
            ]
            
            # Set default score threshold
            self.default_score_threshold = float(os.getenv("AI_SERVICE_PII_CONFIDENCE_THRESHOLD", "0.5"))
            
            logger.info("✅ PII service initialized successfully with Gemini")
            
        except Exception as e:
            logger.error("❌ Failed to initialize PII service", error=str(e))
            raise RuntimeError(f"PII service initialization failed: {e}")
    
    def _create_analysis_prompt(self, text: str, entities: List[str]) -> str:
        """Create prompt for Gemini to analyze PII."""
        return f"""Analyze the following text for personally identifiable information (PII). Return ONLY a JSON array.

Text to analyze:
{text}

Detect these PII entity types: {', '.join(entities)}

Return format (JSON only, no other text):
[
  {{
    "entity_type": "PERSON",
    "start": 0,
    "end": 10,
    "score": 0.95,
    "text": "extracted text"
  }}
]

Rules:
- Use exact entity type names from the provided list
- Include exact character positions (start, end)
- Score between 0.0 and 1.0 (confidence)
- Return empty array [] if no PII found
"""
    
    def _create_anonymization_prompt(self, text: str, entities: List[str], preserve_medical: bool) -> str:
        """Create prompt for Gemini to anonymize PII."""
        medical_note = ""
        if preserve_medical:
            medical_note = "\n- PRESERVE medical terms, conditions, procedures, and clinical information"
        
        return f"""Anonymize personally identifiable information (PII) in the following clinical text while maintaining medical context.

Text to anonymize:
{text}

PII types to anonymize: {', '.join(entities)}

Return TWO things in JSON format:
1. anonymized_text: The text with PII replaced
2. entities: Array of detected PII entities

Return format (JSON only):
{{
  "anonymized_text": "Text with [PERSON], [EMAIL], etc. replacing PII",
  "entities": [
    {{
      "entity_type": "PERSON",
      "start": 0,
      "end": 10,
      "score": 0.95,
      "text": "original text"
    }}
  ]
}}

Rules:
- Replace PII with [ENTITY_TYPE] placeholders
- Maintain sentence structure and readability{medical_note}
- Include all detected entities in the entities array
- Return empty entities array [] if no PII found
"""
    
    async def analyze_text(self, request: PIIAnalysisRequest) -> PIIAnalysisResponse:
        """
        Analyze text for PII entities without anonymization.
        
        Args:
            request: PII analysis request
            
        Returns:
            PIIAnalysisResponse: Analysis results with detected entities
        """
        try:
            logger.info("Starting Gemini PII analysis", text_length=len(request.text))
            
            # Use provided entities or defaults
            entities_to_detect = request.entities if request.entities else self.default_entities
            
            # Create prompt
            prompt = self._create_analysis_prompt(request.text, entities_to_detect)
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()
                
                results = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON array
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    results = json.loads(json_match.group(0))
                else:
                    results = []
            
            # Convert results to our schema
            detected_entities = []
            for result in results:
                if result.get("score", 0) >= request.score_threshold:
                    entity = PIIEntity(
                        entity_type=result.get("entity_type", "UNKNOWN"),
                        start=result.get("start", 0),
                        end=result.get("end", 0),
                        score=result.get("score", 0.9),
                        text=result.get("text", "")
                    )
                    detected_entities.append(entity)
            
            has_pii = len(detected_entities) > 0
            
            logger.info("✅ Gemini PII analysis completed", 
                       entities_found=len(detected_entities),
                       has_pii=has_pii)
            
            return PIIAnalysisResponse(
                success=True,
                original_text=request.text,
                entities=detected_entities,
                total_entities=len(detected_entities),
                has_pii=has_pii,
                message=f"Analysis completed. Found {len(detected_entities)} PII entities."
            )
            
        except Exception as e:
            logger.error("❌ Gemini PII analysis failed", error=str(e))
            return PIIAnalysisResponse(
                success=False,
                original_text=request.text,
                entities=[],
                total_entities=0,
                has_pii=False,
                message=f"PII analysis failed: {str(e)}"
            )
    
    async def anonymize_text(self, request: PIIAnonymizationRequest) -> PIIAnonymizationResponse:
        """
        Anonymize PII in text while optionally preserving medical context.
        
        Args:
            request: PII anonymization request
            
        Returns:
            PIIAnonymizationResponse: Anonymization results
        """
        try:
            logger.info("Starting Gemini PII anonymization", 
                       text_length=len(request.text),
                       preserve_medical=request.preserve_medical_context)
            
            # Define entities to anonymize for clinical text
            clinical_entities = [
                "PERSON",           # Patient names
                "PHONE_NUMBER",     # Contact information
                "EMAIL_ADDRESS",    # Contact information
                "US_SSN",          # Social security numbers
                "CREDIT_CARD",     # Financial information
                "US_PASSPORT",     # ID numbers
                "US_DRIVER_LICENSE", # ID numbers
                "US_BANK_NUMBER",  # Financial information
                "IP_ADDRESS",      # Technical information
                "URL"              # Web addresses
            ]
            
            # If not preserving medical context, include medical licenses and locations
            if not request.preserve_medical_context:
                clinical_entities.extend([
                    "MEDICAL_LICENSE",
                    "LOCATION"
                ])
            
            # Use provided entities or clinical defaults
            entities_to_anonymize = request.entities if request.entities else clinical_entities
            
            # Create prompt
            prompt = self._create_anonymization_prompt(
                request.text, 
                entities_to_anonymize,
                request.preserve_medical_context
            )
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()
                
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON object
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                else:
                    result = {"anonymized_text": request.text, "entities": []}
            
            anonymized_text = result.get("anonymized_text", request.text)
            entity_data = result.get("entities", [])
            
            # Convert to our entity format
            detected_entities = []
            for ent in entity_data:
                if ent.get("score", 0) >= request.score_threshold:
                    entity = PIIEntity(
                        entity_type=ent.get("entity_type", "UNKNOWN"),
                        start=ent.get("start", 0),
                        end=ent.get("end", 0),
                        score=ent.get("score", 0.9),
                        text=ent.get("text", "")
                    )
                    detected_entities.append(entity)
            
            has_pii = len(detected_entities) > 0
            
            logger.info("✅ Gemini PII anonymization completed", 
                       original_length=len(request.text),
                       anonymized_length=len(anonymized_text),
                       entities_anonymized=len(detected_entities))
            
            return PIIAnonymizationResponse(
                success=True,
                original_text=request.text,
                anonymized_text=anonymized_text,
                entities_found=detected_entities,
                entities_count=len(detected_entities),
                has_pii=has_pii,
                message=f"Anonymization completed. Processed {len(detected_entities)} PII entities."
            )
            
        except Exception as e:
            logger.error("❌ Gemini PII anonymization failed", error=str(e))
            return PIIAnonymizationResponse(
                success=False,
                original_text=request.text,
                anonymized_text=request.text,  # Return original text on failure
                entities_found=[],
                entities_count=0,
                has_pii=False,
                message=f"PII anonymization failed: {str(e)}"
            )
    
    async def quick_anonymize(self, text: str, entities: Optional[List[str]] = None) -> Tuple[str, bool]:
        """
        Quick anonymization method for internal use (compatible with existing backend).
        
        Args:
            text: Text to anonymize
            entities: Optional list of entity types to anonymize
            
        Returns:
            Tuple of (anonymized_text, has_pii)
        """
        try:
            request = PIIAnonymizationRequest(
                text=text,
                entities=entities,
                preserve_medical_context=True,
                score_threshold=self.default_score_threshold
            )
            
            response = await self.anonymize_text(request)
            return response.anonymized_text, response.has_pii
            
        except Exception as e:
            logger.error("❌ Quick anonymization failed", error=str(e))
            return text, False
    
    async def analyze_text_for_entities(self, text: str, entities: Optional[List[str]] = None) -> Tuple[List[PIIEntity], int]:
        """
        Quick analysis method for internal use (compatible with existing backend).
        
        Args:
            text: Text to analyze
            entities: Optional list of entity types to detect
            
        Returns:
            Tuple of (detected_entities, entity_count)
        """
        try:
            request = PIIAnalysisRequest(
                text=text,
                entities=entities,
                score_threshold=self.default_score_threshold
            )
            
            response = await self.analyze_text(request)
            return response.entities, response.total_entities
            
        except Exception as e:
            logger.error("❌ Quick analysis failed", error=str(e))
            return [], 0
