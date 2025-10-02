"""
Authentication Routes
HTTP endpoints for user authentication and authorization
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.auth_schemas import UserLogin, Token, UserRead, UserCreate
from app.controllers.auth_controller import AuthController

# Create router
router = APIRouter()

# Security scheme
security = HTTPBearer()

# Initialize controller
auth_controller = AuthController()


async def get_current_user_dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserRead:
    """
    Dependency to get current authenticated user.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        UserRead: Current user information
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    return await auth_controller.get_current_user(token)


@router.post("/login", response_model=Token, summary="User Login")
async def login(login_data: UserLogin):
    """
    Authenticate user and generate access/refresh tokens.
    
    Args:
        login_data: User login credentials (email and password)
        
    Returns:
        Token: Access token, refresh token, and token type
        
    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 500: Server error
    """
    return await auth_controller.login_user(login_data)


@router.post("/refresh", response_model=Token, summary="Refresh Token")
async def refresh_token(refresh_token: str):
    """
    Generate new access token using refresh token.
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        Token: New access token and refresh token
        
    Raises:
        HTTPException 401: Invalid refresh token
    """
    return await auth_controller.refresh_token(refresh_token)


@router.get("/me", response_model=UserRead, summary="Current User Info")
async def get_current_user(current_user: UserRead = Depends(get_current_user_dependency)):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current user from JWT token (dependency)
        
    Returns:
        UserRead: Current user information
        
    Requires:
        Valid JWT access token in Authorization header
    """
    return current_user


@router.post("/register", response_model=UserRead, summary="Register Professional")
async def register_professional(user_data: UserCreate):
    """
    Register a new healthcare professional.
    
    Args:
        user_data: Professional registration data
        
    Returns:
        UserRead: Created user information
        
    Raises:
        HTTPException 400: Email already registered or validation error
        HTTPException 500: Server error
        
    Note:
        This endpoint should be protected in production environments
        or require admin privileges.
    """
    return await auth_controller.register_user(user_data)


@router.post("/logout", summary="User Logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout current user and invalidate token.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        dict: Logout confirmation message
        
    Raises:
        HTTPException 401: Invalid access token
        HTTPException 500: Server error
        
    Note:
        In production, this would add the token to a blacklist.
    """
    token = credentials.credentials
    return await auth_controller.logout_user(token)
