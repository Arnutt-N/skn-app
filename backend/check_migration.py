import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_table():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT to_regclass('public.friend_events');"))
        table_exists = result.scalar()
        print(f"Table 'friend_events' exists: {table_exists is not None}")

if __name__ == "__main__":
    import sys
    import os
    # Add project root to path
    sys.path.append(os.getcwd())
    asyncio.run(check_table())
