"""
Text Extraction Service
Handles text extraction from various document formats
"""
import io
import structlog
from typing import Optional
import PyPDF2
from docx import Document as DocxDocument
from app.schemas.document_schemas import TextExtractionResult

logger = structlog.get_logger(__name__)


class TextExtractor:
    """Service for extracting text from various document formats"""
    
    @staticmethod
    def get_sample_pdf_text() -> str:
        """Get sample PDF text for demo purposes."""
        return """
        Patient: John Doe
        Date: 2024-01-15
        
        SUBJECTIVE:
        Patient reports progressive hearing loss over the past 6 months. Difficulty understanding 
        conversations in noisy environments. Occasional tinnitus in left ear, described as ringing.
        No ear pain or discharge. Family history of hearing loss.
        
        OBJECTIVE:
        Otoscopy: Clear ear canals bilaterally, tympanic membranes intact.
        Audiometry: Moderate sensorineural hearing loss bilaterally.
        Right ear: 45-50 dB HL at 2-4 kHz
        Left ear: 40-55 dB HL at 2-4 kHz
        Speech discrimination: 88% right ear, 82% left ear
        Tympanometry: Type A bilaterally
        
        ASSESSMENT:
        Bilateral moderate sensorineural hearing loss, likely presbycusis.
        Tinnitus associated with hearing loss.
        Candidate for hearing aid amplification.
        
        PLAN:
        1. Recommend bilateral hearing aids
        2. Hearing aid evaluation and fitting
        3. Follow-up in 2 weeks for hearing aid check
        4. Tinnitus counseling and management strategies
        5. Annual audiometric follow-up
        """
    
    @staticmethod
    def get_sample_docx_text() -> str:
        """Get sample DOCX text for demo purposes."""
        return """
        Clinical Note - Hearing Evaluation
        
        Patient complains of hearing difficulties in meetings and restaurants.
        Audiometric testing shows mild to moderate hearing loss.
        Recommended hearing aid trial.
        """
    
    @staticmethod
    def get_sample_txt_text() -> str:
        """Get sample TXT text for demo purposes."""
        return """
        Brief clinical notes about patient's hearing assessment.
        Patient shows signs of age-related hearing loss.
        """
    
    @staticmethod
    def extract_text_from_pdf_content(file_content: bytes) -> tuple[str, str]:
        """
        Extract text from PDF content.
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Tuple of (extracted_text, method_name)
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            extracted_text = "\n".join(text_parts)
            return extracted_text, "pdf_extraction"
        except Exception as e:
            logger.warning("PDF extraction failed, using sample text", error=str(e))
            return TextExtractor.get_sample_pdf_text(), "pdf_sample"
    
    @staticmethod
    def extract_text_from_docx_content(file_content: bytes) -> tuple[str, str]:
        """
        Extract text from DOCX content.
        
        Args:
            file_content: DOCX file content as bytes
            
        Returns:
            Tuple of (extracted_text, method_name)
        """
        try:
            doc = DocxDocument(io.BytesIO(file_content))
            text_parts = []
            for paragraph in doc.paragraphs:
                text_parts.append(paragraph.text)
            extracted_text = "\n".join(text_parts)
            return extracted_text, "docx_extraction"
        except Exception as e:
            logger.warning("DOCX extraction failed, using sample text", error=str(e))
            return TextExtractor.get_sample_docx_text(), "docx_sample"
    
    @staticmethod
    def extract_text_from_txt_content(file_content: bytes) -> tuple[str, str]:
        """
        Extract text from TXT content.
        
        Args:
            file_content: TXT file content as bytes
            
        Returns:
            Tuple of (extracted_text, method_name)
        """
        try:
            extracted_text = file_content.decode('utf-8')
            return extracted_text, "text_extraction"
        except UnicodeDecodeError:
            try:
                extracted_text = file_content.decode('latin-1')
                return extracted_text, "text_extraction_latin1"
            except Exception as e:
                logger.warning("Text extraction failed, using sample text", error=str(e))
                return TextExtractor.get_sample_txt_text(), "text_sample"
    
    @staticmethod
    def extract_text_from_file_content(file_content: bytes, filename: str) -> TextExtractionResult:
        """
        Extract text content from file bytes.
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            TextExtractionResult: Extracted text and metadata
        """
        try:
            extracted_text = ""
            method = "unknown"
            
            # Determine file type from filename
            if filename.lower().endswith('.pdf'):
                extracted_text, method = TextExtractor.extract_text_from_pdf_content(file_content)
            elif filename.lower().endswith('.docx'):
                extracted_text, method = TextExtractor.extract_text_from_docx_content(file_content)
            elif filename.lower().endswith('.txt'):
                extracted_text, method = TextExtractor.extract_text_from_txt_content(file_content)
            else:
                # Unknown file type
                extracted_text = TextExtractor.get_sample_txt_text()
                method = "unknown_sample"
            
            # Calculate metrics
            word_count = len(extracted_text.split()) if extracted_text else 0
            
            return TextExtractionResult(
                text=extracted_text.strip(),
                confidence=0.95 if "sample" not in method else 0.5,
                page_count=1,
                word_count=word_count,
                extraction_method=method,
                ocr_used=False,
                text_quality_score=0.9 if "sample" not in method else 0.5,
                warnings=[] if "sample" not in method else ["Using sample text for demo"],
                pii_masked=False,  # Will be handled by PII processor
                pii_entities_found=0  # Will be handled by PII processor
            )
            
        except Exception as e:
            logger.error("Text extraction from file content failed", error=str(e))
            return TextExtractionResult(
                text="",
                confidence=0.0,
                page_count=0,
                word_count=0,
                extraction_method="failed",
                ocr_used=False,
                text_quality_score=0.0,
                warnings=[f"Extraction failed: {str(e)}"],
                pii_masked=False,
                pii_entities_found=0
            )
    
    @staticmethod
    def extract_text_from_document_name(document_name: str) -> TextExtractionResult:
        """
        Extract text content based on document name (for demo purposes).
        
        Args:
            document_name: Document filename
            
        Returns:
            TextExtractionResult: Extracted text and metadata
        """
        try:
            # Simulate different file types
            if document_name.lower().endswith('.pdf'):
                # Simulate PDF text extraction
                extracted_text = TextExtractor.get_sample_pdf_text()
                method = "pdf_extraction"
            elif document_name.lower().endswith('.docx'):
                # Simulate DOCX text extraction
                extracted_text = TextExtractor.get_sample_docx_text()
                method = "docx_extraction"
            else:
                # Simulate TXT file
                extracted_text = TextExtractor.get_sample_txt_text()
                method = "text_file"
            
            # Calculate metrics
            word_count = len(extracted_text.split())
            
            return TextExtractionResult(
                text=extracted_text.strip(),
                confidence=0.95,
                page_count=1,
                word_count=word_count,
                extraction_method=method,
                ocr_used=False,
                text_quality_score=0.9,
                warnings=[],
                pii_masked=False,  # Will be handled by PII processor
                pii_entities_found=0  # Will be handled by PII processor
            )
            
        except Exception as e:
            logger.error("Text extraction failed", error=str(e))
            return TextExtractionResult(
                text="",
                confidence=0.0,
                page_count=0,
                word_count=0,
                extraction_method="failed",
                ocr_used=False,
                text_quality_score=0.0,
                warnings=[f"Extraction failed: {str(e)}"],
                pii_masked=False,
                pii_entities_found=0
            )