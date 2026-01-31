from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class SessionStatus(str, Enum):
    WAITING = "WAITING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class ClosedBy(str, Enum):
    OPERATOR = "OPERATOR"
    SYSTEM = "SYSTEM"
    USER = "USER"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String(50), nullable=False, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default=SessionStatus.WAITING)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    message_count = Column(Integer, default=0)
    closed_by = Column(String(20), nullable=True)

    operator = relationship("User", back_populates="chat_sessions")
