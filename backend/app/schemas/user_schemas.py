"""
User and patient management schemas
"""
from typing import Optional, List
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, EmailStr

from app.models.professional import ProfessionalRole


class PatientCreateRequest(BaseModel):
    """Request schema for creating a new patient."""
    name: str = Field(..., description="Patient full name", min_length=1, max_length=150)
    email: Optional[EmailStr] = Field(default=None, description="Patient email address")
    phone: Optional[str] = Field(default=None, description="Patient phone number", max_length=20)
    address: Optional[str] = Field(default=None, description="Patient address")


class PatientUpdateRequest(BaseModel):
    """Request schema for updating patient information."""
    name: Optional[str] = Field(default=None, description="Patient full name", max_length=150)
    email: Optional[EmailStr] = Field(default=None, description="Patient email address")
    phone: Optional[str] = Field(default=None, description="Patient phone number", max_length=20)
    address: Optional[str] = Field(default=None, description="Patient address")


class PatientResponse(BaseModel):
    """Response schema for patient information."""
    id: uuid.UUID = Field(..., description="Patient UUID")
    name: Optional[str] = Field(default=None, description="Patient full name")
    email: Optional[str] = Field(default=None, description="Patient email address")
    phone: Optional[str] = Field(default=None, description="Patient phone number")
    address: Optional[str] = Field(default=None, description="Patient address")
    
    # Metadata
    created_at: datetime = Field(..., description="Patient creation date")
    updated_at: datetime = Field(..., description="Last update date")
    total_visits: int = Field(default=0, description="Total number of visits")
    last_visit: Optional[datetime] = Field(default=None, description="Date of last visit")


class PatientListResponse(BaseModel):
    """Response schema for listing patients."""
    patients: List[PatientResponse] = Field(default_factory=list, description="List of patients")
    total_count: int = Field(default=0, description="Total number of patients")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=20, description="Number of items per page")


class ProfessionalUpdateRequest(BaseModel):
    """Request schema for updating professional information."""
    name: Optional[str] = Field(default=None, description="Professional full name", max_length=150)
    phone_number: Optional[str] = Field(default=None, description="Phone number", max_length=20)
    department: Optional[str] = Field(default=None, description="Department", max_length=100)
    employee_id: Optional[str] = Field(default=None, description="Employee ID", max_length=50)


class ProfessionalResponse(BaseModel):
    """Response schema for professional information."""
    id: uuid.UUID = Field(..., description="Professional UUID")
    name: str = Field(..., description="Professional full name")
    email: str = Field(..., description="Email address")
    role: ProfessionalRole = Field(..., description="Professional role")
    department: Optional[str] = Field(default=None, description="Department")
    employee_id: Optional[str] = Field(default=None, description="Employee ID")
    phone_number: Optional[str] = Field(default=None, description="Phone number")
    
    # Metadata
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")
    total_sessions: int = Field(default=0, description="Total sessions conducted")
    total_soap_notes: int = Field(default=0, description="Total SOAP notes created")


class ProfessionalListResponse(BaseModel):
    """Response schema for listing professionals."""
    professionals: List[ProfessionalResponse] = Field(default_factory=list, description="List of professionals")
    total_count: int = Field(default=0, description="Total number of professionals")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=20, description="Number of items per page")


class SessionCreateRequest(BaseModel):
    """Request schema for creating a patient visit session."""
    patient_id: uuid.UUID = Field(..., description="Patient ID")
    professional_id: Optional[uuid.UUID] = Field(default=None, description="Professional ID")
    visit_date: Optional[datetime] = Field(default=None, description="Visit date (defaults to now)")
    notes: Optional[str] = Field(default=None, description="Session notes")


class SessionUpdateRequest(BaseModel):
    """Request schema for updating a session."""
    notes: Optional[str] = Field(default=None, description="Session notes")
    visit_date: Optional[datetime] = Field(default=None, description="Visit date")


class SessionResponse(BaseModel):
    """Response schema for session information."""
    session_id: uuid.UUID = Field(..., description="Session UUID")
    patient_id: uuid.UUID = Field(..., description="Patient ID")
    professional_id: Optional[uuid.UUID] = Field(default=None, description="Professional ID")
    visit_date: datetime = Field(..., description="Visit date")
    notes: Optional[str] = Field(default=None, description="Session notes")
    
    # Related data counts
    document_count: int = Field(default=0, description="Number of uploaded documents")
    soap_note_count: int = Field(default=0, description="Number of SOAP notes")
    
    # Metadata
    created_at: datetime = Field(..., description="Session creation date")
    updated_at: datetime = Field(..., description="Last update date")


class SessionListResponse(BaseModel):
    """Response schema for listing sessions."""
    sessions: List[SessionResponse] = Field(default_factory=list, description="List of sessions")
    total_count: int = Field(default=0, description="Total number of sessions")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=20, description="Number of items per page")
    patient_id: Optional[uuid.UUID] = Field(default=None, description="Patient ID if filtered")


class UserStatsResponse(BaseModel):
    """Response schema for user statistics."""
    total_patients: int = Field(default=0, description="Total number of patients")
    total_sessions: int = Field(default=0, description="Total number of sessions")
    total_soap_notes: int = Field(default=0, description="Total SOAP notes generated")
    total_documents: int = Field(default=0, description="Total documents uploaded")
    
    # Recent activity
    recent_sessions: int = Field(default=0, description="Sessions in last 30 days")
    recent_soap_notes: int = Field(default=0, description="SOAP notes in last 30 days")
    
    # Professional-specific stats
    professional_id: Optional[uuid.UUID] = Field(default=None, description="Professional ID if filtered")
    professional_sessions: int = Field(default=0, description="Sessions by this professional")
    professional_soap_notes: int = Field(default=0, description="SOAP notes by this professional")
