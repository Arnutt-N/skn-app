import sys
import site
import os

try:
    with open("loc.txt", "w") as f:
        f.write(f"EXE:{sys.executable}\n")
        f.write(f"USERBASE:{site.getuserbase()}\n")
        
        # Check for scripts
        user_scripts = os.path.join(site.getuserbase(), "Scripts")
        f.write(f"USER_SCRIPTS:{user_scripts}\n")
        if os.path.exists(user_scripts):
             f.write(f"USER_SCRIPTS_EXISTS:True\n")
             # Listing
             try:
                 for n in os.listdir(user_scripts):
                     if "notebooklm" in n:
                         f.write(f"FOUND_IN_USER:{os.path.join(user_scripts, n)}\n")
             except:
                 pass
        
        # Check for sys scripts
        sys_scripts = os.path.join(os.path.dirname(sys.executable), "Scripts")
        f.write(f"SYS_SCRIPTS:{sys_scripts}\n")
        if os.path.exists(sys_scripts):
             f.write(f"SYS_SCRIPTS_EXISTS:True\n")
             try:
                 for n in os.listdir(sys_scripts):
                     if "notebooklm" in n:
                         f.write(f"FOUND_IN_SYS:{os.path.join(sys_scripts, n)}\n")
             except:
                 pass

except Exception as e:
    pass
