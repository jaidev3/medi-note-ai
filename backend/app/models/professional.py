from enum import Enum
from typing import Optional
from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.db import Base


class ProfessionalRole(str, Enum):
    AUDIOLOGISTS = "AUDIOLOGISTS"
    HEARING_AID_SPECIALISTS = "HEARING_AID_SPECIALISTS"
    ENT_PHYSICIANS = "ENT_PHYSICIANS"
    CLINICAL_SUPPORT_STAFF = "CLINICAL_SUPPORT_STAFF"


class Professional(Base):
    """SQLAlchemy model for the professional table."""
    __tablename__ = "professional"

    id: UUID = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    role: ProfessionalRole = Column(SAEnum(ProfessionalRole, name="professional_role"), nullable=False)
    department: Optional[str] = Column(String(100), nullable=True)
    employee_id: Optional[str] = Column(String(50), nullable=True, unique=True)
    name: str = Column(String(150), nullable=False)
    phone_number: Optional[str] = Column(String(20), nullable=True)
    email: str = Column(String(150), nullable=False)
    password_hash: str = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    visit_sessions = relationship("PatientVisitSessions", back_populates="professional")
    soap_notes = relationship("SessionSoapNotes", back_populates="professional")
    
    def __repr__(self) -> str:
        return f"<Professional(id={self.id}, name={self.name}, role={self.role})>"
