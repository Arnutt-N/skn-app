from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class MessageDirection(str, enum.Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String, index=True, nullable=True) # Can be null if system broadcast
    direction = Column(Enum(MessageDirection), nullable=False)
    message_type = Column(String, nullable=False) # text, image, sticker, location, flex
    content = Column(Text, nullable=True) # Text content or JSON string
    payload = Column(JSONB, nullable=True) # Full JSON payload for complex messages
    created_at = Column(DateTime(timezone=True), server_default=func.now())
