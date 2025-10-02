#!/bin/bash

# Echo Notes AI Service Startup Script

echo "🚀 Starting Echo Notes AI Service..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found. Creating template..."
    cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# HuggingFace Configuration
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here
HUGGINGFACE_MODEL_ID=aaditya/Llama3-OpenBioLLM-70B

# NER Model
NER_MODEL_NAME=d4data/biomedical-ner-all

# JWT Secret (for main backend)
JWT_SECRET_KEY=your-secret-key-here

# AWS S3 Configuration (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=bucket-of-echo
S3_ENDPOINT_URL=
EOF
    echo "📝 Please edit .env file with your API keys before proceeding."
    exit 1
fi

# Check if required environment variables are set
source .env

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_key_here" ]; then
    echo "❌ Error: OPENAI_API_KEY not set in .env file"
    exit 1
fi

if [ -z "$HUGGINGFACEHUB_API_TOKEN" ] || [ "$HUGGINGFACEHUB_API_TOKEN" = "your_huggingface_token_here" ]; then
    echo "❌ Error: HUGGINGFACEHUB_API_TOKEN not set in .env file"
    exit 1
fi

echo "✅ Environment variables configured"

# Check Docker availability
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed or not in PATH"
    exit 1
fi

echo "✅ Docker and Docker Compose available"

# Check if uv.lock exists for AI service
if [ ! -f ai_service/uv.lock ]; then
    echo "🔧 Setting up AI service dependencies..."
    if [ -f setup-ai-service.sh ]; then
        ./setup-ai-service.sh
    else
        echo "⚠️ Warning: setup-ai-service.sh not found. Trying manual setup..."
        if command -v uv &> /dev/null; then
            cd ai_service
            uv sync
            cd ..
            echo "✅ uv.lock file generated"
        else
            echo "⚠️ Warning: uv not found. Docker will handle dependency resolution."
            echo "   For faster builds, install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
        fi
    fi
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.ai.yaml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.ai.yaml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check database
echo "  📊 Database..."
if curl -f -s http://localhost:5433 > /dev/null 2>&1; then
    echo "    ✅ Database accessible"
else
    echo "    ⚠️ Database may still be starting..."
fi

# Check main backend
echo "  🖥️ Main Backend..."
if timeout 30 bash -c 'until curl -f -s http://localhost:8001/health > /dev/null; do sleep 2; done'; then
    echo "    ✅ Main Backend ready"
else
    echo "    ❌ Main Backend not responding"
fi

# Check AI service
echo "  🤖 AI Service..."
if timeout 60 bash -c 'until curl -f -s http://localhost:8002/health > /dev/null; do sleep 5; done'; then
    echo "    ✅ AI Service ready"
    
    # Check individual AI components
    echo "  🔍 AI Service Components..."
    
    # SOAP service
    if curl -f -s http://localhost:8002/soap/health > /dev/null; then
        echo "    ✅ SOAP Generation ready"
    else
        echo "    ⚠️ SOAP Generation may still be loading models..."
    fi
    
    # NER service
    if curl -f -s http://localhost:8002/ner/health > /dev/null; then
        echo "    ✅ NER Extraction ready"
    else
        echo "    ⚠️ NER Extraction may still be loading models..."
    fi
    
    # PII service
    if curl -f -s http://localhost:8002/pii/health > /dev/null; then
        echo "    ✅ PII Detection ready"
    else
        echo "    ⚠️ PII Detection may still be loading models..."
    fi
    
    # Embeddings service
    if curl -f -s http://localhost:8002/embeddings/health > /dev/null; then
        echo "    ✅ Embeddings Generation ready"
    else
        echo "    ⚠️ Embeddings Generation may still be loading models..."
    fi
    
else
    echo "    ❌ AI Service not responding"
    echo "    📋 Checking AI service logs..."
    docker-compose -f docker-compose.ai.yaml logs --tail=20 ai_service
fi

echo ""
echo "🎉 Deployment Summary:"
echo "  📊 Database:     http://localhost:5433"
echo "  🖥️ Main Backend: http://localhost:8001"
echo "  🤖 AI Service:   http://localhost:8002"
echo ""
echo "📚 Documentation:"
echo "  Main Backend API: http://localhost:8001/docs"
echo "  AI Service API:   http://localhost:8002/docs"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:        docker-compose -f docker-compose.ai.yaml logs -f"
echo "  Stop services:    docker-compose -f docker-compose.ai.yaml down"
echo "  Restart AI:       docker-compose -f docker-compose.ai.yaml restart ai_service"
echo ""

if curl -f -s http://localhost:8002/health > /dev/null; then
    echo "✅ All services are running! Ready for AI operations."
else
    echo "⚠️ Some services may still be starting. Check logs if issues persist."
    echo "   Note: AI models may take 2-3 minutes to fully load on first startup."
fi
