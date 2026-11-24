@echo off
setlocal EnableExtensions DisableDelayedExpansion
title tbUI3IDE 0.4.0.3 - Assemble and validate
pushd "%~dp0.." || goto :directory_error
if not exist "tbIDE\tools\pending-welcome-repair\apply.mjs" goto :not_pending
where node.exe >nul 2>&1
if errorlevel 1 goto :node_error
where git.exe >nul 2>&1
if errorlevel 1 (
    for /d %%G in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%~fG\resources\app\git\cmd\git.exe" set "PATH=%%~fG\resources\app\git\cmd;%PATH%"
    )
)
where git.exe >nul 2>&1
if errorlevel 1 goto :git_error
echo.
echo tbUI3IDE 0.4.0.3 - Guarded assembly
echo Close twinBASIC before running this repair.
echo This will apply the candidate, validate it, and commit and push
echo to tbui3-dev only if all required checks succeed.
echo.
node "tbIDE\tools\pending-welcome-repair\apply.mjs" --commit-push
set "RESULT=%ERRORLEVEL%"
echo.
if "%RESULT%"=="0" (
    echo SUCCESS: Assembly and automated validation completed.
    echo Open the updated add-in project to build both architectures.
) else (
    echo FAILED: Exit code %RESULT%.
    echo Inspect the output above. Do not publish a release until resolved.
    echo A failed push may leave a valid local commit; check GitHub Desktop.
)
goto :finish

:not_pending
echo No pending repair script was found. The repair may already be applied.
echo Check the current version and repository branch in GitHub Desktop.
set "RESULT=1"
goto :finish

:node_error
echo ERROR: Node.js was not found on PATH.
set "RESULT=1"
goto :finish

:git_error
echo ERROR: Git was not found on PATH or in GitHub Desktop.
set "RESULT=1"
goto :finish

:finish
popd
echo.
pause
exit /b %RESULT%

:directory_error
echo ERROR: Could not open the repository directory.
pause
exit /b 1
