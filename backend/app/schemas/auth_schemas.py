"""
Authentication schemas for JWT and user management
"""
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, EmailStr, validator

from app.models.users import ProfessionalRole, UserRole


class Token(BaseModel):
    """JWT token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class TokenData(BaseModel):
    """Token payload data."""
    user_id: uuid.UUID = Field(..., description="User UUID")
    email: str = Field(..., description="User email")
    role: UserRole = Field(..., description="User role")
    exp: datetime = Field(..., description="Token expiration time")


class UserLogin(BaseModel):
    """User login request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password", min_length=8)


# Alias for backward compatibility
LoginRequest = UserLogin


class LoginResponse(BaseModel):
    """User login response."""
    success: bool = Field(..., description="Whether login was successful")
    token: Optional[Token] = Field(default=None, description="JWT tokens")
    user: Optional[Dict[str, Any]] = Field(default=None, description="User information")
    message: str = Field(default="", description="Status message")


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str = Field(..., description="Valid refresh token")


class ChangePasswordRequest(BaseModel):
    """Change password request."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., description="New password", min_length=8)
    confirm_password: str = Field(..., description="Confirm new password")


class UserCreate(BaseModel):
    """User registration request."""
    name: str = Field(..., description="User full name", min_length=1, max_length=150)
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password", min_length=8)
    role: UserRole = Field(..., description="User role")
    professional_role: Optional[ProfessionalRole] = Field(default=None, description="Professional role (for professionals)")
    department: Optional[str] = Field(default=None, description="Department", max_length=100)
    employee_id: Optional[str] = Field(default=None, description="Employee ID", max_length=50)
    phone_number: Optional[str] = Field(default=None, description="Phone number", max_length=20)

    @validator('role', pre=True)
    def normalize_role(cls, v):
        """Normalize role to uppercase to handle frontend case sensitivity."""
        if isinstance(v, str):
            return v.upper()
        return v

    @validator('professional_role', pre=True)
    def normalize_professional_role(cls, v):
        """Handle empty strings for professional_role by converting to None."""
        if v == "" or v is None:
            return None
        return v


class UserRead(BaseModel):
    """User profile response."""
    id: uuid.UUID = Field(..., description="User UUID")
    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    role: UserRole = Field(..., description="User role")
    professional_role: Optional[ProfessionalRole] = Field(default=None, description="Professional role (for professionals)")
    department: Optional[str] = Field(default=None, description="Department")
    employee_id: Optional[str] = Field(default=None, description="Employee ID")
    phone_number: Optional[str] = Field(default=None, description="Phone number")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")


# Aliases for backward compatibility
UserRegistrationRequest = UserCreate
UserProfileResponse = UserRead
