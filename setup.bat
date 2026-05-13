@echo off
REM Setup script for Hybrid Ephemeral Messenger (Windows)

echo 🚀 Hybrid Ephemeral Messenger - Setup Script (Windows)
echo ==================================================

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Install dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Create .env files
echo.
echo 📝 Creating environment files...

if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend\.env (PLEASE FILL IN WITH YOUR CREDENTIALS^)
)

if not exist frontend\.env.local (
    copy frontend\.env.local.example frontend\.env.local
    echo Created frontend\.env.local (PLEASE FILL IN WITH YOUR CREDENTIALS^)
)

echo.
echo ✅ Setup complete!
echo.
echo 📖 Next steps:
echo 1. Fill in your Firebase credentials in backend\.env and frontend\.env.local
echo 2. Run 'docker-compose up' or start services manually (see DEVELOPMENT.md^)
echo 3. Open http://localhost:3000 in your browser
echo.
echo For detailed setup instructions, see DEVELOPMENT.md
