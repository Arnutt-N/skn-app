"""Fix alembic version in database"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_alembic():
    # Get database URL
    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/skn_db")
    # Convert to asyncpg format
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(db_url)
    try:
        # Update alembic_version table
        await conn.execute("UPDATE alembic_version SET version_num = 'cd2257cee794'")
        print("✅ Fixed alembic version to cd2257cee794")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_alembic())
