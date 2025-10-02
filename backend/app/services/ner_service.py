"""
NER (Named Entity Recognition) Service
Implements biomedical entity extraction using transformers pipeline
"""
import os
import time
from typing import Dict, Any, List
import structlog
from transformers import pipeline
from langchain_core.runnables import RunnableLambda

from app.schemas.ner_schemas import NEROutput, Entity, NERRequest

logger = structlog.get_logger(__name__)


class NERService:
    """Service for biomedical Named Entity Recognition."""
    
    def __init__(self):
        """Initialize NER service with model and pipeline."""
        self.ner_pipe = None
        self.ner_chain = None
        self._initialize_model()
        self._setup_chain()
    
    def _initialize_model(self):
        """Initialize the biomedical NER model."""
        try:
            ner_model_name = os.getenv("NER_MODEL_NAME", "d4data/biomedical-ner-all")
            logger.info("Initializing biomedical NER model", model=ner_model_name)
            
            # Correct task for this model ✅
            self.ner_pipe = pipeline(
                task="token-classification",
                model=ner_model_name,
                aggregation_strategy="simple"  # groups wordpieces into entities
            )
            logger.info("✅ NER model initialized successfully")
            
        except Exception as e:
            logger.error("❌ Failed to initialize NER model", error=str(e))
            raise RuntimeError(f"NER model initialization failed: {e}")
    
    def _setup_chain(self):
        """Setup LCEL chain with RunnableLambda around the HF pipeline."""
        try:
            if self.ner_pipe:
                # Use RunnableLambda to wrap the HuggingFace pipeline for LCEL compatibility
                self.ner_chain = RunnableLambda(lambda x: self.ner_pipe(x["text"]))
                logger.info("✅ NER chain constructed successfully")
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
            logger.info("Starting NER entity extraction", text_length=len(request.text))
            print("jaidev","NER step 3")
            if not self.ner_pipe:
                raise RuntimeError("NER pipeline not initialized")
            
            # Use the HuggingFace pipeline directly for token classification
            raw_entities = self.ner_pipe(request.text)  # list[dict]: {entity_group, word, score, start, end}
            
            # Process and validate entities
            entities = []
            for raw_entity in raw_entities:
                try:
                    # Extract entity information from the pipeline output
                    ent_type = (raw_entity.get("entity_group") or raw_entity.get("entity") or "unknown").lower()
                    ent_value = raw_entity.get("word") or raw_entity.get("entity") or ""
                    ent_confidence = float(raw_entity.get("score", 1.0))
                    
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
