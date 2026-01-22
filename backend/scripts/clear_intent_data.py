"""Clear all intent data before re-migration"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def clear_intent_data():
    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/skn_db")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(db_url)
    try:
        await conn.execute("DELETE FROM intent_responses")
        await conn.execute("DELETE FROM intent_keywords")
        await conn.execute("DELETE FROM intent_categories")
        print("✅ Cleared all intent data!")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(clear_intent_data())
