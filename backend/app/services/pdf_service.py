"""
PDF Generation Service
Handles PDF generation for SOAP notes using ReportLab
"""
import io
from datetime import datetime
from typing import Dict, Any, Optional
import structlog

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

logger = structlog.get_logger(__name__)


class PDFService:
    """Service for generating PDF documents."""
    
    def __init__(self):
        """Initialize PDF service."""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for SOAP notes."""
        # Custom title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1e293b'),  # slate-800
            fontName='Helvetica-Bold'
        )
        
        # Custom section header style
        self.section_header_style = ParagraphStyle(
            'CustomSectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#334155'),  # slate-700
            fontName='Helvetica-Bold',
            leftIndent=0
        )
        
        # Custom content style
        self.content_style = ParagraphStyle(
            'CustomContent',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            textColor=colors.HexColor('#475569'),  # slate-600
            fontName='Helvetica',
            alignment=TA_JUSTIFY,
            leftIndent=20,
            rightIndent=20
        )
        
        # Custom metadata style
        self.metadata_style = ParagraphStyle(
            'CustomMetadata',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            textColor=colors.HexColor('#64748b'),  # slate-500
            fontName='Helvetica',
            alignment=TA_LEFT
        )
    
    def generate_soap_note_pdf(
        self, 
        soap_note_data: Dict[str, Any],
        patient_data: Optional[Dict[str, Any]] = None,
        session_data: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Generate a PDF for a SOAP note.
        
        Args:
            soap_note_data: SOAP note data containing content and metadata
            patient_data: Optional patient information
            session_data: Optional session information
            
        Returns:
            bytes: PDF file content as bytes
        """
        try:
            # Create a buffer to store the PDF
            buffer = io.BytesIO()
            
            # Create the PDF document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=0.75*inch,
                leftMargin=0.75*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch
            )
            
            # Build the PDF content
            story = []
            
            # Add header with title
            story.append(Paragraph("SOAP Note", self.title_style))
            story.append(Spacer(1, 20))
            
            # Add metadata section
            if patient_data or session_data:
                story.extend(self._create_metadata_section(patient_data, session_data))
                story.append(Spacer(1, 20))
            
            # Add SOAP sections
            story.extend(self._create_soap_sections(soap_note_data))
            
            # Add footer with generation timestamp
            story.append(Spacer(1, 30))
            story.append(Paragraph(
                f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
                self.metadata_style
            ))
            
            # Build the PDF
            doc.build(story)
            
            # Get the PDF content
            pdf_content = buffer.getvalue()
            buffer.close()
            
            logger.info("SOAP note PDF generated successfully")
            return pdf_content
            
        except Exception as e:
            logger.error("Failed to generate SOAP note PDF", error=str(e))
            raise Exception(f"PDF generation failed: {str(e)}")
    
    def _create_metadata_section(
        self, 
        patient_data: Optional[Dict[str, Any]], 
        session_data: Optional[Dict[str, Any]]
    ) -> list:
        """Create the metadata section with patient and session information."""
        metadata_story = []
        
        # Create metadata table
        metadata_rows = []
        
        if patient_data:
            patient_name = patient_data.get('name', 'Unknown Patient')
            patient_id = patient_data.get('id', 'N/A')
            metadata_rows.append(['Patient Name:', patient_name])
            metadata_rows.append(['Patient ID:', str(patient_id)[:8] + '...'])
        
        if session_data:
            visit_date = session_data.get('visit_date')
            if visit_date:
                try:
                    formatted_date = datetime.fromisoformat(str(visit_date)).strftime('%B %d, %Y')
                    metadata_rows.append(['Visit Date:', formatted_date])
                except:
                    metadata_rows.append(['Visit Date:', str(visit_date)])
        
        if metadata_rows:
            # Add creation date
            metadata_rows.append(['Note Created:', datetime.now().strftime('%B %d, %Y')])
            
            # Create the table
            metadata_table = Table(metadata_rows, colWidths=[2*inch, 4*inch])
            metadata_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ]))
            
            metadata_story.append(metadata_table)
        
        return metadata_story
    
    def _create_soap_sections(self, soap_note_data: Dict[str, Any]) -> list:
        """Create the SOAP note sections."""
        sections_story = []
        
        # Define SOAP section order and titles
        soap_sections = [
            ('subjective', 'Subjective'),
            ('objective', 'Objective'),
            ('assessment', 'Assessment'),
            ('plan', 'Plan')
        ]
        
        for section_key, section_title in soap_sections:
            section_content = self._extract_section_content(soap_note_data, section_key)
            
            if section_content:
                # Add section header
                sections_story.append(Paragraph(section_title, self.section_header_style))
                
                # Add section content
                sections_story.append(Paragraph(section_content, self.content_style))
                sections_story.append(Spacer(1, 15))
        
        # Add additional notes if available
        if soap_note_data.get('notes'):
            sections_story.append(Paragraph("Additional Notes", self.section_header_style))
            sections_story.append(Paragraph(soap_note_data['notes'], self.content_style))
            sections_story.append(Spacer(1, 15))
        
        return sections_story
    
    def _extract_section_content(self, soap_note_data: Dict[str, Any], section_key: str) -> str:
        """Extract content for a specific SOAP section."""
        content = ""
        
        # Strategy 1: Check main content object
        if soap_note_data.get('content') and isinstance(soap_note_data['content'], dict):
            section_data = soap_note_data['content'].get(section_key)
            if section_data:
                if isinstance(section_data, str):
                    content = section_data
                elif isinstance(section_data, dict):
                    content = str(section_data.get('content', section_data.get('text', section_data.get('value', ''))))
                else:
                    content = str(section_data)
        
        # Strategy 2: Check sections array
        if not content and soap_note_data.get('sections'):
            for section in soap_note_data['sections']:
                if section.get('section_type') == section_key and section.get('content'):
                    content = str(section['content'])
                    break
        
        # Strategy 3: Check soap_note object
        if not content and soap_note_data.get('soap_note'):
            soap_obj = soap_note_data['soap_note']
            if section_key in soap_obj and soap_obj[section_key]:
                section_data = soap_obj[section_key]
                if isinstance(section_data, dict):
                    content = str(section_data.get('content', ''))
                else:
                    content = str(section_data)
        
        # Strategy 4: Try to find any content that might match the section type
        if not content and soap_note_data.get('content'):
            for key, value in soap_note_data['content'].items():
                if section_key.lower() in key.lower():
                    content = str(value)
                    break
        
        return content or f"No {section_key} information available."
