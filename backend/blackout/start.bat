@echo off
REM Mumbai Smart City - Blackout Management System Startup Script (Windows)

echo ==========================================
echo Mumbai Smart City - Blackout Management
echo ==========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating template .env file...
    echo GROQ_API_KEY=your_groq_api_key_here > .env
    echo Please edit .env and add your Groq API key
    echo.
)

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt

REM Start the server
echo.
echo Starting Blackout Management System...
echo    API Server: http://localhost:8002
echo    WebSocket: ws://localhost:8002/ws/blackout
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py



