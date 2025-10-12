#!/bin/bash

# Mumbai Smart City - Blackout Management System Startup Script

echo "=========================================="
echo "Mumbai Smart City - Blackout Management"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating template .env file..."
    echo "GROQ_API_KEY=your_groq_api_key_here" > .env
    echo "Please edit .env and add your Groq API key"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo ""
echo "🚀 Starting Blackout Management System..."
echo "   API Server: http://localhost:8002"
echo "   WebSocket: ws://localhost:8002/ws/blackout"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py



