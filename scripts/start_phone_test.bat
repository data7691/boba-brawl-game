@echo off
setlocal
cd /d "%~dp0.."
set "HOST=0.0.0.0"
set "PORT=4181"
set "BOBA_DATA_FILE=%CD%\server\data\phone-test.json"
set "NODE_BIN=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "client\dist\index.html" (
  echo Please build the client first.
  pause
  exit /b 1
)
echo Phone test server started on port 4181.
echo On your phone, connect to the same Wi-Fi and open http://YOUR-COMPUTER-IP:4181/
echo Find your computer IPv4 address with ipconfig. Keep this window open.
"%NODE_BIN%" server\src\index.mjs
pause
