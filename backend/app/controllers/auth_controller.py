"""
Authentication Controller
Handles authentication-related business logic and request orchestration
"""
import uuid
from typing import Optional
from datetime import datetime
import structlog

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth_schemas import UserLogin, Token, UserRead, UserCreate
from app.services.authentication_service import AuthenticationService
from app.models.professional import Professional
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class AuthController:
    """Controller for authentication operations."""
    
    def __init__(self):
        """Initialize authentication controller."""
        self.auth_service = AuthenticationService()
    
    async def login_user(self, login_data: UserLogin) -> Token:
        """
        Authenticate user and generate tokens.
        
        Args:
            login_data: User login credentials
            
        Returns:
            Token: Access and refresh tokens
            
        Raises:
            HTTPException: If authentication fails
        """
        try:
            logger.info("User login attempt", email=login_data.email)
            
            async with async_session_maker() as session:
                # Find user by email
                stmt = select(Professional).where(Professional.email == login_data.email.lower())
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    logger.warning("Login failed - user not found", email=login_data.email)
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )
                
                # Verify password
                if not self.auth_service.verify_password(login_data.password, user.password_hash):
                    logger.warning("Login failed - invalid password", email=login_data.email)
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )
                
                # Generate tokens
                access_token = self.auth_service.create_access_token(
                    data={"sub": str(user.id), "email": user.email, "role": user.role.value}
                )
                refresh_token = self.auth_service.create_refresh_token(
                    data={"sub": str(user.id), "email": user.email}
                )
                
                logger.info("User login successful", user_id=str(user.id), email=user.email)
                
                return Token(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_type="bearer",
                    expires_in=self.auth_service.access_token_expire_minutes * 60
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Login error", error=str(e), email=login_data.email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed due to server error"
            )
    
    async def refresh_token(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Token: New access and refresh tokens
            
        Raises:
            HTTPException: If refresh token is invalid
        """
        try:
            logger.info("Token refresh attempt")
            
            # Decode refresh token
            payload = self.auth_service.decode_token(refresh_token)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Verify user still exists
            async with async_session_maker() as session:
                stmt = select(Professional).where(Professional.id == uuid.UUID(user_id))
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found"
                    )
                
                # Generate new tokens
                access_token = self.auth_service.create_access_token(
                    data={"sub": str(user.id), "email": user.email, "role": user.role.value}
                )
                new_refresh_token = self.auth_service.create_refresh_token(
                    data={"sub": str(user.id), "email": user.email}
                )
                
                logger.info("Token refresh successful", user_id=str(user.id))
                
                return Token(
                    access_token=access_token,
                    refresh_token=new_refresh_token,
                    token_type="bearer",
                    expires_in=self.auth_service.access_token_expire_minutes * 60
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Token refresh error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token refresh failed"
            )
    
    async def get_current_user(self, token: str) -> UserRead:
        """
        Get current user information from token.
        
        Args:
            token: Valid access token
            
        Returns:
            UserRead: Current user information
            
        Raises:
            HTTPException: If token is invalid or user not found
        """
        try:
            # Decode token
            payload = self.auth_service.decode_token(token)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid access token"
                )
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Get user from database
            async with async_session_maker() as session:
                stmt = select(Professional).where(Professional.id == uuid.UUID(user_id))
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found"
                    )
                
                return UserRead(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    role=user.role,
                    department=user.department,
                    employee_id=user.employee_id,
                    phone_number=user.phone_number,
                    created_at=user.created_at,
                    updated_at=user.updated_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Get current user error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user information"
            )
    
    async def register_user(self, user_data: UserCreate) -> UserRead:
        """
        Register a new user (professional).
        
        Args:
            user_data: User registration data
            
        Returns:
            UserRead: Created user information
            
        Raises:
            HTTPException: If registration fails
        """
        try:
            logger.info("User registration attempt", email=user_data.email)
            
            async with async_session_maker() as session:
                # Check if email already exists
                stmt = select(Professional).where(Professional.email == user_data.email.lower())
                result = await session.execute(stmt)
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
                
                # Hash password
                password_hash = self.auth_service.hash_password(user_data.password)
                
                # Create new user
                new_user = Professional(
                    name=user_data.name,
                    email=user_data.email.lower(),
                    password_hash=password_hash,
                    role=user_data.role,
                    department=user_data.department,
                    employee_id=user_data.employee_id,
                    phone_number=user_data.phone_number
                )
                
                session.add(new_user)
                await session.commit()
                await session.refresh(new_user)
                
                logger.info("User registration successful", user_id=str(new_user.id), email=user_data.email)
                
                return UserRead(
                    id=new_user.id,
                    email=new_user.email,
                    name=new_user.name,
                    role=new_user.role,
                    department=new_user.department,
                    employee_id=new_user.employee_id,
                    phone_number=new_user.phone_number,
                    created_at=new_user.created_at,
                    updated_at=new_user.updated_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error("User registration error", error=str(e), email=user_data.email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed due to server error"
            )
    
    async def logout_user(self, token: str) -> dict:
        """
        Logout user (invalidate token).
        
        Args:
            token: Access token to invalidate
            
        Returns:
            dict: Logout confirmation
            
        Note:
            In a production system, you would add the token to a blacklist
            or use a token store like Redis to track invalidated tokens.
        """
        try:
            # Verify token is valid
            payload = self.auth_service.decode_token(token)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid access token"
                )
            
            user_id = payload.get("sub")
            logger.info("User logout successful", user_id=user_id)
            
            # TODO: Add token to blacklist in production
            # await self.auth_service.blacklist_token(token)
            
            return {
                "message": "Successfully logged out",
                "logged_out_at": datetime.utcnow().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Logout error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed due to server error"
            )
