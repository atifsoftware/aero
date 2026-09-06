@echo off
title NodeFlow Server Control - RESTART
color 0e
echo ===================================================
echo   🔄 Restarting NodeFlow Server...
echo ===================================================
echo.

set "port=3000"

:: 1. Stop any running instance on port 3000
echo 1. Stopping any existing instances on port %port%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%port%') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: 2. Boot up new server
echo 2. Booting up new NodeFlow server instance...
start cmd /k "npm run dev"

:: 3. Open browser
timeout /t 3 /nobreak >nul
echo 3. Opening browser showroom at http://localhost:3000...
start http://localhost:3000

echo.
echo ✓ NodeFlow server successfully restarted!
echo.
pause
