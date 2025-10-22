"""
Document PII Processing Service
Handles PII detection and masking for document text
"""
import structlog
from typing import Tuple, Optional
from app.services.pii_service import PIIService
from app.schemas.document_schemas import TextExtractionResult

logger = structlog.get_logger(__name__)


class DocumentPIIProcessor:
    """Service for processing PII in document text"""
    
    def __init__(self):
        """Initialize PII processor with service"""
        self.pii_service: Optional[PIIService] = None
        self._initialize_pii_service()
    
    def _initialize_pii_service(self):
        """Initialize PII service with retry logic."""
        logger.info("🔍 jaidev: Starting PII service initialization in DocumentPIIProcessor")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"🔍 jaidev: Initializing PII service in DocumentPIIProcessor (attempt {attempt + 1}/{max_retries})")
                
                # Import and create PII service
                logger.info("🔍 jaidev: Importing PIIService class")
                from app.services.pii_service import PIIService
                
                logger.info("🔍 jaidev: Creating PIIService instance")
                self.pii_service = PIIService()
                
                logger.info("🔍 jaidev: PII service created, checking health")
                
                # Test the PII service to ensure it's working
                if self.pii_service.is_healthy():
                    logger.info("🔍 jaidev: PII service initialized successfully in DocumentPIIProcessor")
                    return
                else:
                    logger.warning(f"🔍 jaidev: PII service health check failed (attempt {attempt + 1})")
                    self.pii_service = None
                    
            except ImportError as e:
                logger.error(f"🔍 jaidev: Failed to import PIIService (attempt {attempt + 1})", 
                            error=str(e),
                            error_type=type(e).__name__)
                self.pii_service = None
            except Exception as e:
                logger.error(f"🔍 jaidev: Failed to initialize PII service in DocumentPIIProcessor (attempt {attempt + 1})", 
                            error=str(e),
                            error_type=type(e).__name__,
                            error_details=str(e))
                self.pii_service = None
                
                if attempt < max_retries - 1:
                    logger.info(f"🔍 jaidev: Retrying PII service initialization in 1 second...")
                    import time
                    time.sleep(1)
        
        # If all retries failed, log a final warning
        if self.pii_service is None:
            logger.error("🔍 jaidev: All PII service initialization attempts failed. PII processing will be disabled.")
        else:
            logger.info("🔍 jaidev: PII service initialization completed successfully")
    
    def is_pii_service_available(self) -> bool:
        """Check if PII service is available"""
        if not self.pii_service:
            logger.warning("🔒 jaidev: PII service not available, attempting to reinitialize...")
            self._initialize_pii_service()
        
        return self.pii_service is not None
    
    async def process_text_for_pii(self, text: str, document_id: str = None) -> Tuple[str, bool, int]:
        """
        Process text for PII detection and masking.
        
        Args:
            text: Text to process for PII
            document_id: Optional document ID for logging
            
        Returns:
            Tuple of (masked_text, pii_detected, pii_entities_count)
        """
        if not text or len(text.strip()) == 0:
            logger.info("🔒 jaidev: No text to process for PII")
            return text, False, 0
        
        # MANDATORY PII PROCESSING - This must always happen
        logger.info("🔒 jaidev: MANDATORY PII processing", 
                   text_length=len(text),
                   document_id=document_id)
        
        # Check if PII service is available, try to reinitialize if not
        if not self.is_pii_service_available():
            logger.error("🔒 jaidev: PII service still not available after reinitialization. This is a critical failure.")
            raise Exception("PII service unavailable - text processing failed for security reasons")
        
        try:
            logger.info("🔒 jaidev: Starting MANDATORY PII detection and masking", 
                       text_length=len(text),
                       document_id=document_id)
            
            # Use PII service to detect and mask sensitive information
            logger.info("🔒 jaidev: Calling PII service quick_anonymize")
            pii_masked_text, pii_detected = await self.pii_service.quick_anonymize(text)
            
            logger.info("🔒 jaidev: PII service quick_anonymize completed", 
                       pii_detected=pii_detected,
                       original_length=len(text),
                       masked_length=len(pii_masked_text),
                       document_id=document_id)
            
            pii_entities_count = 0
            if pii_detected:
                # Count entities for reporting
                logger.info("🔒 jaidev: PII detected, counting entities", document_id=document_id)
                _, pii_entities_count = await self.pii_service.analyze_text_for_entities(text)
                logger.info("🔒 jaidev: PII entities counted", 
                           entity_count=pii_entities_count,
                           document_id=document_id)
                
                # Use masked text for further processing
                logger.info("🔒 jaidev: Using PII masked text for processing", document_id=document_id)
            else:
                logger.info("🔒 jaidev: No PII detected, using original text", document_id=document_id)
            
            return pii_masked_text, pii_detected, pii_entities_count
            
        except Exception as e:
            logger.error("🔒 jaidev: MANDATORY PII processing failed. This is a critical failure.", 
                       error=str(e),
                       error_type=type(e).__name__,
                       document_id=document_id)
            raise Exception(f"PII processing failed - {str(e)}")
    
    async def process_extraction_result_for_pii(self, extraction_result: TextExtractionResult, document_id: str = None) -> TextExtractionResult:
        """
        Process a TextExtractionResult for PII detection and masking.
        
        Args:
            extraction_result: Text extraction result to process
            document_id: Optional document ID for logging
            
        Returns:
            TextExtractionResult: Updated extraction result with PII info
        """
        if not extraction_result.text or len(extraction_result.text.strip()) == 0:
            logger.info("🔒 jaidev: No text in extraction result to process for PII")
            return extraction_result
        
        try:
            # Process text for PII
            masked_text, pii_detected, pii_entities_count = await self.process_text_for_pii(
                extraction_result.text, document_id
            )
            
            # Update extraction result with PII information
            extraction_result.text = masked_text
            extraction_result.pii_masked = pii_detected
            extraction_result.pii_entities_found = pii_entities_count
            
            logger.info("🔒 jaidev: PII processing completed for extraction result", 
                       pii_detected=pii_detected,
                       pii_entities_count=pii_entities_count,
                       document_id=document_id)
            
            return extraction_result
            
        except Exception as e:
            logger.error("🔒 jaidev: Failed to process extraction result for PII", 
                       error=str(e),
                       document_id=document_id)
            
            # Return error result - PII must work
            return TextExtractionResult(
                text="",
                confidence=0.0,
                page_count=0,
                word_count=0,
                extraction_method="failed_pii",
                ocr_used=False,
                text_quality_score=0.0,
                warnings=[f"Critical: PII processing failed - {str(e)}"],
                pii_masked=False,
                pii_entities_found=0
            )