"""
User Management Controller
Handles user and patient management business logic
"""
import uuid
from typing import Optional
import structlog

from fastapi import HTTPException, status

from app.schemas.user_schemas import (
    PatientCreateRequest, PatientUpdateRequest, PatientResponse, PatientListResponse,
    ProfessionalUpdateRequest, ProfessionalResponse, ProfessionalListResponse,
    SessionCreateRequest, SessionUpdateRequest, SessionResponse, SessionListResponse,
    UserStatsResponse
)
from app.services.user_service import UserService

logger = structlog.get_logger(__name__)


class UserController:
    """Controller for user and patient management operations."""
    
    def __init__(self):
        """Initialize user controller."""
        self.user_service = UserService()
    
    async def create_patient(self, patient_data: PatientCreateRequest) -> PatientResponse:
        """
        Create a new patient.
        
        Args:
            patient_data: Patient creation data
            
        Returns:
            PatientResponse: Created patient information
            
        Raises:
            HTTPException: If creation fails
        """
        try:
            logger.info("Creating new patient", name=patient_data.name)
            return await self.user_service.create_patient(patient_data)
            
        except ValueError as e:
            logger.warning("Patient creation validation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error("Patient creation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create patient"
            )
    
    async def get_patient(self, patient_id: uuid.UUID) -> PatientResponse:
        """
        Get patient by ID.
        
        Args:
            patient_id: Patient UUID
            
        Returns:
            PatientResponse: Patient information
            
        Raises:
            HTTPException: If patient not found
        """
        try:
            patient = await self.user_service.get_patient(patient_id)
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            return patient
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Get patient error", error=str(e), patient_id=str(patient_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve patient"
            )
    
    async def update_patient(
        self,
        patient_id: uuid.UUID,
        patient_data: PatientUpdateRequest
    ) -> PatientResponse:
        """
        Update patient information.
        
        Args:
            patient_id: Patient UUID
            patient_data: Updated patient data
            
        Returns:
            PatientResponse: Updated patient information
            
        Raises:
            HTTPException: If patient not found or update fails
        """
        try:
            updated_patient = await self.user_service.update_patient(patient_id, patient_data)
            if not updated_patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            return updated_patient
            
        except ValueError as e:
            logger.warning("Patient update validation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Patient update error", error=str(e), patient_id=str(patient_id))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update patient"
            )
    
    async def list_patients(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> PatientListResponse:
        """
        List patients with pagination and search.
        
        Args:
            page: Page number (1-based)
            page_size: Number of items per page
            search: Search term for name or email
            
        Returns:
            PatientListResponse: Paginated list of patients
            
        Raises:
            HTTPException: If listing fails
        """
        try:
            # Validate pagination parameters
            if page < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page number must be 1 or greater"
                )
            
            if page_size < 1 or page_size > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page size must be between 1 and 100"
                )
            
            return await self.user_service.list_patients(page, page_size, search)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("List patients error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list patients"
            )
    
    async def create_session(self, session_data: SessionCreateRequest) -> SessionResponse:
        """
        Create a new patient visit session.
        
        Args:
            session_data: Session creation data
            
        Returns:
            SessionResponse: Created session information
            
        Raises:
            HTTPException: If creation fails
        """
        try:
            return await self.user_service.create_session(session_data)
            
        except ValueError as e:
            logger.warning("Session creation validation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error("Session creation error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create session"
            )
    
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
            
        Raises:
            HTTPException: If listing fails
        """
        try:
            # Validate pagination parameters
            if page < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page number must be 1 or greater"
                )
            
            if page_size < 1 or page_size > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page size must be between 1 and 100"
                )
            
            return await self.user_service.list_sessions(page, page_size, patient_id, professional_id)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("List sessions error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list sessions"
            )
    
    async def get_session(self, session_id: uuid.UUID) -> SessionResponse:
        """
        Get session by ID.
        
        Args:
            session_id: Session UUID
            
        Returns:
            SessionResponse: Session information
            
        Raises:
            HTTPException: If session not found or retrieval fails
        """
        try:
            session = await self.user_service.get_session(session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
            return session
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Get session error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve session"
            )
    
    async def update_session(
        self,
        session_id: uuid.UUID,
        session_data: SessionUpdateRequest
    ) -> SessionResponse:
        """
        Update session information.
        
        Args:
            session_id: Session UUID
            session_data: Update request data
            
        Returns:
            SessionResponse: Updated session information
            
        Raises:
            HTTPException: If session not found or update fails
        """
        try:
            session = await self.user_service.update_session(session_id, session_data)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
            return session
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Update session error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update session"
            )
    
    async def delete_session(self, session_id: uuid.UUID) -> bool:
        """
        Delete session by ID.
        
        Args:
            session_id: Session UUID
            
        Returns:
            bool: True if deleted, False if not found
            
        Raises:
            HTTPException: If deletion fails
        """
        try:
            return await self.user_service.delete_session(session_id)
            
        except Exception as e:
            logger.error("Delete session error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete session"
            )
    
    async def get_user_stats(self, professional_id: Optional[uuid.UUID] = None) -> UserStatsResponse:
        """
        Get user statistics.
        
        Args:
            professional_id: Optional professional ID to filter stats
            
        Returns:
            UserStatsResponse: User statistics
            
        Raises:
            HTTPException: If retrieval fails
        """
        try:
            return await self.user_service.get_user_stats(professional_id)
            
        except Exception as e:
            logger.error("Get user stats error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve user statistics"
            )
    
    async def list_professionals(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> ProfessionalListResponse:
        """
        Get all professionals with pagination and optional search.
        
        Args:
            page: Page number (starts from 1)
            page_size: Number of items per page
            search: Optional search term for name or email
            
        Returns:
            ProfessionalListResponse: List of professionals with pagination info
            
        Raises:
            HTTPException: If retrieval fails
        """
        try:
            return await self.user_service.list_professionals(page, page_size, search)
            
        except Exception as e:
            logger.error("List professionals error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve professionals list"
            )
