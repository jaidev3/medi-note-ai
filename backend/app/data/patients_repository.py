"""Repository for Patients.

Provides async database access methods for patient management.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.models.patient_visit_sessions import PatientVisitSessions


class PatientsRepository:
    """Repository wrapper around Patients model using an AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_patient_by_id(self, patient_id: UUID) -> Optional[User]:
        """Return a single patient by UUID or None if not found."""
        stmt = select(User).where(User.id == patient_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_patient_by_email(self, email: str) -> Optional[User]:
        """Return a patient by email (case-insensitive) or None."""
        stmt = select(User).where(func.lower(User.email) == email.lower())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_patient(self, name: str, email: Optional[str] = None, 
                           phone: Optional[str] = None, address: Optional[str] = None) -> User:
        """Create a new patient. Caller must commit."""
        patient = User(
            name=name,
            email=email.lower() if email else None,
            phone=phone,
            address=address
        )
        self.session.add(patient)
        return patient

    async def update_patient(self, patient: User, name: Optional[str] = None,
                           email: Optional[str] = None, phone: Optional[str] = None,
                           address: Optional[str] = None) -> User:
        """Update patient fields. Caller must commit."""
        if name is not None:
            patient.name = name
        if email is not None:
            patient.email = email.lower()
        if phone is not None:
            patient.phone = phone
        if address is not None:
            patient.address = address
        return patient

    async def list_patients(self, page: int = 1, page_size: int = 20, 
                          search: Optional[str] = None) -> tuple[List[User], int]:
        """List patients with pagination and optional search. Returns (patients, total_count)."""
        stmt = select(User)
        
        # Add search filter
        if search:
            search_term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(User.name).like(search_term),
                    func.lower(User.email).like(search_term)
                )
            )
        
        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.session.execute(count_stmt)
        total_count = count_result.scalar() or 0
        
        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.order_by(User.name.asc()).offset(offset).limit(page_size)
        
        result = await self.session.execute(stmt)
        patients = result.scalars().all()
        
        return list(patients), total_count

    async def get_patient_visit_count(self, patient_id: UUID) -> int:
        """Return the total number of visits for a patient."""
        stmt = select(func.count(PatientVisitSessions.session_id)).where(
            PatientVisitSessions.patient_id == patient_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def get_patient_last_visit(self, patient_id: UUID):
        """Return the last visit date for a patient or None."""
        stmt = select(func.max(PatientVisitSessions.visit_date)).where(
            PatientVisitSessions.patient_id == patient_id
        )
        result = await self.session.execute(stmt)
        return result.scalar()
