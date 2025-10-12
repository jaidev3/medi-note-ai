"""
AI-powered SOAP Generation Service
Direct AI-powered SOAP note generation using integrated AI services
"""
import uuid
import time
from typing import Dict, Any, Optional
from datetime import datetime
import structlog

from app.schemas.soap_schemas import (
    SOAPGenerationRequest, SOAPGenerationResponse, SOAPNote
)
from app.services.ai.soap_service import SOAPGenerationService
from app.services.ai.ner_service import NERService
from app.services.ai.pii_service import PIIService
from app.services.ai.rag_service import RAGService
from app.models.session_soap_notes import SessionSoapNotes
from app.models.uploaded_documents import UploadedDocuments
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class AISOAPService:
    """Service for AI-powered SOAP note generation using integrated AI services."""
    
    def __init__(self):
        """Initialize AI SOAP service with direct AI service integration."""
        self.soap_service = SOAPGenerationService()
        self.ner_service = NERService()
        self.pii_service = PIIService()
        self.rag_service = RAGService()
    
    def _clean_for_json_serialization(self, data: Any) -> Any:
        """
        Clean data to ensure JSON serialization compatibility.
        
        Args:
            data: Data to clean
            
        Returns:
            JSON-serializable data
        """
        if isinstance(data, dict):
            return {key: self._clean_for_json_serialization(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._clean_for_json_serialization(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        elif isinstance(data, (uuid.UUID,)):
            return str(data)
        elif hasattr(data, '__dict__'):
            # Handle objects with __dict__ (like Pydantic models)
            return self._clean_for_json_serialization(data.__dict__)
        else:
            # For primitive types (str, int, float, bool, None)
            return data
    
    async def _create_document_record(
        self,
        session_id: uuid.UUID,
        professional_id: Optional[uuid.UUID],
        text_content: str
    ) -> uuid.UUID:
        """
        Create a document record for SOAP generation from text input.
        
        Args:
            session_id: Patient visit session ID
            professional_id: Healthcare professional ID
            text_content: The clinical text content
            
        Returns:
            UUID: Created document ID
        """
        async with async_session_maker() as session:
            try:
                # Generate a unique document ID
                document_id = uuid.uuid4()
                
                # Create document record
                document_record = UploadedDocuments(
                    document_id=document_id,
                    session_id=session_id,
                    document_name=f"SOAP_Input_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt",
                    s3_upload_link=f"soap_inputs/{session_id}/{document_id}.txt",  # Virtual S3 key for text input
                    text_extracted=True,
                    extracted_text=text_content,
                    processing_status="completed",
                    processed_at=datetime.utcnow()
                )
                
                session.add(document_record)
                await session.commit()
                await session.refresh(document_record)
                
                logger.info("✅ Created document record for SOAP generation", 
                           document_id=str(document_id), 
                           session_id=str(session_id))
                
                return document_id
                
            except Exception as e:
                logger.error("❌ Failed to create document record", error=str(e))
                raise
    
    async def _save_soap_note(
        self,
        soap_note: SOAPNote,
        context_data: Dict[str, Any],
        session_id: uuid.UUID,
        document_id: Optional[uuid.UUID],
        professional_id: Optional[uuid.UUID],
        ai_approved: bool
    ) -> uuid.UUID:
        """
        Save SOAP note to database with proper referential integrity.
        
        Args:
            soap_note: Generated SOAP note
            context_data: NER context data
            session_id: Patient visit session ID
            document_id: Source document ID
            professional_id: Healthcare professional ID
            ai_approved: Whether AI judge approved the note
            
        Returns:
            UUID: Database ID of saved SOAP note
        """
        async with async_session_maker() as session:
            try:
                # Clean data for JSON serialization
                cleaned_content = self._clean_for_json_serialization(soap_note.dict())
                cleaned_context_data = self._clean_for_json_serialization(context_data)
                
                logger.info("💾 Saving SOAP note to database", 
                           content_keys=list(cleaned_content.keys()) if isinstance(cleaned_content, dict) else "not_dict",
                           context_data_keys=list(cleaned_context_data.keys()) if isinstance(cleaned_context_data, dict) else "not_dict")
                
                # If document_id is None, create a document record for the text input
                if document_id is None:
                    logger.info("📝 Creating document record for text input")
                    document_id = await self._create_document_record(
                        session_id=session_id,
                        professional_id=professional_id,
                        text_content=soap_note.subjective.content + " " + soap_note.objective.content
                    )
                
                # Create database record
                db_soap_note = SessionSoapNotes(
                    session_id=session_id,
                    document_id=document_id,
                    professional_id=professional_id,
                    ai_approved=ai_approved,
                    user_approved=False,  # Requires manual approval
                    content=cleaned_content,  # Save cleaned content
                    context_data=cleaned_context_data,  # Save cleaned context data
                )
                
                session.add(db_soap_note)
                await session.commit()
                await session.refresh(db_soap_note)
                
                note_id = db_soap_note.note_id
                
                # If AI approved, trigger RAG embedding pipeline
                if ai_approved:
                    try:
                        logger.info("🤖 AI approved SOAP note, triggering RAG embedding pipeline", note_id=str(note_id))
                        
                        # Generate embedding using integrated RAG service
                        embedding = await self.rag_service.embed_soap_note_content(cleaned_content)
                        
                        if embedding:
                            # Update the note with embedding
                            import numpy as np
                            db_soap_note.embedding = np.array(embedding, dtype=np.float32)
                            await session.commit()
                            logger.info("✅ RAG embedding completed successfully for AI-approved note", note_id=str(note_id))
                        else:
                            logger.warning("⚠️ RAG embedding failed for AI-approved note", note_id=str(note_id))
                            
                    except Exception as e:
                        # Log error but don't fail the save process
                        logger.error("❌ RAG embedding failed for AI-approved note", note_id=str(note_id), error=str(e))
                
                return note_id
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to save SOAP note to database", error=str(e))
                raise
    
    async def generate_soap_note(self, request: SOAPGenerationRequest) -> SOAPGenerationResponse:
        """
        Generate SOAP note using integrated AI services.
        
        Args:
            request: SOAP generation request
            
        Returns:
            SOAPGenerationResponse: Generated and validated SOAP note
        """
        start_time = time.time()
        
        try:
            logger.info(
                "Starting SOAP note generation with integrated AI services",
                session_id=str(request.session_id),
                document_id=str(request.document_id) if request.document_id else None,
                text_length=len(request.text)
            )
            
            # Step 1: Apply PII masking if enabled
            processed_text = request.text
            pii_masked = False
            pii_entities_found = 0
            
            if request.enable_pii_masking:
                logger.info("🔒 Applying PII masking")
                from app.schemas.pii_schemas import PIIAnonymizationRequest
                
                pii_request = PIIAnonymizationRequest(
                    text=request.text,
                    preserve_medical_context=request.preserve_medical_context,
                    score_threshold=0.5
                )
                
                pii_response = await self.pii_service.anonymize_text(pii_request)
                
                if pii_response.success:
                    processed_text = pii_response.anonymized_text
                    pii_masked = pii_response.has_pii
                    pii_entities_found = pii_response.entities_count
                    
                    if pii_masked:
                        logger.info("✅ PII masking completed", entities_masked=pii_entities_found)
                else:
                    logger.warning("PII masking failed, using original text", error=pii_response.message)
            
            # Step 2: Extract NER context data if requested
            context_data = None
            if request.include_context:
                logger.info("🔍 Extracting NER context")
                context_data = await self.ner_service.extract_context_data(processed_text)
                logger.info("✅ NER context extracted", entity_count=context_data.get("total_entities", 0))
            
            # Step 3: Generate SOAP note
            logger.info("🤖 Generating SOAP note")
            ai_response = await self.soap_service.generate_soap_note(
                request=request,
                context_data=context_data,
                pii_masked_text=processed_text if pii_masked else None
            )
            
            # Update PII metadata in response
            ai_response.pii_masked = pii_masked
            ai_response.pii_entities_found = pii_entities_found
            
            # If AI service generated a valid SOAP note, save it to database
            note_id = None
            if ai_response.success and ai_response.soap_note and ai_response.ai_approved:
                try:
                    note_id = await self._save_soap_note(
                        soap_note=ai_response.soap_note,
                        context_data=ai_response.context_data.dict() if ai_response.context_data else {},
                        session_id=request.session_id,
                        document_id=request.document_id,
                        professional_id=request.professional_id,
                        ai_approved=ai_response.ai_approved
                    )
                    logger.info("✅ SOAP note saved to database", note_id=str(note_id))
                    
                    # Update response with database note ID
                    ai_response.note_id = note_id
                    
                except Exception as e:
                    logger.error("❌ Failed to save SOAP note to database", error=str(e))
                    # Don't fail the entire operation, just log the error
                    ai_response.message += f" (Database save failed: {str(e)})"
            
            processing_time = time.time() - start_time
            ai_response.processing_time = processing_time
            
            logger.info("✅ SOAP note generation completed", 
                       success=ai_response.success,
                       ai_approved=ai_response.ai_approved,
                       processing_time=processing_time)
            
            return ai_response
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ SOAP note generation failed", error=str(e), processing_time=processing_time)
            
            return SOAPGenerationResponse(
                success=False,
                soap_note=None,
                context_data=None,
                ai_approved=False,
                note_id=None,
                processing_time=processing_time,
                regeneration_count=0,
                validation_feedback=f"Generation failed: {str(e)}",
                message=f"SOAP generation error: {str(e)}",
                pii_masked=False,
                pii_entities_found=0,
                original_text_preserved=True
            )
