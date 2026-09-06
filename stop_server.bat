@echo off
title Aero Server Control - STOP
color 0c
echo ===================================================
echo   🛑 Stopping Aero Servers (Ports 3000 & 3001)...
echo ===================================================
echo.

for %%p in (3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo ✓ Successfully stopped servers on ports 3000 & 3001.
echo.
pause
