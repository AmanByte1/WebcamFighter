@echo off
title Shadow Rift — Stopping
color 0C
echo.
echo  Stopping Shadow Rift...
echo.
taskkill /f /fi "WINDOWTITLE eq Shadow Rift - Backend*"  >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Shadow Rift - Frontend*" >nul 2>&1
echo  All stopped. Goodbye!
echo.
pause
