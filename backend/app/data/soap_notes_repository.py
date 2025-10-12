"""Repository for Session SOAP notes.

Provides async database access methods used by controllers and services.
"""
from typing import List, Optional
from sqlalchemy import select, and_, join
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session_soap_notes import SessionSoapNotes
from app.models.patient_visit_sessions import PatientVisitSessions


class SOAPNotesRepository:
    """Repository wrapper around SessionSoapNotes model using an AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_soap_note_by_id(self, note_id):
        """Return a single SOAP note by its UUID or None if not found."""
        stmt = select(SessionSoapNotes).where(SessionSoapNotes.note_id == note_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_soap_note_content(self, note_id, content):
        """Update the content JSON for a SOAP note. Returns the updated note or None."""
        note = await self.get_soap_note_by_id(note_id)
        if not note:
            return None

        note.content = content
        # caller is expected to commit
        return note

    async def approve_soap_note(self, note_id, user_approved: bool = True):
        """Set user_approved flag on a note. Returns updated note or None."""
        note = await self.get_soap_note_by_id(note_id)
        if not note:
            return None

        note.user_approved = bool(user_approved)
        # caller is expected to commit
        return note

    async def get_soap_notes_needing_embedding(
        self,
        note_ids: Optional[List] = None,
        session_id: Optional = None,
        patient_id: Optional = None,
    ) -> List[SessionSoapNotes]:
        """Return approved SOAP notes that do not yet have embeddings.

        Filters by explicit note_ids, or session_id, or patient_id when provided.
        """
        conditions = [SessionSoapNotes.user_approved == True, SessionSoapNotes.embedding.is_(None)]

        # If filtering by note ids
        if note_ids:
            conditions.append(SessionSoapNotes.note_id.in_(note_ids))

        # If filtering by session or patient, we'll join with PatientVisitSessions
        if patient_id:
            stmt = (
                select(SessionSoapNotes)
                .join(PatientVisitSessions, SessionSoapNotes.session_id == PatientVisitSessions.session_id)
                .where(and_(*conditions, PatientVisitSessions.patient_id == patient_id))
            )
        elif session_id:
            stmt = select(SessionSoapNotes).where(and_(*conditions, SessionSoapNotes.session_id == session_id))
        else:
            stmt = select(SessionSoapNotes).where(and_(*conditions))

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_session_soap_notes(self, session_id, approved_only: bool = False) -> List[SessionSoapNotes]:
        """List SOAP notes for a session. If approved_only is True, only return user_approved notes."""
        stmt = select(SessionSoapNotes).where(SessionSoapNotes.session_id == session_id)
        if approved_only:
            stmt = stmt.where(SessionSoapNotes.user_approved == True)

        stmt = stmt.order_by(SessionSoapNotes.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_pending_approval_notes(self, professional_id: Optional = None, limit: int = 50) -> List[SessionSoapNotes]:
        """Return notes pending user approval. Optionally filter by professional_id and limit results."""
        stmt = select(SessionSoapNotes).where(SessionSoapNotes.user_approved == False)
        if professional_id:
            stmt = stmt.where(SessionSoapNotes.professional_id == professional_id)

        stmt = stmt.order_by(SessionSoapNotes.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
