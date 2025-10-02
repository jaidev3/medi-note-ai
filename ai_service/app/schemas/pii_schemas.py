"""
PII Detection and Anonymization schemas for AI service
"""
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class AnonymizationMethod(str, Enum):
    """Anonymization methods supported by Presidio."""
    REPLACE = "replace"
    REDACT = "redact"
    HASH = "hash"
    MASK = "mask"
    ENCRYPT = "encrypt"
    KEEP = "keep"


class PIIEntity(BaseModel):
    """Detected PII entity information."""
    entity_type: str = Field(..., description="Type of PII entity detected")
    start: int = Field(..., description="Start position in text")
    end: int = Field(..., description="End position in text")
    score: float = Field(..., description="Confidence score for detection", ge=0.0, le=1.0)
    text: str = Field(..., description="Original text of the entity")


class PIIAnalysisRequest(BaseModel):
    """Request schema for PII analysis."""
    text: str = Field(..., description="Text to analyze for PII", min_length=1)
    language: str = Field(default="en", description="Language code for analysis")
    entities: Optional[List[str]] = Field(
        default=None, 
        description="Specific entity types to detect (if None, detects all supported types)"
    )
    score_threshold: float = Field(
        default=0.35, 
        description="Minimum confidence score for entity detection",
        ge=0.0, 
        le=1.0
    )


class PIIAnalysisResponse(BaseModel):
    """Response schema for PII analysis."""
    success: bool = Field(..., description="Whether analysis was successful")
    original_text: str = Field(..., description="Original input text")
    entities: List[PIIEntity] = Field(default_factory=list, description="Detected PII entities")
    total_entities: int = Field(default=0, description="Total number of entities detected")
    has_pii: bool = Field(default=False, description="Whether any PII was detected")
    message: str = Field(default="", description="Status or error message")


class PIIAnonymizationRequest(BaseModel):
    """Request schema for PII anonymization."""
    text: str = Field(..., description="Text to anonymize", min_length=1)
    entities: Optional[List[str]] = Field(
        default=None,
        description="Specific entity types to anonymize (if None, anonymizes all detected types)"
    )
    preserve_medical_context: bool = Field(
        default=True,
        description="Whether to preserve medical terminology during anonymization"
    )
    score_threshold: float = Field(
        default=0.5,
        description="Minimum confidence score for anonymization",
        ge=0.0,
        le=1.0
    )


class PIIAnonymizationResponse(BaseModel):
    """Response schema for PII anonymization."""
    success: bool = Field(..., description="Whether anonymization was successful")
    original_text: str = Field(..., description="Original input text")
    anonymized_text: str = Field(..., description="Text with PII anonymized")
    entities_found: List[PIIEntity] = Field(default_factory=list, description="PII entities that were anonymized")
    entities_count: int = Field(default=0, description="Number of entities anonymized")
    has_pii: bool = Field(default=False, description="Whether any PII was found and anonymized")
    message: str = Field(default="", description="Status or error message")
