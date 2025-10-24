"""Patient visit sessions model."""
from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship

from app.database.db import Base


class PatientVisitSessions(Base):
    """Patient visit sessions model for tracking patient visits."""
    
    __tablename__ = "patient_visit_sessions"
    
    session_id = Column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    patient_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    professional_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    visit_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="visit_sessions_as_patient")
    professional = relationship("User", foreign_keys=[professional_id], back_populates="visit_sessions_as_professional")
    uploaded_documents = relationship(
        "UploadedDocuments",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    soap_notes = relationship(
        "SessionSoapNotes",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<PatientVisitSessions(session_id={self.session_id}, patient_id={self.patient_id})>"
