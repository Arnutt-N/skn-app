from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class FriendResponse(BaseModel):
    line_user_id: str
    display_name: Optional[str] = None
    picture_url: Optional[str] = None
    friend_status: Optional[str] = None
    friend_since: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    chat_mode: str

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class FriendListResponse(BaseModel):
    friends: List[FriendResponse]
    total: int
