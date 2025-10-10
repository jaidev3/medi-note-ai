"""
Echo Notes AI Service - FastAPI Application
Main entry point for the AI microservice handling ML/LLM operations
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

from config.settings import settings

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
    logger.info("🚀 Starting Echo Notes AI Service...")
    
    # Note: legacy model cache environment variables removed from settings.
    # If you need to set cache dirs, provide them via the environment or
    # implement new configuration fields in `config/settings.py`.
    
    # TODO: Initialize AI models and services
    # TODO: Pre-load models for faster inference
    # TODO: Setup model caching
    # TODO: Initialize database connections if needed
    
    logger.info("✅ Echo Notes AI Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Echo Notes AI Service...")
    
    # TODO: Cleanup model resources
    # TODO: Close connections
    
    logger.info("✅ Echo Notes AI Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Echo Notes AI Service",
    description="AI Microservice for ML/LLM operations including SOAP generation, RAG, NER, and PII detection",
    version=settings.service_version,
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
TRUSTED_HOSTS = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1,*.localhost,backend").split(",")

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=TRUSTED_HOSTS
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error("Unhandled exception occurred in AI service", 
                exc_info=exc, 
                request_url=str(request.url))
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred in AI service. Please try again later.",
            "service": "ai-service",
            "request_id": getattr(request.state, "request_id", None)
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "echo-notes-ai-service",
        "version": settings.service_version,
        "models_loaded": False,  # TODO: Update based on actual model status
        "backend_connection": settings.backend_service_url
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with AI service information."""
    return {
        "message": "Echo Notes AI Service",
        "description": "AI Microservice for ML/LLM operations",
        "version": settings.service_version,
        "docs_url": "/docs",
        "health_check": "/health",
        "capabilities": [
            "SOAP Note Generation",
            "RAG Queries", 
            "NER Extraction",
            "PII Detection",
            "Embedding Generation"
        ]
    }


# Model status endpoint
@app.get("/models/status", tags=["Models"])
async def model_status():
    """Get status of loaded AI models (reflects primary/active models only)."""
    # Only report primary models configured in settings. Use getattr for safety
    # in case a field is not present.
    soap_model = getattr(settings, "huggingface_model_id", None)
    rag_model = getattr(settings, "openai_embedding_model", None)
    ner_model = getattr(settings, "ner_model_name", None)

    status = {
        "soap_model": {"loaded": False, "model": soap_model},
        "rag_model": {"loaded": False, "model": rag_model},
        "ner_model": {"loaded": False, "model": ner_model},
        "pii_model": {"loaded": False, "model": getattr(settings, "gemini_model", "gemini")}
    }

    # Include cache_directory only if available
    cache_dir = getattr(settings, "transformers_cache", None)
    if cache_dir:
        status["cache_directory"] = cache_dir

    return status


# Include API routers
from api import soap_api, ner_api, pii_api, embeddings_api

app.include_router(soap_api.router, prefix="/soap", tags=["SOAP Generation"])
app.include_router(ner_api.router, prefix="/ner", tags=["NER Extraction"])
app.include_router(pii_api.router, prefix="/pii", tags=["PII Detection"])
app.include_router(embeddings_api.router, prefix="/embeddings", tags=["Embeddings"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        loop="asyncio"
    )
