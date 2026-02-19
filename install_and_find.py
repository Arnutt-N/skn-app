import subprocess
import sys
import shutil
import os
import site

with open("result.txt", "w") as f:
    try:
        f.write("Installing...\n")
        # Install quietly to avoid buffer issues, but capture stdout/err
        subprocess.check_call([sys.executable, "-m", "pip", "install", "notebooklm-mcp-server"], stdout=f, stderr=f)
        
        f.write("Finding...\n")
        tgt = shutil.which("notebooklm-mcp-server")
        if tgt:
            f.write(f"FOUND:{tgt}\n")
        else:
            # Check user scripts
            try:
                user_base = site.getuserbase()
                scripts = os.path.join(user_base, "Scripts", "notebooklm-mcp-server.exe")
                if os.path.exists(scripts):
                    f.write(f"FOUND:{scripts}\n")
                else:
                     f.write(f"NOT_IN_USER_SCRIPTS: {scripts}\n")
            except Exception as e:
                f.write(f"USER_BASE_ERROR: {e}\n")

            # Check Python install scripts
            try:
                sys_scripts = os.path.join(os.path.dirname(sys.executable), "Scripts", "notebooklm-mcp-server.exe")
                if os.path.exists(sys_scripts):
                    f.write(f"FOUND:{sys_scripts}\n")
                else:
                    f.write(f"NOT_IN_SYS_SCRIPTS: {sys_scripts}\n")
            except Exception as e:
                 f.write(f"SYS_SCRIPTS_ERROR: {e}\n")
            
            f.write(f"Python Executable: {sys.executable}\n")

    except Exception as e:
        f.write(f"ERROR: {e}\n")
