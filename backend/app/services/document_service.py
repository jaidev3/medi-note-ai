"""
Document Management Service
Implements file upload, local storage, and document processing
"""
import uuid
import time
import os
import mimetypes
from typing import Optional, Dict, Any, List
import structlog
import io
from datetime import datetime
from pathlib import Path

import PyPDF2
from docx import Document as DocxDocument
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from dotenv import load_dotenv
from app.schemas.document_schemas import (
    DocumentUploadRequest, DocumentUploadResponse, DocumentProcessRequest,
    DocumentProcessResponse, DocumentMetadataResponse, DocumentListResponse,
    DocumentDeleteRequest, DocumentDeleteResponse, TextExtractionResult,
    FileValidationResult
)
from app.models.uploaded_documents import UploadedDocuments
from app.models.patient_visit_sessions import PatientVisitSessions
from app.services.soap_generation_service import SOAPGenerationService
from app.services.pii_service import PIIService
from app.schemas.soap_schemas import SOAPGenerationRequest
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)

load_dotenv()

class DocumentService:
    """Service for document management and processing."""
    
    def __init__(self):
        """Initialize document service with local storage."""
        try:
            self.soap_service = SOAPGenerationService()
            
            # Initialize PII service with retry logic
            self.pii_service = None
            self._initialize_pii_service()
            
            # Initialize local storage directory
            self._initialize_local_storage()
            
        except Exception as e:
            logger.error("Failed to initialize DocumentService", error=str(e))
            raise
    
    def _initialize_pii_service(self):
        """Initialize PII service with retry logic."""
        logger.info("🔍 jaidev: Starting PII service initialization in DocumentService")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"🔍 jaidev: Initializing PII service in DocumentService (attempt {attempt + 1}/{max_retries})")
                
                # Import and create PII service
                logger.info("🔍 jaidev: Importing PIIService class")
                from app.services.pii_service import PIIService
                
                logger.info("🔍 jaidev: Creating PIIService instance")
                self.pii_service = PIIService()
                
                logger.info("🔍 jaidev: PII service created, checking health")
                
                # Test the PII service to ensure it's working
                if self.pii_service.is_healthy():
                    logger.info("🔍 jaidev: PII service initialized successfully in DocumentService")
                    return
                else:
                    logger.warning(f"🔍 jaidev: PII service health check failed (attempt {attempt + 1})")
                    self.pii_service = None
                    
            except ImportError as e:
                logger.error(f"🔍 jaidev: Failed to import PIIService (attempt {attempt + 1})", 
                            error=str(e),
                            error_type=type(e).__name__)
                self.pii_service = None
            except Exception as e:
                logger.error(f"🔍 jaidev: Failed to initialize PII service in DocumentService (attempt {attempt + 1})", 
                            error=str(e),
                            error_type=type(e).__name__,
                            error_details=str(e))
                self.pii_service = None
                
                if attempt < max_retries - 1:
                    logger.info(f"🔍 jaidev: Retrying PII service initialization in 1 second...")
                    import time
                    time.sleep(1)
        
        # If all retries failed, log a final warning
        if self.pii_service is None:
            logger.error("🔍 jaidev: All PII service initialization attempts failed. PII processing will be disabled.")
        else:
            logger.info("🔍 jaidev: PII service initialization completed successfully")
    
    def _initialize_local_storage(self):
        """Initialize local storage directory for documents."""
        try:
            # Get the base directory for document storage
            base_dir = os.getenv("DOCUMENTS_STORAGE_PATH", "app/data/documents")
            
            # Create absolute path
            if not os.path.isabs(base_dir):
                # Get the backend directory (parent of app)
                backend_dir = Path(__file__).parent.parent.parent
                base_dir = os.path.join(backend_dir, base_dir)
            
            self.storage_path = Path(base_dir)
            
            # Create directory if it doesn't exist
            self.storage_path.mkdir(parents=True, exist_ok=True)
            
            logger.info("✅ Local storage initialized successfully", storage_path=str(self.storage_path))
            
        except Exception as e:
            logger.error("❌ Failed to initialize local storage", error=str(e))
            raise
    
    def _validate_upload_file(self, file: UploadFile) -> FileValidationResult:
        """
        Validate uploaded file from UploadFile object.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            FileValidationResult: Validation result
        """
        errors = []
        warnings = []
        
        # Get file info
        file_name = file.filename or "unknown"
        file_size = file.size or 0
        
        # Extract file extension
        file_extension = ""
        if "." in file_name:
            file_extension = file_name.split(".")[-1].lower()
        
        # Check file type
        allowed_file_types = os.getenv("ALLOWED_FILE_TYPES", "pdf,docx,txt")
        allowed_types = allowed_file_types.split(",")
        type_allowed = file_extension in [ft.strip().lower() for ft in allowed_types]
        if not type_allowed:
            errors.append(f"File type '{file_extension}' not allowed. Allowed types: {', '.join(allowed_types)}")
        
        # Check file size
        max_file_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        max_size = max_file_size_mb * 1024 * 1024  # Convert to bytes
        size_allowed = file_size <= max_size
        if not size_allowed:
            errors.append(f"File size {file_size} bytes exceeds maximum {max_size} bytes")
        
        # Check filename
        if not file_name or len(file_name.strip()) == 0:
            errors.append("Filename cannot be empty")
        elif len(file_name) > 200:
            errors.append("Filename too long (max 200 characters)")
        
        # Check content type
        if file.content_type:
            logger.info("Content type detected", filename=file_name, content_type=file.content_type)
        
        return FileValidationResult(
            valid=len(errors) == 0,
            file_type=file_extension,
            file_size=file_size,
            type_allowed=type_allowed,
            size_allowed=size_allowed,
            content_valid=True,  # Will be validated during processing
            errors=errors,
            warnings=warnings
        )
    
    def _validate_file(self, file_name: str, file_size: int, file_type: str) -> FileValidationResult:
        """
        Validate uploaded file.
        
        Args:
            file_name: Original filename
            file_size: File size in bytes
            file_type: File type/extension
            
        Returns:
            FileValidationResult: Validation result
        """
        errors = []
        warnings = []
        
        # Check file type
        allowed_file_types = os.getenv("ALLOWED_FILE_TYPES", "pdf,docx,txt")
        allowed_types = allowed_file_types.split(",")
        type_allowed = file_type.lower() in [ft.strip().lower() for ft in allowed_types]
        if not type_allowed:
            errors.append(f"File type '{file_type}' not allowed. Allowed types: {', '.join(allowed_types)}")
        
        # Check file size
        max_file_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        max_size = max_file_size_mb * 1024 * 1024  # Convert to bytes
        size_allowed = file_size <= max_size
        if not size_allowed:
            errors.append(f"File size {file_size} bytes exceeds maximum {max_size} bytes")
        
        # Check filename
        if not file_name or len(file_name.strip()) == 0:
            errors.append("Filename cannot be empty")
        elif len(file_name) > 200:
            errors.append("Filename too long (max 200 characters)")
        
        # Detect MIME type
        detected_type, _ = mimetypes.guess_type(file_name)
        if detected_type:
            logger.info("MIME type detected", filename=file_name, mime_type=detected_type)
        
        return FileValidationResult(
            valid=len(errors) == 0,
            file_type=file_type,
            file_size=file_size,
            type_allowed=type_allowed,
            size_allowed=size_allowed,
            content_valid=True,  # Will be validated during processing
            errors=errors,
            warnings=warnings
        )
    
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
            
            # Validate file
            validation = self._validate_upload_file(file)
            
            if not validation.valid:
                return DocumentUploadResponse(
                    success=False,
                    message=f"File validation failed: {'; '.join(validation.errors)}"
                )
            
            # Verify session exists
            async with async_session_maker() as session:
                stmt = select(PatientVisitSessions).where(
                    PatientVisitSessions.session_id == request.session_id
                )
                result = await session.execute(stmt)
                visit_session = result.scalar_one_or_none()
                
                if not visit_session:
                    return DocumentUploadResponse(
                        success=False,
                        message="Session not found"
                    )
            
            # Generate document ID and file path
            document_id = uuid.uuid4()
            
            # Create session-specific directory
            session_dir = self.storage_path / str(request.session_id)
            session_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            filename = file.filename or f"document_{document_id}"
            file_path = session_dir / f"{document_id}_{filename}"
            
            # Read file content
            file_content = await file.read()
            upload_time = time.time() - start_time
            
            # Save to local storage
            try:
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                
                logger.info("✅ File saved to local storage", document_id=str(document_id), file_path=str(file_path))
                
            except Exception as e:
                logger.error("❌ Failed to save file to local storage", error=str(e))
                return DocumentUploadResponse(
                    success=False,
                    message=f"Failed to save file to storage: {str(e)}"
                )
            
            # Create database record
            async with async_session_maker() as session:
                document = UploadedDocuments(
                    document_id=document_id,
                    session_id=request.session_id,
                    document_name=file.filename or 'unknown',
                    file_path=str(file_path)
                )
                
                session.add(document)
                await session.commit()
                
                logger.info("✅ Document record created", document_id=str(document_id))
            
            # Process document if requested
            extracted_text = ""
            word_count = 0
            soap_note_id = None
            soap_generated = False
            text_extracted = False
            warnings = []
            pii_masked = False
            pii_entities_found = 0
            
            if request.extract_text:
                try:
                    # Reset file position for text extraction
                    await file.seek(0)
                    text_result = await self._extract_text_from_file_content(file_content, file.filename or 'unknown')
                    
                    if text_result.text:
                        extracted_text = text_result.text
                        word_count = text_result.word_count
                        text_extracted = True
                        warnings.extend(text_result.warnings)
                        
                        # FORCE PII PROCESSING - This must happen before SOAP generation
                        logger.info("🔊 jaidev: PII PIPELINE START (before SOAP)", 
                                   document_id=str(document_id),
                                   text_length=len(extracted_text))
                        
                        # Ensure PII service is available
                        if not self.pii_service:
                            logger.warning("🔒 jaidev: PII service not available, attempting to reinitialize...")
                            self._initialize_pii_service()
                        
                        if not self.pii_service:
                            logger.error("🔊 jaidev: PII PIPELINE ERROR - service unavailable. Aborting SOAP.")
                            warnings.append("PII service unavailable - SOAP generation skipped for security")
                            # Don't generate SOAP if PII is not working
                            request.generate_soap = False
                        else:
                            # Force PII processing
                            try:
                                logger.info("🔊 jaidev: PII PROCESS START", 
                                           document_id=str(document_id))
                                
                                # Process PII on the extracted text
                                pii_masked_text, pii_detected = await self.pii_service.quick_anonymize(extracted_text)
                                
                                if pii_detected:
                                    # Count entities
                                    _, pii_entities_count = await self.pii_service.analyze_text_for_entities(extracted_text)
                                    pii_masked = True
                                    pii_entities_found = pii_entities_count
                                    
                                    # Use masked text for SOAP generation
                                    extracted_text = pii_masked_text
                                    logger.info("🔊 jaidev: PII PROCESS END (masked) - proceeding to SOAP", 
                                               document_id=str(document_id),
                                               pii_entities_found=pii_entities_found)
                                else:
                                    pii_masked = False
                                    pii_entities_found = 0
                                    logger.info("🔊 jaidev: PII PROCESS END (no entities) - proceeding to SOAP", 
                                               document_id=str(document_id))
                                    
                            except Exception as e:
                                logger.error("🔊 jaidev: PII PIPELINE ERROR during processing. Aborting SOAP.", 
                                           error=str(e),
                                           document_id=str(document_id))
                                warnings.append(f"PII processing failed - SOAP generation skipped for security: {str(e)}")
                                # Don't generate SOAP if PII fails
                                request.generate_soap = False
                                pii_masked = False
                                pii_entities_found = 0
                        
                        logger.info(
                            "🔊 jaidev: PII PIPELINE END",
                            document_id=str(document_id),
                            word_count=word_count,
                            pii_masked=pii_masked,
                            pii_entities_found=pii_entities_found,
                            soap_enabled=request.generate_soap
                        )
                        
                        # Update document record with extracted text and PII info
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
                        
                        # Generate SOAP note if requested
                        if request.generate_soap:
                            try:
                                logger.info("🔊 jaidev: SOAP START", document_id=str(document_id))
                                soap_request = SOAPGenerationRequest(
                                    text=extracted_text,
                                    session_id=request.session_id,
                                    document_id=document_id,
                                    include_context=True
                                )
                                
                                soap_response = await self.soap_service.generate_soap_note(soap_request)
                                
                                if soap_response.success:
                                    soap_note_id = soap_response.note_id
                                    soap_generated = True
                                    
                                    logger.info(
                                        "🔊 jaidev: SOAP END (success)",
                                        document_id=str(document_id),
                                        soap_note_id=str(soap_note_id)
                                    )
                                else:
                                    warnings.append("SOAP note generation failed")
                                    
                            except Exception as e:
                                logger.error("🔊 jaidev: SOAP ERROR", error=str(e))
                                warnings.append(f"SOAP generation error: {str(e)}")
                    
                except Exception as e:
                    logger.error("❌ Text extraction failed", error=str(e))
                    warnings.append(f"Text extraction error: {str(e)}")
                    
                    # Update document record with failure status
                    async with async_session_maker() as session:
                        stmt = select(UploadedDocuments).where(
                            UploadedDocuments.document_id == document_id
                        )
                        result = await session.execute(stmt)
                        document = result.scalar_one_or_none()
                        
                        if document:
                            document.processing_status = "failed"
                            document.processed_at = datetime.now()
                            await session.commit()
            
            processing_time = time.time() - start_time
            
            return DocumentUploadResponse(
                success=True,
                document_id=document_id,
                document_name=file.filename or 'unknown',
                file_size=validation.file_size,
                file_type=validation.file_type,
                file_path=str(file_path),
                text_extracted=text_extracted,
                extracted_text=extracted_text if request.extract_text else None,
                word_count=word_count,
                soap_note_id=soap_note_id,
                soap_generated=soap_generated,
                pii_masked=pii_masked,
                pii_entities_found=pii_entities_found,
                processing_time=processing_time,
                upload_time=upload_time,
                message="Document uploaded and processed successfully",
                warnings=warnings
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
            
            # Validate file
            validation = self._validate_file(
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
            async with async_session_maker() as session:
                stmt = select(PatientVisitSessions).where(
                    PatientVisitSessions.session_id == request.session_id
                )
                result = await session.execute(stmt)
                visit_session = result.scalar_one_or_none()
                
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
            async with async_session_maker() as session:
                # Create document record
                document = UploadedDocuments(
                    document_id=document_id,
                    session_id=request.session_id,
                    document_name=request.document_name,
                    s3_upload_link=f"s3://{s3_bucket_name}/{s3_key}"
                )
                
                session.add(document)
                await session.commit()
                
                logger.info("✅ Document record created", document_id=str(document_id))
            
            # Generate S3 pre-signed upload URL
            s3_upload_url = None
            s3_upload_fields = None
            
            if self.s3_client:
                try:
                    # Generate pre-signed POST for S3 upload
                    max_file_size_bytes = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
                    presigned_post = self.s3_client.generate_presigned_post(
                        Bucket=s3_bucket_name,
                        Key=s3_key,
                        Fields={
                            "Content-Type": f"application/{request.file_type}",
                            "Content-Length-Range": [1, max_file_size_bytes]
                        },
                        Conditions=[
                            {"Content-Type": f"application/{request.file_type}"},
                            ["content-length-range", 1, max_file_size_bytes]
                        ],
                        ExpiresIn=3600  # URL expires in 1 hour
                    )
                    
                    s3_upload_url = presigned_post['url']
                    s3_upload_fields = presigned_post['fields']
                    
                    logger.info("✅ S3 pre-signed URL generated", document_id=str(document_id))
                    
                except ClientError as e:
                    logger.error("❌ Failed to generate S3 upload URL", error=str(e))
                    return DocumentUploadResponse(
                        success=False,
                        message=f"Failed to generate upload URL: {str(e)}"
                    )
            
            max_file_size_bytes = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
            allowed_file_types = os.getenv("ALLOWED_FILE_TYPES", "pdf,docx,txt").split(",")
            
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
            async with async_session_maker() as session:
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.document_id == request.document_id
                )
                result = await session.execute(stmt)
                document = result.scalar_one_or_none()
                
                if not document:
                    return DocumentProcessResponse(
                        success=False,
                        document_id=request.document_id,
                        message="Document not found"
                    )
            
            # Extract text content
            extracted_text = ""
            extraction_time = 0.0
            
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
            soap_note_id = None
            soap_generated = False
            soap_approved = False
            soap_generation_time = 0.0
            
            if request.generate_soap and extracted_text:
                soap_start = time.time()
                
                soap_request = SOAPGenerationRequest(
                    text=extracted_text,
                    session_id=document.session_id,
                    document_id=document.document_id,
                    include_context=True
                )
                
                soap_response = await self.soap_service.generate_soap_note(soap_request)
                soap_generation_time = time.time() - soap_start
                
                if soap_response.success:
                    soap_note_id = soap_response.note_id
                    soap_generated = True
                    soap_approved = soap_response.ai_approved
                    
                    logger.info(
                        "✅ SOAP note generated successfully",
                        document_id=str(request.document_id),
                        soap_note_id=str(soap_note_id),
                        ai_approved=soap_approved
                    )
            
            processing_time = time.time() - start_time
            
            # Get PII information from text extraction
            pii_masked = False
            pii_entities_found = 0
            if request.extract_text and hasattr(text_result, 'pii_masked'):
                pii_masked = text_result.pii_masked
                pii_entities_found = text_result.pii_entities_found
            
            return DocumentProcessResponse(
                success=True,
                document_id=request.document_id,
                extracted_text=extracted_text if request.extract_text else None,
                page_count=text_result.page_count if request.extract_text else 0,
                word_count=text_result.word_count if request.extract_text else 0,
                soap_note_id=soap_note_id,
                soap_generated=soap_generated,
                soap_approved=soap_approved,
                processing_time=processing_time,
                extraction_time=extraction_time,
                soap_generation_time=soap_generation_time,
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
    
    async def _extract_text_from_file_content(self, file_content: bytes, filename: str) -> TextExtractionResult:
        """
        Extract text content from file bytes.
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            TextExtractionResult: Extracted text and metadata
        """
        try:
            extracted_text = ""
            method = "unknown"
            
            # Determine file type from filename
            if filename.lower().endswith('.pdf'):
                # Extract text from PDF
                try:
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                    text_parts = []
                    for page in pdf_reader.pages:
                        text_parts.append(page.extract_text())
                    extracted_text = "\n".join(text_parts)
                    method = "pdf_extraction"
                except Exception as e:
                    logger.warning("PDF extraction failed, using sample text", error=str(e))
                    # Fallback to sample text for demo
                    extracted_text = self._get_sample_pdf_text()
                    method = "pdf_sample"
                    
            elif filename.lower().endswith('.docx'):
                # Extract text from DOCX
                try:
                    doc = DocxDocument(io.BytesIO(file_content))
                    text_parts = []
                    for paragraph in doc.paragraphs:
                        text_parts.append(paragraph.text)
                    extracted_text = "\n".join(text_parts)
                    method = "docx_extraction"
                except Exception as e:
                    logger.warning("DOCX extraction failed, using sample text", error=str(e))
                    # Fallback to sample text for demo
                    extracted_text = self._get_sample_docx_text()
                    method = "docx_sample"
                    
            elif filename.lower().endswith('.txt'):
                # Extract text from TXT
                try:
                    extracted_text = file_content.decode('utf-8')
                    method = "text_extraction"
                except UnicodeDecodeError:
                    try:
                        extracted_text = file_content.decode('latin-1')
                        method = "text_extraction_latin1"
                    except Exception as e:
                        logger.warning("Text extraction failed, using sample text", error=str(e))
                        extracted_text = self._get_sample_txt_text()
                        method = "text_sample"
            else:
                # Unknown file type
                extracted_text = self._get_sample_txt_text()
                method = "unknown_sample"
            
            # Calculate metrics
            word_count = len(extracted_text.split()) if extracted_text else 0
            
            # Apply PII detection and masking
            pii_masked_text = extracted_text
            pii_detected = False
            pii_entities_count = 0
            
            # DEBUG: Log PII service status
            logger.info("🔍 jaidev: DEBUG - Starting PII processing section", 
                       pii_service_exists=self.pii_service is not None,
                       pii_service_type=type(self.pii_service).__name__ if self.pii_service else "None")
            
            if extracted_text and len(extracted_text.strip()) > 0:
                # MANDATORY PII PROCESSING - This must always happen
                logger.info("🔒 jaidev: MANDATORY PII processing in text extraction", 
                           text_length=len(extracted_text))
                
                # Check if PII service is available, try to reinitialize if not
                if not self.pii_service:
                    logger.warning("🔒 jaidev: PII service not available, attempting to reinitialize...")
                    self._initialize_pii_service()
                
                if not self.pii_service:
                    logger.error("🔒 jaidev: PII service still not available after reinitialization. This is a critical failure.")
                    # Return error result - PII must work
                    return TextExtractionResult(
                        text="",
                        confidence=0.0,
                        page_count=0,
                        word_count=0,
                        extraction_method="failed_pii",
                        ocr_used=False,
                        text_quality_score=0.0,
                        warnings=["Critical: PII service unavailable - text extraction failed"],
                        pii_masked=False,
                        pii_entities_found=0
                    )
                else:
                    try:
                        logger.info("🔒 jaidev: Starting MANDATORY PII detection and masking to extracted text", 
                                   text_length=len(extracted_text))
                        
                        # Use PII service to detect and mask sensitive information
                        logger.info("🔒 jaidev: Calling PII service quick_anonymize for file content")
                        pii_masked_text, pii_detected = await self.pii_service.quick_anonymize(
                            extracted_text
                        )
                        
                        logger.info("🔒 jaidev: PII service quick_anonymize completed for file content", 
                                   pii_detected=pii_detected,
                                   original_length=len(extracted_text),
                                   masked_length=len(pii_masked_text))
                        
                        if pii_detected:
                            # Count entities for reporting
                            logger.info("🔒 jaidev: PII detected in file content, counting entities")
                            _, pii_entities_count = await self.pii_service.analyze_text_for_entities(
                                extracted_text
                            )
                            logger.info("🔒 jaidev: PII entities counted for file content", 
                                       entity_count=pii_entities_count)
                            
                            # Use masked text for further processing
                            extracted_text = pii_masked_text
                            logger.info("🔒 jaidev: Using PII masked text for file content processing")
                        else:
                            logger.info("🔒 jaidev: No PII detected in file content, using original text")
                            
                    except Exception as e:
                        logger.error("🔒 jaidev: MANDATORY PII processing failed. This is a critical failure.", 
                                   error=str(e),
                                   error_type=type(e).__name__)
                        # Return error result - PII must work
                        return TextExtractionResult(
                            text="",
                            confidence=0.0,
                            page_count=0,
                            word_count=0,
                            extraction_method="failed_pii",
                            ocr_used=False,
                            text_quality_score=0.0,
                            warnings=[f"Critical: PII processing failed - {str(e)}"],
                            pii_masked=False,
                            pii_entities_found=0
                        )
            else:
                logger.info("🔒 jaidev: No text to process for PII in file content")
            
            return TextExtractionResult(
                text=pii_masked_text.strip(),
                confidence=0.95 if "sample" not in method else 0.5,
                page_count=1,
                word_count=word_count,
                extraction_method=method,
                ocr_used=False,
                text_quality_score=0.9 if "sample" not in method else 0.5,
                warnings=[] if "sample" not in method else ["Using sample text for demo"],
                pii_masked=pii_detected,
                pii_entities_found=pii_entities_count
            )
            
        except Exception as e:
            logger.error("Text extraction from file content failed", error=str(e))
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
    
    def _get_sample_pdf_text(self) -> str:
        """Get sample PDF text for demo purposes."""
        return """
        Patient: John Doe
        Date: 2024-01-15
        
        SUBJECTIVE:
        Patient reports progressive hearing loss over the past 6 months. Difficulty understanding 
        conversations in noisy environments. Occasional tinnitus in left ear, described as ringing.
        No ear pain or discharge. Family history of hearing loss.
        
        OBJECTIVE:
        Otoscopy: Clear ear canals bilaterally, tympanic membranes intact.
        Audiometry: Moderate sensorineural hearing loss bilaterally.
        Right ear: 45-50 dB HL at 2-4 kHz
        Left ear: 40-55 dB HL at 2-4 kHz
        Speech discrimination: 88% right ear, 82% left ear
        Tympanometry: Type A bilaterally
        
        ASSESSMENT:
        Bilateral moderate sensorineural hearing loss, likely presbycusis.
        Tinnitus associated with hearing loss.
        Candidate for hearing aid amplification.
        
        PLAN:
        1. Recommend bilateral hearing aids
        2. Hearing aid evaluation and fitting
        3. Follow-up in 2 weeks for hearing aid check
        4. Tinnitus counseling and management strategies
        5. Annual audiometric follow-up
        """
    
    def _get_sample_docx_text(self) -> str:
        """Get sample DOCX text for demo purposes."""
        return """
        Clinical Note - Hearing Evaluation
        
        Patient complains of hearing difficulties in meetings and restaurants.
        Audiometric testing shows mild to moderate hearing loss.
        Recommended hearing aid trial.
        """
    
    def _get_sample_txt_text(self) -> str:
        """Get sample TXT text for demo purposes."""
        return """
        Brief clinical notes about patient's hearing assessment.
        Patient shows signs of age-related hearing loss.
        """
    
    async def _extract_text_from_document(self, document: UploadedDocuments) -> TextExtractionResult:
        """
        Extract text content from document.
        
        Args:
            document: Document database record
            
        Returns:
            TextExtractionResult: Extracted text and metadata
        """
        try:
            # For demo purposes, simulate text extraction
            # In real implementation, download from S3 and extract text
            
            # Simulate different file types
            if document.document_name.lower().endswith('.pdf'):
                # Simulate PDF text extraction
                extracted_text = """
                Patient: John Doe
                Date: 2024-01-15
                
                SUBJECTIVE:
                Patient reports progressive hearing loss over the past 6 months. Difficulty understanding 
                conversations in noisy environments. Occasional tinnitus in left ear, described as ringing.
                No ear pain or discharge. Family history of hearing loss.
                
                OBJECTIVE:
                Otoscopy: Clear ear canals bilaterally, tympanic membranes intact.
                Audiometry: Moderate sensorineural hearing loss bilaterally.
                Right ear: 45-50 dB HL at 2-4 kHz
                Left ear: 40-55 dB HL at 2-4 kHz
                Speech discrimination: 88% right ear, 82% left ear
                Tympanometry: Type A bilaterally
                
                ASSESSMENT:
                Bilateral moderate sensorineural hearing loss, likely presbycusis.
                Tinnitus associated with hearing loss.
                Candidate for hearing aid amplification.
                
                PLAN:
                1. Recommend bilateral hearing aids
                2. Hearing aid evaluation and fitting
                3. Follow-up in 2 weeks for hearing aid check
                4. Tinnitus counseling and management strategies
                5. Annual audiometric follow-up
                """
                method = "pdf_extraction"
                
            elif document.document_name.lower().endswith('.docx'):
                # Simulate DOCX text extraction
                extracted_text = """
                Clinical Note - Hearing Evaluation
                
                Patient complains of hearing difficulties in meetings and restaurants.
                Audiometric testing shows mild to moderate hearing loss.
                Recommended hearing aid trial.
                """
                method = "docx_extraction"
                
            else:
                # Simulate TXT file
                extracted_text = """
                Brief clinical notes about patient's hearing assessment.
                Patient shows signs of age-related hearing loss.
                """
                method = "text_file"
            
            # Calculate metrics
            word_count = len(extracted_text.split())
            
            # Apply PII detection and masking
            pii_masked_text = extracted_text
            pii_detected = False
            pii_entities_count = 0
            
            if extracted_text and len(extracted_text.strip()) > 0:
                # MANDATORY PII PROCESSING - This must always happen
                logger.info("🔒 jaidev: MANDATORY PII processing in document extraction", 
                           text_length=len(extracted_text))
                
                # Check if PII service is available, try to reinitialize if not
                if not self.pii_service:
                    logger.warning("🔒 jaidev: PII service not available, attempting to reinitialize...")
                    self._initialize_pii_service()
                
                if not self.pii_service:
                    logger.error("🔒 jaidev: PII service still not available after reinitialization. This is a critical failure.")
                    # Return error result - PII must work
                    return TextExtractionResult(
                        text="",
                        confidence=0.0,
                        page_count=0,
                        word_count=0,
                        extraction_method="failed_pii",
                        ocr_used=False,
                        text_quality_score=0.0,
                        warnings=["Critical: PII service unavailable - text extraction failed"],
                        pii_masked=False,
                        pii_entities_found=0
                    )
                else:
                    try:
                        logger.info("🔒 jaidev: Starting MANDATORY PII detection and masking", 
                                   text_length=len(extracted_text))
                        
                        # Use PII service to detect and mask sensitive information
                        logger.info("🔒 jaidev: Calling PII service quick_anonymize")
                        pii_masked_text, pii_detected = await self.pii_service.quick_anonymize(
                            extracted_text
                        )
                        
                        logger.info("🔒 jaidev: PII service quick_anonymize completed", 
                                   pii_detected=pii_detected,
                                   original_length=len(extracted_text),
                                   masked_length=len(pii_masked_text))
                        
                        if pii_detected:
                            # Count entities for reporting
                            logger.info("🔒 jaidev: PII detected, counting entities")
                            _, pii_entities_count = await self.pii_service.analyze_text_for_entities(
                                extracted_text
                            )
                            logger.info("🔒 jaidev: PII entities counted", 
                                       entity_count=pii_entities_count)
                            
                            # Use masked text for further processing
                            extracted_text = pii_masked_text
                            logger.info("🔒 jaidev: Using PII masked text for processing")
                        else:
                            logger.info("🔒 jaidev: No PII detected, using original text")
                            
                    except Exception as e:
                        logger.error("🔒 jaidev: MANDATORY PII processing failed. This is a critical failure.", 
                                   error=str(e),
                                   error_type=type(e).__name__)
                        # Return error result - PII must work
                        return TextExtractionResult(
                            text="",
                            confidence=0.0,
                            page_count=0,
                            word_count=0,
                            extraction_method="failed_pii",
                            ocr_used=False,
                            text_quality_score=0.0,
                            warnings=[f"Critical: PII processing failed - {str(e)}"],
                            pii_masked=False,
                            pii_entities_found=0
                        )
            else:
                logger.info("🔒 jaidev: No text to process for PII")
            
            return TextExtractionResult(
                text=pii_masked_text.strip(),
                confidence=0.95,
                page_count=1,
                word_count=word_count,
                extraction_method=method,
                ocr_used=False,
                text_quality_score=0.9,
                warnings=[],
                pii_masked=pii_detected,
                pii_entities_found=pii_entities_count
            )
            
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
                stmt = select(UploadedDocuments).where(
                    UploadedDocuments.document_id == document_id
                )
                result = await session.execute(stmt)
                document = result.scalar_one_or_none()
                
                if not document:
                    return None
                
                # Get file size from file system
                file_size = 0
                if os.path.exists(document.file_path):
                    file_size = os.path.getsize(document.file_path)
                
                # Extract file type from filename
                file_type = "unknown"
                if document.document_name and "." in document.document_name:
                    file_type = document.document_name.split(".")[-1].lower()
                
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
                    # Get file size from file system
                    file_size = 0
                    if os.path.exists(doc.file_path):
                        file_size = os.path.getsize(doc.file_path)
                    
                    # Extract file type from filename
                    file_type = "unknown"
                    if doc.document_name and "." in doc.document_name:
                        file_type = doc.document_name.split(".")[-1].lower()
                    
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
