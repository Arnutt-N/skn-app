
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

# Force using asyncpg
try:
    # Try getting the string directly or from the object
    db_url_str = str(settings.DATABASE_URL)
except:
    db_url_str = ""

DATABASE_URL = db_url_str.replace("postgresql://", "postgresql+asyncpg://")

async def fix_database():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Checking 'request_comments' table...")
        
        # Check if table exists
        result = await conn.execute(text("SELECT to_regclass('public.request_comments')"))
        table_exists = result.scalar()
        
        if not table_exists:
            print("❌ Table 'request_comments' missing. Creating now...")
            await conn.execute(text("""
                CREATE TABLE request_comments (
                    id SERIAL PRIMARY KEY,
                    request_id INTEGER REFERENCES service_requests(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id),
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX ix_request_comments_id ON request_comments (id);
                CREATE INDEX ix_request_comments_request_id ON request_comments (request_id);
                CREATE INDEX ix_request_comments_user_id ON request_comments (user_id);
            """))
            print("✅ Table created successfully.")
        else:
            print("✅ Table 'request_comments' exists. Checking columns...")
            # Check for updated_at column
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='request_comments' AND column_name='updated_at'
            """))
            if not result.scalar():
                print("❌ Column 'updated_at' missing. Adding now...")
                await conn.execute(text("ALTER TABLE request_comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
                print("✅ Column added.")
            else:
                print("✅ Column 'updated_at' already exists.")

    await engine.dispose()
    print("Optimization Complete.")

if __name__ == "__main__":
    try:
        asyncio.run(fix_database())
    except Exception as e:
        print(f"Error: {e}")
