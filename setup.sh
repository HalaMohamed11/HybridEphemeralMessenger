#!/bin/bash

# Setup script for Hybrid Ephemeral Messenger

set -e

echo "🚀 Hybrid Ephemeral Messenger - Setup Script"
echo "=============================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env files
echo ""
echo "📝 Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env (PLEASE FILL IN WITH YOUR CREDENTIALS)"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "Created frontend/.env.local (PLEASE FILL IN WITH YOUR CREDENTIALS)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Fill in your Firebase credentials in backend/.env and frontend/.env.local"
echo "2. Run 'docker-compose up' or start services manually (see DEVELOPMENT.md)"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed setup instructions, see DEVELOPMENT.md"
