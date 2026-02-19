
import sys
import os
from alembic.config import Config
from alembic.script import ScriptDirectory

def print_heads():
    # Make sure we are in the backend directory
    if not os.path.exists("alembic.ini"):
        print("Error: alembic.ini not found. Run this from backend/ dir.")
        return

    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)
    
    print("--- Current Heads ---")
    for head in script.get_heads():
        print(head)

if __name__ == "__main__":
    print_heads()
