@echo off
echo cookies.txt | C:\Python312\python.exe -c "from notebooklm_mcp.auth_cli import main; main()" --file
