
import pytest
import sys
import os

# Ensure we are in the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Output file
output_file = "test-results-internal.txt"

class Tee(object):
    def __init__(self, name, mode):
        self.file = open(name, mode)
        self.stdout = sys.stdout
        self.stderr = sys.stderr
        sys.stdout = self
        sys.stderr = self
    def __del__(self):
        sys.stdout = self.stdout
        sys.stderr = self.stderr
        self.file.close()
    def write(self, data):
        self.file.write(data)
        self.stdout.write(data)
    def flush(self):
        self.file.flush()
        self.stdout.flush()

# Redirect stdout/stderr to file
print(f"Running tests and writing to {output_file}...")
original_stdout = sys.stdout
original_stderr = sys.stderr

with open(output_file, "w", encoding="utf-8") as f:
    sys.stdout = f
    sys.stderr = f
    
    # Run pytest
    # -v: verbose
    # --tb=short: shorter tracebacks
    # -p no:warnings: suppress warnings to keep output clean
    exit_code = pytest.main(["tests/", "-v", "--tb=short", "-p", "no:warnings"])
    
    print(f"\nPytest finished with exit code: {exit_code}")

# Restore stdout/stderr
sys.stdout = original_stdout
sys.stderr = original_stderr
print("Test run completed.")
