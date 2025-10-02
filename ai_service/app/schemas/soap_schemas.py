"""
SOAP Note schemas for AI service
Adapted from main backend schemas for the AI microservice
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, validator

from .ner_schemas import NEROutput


class SOAPSection(BaseModel):
    """Individual SOAP section (Subjective, Objective, Assessment, Plan)."""
    content: str = Field(..., description="Section content")
    confidence: float = Field(default=1.0, description="AI confidence in this section", ge=0.0, le=1.0)
    word_count: int = Field(default=0, description="Number of words in section")


class SOAPNote(BaseModel):
    """Complete SOAP note structure."""
    subjective: SOAPSection = Field(..., description="Subjective section - patient's symptoms and concerns")
    objective: SOAPSection = Field(..., description="Objective section - clinical findings and test results")
    assessment: SOAPSection = Field(..., description="Assessment section - clinical interpretation")
    plan: SOAPSection = Field(..., description="Plan section - treatment recommendations")
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="When SOAP note was generated")
    model_version: str = Field(default="1.0", description="Version of AI model used")
    total_confidence: float = Field(default=1.0, description="Overall confidence score", ge=0.0, le=1.0)


class SOAPGenerationRequest(BaseModel):
    """Request schema for SOAP note generation."""
    text: str = Field(..., description="Clinical text to convert to SOAP format", min_length=1)
    session_id: uuid.UUID = Field(..., description="Patient visit session ID")
    document_id: Optional[uuid.UUID] = Field(default=None, description="Source document ID (optional for text-only)")
    professional_id: Optional[uuid.UUID] = Field(default=None, description="ID of healthcare professional")
    
    # Optional parameters
    include_context: bool = Field(default=True, description="Whether to include NER context data")
    max_length: int = Field(default=8000, description="Maximum length of generated SOAP note")
    temperature: float = Field(default=0.1, description="AI model temperature", ge=0.0, le=2.0)
    
    # PII masking parameters
    enable_pii_masking: bool = Field(default=True, description="Whether to anonymize PII before SOAP generation")
    preserve_medical_context: bool = Field(default=True, description="Whether to preserve medical terminology during PII masking")
    
    @validator('professional_id', 'document_id', pre=True)
    def convert_empty_strings_to_none(cls, v):
        """Convert empty strings to None for UUID fields."""
        if v == "" or v == "null" or v == "undefined":
            return None
        return v


class SOAPGenerationResponse(BaseModel):
    """Response schema for SOAP note generation."""
    success: bool = Field(..., description="Whether SOAP generation was successful")
    soap_note: Optional[SOAPNote] = Field(default=None, description="Generated SOAP note")
    context_data: Optional[NEROutput] = Field(default=None, description="NER context data used")
    ai_approved: bool = Field(default=False, description="Whether AI judge approved the note")
    note_id: Optional[uuid.UUID] = Field(default=None, description="Database ID of saved SOAP note")
    
    # Processing metadata
    processing_time: float = Field(default=0.0, description="Total processing time in seconds")
    regeneration_count: int = Field(default=0, description="Number of times note was regenerated")
    validation_feedback: str = Field(default="", description="Feedback from AI judge")
    message: str = Field(default="", description="Status or error message")
    
    # PII masking metadata
    pii_masked: bool = Field(default=False, description="Whether PII masking was applied")
    pii_entities_found: int = Field(default=0, description="Number of PII entities found and masked")
    original_text_preserved: bool = Field(default=True, description="Whether original text is preserved in database")


class JudgeLLMResponse(BaseModel):
    """Internal schema for Judge LLM validation response."""
    approved: bool = Field(..., description="Whether the SOAP note is approved")
    reason: str = Field(..., description="Reason for approval/rejection")
    confidence: float = Field(default=1.0, description="Judge confidence", ge=0.0, le=1.0)
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
