"""
AI Service Configuration Settings
Environment variables and configuration for the AI microservice
"""
import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class AIServiceSettings(BaseSettings):
    """Configuration settings for AI Service."""
    
    # Service Configuration
    service_name: str = Field(default="echo-notes-ai-service", description="Service name")
    service_version: str = Field(default="1.0.0", description="Service version")
    host: str = Field(default="0.0.0.0", description="Host to bind to")
    port: int = Field(default=8002, description="Port to bind to")
    debug: bool = Field(default=False, description="Debug mode")
    
    # Main Backend Service
    backend_service_url: str = Field(
        default="http://backend:8000", 
        description="URL of the main backend service"
    )
    
    # Database Configuration (shared with main backend)
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/echo_note_rag",
        description="Database connection URL"
    )
    
    # OpenAI Configuration
    openai_api_key: str = Field(description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o-mini", description="OpenAI model for generation")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small", 
        description="OpenAI embedding model"
    )
    temperature: float = Field(default=0.1, description="LLM temperature")
    
    # HuggingFace Configuration
    huggingface_api_token: str = Field(description="HuggingFace API token")
    huggingface_model_id: str = Field(
        default="aaditya/Llama3-OpenBioLLM-70B",
        description="HuggingFace model ID for SOAP generation"
    )
    
    # NER Configuration
    ner_model_name: str = Field(
        default="d4data/biomedical-ner-all",
        description="NER model name"
    )
    
    # Model Caching Configuration
    transformers_cache: str = Field(
        default="/app/.cache/huggingface",
        description="HuggingFace transformers cache directory"
    )
    hf_home: str = Field(
        default="/app/.cache/huggingface",
        description="HuggingFace home directory"
    )
    torch_home: str = Field(
        default="/app/.cache/torch",
        description="PyTorch cache directory"
    )
    
    # Performance Configuration
    max_concurrent_requests: int = Field(
        default=10,
        description="Maximum concurrent requests"
    )
    request_timeout: int = Field(
        default=300,
        description="Request timeout in seconds"
    )
    
    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    
    class Config:
        env_file = ".env"
        env_prefix = "AI_SERVICE_"
        case_sensitive = False


# Global settings instance
settings = AIServiceSettings()
