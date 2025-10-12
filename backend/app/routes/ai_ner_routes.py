"""
AI NER (Named Entity Recognition) API Routes
Direct AI-powered entity extraction without external service
"""
import structlog

from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.ner_schemas import NERRequest, NERResponse
from app.services.ai.ner_service import NERService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()

# Initialize service (singleton pattern)
ner_service = None


def get_ner_service() -> NERService:
    """Get or create NER service instance."""
    global ner_service
    if ner_service is None:
        ner_service = NERService()
    return ner_service


@router.post("/extract", response_model=NERResponse, summary="Extract Biomedical Entities")
async def extract_entities(
    request: NERRequest,
    ner_svc: NERService = Depends(get_ner_service)
):
    """
    Extract biomedical entities from clinical text.
    
    Uses Google Gemini to identify medical entities including diseases, 
    symptoms, medications, procedures, and more.
    
    Args:
        request: NER request with clinical text and processing parameters
        
    Returns:
        NERResponse: Extracted entities with confidence scores and positions
    """
    try:
        logger.info("NER extraction requested", text_length=len(request.text))
        
        # Extract entities
        ner_output = await ner_svc.extract_entities(request)
        
        # Create response
        response = NERResponse(
            success=True,
            data=ner_output,
            message=f"Extracted {ner_output.total_entities} entities successfully"
        )
        
        logger.info("✅ NER extraction completed", 
                   entities_found=ner_output.total_entities,
                   processing_time=ner_output.processing_time)
        
        return response
        
    except Exception as e:
        logger.error("❌ NER extraction failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NER extraction failed: {str(e)}"
        )


@router.post("/context", summary="Extract Context Data for SOAP Generation")
async def extract_context_data(
    request: NERRequest,
    ner_svc: NERService = Depends(get_ner_service)
):
    """
    Extract biomedical entities as context data for SOAP note generation.
    
    This endpoint is optimized for providing NER context to the SOAP generation pipeline.
    
    Args:
        request: NER request with clinical text
        
    Returns:
        Dict: Context data formatted for SOAP generation
    """
    try:
        logger.info("NER context extraction requested", text_length=len(request.text))
        
        # Extract context data
        context_data = await ner_svc.extract_context_data(request.text)
        
        logger.info("✅ NER context extraction completed", 
                   entities_found=context_data.get("total_entities", 0))
        
        return {
            "success": True,
            "context_data": context_data,
            "message": f"Extracted context with {context_data.get('total_entities', 0)} entities"
        }
        
    except Exception as e:
        logger.error("❌ NER context extraction failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NER context extraction failed: {str(e)}"
        )


@router.get("/health", summary="AI NER Service Health Check")
async def ai_ner_health_check(ner_svc: NERService = Depends(get_ner_service)):
    """Health check for AI NER service."""
    try:
        # Check if Gemini NER model is initialized
        model_ready = ner_svc.model is not None
        
        return {
            "status": "healthy" if model_ready else "unhealthy",
            "model_loaded": model_ready,
            "model_name": "Google Gemini",
            "framework": "Google Gemini",
            "supported_entities": [
                "diseases", "symptoms", "medications", "procedures",
                "anatomy", "dosages", "frequencies", "medical_devices"
            ]
        }
    except Exception as e:
        logger.error("AI NER health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }
