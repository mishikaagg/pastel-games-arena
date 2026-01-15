Write-Host "Starting local web server..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser and go to: http://localhost:8000/index.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""
python -m http.server 8000
