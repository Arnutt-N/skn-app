import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_websocket_connect_and_auth():
    """Test WebSocket connection and authentication flow"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Send auth
        websocket.send_json({
            "type": "auth",
            "payload": {"admin_id": "1"}
        })

        # Should receive auth_success
        data = websocket.receive_json()
        assert data["type"] == "auth_success"
        assert data["payload"]["admin_id"] == "1"

        # Should receive presence_update
        data = websocket.receive_json()
        assert data["type"] == "presence_update"


def test_websocket_ping_pong():
    """Test ping/pong heartbeat"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Test ping/pong
        websocket.send_json({"type": "ping"})
        data = websocket.receive_json()
        assert data["type"] == "pong"


def test_websocket_requires_auth():
    """Test that operations require authentication"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Try to join room without auth
        websocket.send_json({
            "type": "join_room",
            "payload": {"line_user_id": "U123"}
        })

        # Should receive error
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert "authenticated" in data["payload"]["message"].lower()


def test_websocket_unknown_message_type():
    """Test handling of unknown message types"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Send unknown message type
        websocket.send_json({"type": "unknown_type", "payload": {}})
        
        # Should receive error but connection stays open
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert "unknown" in data["payload"]["message"].lower()


def test_websocket_join_room_requires_line_user_id():
    """Test that join_room requires line_user_id"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Try to join room without line_user_id
        websocket.send_json({"type": "join_room", "payload": {}})
        
        # Should receive error
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert "line_user_id" in data["payload"]["message"].lower()


def test_websocket_send_message_requires_room():
    """Test that send_message requires being in a room"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Try to send message without joining room
        websocket.send_json({
            "type": "send_message",
            "payload": {"text": "Hello"}
        })
        
        # Should receive error
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert "room" in data["payload"]["message"].lower()


def test_websocket_send_message_requires_text():
    """Test that send_message requires non-empty text"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Join a room first
        websocket.send_json({
            "type": "join_room",
            "payload": {"line_user_id": "U123"}
        })
        
        # Wait for conversation_update (may not come if user doesn't exist)
        # But room should be joined
        
        # Try to send empty message
        websocket.send_json({
            "type": "send_message",
            "payload": {"text": "   "}
        })
        
        # Should receive error
        data = websocket.receive_json()
        assert data["type"] == "error"
