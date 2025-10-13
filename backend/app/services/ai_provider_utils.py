"""
AI Provider Utilities
Centralized utilities for initializing AI providers with fallback support
"""
import os
from typing import Tuple, Literal
import structlog

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI

logger = structlog.get_logger(__name__)

ProviderType = Literal["openai", "google"]


def get_chat_model(temperature: float = 0.1) -> Tuple[any, ProviderType]:
    """
    Initialize chat/LLM model with OpenAI or Google Gemini fallback.
    
    Args:
        temperature: Model temperature (0.0 - 1.0)
        
    Returns:
        Tuple[ChatModel, ProviderType]: Initialized chat model and provider name
        
    Raises:
        RuntimeError: If no API key is available
    """
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    google_api_key = os.getenv("GOOGLE_API_KEY", "")
    
    if openai_api_key:
        logger.info("Initializing ChatOpenAI")
        openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        model = ChatOpenAI(
            model=openai_model,
            temperature=temperature,
            api_key=openai_api_key
        )
        return model, "openai"
        
    elif google_api_key:
        logger.info("OpenAI API key not found, using Google Gemini for chat model")
        # Accept both older env var names and the repo's AI_SERVICE_* convention
        google_model = os.getenv("GOOGLE_MODEL") or os.getenv("AI_SERVICE_GEMINI_MODEL") or "gemini-1.5-flash-latest"
        model = ChatGoogleGenerativeAI(
            model=google_model,
            temperature=temperature,
            google_api_key=google_api_key
        )
        return model, "google"
        
    else:
        raise RuntimeError(
            "No API key found. Please set either OPENAI_API_KEY or GOOGLE_API_KEY environment variable."
        )


def get_embedding_model() -> Tuple[any, ProviderType]:
    """
    Initialize embedding model with OpenAI or Google Gemini fallback.
    
    Returns:
        Tuple[EmbeddingModel, ProviderType]: Initialized embedding model and provider name
        
    Raises:
        RuntimeError: If no API key is available
    """
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    google_api_key = os.getenv("GOOGLE_API_KEY", "")
    
    if openai_api_key:
        logger.info("Initializing OpenAIEmbeddings")
        openai_embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        model = OpenAIEmbeddings(
            model=openai_embedding_model,
            api_key=openai_api_key
        )
        return model, "openai"
        
    elif google_api_key:
        logger.info("OpenAI API key not found, using Google Gemini for embeddings")
        # Prefer AI_SERVICE_GEMINI_EMBEDDING_MODEL if present
        google_embedding_model = os.getenv("GOOGLE_EMBEDDING_MODEL") or os.getenv("AI_SERVICE_GEMINI_EMBEDDING_MODEL") or "models/embedding-001"
        model = GoogleGenerativeAIEmbeddings(
            model=google_embedding_model,
            google_api_key=google_api_key
        )
        return model, "google"
        
    else:
        raise RuntimeError(
            "No API key found. Please set either OPENAI_API_KEY or GOOGLE_API_KEY environment variable."
        )


def get_available_provider() -> ProviderType:
    """
    Get the name of the available AI provider.
    
    Returns:
        ProviderType: "openai" or "google"
        
    Raises:
        RuntimeError: If no API key is available
    """
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    google_api_key = os.getenv("GOOGLE_API_KEY", "")
    
    if openai_api_key:
        return "openai"
    elif google_api_key:
        return "google"
    else:
        raise RuntimeError(
            "No API key found. Please set either OPENAI_API_KEY or GOOGLE_API_KEY environment variable."
        )
