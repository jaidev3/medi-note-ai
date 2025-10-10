"""Uploaded documents model."""
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer,
    Boolean,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship

from app.database.db import Base


class UploadedDocuments(Base):
    """Uploaded documents model for tracking documents uploaded during patient visits."""
    
    __tablename__ = "uploaded_documents"
    
    document_id = Column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    session_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("patient_visit_sessions.session_id", ondelete="CASCADE"),
        nullable=False,
    )
    created_time = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    s3_upload_link = Column(Text, nullable=False)
    document_name = Column(String(200), nullable=False)
    
    # Text extraction fields (added in migration ccc65f2dcc7f)
    extracted_text = Column(Text, nullable=True)
    text_extracted = Column(Boolean, nullable=False, server_default="false")
    word_count = Column(Integer, nullable=True)
    processing_status = Column(String(50), nullable=False, server_default="pending")
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
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
    session = relationship("PatientVisitSessions", back_populates="uploaded_documents")
    soap_notes = relationship(
        "SessionSoapNotes",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        UniqueConstraint("session_id", "document_id", name="uq_session_document"),
    )
    
    def __repr__(self) -> str:
        return f"<UploadedDocuments(document_id={self.document_id}, document_name={self.document_name})>"
