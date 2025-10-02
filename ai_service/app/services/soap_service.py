"""
SOAP Note Generation Service for AI Microservice
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
from langchain_openai import ChatOpenAI

# For HuggingFace Inference API
from huggingface_hub import InferenceClient

from ai_service.app.schemas.soap_schemas import (
    SOAPNote, SOAPSection, SOAPGenerationRequest, 
    SOAPGenerationResponse, JudgeLLMResponse
)
from ai_service.app.schemas.ner_schemas import NEROutput
from ai_service.app.config.settings import settings

logger = structlog.get_logger(__name__)


class SOAPGenerationService:
    """Service for AI-powered SOAP note generation with validation."""
    
    def __init__(self):
        """Initialize SOAP generation service."""
        self.soap_model = None
        self.hf_client = None
        self.soap_chain = None
        self.judge_chain = None
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
    
    def _create_hf_inference_function(self, model_id: str, api_token: str):
        """
        Create HuggingFace Inference API function using InferenceClient.
        
        Args:
            model_id: HuggingFace model ID
            api_token: HuggingFace API token
            
        Returns:
            Function that can be used with RunnableLambda
        """
        client = InferenceClient(model=model_id, token=api_token)
        
        def inference_function(prompt: str) -> str:
            """Call HuggingFace Inference API with proper chat template."""
            try:
                # Create messages in the format expected by the model
                messages = [
                    {
                        "role": "system", 
                        "content": "You are an expert medical professional specializing in audiology and hearing care with extensive medical knowledge and practical experience. Generate structured SOAP notes from clinical information using proper medical terminology."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ]
                
                # Use chat completion with proper parameters
                response = client.chat_completion(
                    messages=messages,
                    max_tokens=1024,
                    temperature=0.2,
                    top_p=0.95,
                    stop=["<|eot_id|>"]
                )
                
                # Extract the generated text
                if response and response.choices and len(response.choices) > 0:
                    generated_text = response.choices[0].message.content
                    logger.info("✅ HuggingFace Inference API successful", response_length=len(generated_text))
                    return generated_text
                else:
                    logger.warning("⚠️ Empty response from HuggingFace Inference API")
                    return ""
                    
            except Exception as e:
                logger.error("❌ HuggingFace Inference API call failed", error=str(e), error_type=type(e).__name__)
                # Return empty string to trigger fallback parsing
                return ""
        
        return inference_function
    
    def _initialize_models(self):
        """Initialize models: HuggingFace for SOAP generation, OpenAI for Judge."""
        try:
            logger.info("Initializing models for SOAP generation (HF) and Judge (OpenAI)")

            # HuggingFace for SOAP generation - using biomedical model via Inference API
            hf_model_id = settings.huggingface_model_id
            hf_api_token = settings.huggingface_api_token
            
            # Ensure we have the API token
            if not hf_api_token:
                logger.error("❌ HUGGINGFACEHUB_API_TOKEN is required for model access")
                raise RuntimeError("HuggingFace API token is required")

            logger.info(f"🔧 Initializing HuggingFace Inference API for model: {hf_model_id}")
            
            # Create the inference function using HuggingFace Inference API
            hf_inference_func = self._create_hf_inference_function(hf_model_id, hf_api_token)
            
            # Wrap the inference function in a RunnableLambda
            self.soap_model = RunnableLambda(hf_inference_func)

            # OpenAI for Judge LLM
            self.judge_model = ChatOpenAI(
                model=settings.openai_model,
                temperature=0.1,
                api_key=settings.openai_api_key,
            )

            logger.info("✅ Models initialized: SOAP via HuggingFace, Judge via OpenAI")
            
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
        self.soap_parser = RunnableLambda(lambda x: self._extract_json_from_text(x))
        
        # Create chains
        if self.soap_model and self.judge_model:
            # Test the HuggingFace model first
            try:
                logger.info("🧪 Testing HuggingFace Inference API connectivity...")
                test_prompt = "Hello, respond with 'Test successful'"
                test_response = self.soap_model.invoke(test_prompt)
                logger.info("✅ HuggingFace Inference API test successful", test_response_type=type(test_response).__name__, response_preview=str(test_response)[:100])
            except Exception as e:
                logger.error("❌ HuggingFace Inference API test failed", error=str(e), error_type=type(e).__name__)
                # Continue anyway, but log the issue
            
            self.soap_chain = self.soap_prompt | self.soap_model | self.soap_parser
            self.judge_chain = self.judge_prompt | self.judge_model | self.judge_parser
            logger.info("✅ SOAP (HF) and Judge (OpenAI) chains constructed successfully")
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
    
    async def generate_soap_note(self, request: SOAPGenerationRequest, context_data: Optional[Dict[str, Any]] = None, pii_masked_text: Optional[str] = None) -> SOAPGenerationResponse:
        """
        Generate SOAP note from clinical text with optional NER context and Judge validation.
        
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
                "Starting SOAP note generation in AI service",
                session_id=str(request.session_id),
                document_id=str(request.document_id) if request.document_id else None,
                text_length=len(request.text),
                pii_masking_enabled=request.enable_pii_masking
            )
            
            # Use provided text (could be PII-masked or original)
            processed_text = pii_masked_text if pii_masked_text else request.text
            
            # Use provided context data or empty dict
            if context_data is None:
                context_data = {}
            
            # Step 2: Generate SOAP note with retry logic
            soap_note = None
            validation_feedback = ""
            ai_approved = False
            
            while regeneration_count <= max_regenerations:
                try:
                    logger.info(f"🔄 SOAP generation attempt {regeneration_count + 1}/{max_regenerations + 1}")
                    
                    # Step-by-step chain execution for debugging
                    chain_input = {
                        "text": processed_text,
                        "context_data": json.dumps(context_data, indent=2) if context_data else "{}"
                    }
                    
                    logger.info("🔍 Executing SOAP chain step by step for debugging")
                    
                    # Step 1: Format prompt
                    try:
                        formatted_prompt = self.soap_prompt.format(**chain_input)
                        logger.info("✅ Prompt formatted successfully", prompt_length=len(formatted_prompt))
                    except Exception as e:
                        logger.error("❌ Prompt formatting failed", error=str(e))
                        raise
                    
                    # Step 2: Call HuggingFace model
                    try:
                        logger.info("🤖 Calling HuggingFace model...")
                        model_response = self.soap_model.invoke(formatted_prompt)
                        logger.info("✅ HuggingFace model responded", response_type=type(model_response).__name__, response_length=len(str(model_response)) if model_response else 0)
                        
                        # Log a preview of the response
                        if model_response:
                            response_preview = str(model_response)[:200]
                            logger.info("📝 Model response preview", preview=response_preview)
                        else:
                            logger.warning("⚠️ Model returned empty response")
                            
                    except StopIteration as e:
                        logger.error("❌ HuggingFace model StopIteration - likely empty response or connection issue", error=str(e))
                        raise
                        
                    except Exception as e:
                        logger.error("❌ HuggingFace model call failed", error=str(e), error_type=type(e).__name__)
                        raise
                    
                    # Step 3: Parse JSON
                    try:
                        logger.info("🔍 Parsing model response as JSON...")
                        soap_result = self._extract_json_from_text(str(model_response))
                        logger.info("✅ JSON parsing successful", result_keys=list(soap_result.keys()) if isinstance(soap_result, dict) else "not_dict")
                    except Exception as e:
                        logger.error("❌ JSON parsing failed", error=str(e), error_type=type(e).__name__)
                        raise
                    
                    logger.info("✅ SOAP chain executed successfully", result_type=type(soap_result).__name__)
                    
                    # Step 3: Validate with Judge LLM
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
                        error_type=type(e).__name__
                    )
                    
                    if regeneration_count > max_regenerations:
                        break
            
            processing_time = time.time() - start_time
            
            return SOAPGenerationResponse(
                success=ai_approved,
                soap_note=soap_note,
                context_data=NEROutput(**context_data) if context_data else None,
                ai_approved=ai_approved,
                note_id=None,  # Will be set by main backend when saving
                processing_time=processing_time,
                regeneration_count=regeneration_count,
                validation_feedback=validation_feedback,
                message="SOAP note generated and approved" if ai_approved else "SOAP note generation failed validation",
                pii_masked=bool(pii_masked_text),
                pii_entities_found=0,  # Will be set by PII service
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
