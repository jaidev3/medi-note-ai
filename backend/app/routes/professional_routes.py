"""
Professional Management Routes
HTTP endpoints for professional management
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.user_schemas import ProfessionalListResponse
from app.controllers.user_controller import UserController
from app.routes.auth_routes import get_current_user_dependency
from app.schemas.auth_schemas import UserRead

# Create router
router = APIRouter()

# Initialize controller
user_controller = UserController()


@router.get("/", response_model=ProfessionalListResponse, summary="Get All Professionals")
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
