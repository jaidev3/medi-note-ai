"""
RAG (Retrieval Augmented Generation) Routes
HTTP endpoints for knowledge base queries and embedding operations
"""
import uuid
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, Query, Path

from app.schemas.auth_schemas import UserRead
from app.schemas.rag_schemas import (
    RAGQueryRequest, RAGQueryResponse, EmbeddingRequest, EmbeddingResponse,
    SimilaritySearchRequest, SimilaritySearchResponse, BatchEmbeddingRequest,
    BatchEmbeddingResponse, RAGEmbeddingResponse, NotesNeedingEmbeddingRequest,
    EmbedApprovedNotesRequest
)
from app.controllers.rag_controller import RAGController
from app.routes.auth_routes import get_current_user_dependency

# Create router
router = APIRouter()

# Initialize controller
rag_controller = RAGController()


@router.post("/query", response_model=RAGQueryResponse, summary="Query Knowledge Base")
async def query_knowledge_base(
    query_data: RAGQueryRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Query the knowledge base using RAG (Retrieval Augmented Generation).
    
    Args:
        query_data: RAG query request with question and optional filters
        current_user: Current authenticated user
        
    Returns:
        RAGQueryResponse: Answer with retrieved sources and confidence score
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This endpoint performs the complete RAG pipeline:
        1. Query preprocessing and embedding
        2. Vector similarity search with metadata filtering
        3. Reranking of results
        4. Answer generation with source attribution
    """
    return await rag_controller.query_knowledge_base(query_data)


@router.post("/embed", response_model=EmbeddingResponse, summary="Embed SOAP Notes")
async def embed_soap_notes(
    embedding_data: EmbeddingRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Generate embeddings for SOAP notes to enable vector search.
    
    Args:
        embedding_data: Embedding request with note IDs to process
        current_user: Current authenticated user
        
    Returns:
        EmbeddingResponse: Embedding operation results and statistics
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This endpoint generates vector embeddings for SOAP notes and stores them
        in the database for future similarity search and RAG queries.
    """
    return await rag_controller.embed_soap_notes(embedding_data)


@router.post("/batch-embed", response_model=BatchEmbeddingResponse, summary="Batch Embed SOAP Notes")
async def batch_embed_soap_notes(
    batch_data: BatchEmbeddingRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Generate embeddings for multiple SOAP notes in batch operation.
    
    Args:
        batch_data: Batch embedding request with session/patient filters
        current_user: Current authenticated user
        
    Returns:
        BatchEmbeddingResponse: Batch embedding operation results
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This is a more efficient way to embed multiple SOAP notes at once,
        typically used for initial setup or bulk processing.
    """
    return await rag_controller.batch_embed_soap_notes(batch_data)


@router.get("/similar/{note_id}", response_model=SimilaritySearchResponse, summary="Find Similar Notes")
async def find_similar_notes(
    note_id: uuid.UUID = Path(..., description="SOAP note ID"),
    top_k: int = Query(5, ge=1, le=50, description="Number of similar notes to return"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Find SOAP notes similar to a given note using vector similarity.
    
    Args:
        note_id: SOAP note UUID to find similar notes for
        top_k: Number of similar notes to return (1-50)
        current_user: Current authenticated user
        
    Returns:
        SimilaritySearchResponse: Similar notes with similarity scores
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        Uses cosine similarity on note embeddings to find the most similar
        SOAP notes, useful for case comparison and pattern identification.
    """
    return await rag_controller.find_similar_notes(note_id, top_k)


@router.post("/search-similarity", response_model=SimilaritySearchResponse, summary="Search by Text Similarity")
async def search_by_similarity(
    search_data: SimilaritySearchRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Search SOAP notes by text similarity using vector embeddings.
    
    Args:
        search_data: Similarity search request with query text and parameters
        current_user: Current authenticated user
        
    Returns:
        SimilaritySearchResponse: Search results with similarity scores
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        Embeds the query text and searches for similar SOAP notes
        based on semantic similarity rather than exact text matching.
    """
    return await rag_controller.search_by_similarity(search_data)


@router.get("/stats", summary="Get Embedding Statistics")
async def get_embedding_stats(
    patient_id: Optional[uuid.UUID] = Query(None, description="Patient ID to filter stats"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get embedding and knowledge base statistics.
    
    Args:
        patient_id: Optional patient ID to filter statistics
        current_user: Current authenticated user
        
    Returns:
        dict: Embedding statistics and knowledge base metrics
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        Provides insights into the knowledge base size, embedding coverage,
        and search performance metrics.
    """
    return await rag_controller.get_embedding_stats(patient_id)


@router.get("/notes-needing-embedding", summary="Get Notes Needing Embedding")
async def get_notes_needing_embedding(
    request: NotesNeedingEmbeddingRequest = Depends(),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get SOAP notes that need embedding (approved but not yet embedded).
    
    Args:
        request: Request with optional filters for note IDs, session ID, or patient ID
        current_user: Current authenticated user
        
    Returns:
        List[Dict]: Notes needing embedding with metadata
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This endpoint helps identify which approved SOAP notes still need
        to be embedded for RAG functionality.
    """
    return await rag_controller.get_notes_needing_embedding(
        note_ids=request.note_ids,
        session_id=request.session_id,
        patient_id=request.patient_id
    )


@router.post("/embed-approved-notes", response_model=RAGEmbeddingResponse, summary="Embed Approved Notes")
async def embed_approved_notes(
    request: EmbedApprovedNotesRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Embed approved SOAP notes that don't have embeddings yet.
    
    Args:
        request: Request with optional filters and embedding options
        current_user: Current authenticated user
        
    Returns:
        RAGEmbeddingResponse: Embedding operation results
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This endpoint is useful for:
        - Backfilling embeddings for existing approved notes
        - Ensuring all approved notes are available for RAG queries
        - Batch processing after system updates
    """
    return await rag_controller.embed_approved_notes(
        note_ids=request.note_ids,
        session_id=request.session_id,
        patient_id=request.patient_id,
        force_reembed=request.force_reembed
    )
