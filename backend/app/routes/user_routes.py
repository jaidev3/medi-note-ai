"""
User Management Routes
HTTP endpoints for professional and patient management
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Path

from app.schemas.auth_schemas import UserRead
from app.schemas.user_schemas import (
    ProfessionalUpdateRequest, ProfessionalResponse,
    UserStatsResponse
)
from app.controllers.user_controller import UserController
from app.routes.auth_routes import get_current_user_dependency
from app.schemas.user_schemas import ProfessionalListResponse

# Create router
router = APIRouter()

# Initialize controller
user_controller = UserController()


@router.get("/professionals/me", response_model=UserRead, summary="Get Current Professional")
async def get_current_professional(
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get current authenticated professional information.
    
    Args:
        current_user: Current user from JWT token (dependency)
        
    Returns:
        UserRead: Current professional information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return current_user


@router.put("/professionals/{professional_id}", response_model=UserRead, summary="Update Professional")
async def update_professional(
    professional_id: uuid.UUID = Path(..., description="Professional ID to update"),
    update_data: ProfessionalUpdateRequest = ...,
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Update professional information.
    
    Args:
        professional_id: Professional UUID to update
        update_data: Updated professional data
        current_user: Current authenticated user
        
    Returns:
        UserRead: Updated professional information
        
    Requires:
        Valid JWT access token in Authorization header
        
    Note:
        Currently allows self-update only. In production, add role-based access control.
    """
    # For now, only allow users to update their own profile
    if current_user.id != professional_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Call controller to update professional
    updated_professional = await user_controller.update_professional(professional_id, update_data)
    
    # Convert ProfessionalResponse to UserRead for response
    return UserRead(
        id=updated_professional.id,
        email=updated_professional.email,
        name=updated_professional.name,
        role=updated_professional.role,
        department=updated_professional.department,
        employee_id=updated_professional.employee_id,
        phone_number=updated_professional.phone_number,
        created_at=updated_professional.created_at,
        updated_at=updated_professional.updated_at
    )


@router.get("/stats", response_model=UserStatsResponse, summary="Get User Statistics")
async def get_user_statistics(
    professional_id: Optional[uuid.UUID] = Query(None, description="Professional ID to filter stats"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get user statistics and analytics.
    
    Args:
        professional_id: Optional professional ID to filter stats (defaults to current user)
        current_user: Current authenticated user
        
    Returns:
        UserStatsResponse: User statistics and analytics
        
    Requires:
        Valid JWT access token in Authorization header
    """
    # If no professional_id specified, return global totals (no professional filter)
    target_professional_id = professional_id
    
    # TODO: Add role-based access control
    # Non-admin users should only see their own stats
    if target_professional_id is not None and current_user.id != target_professional_id:
        # In production, check if current_user has admin role
        pass
    
    return await user_controller.get_user_stats(target_professional_id)



@router.get("/professionals", response_model=ProfessionalListResponse, summary="Get All Professionals")
async def get_all_professionals(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for name, email, or department"),
    current_user: UserRead = Depends(get_current_user_dependency)
):
    """
    Get all professionals with pagination and optional search.
    
    Args:
        page: Page number (starts from 1)
        page_size: Number of items per page (max 100)
        search: Optional search term for name, email, or department
        current_user: Current authenticated user (dependency)
        
    Returns:
        ProfessionalListResponse: List of professionals with pagination info
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return await user_controller.list_professionals(page, page_size, search)
