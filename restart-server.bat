@echo off
REM Script to restart the Next.js development server (Windows)
REM Usage: restart-server.bat

echo Stopping existing Next.js server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *next dev*" 2>nul || echo No server process found

echo Clearing build cache...
cd frontend
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleared

echo Starting Next.js dev server...
start /B npm run dev > ..\frontend-dev.log 2>&1

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Server started!
echo Logs: frontend-dev.log
echo Server: http://localhost:3000
echo.
echo To view logs: type frontend-dev.log
echo To stop server: taskkill /F /IM node.exe
