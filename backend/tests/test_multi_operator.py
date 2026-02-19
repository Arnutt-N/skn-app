"""
Tests for multiple operators handling:
- Two operators can join same room
- operator_joined broadcast when second operator joins
- operator_left broadcast when operator leaves
- Message broadcast reaches all operators in room

NOTE: Tests involving join_room are skipped because join_room queries
the database for conversation details, which requires a running DB.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


def drain_auth(ws):
    """Helper to drain auth responses"""
    ws.receive_json()  # auth_success
    ws.receive_json()  # presence_update


class TestMultipleOperators:
    """Test multiple operators scenarios that don't require DB"""

    def test_presence_shows_online_operators(self):
        """Presence update should show all online operators"""
        client1 = TestClient(app)

        with client1.websocket_connect("/api/v1/ws/live-chat") as ws1:
            ws1.send_json({"type": "auth", "payload": {"admin_id": "1"}})
            data = ws1.receive_json()  # auth_success
            presence = ws1.receive_json()  # presence_update

            # Should have at least 1 operator online
            assert presence["type"] == "presence_update"
            assert "operators" in presence["payload"]
            # Verify operators list is a list
            assert isinstance(presence["payload"]["operators"], list)

    def test_two_operators_connect_independently(self):
        """Two operators can connect and authenticate independently"""
        client1 = TestClient(app)
        client2 = TestClient(app)

        with client1.websocket_connect("/api/v1/ws/live-chat") as ws1:
            with client2.websocket_connect("/api/v1/ws/live-chat") as ws2:
                # Auth both with different IDs
                ws1.send_json({"type": "auth", "payload": {"admin_id": "1"}})
                data1 = ws1.receive_json()
                assert data1["type"] == "auth_success"
                ws1.receive_json()  # presence

                ws2.send_json({"type": "auth", "payload": {"admin_id": "2"}})
                data2 = ws2.receive_json()
                assert data2["type"] == "auth_success"
                ws2.receive_json()  # presence

                # Both can ping
                ws1.send_json({"type": "ping"})
                ws2.send_json({"type": "ping"})

                pong1 = ws1.receive_json()
                pong2 = ws2.receive_json()

                assert pong1["type"] == "pong"
                assert pong2["type"] == "pong"


@pytest.mark.skipif(True, reason="Requires database - join_room queries DB")
class TestMultipleOperatorsWithDB:
    """Tests that require database connection"""

    def test_two_operators_join_same_room(self):
        """Two operators can join the same room"""
        client1 = TestClient(app)
        client2 = TestClient(app)

        with client1.websocket_connect("/api/v1/ws/live-chat") as ws1:
            with client2.websocket_connect("/api/v1/ws/live-chat") as ws2:
                ws1.send_json({"type": "auth", "payload": {"admin_id": "1"}})
                drain_auth(ws1)
                ws2.send_json({"type": "auth", "payload": {"admin_id": "2"}})
                drain_auth(ws2)

                room_payload = {"line_user_id": "Uabcdef0123456789abcdef0123456001"}
                ws1.send_json({"type": "join_room", "payload": room_payload})
                ws2.send_json({"type": "join_room", "payload": room_payload})

                # Both should be able to ping
                ws1.send_json({"type": "ping"})
                ws2.send_json({"type": "ping"})
