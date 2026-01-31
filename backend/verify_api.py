
import requests
import json
try:
    res = requests.get("http://localhost:8000/api/v1/admin/live-chat/conversations")
    print(f"Status: {res.status_code}")
    with open("verify_api_response.json", "w") as f:
        json.dump(res.json(), f, indent=2)
    print("Success: verify_api_response.json created")
except Exception as e:
    with open("verify_api_response.json", "w") as f:
        f.write(str(e))
    print(f"Error: {e}")
