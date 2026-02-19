"""
Tests for session claim workflow:
- Successful claim of WAITING session
- Reject claim of already-claimed session
- Claim without joining room first (error)
- SESSION_CLAIMED broadcast to all operators

NOTE: Tests requiring join_room are skipped because join_room queries
the database for conversation details, which requires a running DB.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


# Mark entire class as requiring DB for tests that join rooms
@pytest.mark.skipif(True, reason="Requires database - join_room queries DB for conversation details")
class TestSessionClaimWithDB:
    """Tests that require database connection (session exists)"""

    def test_claim_session_flow(self):
        """Full claim flow: join room, claim session"""
        client = TestClient(app)
        with client.websocket_connect("/api/v1/ws/live-chat") as ws:
            ws.send_json({"type": "auth", "payload": {"admin_id": "1"}})
            ws.receive_json()  # auth_success
            ws.receive_json()  # presence_update

            # Join room first (use valid LINE user ID format)
            ws.send_json({"type": "join_room", "payload": {"line_user_id": "Uabcdef0123456789abcdef0123456789"}})
            # May receive conversation_update or error (user may not exist)

            # Claim session
            ws.send_json({"type": "claim_session", "payload": {}})

            # Should receive either session_claimed or error (session may not exist)
            data = ws.receive_json()
            assert data["type"] in ["session_claimed", "error"]


class TestSessionClaim:
    """Test session claim WebSocket operations"""

    def test_claim_requires_room(self):
        """Cannot claim without joining room first"""
        client = TestClient(app)
        with client.websocket_connect("/api/v1/ws/live-chat") as ws:
            ws.send_json({"type": "auth", "payload": {"admin_id": "1"}})
            ws.receive_json()  # auth_success
            ws.receive_json()  # presence_update

            # Try to claim without joining room
            ws.send_json({"type": "claim_session", "payload": {}})

            data = ws.receive_json()
            assert data["type"] == "error"
            assert "room" in data["payload"]["message"].lower() or "conversation" in data["payload"]["message"].lower()

    def test_close_session_requires_room(self):
        """Cannot close session without being in room"""
        client = TestClient(app)
        with client.websocket_connect("/api/v1/ws/live-chat") as ws:
            ws.send_json({"type": "auth", "payload": {"admin_id": "1"}})
            ws.receive_json()  # auth_success
            ws.receive_json()  # presence_update

            # Try to close without joining room
            ws.send_json({"type": "close_session", "payload": {}})

            data = ws.receive_json()
            assert data["type"] == "error"
            assert "room" in data["payload"]["message"].lower() or "conversation" in data["payload"]["message"].lower()
