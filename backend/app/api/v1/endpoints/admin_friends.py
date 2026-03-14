from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional
from app.api import deps
from app.api.deps import get_current_admin
from app.models.user import User
from app.schemas.friend import FriendListResponse, FriendResponse
from app.services.friend_service import friend_service
from app.schemas.friend_event import FriendEventListResponse

router = APIRouter()

@router.get("", response_model=FriendListResponse)
async def list_friends(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(get_current_admin)
) -> Any:
    """List all friends with status"""
    friends = await friend_service.list_friends(status, db, skip, limit)
    return {
        "friends": [FriendResponse.model_validate(friend) for friend in friends],
        "total": len(friends),
    }

@router.get("/{line_user_id}/events", response_model=FriendEventListResponse)
async def get_friend_events(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(get_current_admin)
) -> Any:
    """Get friend history for a user"""
    events = await friend_service.get_friend_events(line_user_id, db)
    return {"events": events, "total": len(events)}
