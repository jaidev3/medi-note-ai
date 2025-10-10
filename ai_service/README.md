# Echo Notes AI Service

AI microservice for ML/LLM operations including SOAP generation, RAG, NER, and PII detection.

## Overview

This microservice handles all AI-related operations for the Echo Notes system:

- **SOAP Generation**: AI-powered medical note generation using HuggingFace + OpenAI
- **NER Extraction**: Biomedical named entity recognition
- **PII Detection**: Privacy protection using Microsoft Presidio
- **Embeddings**: Vector generation for RAG operations

## API Endpoints

### SOAP Generation

- `POST /soap/generate` - Generate SOAP notes from clinical text
- `GET /soap/health` - SOAP service health check

### NER (Named Entity Recognition)

- `POST /ner/extract` - Extract biomedical entities
- `POST /ner/context` - Extract context for SOAP generation
- `GET /ner/health` - NER service health check

### PII Detection & Anonymization

- `POST /pii/analyze` - Analyze text for PII
- `POST /pii/anonymize` - Anonymize PII in text
- `POST /pii/quick-anonymize` - Quick anonymization
- `GET /pii/health` - PII service health check

### Embeddings

- `POST /embeddings/generate` - Generate text embeddings
- `POST /embeddings/batch` - Batch embedding generation
- `POST /embeddings/soap-content` - SOAP content embeddings
- `GET /embeddings/health` - Embeddings service health check

### General

- `GET /` - Service information
- `GET /health` - Overall service health
- `GET /models/status` - Model loading status

## Environment Variables

```bash
# AI Service Configuration
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8002
AI_SERVICE_DEBUG=false
AI_SERVICE_BACKEND_SERVICE_URL=http://backend:8000

# Model provider configuration (examples)
# Configure your preferred model provider/API keys and models as needed.
# For example, set the provider-specific environment variables or update
# `ai_service/config/settings.py` to add explicit fields for your chosen
# providers (Gemini, OpenAI, HuggingFace, etc.).

# Performance
AI_SERVICE_MAX_CONCURRENT_REQUESTS=10
AI_SERVICE_REQUEST_TIMEOUT=300
AI_SERVICE_LOG_LEVEL=INFO
```

## Local Development

1. **Install uv (recommended)**:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Setup Dependencies**:

   ```bash
   cd ai_service

   # Using uv (recommended)
   uv sync
   uv run python -m spacy download en_core_web_sm

   # Or using pip (fallback)
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

3. **Set Environment Variables**:

Configure provider-specific variables for your chosen model provider. For
example, export the Gemini API key or other provider credentials required for
your deployment.

4. **Run Service**:

   ```bash
   # Using uv (recommended)
   uv run python -m uvicorn ai_service.main:app --host 0.0.0.0 --port 8002 --reload

   # Or using python directly
   python -m uvicorn ai_service.main:app --host 0.0.0.0 --port 8002 --reload
   ```

## Docker Deployment

1. **Build Image**:

   ```bash
   docker build -f ai_service/Dockerfile -t echo-notes-ai-service .
   ```

2. **Run Container**:
   ```bash
   docker run -p 8002:8002 \
      -e <PROVIDER_API_KEY>=your_key \
      echo-notes-ai-service
   ```

## Docker Compose Deployment

Use the provided `docker-compose.ai.yaml` configuration:

```bash
# Deploy complete system with AI service
docker-compose -f docker-compose.ai.yaml up --build -d

# Check services
docker-compose -f docker-compose.ai.yaml ps

# View logs
docker-compose -f docker-compose.ai.yaml logs ai_service
```

## Health Monitoring

The service provides comprehensive health checks:

- **Service Health**: `GET /health`
- **Individual Component Health**: `GET /{service}/health`
- **Model Status**: `GET /models/status`

## Performance Considerations

- **Model Loading**: Initial startup takes 1-2 minutes for model downloads
- **Caching**: Models are cached in persistent volumes
- **Concurrency**: Configurable max concurrent requests
- **Memory**: Requires ~4GB RAM for all models
- **GPU**: Optional, will use CPU by default

## Troubleshooting

1. **Model Download Issues**: Check HuggingFace token and network connectivity
2. **Memory Issues**: Increase container memory limits
3. **API Timeouts**: Adjust `AI_SERVICE_REQUEST_TIMEOUT`
4. **Health Check Failures**: Verify all required environment variables are set

## Architecture

```
AI Service
├── FastAPI Application (main.py)
├── Configuration (config/settings.py)
├── API Endpoints (api/)
│   ├── soap_api.py
│   ├── ner_api.py
│   ├── pii_api.py
│   └── embeddings_api.py
├── Services (services/)
│   ├── soap_service.py
│   ├── ner_service.py
│   ├── pii_service.py
│   └── rag_service.py
└── Schemas (schemas/)
    ├── soap_schemas.py
    ├── ner_schemas.py
    ├── pii_schemas.py
    └── rag_schemas.py
```
