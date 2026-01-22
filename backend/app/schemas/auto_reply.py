"""
Pydantic schemas for Auto Reply API
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MatchTypeEnum(str, Enum):
    EXACT = "exact"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    REGEX = "regex"


class ReplyTypeEnum(str, Enum):
    TEXT = "text"
    FLEX = "flex"
    IMAGE = "image"
    STICKER = "sticker"
    VIDEO = "video"


class AutoReplyBase(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255, description="Keyword to match")
    match_type: MatchTypeEnum = Field(default=MatchTypeEnum.CONTAINS, description="How to match the keyword")
    reply_type: ReplyTypeEnum = Field(default=ReplyTypeEnum.TEXT, description="Type of reply")
    text_content: Optional[str] = Field(None, description="Text response (can include $object_id references)")
    payload: Optional[Dict[str, Any]] = Field(None, description="Direct payload for legacy Flex messages")


class AutoReplyCreate(AutoReplyBase):
    pass


class AutoReplyUpdate(BaseModel):
    keyword: Optional[str] = Field(None, min_length=1, max_length=255)
    match_type: Optional[MatchTypeEnum] = None
    reply_type: Optional[ReplyTypeEnum] = None
    text_content: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class AutoReplyResponse(AutoReplyBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True
