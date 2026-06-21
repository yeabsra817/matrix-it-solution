@echo off
echo ============================================
echo  Matrix Modern Banking KPI Tracker
echo  Developed by Yeabsra Teffera
echo ============================================
echo.
echo Starting Backend API on port 4000...
start "Matrix KPI API" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul
echo Starting Frontend on port 3000...
start "Matrix KPI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Open http://localhost:3000 in your browser
echo Login: branch@matrixbank.com / Password123!
pause
