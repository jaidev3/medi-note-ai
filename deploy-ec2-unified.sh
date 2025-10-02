#!/bin/bash
# =============================================================================
# EC2 DEPLOYMENT SCRIPT FOR ECHO NOTES UNIFIED CONTAINER
# Single container deployment - Backend + AI Service + Frontend + Database
# Optimized for minimal hassle and maximum efficiency
# =============================================================================

set -e

echo "🚀 Echo Notes - Unified Container EC2 Deployment"
echo "================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.unified.yaml"
ENV_FILE=".env"
NGINX_CONFIG_DIR="nginx"

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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# System Requirements Check
print_step "Checking system requirements..."

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    print_error "This script is designed for Ubuntu/Debian systems"
    echo "For other systems, please install Docker and Docker Compose manually"
    exit 1
fi

print_success "Running on Ubuntu/Debian system"

# Check available memory (AI service needs at least 4GB)
AVAILABLE_MEMORY=$(free -g | awk '/^Mem:/{print $2}')
if [ "$AVAILABLE_MEMORY" -lt 6 ]; then
    print_warning "System has ${AVAILABLE_MEMORY}GB RAM. Recommended: 8GB+ for AI models"
    print_warning "AI service performance may be degraded with less memory"
else
    print_success "System has ${AVAILABLE_MEMORY}GB RAM - sufficient for AI workloads"
fi

# Check available disk space (models need significant space)
AVAILABLE_DISK=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_DISK" -lt 20 ]; then
    print_warning "Available disk space: ${AVAILABLE_DISK}GB. Recommended: 50GB+ for models"
else
    print_success "Available disk space: ${AVAILABLE_DISK}GB - sufficient"
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_step "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    print_success "Docker installed successfully"
    print_warning "Please logout and login again to apply group changes, then re-run this script"
    exit 0
else
    print_success "Docker is already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_step "Installing Docker Compose..."
    
    # Download latest Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Install additional utilities
print_step "Installing system utilities..."
sudo apt-get update && sudo apt-get install -y curl jq htop git

# Get server IP for configuration
print_step "Detecting server configuration..."
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")
INTERNAL_IP=$(hostname -I | awk '{print $1}')

print_success "Public IP detected: $SERVER_IP"
print_success "Internal IP detected: $INTERNAL_IP"

# Configure environment file
print_step "Setting up environment configuration..."

if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file not found. Creating production template..."
    
    cat > $ENV_FILE << EOF
# =============================================================================
# ECHO NOTES UNIFIED PRODUCTION ENVIRONMENT
# =============================================================================

# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/echo_note_rag

# Authentication
JWT_SECRET_KEY=production-secret-key-$(openssl rand -hex 32)

# CORS and Security (automatically configured)
CORS_ORIGINS=http://$SERVER_IP,https://$SERVER_IP,http://localhost
TRUSTED_HOSTS=$SERVER_IP,localhost,127.0.0.1,$INTERNAL_IP

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://$SERVER_IP
NEXT_PUBLIC_APP_URL=http://$SERVER_IP

# OpenAI Configuration (REQUIRED - Please update these)
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# HuggingFace Configuration (REQUIRED - Please update these)
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here
HUGGINGFACE_MODEL_ID=aaditya/Llama3-OpenBioLLM-70B

# NER Model Configuration
NER_MODEL_NAME=d4data/biomedical-ner-all

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8002
AI_SERVICE_TIMEOUT=300

# Performance Configuration
AI_SERVICE_MAX_CONCURRENT_REQUESTS=10
AI_SERVICE_REQUEST_TIMEOUT=300
AI_SERVICE_LOG_LEVEL=INFO

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=bucket-of-echo
S3_ENDPOINT_URL=

# System Configuration
LOG_LEVEL=INFO
DEBUG=False
ENVIRONMENT=production
EOF

    print_warning "Environment file created. IMPORTANT: Please update API keys before proceeding!"
    print_warning "Edit the .env file and add your OPENAI_API_KEY and HUGGINGFACEHUB_API_TOKEN"
    echo ""
    echo "Required API keys:"
    echo "1. OpenAI API Key (for SOAP generation and embeddings)"
    echo "2. HuggingFace API Token (for biomedical models)"
    echo ""
    echo "After updating the keys, re-run this script to continue deployment."
    exit 1
else
    # Update existing environment for production
    print_status "Updating environment for production deployment..."
    
    # Update CORS and trusted hosts
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://$SERVER_IP,https://$SERVER_IP,http://localhost|g" $ENV_FILE
    sed -i "s|TRUSTED_HOSTS=.*|TRUSTED_HOSTS=$SERVER_IP,localhost,127.0.0.1,$INTERNAL_IP|g" $ENV_FILE
    
    # Update Next.js URLs
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP|g" $ENV_FILE
    sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://$SERVER_IP|g" $ENV_FILE
    
    # Ensure production settings
    sed -i "s|DEBUG=.*|DEBUG=False|g" $ENV_FILE
    sed -i "s|ENVIRONMENT=.*|ENVIRONMENT=production|g" $ENV_FILE
    
    print_success "Environment configured for production"
fi

# Validate required API keys
print_step "Validating API keys..."

if ! grep -q "OPENAI_API_KEY=sk-" $ENV_FILE && ! grep -q "OPENAI_API_KEY=.*[a-zA-Z0-9]" $ENV_FILE; then
    print_error "OPENAI_API_KEY is not set properly in $ENV_FILE"
    print_error "Please set your OpenAI API key and re-run this script"
    exit 1
fi

if ! grep -q "HUGGINGFACEHUB_API_TOKEN=hf_" $ENV_FILE && ! grep -q "HUGGINGFACEHUB_API_TOKEN=.*[a-zA-Z0-9]" $ENV_FILE; then
    print_error "HUGGINGFACEHUB_API_TOKEN is not set properly in $ENV_FILE"
    print_error "Please set your HuggingFace API token and re-run this script"
    exit 1
fi

print_success "API keys validated"

# Check if Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    print_error "Docker Compose file $DOCKER_COMPOSE_FILE not found!"
    print_error "Please ensure you're running this script from the project root directory"
    exit 1
fi

print_success "Docker Compose configuration found"

# Configure firewall (UFW)
print_step "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22      # SSH
    sudo ufw allow 80      # HTTP
    sudo ufw allow 443     # HTTPS
    sudo ufw allow 3000    # Frontend (direct access)
    sudo ufw allow 8001    # Backend API (direct access)
    sudo ufw allow 8002    # AI Service (direct access)
    print_success "Firewall configured"
else
    print_warning "UFW not available - please configure firewall manually"
fi

# Stop any existing containers
print_step "Stopping existing containers..."
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Clean up old images and containers to save space
print_step "Cleaning up old Docker resources..."
docker system prune -f || true
docker volume prune -f || true

# Build and start the unified container
print_step "Building and starting Echo Notes unified container..."
print_status "This will build a single container with:"
echo "  🖥️  Backend (FastAPI) - Port 8001"
echo "  🤖 AI Service (FastAPI) - Port 8002"
echo "  🎨 Frontend (Next.js) - Port 3000"
echo "  🌐 Nginx Proxy - Port 80"
echo "  📊 PostgreSQL Database - Port 5432"
echo ""
print_status "First build may take 15-20 minutes to download AI models..."

if docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up --build -d; then
    print_success "Containers started successfully"
else
    print_error "Failed to start containers"
    print_status "Checking logs for errors..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50
    exit 1
fi

# Wait for services to initialize
print_step "Waiting for services to initialize..."
print_status "This may take several minutes for AI models to load..."

# Progressive health checks with better feedback
check_service_health() {
    local service_name=$1
    local url=$2
    local max_attempts=$3
    local wait_time=$4
    local attempt=1
    
    print_status "Checking $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        else
            echo -n "."
            sleep $wait_time
            ((attempt++))
        fi
    done
    
    print_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Health check sequence with appropriate timeouts
echo ""
print_step "Performing health checks..."

# Database (quick check)
echo -n "Database"
if timeout 120 bash -c 'until docker-compose -f docker-compose.unified.yaml exec -T db pg_isready -U postgres -d echo_note_rag; do sleep 5; done' > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database failed to start"
    docker-compose -f $DOCKER_COMPOSE_FILE logs db
fi

# Main application (nginx proxy)
check_service_health "Main Application (Nginx)" "http://localhost/health" 30 5

# Backend API
check_service_health "Backend API" "http://localhost:8001/health" 20 10

# AI Service (may take longer due to model loading)
check_service_health "AI Service" "http://localhost:8002/health" 40 15

# Frontend
check_service_health "Frontend" "http://localhost:3000" 15 5

# Display deployment results
echo ""
print_step "Deployment Summary"
echo "=================="

# Show container status
print_status "Container status:"
docker-compose -f $DOCKER_COMPOSE_FILE ps

echo ""

# Show resource usage
print_status "Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -5

echo ""

# Success message with access information
print_success "🎉 Echo Notes unified container deployed successfully!"
echo ""
echo "=========================================="
echo "🌐 ACCESS POINTS"
echo "=========================================="
echo "🌐 Main Application:     http://$SERVER_IP"
echo "🎨 Frontend (Direct):    http://$SERVER_IP:3000"
echo "🖥️  Backend API:          http://$SERVER_IP:8001"
echo "🤖 AI Service API:       http://$SERVER_IP:8002"
echo "📚 Backend API Docs:     http://$SERVER_IP:8001/docs"
echo "🔬 AI Service API Docs:  http://$SERVER_IP:8002/docs"
echo ""
echo "=========================================="
echo "🔧 MANAGEMENT COMMANDS"
echo "=========================================="
echo "View logs:       docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "Stop services:   docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "Restart:         docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "Update app:      git pull && ./deploy-ec2-unified.sh"
echo "Monitor:         htop"
echo ""
echo "=========================================="
echo "📊 MONITORING"
echo "=========================================="
echo "System stats:    htop"
echo "Docker stats:    docker stats"
echo "Disk usage:      df -h"
echo "Service status:  docker-compose -f $DOCKER_COMPOSE_FILE ps"
echo ""
echo "=========================================="
echo "🚀 NEXT STEPS"
echo "=========================================="
echo "1. ✅ Test application: http://$SERVER_IP"
echo "2. 🔒 Set up SSL certificate (optional)"
echo "3. 🌐 Configure domain name (optional)"
echo "4. 📊 Set up monitoring/backups"
echo "5. 🔄 Configure automatic updates"
echo ""

# Final health verification
print_step "Final health verification..."
if curl -f -s "http://localhost/health" > /dev/null; then
    print_success "✨ Your Echo Notes application is live and healthy!"
    print_success "🎯 Access your application at: http://$SERVER_IP"
else
    print_warning "Application may still be starting up. Please wait a few more minutes."
fi

echo ""
print_success "🎉 Deployment completed successfully!"
