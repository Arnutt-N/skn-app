import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.base import Base
from app.db.session import engine
from app.models.intent import IntentCategory, IntentKeyword, IntentResponse

async def init_tables():
    print("Initializing new intent tables...")
    async with engine.begin() as conn:
        # This will create tables that do not exist yet
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(init_tables())
