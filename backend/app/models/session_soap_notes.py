"""Session SOAP notes model."""
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Boolean,
    func,
    Index,
    text,
    ForeignKeyConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, JSONB, TSVECTOR
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.database.db import Base


class SessionSoapNotes(Base):
    """Session SOAP notes model for storing clinical notes with embeddings."""
    
    __tablename__ = "session_soap_notes"
    
    note_id = Column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    session_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("patient_visit_sessions.session_id", ondelete="CASCADE"),
        nullable=False,
    )
    document_id = Column(
        PostgresUUID(as_uuid=True),
        nullable=False,
    )
    professional_id = Column(
        PostgresUUID(as_uuid=True),
        ForeignKey("professional.id", ondelete="SET NULL"),
        nullable=True,
    )
    ai_approved = Column(Boolean, nullable=False)
    user_approved = Column(Boolean, nullable=False)
    content = Column(JSONB, nullable=False)
    context_data = Column(JSONB, nullable=True)
    content_fts = Column(TSVECTOR, nullable=True)
    embedding = Column(Vector(768), nullable=True)
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
    session = relationship("PatientVisitSessions", back_populates="soap_notes")
    professional = relationship("Professional", back_populates="soap_notes")
    document = relationship("UploadedDocuments", back_populates="soap_notes")
    
    __table_args__ = (
        ForeignKeyConstraint(
            ["session_id", "document_id"],
            ["uploaded_documents.session_id", "uploaded_documents.document_id"],
            name="fk_notes_session_document",
            ondelete="RESTRICT",
        ),
        Index("ix_notes_approval_combo", "user_approved", "ai_approved"),
        Index("ix_notes_content_fts", "content_fts", postgresql_using="gin"),
        Index(
            "ix_notes_content_gin",
            "content",
            postgresql_using="gin",
            postgresql_ops={"content": "jsonb_path_ops"},
        ),
        Index(
            "ix_notes_context_gin",
            "context_data",
            postgresql_using="gin",
            postgresql_ops={"context_data": "jsonb_path_ops"},
        ),
        Index("ix_notes_document", "document_id"),
        Index(
            "ix_notes_embedding_cosine",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index(
            "ix_notes_pending_ai_approval",
            "session_id",
            postgresql_where=text("ai_approved = false"),
        ),
        Index(
            "ix_notes_pending_user_approval",
            "session_id",
            postgresql_where=text("user_approved = false"),
        ),
        Index("ix_notes_professional", "professional_id"),
        Index("ix_notes_session_time", "session_id", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<SessionSoapNotes(note_id={self.note_id}, session_id={self.session_id})>"
