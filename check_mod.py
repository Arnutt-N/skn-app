import sys
try:
    import notebooklm_mcp_server
    print("MODULE_FOUND")
except ImportError:
    print("MODULE_NOT_FOUND")
except Exception as e:
    print(f"ERROR: {e}")
