import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.intent import IntentCategory, IntentKeyword, IntentResponse, MatchType
from app.models.auto_reply import AutoReply
from sqlalchemy import select, func, literal
from sqlalchemy.orm import selectinload

async def test_keyword_logic(user_text):
    print(f"\n--- Testing User Text: '{user_text}' ---")
    async with AsyncSessionLocal() as db:
        # 1. Exact Match Check
        stmt = select(IntentKeyword).options(
            selectinload(IntentKeyword.category)
        ).filter(
            IntentKeyword.keyword == user_text,
            IntentKeyword.match_type == MatchType.EXACT
        )
        result = await db.execute(stmt)
        match = result.scalars().first()
        
        if match:
            print(f"✅ EXACT MATCH Found: Keyword='{match.keyword}' -> Category='{match.category.name}'")
            return

        # 2. Updated Contains Logic Check
        # User Text: "ขอราคาหน่อย" -> Contains "ราคา"
        print("   Checking CONTAINS match...")
        stmt = select(IntentKeyword).options(
            selectinload(IntentKeyword.category)
        ).filter(
            literal(user_text).ilike(func.concat('%', IntentKeyword.keyword, '%')),
            IntentKeyword.match_type == MatchType.CONTAINS
        ).limit(1)
        result = await db.execute(stmt)
        match = result.scalars().first()

        if match:
            print(f"✅ CONTAINS MATCH Found: Keyword='{match.keyword}' (in user text) -> Category='{match.category.name}'")
            return
            
        print("❌ NO MATCH found in Intent system.")

async def main():
    # Test Cases
    await test_keyword_logic("สวัสดี")         # Expected: Exact or Contains "สวัสดี"
    await test_keyword_logic("ขอสวัสดีครับ")    # Expected: Contains "สวัสดี"
    await test_keyword_logic("ราคาเท่าไหร่")    # Expected: Contains "ราคา" (if exists)
    await test_keyword_logic("test")           # Random

if __name__ == "__main__":
    asyncio.run(main())
