#!/bin/bash

# Setup script for AI Service
echo "🤖 Setting up Echo Notes AI Service..."

# Check if we're in the right directory
if [ ! -f "ai_service/pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected to find ai_service/pyproject.toml"
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Source the shell configuration to make uv available
    if [ -f "$HOME/.profile" ]; then
        source "$HOME/.profile"
    fi
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc"
    fi
    
    # Check if uv is now available
    if ! command -v uv &> /dev/null; then
        echo "❌ Error: uv installation failed or not in PATH"
        echo "   Please install uv manually: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
fi

echo "✅ uv is available"

# Navigate to AI service directory
cd ai_service

# Generate uv.lock file
echo "🔧 Generating uv.lock file..."
if uv sync; then
    echo "✅ uv.lock file generated successfully"
else
    echo "❌ Error: Failed to generate uv.lock file"
    exit 1
fi

# Install spaCy model
echo "📚 Downloading spaCy model for PII detection..."
if uv run python -m spacy download en_core_web_sm; then
    echo "✅ spaCy model downloaded successfully"
else
    echo "⚠️ Warning: Failed to download spaCy model"
    echo "   This will be handled during Docker build"
fi

# Return to original directory
cd ..

echo ""
echo "🎉 AI Service setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set your API keys in .env file:"
echo "     OPENAI_API_KEY=your_openai_key"
echo "     HUGGINGFACEHUB_API_TOKEN=your_hf_token"
echo ""
echo "  2. Start the services:"
echo "     ./start-ai-service.sh"
echo ""
echo "  3. Or build manually:"
echo "     docker-compose -f docker-compose.ai.yaml up --build"
echo ""
echo "✅ Ready for deployment!"
