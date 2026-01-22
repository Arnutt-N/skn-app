import requests
import json

url = "http://localhost:8000/api/v1/liff/service-requests"
payload = {
    "name": "Test User",
    "phone": "0812345678",
    "service_type": "Test Category",
    "description": "Scanning API Test",
    "line_user_id": "U1234567890dummy"
}

print(f"POSTing to {url}...")
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
