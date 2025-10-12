"""Repository for Uploaded Documents.

Provides async database access methods for document management.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.uploaded_documents import UploadedDocuments


class UploadedDocumentsRepository:
    """Repository wrapper around UploadedDocuments model using an AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_document_by_id(self, document_id: UUID) -> Optional[UploadedDocuments]:
        """Return a single document by UUID or None if not found."""
        stmt = select(UploadedDocuments).where(UploadedDocuments.document_id == document_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_document(
        self,
        session_id: UUID,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        uploaded_by: Optional[UUID] = None,
        extracted_text: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> UploadedDocuments:
        """Create a new document record. Caller must commit."""
        document = UploadedDocuments(
            session_id=session_id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            extracted_text=extracted_text,
            metadata=metadata or {}
        )
        self.session.add(document)
        return document

    async def update_document_text(
        self,
        document_id: UUID,
        extracted_text: str,
        metadata: Optional[dict] = None
    ) -> Optional[UploadedDocuments]:
        """Update the extracted text and metadata for a document."""
        document = await self.get_document_by_id(document_id)
        if not document:
            return None
        
        document.extracted_text = extracted_text
        if metadata is not None:
            document.metadata = metadata
        
        return document

    async def delete_document(self, document_id: UUID) -> bool:
        """Delete a document by ID. Returns True if deleted, False if not found. Caller must commit."""
        document = await self.get_document_by_id(document_id)
        if not document:
            return False
        await self.session.delete(document)
        return True

    async def list_documents_by_session(
        self,
        session_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[UploadedDocuments], int]:
        """List documents for a session with pagination. Returns (documents, total_count)."""
        # Get total count
        count_stmt = select(func.count(UploadedDocuments.document_id)).where(
            UploadedDocuments.session_id == session_id
        )
        count_result = await self.session.execute(count_stmt)
        total_count = count_result.scalar() or 0
        
        # Get documents with pagination
        offset = (page - 1) * page_size
        stmt = select(UploadedDocuments).where(
            UploadedDocuments.session_id == session_id
        ).order_by(
            UploadedDocuments.created_at.desc()
        ).offset(offset).limit(page_size)
        
        result = await self.session.execute(stmt)
        documents = result.scalars().all()
        
        return list(documents), total_count

    async def get_session_document_count(self, session_id: UUID) -> int:
        """Return the count of documents for a session."""
        stmt = select(func.count(UploadedDocuments.document_id)).where(
            UploadedDocuments.session_id == session_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
