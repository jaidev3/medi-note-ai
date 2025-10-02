"""
NER (Named Entity Recognition) schemas for biomedical entity extraction
"""
from typing import List
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """Individual biomedical entity extracted from text."""
    type: str = Field(..., description="Type of biomedical entity (disease, symptom, medication, etc.)")
    value: str = Field(..., description="The actual entity text/value")
    confidence: float = Field(default=1.0, description="Confidence score for the entity", ge=0.0, le=1.0)
    start_pos: int = Field(default=0, description="Start position in original text")
    end_pos: int = Field(default=0, description="End position in original text")


class NEROutput(BaseModel):
    """Output format for NER model results."""
    entities: List[Entity] = Field(default_factory=list, description="List of extracted biomedical entities")
    total_entities: int = Field(default=0, description="Total number of entities found")
    processing_time: float = Field(default=0.0, description="Time taken for NER processing")


class NERRequest(BaseModel):
    """Request schema for NER processing."""
    text: str = Field(..., description="Clinical text to process for entity extraction", min_length=1)
    extract_confidence: bool = Field(default=True, description="Whether to include confidence scores")
    filter_types: List[str] = Field(
        default_factory=list,
        description="Specific entity types to extract (empty means all types)"
    )


class NERResponse(BaseModel):
    """Response schema for NER processing."""
    success: bool = Field(..., description="Whether NER processing was successful")
    data: NEROutput = Field(..., description="NER extraction results")
    message: str = Field(default="", description="Status or error message")
    request_id: str = Field(default="", description="Unique request identifier")
