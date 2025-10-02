# AI Service Dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Install Python dependencies using uv
COPY ai_service/pyproject.toml /app/
COPY ai_service/uv.lock* /app/

# Generate lock file if it doesn't exist, then sync
RUN if [ ! -f "uv.lock" ]; then \
        echo "Generating uv.lock file..." && \
        uv lock; \
    fi && \
    uv sync --frozen --no-cache --no-dev

# Download spaCy model for PII service (within virtual environment)
RUN uv run python -m spacy download en_core_web_sm

# Copy application code
COPY ai_service/ /app/ai_service/

# Create cache directories for models
RUN mkdir -p /app/.cache/huggingface /app/.cache/torch && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Run the application using uv
CMD ["uv", "run", "python", "-m", "uvicorn", "ai_service.app.main:app", "--host", "0.0.0.0", "--port", "8002"]
