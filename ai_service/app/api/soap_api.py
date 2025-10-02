"""
SOAP Note Generation API Endpoints
"""
import uuid
from typing import Optional
import structlog

from fastapi import APIRouter, HTTPException, status

from ai_service.app.schemas.soap_schemas import SOAPGenerationRequest, SOAPGenerationResponse
from ai_service.app.services.soap_service import SOAPGenerationService
from ai_service.app.services.ner_service import NERService
from ai_service.app.services.pii_service import PIIService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()

# Initialize services
soap_service = SOAPGenerationService()
ner_service = NERService()
pii_service = PIIService()


@router.post("/generate", response_model=SOAPGenerationResponse, summary="Generate SOAP Note")
async def generate_soap_note(request: SOAPGenerationRequest):
    """
    Generate SOAP note from clinical text using AI pipeline.
    
    This endpoint runs the complete AI pipeline:
    1. Optional PII masking for patient privacy
    2. NER extraction for medical entities
    3. SOAP note generation using HuggingFace biomedical model
    4. Judge LLM validation with OpenAI
    
    Args:
        request: SOAP generation request with clinical text and parameters
        
    Returns:
        SOAPGenerationResponse: Generated and validated SOAP note
        
    Note:
        This is the AI service version - database operations are handled by main backend
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
            from ai_service.app.schemas.pii_schemas import PIIAnonymizationRequest
            
            pii_request = PIIAnonymizationRequest(
                text=request.text,
                preserve_medical_context=request.preserve_medical_context,
                score_threshold=0.5
            )
            
            pii_response = await pii_service.anonymize_text(pii_request)
            
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
            context_data = await ner_service.extract_context_data(processed_text)
            logger.info("✅ NER context extracted", entity_count=context_data.get("total_entities", 0))
        
        # Step 3: Generate SOAP note
        logger.info("🤖 Generating SOAP note")
        soap_response = await soap_service.generate_soap_note(
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


@router.get("/health", summary="SOAP Service Health Check")
async def soap_health_check():
    """Health check for SOAP generation service."""
    try:
        # Check if services are initialized
        soap_ready = soap_service.soap_model is not None and soap_service.judge_model is not None
        ner_ready = ner_service.ner_pipe is not None
        pii_ready = pii_service.analyzer is not None
        
        return {
            "status": "healthy" if all([soap_ready, ner_ready, pii_ready]) else "degraded",
            "services": {
                "soap_generation": soap_ready,
                "ner_extraction": ner_ready,
                "pii_detection": pii_ready
            },
            "models": {
                "soap_model": "HuggingFace + OpenAI Judge",
                "ner_model": "d4data/biomedical-ner-all",
                "pii_model": "Microsoft Presidio"
            }
        }
    except Exception as e:
        logger.error("SOAP health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }
