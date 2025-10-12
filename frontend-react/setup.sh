#!/bin/bash

echo "🚀 Starting Echo Notes React Frontend Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the frontend-react directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
sudo npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env file if needed (default: http://localhost:8000)"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3001"
echo ""
echo "📚 For more info, see SETUP.md"
echo ""
