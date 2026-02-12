import subprocess
import os
import sys

# Path to python 3.12
py312 = r"C:\Python312\python.exe"

# Command to run auth in file mode
cmd = [py312, "-c", "from notebooklm_mcp.auth_cli import main; main()", "--file"]

print(f"Running: {' '.join(cmd)}")

# Run the process and pipe the input
try:
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    # Send 'cookies.txt\n' to stdin
    stdout, stderr = process.communicate(input="cookies.txt\n")

    print("--- STDOUT ---")
    print(stdout)
    print("--- STDERR ---")
    print(stderr)

    with open("auth_final_log.txt", "w") as f:
        f.write("STDOUT:\n")
        f.write(stdout)
        f.write("\nSTDERR:\n")
        f.write(stderr)

except Exception as e:
    print(f"Error: {e}")
    with open("auth_final_err.txt", "w") as f:
        f.write(str(e))
