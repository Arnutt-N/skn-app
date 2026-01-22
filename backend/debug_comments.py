
import asyncio
import sys
import os
import httpx
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

# Override DB URL for WSL
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async def check_db():
    print("--- Checking Database ---")
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            # Check tables
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Tables found: {tables}")
            
            if 'request_comments' in tables:
                print("✅ Table 'request_comments' EXISTS.")
                # Check columns
                cols = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='request_comments'"))
                columns = [row[0] for row in cols.fetchall()]
                print(f"Columns in 'request_comments': {columns}")
            else:
                print("❌ Table 'request_comments' MISSING!")

            # Check request 9
            req = await conn.execute(text("SELECT id FROM service_requests WHERE id=9"))
            if req.scalar():
                print("✅ Service Request ID 9 EXISTS.")
            else:
                print("⚠️ Service Request ID 9 NOT FOUND.")

    except Exception as e:
        print(f"❌ Database Error: {e}")

async def check_api():
    print("\n--- Checking API ---")
    url = "http://localhost:8000/api/v1/admin/requests/9/comments"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            print(f"Status Code: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"❌ API Error: {e}")

async def main():
    await check_db()
    await check_api()

if __name__ == "__main__":
    # Ensure allow async
    asyncio.run(main())
