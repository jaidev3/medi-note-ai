"""
PII (Personally Identifiable Information) Detection and Anonymization Service
Uses Microsoft Presidio for PII detection and anonymization
"""

import structlog
from typing import List, Optional, Tuple
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

logger = structlog.get_logger(__name__)


class PIIService:
    """Internal service for PII detection and anonymization using Microsoft Presidio."""
    
    def __init__(self):
        """Initialize the PII service with Presidio components."""
        try:
            logger.info("🔍 jaidev: Initializing PII service")
            
            # Configure NLP engine
            logger.info("🔍 jaidev: Configuring NLP engine")
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
            }
            
            # Create NLP engine provider
            logger.info("🔍 jaidev: Creating NLP engine provider")
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            nlp_engine = provider.create_engine()
            
            # Initialize analyzer
            logger.info("🔍 jaidev: Initializing Presidio analyzer")
            self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
            
            # Initialize anonymizer
            logger.info("🔍 jaidev: Initializing Presidio anonymizer")
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
            
            logger.info("🔍 jaidev: PII service initialization completed successfully")
            
        except Exception as e:
            logger.error("🔍 jaidev: PII service initialization failed", 
                        error=str(e),
                        error_type=type(e).__name__)
            raise
    
    def is_healthy(self) -> bool:
        """
        Check if the PII service is healthy and ready to process requests.
        
        Returns:
            bool: True if service is healthy, False otherwise
        """
        try:
            logger.info("🔍 jaidev: Checking PII service health")
            
            # Check if analyzer and anonymizer are initialized
            if not self.analyzer or not self.anonymizer:
                logger.warning("🔍 jaidev: PII service not properly initialized")
                return False
            
            # Test with a simple text
            test_text = "Test text for health check"
            test_results = self.analyzer.analyze(text=test_text, language="en", entities=["PERSON"])
            
            logger.info("🔍 jaidev: PII service health check passed")
            return True
            
        except Exception as e:
            logger.error("🔍 jaidev: PII service health check failed", 
                        error=str(e),
                        error_type=type(e).__name__)
            return False
    
    async def quick_anonymize(self, text: str, entities: Optional[List[str]] = None, replacement_value: str = "<REDACTED>") -> Tuple[str, bool]:
        """
        Quick anonymization method for integration with other services.
        
        Args:
            text: Text to anonymize
            entities: Optional list of entity types to anonymize
            replacement_value: Replacement value for detected PII
            
        Returns:
            Tuple[str, bool]: (anonymized_text, has_pii_detected)
        """
        try:
            logger.info("🔊 jaidev: PII QUICK START", text_length=len(text))
            
            if not text or not text.strip():
                logger.info("🔍 jaidev: Empty text, returning early")
                return text, False
            
            # Use default entities if none provided
            target_entities = entities or self.default_entities
            logger.info("🔊 jaidev: PII QUICK ENTITIES", entities=target_entities)
            
            logger.debug(f"Running quick anonymization on text length {len(text)} with entities: {target_entities}")
            
            # Run Presidio analyzer
            logger.info("🔊 jaidev: PII QUICK ANALYZER RUN")
            analyzer_results = self.analyzer.analyze(text=text, entities=target_entities, language='en')
            logger.info("🔊 jaidev: PII QUICK ANALYZER DONE", results_count=len(analyzer_results))
            
            # Check if any PII was detected
            if not analyzer_results:
                logger.info("🔍 jaidev: No PII detected by analyzer")
                return text, False
            
            logger.info("🔊 jaidev: PII QUICK ANONYMIZER RUN")
            
            # Run Presidio anonymizer
            anonymized_result = self.anonymizer.anonymize(
                text=text,
                analyzer_results=analyzer_results
            )
            
            logger.info("🔊 jaidev: PII QUICK ANONYMIZER DONE", 
                       original_length=len(text),
                       anonymized_length=len(anonymized_result.text))
            
            logger.info("🔊 jaidev: PII QUICK END", detected=True)
            return anonymized_result.text, True
            
        except Exception as e:
            logger.error("🔊 jaidev: PII QUICK ERROR", 
                        error=str(e),
                        error_type=type(e).__name__,
                        text_length=len(text) if text else 0)
            return text, False
    
    async def analyze_text_for_entities(self, text: str, entities: Optional[List[str]] = None) -> Tuple[bool, int]:
        """
        Analyze text for PII entities without anonymization.
        
        Args:
            text: Text to analyze
            entities: Optional list of entity types to detect
            
        Returns:
            Tuple[bool, int]: (has_pii, entity_count)
        """
        try:
            logger.info("🔊 jaidev: PII ANALYZE START", text_length=len(text))
            
            if not text or not text.strip():
                logger.info("🔍 jaidev: Empty text for entity analysis, returning early")
                return False, 0
            
            # Use default entities if none provided
            target_entities = entities or self.default_entities
            logger.info("🔊 jaidev: PII ANALYZE ENTITIES", entities=target_entities)
            
            logger.debug(f"Running PII entity analysis on text length {len(text)} with entities: {target_entities}")
            
            # Run Presidio analyzer
            logger.info("🔊 jaidev: PII ANALYZE ANALYZER RUN")
            analyzer_results = self.analyzer.analyze(
                text=text,
                language="en",
                entities=target_entities,
                score_threshold=self.default_score_threshold
            )
            
            logger.info("🔊 jaidev: PII ANALYZE ANALYZER DONE", 
                       results_count=len(analyzer_results) if analyzer_results else 0)
            
            # Count entities
            entity_count = len(analyzer_results) if analyzer_results else 0
            has_pii = entity_count > 0
            
            logger.info("🔊 jaidev: PII ANALYZE END", 
                       has_pii=has_pii,
                       entity_count=entity_count)
            
            return has_pii, entity_count
            
        except Exception as e:
            logger.error("🔍 jaidev: Entity analysis failed", 
                        error=str(e),
                        error_type=type(e).__name__,
                        text_length=len(text) if text else 0)
            return False, 0
