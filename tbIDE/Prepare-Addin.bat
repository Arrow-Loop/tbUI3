@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE - Prepare add-in
echo Close the relevant twinBASIC project before continuing.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Prepare-IDE-Release.ps1" -Action Embed
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
