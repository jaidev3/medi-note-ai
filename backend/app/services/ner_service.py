"""
NER (Named Entity Recognition) Service
Implements biomedical entity extraction using transformers pipeline
"""
import os
import time
from typing import Dict, Any, List
import structlog
import json
import re
from typing import Optional

from langchain_core.runnables import RunnableLambda

from app.schemas.ner_schemas import NEROutput, Entity, NERRequest

logger = structlog.get_logger(__name__)


class NERService:
    """Service for biomedical Named Entity Recognition."""
    
    def __init__(self):
        """Initialize NER service with model and pipeline."""
        self.ner_pipe = None
        self.ner_chain = None
        # backend: 'openai' or 'gemini'
        self.backend = os.getenv("NER_BACKEND", "openai").lower()
        self._initialize_model()
        self._setup_chain()
    
    def _initialize_model(self):
        """Initialize the biomedical NER model."""
        try:
            # No local model initialization required for LLM backends.
            logger.info("NER service using LLM backend", backend=self.backend)
            
        except Exception as e:
            logger.error("❌ Failed to initialize NER model", error=str(e))
            raise RuntimeError(f"NER model initialization failed: {e}")
    
    def _setup_chain(self):
        """Setup LCEL chain with RunnableLambda around the HF pipeline."""
        try:
            # Create a RunnableLambda wrapper depending on backend (LLM only)
            if self.backend == "openai":
                self.ner_chain = RunnableLambda(lambda x: self._extract_entities_via_openai(x["text"]))
            elif self.backend == "gemini":
                self.ner_chain = RunnableLambda(lambda x: self._extract_entities_via_gemini(x["text"]))
            else:
                raise RuntimeError(f"Unsupported NER backend: {self.backend}")
            logger.info("✅ NER chain constructed successfully", backend=self.backend)
        except Exception as e:
            logger.error("❌ Failed to setup NER chain", error=str(e))
    
    async def extract_entities(self, request: NERRequest) -> NEROutput:
        """
        Extract biomedical entities from clinical text.
        
        Args:
            request: NER request containing text and parameters
            
        Returns:
            NEROutput: Extracted entities with metadata
        """
        start_time = time.time()
        
        try:
            logger.info("Starting NER entity extraction", text_length=len(request.text), backend=self.backend)
            print("jaidev","NER step 3")

            # Dispatch to LLM backend
            if self.backend == "openai":
                raw_entities = self._extract_entities_via_openai(request.text)
            elif self.backend == "gemini":
                raw_entities = self._extract_entities_via_gemini(request.text)
            else:
                raise RuntimeError(f"Unsupported NER backend: {self.backend}")
            
            # Process and validate entities
            entities = []
            for raw_entity in raw_entities:
                try:
                    # Extract entity information from the pipeline output
                    # LLM backends are expected to return dicts with keys: type, value, start, end, confidence
                    ent_type = (raw_entity.get("entity_group") or raw_entity.get("entity") or raw_entity.get("type") or "unknown").lower()
                    ent_value = raw_entity.get("word") or raw_entity.get("entity") or raw_entity.get("value") or ""
                    ent_confidence = float(raw_entity.get("score", raw_entity.get("confidence", 1.0)))
                    
                    # Create Entity object
                    entity = Entity(
                        type=ent_type,
                        value=ent_value,
                        confidence=ent_confidence
                    )
                    
                    # Filter by type if specified
                    if not request.filter_types or ent_type in request.filter_types:
                        entities.append(entity)
                        
                except Exception as e:
                    logger.warning("Invalid entity format", entity=raw_entity, error=str(e))
            
            processing_time = time.time() - start_time
            
            result = NEROutput(
                entities=entities,
                total_entities=len(entities),
                processing_time=processing_time
            )
            
            logger.info(
                "✅ NER extraction completed",
                entity_count=len(entities),
                processing_time=processing_time
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                "❌ NER extraction failed",
                error=str(e),
                processing_time=processing_time
            )
            
            # Return empty result on failure
            return NEROutput(
                entities=[],
                total_entities=0,
                processing_time=processing_time
            )
    
    async def extract_context_data(self, text: str) -> Dict[str, Any]:
        """
        Extract context data for SOAP generation (simplified interface).
        
        Args:
            text: Clinical text to process
            
        Returns:
            Dict containing extracted entities and metadata
        """
        request = NERRequest(text=text)
        ner_output = await self.extract_entities(request)
        print("jaidev","NER step 2")
        return {
            "entities": [entity.dict() for entity in ner_output.entities],
            "total_entities": ner_output.total_entities,
            "processing_time": ner_output.processing_time
        }

    # -------------------------------
    # LLM backends (OpenAI / Gemini)
    # -------------------------------
    def _safe_parse_json(self, text: str) -> Optional[dict]:
        """Try to robustly parse JSON from model output."""
        try:
            return json.loads(text)
        except Exception:
            # Try to extract the first {...} block
            m = re.search(r"\{.*\}", text, re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(0))
                except Exception:
                    return None
            return None

    def _normalize_and_validate_entities(self, text: str, entities_raw: list) -> list:
        """Normalize LLM output entities into a uniform dict shape and validate indices.

        Expected final dict keys: type, value, start, end, confidence
        """
        normalized = []
        for ent in entities_raw:
            try:
                etype = ent.get("type") or ent.get("entity") or ent.get("entity_group") or "unknown"
                value = ent.get("value") or ent.get("word") or ent.get("entity") or ""
                start = ent.get("start")
                end = ent.get("end")
                conf = ent.get("confidence") or ent.get("score") or 1.0

                # If model didn't provide start/end, try to find the substring in the text
                if start is None or end is None:
                    idx = text.find(value)
                    if idx >= 0:
                        start = idx
                        end = idx + len(value)
                    else:
                        # skip entities that cannot be located
                        continue

                # validate substring
                if text[start:end] != value:
                    # try to locate value again (maybe whitespace/punctuation differences)
                    idx = text.find(value)
                    if idx >= 0:
                        start = idx
                        end = idx + len(value)
                    else:
                        # fallback: set value from text slice
                        value = text[start:end]

                normalized.append({
                    "type": etype.lower(),
                    "value": value,
                    "start": int(start),
                    "end": int(end),
                    "confidence": float(conf)
                })
            except Exception:
                continue
        return normalized

    def _extract_entities_via_openai(self, text: str) -> list:
        """Call OpenAI-style LLM to extract entities using new openai>=1.0.0 API.

        This function expects OPENAI_API_KEY in env and an installed OpenAI client.
        It returns a list of dicts with keys similar to HF pipeline output.
        """
        # Build prompt with instructions and a minimal example
        system = (
            "You are a biomedical entity extractor. Return JSON only with a top-level `entities` list. "
            "Each entity must contain: type, value, start, end, confidence. "
            "Use exact substring values and 0-based character indices."
        )
        user_prompt = f"Text: '''{text}'''\n\nReturn JSON with field `entities`."

        try:
            # Use the new openai>=1.0.0 API
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Use the correct method: chat.completions.create
            resp = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.0,
            )
            
            # Extract content from the new API response format
            content = resp.choices[0].message.content

        except Exception as e:
            logger.error("OpenAI LLM call failed", error=str(e))
            return []

        parsed = self._safe_parse_json(content)
        if not parsed or "entities" not in parsed:
            return []
        normalized = self._normalize_and_validate_entities(text, parsed["entities"])
        return normalized

    def _extract_entities_via_gemini(self, text: str) -> list:
        """Call Google Gemini to extract entities using google-generativeai library.

        You must configure Google credentials (GOOGLE_API_KEY environment variable).
        """
        try:
            import google.generativeai as genai
            
            # Configure the API key
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            
            # Get the model name from environment or use default
            model_name = os.getenv("GOOGLE_MODEL") or os.getenv("AI_SERVICE_GEMINI_MODEL") or os.getenv("GEMINI_MODEL") or "gemini-1.5-flash-latest"
            
            # Create the model
            model = genai.GenerativeModel(model_name)
            
            # Build the prompt
            system_instruction = (
                "You are a biomedical entity extractor. Return JSON only with a top-level `entities` list. "
                "Each entity must contain: type, value, start, end, confidence. "
                "Use exact substring values and 0-based character indices."
            )
            user_prompt = f"{system_instruction}\n\nText: '''{text}'''\n\nReturn JSON with field `entities`."
            
            # Generate content
            response = model.generate_content(user_prompt)
            
            # Extract the text content
            content = response.text
            
        except Exception as e:
            logger.error("Gemini LLM call failed", error=str(e))
            return []

        parsed = self._safe_parse_json(content)
        if not parsed or "entities" not in parsed:
            return []
        normalized = self._normalize_and_validate_entities(text, parsed["entities"])
        return normalized
