"""
RAG (Retrieval-Augmented Generation) Service
Implements vector search, reranking, and answer generation for patient data
"""
import os
import time
import json
import uuid
import numpy as np
from typing import List, Dict, Any, Optional
import structlog
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from langchain_core.prompts import PromptTemplate
from sqlalchemy import select, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.services.ai_provider_utils import get_chat_model, get_embedding_model

from app.schemas.rag_schemas import (
    RAGQueryRequest, RAGQueryResponse, RAGChunk,
    RAGEmbeddingRequest, RAGEmbeddingResponse, RAGBatchEmbeddingRequest,
    RAGSimilarNotesRequest, RAGSimilarNotesResponse
)
from app.models.session_soap_notes import SessionSoapNotes
from app.models.patient_visit_sessions import PatientVisitSessions
from app.models.users import User
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class RAGService:
    """Service for RAG-based querying and retrieval."""
    
    def __init__(self):
        """Initialize RAG service with embeddings and models."""
        self.embeddings = None
        self.llm = None
        self.rag_prompt = None
        self.provider = None  # Track which provider is being used
        self._initialize_models()
        self._setup_prompts()
    
    def _initialize_models(self):
        """Initialize embedding and generation models with OpenAI or Google Gemini fallback."""
        try:
            logger.info("Initializing RAG models")
            
            temperature = float(os.getenv("TEMPERATURE", "0.1"))
            
            # Initialize embeddings with automatic provider fallback
            self.embeddings, embedding_provider = get_embedding_model()
            
            # Initialize LLM with automatic provider fallback
            self.llm, llm_provider = get_chat_model(temperature=temperature)
            
            # Track the provider
            self.provider = embedding_provider  # Both should be the same provider
            
            logger.info(f"✅ RAG models initialized successfully with {self.provider.upper()}")
            
        except Exception as e:
            logger.error("❌ Failed to initialize RAG models", error=str(e))
            raise RuntimeError(f"RAG model initialization failed: {e}")
    
    def _setup_prompts(self):
        """Setup RAG answer generation prompt."""
        rag_prompt_template = """You are a medical AI assistant specializing in hearing care. Use the following retrieved information to answer the user's question accurately and professionally.

Retrieved Context:
{context}

Patient Information:
{patient_info}

Question: {query}

Instructions:
- Provide a comprehensive, accurate answer based on the retrieved context
- Focus on hearing care and audiological information
- Include specific measurements, test results, and clinical details when available
- Maintain professional medical language
- If the context doesn't contain enough information, clearly state what is missing
- Always cite your sources using the provided source information

Answer:"""
        
        self.rag_prompt = PromptTemplate(
            input_variables=["context", "patient_info", "query"],
            template=rag_prompt_template
        )
        
        logger.info("✅ RAG prompts setup successfully")
    
    async def embed_soap_note(self, note_id: uuid.UUID, force_reembed: bool = False) -> bool:
        """
        Embed a single SOAP note for vector search.
        
        Args:
            note_id: SOAP note ID to embed
            force_reembed: Force re-embedding even if exists
            
        Returns:
            bool: True if successful
        """
        async with async_session_maker() as session:
            try:
                # Get SOAP note with session and patient info
                stmt = select(SessionSoapNotes).where(SessionSoapNotes.note_id == note_id)
                result = await session.execute(stmt)
                soap_note = result.scalar_one_or_none()
                
                if not soap_note:
                    logger.warning("SOAP note not found", note_id=str(note_id))
                    return False
                
                # Check if already embedded
                if soap_note.embedding is not None and not force_reembed:
                    logger.info("SOAP note already embedded, skipping", note_id=str(note_id))
                    return True
                
                # Prepare content for embedding
                content_text = self._prepare_content_for_embedding(soap_note.content)
                
                # Generate embedding
                embedding_vector = await self.embeddings.aembed_query(content_text)
                
                # Convert to numpy array for proper pgvector storage
                import numpy as np
                embedding_array = np.array(embedding_vector, dtype=np.float32)
                
                # Update database with embedding
                soap_note.embedding = embedding_array
                await session.commit()
                
                logger.info("✅ SOAP note embedded successfully", note_id=str(note_id))
                return True
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to embed SOAP note", note_id=str(note_id), error=str(e))
                return False
    
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
    
    async def batch_embed_notes(self, request: RAGBatchEmbeddingRequest) -> RAGEmbeddingResponse:
        """
        Batch embed multiple SOAP notes.
        
        Args:
            request: Batch embedding request
            
        Returns:
            RAGEmbeddingResponse: Embedding results
        """
        start_time = time.time()
        embedded_count = 0
        skipped_count = 0
        failed_count = 0
        embedded_notes = []
        failed_notes = []
        
        try:
            # Determine note IDs to process
            note_ids = request.note_ids.copy()
            
            # Add notes from session or patient if specified
            if request.session_id or request.patient_id:
                async with async_session_maker() as session:
                    conditions = []
                    if request.session_id:
                        conditions.append(SessionSoapNotes.session_id == request.session_id)
                    if request.patient_id:
                        # Join with sessions to filter by patient
                        conditions.append(
                            SessionSoapNotes.session_id.in_(
                                select(PatientVisitSessions.session_id).where(
                                    PatientVisitSessions.patient_id == request.patient_id
                                )
                            )
                        )
                    
                    stmt = select(SessionSoapNotes.note_id).where(and_(*conditions))
                    result = await session.execute(stmt)
                    additional_note_ids = [row[0] for row in result.fetchall()]
                    note_ids.extend(additional_note_ids)
            
            # Remove duplicates
            note_ids = list(set(note_ids))
            
            # Process notes in batches
            for i in range(0, len(note_ids), request.batch_size):
                batch = note_ids[i:i + request.batch_size]
                
                for note_id in batch:
                    try:
                        success = await self.embed_soap_note(note_id, request.force_reembed)
                        if success:
                            embedded_count += 1
                            embedded_notes.append(note_id)
                        else:
                            failed_count += 1
                            failed_notes.append({
                                "note_id": str(note_id),
                                "error": "Embedding failed"
                            })
                    except Exception as e:
                        failed_count += 1
                        failed_notes.append({
                            "note_id": str(note_id),
                            "error": str(e)
                        })
            
            processing_time = time.time() - start_time
            
            return RAGEmbeddingResponse(
                success=failed_count == 0,
                embedded_count=embedded_count,
                skipped_count=skipped_count,
                failed_count=failed_count,
                processing_time=processing_time,
                embedded_notes=embedded_notes,
                failed_notes=failed_notes,
                message=f"Processed {len(note_ids)} notes: {embedded_count} embedded, {failed_count} failed"
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ Batch embedding failed", error=str(e))
            
            return RAGEmbeddingResponse(
                success=False,
                embedded_count=embedded_count,
                skipped_count=skipped_count,
                failed_count=failed_count,
                processing_time=processing_time,
                embedded_notes=embedded_notes,
                failed_notes=failed_notes,
                message=f"Batch embedding failed: {str(e)}"
            )
    
    async def query_rag(self, request: RAGQueryRequest) -> RAGQueryResponse:
        """
        Query patient data using RAG pipeline.
        
        Args:
            request: RAG query request
            
        Returns:
            RAGQueryResponse: Query results with generated answer
        """
        start_time = time.time()
        
        try:
            logger.info("Starting RAG query", query=request.query, patient_id=str(request.patient_id) if request.patient_id else None)
            
            # Step 1: Extract patient from query if not provided
            extracted_patient_id = request.patient_id
            if not extracted_patient_id:
                extracted_patient_id = await self._extract_patient_from_query(request.query)
                if extracted_patient_id:
                    logger.info(f"Extracted patient ID from query: {extracted_patient_id}")
                    # Create a new request with the extracted patient_id
                    request = RAGQueryRequest(
                        query=request.query,
                        patient_id=extracted_patient_id,
                        session_id=request.session_id,
                        professional_id=request.professional_id,
                        start_date=request.start_date,
                        end_date=request.end_date,
                        top_k=request.top_k,
                        similarity_threshold=request.similarity_threshold,
                        rerank_top_n=request.rerank_top_n,
                        include_sources=request.include_sources
                    )
            
            # Step 2: Preprocess query using context_data (if available)
            processed_query = await self._preprocess_query(request.query)
            print("jaidev was at processed_query",processed_query)
            # Step 3: Generate query embedding
            embedding_start = time.time()
            query_embedding_list = await self.embeddings.aembed_query(processed_query)
            # Convert to numpy array for proper pgvector comparison
            import numpy as np
            query_embedding = np.array(query_embedding_list, dtype=np.float32)
            embedding_time = time.time() - embedding_start
            
            # Step 4: Filter by metadata and perform top-K vector search
            retrieval_start = time.time()
            retrieved_chunks = await self._vector_search(request, query_embedding)
            retrieval_time = time.time() - retrieval_start
            
            # Step 5: Rerank results with cross-encoder (simplified for now)
            rerank_start = time.time()
            reranked_chunks = await self._rerank_chunks(retrieved_chunks, request.query, request.rerank_top_n)
            rerank_time = time.time() - rerank_start
            
            # Step 6: Assemble prompt with retrieved context
            context = self._assemble_context(reranked_chunks)
            patient_info = await self._get_patient_info(request.patient_id) if request.patient_id else ""
            
            # Step 6: Generate answer with LLM and source attribution
            generation_start = time.time()
            answer = await self._generate_answer(context, patient_info, request.query)
            generation_time = time.time() - generation_start
            
            # Prepare response
            sources = self._extract_sources(reranked_chunks) if request.include_sources else []
            processing_time = time.time() - start_time
            
            logger.info(
                "✅ RAG query completed",
                chunks_retrieved=len(retrieved_chunks),
                chunks_reranked=len(reranked_chunks),
                processing_time=processing_time
            )
            
            return RAGQueryResponse(
                success=True,
                answer=answer,
                retrieved_chunks=reranked_chunks,
                sources=sources,
                confidence=0.85,  # TODO: Implement confidence calculation
                total_chunks_found=len(retrieved_chunks),
                processing_time=processing_time,
                embedding_time=embedding_time,
                retrieval_time=retrieval_time,
                rerank_time=rerank_time,
                generation_time=generation_time,
                message="Query processed successfully"
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ RAG query failed", error=str(e), query=request.query)
            
            return RAGQueryResponse(
                success=False,
                answer="",
                retrieved_chunks=[],
                sources=[],
                confidence=0.0,
                total_chunks_found=0,
                processing_time=processing_time,
                message=f"Query failed: {str(e)}"
            )
    
    async def _preprocess_query(self, query: str) -> str:
        """Preprocess query using context_data (simplified for now)."""
        # TODO: Implement query expansion using medical terminology
        return query
    
    async def _extract_patient_from_query(self, query: str) -> Optional[uuid.UUID]:
        """Extract patient name from query and find matching patient ID."""
        import re
        
        # Common patterns for patient references
        patterns = [
            r"what (?:all do you know about|do you know about|is|are|was|were) (.+?)(?:\?|$)",
            r"tell me about (.+?)(?:\?|$)",
            r"patient (.+?)(?:\?|$)",
            r"(.+?)'s (?:hearing|test|results|visit|appointment)",
            r"(.+?) (?:has|had|shows|showed) (?:hearing|test|results)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                potential_name = match.group(1).strip()
                # Clean up the name (remove common words)
                clean_name = re.sub(r'\b(patient|the|a|an|his|her|their)\b', '', potential_name, flags=re.IGNORECASE).strip()
                if clean_name and len(clean_name) > 2:
                    patient_id = await self._find_patient_by_name_fuzzy(clean_name)
                    if patient_id:
                        return patient_id
        
        return None
    
    async def _vector_search(self, request: RAGQueryRequest, query_embedding: np.ndarray) -> List[RAGChunk]:
        """
        Perform vector search with metadata filtering.
        
        Args:
            request: Query request with filters
            query_embedding: Query embedding vector
            
        Returns:
            List[RAGChunk]: Retrieved chunks
        """
        async with async_session_maker() as session:
            try:
                # Build base query
                stmt = select(
                    SessionSoapNotes,
                    PatientVisitSessions.patient_id,
                    PatientVisitSessions.visit_date,
                    SessionSoapNotes.embedding.cosine_distance(query_embedding).label('distance')
                ).join(
                    PatientVisitSessions,
                    SessionSoapNotes.session_id == PatientVisitSessions.session_id
                ).where(
                    SessionSoapNotes.embedding.is_not(None)
                )
                
                # Apply filters as specified
                conditions = []
                
                # Filter by patient_id if provided (critical requirement)
                if request.patient_id:
                    conditions.append(PatientVisitSessions.patient_id == request.patient_id)
                    logger.info("Filtering by patient_id", patient_id=str(request.patient_id))
                
                # Filter by session_id if provided
                if request.session_id:
                    conditions.append(SessionSoapNotes.session_id == request.session_id)
                
                # Filter by professional_id if provided
                if request.professional_id:
                    conditions.append(SessionSoapNotes.professional_id == request.professional_id)
                
                # Filter by date range if provided
                if request.start_date:
                    conditions.append(PatientVisitSessions.visit_date >= request.start_date)
                if request.end_date:
                    conditions.append(PatientVisitSessions.visit_date <= request.end_date)
                
                # Apply all conditions
                if conditions:
                    stmt = stmt.where(and_(*conditions))
                
                # Apply similarity threshold and limit
                # Cosine distance ranges from 0 (identical) to 2 (completely opposite)
                # similarity_threshold is a similarity score (0-1), so we convert to distance
                # similarity = 1 - (distance/2), so distance = 2 * (1 - similarity)
                distance_threshold = 2 * (1 - request.similarity_threshold)
                stmt = stmt.where(
                    SessionSoapNotes.embedding.cosine_distance(query_embedding) < distance_threshold
                ).order_by(
                    SessionSoapNotes.embedding.cosine_distance(query_embedding)
                ).limit(request.top_k)
                
                result = await session.execute(stmt)
                rows = result.fetchall()
                
                # Convert to RAGChunk objects
                chunks = []
                for soap_note, patient_id, visit_date, distance in rows:
                    similarity_score = 1 - distance  # Convert distance to similarity
                    
                    chunk = RAGChunk(
                        chunk_id=str(soap_note.note_id),
                        content=self._prepare_content_for_embedding(soap_note.content),
                        metadata={
                            "note_id": str(soap_note.note_id),
                            "session_id": str(soap_note.session_id),
                            "document_id": str(soap_note.document_id),
                            "professional_id": str(soap_note.professional_id) if soap_note.professional_id else None,
                            "ai_approved": soap_note.ai_approved,
                            "user_approved": soap_note.user_approved,
                            "created_at": soap_note.created_at.isoformat()
                        },
                        similarity_score=similarity_score,
                        patient_id=patient_id,
                        session_id=soap_note.session_id,
                        note_id=soap_note.note_id,
                        visit_date=visit_date
                    )
                    chunks.append(chunk)
                
                logger.info("Vector search completed", chunks_found=len(chunks))
                return chunks
                
            except Exception as e:
                logger.error("Vector search failed", error=str(e))
                return []
    
    async def _rerank_chunks(self, chunks: List[RAGChunk], query: str, top_n: int) -> List[RAGChunk]:
        """
        Rerank chunks using cross-encoder (simplified implementation).
        
        Args:
            chunks: Retrieved chunks
            query: Original query
            top_n: Number of top chunks to return
            
        Returns:
            List[RAGChunk]: Reranked chunks
        """
        # TODO: Implement proper cross-encoder reranking
        # For now, return top chunks based on similarity score
        sorted_chunks = sorted(chunks, key=lambda x: x.similarity_score, reverse=True)
        
        # Add simplified rerank scores (based on content length and relevance)
        for i, chunk in enumerate(sorted_chunks[:top_n]):
            chunk.rerank_score = chunk.similarity_score * (1 - i * 0.1)  # Slight penalty for lower ranks
        
        return sorted_chunks[:top_n]
    
    def _assemble_context(self, chunks: List[RAGChunk]) -> str:
        """Assemble retrieved context for prompt."""
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"Source {i}:\n{chunk.content}\n")
        
        return "\n".join(context_parts)
    
    async def _get_patient_info(self, patient_id: uuid.UUID) -> str:
        """Get basic patient information for context."""
        async with async_session_maker() as session:
            try:
                stmt = select(User).where(User.id == patient_id)
                result = await session.execute(stmt)
                patient = result.scalar_one_or_none()
                
                if patient:
                    return f"Patient: {patient.name or 'Unknown'}"
                return ""
                
            except Exception:
                return ""
    
    async def _find_patient_by_name_fuzzy(self, patient_name: str) -> Optional[uuid.UUID]:
        """Find patient by name using fuzzy matching."""
        async with async_session_maker() as session:
            try:
                # First try exact match
                stmt = select(User).where(User.name.ilike(patient_name))
                result = await session.execute(stmt)
                patient = result.scalar_one_or_none()
                
                if patient:
                    return patient.id
                
                # Try fuzzy matching for common typos
                from difflib import SequenceMatcher
                
                stmt = select(User)
                result = await session.execute(stmt)
                all_patients = result.fetchall()
                
                best_match = None
                best_ratio = 0.0
                
                for patient_row in all_patients:
                    patient = patient_row[0]
                    ratio = SequenceMatcher(None, patient_name.lower(), patient.name.lower()).ratio()
                    if ratio > best_ratio and ratio > 0.7:  # Threshold for similarity
                        best_ratio = ratio
                        best_match = patient
                
                if best_match:
                    logger.info(f"Found fuzzy match for '{patient_name}': '{best_match.name}' (similarity: {best_ratio:.2f})")
                    return best_match.id
                
                return None
                
            except Exception as e:
                logger.error("Failed to find patient by name", error=str(e))
                return None
    
    async def _generate_answer(self, context: str, patient_info: str, query: str) -> str:
        """Generate answer using LLM with retrieved context."""
        try:
            prompt_input = {
                "context": context,
                "patient_info": patient_info,
                "query": query
            }
            
            formatted_prompt = self.rag_prompt.format(**prompt_input)
            response = await self.llm.ainvoke(formatted_prompt)
            
            return response.content.strip()
            
        except Exception as e:
            logger.error("Answer generation failed", error=str(e))
            return "I apologize, but I couldn't generate a response based on the available information."
    
    def _extract_sources(self, chunks: List[RAGChunk]) -> List[str]:
        """Extract source citations from chunks."""
        sources = []
        for i, chunk in enumerate(chunks, 1):
            if chunk.visit_date:
                date_str = chunk.visit_date.strftime("%Y-%m-%d")
                sources.append(f"[{i}] SOAP Note from {date_str} (Note ID: {chunk.note_id})")
            else:
                sources.append(f"[{i}] SOAP Note ID: {chunk.note_id}")
        
        return sources

    async def get_notes_needing_embedding(
        self,
        note_ids: Optional[List[uuid.UUID]] = None,
        session_id: Optional[uuid.UUID] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get SOAP notes that need embedding (approved but not yet embedded).
        
        Args:
            note_ids: Optional list of specific note IDs to check
            session_id: Optional session ID to get all notes from session
            patient_id: Optional patient ID to get all notes from patient
            
        Returns:
            List[Dict]: Notes needing embedding with metadata
        """
        async with async_session_maker() as session:
            try:
                from app.data.soap_notes_repository import SOAPNotesRepository
                
                repo = SOAPNotesRepository(session)
                notes_needing_embedding = await repo.get_soap_notes_needing_embedding(
                    note_ids=note_ids,
                    session_id=session_id,
                    patient_id=patient_id
                )
                
                result = []
                for note in notes_needing_embedding:
                    result.append({
                        "note_id": str(note.note_id),
                        "session_id": str(note.session_id),
                        "document_id": str(note.document_id),
                        "professional_id": str(note.professional_id) if note.professional_id else None,
                        "created_at": note.created_at.isoformat(),
                        "content_preview": self._prepare_content_for_embedding(note.content)[:200] + "..." if note.content else "No content"
                    })
                
                logger.info("Found notes needing embedding", count=len(result))
                return result
                
            except Exception as e:
                logger.error("Failed to get notes needing embedding", error=str(e))
                return []
    
    async def embed_approved_notes(
        self,
        note_ids: Optional[List[uuid.UUID]] = None,
        session_id: Optional[uuid.UUID] = None,
        patient_id: Optional[uuid.UUID] = None,
        force_reembed: bool = False
    ) -> RAGEmbeddingResponse:
        """
        Embed approved SOAP notes that don't have embeddings yet.
        
        Args:
            note_ids: Optional list of specific note IDs to embed
            session_id: Optional session ID to embed all notes from session
            patient_id: Optional patient ID to embed all notes from patient
            force_reembed: Force re-embedding even if exists
            
        Returns:
            RAGEmbeddingResponse: Embedding operation results
        """
        try:
            logger.info("Starting embedding for approved notes", 
                       note_ids_count=len(note_ids) if note_ids else 0,
                       session_id=str(session_id) if session_id else None,
                       patient_id=str(patient_id) if patient_id else None)
            
            # Create batch embedding request
            batch_request = RAGBatchEmbeddingRequest(
                note_ids=note_ids or [],
                session_id=session_id,
                patient_id=patient_id,
                force_reembed=force_reembed,
                batch_size=10
            )
            
            # Use existing batch embedding method
            return await self.batch_embed_notes(batch_request)
            
        except Exception as e:
            logger.error("Failed to embed approved notes", error=str(e))
            return RAGEmbeddingResponse(
                success=False,
                embedded_count=0,
                skipped_count=0,
                failed_count=0,
                processing_time=0.0,
                embedded_notes=[],
                failed_notes=[{"error": str(e)}],
                message=f"Embedding failed: {str(e)}"
            )
