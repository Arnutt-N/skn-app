@echo off
echo Installing notebooklm-mcp-server...
pip install notebooklm-mcp-server > install_log.txt 2>&1
echo Done. >> install_log.txt
type install_log.txt
