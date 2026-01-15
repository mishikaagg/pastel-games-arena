@echo off
title Pastel Paint - Local Server
color 0A
echo.
echo ========================================
echo   PASTEL PAINT - STARTING SERVER
echo ========================================
echo.
echo Starting local web server on port 8000...
echo.
echo IMPORTANT: Keep this window open!
echo.
echo Once you see "Serving HTTP on..." below,
echo open your browser and go to:
echo.
echo    http://localhost:8000/index.html
echo.
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
python -m http.server 8000
pause
