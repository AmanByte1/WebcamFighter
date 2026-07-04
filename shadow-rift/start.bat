@echo off
title Shadow Rift — Game Launcher
color 0A

echo.
echo  ==========================================
echo   SHADOW RIFT — Webcam Fighter
echo   FSD Project — Starting up...
echo  ==========================================
echo.

:: ── Step 1: Check MongoDB is running ──────────────────
echo [1/3] Checking MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo       MongoDB started successfully
) else (
    echo       MongoDB already running
)
echo.

:: ── Step 2: Start backend server ──────────────────────
echo [2/3] Starting backend server (port 5000)...
start "Shadow Rift - Backend" cmd /k "cd /d %~dp0server && npm run dev"
echo       Backend starting... waiting 4 seconds
timeout /t 4 /nobreak >nul
echo.

:: ── Step 3: Start frontend ────────────────────────────
echo [3/3] Starting frontend (port 5173)...
start "Shadow Rift - Frontend" cmd /k "cd /d %~dp0 && npm run dev"
echo       Frontend starting... waiting 4 seconds
timeout /t 4 /nobreak >nul
echo.

:: ── Open browser ──────────────────────────────────────
echo  Opening game in browser...
start http://localhost:5173
echo.
echo  ==========================================
echo   Game is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Health   : http://localhost:5000/api/health
echo  ==========================================
echo.
echo  Close the two terminal windows to stop.
pause
