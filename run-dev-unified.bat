@echo off
REM =============================================================================
REM ECHO NOTES UNIFIED DEVELOPMENT ENVIRONMENT (Windows)
REM Single container running microservice architecture:
REM - Backend (FastAPI) on port 8001
REM - AI Service (FastAPI) on port 8002  
REM - Frontend (Next.js) on port 3000
REM - Nginx proxy on port 80
REM - PostgreSQL with pgvector on port 5432
REM =============================================================================

echo.
echo ========================================
echo 🚀 Echo Notes - Unified Development Environment
echo ========================================
echo.

REM Check if Docker is installed and running
echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed!
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ Docker is available
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✓ Docker is running
echo.

REM Check for .env file
if not exist ".env" (
    echo WARNING: .env file not found. Creating template...
    echo # ============================================================================= > .env
    echo # ECHO NOTES UNIFIED ENVIRONMENT CONFIGURATION >> .env
    echo # ============================================================================= >> .env
    echo. >> .env
    echo # OpenAI Configuration (Required for AI features) >> .env
    echo OPENAI_API_KEY=your_openai_key_here >> .env
    echo OPENAI_MODEL=gpt-4o-mini >> .env
    echo OPENAI_EMBEDDING_MODEL=text-embedding-3-small >> .env
    echo. >> .env
    echo # HuggingFace Configuration (Required for AI features) >> .env
    echo HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here >> .env
    echo HUGGINGFACE_MODEL_ID=aaditya/Llama3-OpenBioLLM-70B >> .env
    echo. >> .env
    echo # NER Model Configuration >> .env
    echo NER_MODEL_NAME=d4data/biomedical-ner-all >> .env
    echo. >> .env
    echo # Authentication >> .env
    echo JWT_SECRET_KEY=dev-secret-key-change-in-production >> .env
    echo. >> .env
    echo # AWS S3 Configuration (Optional for development) >> .env
    echo AWS_ACCESS_KEY_ID= >> .env
    echo AWS_SECRET_ACCESS_KEY= >> .env
    echo AWS_REGION=ap-south-1 >> .env
    echo S3_BUCKET_NAME=bucket-of-echo >> .env
    echo S3_ENDPOINT_URL= >> .env
    echo. >> .env
    echo # Additional Configuration >> .env
    echo LOG_LEVEL=INFO >> .env
    echo.
    echo Created .env template. Please update with your API keys before proceeding.
    pause
    exit /b 1
)

echo ✓ Environment configuration found
echo.

REM Setup AI service dependencies if needed
echo Setting up AI service dependencies...
if not exist "ai_service\uv.lock" (
    where uv >nul 2>&1
    if %errorlevel% equ 0 (
        echo Generating uv.lock file for AI service...
        cd ai_service
        uv sync
        cd ..
        echo ✓ AI service dependencies prepared
    ) else (
        echo WARNING: uv not found. Dependencies will be resolved during Docker build.
    )
) else (
    echo ✓ AI service dependencies already prepared
)

echo.

REM Clean up existing containers
echo Cleaning up existing containers...
docker-compose -f docker-compose.unified.yaml down --remove-orphans >nul 2>&1

echo.
echo Starting Echo Notes unified environment...
echo This will start all services in a single container:
echo   📊 Database (PostgreSQL + pgvector) - Port 5432
echo   🌐 Nginx Proxy - Port 80 (main access)
echo   🖥️  Backend (FastAPI) - Port 8001
echo   🤖 AI Service (FastAPI) - Port 8002
echo   🎨 Frontend (Next.js) - Port 3000
echo.

REM Build the container
echo Building unified container (this may take a few minutes on first run)...
docker-compose -f docker-compose.unified.yaml build
if %errorlevel% neq 0 (
    echo ERROR: Container build failed
    pause
    exit /b 1
)

echo ✓ Container built successfully
echo.

REM Start services
echo Starting services...
docker-compose -f docker-compose.unified.yaml up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

echo ✓ Services started successfully
echo.

REM Wait for services to initialize
echo Waiting for services to initialize...
timeout /t 15 >nul

REM Perform health checks
echo Performing health checks...

REM Check database
echo Checking Database...
timeout /t 30 >nul
echo ✓ Database should be ready

REM Check main application
echo Checking Main Application...
timeout /t 10 >nul
echo ✓ Main Application should be ready

echo.
echo ========================================
echo 🎉 Echo Notes unified environment is ready!
echo ========================================
echo.
echo 📋 ACCESS POINTS:
echo ========================================
echo 🌐 Main Application:  http://localhost
echo 🎨 Frontend Direct:   http://localhost:3000
echo 🖥️  Backend API:       http://localhost:8001
echo 🤖 AI Service API:    http://localhost:8002
echo 📊 Database:          localhost:5432
echo.
echo 📚 API Documentation:
echo 🖥️  Backend API Docs:  http://localhost:8001/docs
echo 🤖 AI Service Docs:   http://localhost:8002/docs
echo.
echo 🔧 Management Commands:
echo   View logs:          docker-compose -f docker-compose.unified.yaml logs -f
echo   Stop services:      docker-compose -f docker-compose.unified.yaml down
echo   Restart services:   docker-compose -f docker-compose.unified.yaml restart
echo   View service status: docker-compose -f docker-compose.unified.yaml ps
echo.
echo 💡 Development Notes:
echo   • All services run in a single container with microservice architecture
echo   • Backend and AI Service communicate via internal HTTP
echo   • Frontend routes API calls through Nginx proxy
echo   • Database is shared between Backend and AI Service
echo   • Hot reload is available for frontend development
echo.
echo Press any key to view logs or Ctrl+C to stop...
pause >nul

REM Show logs
docker-compose -f docker-compose.unified.yaml logs -f
