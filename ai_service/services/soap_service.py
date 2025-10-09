"""
SOAP Note Generation Service for AI Microservice
Implements AI-powered SOAP note generation with Judge LLM validation using Google Gemini
"""
import os
import time
import uuid
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime
import structlog
import google.generativeai as genai

from ai_service.app.schemas.soap_schemas import (
    SOAPNote, SOAPSection, SOAPGenerationRequest, 
    SOAPGenerationResponse, JudgeLLMResponse
)
from ai_service.app.schemas.ner_schemas import NEROutput
from ai_service.app.config.settings import settings

logger = structlog.get_logger(__name__)


class SOAPGenerationService:
    """Service for AI-powered SOAP note generation with validation using Gemini."""
    
    def __init__(self):
        """Initialize SOAP generation service."""
        self.soap_model = None
        self.judge_model = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize Gemini models for SOAP generation and validation."""
        try:
            logger.info("Initializing Gemini models for SOAP generation and Judge validation")
            
            # Configure Gemini API
            genai.configure(api_key=settings.google_api_key)
            
            # Initialize Gemini model for SOAP generation
            self.soap_model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                generation_config={
                    "temperature": settings.temperature,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
            
            # Initialize Gemini model for Judge validation
            self.judge_model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                generation_config={
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                }
            )

            logger.info("✅ Gemini models initialized for SOAP and Judge")
            
        except Exception as e:
            logger.error("❌ Failed to initialize Gemini models", error=str(e))
            raise RuntimeError(f"Model initialization failed: {e}")
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON from Gemini model output that may contain extra text.
        
        Args:
            text: Raw model output text
            
        Returns:
            Dict: Parsed JSON object
        """
        if not text or not text.strip():
            logger.warning("Empty text received from model")
            return self._fallback_text_parsing("")
            
        try:
            # Remove markdown code blocks if present
            cleaned_text = text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text.replace("```json", "").replace("```", "").strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.replace("```", "").strip()
            
            # First try to parse the entire text as JSON
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            logger.info("Direct JSON parsing failed, attempting extraction from text")
            
            # Try to extract JSON from text using regex
            json_pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'
            matches = re.findall(json_pattern, text, re.DOTALL)
            
            for match in matches:
                try:
                    parsed = json.loads(match)
                    if isinstance(parsed, dict) and all(key in parsed for key in ['subjective', 'objective', 'assessment', 'plan']):
                        logger.info("✅ Successfully extracted valid SOAP JSON from text")
                        return parsed
                except json.JSONDecodeError:
                    continue
            
            # Last resort: create a minimal structure from the text
            logger.warning("Failed to extract valid JSON, using fallback text parsing")
            return self._fallback_text_parsing(text)
            
        except Exception as e:
            logger.error("JSON extraction failed with exception", error=str(e))
            return self._fallback_text_parsing(text)
    
    def _fallback_text_parsing(self, text: str) -> Dict[str, Any]:
        """
        Fallback method to create SOAP structure from unstructured text.
        
        Args:
            text: Raw text to parse
            
        Returns:
            Dict: Basic SOAP structure
        """
        text_content = text.strip() if text else "No content available"
        word_count = len(text_content.split()) if text_content else 0
        
        if word_count < 10:
            subjective_content = "Patient information requires manual review"
            objective_content = "Clinical findings require manual review"
            assessment_content = "Assessment requires manual review"
            plan_content = "Treatment plan requires manual review"
        else:
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
    
    def _create_soap_prompt(self, text: str, context_data: Dict[str, Any]) -> str:
        """Create prompt for Gemini to generate SOAP note."""
        return f"""Generate a SOAP note from the following clinical information:

Clinical Text: {text}

Extracted Medical Entities: {json.dumps(context_data, indent=2)}

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
    
    def _create_judge_prompt(self, soap_note: Dict[str, Any]) -> str:
        """Create prompt for Gemini Judge to validate SOAP note."""
        return f"""You are a medical compliance judge specializing in hearing care documentation. Review SOAP notes for completeness, accuracy, and compliance with medical documentation standards.

SOAP Note to Review:
{json.dumps(soap_note, indent=2)}

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

Return ONLY the JSON assessment, no additional text."""
    
    async def _validate_with_judge(self, soap_note: Dict[str, Any]) -> JudgeLLMResponse:
        """
        Validate SOAP note using Gemini Judge.
        
        Args:
            soap_note: Generated SOAP note dictionary
            
        Returns:
            JudgeLLMResponse: Validation result
        """
        try:
            prompt = self._create_judge_prompt(soap_note)
            response = self.judge_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()
                
                judge_result = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON object
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    judge_result = json.loads(json_match.group(0))
                else:
                    raise ValueError("Failed to parse judge response")
            
            return JudgeLLMResponse(
                approved=judge_result.get("approved", False),
                reason=judge_result.get("reason", "Unknown validation result"),
                confidence=judge_result.get("confidence", 0.5),
                suggestions=judge_result.get("suggestions", [])
            )
            
        except Exception as e:
            logger.error("❌ Gemini Judge validation failed", error=str(e))
            return JudgeLLMResponse(
                approved=False,
                reason=f"Validation failed: {str(e)}",
                confidence=0.0,
                suggestions=["Manual review required"]
            )
    
    async def generate_soap_note(self, request: SOAPGenerationRequest, context_data: Optional[Dict[str, Any]] = None, pii_masked_text: Optional[str] = None) -> SOAPGenerationResponse:
        """
        Generate SOAP note from clinical text with optional NER context and Judge validation using Gemini.
        
        Args:
            request: SOAP generation request
            context_data: Optional NER context data from external call
            pii_masked_text: Optional PII-masked text from external call
            
        Returns:
            SOAPGenerationResponse: Generated and validated SOAP note
        """
        start_time = time.time()
        regeneration_count = 0
        max_regenerations = 3
        
        try:
            logger.info(
                "Starting SOAP note generation with Gemini",
                session_id=str(request.session_id),
                document_id=str(request.document_id) if request.document_id else None,
                text_length=len(request.text)
            )
            
            # Use provided text (could be PII-masked or original)
            processed_text = pii_masked_text if pii_masked_text else request.text
            
            # Use provided context data or empty dict
            if context_data is None:
                context_data = {}
            
            # Generate SOAP note with retry logic
            soap_note = None
            validation_feedback = ""
            ai_approved = False
            
            while regeneration_count <= max_regenerations:
                try:
                    logger.info(f"🔄 SOAP generation attempt {regeneration_count + 1}/{max_regenerations + 1}")
                    
                    # Create prompt
                    prompt = self._create_soap_prompt(processed_text, context_data)
                    
                    # Call Gemini model
                    response = self.soap_model.generate_content(prompt)
                    response_text = response.text.strip()
                    
                    logger.info("✅ Gemini SOAP model responded", response_length=len(response_text))
                    
                    # Parse JSON response
                    soap_result = self._extract_json_from_text(response_text)
                    
                    logger.info("✅ SOAP JSON parsed successfully", result_keys=list(soap_result.keys()))
                    
                    # Validate with Judge
                    judge_result = await self._validate_with_judge(soap_result)
                    validation_feedback = judge_result.reason
                    
                    if judge_result.approved:
                        # SOAP note approved
                        soap_note = SOAPNote(**soap_result)
                        ai_approved = True
                        logger.info("✅ SOAP note approved by Gemini Judge", attempts=regeneration_count + 1)
                        break
                    else:
                        # SOAP note rejected
                        regeneration_count += 1
                        logger.warning(
                            "❌ SOAP note rejected by Gemini Judge",
                            attempt=regeneration_count,
                            reason=judge_result.reason
                        )
                        
                        if regeneration_count <= max_regenerations:
                            # Add feedback to context for regeneration
                            context_data["validation_feedback"] = judge_result.reason
                            context_data["suggestions"] = judge_result.suggestions
                
                except Exception as e:
                    regeneration_count += 1
                    logger.error(
                        f"❌ SOAP generation attempt {regeneration_count} failed", 
                        error=str(e)
                    )
                    
                    if regeneration_count > max_regenerations:
                        break
            
            processing_time = time.time() - start_time
            
            return SOAPGenerationResponse(
                success=ai_approved,
                soap_note=soap_note,
                context_data=NEROutput(**context_data) if context_data else None,
                ai_approved=ai_approved,
                note_id=None,
                processing_time=processing_time,
                regeneration_count=regeneration_count,
                validation_feedback=validation_feedback,
                message="SOAP note generated and approved by Gemini" if ai_approved else "SOAP note generation failed validation",
                pii_masked=bool(pii_masked_text),
                pii_entities_found=0,
                original_text_preserved=True
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("❌ SOAP note generation failed", error=str(e), processing_time=processing_time)
            
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
                pii_masked=bool(pii_masked_text),
                pii_entities_found=0,
                original_text_preserved=True
            )
