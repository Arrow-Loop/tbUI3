@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE 0.4.0.3 - Assemble and validate
echo Close twinBASIC before running this repair.
echo A portable development runtime will be prepared if needed.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Apply-Welcome-Repair.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
