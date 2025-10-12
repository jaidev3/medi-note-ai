"""Repository for Patient Visit Sessions.

Provides async database access methods for patient visit session management.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient_visit_sessions import PatientVisitSessions
from app.models.uploaded_documents import UploadedDocuments
from app.models.session_soap_notes import SessionSoapNotes


class PatientVisitSessionsRepository:
    """Repository wrapper around PatientVisitSessions model using an AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_session_by_id(self, session_id: UUID) -> Optional[PatientVisitSessions]:
        """Return a single session by UUID or None if not found."""
        stmt = select(PatientVisitSessions).where(PatientVisitSessions.session_id == session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_session(self, patient_id: UUID, professional_id: Optional[UUID] = None,
                           visit_date: Optional[datetime] = None, 
                           notes: Optional[str] = None) -> PatientVisitSessions:
        """Create a new patient visit session. Caller must commit."""
        session_obj = PatientVisitSessions(
            patient_id=patient_id,
            professional_id=professional_id,
            visit_date=visit_date,
            notes=notes
        )
        self.session.add(session_obj)
        return session_obj

    async def update_session(self, session_obj: PatientVisitSessions,
                           visit_date: Optional[datetime] = None,
                           notes: Optional[str] = None) -> PatientVisitSessions:
        """Update session fields. Caller must commit."""
        if visit_date is not None:
            session_obj.visit_date = visit_date
        if notes is not None:
            session_obj.notes = notes
        return session_obj

    async def delete_session(self, session_id: UUID) -> bool:
        """Delete a session by ID. Returns True if deleted, False if not found. Caller must commit."""
        session_obj = await self.get_session_by_id(session_id)
        if not session_obj:
            return False
        await self.session.delete(session_obj)
        return True

    async def list_sessions(self, page: int = 1, page_size: int = 20,
                          patient_id: Optional[UUID] = None,
                          professional_id: Optional[UUID] = None) -> tuple[List[PatientVisitSessions], int]:
        """List sessions with pagination and filters. Returns (sessions, total_count)."""
        stmt = select(PatientVisitSessions)
        
        # Apply filters
        if patient_id:
            stmt = stmt.where(PatientVisitSessions.patient_id == patient_id)
        if professional_id:
            stmt = stmt.where(PatientVisitSessions.professional_id == professional_id)
        
        # Get total count
        count_stmt = select(func.count(PatientVisitSessions.session_id))
        if patient_id:
            count_stmt = count_stmt.where(PatientVisitSessions.patient_id == patient_id)
        if professional_id:
            count_stmt = count_stmt.where(PatientVisitSessions.professional_id == professional_id)
        
        count_result = await self.session.execute(count_stmt)
        total_count = count_result.scalar() or 0
        
        # Apply pagination and ordering
        offset = (page - 1) * page_size
        stmt = stmt.order_by(PatientVisitSessions.visit_date.desc()).offset(offset).limit(page_size)
        
        result = await self.session.execute(stmt)
        sessions = result.scalars().all()
        
        return list(sessions), total_count

    async def get_session_document_count(self, session_id: UUID) -> int:
        """Return the count of documents for a session."""
        stmt = select(func.count(UploadedDocuments.document_id)).where(
            UploadedDocuments.session_id == session_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def get_session_soap_note_count(self, session_id: UUID) -> int:
        """Return the count of SOAP notes for a session."""
        stmt = select(func.count(SessionSoapNotes.note_id)).where(
            SessionSoapNotes.session_id == session_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
