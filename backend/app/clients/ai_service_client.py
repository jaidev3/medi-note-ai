"""
AI Service HTTP Client
Handles communication with the AI microservice for all AI operations
"""
import os
import httpx
import structlog
from typing import Dict, Any, Optional, List
import uuid
import json
from datetime import datetime

from app.schemas.soap_schemas import SOAPGenerationRequest, SOAPGenerationResponse
from app.schemas.ner_schemas import NERRequest, NERResponse
from app.schemas.pii_schemas import PIIAnalysisRequest, PIIAnalysisResponse

logger = structlog.get_logger(__name__)


class AIServiceClient:
    """HTTP client for communicating with the AI microservice."""
    
    def __init__(self):
        """Initialize AI service client."""
        self.base_url = os.getenv("AI_SERVICE_URL", "http://ai_service:8002")
        self.timeout = int(os.getenv("AI_SERVICE_TIMEOUT", "300"))  # 5 minutes for AI operations
        
        # HTTP client configuration
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Echo-Notes-Backend/1.0.0"
            }
        )
        
        logger.info("AI Service client initialized", base_url=self.base_url, timeout=self.timeout)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check AI service health.
        
        Returns:
            Dict: Health status information
        """
        try:
            response = await self.client.get("/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error("AI service health check failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}
    
    async def generate_soap_note(self, request: SOAPGenerationRequest) -> SOAPGenerationResponse:
        """
        Generate SOAP note using AI service.
        
        Args:
            request: SOAP generation request
            
        Returns:
            SOAPGenerationResponse: Generated SOAP note with validation
            
        Raises:
            HTTPException: If AI service request fails
        """
        try:
            logger.info("Requesting SOAP generation from AI service", 
                       session_id=str(request.session_id),
                       text_length=len(request.text))
            
            # Convert request to dict for JSON serialization
            request_data = request.dict()
            
            # Make request to AI service
            response = await self.client.post("/soap/generate", json=request_data)
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            soap_response = SOAPGenerationResponse(**response_data)
            
            logger.info("SOAP generation completed", 
                       success=soap_response.success,
                       ai_approved=soap_response.ai_approved,
                       processing_time=soap_response.processing_time)
            
            return soap_response
            
        except httpx.HTTPStatusError as e:
            logger.error("AI service SOAP generation failed", 
                        status_code=e.response.status_code,
                        error=e.response.text)
            raise Exception(f"AI service error ({e.response.status_code}): {e.response.text}")
        except Exception as e:
            logger.error("SOAP generation request failed", error=str(e))
            raise Exception(f"AI service communication failed: {str(e)}")
    
    async def extract_ner_entities(self, text: str, filter_types: Optional[List[str]] = None) -> NERResponse:
        """
        Extract NER entities using AI service.
        
        Args:
            text: Clinical text to process
            filter_types: Optional entity types to filter
            
        Returns:
            NERResponse: Extracted entities
        """
        try:
            logger.info("Requesting NER extraction from AI service", text_length=len(text))
            
            request_data = {
                "text": text,
                "extract_confidence": True,
                "filter_types": filter_types or []
            }
            
            response = await self.client.post("/ner/extract", json=request_data)
            response.raise_for_status()
            
            response_data = response.json()
            ner_response = NERResponse(**response_data)
            
            logger.info("NER extraction completed", 
                       entities_found=ner_response.data.total_entities,
                       processing_time=ner_response.data.processing_time)
            
            return ner_response
            
        except httpx.HTTPStatusError as e:
            logger.error("AI service NER extraction failed", 
                        status_code=e.response.status_code,
                        error=e.response.text)
            raise Exception(f"AI service error ({e.response.status_code}): {e.response.text}")
        except Exception as e:
            logger.error("NER extraction request failed", error=str(e))
            raise Exception(f"AI service communication failed: {str(e)}")
    
    async def extract_ner_context(self, text: str) -> Dict[str, Any]:
        """
        Extract NER context data for SOAP generation.
        
        Args:
            text: Clinical text to process
            
        Returns:
            Dict: Context data for SOAP generation
        """
        try:
            logger.info("Requesting NER context from AI service", text_length=len(text))
            
            request_data = {"text": text}
            
            response = await self.client.post("/ner/context", json=request_data)
            response.raise_for_status()
            
            response_data = response.json()
            
            if response_data.get("success"):
                context_data = response_data.get("context_data", {})
                logger.info("NER context extraction completed", 
                           entities_found=context_data.get("total_entities", 0))
                return context_data
            else:
                logger.warning("NER context extraction returned failure", 
                              message=response_data.get("message"))
                return {}
            
        except Exception as e:
            logger.error("NER context extraction failed", error=str(e))
            return {}
    
    async def analyze_pii(self, text: str, entities: Optional[List[str]] = None) -> PIIAnalysisResponse:
        """
        Analyze text for PII using AI service.
        
        Args:
            text: Text to analyze
            entities: Optional specific entity types to detect
            
        Returns:
            PIIAnalysisResponse: PII analysis results
        """
        try:
            logger.info("Requesting PII analysis from AI service", text_length=len(text))
            
            request_data = {
                "text": text,
                "language": "en",
                "entities": entities,
                "score_threshold": 0.5
            }
            
            response = await self.client.post("/pii/analyze", json=request_data)
            response.raise_for_status()
            
            response_data = response.json()
            pii_response = PIIAnalysisResponse(**response_data)
            
            logger.info("PII analysis completed", 
                       entities_found=pii_response.total_entities,
                       has_pii=pii_response.has_pii)
            
            return pii_response
            
        except Exception as e:
            logger.error("PII analysis request failed", error=str(e))
            # Return safe fallback
            return PIIAnalysisResponse(
                success=False,
                original_text=text,
                entities=[],
                total_entities=0,
                has_pii=False,
                message=f"PII analysis failed: {str(e)}"
            )
    
    async def anonymize_pii(self, text: str, preserve_medical_context: bool = True) -> Dict[str, Any]:
        """
        Anonymize PII in text using AI service.
        
        Args:
            text: Text to anonymize
            preserve_medical_context: Whether to preserve medical terminology
            
        Returns:
            Dict: Anonymization results
        """
        try:
            logger.info("Requesting PII anonymization from AI service", 
                       text_length=len(text),
                       preserve_medical=preserve_medical_context)
            
            request_data = {
                "text": text,
                "preserve_medical_context": preserve_medical_context,
                "score_threshold": 0.5
            }
            
            response = await self.client.post("/pii/anonymize", json=request_data)
            response.raise_for_status()
            
            response_data = response.json()
            
            logger.info("PII anonymization completed", 
                       entities_anonymized=response_data.get("entities_count", 0),
                       has_pii=response_data.get("has_pii", False))
            
            return response_data
            
        except Exception as e:
            logger.error("PII anonymization request failed", error=str(e))
            # Return original text on failure
            return {
                "success": False,
                "original_text": text,
                "anonymized_text": text,
                "entities_found": [],
                "entities_count": 0,
                "has_pii": False,
                "message": f"PII anonymization failed: {str(e)}"
            }
    
    async def quick_anonymize_pii(self, text: str, preserve_medical: bool = True) -> tuple[str, bool]:
        """
        Quick PII anonymization for backward compatibility.
        
        Args:
            text: Text to anonymize
            preserve_medical: Whether to preserve medical terminology
            
        Returns:
            Tuple of (anonymized_text, has_pii)
        """
        try:
            response = await self.client.post("/pii/quick-anonymize", 
                                            params={
                                                "text": text,
                                                "preserve_medical": preserve_medical
                                            })
            response.raise_for_status()
            
            data = response.json()
            return data.get("anonymized_text", text), data.get("has_pii", False)
            
        except Exception as e:
            logger.error("Quick PII anonymization failed", error=str(e))
            return text, False
    
    async def generate_embedding(self, text: str, normalize: bool = True) -> Optional[List[float]]:
        """
        Generate embedding for text using AI service.
        
        Args:
            text: Text to embed
            normalize: Whether to normalize the embedding vector
            
        Returns:
            Optional[List[float]]: Generated embedding vector or None if failed
        """
        try:
            logger.info("Requesting embedding generation from AI service", text_length=len(text))
            
            request_data = {
                "text": text,
                "normalize": normalize
            }
            
            response = await self.client.post("/embeddings/generate", json=request_data)
            response.raise_for_status()
            
            response_data = response.json()
            
            if response_data.get("success"):
                embedding = response_data.get("embedding")
                logger.info("Embedding generation completed", 
                           dimension=response_data.get("dimension", 0))
                return embedding
            else:
                logger.warning("Embedding generation failed", 
                              message=response_data.get("message"))
                return None
            
        except Exception as e:
            logger.error("Embedding generation request failed", error=str(e))
            return None
    
    async def generate_soap_content_embedding(self, content: Dict[str, Any]) -> Optional[List[float]]:
        """
        Generate embedding for SOAP content using AI service.
        
        Args:
            content: SOAP note content dictionary
            
        Returns:
            Optional[List[float]]: Generated embedding vector or None if failed
        """
        try:
            logger.info("Requesting SOAP content embedding from AI service")
            
            response = await self.client.post("/embeddings/soap-content", json=content)
            response.raise_for_status()
            
            response_data = response.json()
            
            if response_data.get("success"):
                embedding = response_data.get("embedding")
                logger.info("SOAP content embedding completed", 
                           dimension=response_data.get("dimension", 0))
                return embedding
            else:
                logger.warning("SOAP content embedding failed", 
                              message=response_data.get("message"))
                return None
            
        except Exception as e:
            logger.error("SOAP content embedding request failed", error=str(e))
            return None


# Global AI service client instance
ai_service_client = AIServiceClient()
