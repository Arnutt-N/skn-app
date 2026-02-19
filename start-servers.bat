@echo off
echo Starting JskApp Servers...
echo.

:: Start Backend in new window
start "Backend Server" cmd /k "cd /d D:\genAI\skn-app\backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a bit for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend in new window  
start "Frontend Server" cmd /k "cd /d D:\genAI\skn-app\frontend && npm run dev"

echo.
echo Servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/api/v1/docs
echo Analytics: http://localhost:3000/admin/analytics
echo.
pause
