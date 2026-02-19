import notebooklm_mcp_server
import os
import sys

with open("pkg_path.txt", "w") as f:
    f.write(f"Module path: {notebooklm_mcp_server.__file__}\n")
    # Also find where the console script would be
    script_path = os.path.join(os.path.dirname(sys.executable), "Scripts", "notebooklm-mcp-server.exe")
    f.write(f"Potential script path: {script_path}\n")
    f.write(f"Script exists: {os.path.exists(script_path)}\n")
    
    # Try user site too
    import site
    user_script = os.path.join(site.getuserbase(), "Scripts", "notebooklm-mcp-server.exe")
    f.write(f"Potential user script path: {user_script}\n")
    f.write(f"User script exists: {os.path.exists(user_script)}\n")
