# NotebookLM MCP Utilities

This directory contains scripts for maintaining and authenticating the NotebookLM MCP server.

## Files
- `finish_auth.py`: A Python script to submit `cookies.txt` to the auth CLI automatically.
- `run_auth_piped.bat`: A quick batch file to run the authentication with piped input.
- `cookies.txt`: The file where you should paste your Google Search cookies extracted from DevTools.
- `setup_logs/`: A directory for previous installation logs and check scripts.

## How to re-authenticate
If your session expires:
1. Open `https://notebooklm.google.com` in Chrome.
2. Open DevTools (F12) -> Network -> filter `batchexecute`.
3. Copy the `cookie` value from the request headers.
4. Paste it into `cookies.txt` in this folder.
5. Run `run_auth_piped.bat`.
