"""
RAG (Retrieval Augmented Generation) Controller
Handles knowledge base queries and embedding operations
"""
import uuid
from typing import Optional, List, Dict, Any
import structlog
import time

from fastapi import HTTPException, status

from app.schemas.rag_schemas import (
    RAGQueryRequest, RAGQueryResponse, EmbeddingRequest, EmbeddingResponse,
    SimilaritySearchRequest, SimilaritySearchResponse, BatchEmbeddingRequest,
    BatchEmbeddingResponse
)
from app.services.rag_service import RAGService

logger = structlog.get_logger(__name__)


class RAGController:
    """Controller for RAG operations."""
    
    def __init__(self):
        """Initialize RAG controller."""
        self.rag_service = RAGService()
    
    async def query_knowledge_base(self, query_data: RAGQueryRequest) -> RAGQueryResponse:
        """
        Query the knowledge base using RAG.
        
        Args:
            query_data: RAG query request data
        
        Returns:
            RAGQueryResponse: Query results with sources
        
        Raises:
            HTTPException: If query fails
        """
        try:
            logger.info(
                "RAG query requested",
                query=query_data.query[:100] + "..." if len(query_data.query) > 100 else query_data.query,
                patient_id=str(query_data.patient_id) if query_data.patient_id else None
            )
            print("jaidev reached query routes",query_data)
            return await self.rag_service.query_rag(query_data)
            
        except Exception as e:
            logger.error("RAG query error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process RAG query"
            )
    
    async def embed_soap_notes(self, embedding_data: EmbeddingRequest) -> EmbeddingResponse:
        """
        Generate embeddings for a single SOAP note.
        
        Args:
            embedding_data: Embedding request data containing note_id and force_reembed flag
        
        Returns:
            EmbeddingResponse: Embedding operation results
        
        Raises:
            HTTPException: If embedding fails
        """
        try:
            logger.info("SOAP note embedding requested", note_id=str(embedding_data.note_id))
            start_time = time.time()
            
            success = await self.rag_service.embed_soap_note(
                note_id=embedding_data.note_id,
                force_reembed=embedding_data.force_reembed,
            )
            
            processing_time = time.time() - start_time
            
            return EmbeddingResponse(
                success=bool(success),
                embedded_count=1 if success else 0,
                skipped_count=0 if success else 0,
                failed_count=0 if success else 1,
                processing_time=processing_time,
                embedded_notes=[embedding_data.note_id] if success else [],
                failed_notes=([] if success else [{"note_id": str(embedding_data.note_id), "error": "Embedding failed"}]),
                message=("Embedded note successfully" if success else "Embedding failed"),
            )
            
        except Exception as e:
            logger.error("SOAP note embedding error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate embeddings"
            )
    
    async def batch_embed_soap_notes(self, batch_data: BatchEmbeddingRequest) -> BatchEmbeddingResponse:
        """
        Generate embeddings for multiple SOAP notes in batch.
        
        Args:
            batch_data: Batch embedding request data
        
        Returns:
            BatchEmbeddingResponse: Batch embedding operation results
        
        Raises:
            HTTPException: If batch embedding fails
        """
        try:
            logger.info(
                "Batch SOAP note embedding requested",
                session_ids_count=len(batch_data.session_ids) if batch_data.session_ids else 0,
                patient_ids_count=len(batch_data.patient_ids) if batch_data.patient_ids else 0
            )
            
            # Call the correct service method name
            result = await self.rag_service.batch_embed_notes(batch_data)
            
            # Convert to expected response model if necessary (fields align)
            return BatchEmbeddingResponse(**result.dict()) if hasattr(result, "dict") else result
            
        except Exception as e:
            logger.error("Batch SOAP note embedding error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate batch embeddings"
            )
    
    async def find_similar_notes(self, note_id: uuid.UUID, top_k: int = 5) -> SimilaritySearchResponse:
        """
        Find similar SOAP notes using vector similarity.
        
        Args:
            note_id: SOAP note UUID to find similar notes for
            top_k: Number of similar notes to return
        
        Returns:
            SimilaritySearchResponse: Similar notes with similarity scores
        
        Raises:
            HTTPException: If similarity search fails
        """
        try:
            logger.info("Similarity search requested", note_id=str(note_id), top_k=top_k)
            
            # Validate parameters
            if top_k < 1 or top_k > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="top_k must be between 1 and 50"
                )
            
            return await self.rag_service.find_similar_notes(note_id, top_k)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Similarity search error", error=str(e), note_id=str(note_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to find similar notes"
            )
    
    async def search_by_similarity(self, search_data: SimilaritySearchRequest) -> SimilaritySearchResponse:
        """
        Search SOAP notes by text similarity.
        
        Args:
            search_data: Similarity search request data
        
        Returns:
            SimilaritySearchResponse: Search results with similarity scores
        
        Raises:
            HTTPException: If search fails
        """
        try:
            logger.info(
                "Text similarity search requested",
                query=search_data.query[:100] + "..." if len(search_data.query) > 100 else search_data.query,
                top_k=search_data.top_k
            )
            
            # Validate parameters
            if search_data.top_k < 1 or search_data.top_k > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="top_k must be between 1 and 50"
                )
            
            if search_data.similarity_threshold < 0.0 or search_data.similarity_threshold > 1.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="similarity_threshold must be between 0.0 and 1.0"
                )
            
            return await self.rag_service.search_by_similarity(search_data)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Text similarity search error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to perform similarity search"
            )
    
    async def get_embedding_stats(self, patient_id: Optional[uuid.UUID] = None) -> dict:
        """
        Get embedding statistics.
        
        Args:
            patient_id: Optional patient ID to filter stats
        
        Returns:
            dict: Embedding statistics
        
        Raises:
            HTTPException: If stats retrieval fails
        """
        try:
            logger.info("Embedding stats requested", patient_id=str(patient_id) if patient_id else None)
            
            return await self.rag_service.get_embedding_stats(patient_id)
            
        except Exception as e:
            logger.error("Get embedding stats error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve embedding statistics"
            )
    
    async def get_notes_needing_embedding(
        self,
        note_ids: Optional[List[uuid.UUID]] = None,
        session_id: Optional[uuid.UUID] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get SOAP notes that need embedding.
        
        Args:
            note_ids: Optional list of specific note IDs to check
            session_id: Optional session ID to check
            patient_id: Optional patient ID to check
        
        Returns:
            List[Dict]: Notes needing embedding with metadata
        
        Raises:
            HTTPException: If retrieval fails
        """
        try:
            logger.info(
                "Get notes needing embedding requested",
                note_ids_count=len(note_ids) if note_ids else 0,
                session_id=str(session_id) if session_id else None,
                patient_id=str(patient_id) if patient_id else None
            )
            
            return await self.rag_service.get_notes_needing_embedding(note_ids, session_id, patient_id)
            
        except Exception as e:
            logger.error("Get notes needing embedding error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve notes needing embedding"
            )
    
    async def embed_approved_notes(
        self,
        note_ids: Optional[List[uuid.UUID]] = None,
        session_id: Optional[uuid.UUID] = None,
        patient_id: Optional[uuid.UUID] = None,
        force_reembed: bool = False
    ):
        """
        Embed approved SOAP notes that don't have embeddings yet.
        
        Args:
            note_ids: Optional list of specific note IDs to embed
            session_id: Optional session ID to embed all notes from session
            patient_id: Optional patient ID to embed all notes from patient
            force_reembed: Force re-embedding even if exists
        
        Returns:
            RAGEmbeddingResponse: Embedding operation results
        
        Raises:
            HTTPException: If embedding fails
        """
        try:
            logger.info(
                "Embed approved notes requested",
                note_ids_count=len(note_ids) if note_ids else 0,
                session_id=str(session_id) if session_id else None,
                patient_id=str(patient_id) if patient_id else None,
                force_reembed=force_reembed
            )
            
            return await self.rag_service.embed_approved_notes(note_ids, session_id, patient_id, force_reembed)
            
        except Exception as e:
            logger.error("Embed approved notes error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to embed approved notes"
            )
