import subprocess
import sys
import os

def run():
    print("Starting installation...")
    try:
        # Try to install via pip
        process = subprocess.Popen(
            [sys.executable, "-m", "pip", "install", "notebooklm-mcp-server"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        with open("install_log.txt", "w") as f:
            f.write("STDOUT:\n")
            f.write(stdout)
            f.write("\nSTDERR:\n")
            f.write(stderr)
            
        if process.returncode == 0:
            print("Installation successful.")
        else:
            print(f"Installation failed with code {process.returncode}.")
            
    except Exception as e:
        with open("install_error.txt", "w") as f:
            f.write(str(e))
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
