@echo off
cd /d "%~dp0"
start "AIONEX AI Backend" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-chatbot.ps1"
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:8000/#top"
