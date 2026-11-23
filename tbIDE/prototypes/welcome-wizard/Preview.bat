@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0preview-server.ps1" (
  echo Preview server file is missing.
  pause
  exit /b 1
)
echo.
echo Starting tbUI3IDE Welcome Wizard preview using Windows PowerShell...
echo The browser will open at http://127.0.0.1:8765/
echo Close this window or press Ctrl+C to stop the server.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview-server.ps1"
if errorlevel 1 (
  echo.
  echo Preview server failed. Review the error above.
  pause
  exit /b 1
)
endlocal
