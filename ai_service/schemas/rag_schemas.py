"""
RAG (Retrieval-Augmented Generation) schemas for AI service
Simplified version for embedding generation and basic RAG operations
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


class EmbeddingRequest(BaseModel):
    """Request schema for generating embeddings."""
    text: str = Field(..., description="Text to embed", min_length=1)
    normalize: bool = Field(default=True, description="Whether to normalize the embedding vector")


class EmbeddingResponse(BaseModel):
    """Response schema for embedding generation."""
    success: bool = Field(..., description="Whether embedding generation was successful")
    embedding: Optional[List[float]] = Field(default=None, description="Generated embedding vector")
    dimension: int = Field(default=0, description="Embedding vector dimension")
    processing_time: float = Field(default=0.0, description="Processing time in seconds")
    message: str = Field(default="", description="Status or error message")


class BatchEmbeddingRequest(BaseModel):
    """Request schema for batch embedding generation."""
    texts: List[str] = Field(..., description="List of texts to embed", min_items=1)
    normalize: bool = Field(default=True, description="Whether to normalize embedding vectors")
    batch_size: int = Field(default=100, description="Batch processing size", ge=1, le=1000)


class BatchEmbeddingResponse(BaseModel):
    """Response schema for batch embedding generation."""
    success: bool = Field(..., description="Whether batch embedding was successful")
    embeddings: List[List[float]] = Field(default_factory=list, description="Generated embedding vectors")
    processed_count: int = Field(default=0, description="Number of texts successfully processed")
    failed_count: int = Field(default=0, description="Number of texts that failed processing")
    processing_time: float = Field(default=0.0, description="Total processing time in seconds")
    message: str = Field(default="", description="Status or error message")


class SOAPEmbeddingRequest(BaseModel):
    """Request schema for SOAP note embedding."""
    note_id: uuid.UUID = Field(..., description="SOAP note ID to embed")
    force_reembed: bool = Field(default=False, description="Force re-embedding even if exists")


class SOAPEmbeddingResponse(BaseModel):
    """Response schema for SOAP note embedding."""
    success: bool = Field(..., description="Whether SOAP note embedding was successful")
    note_id: uuid.UUID = Field(..., description="SOAP note ID that was processed")
    embedding_generated: bool = Field(default=False, description="Whether new embedding was generated")
    processing_time: float = Field(default=0.0, description="Processing time in seconds")
    message: str = Field(default="", description="Status or error message")
