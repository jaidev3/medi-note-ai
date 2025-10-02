"""
Document Management Controller
Handles document upload, processing, and retrieval business logic
"""
import uuid
from typing import Optional
import structlog

from fastapi import HTTPException, status, UploadFile

from app.schemas.document_schemas import (
    DocumentUploadRequest, DocumentUploadResponse, DocumentProcessRequest,
    DocumentProcessResponse, DocumentMetadataResponse, DocumentListResponse,
    DocumentDeleteRequest, DocumentDeleteResponse
)
from app.services.document_service import DocumentService
from app.database.db import async_session_maker
from app.models.uploaded_documents import UploadedDocuments
from sqlalchemy import select

logger = structlog.get_logger(__name__)


class DocumentController:
    """Controller for document management operations."""
    
    def __init__(self):
        """Initialize document controller."""
        logger.info("🔍 jaidev: DocumentController constructor called")
        self._document_service = None
    
    @property
    def document_service(self):
        """Lazy initialization of DocumentService."""
        if self._document_service is None:
            logger.info("Lazy creating DocumentService in DocumentController")
            try:
                self._document_service = DocumentService()
                logger.info("DocumentService created successfully in DocumentController")
            except Exception as e:
                logger.error("Failed to create DocumentService in DocumentController", error=str(e))
                raise
        return self._document_service
    
    async def upload_document_direct(
        self, 
        upload_data: DocumentUploadRequest, 
        file: UploadFile
    ) -> DocumentUploadResponse:
        """
        Upload document file directly to S3 and process.
        
        Args:
            upload_data: Document upload request data
            file: Uploaded file
            
        Returns:
            DocumentUploadResponse: Upload and processing results
            
        Raises:
            HTTPException: If upload or processing fails
        """
        try:
            logger.info(
                "Direct document upload requested",
                session_id=str(upload_data.session_id),
                filename=file.filename,
                file_size=file.size
            )
            
            return await self.document_service.upload_document_direct(upload_data, file)
            
        except Exception as e:
            logger.error("Direct document upload error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload document"
            )
    
    async def upload_document(self, upload_data: DocumentUploadRequest) -> DocumentUploadResponse:
        """
        Legacy method for pre-signed URL upload (deprecated).
        
        Args:
            upload_data: Document upload request data
            
        Returns:
            DocumentUploadResponse: Upload URL and metadata
            
        Raises:
            HTTPException: If upload initiation fails
        """
        try:
            logger.info(
                "Document upload requested",
                session_id=str(upload_data.session_id)
            )
            
            return await self.document_service.upload_document(upload_data)
            
        except Exception as e:
            logger.error("Document upload error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initiate document upload"
            )
    
    async def process_document(self, process_data: DocumentProcessRequest) -> DocumentProcessResponse:
        """
        Process uploaded document (extract text and generate SOAP note).
        
        Args:
            process_data: Document processing request data
            
        Returns:
            DocumentProcessResponse: Processing results
            
        Raises:
            HTTPException: If processing fails
        """
        try:
            logger.info("Document processing requested", document_id=str(process_data.document_id))
            
            return await self.document_service.process_document(process_data)
            
        except Exception as e:
            logger.error("Document processing error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process document"
            )
    
    async def get_document_metadata(self, document_id: uuid.UUID) -> DocumentMetadataResponse:
        """
        Get document metadata and processing status.
        
        Args:
            document_id: Document ID
            
        Returns:
            DocumentMetadataResponse: Document metadata and status
            
        Raises:
            HTTPException: If document not found or access denied
        """
        try:
            logger.info("Document metadata requested", document_id=str(document_id))
            
            async with async_session_maker() as session:
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.document_id == document_id
                )
                result = await session.execute(stmt)
                document = result.scalar_one_or_none()
                
                if not document:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Document not found"
                    )
                
                # Convert to response schema
                return DocumentMetadataResponse(
                    document_id=document.document_id,
                    session_id=document.session_id,
                    document_name=document.document_name,
                    file_size=0,  # Not stored in database
                    file_type="",  # Not stored in database
                    s3_upload_link=document.s3_upload_link,
                    upload_status="completed" if document.text_extracted else "pending",
                    processed=document.text_extracted,
                    text_extracted=document.text_extracted,
                    soap_generated=False,  # Not stored in database
                    created_at=document.created_at,
                    updated_at=document.updated_at,
                    processed_at=document.processed_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Document metadata retrieval error", error=str(e), document_id=str(document_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve document metadata"
            )
    
    async def get_document_pii_status(self, document_id: uuid.UUID) -> dict:
        """
        Get PII processing status and results for a document.
        
        Args:
            document_id: Document ID
            
        Returns:
            Dict containing PII processing information
            
        Raises:
            HTTPException: If document not found or access denied
        """
        try:
            logger.info("Document PII status requested", document_id=str(document_id))
            
            async with async_session_maker() as session:
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.document_id == document_id
                )
                result = await session.execute(stmt)
                document = result.scalar_one_or_none()
                
                if not document:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Document not found"
                    )
                
                # Get PII information from document
                pii_info = {
                    "document_id": str(document.document_id),
                    "document_name": document.document_name,
                    "text_extracted": document.text_extracted,
                    "pii_processing_status": "completed" if document.text_extracted else "pending",
                    "pii_masked": False,  # Default value
                    "pii_entities_found": 0,  # Default value
                    "processing_timestamp": document.processed_at.isoformat() if document.processed_at else None
                }
                
                # If text was extracted, we can provide more PII details
                if document.text_extracted and document.extracted_text:
                    # Note: In a real implementation, you might want to store PII status in the database
                    # For now, we'll indicate that PII processing was applied during extraction
                    pii_info.update({
                        "pii_masked": True,  # PII processing is always applied during extraction
                        "pii_entities_found": "unknown",  # Would need to be stored in database
                        "pii_processing_note": "PII detection and masking applied during text extraction"
                    })
                
                return pii_info
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Document PII status retrieval error", error=str(e), document_id=str(document_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve document PII status"
            )
    
    async def list_session_documents(
        self,
        session_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20
    ) -> DocumentListResponse:
        """
        List documents for a session.
        
        Args:
            session_id: Session UUID
            page: Page number (1-based)
            page_size: Number of items per page
            
        Returns:
            DocumentListResponse: Paginated list of documents
            
        Raises:
            HTTPException: If listing fails
        """
        try:
            # Validate pagination parameters
            if page < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page number must be 1 or greater"
                )
            
            if page_size < 1 or page_size > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page size must be between 1 and 100"
                )
            
            return await self.document_service.list_session_documents(session_id, page, page_size)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("List session documents error", error=str(e), session_id=str(session_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list session documents"
            )
    
    async def get_document_content(self, document_id: uuid.UUID) -> dict:
        """
        Get document content/text.
        
        Args:
            document_id: Document UUID
            
        Returns:
            dict: Document content information
            
        Raises:
            HTTPException: If document not found or content unavailable
        """
        try:
            logger.info("Document content requested", document_id=str(document_id))
            
            # Get document metadata first
            document = await self.document_service.get_document_metadata(document_id)
            if not document:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found"
                )
            
            # Get the actual document record to access extracted text
            async with async_session_maker() as session:
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.document_id == document_id
                )
                result = await session.execute(stmt)
                doc_record = result.scalar_one_or_none()
                
                if not doc_record:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Document record not found"
                    )
                
                # Return the actual extracted text if available
                if doc_record.text_extracted and doc_record.extracted_text:
                    return {
                        "document_id": str(document_id),
                        "content": doc_record.extracted_text,
                        "content_type": "text/plain",
                        "extracted": True,
                        "word_count": doc_record.word_count or 0,
                        "processing_status": doc_record.processing_status,
                        "message": "Text content retrieved successfully"
                    }
                else:
                    # Text extraction not completed or failed
                    if doc_record.processing_status == "pending":
                        message = "Text extraction is pending. Please wait for processing to complete."
                    elif doc_record.processing_status == "failed":
                        message = "Text extraction failed. Please try re-uploading the document."
                    else:
                        message = "Text extraction not completed. This document was uploaded before text storage was implemented."
                    
                    return {
                        "document_id": str(document_id),
                        "content": "",
                        "content_type": "text/plain",
                        "extracted": False,
                        "word_count": 0,
                        "processing_status": doc_record.processing_status or "pending",
                        "message": message
                    }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Get document content error", error=str(e), document_id=str(document_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve document content"
            )
    
    async def delete_document(self, delete_data: DocumentDeleteRequest) -> DocumentDeleteResponse:
        """
        Delete a document.
        
        Args:
            delete_data: Document deletion request data
            
        Returns:
            DocumentDeleteResponse: Deletion confirmation
            
        Raises:
            HTTPException: If deletion fails
        """
        try:
            logger.info("Document deletion requested", document_id=str(delete_data.document_id))
            
            # TODO: Implement document deletion
            # This would involve:
            # 1. Soft delete from database
            # 2. Delete from S3 if requested
            # 3. Update related records
            
            # For now, return success response
            return DocumentDeleteResponse(
                success=True,
                document_id=delete_data.document_id,
                s3_deleted=delete_data.delete_from_s3,
                message="Document deletion not yet implemented"
            )
            
        except Exception as e:
            logger.error("Document deletion error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete document"
            )
