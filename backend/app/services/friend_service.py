from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.friend_event import FriendEvent, FriendEventType, EventSource
from app.models.user import User
from app.schemas.friend_event import FriendEventResponse
from datetime import datetime, timezone
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class FriendService:
    async def get_or_create_user(self, line_user_id: str, db: AsyncSession) -> User:
        """Get existing user or create new one from LINE profile"""
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            # Try to fetch profile from LINE
            from app.core.line_client import get_line_bot_api
            try:
                profile = await get_line_bot_api().get_profile(line_user_id)
                user = User(
                    line_user_id=line_user_id,
                    display_name=profile.display_name,
                    picture_url=profile.picture_url,
                    friend_status="ACTIVE",
                    friend_since=datetime.now(timezone.utc),
                    profile_updated_at=datetime.now(timezone.utc),
                )
            except Exception as e:
                # Fallback if profile fetch fails
                user = User(
                    line_user_id=line_user_id,
                    display_name="LINE User",
                    friend_status="ACTIVE",
                    friend_since=datetime.now(timezone.utc),
                )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
        return user

    async def refresh_profile(
        self,
        line_user_id: str,
        db: AsyncSession,
        force: bool = False,
        stale_after_hours: int = 24,
    ) -> Optional[User]:
        """Refresh LINE profile for a user when stale or forced."""
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None

        now = datetime.now(timezone.utc)
        profile_updated_at = user.profile_updated_at
        if profile_updated_at and profile_updated_at.tzinfo is None:
            profile_updated_at = profile_updated_at.replace(tzinfo=timezone.utc)
        if (
            not force
            and profile_updated_at
            and (now - profile_updated_at).total_seconds() < stale_after_hours * 3600
        ):
            return user

        from app.core.line_client import get_line_bot_api

        try:
            profile = await get_line_bot_api().get_profile(line_user_id)
            user.display_name = profile.display_name or user.display_name
            user.picture_url = profile.picture_url or user.picture_url
            user.profile_updated_at = now
            await db.commit()
            await db.refresh(user)
        except Exception as exc:
            logger.warning("Failed to refresh LINE profile for %s: %s", line_user_id, exc)

        return user

    async def handle_follow(self, line_user_id: str, db: AsyncSession):
        """Handle follow/follow event"""
        # Check if user already exists
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        
        event_type = FriendEventType.FOLLOW
        
        if user:
            if user.friend_status == "UNFOLLOWED":
                event_type = FriendEventType.REFOLLOW
            
            user.friend_status = "ACTIVE"
            user.is_active = True
            if not user.friend_since:
                user.friend_since = datetime.now(timezone.utc)
        else:
            # User will be created by webhook handler or here
            # For now, we just log the event. Webhook will create the user.
            pass
            
        event = FriendEvent(
            line_user_id=line_user_id,
            event_type=event_type,
            source=EventSource.WEBHOOK
        )
        db.add(event)
        await db.commit()
        return event

    async def handle_unfollow(self, line_user_id: str, db: AsyncSession):
        """Handle unfollow event"""
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        
        if user:
            user.friend_status = "UNFOLLOWED"
            # We don't necessarily set is_active=False as they might still be in DB
        
        event = FriendEvent(
            line_user_id=line_user_id,
            event_type=FriendEventType.UNFOLLOW,
            source=EventSource.WEBHOOK
        )
        db.add(event)
        await db.commit()
        return event

    async def get_friend_events(
        self, 
        line_user_id: str, 
        db: AsyncSession, 
        limit: int = 50
    ) -> List[FriendEvent]:
        """Get history for a user"""
        result = await db.execute(
            select(FriendEvent)
            .where(FriendEvent.line_user_id == line_user_id)
            .order_by(desc(FriendEvent.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_friends(
        self, 
        status: Optional[str], 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[User]:
        """List users who are friends"""
        query = select(User).where(User.line_user_id != None)
        if status:
            query = query.where(User.friend_status == status)
        
        query = query.order_by(desc(User.last_message_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

friend_service = FriendService()

