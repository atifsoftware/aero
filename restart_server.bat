@echo off
title Aero Dual Server Control (EJS & Next.js) - RESTART
color 0e
echo =========================================================
echo   🔄 Restarting Dual Servers (EJS MVC & Next.js React)...
echo =========================================================
echo.

:: 1. Stop any running instances on ports 3000 and 3001
echo 1. Stopping existing instances on ports 3000 and 3001...
for %%p in (3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul

:: 2. Boot up both servers
echo 2. Booting up both servers concurrently...
start cmd /k "npm run dev"

:: 3. Open browsers
timeout /t 5 /nobreak >nul
echo 3. Opening EJS MVC at http://localhost:3001...
start http://localhost:3001
echo 4. Opening Next.js React at http://localhost:3000...
start http://localhost:3000

echo.
echo ✓ Both Aero servers successfully restarted!
echo.
pause
