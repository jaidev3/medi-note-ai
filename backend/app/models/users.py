from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from app.database.db import Base
from enum import Enum
from sqlalchemy.orm import relationship
from datetime import timezone, datetime
import uuid

class UserRole(str, Enum):
    PATIENT = "PATIENT"
    PROFESSIONAL = "PROFESSIONAL"
    ADMIN = "ADMIN"
    
    
class ProfessionalRole(str, Enum):
    AUDIOLOGISTS = "AUDIOLOGISTS"
    HEARING_AID_SPECIALISTS = "HEARING_AID_SPECIALISTS"
    ENT_PHYSICIANS = "ENT_PHYSICIANS"
    CLINICAL_SUPPORT_STAFF = "CLINICAL_SUPPORT_STAFF"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, nullable=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    role = Column(SAEnum(UserRole, name="user_role"), default=UserRole.PATIENT)
    professional_role = Column(SAEnum(ProfessionalRole, name="professional_role"), nullable=True)
    address = Column(String, nullable=True)
    department = Column(String, nullable=True)
    employee_id = Column(String, nullable=True, unique=True)
    
    
    # Relationships
    visit_sessions_as_patient = relationship("PatientVisitSessions", foreign_keys="PatientVisitSessions.patient_id", back_populates="patient")
    visit_sessions_as_professional = relationship("PatientVisitSessions", foreign_keys="PatientVisitSessions.professional_id", back_populates="professional")
    soap_notes_as_professional = relationship("SessionSoapNotes", foreign_keys="SessionSoapNotes.professional_id", back_populates="professional")
    
    @property
    def is_patient(self):
        return self.role == UserRole.PATIENT
    
    @property
    def is_professional(self):
        return self.role == UserRole.PROFESSIONAL
    
    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN
    
    