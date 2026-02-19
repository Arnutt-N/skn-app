from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any
from .chat_session import ChatSessionResponse, SessionStatus
from .message import MessageResponse

class ChatMode(str, Enum):
    BOT = "BOT"
    HUMAN = "HUMAN"

class LastMessage(BaseModel):
    content: str
    created_at: datetime

class TagSummary(BaseModel):
    id: int
    name: str
    color: str

class ConversationSummary(BaseModel):
    line_user_id: str
    display_name: Optional[str] = None
    picture_url: Optional[str] = None
    friend_status: str
    chat_mode: ChatMode
    session: Optional[ChatSessionResponse] = None
    last_message: Optional[LastMessage] = None
    unread_count: int = 0
    tags: List[TagSummary] = Field(default_factory=list)

class ConversationList(BaseModel):
    conversations: List[ConversationSummary]
    total: int
    waiting_count: int
    active_count: int

class ConversationDetail(ConversationSummary):
    messages: List[MessageResponse]

class SendMessageRequest(BaseModel):
    text: Optional[str] = None
    reply_object_id: Optional[int] = None
    media_id: Optional[str] = None

class ModeToggleRequest(BaseModel):
    mode: ChatMode
