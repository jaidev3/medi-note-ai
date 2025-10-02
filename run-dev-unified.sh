#!/bin/bash

# =============================================================================
# ECHO NOTES UNIFIED DEVELOPMENT ENVIRONMENT
# Single container running microservice architecture:
# - Backend (FastAPI) on port 8001
# - AI Service (FastAPI) on port 8002  
# - Frontend (Next.js) on port 3000
# - Nginx proxy on port 80
# - PostgreSQL with pgvector on port 5432
# =============================================================================

set -e  # Exit on any error

echo "🚀 Echo Notes - Unified Development Environment"
echo "=============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

print_success "Docker is available and running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    echo "Please install Docker Compose or use Docker Desktop."
    exit 1
fi

print_success "Docker Compose is available"

# Check for required environment variables
print_status "Checking environment configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOF
# =============================================================================
# ECHO NOTES UNIFIED ENVIRONMENT CONFIGURATION
# =============================================================================

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# HuggingFace Configuration (Required for AI features)
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here
HUGGINGFACE_MODEL_ID=aaditya/Llama3-OpenBioLLM-70B

# NER Model Configuration
NER_MODEL_NAME=d4data/biomedical-ner-all

# Authentication
JWT_SECRET_KEY=dev-secret-key-change-in-production

# AWS S3 Configuration (Optional for development)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=bucket-of-echo
S3_ENDPOINT_URL=

# Additional Configuration
LOG_LEVEL=INFO
EOF
    print_warning "Created .env template. Please update with your API keys before proceeding."
    exit 1
fi

# Source environment variables
source .env

# Validate required API keys
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_key_here" ]; then
    print_error "OPENAI_API_KEY is not set in .env file"
    echo "Please set your OpenAI API key in the .env file"
    exit 1
fi

if [ -z "$HUGGINGFACEHUB_API_TOKEN" ] || [ "$HUGGINGFACEHUB_API_TOKEN" = "your_huggingface_token_here" ]; then
    print_error "HUGGINGFACEHUB_API_TOKEN is not set in .env file"
    echo "Please set your HuggingFace API token in the .env file"
    exit 1
fi

print_success "Environment configuration validated"

# Setup AI service dependencies if needed
print_status "Setting up AI service dependencies..."
if [ ! -f "ai_service/uv.lock" ]; then
    if command -v uv &> /dev/null; then
        print_status "Generating uv.lock file for AI service..."
        cd ai_service
        uv sync
        cd ..
        print_success "AI service dependencies prepared"
    else
        print_warning "uv not found. Dependencies will be resolved during Docker build."
    fi
else
    print_success "AI service dependencies already prepared"
fi

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose -f docker-compose.unified.yaml down --remove-orphans 2>/dev/null || true

# Build and start the unified environment
print_status "Building and starting Echo Notes unified environment..."
print_status "This will start all services in a single container:"
echo "  📊 Database (PostgreSQL + pgvector) - Port 5432"
echo "  🌐 Nginx Proxy - Port 80 (main access)"
echo "  🖥️  Backend (FastAPI) - Port 8001"
echo "  🤖 AI Service (FastAPI) - Port 8002"
echo "  🎨 Frontend (Next.js) - Port 3000"
echo ""

# Build with progress indicator
print_status "Building unified container (this may take a few minutes on first run)..."
if docker-compose -f docker-compose.unified.yaml build --progress=plain; then
    print_success "Container built successfully"
else
    print_error "Container build failed"
    exit 1
fi

# Start services
print_status "Starting services..."
if docker-compose -f docker-compose.unified.yaml up -d; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to initialize..."
sleep 10

# Health check function
check_service() {
    local url=$1
    local name=$2
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "$name is ready"
            return 0
        fi
        count=$((count + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "$name failed to start"
    return 1
}

# Check each service
print_status "Performing health checks..."

echo -n "Checking Database"
if timeout 60 bash -c 'until docker-compose -f docker-compose.unified.yaml exec -T db pg_isready -U postgres -d echo_note_rag; do sleep 2; done' > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database failed to start"
fi

echo -n "Checking Main Application"
check_service "http://localhost:80/health" "Main Application (Nginx Proxy)"

echo -n "Checking Backend API"
check_service "http://localhost:8001/health" "Backend API"

echo -n "Checking AI Service"
check_service "http://localhost:8002/health" "AI Service"

echo -n "Checking Frontend"
check_service "http://localhost:3000" "Frontend"

echo ""
print_success "🎉 Echo Notes unified environment is ready!"
echo ""
echo "==============================================="
echo "📋 ACCESS POINTS:"
echo "==============================================="
echo "🌐 Main Application:  http://localhost"
echo "🎨 Frontend Direct:   http://localhost:3000"
echo "🖥️  Backend API:       http://localhost:8001"
echo "🤖 AI Service API:    http://localhost:8002"
echo "📊 Database:          localhost:5432"
echo ""
echo "📚 API Documentation:"
echo "🖥️  Backend API Docs:  http://localhost:8001/docs"
echo "🤖 AI Service Docs:   http://localhost:8002/docs"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:          docker-compose -f docker-compose.unified.yaml logs -f"
echo "  Stop services:      docker-compose -f docker-compose.unified.yaml down"
echo "  Restart services:   docker-compose -f docker-compose.unified.yaml restart"
echo "  View service status: docker-compose -f docker-compose.unified.yaml ps"
echo ""
echo "💡 Development Notes:"
echo "  • All services run in a single container with microservice architecture"
echo "  • Backend and AI Service communicate via internal HTTP"
echo "  • Frontend routes API calls through Nginx proxy"
echo "  • Database is shared between Backend and AI Service"
echo "  • Hot reload is available for frontend development"
echo ""

# Keep the script running to show logs
echo "Press Ctrl+C to stop the environment and view logs..."
echo "==============================================="
echo ""

# Function to handle script termination
cleanup() {
    echo ""
    print_status "Shutting down Echo Notes environment..."
    docker-compose -f docker-compose.unified.yaml down
    print_success "Environment stopped successfully"
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Follow logs
docker-compose -f docker-compose.unified.yaml logs -f
