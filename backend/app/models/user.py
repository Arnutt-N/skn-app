from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    AGENT = "AGENT"
    USER = "USER"

class ChatMode(str, enum.Enum):
    BOT = "BOT"
    HUMAN = "HUMAN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String, unique=True, index=True, nullable=True) # For LINE users
    username = Column(String, unique=True, index=True, nullable=True)     # For Admins
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    display_name = Column(String, nullable=True)
    picture_url = Column(String, nullable=True)
    
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    
    # Organization (For Admins/Agents)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="users")

    # Chat State
    chat_mode = Column(Enum(ChatMode), default=ChatMode.BOT)

    # Friend Status (For LINE Users)
    friend_status = Column(String, nullable=True, default="ACTIVE")
    friend_since = Column(DateTime(timezone=True), nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    requests = relationship("ServiceRequest", back_populates="requester", foreign_keys="ServiceRequest.requester_id")
    assigned_requests = relationship("ServiceRequest", back_populates="assignee", foreign_keys="ServiceRequest.assigned_agent_id")
    bookings = relationship("Booking", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="operator")
