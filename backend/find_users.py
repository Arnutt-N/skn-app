import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

try:
    db_url_str = str(settings.DATABASE_URL)
except:
    db_url_str = ""

DATABASE_URL = db_url_str.replace("postgresql://", "postgresql+asyncpg://")

async def list_users():
    print(f"Connecting to DB...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id, username, role FROM users LIMIT 10"))
        rows = result.fetchall()
        print("--- USERS ---")
        for r in rows:
            print(f"ID: {r.id}, Username: {r.username}, Role: {r.role}")
            
    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(list_users())
    except Exception as e:
        print(f"Error: {e}")
