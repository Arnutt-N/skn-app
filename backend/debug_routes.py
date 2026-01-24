from app.main import app
import urllib.parse

print("Active Routes:")
for route in app.routes:
    if hasattr(route, "methods"):
        print(f"{route.methods} {route.path}")
    else:
        print(f"Route: {route.path}")
