"""
Session Management Routes
HTTP endpoints for patient visit session operations
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status

from app.schemas.auth_schemas import UserRead
from app.schemas.user_schemas import (
    SessionCreateRequest, SessionUpdateRequest, SessionResponse, SessionListResponse
)
from app.controllers.user_controller import UserController
from app.routes.auth_routes import get_current_user_dependency

# Create router
router = APIRouter()

# Initialize controller
user_controller = UserController()


@router.post("", response_model=SessionResponse, summary="Create Patient Visit Session")
async def create_session(
    session_data: SessionCreateRequest,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Create a new patient visit session.
    
    Args:
        session_data: Session creation data
        current_user: Current authenticated user
        
    Returns:
        SessionResponse: Created session information
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        If professional_id is not provided in session_data, 
        it will be set to the current user's ID.
    """
    # Set professional_id to current user if not provided
    if not session_data.professional_id:
        session_data.professional_id = current_user.id
    
    return await user_controller.create_session(session_data)


@router.get("", response_model=SessionListResponse, summary="List Sessions")
async def list_sessions(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    patient_id: Optional[uuid.UUID] = Query(None, description="Filter by patient ID"),
    professional_id: Optional[uuid.UUID] = Query(None, description="Filter by professional ID"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    List patient visit sessions with pagination and filtering.
    
    Args:
        page: Page number (1-based)
        page_size: Number of items per page (1-100)
        patient_id: Optional filter by patient ID
        professional_id: Optional filter by professional ID
        current_user: Current authenticated user
        
    Returns:
        SessionListResponse: Paginated list of sessions
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        If professional_id is not provided, defaults to current user's sessions.
    """
    # Default to current user's sessions if no professional_id specified
    target_professional_id = professional_id or current_user.id
    
    return await user_controller.list_sessions(page, page_size, patient_id, target_professional_id)


@router.get("/{session_id}", response_model=SessionResponse, summary="Get Session Details")
async def get_session_details(
    session_id: uuid.UUID = Path(..., description="Session ID"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get session details by ID.
    
    Args:
        session_id: Session UUID
        current_user: Current authenticated user
        
    Returns:
        SessionResponse: Session information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.get_session(session_id)


@router.put("/{session_id}", response_model=SessionResponse, summary="Update Session")
async def update_session(
    session_id: uuid.UUID = Path(..., description="Session ID"),
    session_data: SessionUpdateRequest = ...,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Update session information.
    
    Args:
        session_id: Session UUID
        session_data: Update request data
        current_user: Current authenticated user
        
    Returns:
        SessionResponse: Updated session information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.update_session(session_id, session_data)


@router.delete("/{session_id}", summary="Delete Session")
async def delete_session(
    session_id: uuid.UUID = Path(..., description="Session ID"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Delete session by ID.
    
    Args:
        session_id: Session UUID
        current_user: Current authenticated user
        
    Returns:
        dict: Deletion confirmation message
        
    Requires:
        Valid JWT access token in Authorization header
    """
    deleted = await user_controller.delete_session(session_id)
    if deleted:
        return {"message": "Session deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")
