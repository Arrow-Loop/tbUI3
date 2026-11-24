@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE - Package release
echo Close the relevant twinBASIC project before continuing.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Prepare-IDE-Release.ps1" -Action Package
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
