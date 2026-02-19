"""
Shared pytest fixtures for WebSocket and API tests.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def test_client():
    """Create a test client for API tests"""
    return TestClient(app)


def drain_auth_responses(websocket):
    """Helper to drain auth_success and presence_update after auth"""
    websocket.receive_json()  # auth_success
    websocket.receive_json()  # presence_update


def auth_websocket(websocket, admin_id: str = "1"):
    """Authenticate a WebSocket connection and drain responses"""
    websocket.send_json({"type": "auth", "payload": {"admin_id": admin_id}})
    drain_auth_responses(websocket)
