@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE - Publish release
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Publish-IDE-Release.ps1" %*
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
