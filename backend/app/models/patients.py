"""Patient model."""
from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship

from app.database.db import Base


class Patients(Base):
    """Patient model for storing patient information."""
    
    __tablename__ = "patients"
    
    id = Column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True, unique=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
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
    visit_sessions = relationship(
        "PatientVisitSessions",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Patients(id={self.id}, name={self.name}, email={self.email})>"
