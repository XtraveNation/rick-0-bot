@echo off
REM rick-0-bot deployment automation script for Windows
REM Usage: deploy.bat
REM This script automates most of the deployment process for beginners

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════╗
echo ║  RickiA Deployment Automation Script v1.0  ║
echo ║  Deploying rick-0-bot to your server       ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check for Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found. Install Docker Desktop first:
    echo   https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker found: 
docker --version

REM Check for Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose not found. Install Docker Desktop first.
    pause
    exit /b 1
)

echo [OK] Docker Compose found: 
docker-compose --version

REM Check if .env files exist
echo.
echo Checking configuration files...
echo.

if not exist "backend\.env" (
    echo [WARNING] backend\.env not found, creating from template...
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env
        echo [OK] Created backend\.env
    ) else (
        echo [ERROR] backend\.env.example not found
        pause
        exit /b 1
    )
) else (
    echo [OK] backend\.env exists
)

if not exist "frontend\.env" (
    echo [WARNING] frontend\.env not found, creating from template...
    if exist "frontend\.env.example" (
        copy frontend\.env.example frontend\.env
        echo [OK] Created frontend\.env
    ) else (
        echo [ERROR] frontend\.env.example not found
        pause
        exit /b 1
    )
) else (
    echo [OK] frontend\.env exists
)

REM Check if API key is set
echo.
echo Checking API keys...
echo.

findstr /M "OPENAI_API_KEY=sk-" backend\.env >nul 2>&1
if errorlevel 1 (
    echo [WARNING] OpenAI API key not set in backend\.env
    echo   Get one free at: https://platform.openai.com/api-keys
    echo   Then edit: notepad backend\.env
    set /p continue="Continue without setting it now? (y/n): "
    if /i not "!continue!"=="y" (
        exit /b 1
    )
) else (
    echo [OK] OpenAI API key appears to be set
)

REM Build Docker images
echo.
echo Building Docker images...
echo [INFO] This may take 2-3 minutes...
echo.

docker-compose build
if errorlevel 1 (
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)

echo [OK] Docker images built successfully

REM Start services
echo.
echo Starting services...
echo.

docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo [OK] Services started

REM Wait for services to be healthy
echo.
echo Waiting for services to be healthy...
echo [INFO] This may take 10-30 seconds...
echo.

timeout /t 5 /nobreak

setlocal enabledelayedexpansion
set "HEALTHY=0"
set "ATTEMPTS=0"

:health_check_loop
if !HEALTHY! equ 0 (
    set /a ATTEMPTS=!ATTEMPTS!+1
    if !ATTEMPTS! leq 30 (
        docker-compose ps | findstr "healthy" >nul 2>&1
        if errorlevel 1 (
            echo Waiting... (!ATTEMPTS!/30^)
            timeout /t 1 /nobreak
            goto health_check_loop
        ) else (
            set "HEALTHY=1"
        )
    )
)

if !HEALTHY! equ 1 (
    echo [OK] All services are healthy
) else (
    echo [WARNING] Services not fully healthy yet, but continuing...
)

REM Verify deployment
echo.
echo Verifying deployment...
echo.

docker-compose ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Services are not running
    pause
    exit /b 1
)

echo [OK] Services are running

REM Show results
echo.
echo ╔════════════════════════════════════════════╗
echo ║  ✓ Deployment Complete!                   ║
echo ╚════════════════════════════════════════════╝
echo.

echo Access your application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   Backend Health: http://localhost:5000/api/health
echo.

echo Useful commands:
echo   View status: docker-compose ps
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Start services: docker-compose up -d
echo   Restart: docker-compose restart
echo.

echo Next steps:
echo   1. Open http://localhost:3000 in your browser
echo   2. Add your OpenAI API key in backend\.env if not done
echo   3. Restart backend: docker-compose restart backend
echo   4. Try a test message on the Rick tab
echo.

echo Need help?
echo   See: DEPLOYMENT_FOR_BEGINNERS.md
echo   See: DEPLOYMENT_QUICK_REFERENCE.md
echo   GitHub: https://github.com/XtraveNation/rick-0-bot/issues
echo.

echo Happy deploying! 🚀
echo.

pause
