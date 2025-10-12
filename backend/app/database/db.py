"""
Database configuration and session management
SQLAlchemy async setup with PostgreSQL and pgvector
"""
import os
from typing import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
import structlog
import dotenv

dotenv.load_dotenv()

logger = structlog.get_logger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


# Event listener to enable pgvector extension
@event.listens_for(engine.sync_engine, "connect")
def enable_pgvector(dbapi_connection, connection_record):
    """Enable pgvector extension on database connection."""
    try:
        with dbapi_connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            dbapi_connection.commit()
        logger.info("✅ pgvector and pg_trgm extensions enabled")
    except Exception as e:
        logger.warning(f"⚠️ Could not enable extensions: {e}")


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from app.models import (
            professional,
            patients, 
            patient_visit_sessions,
            uploaded_documents,
            session_soap_notes,
            audit_log
        )
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created")


async def close_database():
    """Close database connections."""
    await engine.dispose()
    logger.info("✅ Database connections closed")


async def check_database_health() -> bool:
    """
    Check database connection health.
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        async with async_session_maker() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
