@echo off
title NodeFlow Server Control - START
color 0b
echo ===================================================
echo   🚀 Starting NodeFlow Development Server...
echo ===================================================
echo.

:: Launch the development server in a new window
start cmd /k "npm run dev"

:: Wait for server bootup
timeout /t 3 /nobreak >nul

:: Open browser automatically
echo 🌐 Opening browser showroom at http://localhost:3001...
start http://localhost:3001

echo.
echo ✓ NodeFlow server successfully launched!
echo.
pause
