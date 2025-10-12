"""
Authentication Service
Implements JWT authentication with refresh tokens and bcrypt password hashing
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import structlog

import bcrypt
import jwt
from sqlalchemy import select

from app.models.professional import Professional
from app.schemas.auth_schemas import (
    Token, TokenData, LoginRequest, LoginResponse, 
    UserRegistrationRequest, UserProfileResponse
)
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class AuthenticationService:
    """Service for JWT authentication and user management."""
    
    def __init__(self):
        """Initialize authentication service."""
        self.secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.bcrypt_rounds = int(os.getenv("BCRYPT_ROUNDS", "12"))
    
    def hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt.
        
        Args:
            password: Plain text password
            
        Returns:
            str: Hashed password
        """
        salt = bcrypt.gensalt(rounds=self.bcrypt_rounds)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify password against hash.
        
        Args:
            password: Plain text password
            hashed_password: Hashed password from database
            
        Returns:
            bool: True if password is correct
        """
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error("Password verification failed", error=str(e))
            return False
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT access token.
        
        Args:
            data: Token payload data
            
        Returns:
            str: JWT access token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT refresh token.
        
        Args:
            data: Token payload data
            
        Returns:
            str: JWT refresh token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> Optional[dict]:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token to verify
            
        Returns:
            dict: Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error("Token verification failed", error=str(e))
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Professional]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Professional: Authenticated user or None
        """
        async with async_session_maker() as session:
            try:
                # Find user by email (case-insensitive)
                stmt = select(Professional).where(
                    Professional.email.ilike(email.lower())
                )
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    logger.warning("User not found", email=email)
                    return None
                
                # Verify password against stored hash
                if not self.verify_password(password, user.password_hash):
                    logger.warning("Invalid password", email=email)
                    return None
                
                logger.info("User authenticated successfully", user_id=str(user.id), email=email)
                return user
                
            except Exception as e:
                logger.error("Authentication failed", error=str(e), email=email)
                return None
    
    async def login(self, request: LoginRequest) -> LoginResponse:
        """
        User login with JWT token generation.
        
        Args:
            request: Login request with email and password
            
        Returns:
            LoginResponse: Login result with tokens
        """
        try:
            logger.info("User login attempt", email=request.email)
            
            # Authenticate user
            user = await self.authenticate_user(request.email, request.password)
            if not user:
                return LoginResponse(
                    success=False,
                    token=None,
                    user=None,
                    message="Invalid email or password"
                )
            
            # Create token payload
            token_data = {
                "user_id": str(user.id),
                "email": user.email,
                "role": user.role.value
            }
            
            # Generate tokens
            access_token = self.create_access_token(token_data)
            refresh_token = self.create_refresh_token(token_data)
            
            token = Token(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=self.access_token_expire_minutes * 60
            )
            
            # User profile data
            user_data = {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "department": user.department,
                "employee_id": user.employee_id
            }
            
            logger.info("User logged in successfully", user_id=str(user.id), email=user.email)
            
            return LoginResponse(
                success=True,
                token=token,
                user=user_data,
                message="Login successful"
            )
            
        except Exception as e:
            logger.error("Login failed", error=str(e), email=request.email)
            return LoginResponse(
                success=False,
                token=None,
                user=None,
                message=f"Login failed: {str(e)}"
            )
    
    async def refresh_token(self, refresh_token: str) -> Optional[Token]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Token: New access token or None if invalid
        """
        try:
            # Verify refresh token
            payload = self.decode_token(refresh_token)
            if not payload or payload.get("type") != "refresh":
                return None
            
            # Create new token payload
            new_token_data = {
                "user_id": payload.get("user_id"),
                "email": payload.get("email"),
                "role": payload.get("role")
            }
            
            # Generate new access token
            new_access_token = self.create_access_token(new_token_data)
            
            return Token(
                access_token=new_access_token,
                refresh_token=refresh_token,  # Keep same refresh token
                token_type="bearer",
                expires_in=self.access_token_expire_minutes * 60
            )
            
        except Exception as e:
            logger.error("Token refresh failed", error=str(e))
            return None
    
    async def get_current_user(self, token: str) -> Optional[Professional]:
        """
        Get current user from access token.
        
        Args:
            token: JWT access token
            
        Returns:
            Professional: Current user or None if invalid
        """
        try:
            # Verify access token
            payload = self.decode_token(token)
            if not payload or payload.get("type") != "access":
                return None
            
            user_id = payload.get("user_id")
            if not user_id:
                return None
            
            # Get user from database
            async with async_session_maker() as session:
                stmt = select(Professional).where(Professional.id == uuid.UUID(user_id))
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                
                return user
                
        except Exception as e:
            logger.error("Get current user failed", error=str(e))
            return None
    
    async def register_professional(self, request: UserRegistrationRequest) -> UserProfileResponse:
        """
        Register new healthcare professional.
        
        Args:
            request: Registration request
            
        Returns:
            UserProfileResponse: Created user profile
        """
        async with async_session_maker() as session:
            try:
                # Check if email already exists
                stmt = select(Professional).where(
                    Professional.email.ilike(request.email.lower())
                )
                result = await session.execute(stmt)
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    raise ValueError("Email already registered")
                
                # Hash password
                hashed_password = self.hash_password(request.password)
                
                # Create new professional
                new_professional = Professional(
                    name=request.name,
                    email=request.email.lower(),
                    password_hash=hashed_password,
                    role=request.role,
                    department=request.department,
                    employee_id=request.employee_id,
                    phone_number=request.phone_number
                )
                
                session.add(new_professional)
                await session.commit()
                await session.refresh(new_professional)
                
                logger.info("Professional registered successfully", user_id=str(new_professional.id), email=request.email)
                
                return UserProfileResponse(
                    id=new_professional.id,
                    name=new_professional.name,
                    email=new_professional.email,
                    role=new_professional.role,
                    department=new_professional.department,
                    employee_id=new_professional.employee_id,
                    phone_number=new_professional.phone_number,
                    created_at=new_professional.created_at,
                    updated_at=new_professional.updated_at
                )
                
            except Exception as e:
                await session.rollback()
                logger.error("Professional registration failed", error=str(e), email=request.email)
                raise
