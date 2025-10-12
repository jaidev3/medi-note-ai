"""
AI SOAP Generation API Routes
Direct AI-powered SOAP note generation without external service
"""
import uuid
from typing import Optional
import structlog

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.soap_schemas import SOAPGenerationRequest, SOAPGenerationResponse
from app.services.ai.soap_service import SOAPGenerationService
from app.services.ai.ner_service import NERService
from app.services.ai.pii_service import PIIService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()

# Initialize services (singleton pattern)
soap_service = None
ner_service = None
pii_service = None


def get_soap_service() -> SOAPGenerationService:
    """Get or create SOAP service instance."""
    global soap_service
    if soap_service is None:
        soap_service = SOAPGenerationService()
    return soap_service


def get_ner_service() -> NERService:
    """Get or create NER service instance."""
    global ner_service
    if ner_service is None:
        ner_service = NERService()
    return ner_service


def get_pii_service() -> PIIService:
    """Get or create PII service instance."""
    global pii_service
    if pii_service is None:
        pii_service = PIIService()
    return pii_service


@router.post("/generate", response_model=SOAPGenerationResponse, summary="Generate SOAP Note")
async def generate_soap_note(
    request: SOAPGenerationRequest,
    soap_svc: SOAPGenerationService = Depends(get_soap_service),
    ner_svc: NERService = Depends(get_ner_service),
    pii_svc: PIIService = Depends(get_pii_service)
):
    """
    Generate SOAP note from clinical text using AI pipeline.
    
    This endpoint runs the complete AI pipeline:
    1. Optional PII masking for patient privacy
    2. NER extraction for medical entities
    3. SOAP note generation using Google Gemini
    4. Judge LLM validation
    
    Args:
        request: SOAP generation request with clinical text and parameters
        
    Returns:
        SOAPGenerationResponse: Generated and validated SOAP note
    """
    try:
        logger.info("SOAP generation requested", 
                   session_id=str(request.session_id),
                   text_length=len(request.text))
        
        # Step 1: Apply PII masking if enabled
        processed_text = request.text
        pii_masked = False
        pii_entities_found = 0
        
        if request.enable_pii_masking:
            logger.info("🔒 Applying PII masking")
            from app.schemas.pii_schemas import PIIAnonymizationRequest
            
            pii_request = PIIAnonymizationRequest(
                text=request.text,
                preserve_medical_context=request.preserve_medical_context,
                score_threshold=0.5
            )
            
            pii_response = await pii_svc.anonymize_text(pii_request)
            
            if pii_response.success:
                processed_text = pii_response.anonymized_text
                pii_masked = pii_response.has_pii
                pii_entities_found = pii_response.entities_count
                
                if pii_masked:
                    logger.info("✅ PII masking completed", entities_masked=pii_entities_found)
            else:
                logger.warning("PII masking failed, using original text", error=pii_response.message)
        
        # Step 2: Extract NER context data if requested
        context_data = None
        if request.include_context:
            logger.info("🔍 Extracting NER context")
            context_data = await ner_svc.extract_context_data(processed_text)
            logger.info("✅ NER context extracted", entity_count=context_data.get("total_entities", 0))
        
        # Step 3: Generate SOAP note
        logger.info("🤖 Generating SOAP note")
        soap_response = await soap_svc.generate_soap_note(
            request=request,
            context_data=context_data,
            pii_masked_text=processed_text if pii_masked else None
        )
        
        # Update PII metadata in response
        soap_response.pii_masked = pii_masked
        soap_response.pii_entities_found = pii_entities_found
        
        logger.info("✅ SOAP generation completed", 
                   success=soap_response.success,
                   ai_approved=soap_response.ai_approved)
        
        return soap_response
        
    except Exception as e:
        logger.error("❌ SOAP generation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SOAP generation failed: {str(e)}"
        )


@router.get("/health", summary="AI SOAP Service Health Check")
async def ai_soap_health_check(
    soap_svc: SOAPGenerationService = Depends(get_soap_service),
    ner_svc: NERService = Depends(get_ner_service),
    pii_svc: PIIService = Depends(get_pii_service)
):
    """Health check for AI SOAP generation service."""
    try:
        # Check if services are initialized
        soap_ready = soap_svc.soap_model is not None and soap_svc.judge_model is not None
        ner_ready = ner_svc.model is not None
        pii_ready = pii_svc.model is not None
        
        return {
            "status": "healthy" if all([soap_ready, ner_ready, pii_ready]) else "degraded",
            "services": {
                "soap_generation": soap_ready,
                "ner_extraction": ner_ready,
                "pii_detection": pii_ready
            },
            "models": {
                "soap_model": "Google Gemini + Judge",
                "ner_model": "Google Gemini",
                "pii_model": "Google Gemini"
            }
        }
    except Exception as e:
        logger.error("AI SOAP health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }
