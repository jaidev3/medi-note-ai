# Docker PII Integration Guide

This guide helps you test the PII (Personally Identifiable Information) integration in your Docker environment.

## Quick Start

### 1. Rebuild with PII Integration

```bash
cd backend
./rebuild_with_pii.sh
```

This script will:
- Stop existing containers
- Rebuild the backend with PII dependencies
- Start the services
- Run health checks
- Verify PII functionality

### 2. Manual Rebuild (if needed)

```bash
# Stop containers
docker-compose down

# Rebuild backend
docker-compose build --no-cache backend

# Start services
docker-compose up -d

# Check logs
docker-compose logs backend
```

## Testing PII Integration

### 1. Health Check Inside Container

```bash
# Run comprehensive PII health check
docker-compose exec backend python health_check_pii.py
```

### 2. Test SOAP Generation with PII

Make a POST request to your SOAP generation endpoint:

```bash
curl -X POST "http://localhost:8001/soap/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Patient John Doe (SSN: 123-45-6789) reported hearing loss. Contact: john.doe@email.com, Phone: (555) 123-4567.",
    "session_id": "your-session-uuid",
    "document_id": "your-document-uuid",
    "enable_pii_masking": true,
    "preserve_medical_context": true,
    "include_context": true
  }'
```

### 3. Check API Documentation

Visit: http://localhost:8001/docs

Look for the `/soap/generate` endpoint documentation which now includes PII masking features.

## Environment Variables

Make sure these are set in your `.env` file:

```bash
# Required for PII service
HUGGINGFACEHUB_API_TOKEN=your_hf_token_here

# Optional: Customize models
HUGGINGFACE_MODEL_ID=aaditya/Llama3-OpenBioLLM-70B
OPENAI_MODEL=gpt-4o-mini
```

## Troubleshooting

### 1. Container Build Issues

If the build fails, check:

```bash
# View build logs
docker-compose build --no-cache backend 2>&1 | tee build.log

# Check if spaCy model downloaded
docker-compose exec backend python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('spaCy model loaded successfully')"
```

### 2. PII Service Not Working

Check the logs:

```bash
# View container logs
docker-compose logs backend

# Run health check manually
docker-compose exec backend python health_check_pii.py
```

### 3. Memory Issues

The PII service requires additional memory. If you encounter issues:

```bash
# Check container memory usage
docker stats echo_note_fastapi

# Increase memory limit in docker-compose.yaml if needed
```

## Expected Behavior

### PII Detection
- Patient names: "John Doe" → "<REDACTED>"
- SSNs: "123-45-6789" → "<REDACTED>"
- Phone numbers: "(555) 123-4567" → "<REDACTED>"
- Email addresses: "john@email.com" → "<REDACTED>"

### Medical Context Preservation
- Medical terms like "hearing loss", "audiometry", "sensorineural" are preserved
- Clinical measurements and test results remain intact

### API Response
The SOAP generation response will include:

```json
{
  "success": true,
  "soap_note": {...},
  "pii_masked": true,
  "pii_entities_found": 3,
  "original_text_preserved": true,
  ...
}
```

## Performance Notes

- PII masking adds ~100-500ms to processing time
- Memory usage increases by ~500MB for Presidio engines
- First request may be slower due to model initialization

## Cleanup

To remove test files:

```bash
# Remove health check script (optional)
rm backend/health_check_pii.py
rm backend/rebuild_with_pii.sh
rm backend/DOCKER_PII_GUIDE.md
```

## Support

If you encounter issues:

1. Check the container logs: `docker-compose logs backend`
2. Run the health check: `docker-compose exec backend python health_check_pii.py`
3. Verify environment variables are set correctly
4. Check if spaCy model is installed: `docker-compose exec backend python -m spacy validate`
