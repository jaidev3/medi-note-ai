"""
Document Validation Service
Handles file validation logic for document uploads
"""
import os
import mimetypes
from typing import List
from fastapi import UploadFile
from app.schemas.document_schemas import FileValidationResult
import structlog

logger = structlog.get_logger(__name__)


class DocumentValidator:
    """Service for validating document files"""
    
    @staticmethod
    def validate_upload_file(file: UploadFile) -> FileValidationResult:
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
    
    @staticmethod
    def validate_file(file_name: str, file_size: int, file_type: str) -> FileValidationResult:
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
    
    @staticmethod
    def get_allowed_file_types() -> List[str]:
        """Get list of allowed file types from environment"""
        allowed_file_types = os.getenv("ALLOWED_FILE_TYPES", "pdf,docx,txt")
        return [ft.strip().lower() for ft in allowed_file_types.split(",")]
    
    @staticmethod
    def get_max_file_size_bytes() -> int:
        """Get maximum file size in bytes from environment"""
        max_file_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        return max_file_size_mb * 1024 * 1024