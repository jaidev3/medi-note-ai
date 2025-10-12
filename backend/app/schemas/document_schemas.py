"""
Document management schemas for file upload and processing
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class DocumentUploadRequest(BaseModel):
    """Request schema for document upload."""
    session_id: uuid.UUID = Field(..., description="Patient visit session ID")
    
    # Optional metadata
    description: Optional[str] = Field(default=None, description="Document description", max_length=500)
    upload_source: str = Field(default="web", description="Upload source (web, mobile, api)")
    
    # Processing options
    extract_text: bool = Field(default=True, description="Whether to extract text content")
    generate_soap: bool = Field(default=True, description="Whether to generate SOAP note")


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload."""
    success: bool = Field(..., description="Whether upload was successful")
    document_id: Optional[uuid.UUID] = Field(default=None, description="Generated document ID")
    
    # File information
    document_name: str = Field(default="", description="Original document filename")
    file_size: int = Field(default=0, description="File size in bytes")
    file_type: str = Field(default="", description="File type/extension")
    file_path: Optional[str] = Field(default=None, description="Local file storage path")
    
    # Processing results
    text_extracted: bool = Field(default=False, description="Whether text was extracted")
    extracted_text: Optional[str] = Field(default=None, description="Extracted text content")
    word_count: int = Field(default=0, description="Number of words extracted")
    
    # SOAP generation results
    soap_note_id: Optional[uuid.UUID] = Field(default=None, description="Generated SOAP note ID")
    soap_generated: bool = Field(default=False, description="Whether SOAP note was generated")
    
    # PII processing results
    pii_masked: bool = Field(default=False, description="Whether PII was detected and masked during processing")
    pii_entities_found: int = Field(default=0, description="Number of PII entities detected and masked")
    
    # Processing metadata
    processing_time: float = Field(default=0.0, description="Total processing time")
    upload_time: float = Field(default=0.0, description="File upload time")
    
    message: str = Field(default="", description="Status or error message")
    warnings: List[str] = Field(default_factory=list, description="Processing warnings")


class DocumentProcessRequest(BaseModel):
    """Request schema for document processing after upload."""
    document_id: uuid.UUID = Field(..., description="Document ID to process")
    extract_text: bool = Field(default=True, description="Whether to extract text content")
    generate_soap: bool = Field(default=True, description="Whether to generate SOAP note")
    
    # Processing options
    ocr_enabled: bool = Field(default=True, description="Enable OCR for scanned documents")
    language: str = Field(default="en", description="Document language for processing")


class DocumentProcessResponse(BaseModel):
    """Response schema for document processing."""
    success: bool = Field(..., description="Whether processing was successful")
    document_id: uuid.UUID = Field(..., description="Processed document ID")
    
    # Extracted content
    extracted_text: Optional[str] = Field(default=None, description="Extracted text content")
    page_count: int = Field(default=0, description="Number of pages processed")
    word_count: int = Field(default=0, description="Number of words extracted")
    
    # SOAP generation results
    soap_note_id: Optional[uuid.UUID] = Field(default=None, description="Generated SOAP note ID")
    soap_generated: bool = Field(default=False, description="Whether SOAP note was generated")
    soap_approved: bool = Field(default=False, description="Whether SOAP note was AI approved")
    
    # Processing metadata
    processing_time: float = Field(default=0.0, description="Total processing time")
    extraction_time: float = Field(default=0.0, description="Text extraction time")
    soap_generation_time: float = Field(default=0.0, description="SOAP generation time")
    
    # PII processing results
    pii_masked: bool = Field(default=False, description="Whether PII was detected and masked during processing")
    pii_entities_found: int = Field(default=0, description="Number of PII entities detected and masked")
    
    message: str = Field(default="", description="Status message")
    warnings: List[str] = Field(default_factory=list, description="Processing warnings")


class DocumentMetadataResponse(BaseModel):
    """Response schema for document metadata."""
    document_id: uuid.UUID = Field(..., description="Document ID")
    session_id: uuid.UUID = Field(..., description="Patient visit session ID")
    document_name: str = Field(..., description="Document filename")
    file_size: int = Field(..., description="File size in bytes")
    file_type: str = Field(..., description="File type")
    
    # Storage information
    file_path: str = Field(..., description="Local file storage path")
    upload_status: str = Field(..., description="Upload status (pending, completed, failed)")
    
    # Processing status
    processed: bool = Field(default=False, description="Whether document has been processed")
    text_extracted: bool = Field(default=False, description="Whether text has been extracted")
    soap_generated: bool = Field(default=False, description="Whether SOAP note has been generated")
    
    # Timestamps
    created_at: datetime = Field(..., description="Document creation time")
    updated_at: datetime = Field(..., description="Last update time")
    processed_at: Optional[datetime] = Field(default=None, description="Processing completion time")


class DocumentListResponse(BaseModel):
    """Response schema for listing documents."""
    documents: List[DocumentMetadataResponse] = Field(default_factory=list, description="List of documents")
    total_count: int = Field(default=0, description="Total number of documents")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=20, description="Number of items per page")
    session_id: Optional[uuid.UUID] = Field(default=None, description="Session ID if filtered")


class DocumentDeleteRequest(BaseModel):
    """Request schema for document deletion."""
    document_id: uuid.UUID = Field(..., description="Document ID to delete")
    delete_file: bool = Field(default=True, description="Whether to delete the physical file")
    reason: Optional[str] = Field(default=None, description="Reason for deletion")


class DocumentDeleteResponse(BaseModel):
    """Response schema for document deletion."""
    success: bool = Field(..., description="Whether deletion was successful")
    document_id: uuid.UUID = Field(..., description="Deleted document ID")
    file_deleted: bool = Field(default=False, description="Whether physical file was deleted")
    
    message: str = Field(default="", description="Status message")


class TextExtractionResult(BaseModel):
    """Schema for text extraction results."""
    text: str = Field(..., description="Extracted text content")
    confidence: float = Field(default=1.0, description="Extraction confidence", ge=0.0, le=1.0)
    page_count: int = Field(default=1, description="Number of pages")
    word_count: int = Field(default=0, description="Number of words")
    
    # Metadata
    extraction_method: str = Field(default="text", description="Method used for extraction")
    ocr_used: bool = Field(default=False, description="Whether OCR was used")
    language_detected: Optional[str] = Field(default=None, description="Detected language")
    
    # Quality metrics
    text_quality_score: float = Field(default=1.0, description="Text quality score", ge=0.0, le=1.0)
    warnings: List[str] = Field(default_factory=list, description="Extraction warnings")
    
    # PII processing results
    pii_masked: bool = Field(default=False, description="Whether PII was detected and masked")
    pii_entities_found: int = Field(default=0, description="Number of PII entities detected and masked")


class FileValidationResult(BaseModel):
    """Schema for file validation results."""
    valid: bool = Field(..., description="Whether file is valid")
    file_type: str = Field(..., description="Detected file type")
    file_size: int = Field(..., description="File size in bytes")
    
    # Validation details
    type_allowed: bool = Field(default=True, description="Whether file type is allowed")
    size_allowed: bool = Field(default=True, description="Whether file size is allowed")
    content_valid: bool = Field(default=True, description="Whether file content is valid")
    
    # Error information
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
