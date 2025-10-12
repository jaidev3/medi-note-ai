# AI Service Consolidation - Migration Guide

## Overview

The AI service has been successfully consolidated into the backend. All AI functionality (SOAP generation, NER, PII detection, and embeddings) now runs directly within the backend application.

## Changes Made

### 1. Service Integration

- **Location**: `backend/app/services/ai/`
- **Files Added**:
  - `soap_service.py` - SOAP note generation using Google Gemini
  - `ner_service.py` - Named Entity Recognition using Google Gemini
  - `pii_service.py` - PII detection and anonymization using Google Gemini
  - `rag_service.py` - Embedding generation using Google Gemini
  - `__init__.py` - Service package initialization

### 2. API Routes

- **Location**: `backend/app/routes/`
- **Files Added**:
  - `ai_soap_routes.py` - Direct SOAP generation endpoints
  - `ai_ner_routes.py` - Direct NER extraction endpoints
  - `ai_pii_routes.py` - Direct PII detection endpoints
  - `ai_embeddings_routes.py` - Direct embedding generation endpoints

### 3. Updated Files

#### `backend/requirements.txt`

Added AI dependencies:

```
langchain-core>=0.1.0
langchain-google-genai>=0.0.5
google-generativeai>=0.3.0
structlog>=23.2.0,<24.0.0
numpy>=1.24.0,<2.0.0
```

#### `backend/app/main.py`

Registered new AI routes:

```python
app.include_router(ai_soap_routes.router, prefix="/ai/soap", tags=["AI SOAP Generation"])
app.include_router(ai_ner_routes.router, prefix="/ai/ner", tags=["AI NER Extraction"])
app.include_router(ai_pii_routes.router, prefix="/ai/pii", tags=["AI PII Detection"])
app.include_router(ai_embeddings_routes.router, prefix="/ai/embeddings", tags=["AI Embeddings"])
```

#### `backend/app/services/ai_soap_service.py`

Updated to use direct AI services instead of HTTP client:

- Removed dependency on `ai_service_client`
- Added direct integration with `SOAPGenerationService`, `NERService`, `PIIService`, and `RAGService`
- All AI operations now run in-process

#### `backend/env.sample`

Updated environment variables:

```
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=models/embedding-001
GEMINI_TEMPERATURE=0.1
SOAP_MAX_RETRIES=3
PII_CONFIDENCE_THRESHOLD=0.5
```

### 4. Removed Files

- `backend/app/clients/ai_service_client.py` - No longer needed

## API Endpoints

### Original Endpoints (Still Available)

- `POST /soap/generate` - Main SOAP generation endpoint (uses integrated services)
- `POST /rag/query` - RAG queries
- `POST /documents/upload` - Document upload

### New Direct AI Endpoints

- `POST /ai/soap/generate` - Direct SOAP generation
- `GET /ai/soap/health` - SOAP service health check
- `POST /ai/ner/extract` - Direct NER extraction
- `POST /ai/ner/context` - NER context for SOAP
- `GET /ai/ner/health` - NER service health check
- `POST /ai/pii/analyze` - PII analysis
- `POST /ai/pii/anonymize` - PII anonymization
- `POST /ai/pii/quick-anonymize` - Quick PII anonymization
- `GET /ai/pii/health` - PII service health check
- `POST /ai/embeddings/generate` - Generate single embedding
- `POST /ai/embeddings/batch` - Generate batch embeddings
- `POST /ai/embeddings/soap-content` - Generate SOAP content embedding
- `GET /ai/embeddings/health` - Embeddings service health check

## Environment Setup

### Required Environment Variables

1. **Google Gemini API Key** (Required)

   ```
   GOOGLE_API_KEY=your-api-key
   ```

2. **Model Configuration** (Optional - defaults provided)

   ```
   GEMINI_MODEL=gemini-1.5-flash
   GEMINI_EMBEDDING_MODEL=models/embedding-001
   GEMINI_TEMPERATURE=0.1
   ```

3. **SOAP Configuration** (Optional - defaults provided)
   ```
   SOAP_MAX_RETRIES=3
   PII_CONFIDENCE_THRESHOLD=0.5
   ```

## Installation Instructions

1. **Install Dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Update Environment Variables**

   ```bash
   cp env.sample .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

3. **Run the Backend**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

## Benefits of Consolidation

1. **Simplified Architecture**

   - Single service to deploy and maintain
   - No inter-service communication overhead
   - Easier debugging and monitoring

2. **Performance**

   - Eliminated HTTP client overhead
   - Direct function calls instead of network requests
   - Faster response times

3. **Development**

   - Single codebase for AI features
   - Easier testing and debugging
   - Simplified deployment

4. **Cost Reduction**
   - One less service to host
   - Reduced infrastructure complexity
   - Lower operational overhead

## Migration Checklist

- [x] Copy AI service schemas to backend
- [x] Copy AI service services to backend
- [x] Create AI API routes in backend
- [x] Update backend requirements.txt
- [x] Update backend services to use direct AI services
- [x] Register AI routes in backend main.py
- [x] Remove AI service client dependency
- [x] Update environment variables
- [ ] Test AI functionality
- [ ] Remove ai_service directory

## Testing

Before removing the ai_service directory, test the following:

1. **SOAP Generation**

   ```bash
   curl -X POST http://localhost:8000/ai/soap/generate \
     -H "Content-Type: application/json" \
     -d '{"text": "Patient presents with hearing loss...", "session_id": "uuid-here"}'
   ```

2. **NER Extraction**

   ```bash
   curl -X POST http://localhost:8000/ai/ner/extract \
     -H "Content-Type: application/json" \
     -d '{"text": "Patient has diabetes and hypertension"}'
   ```

3. **PII Detection**

   ```bash
   curl -X POST http://localhost:8000/ai/pii/analyze \
     -H "Content-Type: application/json" \
     -d '{"text": "Patient John Doe, phone 555-1234"}'
   ```

4. **Embeddings**

   ```bash
   curl -X POST http://localhost:8000/ai/embeddings/generate \
     -H "Content-Type: application/json" \
     -d '{"text": "Clinical text to embed"}'
   ```

5. **Health Checks**
   ```bash
   curl http://localhost:8000/ai/soap/health
   curl http://localhost:8000/ai/ner/health
   curl http://localhost:8000/ai/pii/health
   curl http://localhost:8000/ai/embeddings/health
   ```

## Next Steps

1. **Install Dependencies**

   ```bash
   cd /Users/apple/Documents/GitHub/Echo-Notes/backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**

   - Copy `env.sample` to `.env`
   - Add your `GOOGLE_API_KEY`

3. **Test the Backend**

   - Start the backend server
   - Test all AI endpoints
   - Verify health checks

4. **Remove AI Service** (After successful testing)
   ```bash
   rm -rf /Users/apple/Documents/GitHub/Echo-Notes/ai_service
   ```

## Rollback Plan

If issues arise, you can restore the original architecture by:

1. Keep the `ai_service` directory (don't delete it yet)
2. Restore `backend/app/clients/ai_service_client.py` from git history
3. Revert changes to `backend/app/services/ai_soap_service.py`
4. Remove AI route registrations from `backend/app/main.py`
5. Start both services separately

## Support

For issues or questions:

1. Check the logs in `backend/app/main.py`
2. Verify environment variables are set correctly
3. Ensure Google Gemini API key is valid
4. Check service health endpoints
