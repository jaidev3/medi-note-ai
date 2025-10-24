"""
User Management Service
Implements user and patient management operations
"""
import uuid
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import structlog

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user_schemas import (
    PatientCreateRequest, PatientUpdateRequest, PatientResponse, PatientListResponse,
    ProfessionalUpdateRequest, ProfessionalResponse, ProfessionalListResponse,
    SessionCreateRequest, SessionUpdateRequest, SessionResponse, SessionListResponse,
    UserStatsResponse
)
from app.models.patient_visit_sessions import PatientVisitSessions
from app.models.uploaded_documents import UploadedDocuments
from app.models.session_soap_notes import SessionSoapNotes
from app.models.users import User, UserRole
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class UserService:
    """Service for user and patient management."""
    
    async def create_patient(self, request: PatientCreateRequest) -> PatientResponse:
        """
        Create a new patient.
        
        Args:
            request: Patient creation request
            
        Returns:
            PatientResponse: Created patient information
        """
        async with async_session_maker() as session:
            try:
                logger.info("Creating new patient", name=request.name, email=request.email)
                
                # Check if email already exists
                if request.email:
                    stmt = select(User).where(
                        func.lower(User.email) == request.email.lower()
                    )
                    result = await session.execute(stmt)
                    existing_patient = result.scalar_one_or_none()
                    
                    if existing_patient:
                        raise ValueError("Patient with this email already exists")
                
                # Create new patient
                patient = User(
                    name=request.name,
                    email=request.email.lower() if request.email else None,
                    phone_number=request.phone,
                    address=request.address,
                    role=UserRole.PATIENT
                )
                
                session.add(patient)
                await session.commit()
                await session.refresh(patient)
                
                logger.info("✅ Patient created successfully", patient_id=str(patient.id))
                
                return PatientResponse(
                    id=patient.id,
                    name=patient.name,
                    email=patient.email,
                    phone=patient.phone_number,
                    address=patient.address,
                    created_at=patient.created_at,
                    updated_at=patient.updated_at,
                    total_visits=0,
                    last_visit=None
                )
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to create patient", error=str(e))
                raise
    
    async def get_patient(self, patient_id: uuid.UUID) -> Optional[PatientResponse]:
        """
        Get patient by ID.
        
        Args:
            patient_id: Patient UUID
            
        Returns:
            PatientResponse: Patient information or None
        """
        async with async_session_maker() as session:
            try:
                stmt = select(User).where(User.id == patient_id)
                result = await session.execute(stmt)
                patient = result.scalar_one_or_none()
                
                if not patient:
                    return None
                
                # Get visit statistics
                visit_count_stmt = select(func.count(PatientVisitSessions.session_id)).where(
                    PatientVisitSessions.patient_id == patient_id
                )
                visit_count_result = await session.execute(visit_count_stmt)
                total_visits = visit_count_result.scalar() or 0
                
                # Get last visit date
                last_visit_stmt = select(func.max(PatientVisitSessions.visit_date)).where(
                    PatientVisitSessions.patient_id == patient_id
                )
                last_visit_result = await session.execute(last_visit_stmt)
                last_visit = last_visit_result.scalar()
                
                return PatientResponse(
                    id=patient.id,
                    name=patient.name,
                    email=patient.email,
                    phone=patient.phone_number,
                    address=patient.address,
                    created_at=patient.created_at,
                    updated_at=patient.updated_at,
                    total_visits=total_visits,
                    last_visit=last_visit
                )
                
            except Exception as e:
                logger.error("❌ Failed to get patient", error=str(e), patient_id=str(patient_id))
                return None
    
    async def update_patient(self, patient_id: uuid.UUID, request: PatientUpdateRequest) -> Optional[PatientResponse]:
        """
        Update patient information.
        
        Args:
            patient_id: Patient UUID
            request: Patient update request
            
        Returns:
            PatientResponse: Updated patient information or None
        """
        async with async_session_maker() as session:
            try:
                stmt = select(User).where(User.id == patient_id)
                result = await session.execute(stmt)
                patient = result.scalar_one_or_none()
                
                if not patient:
                    return None
                
                # Update fields if provided
                if request.name is not None:
                    patient.name = request.name
                if request.email is not None:
                    # Check email uniqueness
                    email_stmt = select(User).where(
                        and_(
                            func.lower(User.email) == request.email.lower(),
                            User.id != patient_id
                        )
                    )
                    email_result = await session.execute(email_stmt)
                    existing_patient = email_result.scalar_one_or_none()
                    
                    if existing_patient:
                        raise ValueError("Email already in use by another patient")
                    
                    patient.email = request.email.lower()
                if request.phone is not None:
                    patient.phone_number = request.phone
                if request.address is not None:
                    patient.address = request.address
                
                await session.commit()
                await session.refresh(patient)
                
                logger.info("✅ Patient updated successfully", patient_id=str(patient_id))
                
                # Return updated patient with statistics
                return await self.get_patient(patient_id)
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to update patient", error=str(e), patient_id=str(patient_id))
                raise
    
    async def list_patients(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> PatientListResponse:
        """
        List patients with pagination and search.
        
        Args:
            page: Page number
            page_size: Number of items per page
            search: Search term for name or email
            
        Returns:
            PatientListResponse: List of patients
        """
        async with async_session_maker() as session:
            try:
                # Build base query
                stmt = select(User).where(User.role == UserRole.PATIENT)

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
                count_result = await session.execute(count_stmt)
                total_count = count_result.scalar() or 0
                
                # Add pagination and ordering
                offset = (page - 1) * page_size
                stmt = stmt.order_by(User.name.asc()).offset(offset).limit(page_size)
                
                result = await session.execute(stmt)
                patients = result.scalars().all()
                
                # Convert to response objects
                patient_responses = []
                for patient in patients:
                    # Get visit count for each patient
                    visit_count_stmt = select(func.count(PatientVisitSessions.session_id)).where(
                        PatientVisitSessions.patient_id == patient.id
                    )
                    visit_count_result = await session.execute(visit_count_stmt)
                    total_visits = visit_count_result.scalar() or 0
                    
                    patient_response = PatientResponse(
                        id=patient.id,
                        name=patient.name,
                        email=patient.email,
                        phone=patient.phone_number,
                        address=patient.address,
                        created_at=patient.created_at,
                        updated_at=patient.updated_at,
                        total_visits=total_visits,
                        last_visit=None  # TODO: Optimize to get in single query
                    )
                    patient_responses.append(patient_response)
                
                return PatientListResponse(
                    patients=patient_responses,
                    total_count=total_count,
                    page=page,
                    page_size=page_size
                )
                
            except Exception as e:
                logger.error("❌ Failed to list patients", error=str(e))
                return PatientListResponse(
                    patients=[],
                    total_count=0,
                    page=page,
                    page_size=page_size
                )
    
    async def create_session(self, request: SessionCreateRequest) -> SessionResponse:
        """
        Create a new patient visit session.
        
        Args:
            request: Session creation request
            
        Returns:
            SessionResponse: Created session information
        """
        async with async_session_maker() as session:
            try:
                logger.info(
                    "Creating new session",
                    patient_id=str(request.patient_id),
                    professional_id=str(request.professional_id) if request.professional_id else None
                )
                
                # Verify patient exists
                patient_stmt = select(User).where(User.id == request.patient_id)
                patient_result = await session.execute(patient_stmt)
                patient = patient_result.scalar_one_or_none()
                
                if not patient:
                    raise ValueError("Patient not found")
                
                # Verify professional exists if provided
                if request.professional_id:
                    prof_stmt = select(User).where(User.id == request.professional_id)
                    prof_result = await session.execute(prof_stmt)
                    professional = prof_result.scalar_one_or_none()

                    if not professional:
                        raise ValueError("Professional not found")
                
                # Create session
                visit_session = PatientVisitSessions(
                    patient_id=request.patient_id,
                    professional_id=request.professional_id,
                    visit_date=request.visit_date or datetime.now(timezone.utc),
                    notes=request.notes
                )
                
                session.add(visit_session)
                await session.commit()
                await session.refresh(visit_session)
                
                logger.info("✅ Session created successfully", session_id=str(visit_session.session_id))
                
                # Get patient name for response
                patient = await session.execute(select(User).where(User.id == visit_session.patient_id))
                patient_obj = patient.scalar_one_or_none()
                patient_name = patient_obj.name if patient_obj else None

                return SessionResponse(
                    session_id=visit_session.session_id,
                    patient_id=visit_session.patient_id,
                    patient_name=patient_name,
                    professional_id=visit_session.professional_id,
                    visit_date=visit_session.visit_date,
                    notes=visit_session.notes,
                    document_count=0,
                    soap_note_count=0,
                    created_at=visit_session.created_at,
                    updated_at=visit_session.updated_at
                )
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to create session", error=str(e))
                raise
    
    async def list_sessions(
        self,
        page: int = 1,
        page_size: int = 20,
        patient_id: Optional[uuid.UUID] = None,
        professional_id: Optional[uuid.UUID] = None
    ) -> SessionListResponse:
        """
        List patient visit sessions with pagination and filtering.

        Args:
            page: Page number (1-based)
            page_size: Number of items per page
            patient_id: Optional filter by patient ID
            professional_id: Optional filter by professional ID

        Returns:
            SessionListResponse: Paginated list of sessions
        """
        async with async_session_maker() as session:
            try:
                # Build base query with patient join
                stmt = select(PatientVisitSessions, User.name).join(
                    User, PatientVisitSessions.patient_id == User.id
                )

                # Apply filters
                if patient_id:
                    stmt = stmt.where(PatientVisitSessions.patient_id == patient_id)
                if professional_id:
                    stmt = stmt.where(PatientVisitSessions.professional_id == professional_id)

                # Get total count
                count_stmt = select(func.count(PatientVisitSessions.session_id))
                if patient_id:
                    count_stmt = count_stmt.where(PatientVisitSessions.patient_id == patient_id)
                if professional_id:
                    count_stmt = count_stmt.where(PatientVisitSessions.professional_id == professional_id)

                total_count_result = await session.execute(count_stmt)
                total_count = total_count_result.scalar() or 0

                # Apply pagination and ordering
                stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(PatientVisitSessions.visit_date.desc())

                # Execute query
                result = await session.execute(stmt)
                session_data = result.all()

                # Convert to response models
                session_responses = []
                for visit_session, patient_name in session_data:
                    # Get document count
                    doc_count_stmt = select(func.count(UploadedDocuments.document_id)).where(
                        UploadedDocuments.session_id == visit_session.session_id
                    )
                    doc_count_result = await session.execute(doc_count_stmt)
                    doc_count = doc_count_result.scalar() or 0

                    # Get SOAP note count
                    soap_count_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                        SessionSoapNotes.session_id == visit_session.session_id
                    )
                    soap_count_result = await session.execute(soap_count_stmt)
                    soap_count = soap_count_result.scalar() or 0

                    session_response = SessionResponse(
                        session_id=visit_session.session_id,
                        patient_id=visit_session.patient_id,
                        patient_name=patient_name,
                        professional_id=visit_session.professional_id,
                        visit_date=visit_session.visit_date,
                        notes=visit_session.notes,
                        document_count=doc_count,
                        soap_note_count=soap_count,
                        created_at=visit_session.created_at,
                        updated_at=visit_session.updated_at
                    )
                    session_responses.append(session_response)

                return SessionListResponse(
                    sessions=session_responses,
                    total_count=total_count,
                    page=page,
                    page_size=page_size,
                    patient_id=patient_id
                )

            except Exception as e:
                logger.error("❌ Failed to list sessions", error=str(e))
                raise
    
    async def get_session(self, session_id: uuid.UUID) -> Optional[SessionResponse]:
        """
        Get session by ID.

        Args:
            session_id: Session UUID

        Returns:
            SessionResponse: Session information or None
        """
        async with async_session_maker() as session:
            try:
                stmt = select(PatientVisitSessions, User.name).join(
                    User, PatientVisitSessions.patient_id == User.id
                ).where(PatientVisitSessions.session_id == session_id)
                result = await session.execute(stmt)
                session_data = result.first()

                if not session_data:
                    return None

                visit_session, patient_name = session_data

                # Get document count
                doc_count_stmt = select(func.count(UploadedDocuments.document_id)).where(
                    UploadedDocuments.session_id == visit_session.session_id
                )
                doc_count_result = await session.execute(doc_count_stmt)
                doc_count = doc_count_result.scalar() or 0

                # Get SOAP note count
                soap_count_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                    SessionSoapNotes.session_id == visit_session.session_id
                )
                soap_count_result = await session.execute(soap_count_stmt)
                soap_count = soap_count_result.scalar() or 0

                return SessionResponse(
                    session_id=visit_session.session_id,
                    patient_id=visit_session.patient_id,
                    patient_name=patient_name,
                    professional_id=visit_session.professional_id,
                    visit_date=visit_session.visit_date,
                    notes=visit_session.notes,
                    document_count=doc_count,
                    soap_note_count=soap_count,
                    created_at=visit_session.created_at,
                    updated_at=visit_session.updated_at
                )

            except Exception as e:
                logger.error("❌ Failed to get session", error=str(e))
                raise
    
    async def update_session(
        self,
        session_id: uuid.UUID,
        request: SessionUpdateRequest
    ) -> Optional[SessionResponse]:
        """
        Update session information.
            
        Args:
            session_id: Session UUID
            request: Update request data
            
        Returns:
            SessionResponse: Updated session information or None
        """
        async with async_session_maker() as session:
            try:
                stmt = select(PatientVisitSessions).where(
                    PatientVisitSessions.session_id == session_id
                )
                result = await session.execute(stmt)
                visit_session = result.scalar_one_or_none()
                
                if not visit_session:
                    return None
                
                # Update fields
                if request.visit_date is not None:
                    visit_session.visit_date = request.visit_date
                if request.notes is not None:
                    visit_session.notes = request.notes
                
                visit_session.updated_at = datetime.now(timezone.utc)
                
                await session.commit()
                await session.refresh(visit_session)
                
                # Get updated counts
                doc_count_stmt = select(func.count(UploadedDocuments.document_id)).where(
                    UploadedDocuments.session_id == visit_session.session_id
                )
                doc_count_result = await session.execute(doc_count_stmt)
                doc_count = doc_count_result.scalar() or 0
                
                soap_count_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                    SessionSoapNotes.session_id == visit_session.session_id
                )
                soap_count_result = await session.execute(soap_count_stmt)
                soap_count = soap_count_result.scalar() or 0
                
                # Get patient name for response
                patient = await session.execute(select(User).where(User.id == visit_session.patient_id))
                patient_obj = patient.scalar_one_or_none()
                patient_name = patient_obj.name if patient_obj else None

                return SessionResponse(
                    session_id=visit_session.session_id,
                    patient_id=visit_session.patient_id,
                    patient_name=patient_name,
                    professional_id=visit_session.professional_id,
                    visit_date=visit_session.visit_date,
                    notes=visit_session.notes,
                    document_count=doc_count,
                    soap_note_count=soap_count,
                    created_at=visit_session.created_at,
                    updated_at=visit_session.updated_at
                )
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to update session", error=str(e))
                raise
    
    async def delete_session(self, session_id: uuid.UUID) -> bool:
        """
        Delete session by ID.
        
        Args:
            session_id: Session UUID
            
        Returns:
            bool: True if deleted, False if not found
        """
        async with async_session_maker() as session:
            try:
                stmt = select(PatientVisitSessions).where(
                    PatientVisitSessions.session_id == session_id
                )
                result = await session.execute(stmt)
                visit_session = result.scalar_one_or_none()
                
                if not visit_session:
                    return False
                
                await session.delete(visit_session)
                await session.commit()
                
                logger.info("✅ Session deleted successfully", session_id=str(session_id))
                return True
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to delete session", error=str(e))
                raise
    
    async def get_user_stats(self, professional_id: Optional[uuid.UUID] = None) -> UserStatsResponse:
        """
        Get user statistics.
        
        Args:
            professional_id: Optional professional ID to filter stats
            
        Returns:
            UserStatsResponse: User statistics
        """
        async with async_session_maker() as session:
            try:
                # Get total counts
                total_patients_stmt = select(func.count(User.id)).where(User.role == 'PATIENT')
                total_patients_result = await session.execute(total_patients_stmt)
                total_patients = total_patients_result.scalar() or 0
                
                total_sessions_stmt = select(func.count(PatientVisitSessions.session_id))
                if professional_id:
                    total_sessions_stmt = total_sessions_stmt.where(
                        PatientVisitSessions.professional_id == professional_id
                    )
                total_sessions_result = await session.execute(total_sessions_stmt)
                total_sessions = total_sessions_result.scalar() or 0
                
                total_soap_notes_stmt = select(func.count(SessionSoapNotes.note_id))
                if professional_id:
                    total_soap_notes_stmt = total_soap_notes_stmt.where(
                        SessionSoapNotes.professional_id == professional_id
                    )
                total_soap_notes_result = await session.execute(total_soap_notes_stmt)
                total_soap_notes = total_soap_notes_result.scalar() or 0
                
                total_documents_stmt = select(func.count(UploadedDocuments.document_id))
                if professional_id:
                    # Join with sessions to filter by professional
                    total_documents_stmt = total_documents_stmt.where(
                        UploadedDocuments.session_id.in_(
                            select(PatientVisitSessions.session_id).where(
                                PatientVisitSessions.professional_id == professional_id
                            )
                        )
                    )
                total_documents_result = await session.execute(total_documents_stmt)
                total_documents = total_documents_result.scalar() or 0
                
                # Get recent activity (last 30 days)
                thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
                
                recent_sessions_stmt = select(func.count(PatientVisitSessions.session_id)).where(
                    PatientVisitSessions.visit_date >= thirty_days_ago
                )
                if professional_id:
                    recent_sessions_stmt = recent_sessions_stmt.where(
                        PatientVisitSessions.professional_id == professional_id
                    )
                recent_sessions_result = await session.execute(recent_sessions_stmt)
                recent_sessions = recent_sessions_result.scalar() or 0
                
                recent_soap_notes_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                    SessionSoapNotes.created_at >= thirty_days_ago
                )
                if professional_id:
                    recent_soap_notes_stmt = recent_soap_notes_stmt.where(
                        SessionSoapNotes.professional_id == professional_id
                    )
                recent_soap_notes_result = await session.execute(recent_soap_notes_stmt)
                recent_soap_notes = recent_soap_notes_result.scalar() or 0
                
                return UserStatsResponse(
                    total_patients=total_patients,
                    total_sessions=total_sessions,
                    total_soap_notes=total_soap_notes,
                    total_documents=total_documents,
                    recent_sessions=recent_sessions,
                    recent_soap_notes=recent_soap_notes,
                    professional_id=professional_id,
                    professional_sessions=total_sessions if professional_id else 0,
                    professional_soap_notes=total_soap_notes if professional_id else 0
                )
                
            except Exception as e:
                logger.error("❌ Failed to get user stats", error=str(e))
                return UserStatsResponse()
    
    async def update_professional(self, professional_id: uuid.UUID, request: ProfessionalUpdateRequest) -> Optional[ProfessionalResponse]:
        """
        Update professional information.
        
        Args:
            professional_id: Professional UUID
            request: Professional update request
            
        Returns:
            ProfessionalResponse: Updated professional information or None
        """
        async with async_session_maker() as session:
            try:
                stmt = select(User).where(User.id == professional_id)
                result = await session.execute(stmt)
                professional = result.scalar_one_or_none()
                
                if not professional:
                    return None
                
                # Update fields if provided
                if request.name is not None:
                    professional.name = request.name
                if request.phone_number is not None:
                    professional.phone_number = request.phone_number
                if request.department is not None:
                    professional.department = request.department
                if request.employee_id is not None:
                    professional.employee_id = request.employee_id
                
                # Update timestamp
                professional.updated_at = datetime.now(timezone.utc)
                
                await session.commit()
                await session.refresh(professional)
                
                logger.info("✅ Professional updated successfully", professional_id=str(professional_id))
                
                # Get counts for response
                sessions_stmt = select(func.count(PatientVisitSessions.session_id)).where(
                    PatientVisitSessions.professional_id == professional.id
                )
                sessions_result = await session.execute(sessions_stmt)
                total_sessions = sessions_result.scalar() or 0
                
                soap_notes_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                    SessionSoapNotes.professional_id == professional.id
                )
                soap_notes_result = await session.execute(soap_notes_stmt)
                total_soap_notes = soap_notes_result.scalar() or 0
                
                return ProfessionalResponse(
                    id=professional.id,
                    name=professional.name,
                    email=professional.email,
                    role=professional.role,
                    department=professional.department,
                    employee_id=professional.employee_id,
                    phone_number=professional.phone_number,
                    created_at=professional.created_at,
                    updated_at=professional.updated_at,
                    total_sessions=total_sessions,
                    total_soap_notes=total_soap_notes
                )
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to update professional", error=str(e), professional_id=str(professional_id))
                raise
    
    async def list_professionals(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> ProfessionalListResponse:
        """
        Get all professionals with pagination and optional search.
        
        Args:
            page: Page number (starts from 1)
            page_size: Number of items per page
            search: Optional search term for name or email
            
        Returns:
            ProfessionalListResponse: List of professionals with pagination info
        """
        async with async_session_maker() as session:
            try:
                # Build base query
                stmt = select(User).where(User.role.in_(['PROFESSIONAL', 'ADMIN']))

                # Add search filter if provided
                if search:
                    search_term = f"%{search.lower()}%"
                    stmt = stmt.where(
                        or_(
                            User.name.ilike(search_term),
                            User.email.ilike(search_term),
                            User.department.ilike(search_term) if User.department else False
                        )
                    )

                # Get total count for pagination
                count_stmt = select(func.count(User.id)).where(User.role.in_(['PROFESSIONAL', 'ADMIN']))
                if search:
                    count_stmt = count_stmt.where(
                        or_(
                            User.name.ilike(search_term),
                            User.email.ilike(search_term),
                            User.department.ilike(search_term) if User.department else False
                        )
                    )
                
                count_result = await session.execute(count_stmt)
                total_count = count_result.scalar() or 0
                
                # Add pagination and ordering
                offset = (page - 1) * page_size
                stmt = stmt.offset(offset).limit(page_size).order_by(User.created_at.desc())
                
                # Execute query
                result = await session.execute(stmt)
                professionals = result.scalars().all()
                
                # Convert to response models
                professional_responses = []
                for prof in professionals:
                    # Get counts for this professional
                    sessions_stmt = select(func.count(PatientVisitSessions.session_id)).where(
                        PatientVisitSessions.professional_id == prof.id
                    )
                    sessions_result = await session.execute(sessions_stmt)
                    total_sessions = sessions_result.scalar() or 0
                    
                    soap_notes_stmt = select(func.count(SessionSoapNotes.note_id)).where(
                        SessionSoapNotes.professional_id == prof.id
                    )
                    soap_notes_result = await session.execute(soap_notes_stmt)
                    total_soap_notes = soap_notes_result.scalar() or 0
                    
                    professional_responses.append(
                        ProfessionalResponse(
                            id=prof.id,
                            name=prof.name,
                            email=prof.email,
                            role=prof.role,
                            department=prof.department,
                            employee_id=prof.employee_id,
                            phone_number=prof.phone_number,
                            created_at=prof.created_at,
                            updated_at=prof.updated_at,
                            total_sessions=total_sessions,
                            total_soap_notes=total_soap_notes
                        )
                    )
                
                return ProfessionalListResponse(
                    professionals=professional_responses,
                    total_count=total_count,
                    page=page,
                    page_size=page_size
                )
                
            except Exception as e:
                logger.error("❌ Failed to list professionals", error=str(e))
                return ProfessionalListResponse()
