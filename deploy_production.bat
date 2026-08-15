@echo off
title EffStreak Production Server & Network Deployer
echo ========================================================
echo   ⚡ EffStreak Local Network Production Deployment
echo ========================================================
echo.

echo 1. Building Production Web Bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Launching Full-Stack Production Server on Port 5000...
echo 📡 Local URL   : http://localhost:5000
echo 🌐 Network URL : http://192.168.0.122:5000
echo.
cd backend
node src/server.js
pause
