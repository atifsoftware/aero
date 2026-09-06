@echo off
title Aero Dual Server Control (EJS & Next.js) - START
color 0b
echo =========================================================
echo   🚀 Starting Dual Servers (EJS MVC & Next.js React)...
echo =========================================================
echo.
echo   [1] Express Backend & EJS Engine : http://localhost:3001
echo   [2] Next.js React Application    : http://localhost:3000
echo.
echo =========================================================
echo.

:: Launch both servers concurrently in a new window
start cmd /k "npm run dev"

:: Wait for servers bootup
timeout /t 5 /nobreak >nul

:: Open both browser tabs
echo 🌐 Opening EJS MVC Server at http://localhost:3001...
start http://localhost:3001

echo 🌐 Opening Next.js React App at http://localhost:3000...
start http://localhost:3000

echo.
echo ✓ Both Aero servers successfully launched side-by-side!
echo.
pause
