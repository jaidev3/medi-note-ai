# """
# SOAP Note Routes
# HTTP endpoints for SOAP note generation, management, and approval
# """
# import uuid
# from typing import List, Optional

# from fastapi import APIRouter, Depends, Query, Path
# from fastapi.responses import Response

# from app.schemas.auth_schemas import UserRead
# from app.schemas.soap_schemas import (
#     SOAPGenerationRequest, SOAPGenerationResponse, SOAPNoteResponse,
#     SOAPNoteUpdate, SOAPBatchApprovalRequest, SOAPTriggerEmbeddingRequest
# )
# from app.controllers.soap_controller import SOAPController
# from app.routes.auth_routes import get_current_user_dependency

# # Create router
# router = APIRouter()

# # Initialize controller
# soap_controller = SOAPController()


# @router.post("/generate", response_model=SOAPGenerationResponse, summary="Generate SOAP Note")
# async def generate_soap_note(
#     generation_data: SOAPGenerationRequest,
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Generate SOAP note from text using AI pipeline with optional PII masking.
    
#     Args:
#         generation_data: SOAP generation request data
#         current_user: Current authenticated user
        
#     Returns:
#         SOAPGenerationResponse: Generated SOAP note with AI validation results
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         This endpoint runs the complete AI pipeline:
#         0. PII masking (optional, enabled by default) - anonymizes patient identifiers
#         1. NER extraction for medical entities
#         2. SOAP note generation using HuggingFace Mistral (HF Endpoint) with NER context
#         3. Judge LLM validation with OpenAI and retry logic
#         4. Database storage with embeddings
        
#         PII Masking Features:
#         - Automatically detects and anonymizes patient names, SSNs, phone numbers, etc.
#         - Preserves medical terminology and clinical context by default
#         - Can be disabled via enable_pii_masking parameter
#         - Original text is always preserved in database for audit purposes
#     """
#     # Set professional_id to current user if not provided
#     if not generation_data.professional_id:
#         generation_data.professional_id = current_user.id
    
#     return await soap_controller.generate_soap_note(generation_data)


# @router.get("/notes/{note_id}", response_model=SOAPNoteResponse, summary="Get SOAP Note")
# async def get_soap_note(
#     note_id: uuid.UUID = Path(..., description="SOAP note ID"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Get SOAP note by ID.
    
#     Args:
#         note_id: SOAP note UUID
#         current_user: Current authenticated user
        
#     Returns:
#         SOAPNoteResponse: SOAP note information and content
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await soap_controller.get_soap_note(note_id)


# @router.put("/notes/{note_id}", response_model=SOAPNoteResponse, summary="Update SOAP Note")
# async def update_soap_note(
#     note_id: uuid.UUID = Path(..., description="SOAP note ID"),
#     update_data: SOAPNoteUpdate = ...,
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Update SOAP note content.
    
#     Args:
#         note_id: SOAP note UUID
#         update_data: Updated SOAP note data
#         current_user: Current authenticated user
        
#     Returns:
#         SOAPNoteResponse: Updated SOAP note information
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         Updating a SOAP note will reset its approval status.
#     """
#     return await soap_controller.update_soap_note(note_id, update_data)


# @router.post("/notes/{note_id}/approve", response_model=SOAPNoteResponse, summary="Approve SOAP Note")
# async def approve_soap_note(
#     note_id: uuid.UUID = Path(..., description="SOAP note ID"),
#     approved: bool = Query(True, description="Whether to approve (true) or reject (false)"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Approve or reject a SOAP note.
    
#     Args:
#         note_id: SOAP note UUID
#         approved: Whether to approve (true) or reject (false) the note
#         current_user: Current authenticated user
        
#     Returns:
#         SOAPNoteResponse: Updated SOAP note with approval status
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         Only the healthcare professional who created the note or admins can approve it.
#     """
#     return await soap_controller.approve_soap_note(note_id, approved)


# @router.post("/notes/batch-approve", response_model=List[SOAPNoteResponse], summary="Batch Approve SOAP Notes")
# async def batch_approve_soap_notes(
#     batch_data: SOAPBatchApprovalRequest,
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Approve or reject multiple SOAP notes in batch.
    
#     Args:
#         batch_data: Batch approval request with note IDs and approval status
#         current_user: Current authenticated user
        
#     Returns:
#         List[SOAPNoteResponse]: Updated SOAP notes with approval status
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         Only the healthcare professional who created the notes or admins can approve them.
#         When approved, the RAG embedding pipeline is automatically triggered for all notes.
#     """
#     return await soap_controller.batch_approve_soap_notes(batch_data.note_ids, batch_data.approved)


# @router.get("/sessions/{session_id}/soap-notes", response_model=List[SOAPNoteResponse], summary="List Session SOAP Notes")
# async def list_session_soap_notes(
#     session_id: uuid.UUID = Path(..., description="Session ID"),
#     approved_only: bool = Query(False, description="Whether to return only approved notes"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     List SOAP notes for a specific session.
    
#     Args:
#         session_id: Session UUID
#         approved_only: Whether to return only approved notes
#         current_user: Current authenticated user
        
#     Returns:
#         List[SOAPNoteResponse]: List of SOAP notes for the session
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await soap_controller.list_session_soap_notes(session_id, approved_only)


# @router.get("/pending-approvals", response_model=List[SOAPNoteResponse], summary="Get Pending Approvals")
# async def get_pending_approvals(
#     professional_id: Optional[uuid.UUID] = Query(None, description="Professional ID to filter by"),
#     limit: int = Query(50, ge=1, le=100, description="Maximum number of notes to return"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Get SOAP notes pending user approval.
    
#     Args:
#         professional_id: Optional professional ID to filter by (defaults to current user)
#         limit: Maximum number of notes to return (1-100)
#         current_user: Current authenticated user
        
#     Returns:
#         List[SOAPNoteResponse]: List of SOAP notes pending approval
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         If professional_id is not provided, returns pending notes for the current user.
#         Admin users can see pending notes for all professionals.
#     """
#     # Default to current user if no professional_id specified
#     target_professional_id = professional_id or current_user.id
    
#     # TODO: Add role-based access control
#     # Non-admin users should only see their own pending notes
#     if current_user.id != target_professional_id:
#         # In production, check if current_user has admin role
#         pass
    
#     return await soap_controller.get_pending_approvals(target_professional_id, limit)


# @router.post("/notes/trigger-embedding", summary="Trigger RAG Embedding for Approved Notes")
# async def trigger_embedding_for_approved_notes(
#     trigger_data: SOAPTriggerEmbeddingRequest,
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Trigger RAG embedding for already approved SOAP notes that don't have embeddings.
    
#     Args:
#         trigger_data: Trigger embedding request with optional filters
#         current_user: Current authenticated user
        
#     Returns:
#         dict: Embedding operation results and statistics
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         This endpoint is useful for:
#         - Backfilling embeddings for existing approved notes
#         - Ensuring all approved notes are available for RAG queries
#         - Batch processing after system updates
#     """
#     return await soap_controller.trigger_embedding_for_approved_notes(
#         note_ids=trigger_data.note_ids,
#         session_id=trigger_data.session_id,
#         patient_id=trigger_data.patient_id
#     )


# @router.get("/notes/{note_id}/export-pdf", summary="Export SOAP Note as PDF")
# async def export_soap_note_pdf(
#     note_id: uuid.UUID = Path(..., description="SOAP note ID"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Export SOAP note as a PDF document.
    
#     Args:
#         note_id: SOAP note UUID
#         current_user: Current authenticated user
        
#     Returns:
#         Response: PDF file for download
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await soap_controller.export_soap_note_pdf(note_id)
