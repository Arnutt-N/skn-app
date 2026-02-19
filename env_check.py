import os
import sys
import subprocess
import shutil

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip() if result.returncode == 0 else f"Error: {result.stderr.strip()}"
    except Exception as e:
        return f"Fail: {str(e)}"

results = {
    "python": sys.executable,
    "python_version": sys.version,
    "pip": run_cmd("pip --version"),
    "uv": run_cmd("uv --version"),
    "notebooklm": run_cmd("pip show notebooklm-mcp-server"),
    "where_notebooklm": shutil.which("notebooklm-mcp-server"),
}

with open("env_check.txt", "w") as f:
    for k, v in results.items():
        f.write(f"{k}: {v}\n")
