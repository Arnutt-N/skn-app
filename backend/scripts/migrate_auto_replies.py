"""
Migration script to convert legacy auto_replies to intent_categories structure
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from app.models.auto_reply import AutoReply
from app.models.intent import IntentCategory, IntentKeyword, IntentResponse, MatchType, ReplyType

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/skn_db")

async def migrate_auto_replies():
    """Migrate auto_replies to intent_categories structure"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Fetch all auto_replies
            result = await session.execute(select(AutoReply))
            auto_replies = result.scalars().all()
            
            print(f"\n🔍 Found {len(auto_replies)} auto-replies to migrate\n")
            
            migrated_count = 0
            
            for idx, auto_reply in enumerate(auto_replies, 1):
                print(f"📦 [{idx}/{len(auto_replies)}] Migrating: {auto_reply.keyword}")
                
                # Create individual category for each auto_reply
                category = IntentCategory(
                    name=f"{auto_reply.keyword}",
                    description=f"Migrated from auto_reply ID {auto_reply.id}",
                    is_active=auto_reply.is_active
                )
                session.add(category)
                await session.flush()  # Get the ID
                
                # Create keyword
                keyword = IntentKeyword(
                    category_id=category.id,
                    keyword=auto_reply.keyword,
                    match_type=MatchType(auto_reply.match_type) if auto_reply.match_type else MatchType.CONTAINS
                )
                session.add(keyword)
                
                # Create response
                response = IntentResponse(
                    category_id=category.id,
                    reply_type=ReplyType(auto_reply.reply_type) if auto_reply.reply_type else ReplyType.TEXT,
                    text_content=auto_reply.text_content,
                    payload=auto_reply.payload,
                    is_active=auto_reply.is_active
                )
                session.add(response)
                
                migrated_count += 1
            
            # Commit all changes
            await session.commit()
            
            print(f"\n✅ Migration complete! Migrated {migrated_count} auto-replies")
            print(f"📁 Created category: '{default_category.name}' (ID: {default_category.id})")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    print("🚀 Starting auto-reply migration...\n")
    asyncio.run(migrate_auto_replies())
