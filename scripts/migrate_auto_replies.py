import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import select
from app.db.session import engine, AsyncSessionLocal
from app.models.auto_reply import AutoReply
from app.models.intent import IntentCategory, IntentKeyword, IntentResponse

async def migrate_data():
    print("Migrating AutoReply data to new structure...")
    async with AsyncSessionLocal() as db:
        # Fetch all existing AutoReplies
        result = await db.execute(select(AutoReply))
        legacy_rules = result.scalars().all()
        
        for rule in legacy_rules:
            # Check if category already exists (using keyword as name)
            # In a flat migration, we just create 1 category per rule for now
            category_name = f"Refactored: {rule.keyword}"
            
            # Simple check if already exists to avoid duplicates if rerun
            cat_result = await db.execute(select(IntentCategory).filter(IntentCategory.name == category_name))
            category = cat_result.scalars().first()
            
            if not category:
                category = IntentCategory(
                    name=category_name,
                    description=f"Migrated from AutoReply: {rule.keyword}",
                    is_active=rule.is_active
                )
                db.add(category)
                await db.flush() # Get category.id
                
                # Create Keyword
                keyword = IntentKeyword(
                    category_id=category.id,
                    keyword=rule.keyword,
                    match_type=rule.match_type.value if hasattr(rule.match_type, 'value') else rule.match_type
                )
                db.add(keyword)
                
                # Create Response
                response = IntentResponse(
                    category_id=category.id,
                    reply_type=rule.reply_type.value if hasattr(rule.reply_type, 'value') else rule.reply_type,
                    text_content=rule.text_content,
                    media_id=rule.media_id,
                    payload=rule.payload,
                    is_active=rule.is_active
                )
                db.add(response)
                
        await db.commit()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_data())
