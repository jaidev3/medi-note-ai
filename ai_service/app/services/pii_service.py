"""
PII (Personally Identifiable Information) Detection and Anonymization Service for AI Microservice
Uses Microsoft Presidio for PII detection and anonymization
"""

import structlog
from typing import List, Optional, Tuple
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

from ai_service.app.schemas.pii_schemas import (
    PIIAnalysisRequest, PIIAnalysisResponse, PIIEntity,
    PIIAnonymizationRequest, PIIAnonymizationResponse
)

logger = structlog.get_logger(__name__)


class PIIService:
    """Service for PII detection and anonymization using Microsoft Presidio."""
    
    def __init__(self):
        """Initialize the PII service with Presidio components."""
        try:
            logger.info("🔍 Initializing PII service")
            
            # Configure NLP engine
            logger.info("🔍 Configuring NLP engine")
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
            }
            
            # Create NLP engine provider
            logger.info("🔍 Creating NLP engine provider")
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            nlp_engine = provider.create_engine()
            
            # Initialize analyzer
            logger.info("🔍 Initializing Presidio analyzer")
            self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
            
            # Initialize anonymizer
            logger.info("🔍 Initializing Presidio anonymizer")
            self.anonymizer = AnonymizerEngine()
            
            # Set default entities to detect
            self.default_entities = [
                "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", 
                "IBAN_CODE", "IP_ADDRESS", "LOCATION", 
                "NRP", "MEDICAL_LICENSE", "US_SSN", "US_PASSPORT", 
                "US_DRIVER_LICENSE", "CRYPTO", "US_BANK_NUMBER"
            ]
            
            # Set default score threshold
            self.default_score_threshold = 0.5
            
            logger.info("✅ PII service initialized successfully")
            
        except Exception as e:
            logger.error("❌ Failed to initialize PII service", error=str(e))
            raise RuntimeError(f"PII service initialization failed: {e}")
    
    async def analyze_text(self, request: PIIAnalysisRequest) -> PIIAnalysisResponse:
        """
        Analyze text for PII entities without anonymization.
        
        Args:
            request: PII analysis request
            
        Returns:
            PIIAnalysisResponse: Analysis results with detected entities
        """
        try:
            logger.info("Starting PII analysis", text_length=len(request.text))
            
            # Use provided entities or defaults
            entities_to_detect = request.entities if request.entities else self.default_entities
            
            # Analyze text for PII
            results = self.analyzer.analyze(
                text=request.text,
                entities=entities_to_detect,
                language=request.language,
                score_threshold=request.score_threshold
            )
            
            # Convert results to our schema
            detected_entities = []
            for result in results:
                entity = PIIEntity(
                    entity_type=result.entity_type,
                    start=result.start,
                    end=result.end,
                    score=result.score,
                    text=request.text[result.start:result.end]
                )
                detected_entities.append(entity)
            
            has_pii = len(detected_entities) > 0
            
            logger.info("✅ PII analysis completed", 
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
            logger.error("❌ PII analysis failed", error=str(e))
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
            logger.info("Starting PII anonymization", 
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
            
            # First analyze to find entities
            analyzer_results = self.analyzer.analyze(
                text=request.text,
                entities=entities_to_anonymize,
                language="en",
                score_threshold=request.score_threshold
            )
            
            # Convert to our entity format
            detected_entities = []
            for result in analyzer_results:
                entity = PIIEntity(
                    entity_type=result.entity_type,
                    start=result.start,
                    end=result.end,
                    score=result.score,
                    text=request.text[result.start:result.end]
                )
                detected_entities.append(entity)
            
            # Anonymize the text if entities were found
            if analyzer_results:
                anonymized_result = self.anonymizer.anonymize(
                    text=request.text,
                    analyzer_results=analyzer_results
                )
                anonymized_text = anonymized_result.text
                has_pii = True
                
                logger.info("✅ PII anonymization completed", 
                           original_length=len(request.text),
                           anonymized_length=len(anonymized_text),
                           entities_anonymized=len(detected_entities))
            else:
                anonymized_text = request.text
                has_pii = False
                logger.info("No PII entities found for anonymization")
            
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
            logger.error("❌ PII anonymization failed", error=str(e))
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
