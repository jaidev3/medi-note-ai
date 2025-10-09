"""
Embeddings Generation API Endpoints
"""
import structlog

from fastapi import APIRouter, HTTPException, status

from schemas.rag_schemas import (
    EmbeddingRequest, EmbeddingResponse,
    BatchEmbeddingRequest, BatchEmbeddingResponse,
    SOAPEmbeddingRequest, SOAPEmbeddingResponse
)
from services.rag_service import RAGService

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter()

# Initialize service
rag_service = RAGService()


@router.post("/generate", response_model=EmbeddingResponse, summary="Generate Text Embedding")
async def generate_text_embedding(request: EmbeddingRequest):
    """
    Generate embedding vector for a single text.
    
    Uses OpenAI's text-embedding model to create high-dimensional vector
    representations suitable for semantic search and similarity comparisons.
    
    Args:
        request: Embedding request with text and normalization options
        
    Returns:
        EmbeddingResponse: Generated embedding vector with metadata
    """
    try:
        logger.info("Text embedding requested", text_length=len(request.text))
        
        # Generate embedding
        response = await rag_service.generate_embedding(request)
        
        logger.info("✅ Text embedding completed", 
                   success=response.success,
                   dimension=response.dimension)
        
        return response
        
    except Exception as e:
        logger.error("❌ Text embedding failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text embedding failed: {str(e)}"
        )


@router.post("/batch", response_model=BatchEmbeddingResponse, summary="Generate Batch Embeddings")
async def generate_batch_embeddings(request: BatchEmbeddingRequest):
    """
    Generate embedding vectors for multiple texts in batch.
    
    Efficiently processes multiple texts using batch operations for
    improved throughput and reduced API costs.
    
    Args:
        request: Batch embedding request with list of texts
        
    Returns:
        BatchEmbeddingResponse: Generated embedding vectors with processing statistics
    """
    try:
        logger.info("Batch embedding requested", text_count=len(request.texts))
        
        # Generate batch embeddings
        response = await rag_service.generate_batch_embeddings(request)
        
        logger.info("✅ Batch embedding completed", 
                   processed=response.processed_count,
                   failed=response.failed_count)
        
        return response
        
    except Exception as e:
        logger.error("❌ Batch embedding failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch embedding failed: {str(e)}"
        )


@router.post("/soap-content", summary="Generate SOAP Content Embedding")
async def generate_soap_content_embedding(content: dict):
    """
    Generate embedding for SOAP note content.
    
    Specialized endpoint for generating embeddings from SOAP note content
    with proper text formatting and preprocessing.
    
    Args:
        content: SOAP note content dictionary
        
    Returns:
        Dict with embedding vector and metadata
    """
    try:
        logger.info("SOAP content embedding requested")
        
        # Generate embedding for SOAP content
        embedding = await rag_service.embed_soap_note_content(content)
        
        if embedding:
            logger.info("✅ SOAP content embedding completed", dimension=len(embedding))
            return {
                "success": True,
                "embedding": embedding,
                "dimension": len(embedding),
                "message": "SOAP content embedding generated successfully"
            }
        else:
            logger.error("Failed to generate SOAP content embedding")
            return {
                "success": False,
                "embedding": None,
                "dimension": 0,
                "message": "Failed to generate SOAP content embedding"
            }
        
    except Exception as e:
        logger.error("❌ SOAP content embedding failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SOAP content embedding failed: {str(e)}"
        )


@router.get("/health", summary="Embeddings Service Health Check")
async def embeddings_health_check():
    """Health check for embeddings service."""
    try:
        # Check if embedding model is initialized
        model_ready = rag_service.embeddings is not None
        
        return {
            "status": "healthy" if model_ready else "unhealthy",
            "model_loaded": model_ready,
            "model_name": "OpenAI text-embedding-3-small",
            "provider": "OpenAI",
            "dimension": 1536,  # Default dimension for text-embedding-3-small
            "capabilities": [
                "single_text_embedding",
                "batch_embedding",
                "soap_content_embedding",
                "vector_normalization"
            ]
        }
    except Exception as e:
        logger.error("Embeddings health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }
