
import json
import enum
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

# Mock the Enums
class MessageDirection(str, enum.Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"

class SenderRole(str, enum.Enum):
    USER = "USER"
    BOT = "BOT"
    ADMIN = "ADMIN"

class ChatMode(str, enum.Enum):
    BOT = "BOT"
    HUMAN = "HUMAN"

# Mock the Message model
class MockMessage:
    def __init__(self, id, direction, content, message_type, sender_role, operator_name, created_at):
        self.id = id
        self.direction = direction
        self.content = content
        self.message_type = message_type
        self.sender_role = sender_role
        self.operator_name = operator_name
        self.created_at = created_at

def test_serialization():
    # Create a mock message with Enum instances
    msg = MockMessage(
        id=1,
        direction=MessageDirection.OUTGOING,
        content="Hello world",
        message_type="text",
        sender_role=SenderRole.ADMIN,
        operator_name="Admin Test",
        created_at=datetime.utcnow()
    )

    # This mirrors the logic in ws_live_chat.py
    msg_data = {
        "id": msg.id,
        "direction": msg.direction.value if hasattr(msg.direction, 'value') else msg.direction,
        "content": msg.content,
        "message_type": msg.message_type,
        "sender_role": msg.sender_role.value if hasattr(msg.sender_role, 'value') else msg.sender_role,
        "operator_name": msg.operator_name,
        "created_at": msg.created_at.isoformat(),
    }

    print(f"Serialized message data: {msg_data}")
    
    # Try to serialize to JSON string (this would fail if msg_data contained raw Enums)
    try:
        json_str = json.dumps(msg_data)
        print("Successfully serialized to JSON!")
        print(f"JSON Output: {json_str}")
    except TypeError as e:
        print(f"FAILED to serialize: {e}")
        exit(1)

if __name__ == "__main__":
    test_serialization()
