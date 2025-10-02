#!/usr/bin/env python3
"""
Migration runner script to ensure database tables are created before FastAPI starts
"""
import os
import sys
import time
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)


def check_database_connection():
    """Check if we can connect to the database."""
    try:
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5433/echo_note_rag"
        )
        
        # Convert to sync URL for connection test
        sync_database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")
        logger.info("Checking database connection", url=sync_database_url.split('@')[1] if '@' in sync_database_url else sync_database_url)
        
        engine = create_engine(sync_database_url, echo=False)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info("✅ Database connected successfully", version=version[:50] + "..." if version else "Unknown")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error("❌ Database connection failed", error=str(e))
        return False


def check_tables_exist():
    """Check if the main tables exist in the database."""
    try:
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5433/echo_note_rag"
        )
        
        # Convert to sync URL
        sync_database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")
        
        engine = create_engine(sync_database_url, echo=False)
        with engine.connect() as conn:
            # Check for key tables
            tables_to_check = [
                'professional', 'patients', 'patient_visit_sessions',
                'uploaded_documents', 'session_soap_notes', 'audit_log'
            ]
            
            existing_tables = []
            missing_tables = []
            
            for table in tables_to_check:
                try:
                    result = conn.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
                    existing_tables.append(table)
                except Exception:
                    missing_tables.append(table)
            
            logger.info("Table status check", existing=existing_tables, missing=missing_tables)
            
        engine.dispose()
        return len(missing_tables) == 0, missing_tables
        
    except Exception as e:
        logger.error("❌ Failed to check tables", error=str(e))
        return False, []


def run_alembic_migrations():
    """Run Alembic migrations to create/update database schema."""
    import subprocess
    import sys
    
    try:
        logger.info("🔄 Running Alembic migrations...")
        
        # Get database URL
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5433/echo_note_rag"
        )
        
        # Convert asyncpg URL to psycopg for Alembic (sync operations)
        sync_database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")
        
        # Set environment variable for subprocess
        env = os.environ.copy()
        env["DATABASE_URL"] = sync_database_url
        
        logger.info("Running migrations with sync database URL via subprocess")
        
        # Run Alembic upgrade in subprocess to avoid asyncio conflicts
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], 
        cwd=str(backend_dir),
        env=env,
        capture_output=True,
        text=True,
        timeout=60
        )
        
        if result.returncode == 0:
            logger.info("✅ Alembic migrations completed successfully")
            if result.stdout:
                logger.info("Migration output", output=result.stdout)
            return True
        else:
            logger.error("❌ Alembic migration failed", 
                        returncode=result.returncode,
                        stdout=result.stdout,
                        stderr=result.stderr)
            return False
        
    except Exception as e:
        logger.error("❌ Alembic migration failed", error=str(e))
        return False


def wait_for_database():
    """Wait for database to be ready with retry logic."""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        if check_database_connection():
            return True
        
        retry_count += 1
        logger.info(f"⏳ Database not ready (attempt {retry_count}/{max_retries}), retrying in 2 seconds...")
        time.sleep(2)
    
    logger.error("❌ Database connection timeout after 30 attempts")
    return False


def ensure_database_ready():
    """Ensure database is connected and all tables exist."""
    logger.info("🚀 Starting database setup check...")
    
    # Step 1: Wait for database to be ready
    if not wait_for_database():
        logger.error("❌ Cannot connect to database. Exiting.")
        sys.exit(1)
    
    # Step 2: Check if tables exist
    tables_exist, missing_tables = check_tables_exist()
    
    if not tables_exist:
        logger.info("📋 Missing tables detected, running migrations...", missing=missing_tables)
        
        # Step 3: Run migrations
        if run_alembic_migrations():
            logger.info("✅ Database setup completed successfully")
            
            # Verify tables were created
            tables_exist_after, still_missing = check_tables_exist()
            if not tables_exist_after:
                logger.error("❌ Tables still missing after migration", missing=still_missing)
                sys.exit(1)
        else:
            logger.error("❌ Migration failed")
            sys.exit(1)
    else:
        logger.info("✅ All database tables already exist")
    
    logger.info("🎉 Database is ready for FastAPI application")


if __name__ == "__main__":
    ensure_database_ready()
