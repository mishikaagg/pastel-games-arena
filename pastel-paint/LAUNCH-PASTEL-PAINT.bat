@echo off
title Pastel Paint - Launcher
color 0A
cls

echo.
echo ========================================
echo   PASTEL PAINT - LAUNCHER
echo ========================================
echo.
echo Starting server and opening browser...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Change to script directory
cd /d "%~dp0"

REM Start server in background
start "Pastel Paint Server" /min cmd /c "python -m http.server 8000"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:8000/index.html

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo The app should now be open in your browser!
echo.
echo IMPORTANT:
echo - Keep the minimized "Pastel Paint Server" window running
echo - Close it when you're done using the app
echo.
echo The app is at: http://localhost:8000/index.html
echo.
echo ========================================
echo.
pause
