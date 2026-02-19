@echo off
rem Run authentication from the script's directory
cd /d "%~dp0"
echo cookies.txt | C:\Python312\python.exe -c "from notebooklm_mcp.auth_cli import main; main()" --file
pause
