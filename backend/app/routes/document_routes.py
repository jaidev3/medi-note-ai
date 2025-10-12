# """
# Document Management Routes
# HTTP endpoints for document upload, processing, and retrieval
# """
# import uuid

# from fastapi import APIRouter, Depends, Query, Path, File, UploadFile, Form, HTTPException, status

# from app.schemas.auth_schemas import UserRead
# from app.schemas.document_schemas import (
#     DocumentUploadRequest, DocumentUploadResponse, DocumentProcessRequest,
#     DocumentProcessResponse, DocumentMetadataResponse, DocumentListResponse,
#     DocumentDeleteRequest, DocumentDeleteResponse
# )
# from app.controllers.document_controller import DocumentController
# from app.routes.auth_routes import get_current_user_dependency

# # Create router
# router = APIRouter()

# # Initialize controller
# document_controller = DocumentController()


# @router.post("/upload", response_model=DocumentUploadResponse, summary="Upload Document")
# async def upload_document(
#     session_id: uuid.UUID = Form(..., description="Patient visit session ID"),
#     file: UploadFile = File(..., description="Document file to upload"),
#     description: str = Form(None, description="Document description"),
#     upload_source: str = Form("web", description="Upload source (web, mobile, api)"),
#     extract_text: bool = Form(True, description="Whether to extract text content"),
#     generate_soap: bool = Form(True, description="Whether to generate SOAP note"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Upload document file directly to server and store locally.
    
#     Args:
#         session_id: Patient visit session ID
#         file: Document file to upload
#         description: Optional document description
#         upload_source: Upload source identifier
#         extract_text: Whether to extract text content
#         generate_soap: Whether to generate SOAP note
#         current_user: Current authenticated user
        
#     Returns:
#         DocumentUploadResponse: Upload results and processing information
        
#     Requires:
#         Valid JWT access token in Authorization header
#         Multipart form data with file
        
#     Note:
#         This endpoint handles the complete upload and processing flow.
#         The file is stored locally and optionally processed for text extraction and SOAP generation.
#     """
#     # Create upload request object
#     upload_request = DocumentUploadRequest(
#         session_id=session_id,
#         description=description,
#         upload_source=upload_source,
#         extract_text=extract_text,
#         generate_soap=generate_soap
#     )
#     # Call the upload method
#     result = await document_controller.upload_document_direct(upload_request, file)
    
#     # Check if upload was successful and raise HTTP exception if not
#     if not result.success:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=result.message or "Document upload failed"
#         )
    
#     return result


# @router.post("/process", response_model=DocumentProcessResponse, summary="Process Document")
# async def process_document(
#     process_data: DocumentProcessRequest,
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Process uploaded document (extract text and generate SOAP note).
    
#     Args:
#         process_data: Document processing request data
#         current_user: Current authenticated user
        
#     Returns:
#         DocumentProcessResponse: Processing results including extracted text and SOAP note ID
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         This endpoint should be called after the document has been successfully uploaded to local storage.
#         It will extract text content and optionally generate a SOAP note.
#     """
#     # Call the process method
#     result = await document_controller.process_document(process_data)
    
#     # Check if processing was successful and raise HTTP exception if not
#     if not result.success:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=result.message or "Document processing failed"
#         )
    
#     return result


# @router.get("/{document_id}", response_model=DocumentMetadataResponse, summary="Get Document Metadata")
# async def get_document_metadata(
#     document_id: uuid.UUID = Path(..., description="Document ID"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Get document metadata and processing status.
    
#     Args:
#         document_id: Document ID
#         current_user: Current authenticated user
        
#     Returns:
#         DocumentMetadataResponse: Document metadata and status information
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await document_controller.get_document_metadata(document_id)


# @router.get("/{document_id}/pii-status", summary="Get Document PII Status")
# async def get_document_pii_status(
#     document_id: uuid.UUID = Path(..., description="Document ID"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Get PII processing status and results for a document.
    
#     Args:
#         document_id: Document ID
#         current_user: Current authenticated user
        
#     Returns:
#         Dict containing PII processing information
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await document_controller.get_document_pii_status(document_id)


# @router.get("/{document_id}/content", summary="Get Document Content")
# async def get_document_content(
#     document_id: uuid.UUID = Path(..., description="Document ID"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Get document text content.
    
#     Args:
#         document_id: Document UUID
#         current_user: Current authenticated user
        
#     Returns:
#         dict: Document content and extraction information
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         Returns extracted text content if available, otherwise initiates extraction process.
#     """
#     return await document_controller.get_document_content(document_id)


# @router.delete("/{document_id}", response_model=DocumentDeleteResponse, summary="Delete Document")
# async def delete_document(
#     document_id: uuid.UUID = Path(..., description="Document ID"),
#     delete_file: bool = Query(True, description="Whether to delete the physical file"),
#     reason: str = Query(None, description="Reason for deletion"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     Delete a document.
    
#     Args:
#         document_id: Document UUID
#         delete_file: Whether to delete the physical file from storage
#         reason: Optional reason for deletion
#         current_user: Current authenticated user
        
#     Returns:
#         DocumentDeleteResponse: Deletion confirmation and status
        
#     Requires:
#         Valid JWT access token in Authorization header
        
#     Note:
#         This performs a soft delete in the database and optionally removes the physical file.
#     """
#     delete_request = DocumentDeleteRequest(
#         document_id=document_id,
#         delete_file=delete_file,
#         reason=reason
#     )
    
#     return await document_controller.delete_document(delete_request)


# @router.get("/sessions/{session_id}/documents", response_model=DocumentListResponse, summary="List Session Documents")
# async def list_session_documents(
#     session_id: uuid.UUID = Path(..., description="Session ID"),
#     page: int = Query(1, ge=1, description="Page number (1-based)"),
#     page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
#     current_user: UserRead = Depends(get_current_user_dependency)
# ):
#     """
#     List documents for a specific session.
    
#     Args:
#         session_id: Session UUID
#         page: Page number (1-based)
#         page_size: Number of items per page (1-100)
#         current_user: Current authenticated user
        
#     Returns:
#         DocumentListResponse: Paginated list of session documents
        
#     Requires:
#         Valid JWT access token in Authorization header
#     """
#     return await document_controller.list_session_documents(session_id, page, page_size)
