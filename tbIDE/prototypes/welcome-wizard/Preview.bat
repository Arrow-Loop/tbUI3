@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found on PATH.
  echo Install Node.js or launch this from a terminal where node.exe is available.
  echo.
  pause
  exit /b 1
)
echo.
echo Starting tbUI3IDE Welcome Wizard preview...
echo The browser will open at http://127.0.0.1:8765/
echo Close this window or press Ctrl+C to stop the server.
echo.
node.exe "%~dp0preview-server.cjs"
if errorlevel 1 (
  echo.
  echo Preview server failed. Review the error above.
  pause
  exit /b 1
)
endlocal
