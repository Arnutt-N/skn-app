from sqlalchemy import Column, String, Integer, DateTime, Boolean, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class MatchType(str, enum.Enum):
    EXACT = "exact"
    CONTAINS = "contains"
    REGEX = "regex"
    STARTS_WITH = "starts_with"

class ReplyType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    LOCATION = "location"
    STICKER = "sticker"
    FLEX = "flex"
    TEMPLATE = "template"
    IMAGEMAP = "imagemap"

class IntentCategory(Base):
    __tablename__ = "intent_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    keywords = relationship("IntentKeyword", back_populates="category", cascade="all, delete-orphan")
    responses = relationship("IntentResponse", back_populates="category", cascade="all, delete-orphan")

class IntentKeyword(Base):
    __tablename__ = "intent_keywords"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("intent_categories.id", ondelete="CASCADE"), nullable=False)
    keyword = Column(String, index=True, nullable=False)
    match_type = Column(Enum(MatchType), default=MatchType.CONTAINS, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("IntentCategory", back_populates="keywords")

class IntentResponse(Base):
    __tablename__ = "intent_responses"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("intent_categories.id", ondelete="CASCADE"), nullable=False)
    reply_type = Column(Enum(ReplyType), nullable=False)
    
    # Content fields
    text_content = Column(Text, nullable=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media_files.id"), nullable=True)
    payload = Column(JSONB, nullable=True)
    
    # Ordering if we want multiple responses in sequence
    order = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("IntentCategory", back_populates="responses")
