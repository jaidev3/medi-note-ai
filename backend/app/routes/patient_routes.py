"""
Patient Management Routes
HTTP endpoints for patient operations
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Path

from app.schemas.auth_schemas import UserRead
from app.schemas.user_schemas import (
    PatientCreateRequest, PatientUpdateRequest, PatientResponse, PatientListResponse,
    SessionCreateRequest, SessionResponse, SessionListResponse
)
from app.controllers.user_controller import UserController
from app.routes.auth_routes import get_current_user_dependency

# Create router
router = APIRouter()

# Initialize controller
user_controller = UserController()


@router.post("", response_model=PatientResponse, summary="Create Patient")
async def create_patient(
    patient_data: PatientCreateRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Create a new patient.
    
    Args:
        patient_data: Patient creation data
        current_user: Current authenticated user
        
    Returns:
        PatientResponse: Created patient information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.create_patient(patient_data)


@router.get("", response_model=PatientListResponse, summary="List Patients")
async def list_patients(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for name or email"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    List patients with pagination and search.
    
    Args:
        page: Page number (1-based)
        page_size: Number of items per page (1-100)
        search: Optional search term for name or email
        current_user: Current authenticated user
        
    Returns:
        PatientListResponse: Paginated list of patients
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.list_patients(page, page_size, search)


@router.get("/{patient_id}", response_model=PatientResponse, summary="Get Patient Details")
async def get_patient_details(
    patient_id: uuid.UUID = Path(..., description="Patient ID"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get patient details by ID.
    
    Args:
        patient_id: Patient UUID
        current_user: Current authenticated user
        
    Returns:
        PatientResponse: Patient information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.get_patient(patient_id)


@router.put("/{patient_id}", response_model=PatientResponse, summary="Update Patient")
async def update_patient(
    patient_id: uuid.UUID = Path(..., description="Patient ID"),
    patient_data: PatientUpdateRequest = ...,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Update patient information.
    
    Args:
        patient_id: Patient UUID
        patient_data: Updated patient data
        current_user: Current authenticated user
        
    Returns:
        PatientResponse: Updated patient information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.update_patient(patient_id, patient_data)


@router.get("/{patient_id}/visits", response_model=SessionListResponse, summary="Get Patient Visit History")
async def get_patient_visits(
    patient_id: uuid.UUID = Path(..., description="Patient ID"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get patient visit history with pagination.
    
    Args:
        patient_id: Patient UUID
        page: Page number (1-based)
        page_size: Number of items per page (1-100)
        current_user: Current authenticated user
        
    Returns:
        SessionListResponse: Paginated list of patient visits
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        This endpoint returns session data filtered by patient_id.
    """
    # TODO: Implement get_patient_sessions method in user_service
    # For now, return empty response structure
    return SessionListResponse(
        sessions=[],
        total_count=0,
        page=page,
        page_size=page_size,
        patient_id=patient_id
    )
