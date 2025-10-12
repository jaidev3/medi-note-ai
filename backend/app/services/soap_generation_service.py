"""
SOAP Note Generation Service
Implements AI-powered SOAP note generation with Judge LLM validation
"""
import os
import time
import uuid
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime
import structlog

from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableLambda
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_provider_utils import get_chat_model

from app.schemas.soap_schemas import (
    SOAPNote, SOAPSection, SOAPGenerationRequest, 
    SOAPGenerationResponse, JudgeLLMResponse
)
from app.schemas.ner_schemas import NEROutput
from app.services.ner_service import NERService
from app.services.rag_service import RAGService
from app.services.pii_service import PIIService
from app.models.session_soap_notes import SessionSoapNotes
from app.models.uploaded_documents import UploadedDocuments
from app.database.db import async_session_maker

logger = structlog.get_logger(__name__)


class SOAPGenerationService:
    """Service for AI-powered SOAP note generation with validation."""
    
    def __init__(self):
        """Initialize SOAP generation service."""
        self.ner_service = NERService()
        self.rag_service = RAGService()
        self.pii_service = PIIService()
        self.soap_model = None
        self.soap_chain = None
        self.judge_model = None
        self.judge_chain = None
        self.provider = None  # Track which provider is being used (both models use same provider)
        self._initialize_models()
        self._setup_prompts()
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON from HuggingFace model output that may contain extra text.
        
        Args:
            text: Raw model output text
            
        Returns:
            Dict: Parsed JSON object
            
        Raises:
            ValueError: If no valid JSON is found
        """
        if not text or not text.strip():
            logger.warning("Empty text received from model")
            return self._fallback_text_parsing("")
            
        try:
            # First try to parse the entire text as JSON
            cleaned_text = text.strip()
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            logger.info("Direct JSON parsing failed, attempting extraction from text", text_preview=text[:100])
            
            # If that fails, try to extract JSON from text using more sophisticated regex
            # Look for JSON objects that contain the required SOAP sections
            json_pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'
            matches = re.findall(json_pattern, text, re.DOTALL)
            
            for match in matches:
                try:
                    # Try to parse each potential JSON match
                    parsed = json.loads(match)
                    if isinstance(parsed, dict) and all(key in parsed for key in ['subjective', 'objective', 'assessment', 'plan']):
                        logger.info("✅ Successfully extracted valid SOAP JSON from text")
                        return parsed
                except json.JSONDecodeError:
                    continue
            
            # If no valid JSON found, try to find JSON block markers
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                try:
                    json_text = text[json_start:json_end]
                    parsed = json.loads(json_text)
                    if isinstance(parsed, dict):
                        logger.info("✅ Extracted JSON using block markers")
                        return parsed
                except json.JSONDecodeError:
                    pass
            
            # Last resort: create a minimal structure from the text
            logger.warning("Failed to extract valid JSON, using fallback text parsing", text_preview=text[:200])
            return self._fallback_text_parsing(text)
            
        except Exception as e:
            logger.error("JSON extraction failed with exception", error=str(e), text_preview=text[:200])
            # Don't raise an exception, use fallback instead
            return self._fallback_text_parsing(text)
    
    def _fallback_text_parsing(self, text: str) -> Dict[str, Any]:
        """
        Fallback method to create SOAP structure from unstructured text.
        
        Args:
            text: Raw text to parse
            
        Returns:
            Dict: Basic SOAP structure
        """
        # Try to extract meaningful content from the text if possible
        text_content = text.strip() if text else "No content available"
        word_count = len(text_content.split()) if text_content else 0
        
        # If text is very short, provide minimal structure
        if word_count < 10:
            subjective_content = "Patient information requires manual review"
            objective_content = "Clinical findings require manual review"
            assessment_content = "Assessment requires manual review"
            plan_content = "Treatment plan requires manual review"
        else:
            # Try to use the available text more intelligently
            subjective_content = f"Patient information extracted from clinical text: {text_content[:200]}..."
            objective_content = "Clinical findings and objective data require manual review"
            assessment_content = "Clinical assessment and diagnosis require manual review"
            plan_content = "Treatment plan and recommendations require manual review"
        
        return {
            "subjective": {
                "content": subjective_content,
                "confidence": 0.4,
                "word_count": min(word_count, 50)
            },
            "objective": {
                "content": objective_content,
                "confidence": 0.3,
                "word_count": 10
            },
            "assessment": {
                "content": assessment_content,
                "confidence": 0.3,
                "word_count": 8
            },
            "plan": {
                "content": plan_content,
                "confidence": 0.3,
                "word_count": 10
            }
        }
    
    def _clean_for_json_serialization(self, data: Any) -> Any:
        """
        Clean data to ensure JSON serialization compatibility.
        
        Args:
            data: Data to clean
            
        Returns:
            JSON-serializable data
        """
        if isinstance(data, dict):
            return {key: self._clean_for_json_serialization(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._clean_for_json_serialization(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        elif isinstance(data, (uuid.UUID,)):
            return str(data)
        elif hasattr(data, '__dict__'):
            # Handle objects with __dict__ (like Pydantic models)
            return self._clean_for_json_serialization(data.__dict__)
        else:
            # For primitive types (str, int, float, bool, None)
            return data
    
    async def _apply_pii_masking(self, text: str, preserve_medical_context: bool = True) -> tuple[str, bool, int]:
        """
        Apply PII masking to clinical text while preserving medical context.
        
        Args:
            text: Clinical text to mask
            preserve_medical_context: Whether to preserve medical terminology
            
        Returns:
            tuple: (masked_text, pii_found, entities_count)
        """
        try:
            logger.info("Applying PII masking to clinical text", text_length=len(text))
            
            # Define entities to mask for clinical text
            clinical_entities = [
                "PERSON",           # Patient names
                "PHONE_NUMBER",     # Contact information
                "EMAIL_ADDRESS",    # Contact information
                "US_SSN",          # Social security numbers
                "CREDIT_CARD",     # Financial information
                "US_PASSPORT",     # ID numbers
                "US_DRIVER_LICENSE", # ID numbers
                "US_BANK_NUMBER",  # Financial information
                "IP_ADDRESS",      # Technical information
                "URL"              # Web addresses
            ]
            
            # If preserving medical context, exclude medical license and location
            # which might be important for clinical context
            if not preserve_medical_context:
                clinical_entities.extend([
                    "MEDICAL_LICENSE",
                    "LOCATION"
                ])
            
            # Use the PII service for anonymization
            masked_text, has_pii = await self.pii_service.quick_anonymize(text, clinical_entities)
            
            if has_pii:
                # Count entities for reporting
                _, entities_count = await self.pii_service.analyze_text_for_entities(text, clinical_entities)
                
                logger.info("✅ PII masking applied", 
                           original_length=len(text), 
                           masked_length=len(masked_text),
                           entities_masked=entities_count)
            else:
                entities_count = 0
                logger.info("No PII entities found in clinical text")
            
            return masked_text, has_pii, entities_count
            
        except Exception as e:
            logger.error("❌ PII masking failed", error=str(e))
            # Return original text if masking fails
            return text, False, 0
    
    def _initialize_models(self):
        """Initialize models: OpenAI/Google Gemini for both SOAP generation and Judge."""
        try:
            logger.info("Initializing models for SOAP generation and Judge (OpenAI/Gemini)")

            # SOAP Generation Model: Initialize with automatic OpenAI/Google Gemini fallback
            # Use higher temperature for more creative SOAP note generation
            self.soap_model, soap_provider = get_chat_model(temperature=0.3)
            
            # Judge LLM: Initialize with automatic OpenAI/Google Gemini fallback
            # Use lower temperature for more consistent validation
            self.judge_model, judge_provider = get_chat_model(temperature=0.1)
            
            # Track the provider (both should use the same provider)
            self.provider = soap_provider
            
            logger.info(f"✅ Models initialized: SOAP and Judge via {self.provider.upper()}")
            
        except Exception as e:
            logger.error("❌ Failed to initialize models", error=str(e))
            raise RuntimeError(f"Model initialization failed: {e}")
    
    def _setup_prompts(self):
        """Setup SOAP generation and judge prompts as specified."""
        
        # SOAP Note Generation Prompt for chat completion format
        soap_prompt_template = """Generate a SOAP note from the following clinical information:

Clinical Text: {text}

Extracted Medical Entities: {context_data}

Create a JSON-formatted SOAP note with the following exact structure:
{{
    "subjective": {{
        "content": "Patient's reported symptoms, concerns, and subjective experiences",
        "confidence": 0.95,
        "word_count": 50
    }},
    "objective": {{
        "content": "Clinical findings, test results, and objective observations",
        "confidence": 0.90,
        "word_count": 75
    }},
    "assessment": {{
        "content": "Clinical interpretation, diagnosis, and professional assessment",
        "confidence": 0.85,
        "word_count": 40
    }},
    "plan": {{
        "content": "Treatment recommendations, follow-up plans, and next steps",
        "confidence": 0.88,
        "word_count": 60
    }}
}}

Requirements:
- Use proper audiological and medical terminology
- Include specific measurements and test results where available
- Maintain professional medical language
- Be clinically accurate and specific
- Return ONLY the JSON structure, no additional text"""
        
        self.soap_prompt = PromptTemplate(
            input_variables=["text", "context_data"],
            template=soap_prompt_template
        )
        
    def _setup_prompts(self):
        """Setup SOAP generation and judge prompts for chat models."""
        
        # SOAP Note Generation Prompt - Using ChatPromptTemplate for chat models
        soap_system_prompt = """You are an expert medical professional specializing in audiology and hearing care with extensive medical knowledge and practical experience. Your task is to generate structured SOAP notes from clinical information using proper medical terminology.

You must return ONLY a valid JSON object with the following exact structure (no additional text):
{{
    "subjective": {{
        "content": "Patient's reported symptoms, concerns, and subjective experiences",
        "confidence": 0.95,
        "word_count": 50
    }},
    "objective": {{
        "content": "Clinical findings, test results, and objective observations",
        "confidence": 0.90,
        "word_count": 75
    }},
    "assessment": {{
        "content": "Clinical interpretation, diagnosis, and professional assessment",
        "confidence": 0.85,
        "word_count": 40
    }},
    "plan": {{
        "content": "Treatment recommendations, follow-up plans, and next steps",
        "confidence": 0.88,
        "word_count": 60
    }}
}}

Requirements:
- Use proper audiological and medical terminology
- Include specific measurements and test results where available
- Maintain professional medical language
- Be clinically accurate and specific
- Return ONLY the JSON structure, no additional text or explanations"""
        
        soap_human_prompt = """Generate a SOAP note from the following clinical information:

Clinical Text: {text}

Extracted Medical Entities: {context_data}

Generate the SOAP note in JSON format:"""
        
        self.soap_prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(soap_system_prompt),
            HumanMessagePromptTemplate.from_template(soap_human_prompt)
        ])
        
        # Judge LLM System Prompt with few-shot examples
        judge_system_prompt = """You are a medical compliance judge specializing in hearing care documentation. Review SOAP notes for completeness, accuracy, and compliance with medical documentation standards.

Return your assessment in JSON format:
{{
    "approved": true/false,
    "reason": "Detailed explanation of approval/rejection",
    "confidence": 0.95,
    "suggestions": ["improvement suggestion 1", "suggestion 2"]
}}

APPROVAL CRITERIA:
✅ APPROVE if the SOAP note:
- Contains all four sections (Subjective, Objective, Assessment, Plan)
- Uses appropriate medical terminology
- Shows logical clinical reasoning
- Includes specific, actionable recommendations
- Maintains professional tone and structure

❌ REJECT if the SOAP note:
- Missing critical sections or content
- Contains inaccurate medical information
- Lacks specificity or clinical detail
- Shows poor clinical reasoning
- Contains unprofessional language

FEW-SHOT EXAMPLES:

Example 1 - APPROVED:
SOAP Note: {{"subjective": {{"content": "Patient reports bilateral hearing loss progressively worsening over 6 months, difficulty understanding speech in noisy environments, occasional tinnitus in left ear"}}, "objective": {{"content": "Audiometry shows moderate sensorineural hearing loss 40-60 dB HL bilaterally, speech discrimination 85% right ear, 80% left ear, tympanometry normal"}}, "assessment": {{"content": "Bilateral moderate sensorineural hearing loss, likely age-related presbycusis, candidate for hearing aid amplification"}}, "plan": {{"content": "Recommend bilateral hearing aids, hearing aid evaluation appointment, follow-up in 3 months, counseling on communication strategies"}}}}
Response: {{"approved": true, "reason": "Complete SOAP note with specific audiological details, clear clinical reasoning, and appropriate treatment recommendations", "confidence": 0.95, "suggestions": []}}

Example 2 - REJECTED:
SOAP Note: {{"subjective": {{"content": "Patient has hearing problems"}}, "objective": {{"content": "Some hearing loss noted"}}, "assessment": {{"content": "Hearing loss"}}, "plan": {{"content": "Will treat"}}}}
Response: {{"approved": false, "reason": "SOAP note lacks clinical detail, specific measurements, and actionable treatment plans. Too vague for medical documentation standards", "confidence": 0.90, "suggestions": ["Add specific audiometric results", "Include detailed symptom description", "Provide specific treatment recommendations"]}}"""
        
        judge_human_prompt = """Review the following SOAP note for medical compliance and completeness:

SOAP Note:
{soap_note}

Provide your assessment:"""
        
        self.judge_prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(judge_system_prompt),
            HumanMessagePromptTemplate.from_template(judge_human_prompt)
        ])
        
        # Setup output parsers
        self.judge_parser = JsonOutputParser(pydantic_object=JudgeLLMResponse)
        
        # Create custom SOAP parser using RunnableLambda
        self.soap_parser = RunnableLambda(lambda x: self._extract_json_from_text(x.content if hasattr(x, 'content') else str(x)))
        
        # Create chains
        if self.soap_model and self.judge_model:
            self.soap_chain = self.soap_prompt | self.soap_model | self.soap_parser
            self.judge_chain = self.judge_prompt | self.judge_model | self.judge_parser
            logger.info(f"✅ SOAP and Judge chains constructed successfully using {self.provider.upper()}")
        else:
            logger.error("❌ Cannot create chains - missing models", soap_model=bool(self.soap_model), judge_model=bool(self.judge_model))
    
    async def _validate_with_judge(self, soap_note: Dict[str, Any]) -> JudgeLLMResponse:
        """
        Validate SOAP note using Judge LLM.
        
        Args:
            soap_note: Generated SOAP note dictionary
            
        Returns:
            JudgeLLMResponse: Validation result
        """
        try:
            soap_note_str = json.dumps(soap_note, indent=2)
            judge_result = self.judge_chain.invoke({"soap_note": soap_note_str})
            
            return JudgeLLMResponse(
                approved=judge_result.get("approved", False),
                reason=judge_result.get("reason", "Unknown validation result"),
                confidence=judge_result.get("confidence", 0.5),
                suggestions=judge_result.get("suggestions", [])
            )
            
        except Exception as e:
            logger.error("❌ Judge LLM validation failed", error=str(e))
            return JudgeLLMResponse(
                approved=False,
                reason=f"Validation failed: {str(e)}",
                confidence=0.0,
                suggestions=["Manual review required"]
            )
    
    async def generate_soap_note(self, request: SOAPGenerationRequest) -> SOAPGenerationResponse:
        """
        Generate SOAP note from clinical text with NER context and Judge validation.
        
        Args:
            request: SOAP generation request
            
        Returns:
            SOAPGenerationResponse: Generated and validated SOAP note
        """
        start_time = time.time()
        regeneration_count = 0
        max_regenerations = 3
        
        try:
            logger.info(
                "Starting SOAP note generation",
                session_id=str(request.session_id),
                document_id=str(request.document_id),
                text_length=len(request.text),
                pii_masking_enabled=request.enable_pii_masking
            )
            
            # Step 0: Apply PII masking if enabled
            processed_text = request.text
            pii_masked = False
            pii_entities_found = 0
            
            if request.enable_pii_masking:
                logger.info("🔒 Applying PII masking before SOAP generation")
                processed_text, pii_masked, pii_entities_found = await self._apply_pii_masking(
                    request.text, 
                    request.preserve_medical_context
                )
                
                if pii_masked:
                    logger.info("✅ PII masking completed", 
                               entities_masked=pii_entities_found,
                               text_length_change=len(processed_text) - len(request.text))
                else:
                    logger.info("No PII detected in text")
            else:
                logger.info("PII masking disabled - processing original text")
            
            print("jaidev","SOAP step 1")
            # Step 1: Extract NER context data if requested
            context_data = {}
            if request.include_context:
                # Use processed text (potentially masked) for NER extraction
                context_data = await self.ner_service.extract_context_data(processed_text)
                logger.info("✅ NER context extracted", entity_count=context_data.get("total_entities", 0))
            
            # Step 2: Generate SOAP note with retry logic
            soap_note = None
            validation_feedback = ""
            ai_approved = False
            print("jaidev",f"context_data: {context_data}")
            while regeneration_count <= max_regenerations:
                try:
                    logger.info(f"🔄 SOAP generation attempt {regeneration_count + 1}/{max_regenerations + 1}")
                    
                    # Prepare chain input
                    chain_input = {
                        "text": processed_text,  # Use processed text (potentially PII-masked)
                        "context_data": json.dumps(context_data, indent=2) if context_data else "{}"
                    }
                    
                    logger.info("🔍 Executing SOAP chain")
                    
                    # Execute the SOAP generation chain
                    soap_result = self.soap_chain.invoke(chain_input)
                    
                    logger.info("✅ SOAP chain executed successfully", result_type=type(soap_result).__name__)
                    
                    # Validate with Judge LLM
                    judge_result = await self._validate_with_judge(soap_result)
                    validation_feedback = judge_result.reason
                    
                    if judge_result.approved:
                        # SOAP note approved
                        soap_note = SOAPNote(**soap_result)
                        ai_approved = True
                        logger.info("✅ SOAP note approved by Judge LLM", attempts=regeneration_count + 1)
                        break
                    else:
                        # SOAP note rejected
                        regeneration_count += 1
                        logger.warning(
                            "❌ SOAP note rejected by Judge LLM",
                            attempt=regeneration_count,
                            reason=judge_result.reason,
                            suggestions=judge_result.suggestions
                        )
                        
                        if regeneration_count <= max_regenerations:
                            # Add feedback to context for regeneration
                            context_data["validation_feedback"] = judge_result.reason
                            context_data["suggestions"] = judge_result.suggestions
                
                except Exception as e:
                    regeneration_count += 1
                    error_msg = str(e)
                    logger.error(
                        f"❌ SOAP generation attempt {regeneration_count} failed", 
                        error=error_msg,
                        error_type=type(e).__name__,
                        traceback=str(e.__traceback__) if hasattr(e, '__traceback__') else None
                    )
                    
                    # Log more details for debugging
                    if "JSON" in error_msg or "parse" in error_msg.lower():
                        logger.error("JSON parsing issue detected - check HuggingFace model output format")
                    
                    if regeneration_count > max_regenerations:
                        break
            
            # Step 4: Save to database if approved
            note_id = None
            if soap_note and ai_approved:
                note_id = await self._save_soap_note(
                    soap_note=soap_note,
                    context_data=context_data,
                    session_id=request.session_id,
                    document_id=request.document_id,
                    professional_id=request.professional_id,
                    ai_approved=ai_approved
                )
                logger.info("✅ SOAP note saved to database", note_id=str(note_id))
            
            processing_time = time.time() - start_time
            
            return SOAPGenerationResponse(
                success=ai_approved,
                soap_note=soap_note,
                context_data=NEROutput(**context_data) if context_data else None,
                ai_approved=ai_approved,
                note_id=note_id,
                processing_time=processing_time,
                regeneration_count=regeneration_count,
                validation_feedback=validation_feedback,
                message="SOAP note generated and approved" if ai_approved else "SOAP note generation failed validation",
                pii_masked=pii_masked,
                pii_entities_found=pii_entities_found,
                original_text_preserved=True  # Original text is always preserved in database
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ SOAP note generation failed", error=str(e), processing_time=processing_time)
            
            # Try to access local variables if they exist
            try:
                error_pii_masked = pii_masked
                error_pii_entities_found = pii_entities_found
            except NameError:
                error_pii_masked = False
                error_pii_entities_found = 0
            
            return SOAPGenerationResponse(
                success=False,
                soap_note=None,
                context_data=None,
                ai_approved=False,
                note_id=None,
                processing_time=processing_time,
                regeneration_count=regeneration_count,
                validation_feedback=f"Generation failed: {str(e)}",
                message=f"SOAP generation error: {str(e)}",
                pii_masked=error_pii_masked,
                pii_entities_found=error_pii_entities_found,
                original_text_preserved=True
            )
    
    async def _create_document_record(
        self,
        session_id: uuid.UUID,
        professional_id: Optional[uuid.UUID],
        text_content: str
    ) -> uuid.UUID:
        """
        Create a document record for SOAP generation from text input.
        
        Args:
            session_id: Patient visit session ID
            professional_id: Healthcare professional ID
            text_content: The clinical text content
            
        Returns:
            UUID: Created document ID
        """
        async with async_session_maker() as session:
            try:
                # Generate a unique document ID
                document_id = uuid.uuid4()
                
                # Create document record
                document_record = UploadedDocuments(
                    document_id=document_id,
                    session_id=session_id,
                    document_name=f"SOAP_Input_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt",
                    s3_upload_link=f"soap_inputs/{session_id}/{document_id}.txt",  # Virtual S3 key for text input
                    text_extracted=True,
                    extracted_text=text_content,
                    processing_status="completed",
                    processed_at=datetime.utcnow()
                )
                
                session.add(document_record)
                await session.commit()
                await session.refresh(document_record)
                
                logger.info("✅ Created document record for SOAP generation", 
                           document_id=str(document_id), 
                           session_id=str(session_id))
                
                return document_id
                
            except Exception as e:
                logger.error("❌ Failed to create document record", error=str(e))
                raise

    async def _save_soap_note(
        self,
        soap_note: SOAPNote,
        context_data: Dict[str, Any],
        session_id: uuid.UUID,
        document_id: Optional[uuid.UUID],
        professional_id: Optional[uuid.UUID],
        ai_approved: bool
    ) -> uuid.UUID:
        """
        Save SOAP note to database with proper referential integrity.
        
        Args:
            soap_note: Generated SOAP note
            context_data: NER context data
            session_id: Patient visit session ID
            document_id: Source document ID
            professional_id: Healthcare professional ID
            ai_approved: Whether AI judge approved the note
            
        Returns:
            UUID: Database ID of saved SOAP note
        """
        async with async_session_maker() as session:
            try:
                # Clean data for JSON serialization
                cleaned_content = self._clean_for_json_serialization(soap_note.dict())
                cleaned_context_data = self._clean_for_json_serialization(context_data)
                
                logger.info("💾 Saving SOAP note to database", 
                           content_keys=list(cleaned_content.keys()) if isinstance(cleaned_content, dict) else "not_dict",
                           context_data_keys=list(cleaned_context_data.keys()) if isinstance(cleaned_context_data, dict) else "not_dict")
                
                # If document_id is None, create a document record for the text input
                if document_id is None:
                    logger.info("📝 Creating document record for text input")
                    document_id = await self._create_document_record(
                        session_id=session_id,
                        professional_id=professional_id,
                        text_content=soap_note.subjective.content + " " + soap_note.objective.content
                    )
                
                # Create database record
                db_soap_note = SessionSoapNotes(
                    session_id=session_id,
                    document_id=document_id,
                    professional_id=professional_id,
                    ai_approved=ai_approved,
                    user_approved=False,  # Requires manual approval
                    content=cleaned_content,  # Save cleaned content
                    context_data=cleaned_context_data,  # Save cleaned context data
                )
                
                session.add(db_soap_note)
                await session.commit()
                await session.refresh(db_soap_note)
                
                note_id = db_soap_note.note_id
                
                # If AI approved, trigger RAG embedding pipeline
                if ai_approved:
                    try:
                        logger.info("🤖 AI approved SOAP note, triggering RAG embedding pipeline", note_id=str(note_id))
                        
                        # Trigger embedding for the AI-approved note
                        embedding_success = await self.rag_service.embed_soap_note(note_id, force_reembed=False)
                        
                        if embedding_success:
                            logger.info("✅ RAG embedding completed successfully for AI-approved note", note_id=str(note_id))
                        else:
                            logger.warning("⚠️ RAG embedding failed for AI-approved note", note_id=str(note_id))
                            
                    except Exception as e:
                        # Log error but don't fail the save process
                        logger.error("❌ RAG embedding failed for AI-approved note", note_id=str(note_id), error=str(e))
                
                return note_id
                
            except Exception as e:
                await session.rollback()
                logger.error("❌ Failed to save SOAP note to database", error=str(e))
                raise
