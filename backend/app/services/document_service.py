"""
Document Management Service
Orchestrates file upload, storage, and document processing using modular components
"""
import uuid
import time
import os
from typing import Optional
import structlog
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from dotenv import load_dotenv
from app.schemas.document_schemas import (
    DocumentUploadRequest, DocumentUploadResponse, DocumentProcessRequest,
    DocumentProcessResponse, DocumentMetadataResponse, DocumentListResponse,
    TextExtractionResult
)
from app.models.uploaded_documents import UploadedDocuments
from app.models.patient_visit_sessions import PatientVisitSessions
from app.services.soap_generation_service import SOAPGenerationService
from app.schemas.soap_schemas import SOAPGenerationRequest
from app.database.db import async_session_maker

# Import modular components
from app.services.document_validation import DocumentValidator
from app.services.text_extraction import TextExtractor
from app.services.document_pii_processor import DocumentPIIProcessor
from app.services.document_storage import DocumentStorage

logger = structlog.get_logger(__name__)

load_dotenv()


class DocumentService:
    """Service for document management and processing using modular components."""
    
    def __init__(self):
        """Initialize document service with modular components."""
        try:
            # Initialize core services
            self.soap_service = SOAPGenerationService()
            
            # Initialize modular components
            self.validator = DocumentValidator()
            self.text_extractor = TextExtractor()
            self.pii_processor = DocumentPIIProcessor()
            self.storage = DocumentStorage()
            
            logger.info("✅ DocumentService initialized successfully with modular components")
            
        except Exception as e:
            logger.error("Failed to initialize DocumentService", error=str(e))
            raise
    
    async def upload_document_direct(
        self, 
        request: DocumentUploadRequest, 
        file: UploadFile
    ) -> DocumentUploadResponse:
        """
        Upload document file directly to local storage and process.
        
        Args:
            request: Document upload request
            file: Uploaded file
            
        Returns:
            DocumentUploadResponse: Upload and processing results
        """
        start_time = time.time()
        
        try:
            logger.info(
                "Starting direct document upload",
                session_id=str(request.session_id),
                filename=file.filename,
                file_size=file.size
            )
            
            # Validate file using validator component
            validation = self.validator.validate_upload_file(file)
            
            if not validation.valid:
                return DocumentUploadResponse(
                    success=False,
                    message=f"File validation failed: {'; '.join(validation.errors)}"
                )
            
            # Verify session exists
            visit_session = await self._verify_session_exists(request.session_id)
            if not visit_session:
                return DocumentUploadResponse(
                    success=False,
                    message="Session not found"
                )
            
            # Generate document ID
            document_id = uuid.uuid4()
            
            # Read file content
            file_content = await file.read()
            upload_time = time.time() - start_time
            
            # Save to local storage using storage component
            try:
                file_path = self.storage.save_file_content(
                    file_content, request.session_id, document_id, file.filename or 'unknown'
                )
                logger.info("✅ File saved to local storage", document_id=str(document_id), file_path=str(file_path))
                
            except Exception as e:
                logger.error("❌ Failed to save file to local storage", error=str(e))
                return DocumentUploadResponse(
                    success=False,
                    message=f"Failed to save file to storage: {str(e)}"
                )
            
            # Create database record
            document = await self._create_document_record(
                document_id, request.session_id, file.filename or 'unknown', str(file_path)
            )
            
            # Process document if requested
            processing_result = await self._process_document_after_upload(
                request, document_id, file_content, file.filename or 'unknown'
            )
            
            processing_time = time.time() - start_time
            
            return DocumentUploadResponse(
                success=True,
                document_id=document_id,
                document_name=file.filename or 'unknown',
                file_size=validation.file_size,
                file_type=validation.file_type,
                file_path=str(file_path),
                text_extracted=processing_result['text_extracted'],
                extracted_text=processing_result['extracted_text'] if request.extract_text else None,
                word_count=processing_result['word_count'],
                soap_note_id=processing_result['soap_note_id'],
                soap_generated=processing_result['soap_generated'],
                pii_masked=processing_result['pii_masked'],
                pii_entities_found=processing_result['pii_entities_found'],
                processing_time=processing_time,
                upload_time=upload_time,
                message="Document uploaded and processed successfully",
                warnings=processing_result['warnings']
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ Direct document upload failed", error=str(e))
            
            return DocumentUploadResponse(
                success=False,
                processing_time=processing_time,
                message=f"Upload failed: {str(e)}"
            )
    
    async def upload_document(self, request: DocumentUploadRequest) -> DocumentUploadResponse:
        """
        Initiate document upload with S3 pre-signed URL.
        
        Args:
            request: Document upload request
            
        Returns:
            DocumentUploadResponse: Upload response with S3 URL
        """
        try:
            logger.info(
                "Starting document upload",
                session_id=str(request.session_id),
                filename=request.document_name,
                file_size=request.file_size
            )
            
            # Validate file using validator component
            validation = self.validator.validate_file(
                request.document_name,
                request.file_size,
                request.file_type
            )
            
            if not validation.valid:
                return DocumentUploadResponse(
                    success=False,
                    message=f"File validation failed: {'; '.join(validation.errors)}"
                )
            
            # Verify session exists
            visit_session = await self._verify_session_exists(request.session_id)
            if not visit_session:
                return DocumentUploadResponse(
                    success=False,
                    message="Session not found"
                )
            
            # Generate document ID and S3 key
            document_id = uuid.uuid4()
            s3_bucket_name = os.getenv("S3_BUCKET_NAME", "echo-notes-documents")
            s3_key = f"documents/{request.session_id}/{document_id}_{request.document_name}"
            
            # Create database record
            await self._create_document_record(
                document_id, request.session_id, request.document_name, 
                s3_upload_link=f"s3://{s3_bucket_name}/{s3_key}"
            )
            
            # Generate S3 pre-signed upload URL (if S3 client is available)
            s3_upload_url, s3_upload_fields = await self._generate_s3_upload_url(
                s3_bucket_name, s3_key, request.file_type
            )
            
            max_file_size_bytes = self.validator.get_max_file_size_bytes()
            allowed_file_types = self.validator.get_allowed_file_types()
            
            return DocumentUploadResponse(
                success=True,
                document_id=document_id,
                s3_upload_url=s3_upload_url,
                s3_upload_fields=s3_upload_fields,
                max_file_size=max_file_size_bytes,
                allowed_types=allowed_file_types,
                message="Upload URL generated successfully"
            )
            
        except Exception as e:
            logger.error("❌ Document upload initiation failed", error=str(e))
            return DocumentUploadResponse(
                success=False,
                message=f"Upload initiation failed: {str(e)}"
            )
    
    async def process_document(self, request: DocumentProcessRequest) -> DocumentProcessResponse:
        """
        Process uploaded document (extract text and generate SOAP note).
        
        Args:
            request: Document processing request
            
        Returns:
            DocumentProcessResponse: Processing results
        """
        start_time = time.time()
        
        try:
            logger.info("Starting document processing", document_id=str(request.document_id))
            
            # Get document from database
            document = await self._get_document_by_id(request.document_id)
            if not document:
                return DocumentProcessResponse(
                    success=False,
                    document_id=request.document_id,
                    message="Document not found"
                )
            
            # Extract text content
            extracted_text = ""
            extraction_time = 0.0
            text_result = None
            
            if request.extract_text:
                extraction_start = time.time()
                text_result = await self._extract_text_from_document(document)
                extraction_time = time.time() - extraction_start
                
                if text_result.text:
                    extracted_text = text_result.text
                    logger.info(
                        "✅ Text extracted successfully",
                        document_id=str(request.document_id),
                        word_count=text_result.word_count
                    )
            
            # Generate SOAP note if requested and text extracted
            soap_result = await self._generate_soap_note_if_requested(
                request, document, extracted_text
            )
            
            processing_time = time.time() - start_time
            
            # Get PII information from text extraction
            pii_masked = False
            pii_entities_found = 0
            if text_result and hasattr(text_result, 'pii_masked'):
                pii_masked = text_result.pii_masked
                pii_entities_found = text_result.pii_entities_found
            
            return DocumentProcessResponse(
                success=True,
                document_id=request.document_id,
                extracted_text=extracted_text if request.extract_text else None,
                page_count=text_result.page_count if text_result else 0,
                word_count=text_result.word_count if text_result else 0,
                soap_note_id=soap_result['soap_note_id'],
                soap_generated=soap_result['soap_generated'],
                soap_approved=soap_result['soap_approved'],
                processing_time=processing_time,
                extraction_time=extraction_time,
                soap_generation_time=soap_result['soap_generation_time'],
                pii_masked=pii_masked,
                pii_entities_found=pii_entities_found,
                message="Document processed successfully"
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ Document processing failed", error=str(e), document_id=str(request.document_id))
            
            return DocumentProcessResponse(
                success=False,
                document_id=request.document_id,
                processing_time=processing_time,
                message=f"Processing failed: {str(e)}"
            )
    
    async def get_document_metadata(self, document_id: uuid.UUID) -> Optional[DocumentMetadataResponse]:
        """
        Get document metadata.
        
        Args:
            document_id: Document ID
            
        Returns:
            DocumentMetadataResponse: Document metadata or None
        """
        async with async_session_maker() as session:
            try:
                document = await self._get_document_by_id(document_id, session)
                if not document:
                    return None
                
                # Get file size from file system using storage component
                file_size = 0
                if document.file_path and self.storage.file_exists(document.file_path):
                    file_size = self.storage.get_file_size(document.file_path)
                
                # Extract file type from filename using storage component
                file_type = self.storage.get_file_type_from_filename(document.document_name)
                
                return DocumentMetadataResponse(
                    document_id=document.document_id,
                    session_id=document.session_id,
                    document_name=document.document_name,
                    file_size=file_size,
                    file_type=file_type,
                    file_path=document.file_path,
                    upload_status=document.processing_status or "pending",
                    processed=document.text_extracted,
                    text_extracted=document.text_extracted,
                    soap_generated=False,  # TODO: Check if SOAP note exists
                    created_at=document.created_at.isoformat(),
                    updated_at=document.updated_at.isoformat(),
                    processed_at=document.processed_at.isoformat() if document.processed_at else None
                )
                
            except Exception as e:
                logger.error("Failed to get document metadata", error=str(e))
                return None
    
    async def list_session_documents(self, session_id: uuid.UUID, page: int = 1, page_size: int = 20) -> DocumentListResponse:
        """
        List documents for a session.
        
        Args:
            session_id: Session ID
            page: Page number
            page_size: Number of items per page
            
        Returns:
            DocumentListResponse: List of documents
        """
        async with async_session_maker() as session:
            try:
                # Get total count
                count_stmt = select(UploadedDocuments).where(
                    UploadedDocuments.session_id == session_id
                )
                count_result = await session.execute(count_stmt)
                total_count = len(count_result.fetchall())
                
                # Get paginated documents
                offset = (page - 1) * page_size
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.session_id == session_id
                ).order_by(
                    UploadedDocuments.created_at.desc()
                ).offset(offset).limit(page_size)
                
                result = await session.execute(stmt)
                documents = result.scalars().all()
                
                # Convert to response objects
                document_responses = []
                for doc in documents:
                    # Get file size from file system using storage component
                    file_size = 0
                    if doc.file_path and self.storage.file_exists(doc.file_path):
                        file_size = self.storage.get_file_size(doc.file_path)
                    
                    # Extract file type from filename using storage component
                    file_type = self.storage.get_file_type_from_filename(doc.document_name)
                    
                    doc_response = DocumentMetadataResponse(
                        document_id=doc.document_id,
                        session_id=doc.session_id,
                        document_name=doc.document_name,
                        file_size=file_size,
                        file_type=file_type,
                        file_path=doc.file_path,
                        upload_status=doc.processing_status or "pending",
                        processed=doc.text_extracted,
                        text_extracted=doc.text_extracted,
                        soap_generated=False,  # TODO: Check if SOAP note exists
                        created_at=doc.created_at.isoformat(),
                        updated_at=doc.updated_at.isoformat(),
                        processed_at=doc.processed_at.isoformat() if doc.processed_at else None
                    )
                    document_responses.append(doc_response)
                
                return DocumentListResponse(
                    documents=document_responses,
                    total_count=total_count,
                    page=page,
                    page_size=page_size,
                    session_id=session_id
                )
                
            except Exception as e:
                logger.error("Failed to list session documents", error=str(e))
                return DocumentListResponse(
                    documents=[],
                    total_count=0,
                    page=page,
                    page_size=page_size,
                    session_id=session_id
                )
    
    # Private helper methods
    
    async def _verify_session_exists(self, session_id: uuid.UUID) -> Optional[PatientVisitSessions]:
        """Verify that a session exists in the database."""
        async with async_session_maker() as session:
            stmt = select(PatientVisitSessions).where(
                PatientVisitSessions.session_id == session_id
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
    
    async def _create_document_record(self, document_id: uuid.UUID, session_id: uuid.UUID, 
                                    document_name: str, file_path: str, s3_upload_link: str = None) -> UploadedDocuments:
        """Create a document record in the database."""
        async with async_session_maker() as session:
            document = UploadedDocuments(
                document_id=document_id,
                session_id=session_id,
                document_name=document_name,
                file_path=file_path,
                s3_upload_link=s3_upload_link
            )
            
            session.add(document)
            await session.commit()
            
            logger.info("✅ Document record created", document_id=str(document_id))
            return document
    
    async def _process_document_after_upload(self, request: DocumentUploadRequest, document_id: uuid.UUID, 
                                           file_content: bytes, filename: str) -> dict:
        """Process document after upload (text extraction, PII, SOAP generation)."""
        result = {
            'text_extracted': False,
            'extracted_text': '',
            'word_count': 0,
            'soap_note_id': None,
            'soap_generated': False,
            'pii_masked': False,
            'pii_entities_found': 0,
            'warnings': []
        }
        
        if not request.extract_text:
            return result
        
        try:
            # Extract text using text extractor component
            text_result = self.text_extractor.extract_text_from_file_content(file_content, filename)
            
            if text_result.text:
                # Process PII using PII processor component
                processed_result = await self.pii_processor.process_extraction_result_for_pii(
                    text_result, str(document_id)
                )
                
                result['extracted_text'] = processed_result.text
                result['word_count'] = processed_result.word_count
                result['text_extracted'] = True
                result['pii_masked'] = processed_result.pii_masked
                result['pii_entities_found'] = processed_result.pii_entities_found
                result['warnings'].extend(processed_result.warnings)
                
                # Update document record with extracted text and PII info
                await self._update_document_with_text(
                    document_id, processed_result.text, processed_result.word_count,
                    processed_result.pii_masked, processed_result.pii_entities_found
                )
                
                # Generate SOAP note if requested
                if request.generate_soap:
                    soap_result = await self._generate_soap_note(
                        request.session_id, document_id, processed_result.text
                    )
                    result['soap_note_id'] = soap_result['soap_note_id']
                    result['soap_generated'] = soap_result['soap_generated']
                    result['warnings'].extend(soap_result['warnings'])
            
        except Exception as e:
            logger.error("❌ Text extraction failed", error=str(e))
            result['warnings'].append(f"Text extraction error: {str(e)}")
            
            # Update document record with failure status
            await self._update_document_status(document_id, "failed")
        
        return result
    
    async def _update_document_with_text(self, document_id: uuid.UUID, extracted_text: str, 
                                       word_count: int, pii_masked: bool, pii_entities_found: int):
        """Update document record with extracted text and PII information."""
        async with async_session_maker() as session:
            stmt = select(UploadedDocuments).where(
                UploadedDocuments.document_id == document_id
            )
            result = await session.execute(stmt)
            document = result.scalar_one_or_none()
            
            if document:
                document.extracted_text = extracted_text
                document.text_extracted = True
                document.word_count = word_count
                document.processing_status = "completed"
                document.processed_at = datetime.now()
                
                await session.commit()
                logger.info("✅ Document record updated with extracted text and PII info", 
                           document_id=str(document_id),
                           pii_masked=pii_masked,
                           pii_entities_found=pii_entities_found)
    
    async def _update_document_status(self, document_id: uuid.UUID, status: str):
        """Update document processing status."""
        async with async_session_maker() as session:
            stmt = select(UploadedDocuments).where(
                UploadedDocuments.document_id == document_id
            )
            result = await session.execute(stmt)
            document = result.scalar_one_or_none()
            
            if document:
                document.processing_status = status
                document.processed_at = datetime.now()
                await session.commit()
    
    async def _generate_soap_note(self, session_id: uuid.UUID, document_id: uuid.UUID, text: str) -> dict:
        """Generate SOAP note from extracted text."""
        result = {
            'soap_note_id': None,
            'soap_generated': False,
            'warnings': []
        }
        
        try:
            logger.info("🔊 jaidev: SOAP START", document_id=str(document_id))
            soap_request = SOAPGenerationRequest(
                text=text,
                session_id=session_id,
                document_id=document_id,
                include_context=True
            )
            
            soap_response = await self.soap_service.generate_soap_note(soap_request)
            
            if soap_response.success:
                result['soap_note_id'] = soap_response.note_id
                result['soap_generated'] = True
                
                logger.info(
                    "🔊 jaidev: SOAP END (success)",
                    document_id=str(document_id),
                    soap_note_id=str(soap_response.note_id)
                )
            else:
                result['warnings'].append("SOAP note generation failed")
                
        except Exception as e:
            logger.error("🔊 jaidev: SOAP ERROR", error=str(e))
            result['warnings'].append(f"SOAP generation error: {str(e)}")
        
        return result
    
    async def _generate_s3_upload_url(self, s3_bucket_name: str, s3_key: str, file_type: str) -> tuple:
        """Generate S3 pre-signed upload URL (placeholder for future S3 integration)."""
        # This is a placeholder for S3 integration
        # In the original code, there was S3 client logic here
        # For now, we'll return None values
        return None, None
    
    async def _get_document_by_id(self, document_id: uuid.UUID, session: AsyncSession = None) -> Optional[UploadedDocuments]:
        """Get document by ID from database."""
        if not session:
            async with async_session_maker() as session:
                return await self._get_document_by_id(document_id, session)
        
        stmt = select(UploadedDocuments).where(
            UploadedDocuments.document_id == document_id
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _extract_text_from_document(self, document: UploadedDocuments) -> TextExtractionResult:
        """Extract text content from document using text extractor component."""
        try:
            # For demo purposes, use document name to simulate text extraction
            # In real implementation, download from S3 and extract text
            text_result = self.text_extractor.extract_text_from_document_name(document.document_name)
            
            # Process PII using PII processor component
            processed_result = await self.pii_processor.process_extraction_result_for_pii(
                text_result, str(document.document_id)
            )
            
            return processed_result
            
        except Exception as e:
            logger.error("Text extraction failed", error=str(e))
            return TextExtractionResult(
                text="",
                confidence=0.0,
                page_count=0,
                word_count=0,
                extraction_method="failed",
                ocr_used=False,
                text_quality_score=0.0,
                warnings=[f"Extraction failed: {str(e)}"],
                pii_masked=False,
                pii_entities_found=0
            )
    
    async def _generate_soap_note_if_requested(self, request: DocumentProcessRequest, 
                                             document: UploadedDocuments, extracted_text: str) -> dict:
        """Generate SOAP note if requested and text is available."""
        result = {
            'soap_note_id': None,
            'soap_generated': False,
            'soap_approved': False,
            'soap_generation_time': 0.0
        }
        
        if not request.generate_soap or not extracted_text:
            return result
        
        soap_start = time.time()
        
        try:
            soap_request = SOAPGenerationRequest(
                text=extracted_text,
                session_id=document.session_id,
                document_id=document.document_id,
                include_context=True
            )
            
            soap_response = await self.soap_service.generate_soap_note(soap_request)
            result['soap_generation_time'] = time.time() - soap_start
            
            if soap_response.success:
                result['soap_note_id'] = soap_response.note_id
                result['soap_generated'] = True
                result['soap_approved'] = soap_response.ai_approved
                
                logger.info(
                    "✅ SOAP note generated successfully",
                    document_id=str(document.document_id),
                    soap_note_id=str(soap_response.note_id),
                    ai_approved=soap_response.ai_approved
                )
                
        except Exception as e:
            logger.error("SOAP generation failed", error=str(e))
            result['soap_generation_time'] = time.time() - soap_start
        
        return result
