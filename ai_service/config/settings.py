"""Minimal AI service settings.

This file provides a compact BaseSettings model intended to be
environment-driven. Sensitive defaults are removed; prefer setting
values via environment variables or a local .env file.
"""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
import os

AI_SERVICE_GEMINI_API_KEY = os.getenv("AI_SERVICE_GEMINI_API_KEY", None)


class AIServiceSettings(BaseSettings):
    """Essential configuration for the AI microservice."""

    service_name: str = Field("echo-notes-ai-service")
    # API/service semantic version used by the FastAPI app and health endpoints
    service_version: str = Field("0.0.0")
    host: str = Field("0.0.0.0")
    port: int = Field(8002)
    debug: bool = Field(False)

    # URLs and credentials should be provided via env-vars in deployment
    backend_service_url: Optional[str] = Field(None)
    database_url: Optional[str] = Field(None)

    # Optional external API keys
    google_api_key: Optional[str] = Field(None)
    gemini_model: str = Field("gemini-1.5-flash")

    request_timeout: int = Field(300)
    log_level: str = Field("INFO")
    temperature: float = Field(0.1)
    gemini_embedding_model: str = Field("gemini-embedding-001")
    embedding_dimension: int = Field(1536)

    class Config:
        env_file = ".env"
        env_prefix = "AI_SERVICE_"
        case_sensitive = False
        extra = "allow"   # <-- allow unknown keys


# single shared settings instance used by the service
settings = AIServiceSettings()
