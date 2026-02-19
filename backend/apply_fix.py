
import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.models.chat_session import ChatSession, SessionStatus
from app.models.friend_event import FriendEvent
from app.models.credential import Credential
from app.models.chat_analytics import ChatAnalytics
from app.db.base import Base

async def apply_schema():
    print("Checking database schema...")
    async with engine.begin() as conn:
        # 1. Create tables if not exist
        # This uses the metadata to create all tables defined in models
        from app.models import User, FriendEvent, ChatSession, ChatAnalytics, Credential
        await conn.run_sync(Base.metadata.create_all)
        
        # 2. Update users table if columns missing
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_status VARCHAR DEFAULT 'ACTIVE'"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_since TIMESTAMP WITH TIME ZONE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE"))
            print("Users table updated.")
        except Exception as e:
            print(f"Error updating users table: {e}")

        # 3. Handle Enum (ReplyType.HANDOFF)
        try:
            await conn.execute(text("ALTER TYPE replytype ADD VALUE IF NOT EXISTS 'HANDOFF'"))
            print("Enum ReplyType updated.")
        except Exception as e:
            print(f"Error updating enum: {e}")
            
    print("Schema check complete.")

if __name__ == "__main__":
    asyncio.run(apply_schema())
