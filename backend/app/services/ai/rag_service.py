"""
RAG (Retrieval-Augmented Generation) Service
Implements embedding generation for SOAP notes and vector operations using Google Gemini
"""
import os
import time
import json
import uuid
import numpy as np
from typing import List, Dict, Any, Optional
import structlog
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

from app.schemas.rag_schemas import (
    EmbeddingRequest, EmbeddingResponse, BatchEmbeddingRequest, BatchEmbeddingResponse
)

logger = structlog.get_logger(__name__)


class RAGService:
    """Service for RAG-based embedding generation using Gemini."""
    
    def __init__(self):
        """Initialize RAG service with Gemini embeddings model."""
        self.embeddings = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize Gemini embedding model."""
        try:
            google_api_key = os.getenv("GOOGLE_API_KEY")
            gemini_embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")
            
            logger.info("Initializing Gemini embedding model")
            
            # Configure Gemini API
            genai.configure(api_key=google_api_key)
            
            # Store the embedding model name
            self.embedding_model = gemini_embedding_model
            
            logger.info("✅ Gemini embedding model initialized successfully", model=self.embedding_model)
            
        except Exception as e:
            logger.error("❌ Failed to initialize Gemini embedding model", error=str(e))
            raise RuntimeError(f"RAG model initialization failed: {e}")
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """
        Generate embedding for a single text using Gemini.
        
        Args:
            request: Embedding request
            
        Returns:
            EmbeddingResponse: Generated embedding
        """
        start_time = time.time()
        
        try:
            logger.info("Generating Gemini embedding", text_length=len(request.text))
            
            if not self.embedding_model:
                raise RuntimeError("Embedding model not initialized")
            
            # Generate embedding using Gemini
            result = genai.embed_content(
                model=self.embedding_model,
                content=request.text,
                task_type="retrieval_document"
            )
            
            embedding_vector = result['embedding']
            
            # Normalize if requested
            if request.normalize:
                embedding_array = np.array(embedding_vector, dtype=np.float32)
                norm = np.linalg.norm(embedding_array)
                if norm > 0:
                    embedding_vector = (embedding_array / norm).tolist()
            
            processing_time = time.time() - start_time
            
            logger.info("✅ Gemini embedding generated successfully", 
                       dimension=len(embedding_vector),
                       processing_time=processing_time)
            
            return EmbeddingResponse(
                success=True,
                embedding=embedding_vector,
                dimension=len(embedding_vector),
                processing_time=processing_time,
                message="Embedding generated successfully"
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ Gemini embedding generation failed", error=str(e), processing_time=processing_time)
            
            return EmbeddingResponse(
                success=False,
                embedding=None,
                dimension=0,
                processing_time=processing_time,
                message=f"Embedding generation failed: {str(e)}"
            )
    
    async def generate_batch_embeddings(self, request: BatchEmbeddingRequest) -> BatchEmbeddingResponse:
        """
        Generate embeddings for multiple texts in batch using Gemini.
        
        Args:
            request: Batch embedding request
            
        Returns:
            BatchEmbeddingResponse: Generated embeddings
        """
        start_time = time.time()
        embeddings = []
        processed_count = 0
        failed_count = 0
        
        batch_size = int(os.getenv("EMBEDDING_BATCH_SIZE", "50"))
        
        try:
            logger.info("Generating Gemini batch embeddings", text_count=len(request.texts))
            
            if not self.embedding_model:
                raise RuntimeError("Embedding model not initialized")
            
            # Process texts in batches
            for i in range(0, len(request.texts), request.batch_size):
                batch = request.texts[i:i + request.batch_size]
                
                try:
                    # Generate embeddings for batch using Gemini
                    batch_embeddings = []
                    for text in batch:
                        result = genai.embed_content(
                            model=self.embedding_model,
                            content=text,
                            task_type="retrieval_document"
                        )
                        batch_embeddings.append(result['embedding'])
                    
                    # Normalize if requested
                    if request.normalize:
                        normalized_embeddings = []
                        for embedding in batch_embeddings:
                            embedding_array = np.array(embedding, dtype=np.float32)
                            norm = np.linalg.norm(embedding_array)
                            if norm > 0:
                                normalized_embeddings.append((embedding_array / norm).tolist())
                            else:
                                normalized_embeddings.append(embedding)
                        batch_embeddings = normalized_embeddings
                    
                    embeddings.extend(batch_embeddings)
                    processed_count += len(batch)
                    
                except Exception as e:
                    logger.warning(f"Failed to process batch {i//request.batch_size + 1}", error=str(e))
                    failed_count += len(batch)
                    # Add empty embeddings for failed texts
                    embeddings.extend([[] for _ in batch])
            
            processing_time = time.time() - start_time
            
            logger.info("✅ Gemini batch embeddings generated", 
                       processed=processed_count,
                       failed=failed_count,
                       processing_time=processing_time)
            
            return BatchEmbeddingResponse(
                success=failed_count == 0,
                embeddings=embeddings,
                processed_count=processed_count,
                failed_count=failed_count,
                processing_time=processing_time,
                message=f"Processed {processed_count} texts, {failed_count} failed"
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ Gemini batch embedding generation failed", error=str(e), processing_time=processing_time)
            
            return BatchEmbeddingResponse(
                success=False,
                embeddings=[],
                processed_count=0,
                failed_count=len(request.texts),
                processing_time=processing_time,
                message=f"Batch embedding generation failed: {str(e)}"
            )
    
    def _prepare_content_for_embedding(self, content: Dict[str, Any]) -> str:
        """
        Prepare SOAP note content for embedding.
        
        Args:
            content: SOAP note content dictionary
            
        Returns:
            str: Formatted text for embedding
        """
        try:
            sections = []
            
            # Extract each SOAP section
            for section_name in ['subjective', 'objective', 'assessment', 'plan']:
                if section_name in content:
                    section_data = content[section_name]
                    if isinstance(section_data, dict) and 'content' in section_data:
                        sections.append(f"{section_name.upper()}: {section_data['content']}")
                    elif isinstance(section_data, str):
                        sections.append(f"{section_name.upper()}: {section_data}")
            
            return "\n\n".join(sections)
            
        except Exception as e:
            logger.error("Failed to prepare content for embedding", error=str(e))
            return json.dumps(content)  # Fallback to JSON string
    
    async def embed_soap_note_content(self, content: Dict[str, Any]) -> Optional[List[float]]:
        """
        Generate embedding for SOAP note content using Gemini.
        
        Args:
            content: SOAP note content dictionary
            
        Returns:
            Optional[List[float]]: Generated embedding vector or None if failed
        """
        try:
            # Prepare content for embedding
            content_text = self._prepare_content_for_embedding(content)
            
            # Generate embedding request
            embedding_request = EmbeddingRequest(text=content_text, normalize=True)
            
            # Generate embedding
            response = await self.generate_embedding(embedding_request)
            
            if response.success:
                return response.embedding
            else:
                logger.error("Failed to generate SOAP note embedding", message=response.message)
                return None
                
        except Exception as e:
            logger.error("Failed to embed SOAP note content", error=str(e))
            return None
