@echo off
title MATRIX ERP Server
cd /d "%~dp0"
echo.
echo Starting MATRIX IT SOLUTION School ERP...
echo.
call npm run dev
if errorlevel 1 (
  echo.
  echo Startup failed. Try: npm install
  pause
)
