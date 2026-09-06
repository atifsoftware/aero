@echo off
title NodeFlow Server Control - STOP
color 0c
echo ===================================================
echo   🛑 Stopping NodeFlow Server on Port 3000...
echo ===================================================
echo.

setlocal enabledelayedexpansion
set "port=3000"
set "found=0"

:: Search process ID listening on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%port%') do (
    set "pid=%%a"
    if not "!pid!"=="" (
        set /a "found+=1"
        echo ⏳ Found running Node instance [PID: !pid!]. Stopping it...
        taskkill /F /PID !pid! >nul 2>&1
    )
)

if !found! equ 0 (
    echo i No active NodeFlow process found listening on port 3000.
) else (
    echo ✓ Successfully stopped NodeFlow server on port 3000.
)

echo.
pause
