import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.models.user import UserRole
import time

try:
    db_url_str = str(settings.DATABASE_URL)
except:
    db_url_str = ""

DATABASE_URL = db_url_str.replace("postgresql://", "postgresql+asyncpg://")

async def create_admin_user():
    print(f"Connecting to DB to seed admin user...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Check if any user exists
        result = await conn.execute(text("SELECT count(*) FROM users"))
        count = result.scalar()
        
        if count == 0:
            print("No users found. Creating 'Admin Somyimg'...")
            # Insert Admin User
            # We use a simple insert for seeding
            await conn.execute(text("""
                INSERT INTO users (
                    line_user_id, 
                    username, 
                    display_name, 
                    role, 
                    is_active, 
                    hashed_password,
                    created_at,
                    updated_at
                ) VALUES (
                    'U_ADMIN_001', 
                    'admin', 
                    'Admin Somying', 
                    'ADMIN', 
                    true, 
                    'hashed_secret',
                    NOW(),
                    NOW()
                )
            """))
            print("✅ Admin User 'Admin Somying' created successfully.")
        else:
            print(f"✅ Users already exist ({count} found). No need to seed.")

    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(create_admin_user())
    except Exception as e:
        print(f"Error: {e}")
