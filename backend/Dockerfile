# =============================================================================
# MULTI-STAGE DOCKERFILE FOR ECHO NOTES BACKEND PRODUCTION
# Stage 1: Builder (Heavy build operations, gets discarded)
# Stage 2: Production (Lightweight runtime image)
# Expected size reduction: 12.2GB → ~3.5GB (70% smaller)
# =============================================================================

# =============================================================================
# STAGE 1: BUILDER - Heavy build operations (will be discarded)
# =============================================================================
FROM python:3.11-slim as builder

# Build-time environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies (these will be discarded after build)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN pip install --no-cache-dir uv

# Set working directory for build
WORKDIR /build

# Copy dependency configuration file
COPY pyproject.toml uv.lock* ./

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install compatible NumPy first to avoid conflicts
RUN uv pip install --no-cache "numpy>=1.24.0,<2.0.0"

# Install CPU-only PyTorch with compatible versions
RUN uv pip install --no-cache torch==2.1.0+cpu torchvision==0.16.0+cpu torchaudio==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Install other Python dependencies (NumPy and torch already installed)
RUN uv pip install --no-cache -r pyproject.toml

# Download spaCy model (this happens in builder stage)
RUN python -m spacy download en_core_web_sm && \
    python -m spacy validate

# Aggressive cleanup to reduce size
RUN pip cache purge && \
    find /opt/venv -name "*.pyc" -delete && \
    find /opt/venv -name "__pycache__" -type d -exec rm -rf {} + || true && \
    find /opt/venv -name "*.so" -exec strip {} + || true && \
    find /opt/venv -name "tests" -type d -exec rm -rf {} + || true && \
    find /opt/venv -name "test" -type d -exec rm -rf {} + || true

# =============================================================================
# STAGE 2: PRODUCTION - Lightweight runtime image
# =============================================================================
FROM python:3.11-slim as production

# Production environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Install only RUNTIME dependencies (much lighter than build dependencies)
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy the virtual environment from builder stage (contains all Python packages)
COPY --from=builder /opt/venv /opt/venv

# Create non-root user for security with home directory
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Create cache directories for HuggingFace and set permissions
RUN mkdir -p /home/appuser/.cache/huggingface && \
    mkdir -p /home/appuser/.cache/torch && \
    chown -R appuser:appuser /home/appuser

# Set HuggingFace cache environment variables
ENV TRANSFORMERS_CACHE=/home/appuser/.cache/huggingface
ENV HF_HOME=/home/appuser/.cache/huggingface
ENV TORCH_HOME=/home/appuser/.cache/torch

# Set working directory
WORKDIR /code

# Copy application code and configuration files
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini
COPY ./run_migrations.py ./run_migrations.py

# Change ownership to non-root user
RUN chown -R appuser:appuser /code

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production startup command (removed --reload for production)
CMD ["sh", "-c", "\
    echo '🚀 Echo Notes Backend (Production) Starting...' && \
    echo '🔄 Running database migrations...' && \
    python run_migrations.py && \
    echo '🌟 Starting FastAPI application in production mode...' && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 \
"]
