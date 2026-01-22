import asyncio
import sys
import os
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal

async def create_tables():
    print("🚀 Creating Geography Tables...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Provinces
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS provinces (
                    id INTEGER PRIMARY KEY,
                    name_th VARCHAR NOT NULL,
                    name_en VARCHAR
                );
            """))
            
            # 2. Districts
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS districts (
                    id INTEGER PRIMARY KEY,
                    province_id INTEGER REFERENCES provinces(id),
                    name_th VARCHAR NOT NULL,
                    name_en VARCHAR,
                    code VARCHAR
                );
            """))
            
            # 3. SubDistricts
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS sub_districts (
                    id INTEGER PRIMARY KEY,
                    district_id INTEGER REFERENCES districts(id),
                    name_th VARCHAR NOT NULL,
                    name_en VARCHAR,
                    postal_code VARCHAR,
                    latitude FLOAT,
                    longitude FLOAT
                );
            """))
            
            await db.commit()
            print("✅ Geography tables created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_tables())
