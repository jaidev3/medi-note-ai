"""
PII Detection and Anonymization API Endpoints
"""
import structlog

from fastapi import APIRouter, HTTPException, status

from schemas.pii_schemas import (
    PIIAnalysisRequest, PIIAnalysisResponse,
    PIIAnonymizationRequest, PIIAnonymizationResponse
)
from services.pii_service import PIIService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()

# Initialize service
pii_service = PIIService()


@router.post("/analyze", response_model=PIIAnalysisResponse, summary="Analyze Text for PII")
async def analyze_text_for_pii(request: PIIAnalysisRequest):
    """
    Analyze clinical text for personally identifiable information (PII).
    
    Detects various types of PII including:
    - Patient names
    - Phone numbers and email addresses
    - Social security numbers
    - Medical license numbers
    - Credit card numbers
    - IP addresses
    
    Args:
        request: PII analysis request with text and detection parameters
        
    Returns:
        PIIAnalysisResponse: Detected PII entities with positions and confidence scores
    """
    try:
        logger.info("PII analysis requested", text_length=len(request.text))
        
        # Analyze for PII
        response = await pii_service.analyze_text(request)
        
        logger.info("✅ PII analysis completed", 
                   entities_found=response.total_entities,
                   has_pii=response.has_pii)
        
        return response
        
    except Exception as e:
        logger.error("❌ PII analysis failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII analysis failed: {str(e)}"
        )


@router.post("/anonymize", response_model=PIIAnonymizationResponse, summary="Anonymize PII in Text")
async def anonymize_pii_in_text(request: PIIAnonymizationRequest):
    """
    Anonymize personally identifiable information in clinical text.
    
    Replaces detected PII with anonymized placeholders while optionally
    preserving medical context and terminology.
    
    Args:
        request: PII anonymization request with text and anonymization parameters
        
    Returns:
        PIIAnonymizationResponse: Anonymized text with PII replacement details
    """
    try:
        logger.info("PII anonymization requested", 
                   text_length=len(request.text),
                   preserve_medical=request.preserve_medical_context)
        
        # Anonymize PII
        response = await pii_service.anonymize_text(request)
        
        logger.info("✅ PII anonymization completed", 
                   entities_anonymized=response.entities_count,
                   has_pii=response.has_pii)
        
        return response
        
    except Exception as e:
        logger.error("❌ PII anonymization failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII anonymization failed: {str(e)}"
        )


@router.post("/quick-anonymize", summary="Quick PII Anonymization")
async def quick_anonymize_text(text: str, preserve_medical: bool = True):
    """
    Quick anonymization endpoint for internal use.
    
    Simplified interface for PII anonymization with default settings.
    
    Args:
        text: Text to anonymize
        preserve_medical: Whether to preserve medical terminology
        
    Returns:
        Dict with anonymized text and metadata
    """
    try:
        logger.info("Quick PII anonymization requested", text_length=len(text))
        
        # Use quick anonymization method
        anonymized_text, has_pii = await pii_service.quick_anonymize(text)
        
        logger.info("✅ Quick PII anonymization completed", has_pii=has_pii)
        
        return {
            "success": True,
            "original_text": text,
            "anonymized_text": anonymized_text,
            "has_pii": has_pii,
            "message": "Quick anonymization completed"
        }
        
    except Exception as e:
        logger.error("❌ Quick PII anonymization failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quick PII anonymization failed: {str(e)}"
        )


@router.get("/health", summary="PII Service Health Check")
async def pii_health_check():
    """Health check for PII service."""
    try:
        # Check if Gemini model is initialized
        model_ready = pii_service.model is not None

        return {
            "status": "healthy" if model_ready else "unhealthy",
            "components": {
                "gemini_model": model_ready
            },
            "framework": "Google Gemini",
            "supported_entities": [
                "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD",
                "IBAN_CODE", "IP_ADDRESS", "LOCATION", "NRP", "MEDICAL_LICENSE",
                "US_SSN", "US_PASSPORT", "US_DRIVER_LICENSE", "CRYPTO", "US_BANK_NUMBER"
            ]
        }
    except Exception as e:
        logger.error("PII health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }
