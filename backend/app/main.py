"""
Echo Notes Backend - AI-Powered SOAP Note Generation System
FastAPI application main entry point
"""
import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting Echo Notes Backend...")
    
    # TODO: Initialize database connection
    # TODO: Initialize vector database (pgvector)
    # TODO: Load AI models
    # TODO: Setup background tasks
    
    logger.info("✅ Echo Notes Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Echo Notes Backend...")
    
    # TODO: Close database connections
    # TODO: Cleanup resources
    
    logger.info("✅ Echo Notes Backend shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Echo Notes Backend",
    description="AI-Powered SOAP Note Generation System for Hearing Care Professionals",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",") if os.getenv("CORS_ORIGINS") != "*" else ["*"]
CORS_CREDENTIALS = os.getenv("CORS_CREDENTIALS", "false").lower() == "true"
CORS_METHODS = os.getenv("CORS_METHODS", "*").split(",") if os.getenv("CORS_METHODS") != "*" else ["*"]
CORS_HEADERS = os.getenv("CORS_HEADERS", "*").split(",") if os.getenv("CORS_HEADERS") != "*" else ["*"]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Trusted Host Configuration
TRUSTED_HOSTS = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1,*.localhost").split(",")

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=TRUSTED_HOSTS
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error("Unhandled exception occurred", 
                exc_info=exc, 
                request_url=str(request.url))
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": getattr(request.state, "request_id", None)
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "service": "echo-notes-backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Echo Notes Backend API",
        "description": "AI-Powered SOAP Note Generation System",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health"
    }


# Include API routers
from app.routes import (
    auth_routes, user_routes, patient_routes, document_routes, 
    soap_routes, rag_routes, session_routes, professional_routes,
    ai_soap_routes, ai_ner_routes, ai_pii_routes, ai_embeddings_routes
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(user_routes.router, prefix="/users", tags=["Users"])
app.include_router(patient_routes.router, prefix="/patients", tags=["Patients"])
app.include_router(session_routes.router, prefix="/sessions", tags=["Sessions"])
app.include_router(document_routes.router, prefix="/documents", tags=["Documents"])
app.include_router(soap_routes.router, prefix="/soap", tags=["SOAP Notes"])
app.include_router(rag_routes.router, prefix="/rag", tags=["RAG Queries"])
app.include_router(professional_routes.router, prefix="/professionals", tags=["Professionals"])

# AI Service Routes (Direct Integration)
app.include_router(ai_soap_routes.router, prefix="/ai/soap", tags=["AI SOAP Generation"])
app.include_router(ai_ner_routes.router, prefix="/ai/ner", tags=["AI NER Extraction"])
app.include_router(ai_pii_routes.router, prefix="/ai/pii", tags=["AI PII Detection"])
app.include_router(ai_embeddings_routes.router, prefix="/ai/embeddings", tags=["AI Embeddings"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        loop="asyncio"
    )