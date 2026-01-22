import asyncio
from app.db.session import async_session
from sqlalchemy import text

async def add_enum_value():
    async with async_session() as session:
        try:
            # Check if value exists first to avoid error in transaction block if not using IF NOT EXISTS (which pg 12+ supports)
            # But ALTER TYPE ... ADD VALUE IF NOT EXISTS is safe on recent PG.
            await session.execute(text("ALTER TYPE requeststatus ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';"))
            await session.commit()
            print("Successfully added 'AWAITING_APPROVAL' to requeststatus enum in database.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(add_enum_value())
