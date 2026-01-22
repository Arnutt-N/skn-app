import sys
import os
import asyncio
from sqlalchemy import text

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

try:
    from app.db.session import async_session
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def add_enum_value():
    print("Starting DB update...")
    async with async_session() as session:
        try:
            print("Executing SQL...")
            await session.execute(text("ALTER TYPE requeststatus ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';"))
            await session.commit()
            print("Successfully added 'AWAITING_APPROVAL' to requeststatus enum in database.")
        except Exception as e:
            print(f"Error executing SQL: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(add_enum_value())
