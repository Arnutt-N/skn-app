from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("Testing internal routing...")
try:
    response = client.post("/api/v1/admin/settings/line/validate", json={"channel_access_token": "test"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
