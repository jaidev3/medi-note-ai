"""
Document Storage Service
Handles local storage operations for documents
"""
import os
import uuid
from pathlib import Path
from typing import Optional
import structlog
from fastapi import UploadFile

logger = structlog.get_logger(__name__)


class DocumentStorage:
    """Service for managing document storage operations"""
    
    def __init__(self):
        """Initialize document storage with local storage directory."""
        self.storage_path: Optional[Path] = None
        self._initialize_local_storage()
    
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
    
    def get_storage_path(self) -> Path:
        """Get the storage path"""
        if not self.storage_path:
            raise Exception("Storage not initialized")
        return self.storage_path
    
    def create_session_directory(self, session_id: uuid.UUID) -> Path:
        """
        Create session-specific directory for document storage.
        
        Args:
            session_id: Session ID
            
        Returns:
            Path: Session directory path
        """
        session_dir = self.storage_path / str(session_id)
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir
    
    def generate_file_path(self, session_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> Path:
        """
        Generate unique file path for document.
        
        Args:
            session_id: Session ID
            document_id: Document ID
            filename: Original filename
            
        Returns:
            Path: Generated file path
        """
        session_dir = self.create_session_directory(session_id)
        safe_filename = filename or f"document_{document_id}"
        file_path = session_dir / f"{document_id}_{safe_filename}"
        return file_path
    
    async def save_file(self, file: UploadFile, session_id: uuid.UUID, document_id: uuid.UUID) -> Path:
        """
        Save uploaded file to local storage.
        
        Args:
            file: Uploaded file
            session_id: Session ID
            document_id: Document ID
            
        Returns:
            Path: Path where file was saved
        """
        try:
            # Generate file path
            file_path = self.generate_file_path(session_id, document_id, file.filename)
            
            # Read file content
            file_content = await file.read()
            
            # Save to local storage
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            logger.info("✅ File saved to local storage", 
                       document_id=str(document_id), 
                       file_path=str(file_path))
            
            return file_path
            
        except Exception as e:
            logger.error("❌ Failed to save file to local storage", error=str(e))
            raise
    
    def save_file_content(self, file_content: bytes, session_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> Path:
        """
        Save file content to local storage.
        
        Args:
            file_content: File content as bytes
            session_id: Session ID
            document_id: Document ID
            filename: Original filename
            
        Returns:
            Path: Path where file was saved
        """
        try:
            # Generate file path
            file_path = self.generate_file_path(session_id, document_id, filename)
            
            # Save to local storage
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            logger.info("✅ File content saved to local storage", 
                       document_id=str(document_id), 
                       file_path=str(file_path))
            
            return file_path
            
        except Exception as e:
            logger.error("❌ Failed to save file content to local storage", error=str(e))
            raise
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in storage.
        
        Args:
            file_path: File path to check
            
        Returns:
            bool: True if file exists
        """
        return os.path.exists(file_path)
    
    def get_file_size(self, file_path: str) -> int:
        """
        Get file size in bytes.
        
        Args:
            file_path: File path
            
        Returns:
            int: File size in bytes
        """
        if self.file_exists(file_path):
            return os.path.getsize(file_path)
        return 0
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            file_path: File path to delete
            
        Returns:
            bool: True if file was deleted successfully
        """
        try:
            if self.file_exists(file_path):
                os.remove(file_path)
                logger.info("✅ File deleted from storage", file_path=file_path)
                return True
            else:
                logger.warning("⚠️ File not found for deletion", file_path=file_path)
                return False
        except Exception as e:
            logger.error("❌ Failed to delete file from storage", error=str(e), file_path=file_path)
            return False
    
    def get_file_type_from_filename(self, filename: str) -> str:
        """
        Extract file type from filename.
        
        Args:
            filename: Filename to extract type from
            
        Returns:
            str: File type/extension
        """
        if filename and "." in filename:
            return filename.split(".")[-1].lower()
        return "unknown"