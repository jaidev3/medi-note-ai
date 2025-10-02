#!/usr/bin/env python3
"""
Setup script for AI Service dependencies
This script generates uv.lock file for the AI service
"""

import os
import subprocess
import sys
from pathlib import Path

def main():
    """Generate uv.lock file for AI service."""
    # Change to ai_service directory
    ai_service_dir = Path(__file__).parent
    os.chdir(ai_service_dir)
    
    print("🔧 Setting up AI Service dependencies...")
    print(f"📁 Working directory: {ai_service_dir.absolute()}")
    
    try:
        # Check if uv is available
        result = subprocess.run(["uv", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Error: uv is not installed or not in PATH")
            print("Please install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh")
            return 1
        
        print(f"✅ uv version: {result.stdout.strip()}")
        
        # Initialize uv project if needed
        if not Path("uv.lock").exists():
            print("🔄 Initializing uv project and generating lock file...")
            result = subprocess.run(["uv", "sync"], check=True)
            print("✅ uv.lock file generated successfully")
        else:
            print("✅ uv.lock file already exists")
            print("🔄 Updating dependencies...")
            result = subprocess.run(["uv", "sync"], check=True)
            print("✅ Dependencies updated")
            
        print("\n🎉 AI Service setup complete!")
        print("📋 Next steps:")
        print("  1. Build Docker image: docker build -f ai_service/Dockerfile -t echo-notes-ai-service .")
        print("  2. Or use Docker Compose: docker-compose -f docker-compose.ai.yaml up --build")
        
        return 0
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running uv command: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
