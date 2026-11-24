@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE Development Tools
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Development-Tools.ps1" %*
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" pause
exit /b %RESULT%
