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


@pytest.mark.skip(reason="Requires database connection - join_room queries DB")
def test_websocket_send_message_requires_text():
    """Test that send_message requires non-empty text"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        # Auth first
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Join a room first (use valid LINE user ID: U + 32 hex chars)
        websocket.send_json({
            "type": "join_room",
            "payload": {"line_user_id": "Uabcdef0123456789abcdef0123456782"}
        })

        # Try to send empty message
        websocket.send_json({
            "type": "send_message",
            "payload": {"text": "   "}
        })

        # Should receive error about empty text
        data = websocket.receive_json()
        assert data["type"] == "error"


@pytest.mark.skip(reason="Requires database connection - join_room queries DB")
def test_websocket_leave_room():
    """Test leaving a room prevents sending messages"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Join room (use valid LINE user ID format: U + 32 hex chars)
        websocket.send_json({"type": "join_room", "payload": {"line_user_id": "Uabcdef0123456789abcdef0123456789"}})
        # Note: join_room queries DB for conversation details

        # Leave room (no response expected)
        websocket.send_json({"type": "leave_room", "payload": {}})

        # Try to send message - should fail with "not in room" error
        websocket.send_json({"type": "send_message", "payload": {"text": "test"}})

        # The response should be an error
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert "room" in data["payload"]["message"].lower() or "join" in data["payload"]["message"].lower()


@pytest.mark.skip(reason="Requires database connection - join_room queries DB")
def test_websocket_typing_indicators():
    """Test typing start/stop events don't crash the connection"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Join room first (use valid LINE user ID format: U + 32 hex chars)
        websocket.send_json({"type": "join_room", "payload": {"line_user_id": "Uabcdef0123456789abcdef0123456780"}})

        # Send typing_start and typing_stop - these don't return responses
        # but shouldn't cause errors
        websocket.send_json({"type": "typing_start", "payload": {}})
        websocket.send_json({"type": "typing_stop", "payload": {}})

        # Verify connection still works with ping
        websocket.send_json({"type": "ping"})
        data = websocket.receive_json()

        # First response after typing events should be pong
        # (typing doesn't echo back to sender in single-client scenario)
        assert data["type"] == "pong"


@pytest.mark.skip(reason="Requires database connection - join_room queries DB")
def test_websocket_join_room_valid_format():
    """Test joining room with valid LINE user ID format doesn't cause validation error"""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as websocket:
        websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
        websocket.receive_json()  # auth_success
        websocket.receive_json()  # presence_update

        # Join room with valid LINE user ID (U + 32 hex chars)
        websocket.send_json({
            "type": "join_room",
            "payload": {"line_user_id": "Uabcdef0123456789abcdef0123456781"}
        })

        # Verify connection still works by pinging
        websocket.send_json({"type": "ping"})
        data = websocket.receive_json()

        # Should get pong (not validation error)
        assert data["type"] == "pong"
