"""
RAG (Retrieval-Augmented Generation) schemas for querying patient data
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, validator


class RAGChunk(BaseModel):
    """Individual retrieved chunk from vector search."""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    content: str = Field(..., description="Chunk content text")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")
    similarity_score: float = Field(..., description="Vector similarity score", ge=0.0, le=1.0)
    rerank_score: Optional[float] = Field(default=None, description="Cross-encoder rerank score", ge=0.0, le=1.0)
    
    # Source information
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Source patient ID")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Source session ID")
    note_id: Optional[uuid.UUID] = Field(default=None, description="Source SOAP note ID")
    visit_date: Optional[datetime] = Field(default=None, description="Source visit date")


class RAGQueryRequest(BaseModel):
    """Request schema for RAG querying."""
    query: str = Field(..., description="Natural language query", min_length=1)
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Filter by specific patient ID")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Filter by specific session ID")
    professional_id: Optional[uuid.UUID] = Field(default=None, description="Filter by professional ID")
    
    # Date range filtering
    start_date: Optional[datetime] = Field(default=None, description="Filter visits after this date")
    end_date: Optional[datetime] = Field(default=None, description="Filter visits before this date")
    
    # Retrieval parameters
    top_k:  Optional[int] = Field(default=5, description="Number of chunks to retrieve", ge=1, le=20)
    rerank_top_n: Optional[int] = Field(default=3, description="Number of chunks to rerank", ge=1, le=10)
    similarity_threshold: Optional[float] = Field(default=0.7, description="Minimum similarity threshold", ge=0.0, le=1.0)
    
    # Response parameters
    include_sources: bool = Field(default=True, description="Whether to include source attribution")
    max_response_length: int = Field(default=1000, description="Maximum response length", ge=100, le=5000)
    
    @validator('professional_id', 'patient_id', 'session_id', pre=True)
    def convert_empty_strings_to_none(cls, v):
        """Convert empty strings to None for UUID fields."""
        if v == "" or v == "null" or v == "undefined":
            return None
        return v


class RAGQueryResponse(BaseModel):
    """Response schema for RAG querying."""
    success: bool = Field(..., description="Whether query was successful")
    answer: str = Field(default="", description="Generated answer to the query")
    retrieved_chunks: List[RAGChunk] = Field(default_factory=list, description="Retrieved and ranked chunks")
    
    # Source attribution
    sources: List[str] = Field(default_factory=list, description="Source citations")
    confidence: float = Field(default=0.0, description="Answer confidence score", ge=0.0, le=1.0)
    
    # Processing metadata
    total_chunks_found: int = Field(default=0, description="Total chunks found before filtering")
    processing_time: float = Field(default=0.0, description="Total processing time in seconds")
    embedding_time: float = Field(default=0.0, description="Query embedding time")
    retrieval_time: float = Field(default=0.0, description="Vector search time")
    rerank_time: float = Field(default=0.0, description="Reranking time")
    generation_time: float = Field(default=0.0, description="Answer generation time")
    
    # Error information
    message: str = Field(default="", description="Status or error message")
    warnings: List[str] = Field(default_factory=list, description="Any warnings during processing")


class EmbeddingRequest(BaseModel):
    """Request schema for embedding SOAP notes."""
    note_id: uuid.UUID = Field(..., description="SOAP note ID to embed")
    force_reembed: bool = Field(default=False, description="Force re-embedding even if exists")


class RAGEmbeddingRequest(BaseModel):
    """Request schema for embedding SOAP notes."""
    note_id: uuid.UUID = Field(..., description="SOAP note ID to embed")
    force_reembed: bool = Field(default=False, description="Force re-embedding even if exists")


class RAGBatchEmbeddingRequest(BaseModel):
    """Request schema for batch embedding multiple SOAP notes."""
    note_ids: List[uuid.UUID] = Field(..., description="List of SOAP note IDs to embed")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Embed all notes from session")
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Embed all notes from patient")
    force_reembed: bool = Field(default=False, description="Force re-embedding even if exists")
    
    # Processing parameters
    batch_size: int = Field(default=10, description="Batch size for processing", ge=1, le=50)
    max_parallel: int = Field(default=3, description="Maximum parallel embeddings", ge=1, le=10)


class EmbeddingResponse(BaseModel):
    """Response schema for embedding operations."""
    success: bool = Field(..., description="Whether embedding was successful")
    embedded_count: int = Field(default=0, description="Number of notes successfully embedded")
    skipped_count: int = Field(default=0, description="Number of notes skipped (already embedded)")
    failed_count: int = Field(default=0, description="Number of notes that failed")
    
    # Processing details
    processing_time: float = Field(default=0.0, description="Total processing time")
    embedded_notes: List[uuid.UUID] = Field(default_factory=list, description="Successfully embedded note IDs")
    failed_notes: List[Dict[str, Any]] = Field(default_factory=list, description="Failed notes with error details")
    
    message: str = Field(default="", description="Status message")


class RAGEmbeddingResponse(BaseModel):
    """Response schema for embedding operations."""
    success: bool = Field(..., description="Whether embedding was successful")
    embedded_count: int = Field(default=0, description="Number of notes successfully embedded")
    skipped_count: int = Field(default=0, description="Number of notes skipped (already embedded)")
    failed_count: int = Field(default=0, description="Number of notes that failed")
    
    # Processing details
    processing_time: float = Field(default=0.0, description="Total processing time")
    embedded_notes: List[uuid.UUID] = Field(default_factory=list, description="Successfully embedded note IDs")
    failed_notes: List[Dict[str, Any]] = Field(default_factory=list, description="Failed notes with error details")
    
    message: str = Field(default="", description="Status message")


class SimilaritySearchRequest(BaseModel):
    """Request schema for similarity search by text."""
    query_text: str = Field(..., description="Text to search for similar notes", min_length=1)
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Limit to specific patient")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Limit to specific session")
    
    # Search parameters
    top_k: int = Field(default=5, description="Number of similar notes to find", ge=1, le=20)
    similarity_threshold: float = Field(default=0.7, description="Minimum similarity threshold", ge=0.0, le=1.0)


class RAGSimilarNotesRequest(BaseModel):
    """Request schema for finding similar SOAP notes."""
    note_id: uuid.UUID = Field(..., description="Reference SOAP note ID")
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Limit to specific patient")
    exclude_same_session: bool = Field(default=True, description="Exclude notes from same session")
    
    # Similarity parameters
    top_k: int = Field(default=5, description="Number of similar notes to find", ge=1, le=20)
    similarity_threshold: float = Field(default=0.8, description="Minimum similarity threshold", ge=0.0, le=1.0)


class SimilaritySearchResponse(BaseModel):
    """Response schema for similarity search."""
    success: bool = Field(..., description="Whether search was successful")
    similar_notes: List[RAGChunk] = Field(default_factory=list, description="Similar SOAP notes found")
    query_text: str = Field(..., description="Query text used for search")
    total_compared: int = Field(default=0, description="Total notes compared")
    processing_time: float = Field(default=0.0, description="Processing time")
    message: str = Field(default="", description="Status message")


class BatchEmbeddingRequest(BaseModel):
    """Request schema for batch embedding multiple SOAP notes."""
    note_ids: List[uuid.UUID] = Field(..., description="List of SOAP note IDs to embed")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Embed all notes from session")
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Embed all notes from patient")
    force_reembed: bool = Field(default=False, description="Force re-embedding even if exists")
    
    # Processing parameters
    batch_size: int = Field(default=10, description="Batch size for processing", ge=1, le=50)
    max_parallel: int = Field(default=3, description="Maximum parallel embeddings", ge=1, le=10)


class BatchEmbeddingResponse(BaseModel):
    """Response schema for batch embedding operations."""
    success: bool = Field(..., description="Whether batch embedding was successful")
    embedded_count: int = Field(default=0, description="Number of notes successfully embedded")
    skipped_count: int = Field(default=0, description="Number of notes skipped (already embedded)")
    failed_count: int = Field(default=0, description="Number of notes that failed")
    
    # Processing details
    processing_time: float = Field(default=0.0, description="Total processing time")
    embedded_notes: List[uuid.UUID] = Field(default_factory=list, description="Successfully embedded note IDs")
    failed_notes: List[Dict[str, Any]] = Field(default_factory=list, description="Failed notes with error details")
    
    message: str = Field(default="", description="Status message")


class RAGSimilarNotesResponse(BaseModel):
    """Response schema for similar notes search."""
    success: bool = Field(..., description="Whether search was successful")
    similar_notes: List[RAGChunk] = Field(default_factory=list, description="Similar SOAP notes found")
    reference_note_id: uuid.UUID = Field(..., description="Reference note ID used for comparison")
    total_compared: int = Field(default=0, description="Total notes compared")
    processing_time: float = Field(default=0.0, description="Processing time")
    message: str = Field(default="", description="Status message")


class NotesNeedingEmbeddingRequest(BaseModel):
    """Request schema for getting notes that need embedding."""
    note_ids: Optional[List[uuid.UUID]] = Field(None, description="Optional list of specific note IDs to check")
    session_id: Optional[uuid.UUID] = Field(None, description="Optional session ID to check")
    patient_id: Optional[uuid.UUID] = Field(None, description="Optional patient ID to check")


class EmbedApprovedNotesRequest(BaseModel):
    """Request schema for embedding approved notes."""
    note_ids: Optional[List[uuid.UUID]] = Field(None, description="Optional list of specific note IDs to embed")
    session_id: Optional[uuid.UUID] = Field(None, description="Optional session ID to embed all notes from session")
    patient_id: Optional[uuid.UUID] = Field(None, description="Optional patient ID to embed all notes from patient")
    force_reembed: bool = Field(False, description="Force re-embedding even if exists")
