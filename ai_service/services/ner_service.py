"""
NER (Named Entity Recognition) Service for AI Microservice
Implements biomedical entity extraction using Google Gemini
"""
import os
import time
import json
from typing import Dict, Any, List
import structlog
import google.generativeai as genai

from schemas.ner_schemas import NEROutput, Entity, NERRequest

logger = structlog.get_logger(__name__)


class NERService:
    """Service for biomedical Named Entity Recognition using Gemini."""
    
    def __init__(self):
        """Initialize NER service with Gemini model."""
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Gemini model for NER."""
        try:
            gemini_model = os.getenv("AI_SERVICE_GEMINI_MODEL", "gemini-1.5-flash")
            google_api_key = os.getenv("AI_SERVICE_GOOGLE_API_KEY")
            
            logger.info("Initializing Gemini for NER", model=gemini_model)
            
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
            
            logger.info("✅ Gemini NER model initialized successfully")
            
        except Exception as e:
            logger.error("❌ Failed to initialize Gemini NER model", error=str(e))
            raise RuntimeError(f"NER model initialization failed: {e}")
    
    def _create_ner_prompt(self, text: str, filter_types: List[str] = None) -> str:
        """Create prompt for Gemini to extract biomedical entities."""
        entity_types = filter_types if filter_types else [
            "disease", "symptom", "medication", "procedure", "test", 
            "anatomy", "dosage", "frequency", "duration"
        ]
        
        prompt = f"""Extract biomedical entities from the following clinical text. Return ONLY a JSON array of entities.

Clinical Text: {text}

Extract these entity types: {', '.join(entity_types)}

Return format (JSON only, no other text):
[
  {{
    "type": "entity_type",
    "value": "entity_text",
    "confidence": 0.95,
    "start_pos": 0,
    "end_pos": 10
  }}
]

Rules:
- Use lowercase for entity types
- Include exact positions in the original text
- Confidence between 0.0 and 1.0
- Only include relevant medical entities
- Return empty array [] if no entities found
"""
        return prompt
    
    async def extract_entities(self, request: NERRequest) -> NEROutput:
        """
        Extract biomedical entities from clinical text using Gemini.
        
        Args:
            request: NER request containing text and parameters
            
        Returns:
            NEROutput: Extracted entities with metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Starting Gemini NER entity extraction", text_length=len(request.text))
            
            if not self.model:
                raise RuntimeError("NER model not initialized")
            
            # Create prompt for entity extraction
            prompt = self._create_ner_prompt(request.text, request.filter_types)
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Try to extract JSON from the response
            try:
                # Remove markdown code blocks if present
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()
                
                raw_entities = json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON response, attempting extraction")
                # Try to find JSON array in the response
                import re
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    raw_entities = json.loads(json_match.group(0))
                else:
                    raw_entities = []
            
            # Process and validate entities
            entities = []
            for raw_entity in raw_entities:
                try:
                    entity = Entity(
                        type=raw_entity.get("type", "unknown").lower(),
                        value=raw_entity.get("value", ""),
                        confidence=float(raw_entity.get("confidence", 0.9)),
                        start_pos=raw_entity.get("start_pos", 0),
                        end_pos=raw_entity.get("end_pos", 0)
                    )
                    entities.append(entity)
                        
                except Exception as e:
                    logger.warning("Invalid entity format", entity=raw_entity, error=str(e))
            
            processing_time = time.time() - start_time
            
            result = NEROutput(
                entities=entities,
                total_entities=len(entities),
                processing_time=processing_time
            )
            
            logger.info(
                "✅ Gemini NER extraction completed",
                entity_count=len(entities),
                processing_time=processing_time
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                "❌ Gemini NER extraction failed",
                error=str(e),
                processing_time=processing_time
            )
            
            # Return empty result on failure
            return NEROutput(
                entities=[],
                total_entities=0,
                processing_time=processing_time
            )
    
    async def extract_context_data(self, text: str) -> Dict[str, Any]:
        """
        Extract context data for SOAP generation (simplified interface).
        
        Args:
            text: Clinical text to process
            
        Returns:
            Dict containing extracted entities and metadata
        """
        request = NERRequest(text=text)
        ner_output = await self.extract_entities(request)
        
        return {
            "entities": [entity.dict() for entity in ner_output.entities],
            "total_entities": ner_output.total_entities,
            "processing_time": ner_output.processing_time
        }
