from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID

class MatchTypeEnum(str, Enum):
    exact = "exact"
    contains = "contains"
    regex = "regex"
    starts_with = "starts_with"

class ReplyTypeEnum(str, Enum):
    text = "text"
    flex = "flex"
    image = "image"
    sticker = "sticker"
    video = "video"
    template = "template"

# --- Keywords ---
class IntentKeywordBase(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255)
    match_type: MatchTypeEnum = MatchTypeEnum.contains

class IntentKeywordCreate(IntentKeywordBase):
    category_id: int

class IntentKeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    match_type: Optional[MatchTypeEnum] = None

class IntentKeywordResponse(IntentKeywordBase):
    id: int
    category_id: int
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True

# --- Responses ---
class IntentResponseBase(BaseModel):
    reply_type: ReplyTypeEnum = ReplyTypeEnum.text
    text_content: Optional[str] = None
    media_id: Optional[UUID] = None
    payload: Optional[Dict[str, Any]] = None
    order: int = 0
    is_active: bool = True

class IntentResponseCreate(IntentResponseBase):
    category_id: int

class IntentResponseUpdate(BaseModel):
    reply_type: Optional[ReplyTypeEnum] = None
    text_content: Optional[str] = None
    media_id: Optional[UUID] = None
    payload: Optional[Dict[str, Any]] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class IntentResponseResponse(IntentResponseBase):
    id: int
    category_id: int
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True

# --- Categories ---
class IntentCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = True

class IntentCategoryCreate(IntentCategoryBase):
    pass

class IntentCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class IntentCategoryResponse(IntentCategoryBase):
    id: int
    created_at: datetime
    
    # Quick stats
    keyword_count: int = 0
    response_count: int = 0
    keywords_preview: List[str] = []  # First 5 keywords for preview

    class Config:
        from_attributes = True
        use_enum_values = True

class IntentCategoryDetailResponse(IntentCategoryResponse):
    keywords: List[IntentKeywordResponse] = []
    responses: List[IntentResponseResponse] = []
