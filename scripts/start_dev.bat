@echo off
setlocal
cd /d "%~dp0.."
set "NODE_BIN=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "client\dist\index.html" (
  echo Please build the client first.
  pause
  exit /b 1
)
echo Boba Brawl local game: http://127.0.0.1:4180/
echo Keep this window open while playing. Press Ctrl+C to stop.
"%NODE_BIN%" server\src\index.mjs
pause
