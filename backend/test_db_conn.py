import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
import sys

async def test_conn():
    print("Testing DB connection...")
    try:
        async with AsyncSessionLocal() as db:
            # Use a short timeout at the engine level if possible, or just a simple query
            await asyncio.wait_for(db.execute(text("SELECT 1")), timeout=5.0)
            print("CONNECT_SUCCESS")
    except asyncio.TimeoutError:
        print("CONNECT_TIMEOUT")
    except Exception as e:
        print(f"CONNECT_ERROR: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_conn())
