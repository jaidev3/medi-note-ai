"""Repository for Professional (healthcare providers).

Provides async database access methods for professional/user management.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.professional import Professional


class ProfessionalRepository:
    """Repository wrapper around Professional model using an AsyncSession."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_professional_by_id(self, professional_id: UUID) -> Optional[Professional]:
        """Return a single professional by UUID or None if not found."""
        stmt = select(Professional).where(Professional.id == professional_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_professional_by_email(self, email: str) -> Optional[Professional]:
        """Return a professional by email (case-insensitive) or None."""
        stmt = select(Professional).where(Professional.email.ilike(email.lower()))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_professional(
        self,
        name: str,
        email: str,
        password_hash: str,
        role: Optional[str] = None,
        department: Optional[str] = None,
        employee_id: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> Professional:
        """Create a new professional. Caller must commit."""
        professional = Professional(
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            role=role,
            department=department,
            employee_id=employee_id,
            phone_number=phone_number
        )
        self.session.add(professional)
        return professional

    async def update_professional(
        self,
        professional: Professional,
        name: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        department: Optional[str] = None,
        employee_id: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> Professional:
        """Update professional fields. Caller must commit."""
        if name is not None:
            professional.name = name
        if email is not None:
            professional.email = email.lower()
        if role is not None:
            professional.role = role
        if department is not None:
            professional.department = department
        if employee_id is not None:
            professional.employee_id = employee_id
        if phone_number is not None:
            professional.phone_number = phone_number
        return professional

    async def list_professionals(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Professional], int]:
        """List professionals with pagination. Returns (professionals, total_count)."""
        # Get total count
        count_stmt = select(func.count(Professional.id))
        count_result = await self.session.execute(count_stmt)
        total_count = count_result.scalar() or 0
        
        # Apply pagination
        offset = (page - 1) * page_size
        stmt = select(Professional).order_by(Professional.name.asc()).offset(offset).limit(page_size)
        
        result = await self.session.execute(stmt)
        professionals = result.scalars().all()
        
        return list(professionals), total_count
