"""
Database dependency injection and common dependencies
"""
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import get_async_session


# Database session dependency
DatabaseSession = Annotated[AsyncSession, Depends(get_async_session)]


# Pagination dependency
class PaginationParams:
    """Pagination parameters for API endpoints."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (starts from 1)"),
        size: int = Query(20, ge=1, le=100, description="Number of items per page"),
        sort_by: str = Query("created_at", description="Field to sort by"),
        sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order")
    ):
        self.page = page
        self.size = size
        self.sort_by = sort_by
        self.sort_order = sort_order
        
    @property
    def offset(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.size
    
    @property
    def limit(self) -> int:
        """Get limit for database query."""
        return self.size


# Pagination dependency
PaginationDep = Annotated[PaginationParams, Depends(PaginationParams)]
