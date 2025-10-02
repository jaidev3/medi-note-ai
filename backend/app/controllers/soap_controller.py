"""
SOAP Note Controller
Handles SOAP note generation, retrieval, and management business logic
"""
import uuid
from typing import Optional, List
import structlog

from fastapi import HTTPException, status
from fastapi.responses import Response

from app.schemas.soap_schemas import (
    SOAPGenerationRequest, SOAPGenerationResponse, SOAPNoteResponse,
    SOAPNoteUpdate, SOAPNoteRead
)
from app.services.soap_generation_service import SOAPGenerationService
from app.services.rag_service import RAGService
from app.services.pdf_service import PDFService
from app.data.soap_notes_repository import SOAPNotesRepository
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class SOAPController:
    """Controller for SOAP note operations."""
    
    def __init__(self):
        """Initialize SOAP controller."""
        self.soap_service = SOAPGenerationService()
        self.rag_service = RAGService()
        self.pdf_service = PDFService()
    
    async def generate_soap_note(self, generation_data: SOAPGenerationRequest) -> SOAPGenerationResponse:
        """
        Generate SOAP note from text.
        
        Args:
            generation_data: SOAP generation request data
            
        Returns:
            SOAPGenerationResponse: Generated SOAP note and metadata
            
        Raises:
            HTTPException: If generation fails
        """
        try:
            logger.info(
                "SOAP note generation requested",
                session_id=str(generation_data.session_id),
                document_id=str(generation_data.document_id) if generation_data.document_id else None
            )
            
            return await self.soap_service.generate_soap_note(generation_data)
            
        except Exception as e:
            logger.error("SOAP note generation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate SOAP note"
            )
    
    async def get_soap_note(self, note_id: uuid.UUID) -> SOAPNoteResponse:
        """
        Get SOAP note by ID.
        
        Args:
            note_id: SOAP note UUID
            
        Returns:
            SOAPNoteResponse: SOAP note information
            
        Raises:
            HTTPException: If note not found
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                soap_note = await repo.get_soap_note_by_id(note_id)
                if not soap_note:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="SOAP note not found"
                    )
                
                return SOAPNoteResponse(
                    note_id=soap_note.note_id,
                    session_id=soap_note.session_id,
                    document_id=soap_note.document_id,
                    professional_id=soap_note.professional_id,
                    content=soap_note.content,
                    context_data=soap_note.context_data,
                    ai_approved=soap_note.ai_approved,
                    user_approved=soap_note.user_approved,
                    created_at=soap_note.created_at,
                    updated_at=soap_note.updated_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Get SOAP note error", error=str(e), note_id=str(note_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve SOAP note"
            )
    
    async def update_soap_note(self, note_id: uuid.UUID, update_data: SOAPNoteUpdate) -> SOAPNoteResponse:
        """
        Update SOAP note content.
        
        Args:
            note_id: SOAP note UUID
            update_data: Updated SOAP note data
            
        Returns:
            SOAPNoteResponse: Updated SOAP note information
            
        Raises:
            HTTPException: If note not found or update fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                # Update content if provided
                if update_data.content:
                    updated_note = await repo.update_soap_note_content(note_id, update_data.content)
                    if not updated_note:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="SOAP note not found"
                        )
                    
                    await session.commit()
                    
                    logger.info("SOAP note updated", note_id=str(note_id))
                    
                    return SOAPNoteResponse(
                        note_id=updated_note.note_id,
                        session_id=updated_note.session_id,
                        document_id=updated_note.document_id,
                        professional_id=updated_note.professional_id,
                        content=updated_note.content,
                        context_data=updated_note.context_data,
                        ai_approved=updated_note.ai_approved,
                        user_approved=updated_note.user_approved,
                        created_at=updated_note.created_at,
                        updated_at=updated_note.updated_at
                    )
                else:
                    # If no content update, just return existing note
                    return await self.get_soap_note(note_id)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Update SOAP note error", error=str(e), note_id=str(note_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update SOAP note"
            )
    
    async def approve_soap_note(self, note_id: uuid.UUID, user_approved: bool = True) -> SOAPNoteResponse:
        """
        Approve or reject SOAP note.
        
        Args:
            note_id: SOAP note UUID
            user_approved: Whether the note is approved by user
            
        Returns:
            SOAPNoteResponse: Updated SOAP note information
            
        Raises:
            HTTPException: If note not found or approval fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                updated_note = await repo.approve_soap_note(note_id, user_approved)
                if not updated_note:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="SOAP note not found"
                    )
                
                await session.commit()
                
                approval_status = "approved" if user_approved else "rejected"
                logger.info("SOAP note approval updated", note_id=str(note_id), status=approval_status)
                
                # If approved, trigger RAG embedding pipeline
                if user_approved:
                    try:
                        logger.info("Triggering RAG embedding pipeline for approved SOAP note", note_id=str(note_id))
                        
                        # Trigger embedding for the approved note
                        embedding_success = await self.rag_service.embed_soap_note(note_id, force_reembed=False)
                        
                        if embedding_success:
                            logger.info("✅ RAG embedding completed successfully", note_id=str(note_id))
                        else:
                            logger.warning("⚠️ RAG embedding failed", note_id=str(note_id))
                            
                    except Exception as e:
                        # Log error but don't fail the approval process
                        logger.error("❌ RAG embedding failed after approval", note_id=str(note_id), error=str(e))
                
                return SOAPNoteResponse(
                    note_id=updated_note.note_id,
                    session_id=updated_note.session_id,
                    document_id=updated_note.document_id,
                    professional_id=updated_note.professional_id,
                    content=updated_note.content,
                    context_data=updated_note.context_data,
                    ai_approved=updated_note.ai_approved,
                    user_approved=updated_note.user_approved,
                    created_at=updated_note.created_at,
                    updated_at=updated_note.updated_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Approve SOAP note error", error=str(e), note_id=str(note_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve SOAP note"
            )
    
    async def batch_approve_soap_notes(
        self,
        note_ids: List[uuid.UUID],
        user_approved: bool = True
    ) -> List[SOAPNoteResponse]:
        """
        Approve or reject multiple SOAP notes in batch.
        
        Args:
            note_ids: List of SOAP note UUIDs
            user_approved: Whether the notes are approved by user
            
        Returns:
            List[SOAPNoteResponse]: Updated SOAP note information
            
        Raises:
            HTTPException: If batch approval fails
        """
        try:
            approved_notes = []
            
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                # Process each note individually
                for note_id in note_ids:
                    try:
                        updated_note = await repo.approve_soap_note(note_id, user_approved)
                        if updated_note:
                            approved_notes.append(updated_note)
                            logger.info("SOAP note approval updated", note_id=str(note_id), status="approved" if user_approved else "rejected")
                        else:
                            logger.warning("SOAP note not found for approval", note_id=str(note_id))
                    except Exception as e:
                        logger.error("Failed to approve SOAP note", note_id=str(note_id), error=str(e))
                        # Continue with other notes
                
                await session.commit()
                
                # If approved, trigger RAG embedding pipeline for all approved notes
                if user_approved and approved_notes:
                    try:
                        logger.info("Triggering RAG embedding pipeline for batch approved SOAP notes", count=len(approved_notes))
                        
                        # Get note IDs that need embedding
                        notes_needing_embedding = await repo.get_soap_notes_needing_embedding(
                            note_ids=[note.note_id for note in approved_notes]
                        )
                        
                        if notes_needing_embedding:
                            # Use batch embedding for efficiency
                            from app.schemas.rag_schemas import RAGBatchEmbeddingRequest
                            
                            batch_request = RAGBatchEmbeddingRequest(
                                note_ids=[note.note_id for note in notes_needing_embedding],
                                force_reembed=False,
                                batch_size=10
                            )
                            
                            embedding_result = await self.rag_service.batch_embed_notes(batch_request)
                            
                            if embedding_result.success:
                                logger.info("✅ Batch RAG embedding completed successfully", 
                                           embedded_count=embedding_result.embedded_count,
                                           failed_count=embedding_result.failed_count)
                            else:
                                logger.warning("⚠️ Batch RAG embedding had issues", 
                                             embedded_count=embedding_result.embedded_count,
                                             failed_count=embedding_result.failed_count)
                                
                    except Exception as e:
                        # Log error but don't fail the approval process
                        logger.error("❌ Batch RAG embedding failed after approval", error=str(e))
                
                # Return updated notes
                return [
                    SOAPNoteResponse(
                        note_id=note.note_id,
                        session_id=note.session_id,
                        document_id=note.document_id,
                        professional_id=note.professional_id,
                        content=note.content,
                        context_data=note.context_data,
                        ai_approved=note.ai_approved,
                        user_approved=note.user_approved,
                        created_at=note.created_at,
                        updated_at=note.updated_at
                    )
                    for note in approved_notes
                ]
                
        except Exception as e:
            logger.error("Batch approve SOAP notes error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to batch approve SOAP notes"
            )
    
    async def list_session_soap_notes(
        self,
        session_id: uuid.UUID,
        approved_only: bool = False
    ) -> List[SOAPNoteResponse]:
        """
        List SOAP notes for a session.
        
        Args:
            session_id: Session UUID
            approved_only: Whether to return only approved notes
            
        Returns:
            List[SOAPNoteResponse]: List of SOAP notes
            
        Raises:
            HTTPException: If listing fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                soap_notes = await repo.get_session_soap_notes(session_id, approved_only)
                
                return [
                    SOAPNoteResponse(
                        note_id=note.note_id,
                        session_id=note.session_id,
                        document_id=note.document_id,
                        professional_id=note.professional_id,
                        content=note.content,
                        context_data=note.context_data,
                        ai_approved=note.ai_approved,
                        user_approved=note.user_approved,
                        created_at=note.created_at,
                        updated_at=note.updated_at
                    )
                    for note in soap_notes
                ]
                
        except Exception as e:
            logger.error("List session SOAP notes error", error=str(e), session_id=str(session_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list session SOAP notes"
            )
    
    async def get_pending_approvals(
        self,
        professional_id: Optional[uuid.UUID] = None,
        limit: int = 50
    ) -> List[SOAPNoteResponse]:
        """
        Get SOAP notes pending user approval.
        
        Args:
            professional_id: Optional professional ID filter
            limit: Maximum number of notes to return
            
        Returns:
            List[SOAPNoteResponse]: List of pending SOAP notes
            
        Raises:
            HTTPException: If retrieval fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                pending_notes = await repo.get_pending_approval_notes(professional_id, limit)
                
                return [
                    SOAPNoteResponse(
                        note_id=note.note_id,
                        session_id=note.session_id,
                        document_id=note.document_id,
                        professional_id=note.professional_id,
                        content=note.content,
                        context_data=note.context_data,
                        ai_approved=note.ai_approved,
                        user_approved=note.user_approved,
                        created_at=note.created_at,
                        updated_at=note.updated_at
                    )
                    for note in pending_notes
                ]
                
        except Exception as e:
            logger.error("Get pending approvals error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve pending approvals"
            )

    async def trigger_embedding_for_approved_notes(
        self,
        note_ids: Optional[List[uuid.UUID]] = None,
        session_id: Optional[uuid.UUID] = None,
        patient_id: Optional[uuid.UUID] = None
    ) -> dict:
        """
        Trigger RAG embedding for already approved SOAP notes that don't have embeddings.
        
        Args:
            note_ids: Optional list of specific note IDs to embed
            session_id: Optional session ID to embed all notes from session
            patient_id: Optional patient ID to embed all notes from patient
            
        Returns:
            dict: Embedding operation results
            
        Raises:
            HTTPException: If embedding fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                # Get notes that need embedding
                notes_needing_embedding = await repo.get_soap_notes_needing_embedding(
                    note_ids=note_ids,
                    session_id=session_id,
                    patient_id=patient_id
                )
                
                if not notes_needing_embedding:
                    return {
                        "success": True,
                        "message": "No approved SOAP notes found that need embedding",
                        "embedded_count": 0,
                        "skipped_count": 0
                    }
                
                logger.info("Triggering RAG embedding for approved notes", 
                           count=len(notes_needing_embedding),
                           note_ids=[str(note.note_id) for note in notes_needing_embedding])
                
                # Use batch embedding for efficiency
                from app.schemas.rag_schemas import RAGBatchEmbeddingRequest
                
                batch_request = RAGBatchEmbeddingRequest(
                    note_ids=[note.note_id for note in notes_needing_embedding],
                    force_reembed=False,
                    batch_size=10
                )
                
                embedding_result = await self.rag_service.batch_embed_notes(batch_request)
                
                return {
                    "success": embedding_result.success,
                    "message": embedding_result.message,
                    "embedded_count": embedding_result.embedded_count,
                    "skipped_count": embedding_result.skipped_count,
                    "failed_count": embedding_result.failed_count,
                    "processing_time": embedding_result.processing_time
                }
                
        except Exception as e:
            logger.error("Trigger embedding for approved notes error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to trigger embedding for approved notes"
            )

    async def export_soap_note_pdf(self, note_id: uuid.UUID) -> Response:
        """
        Export SOAP note as PDF.
        
        Args:
            note_id: SOAP note UUID
            
        Returns:
            Response: PDF file for download
            
        Raises:
            HTTPException: If note not found or PDF generation fails
        """
        try:
            async with async_session_maker() as session:
                repo = SOAPNotesRepository(session)
                
                # Get SOAP note data
                soap_note = await repo.get_soap_note_by_id(note_id)
                if not soap_note:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="SOAP note not found"
                    )
                
                # Get patient data if available
                patient_data = None
                if soap_note.session_id:
                    try:
                        from app.data.patient_visit_sessions_repository import PatientVisitSessionsRepository
                        session_repo = PatientVisitSessionsRepository(session)
                        session_data = await session_repo.get_session_by_id(soap_note.session_id)
                        if session_data and session_data.patient_id:
                            from app.data.patients_repository import PatientsRepository
                            patient_repo = PatientsRepository(session)
                            patient = await patient_repo.get_patient_by_id(session_data.patient_id)
                            if patient:
                                patient_data = {
                                    'id': patient.patient_id,
                                    'name': patient.name
                                }
                    except Exception as e:
                        logger.warning("Failed to fetch patient data for PDF", error=str(e))
                
                # Get session data if available
                session_data = None
                if soap_note.session_id:
                    try:
                        from app.data.patient_visit_sessions_repository import PatientVisitSessionsRepository
                        session_repo = PatientVisitSessionsRepository(session)
                        session_obj = await session_repo.get_session_by_id(soap_note.session_id)
                        if session_obj:
                            session_data = {
                                'visit_date': session_obj.visit_date
                            }
                    except Exception as e:
                        logger.warning("Failed to fetch session data for PDF", error=str(e))
                
                # Convert SOAP note to dict for PDF service
                soap_note_dict = {
                    'content': soap_note.content,
                    'sections': getattr(soap_note, 'sections', None),
                    'soap_note': getattr(soap_note, 'soap_note', None),
                    'notes': getattr(soap_note, 'notes', None),
                    'created_at': soap_note.created_at,
                    'updated_at': soap_note.updated_at
                }
                
                # Generate PDF
                pdf_content = self.pdf_service.generate_soap_note_pdf(
                    soap_note_dict, 
                    patient_data, 
                    session_data
                )
                
                # Create filename
                patient_name = patient_data.get('name', 'Unknown') if patient_data else 'Unknown'
                filename = f"SOAP_Note_{patient_name}_{note_id}.pdf".replace(' ', '_')
                
                logger.info("SOAP note PDF exported successfully", note_id=str(note_id))
                
                return Response(
                    content=pdf_content,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"attachment; filename={filename}",
                        "Content-Length": str(len(pdf_content))
                    }
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Export SOAP note PDF error", error=str(e), note_id=str(note_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to export SOAP note as PDF"
            )
