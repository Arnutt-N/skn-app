import asyncio
import sys
import os
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal

async def upgrade_schema():
    print("🚀 Starting Manual Schema Migration (v3)...")
    async with AsyncSessionLocal() as db:
        try:
            # List of new columns and their types
            new_columns = [
                ("province", "VARCHAR")
            ]
            
            for col_name, col_type in new_columns:
                print(f"Checking column '{col_name}'...")
                # Check if column exists
                check_stmt = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='service_requests' AND column_name='{col_name}';
                """)
                result = await db.execute(check_stmt)
                if not result.scalar():
                    print(f"➕ Adding column: {col_name} ({col_type})")
                    alter_stmt = text(f"ALTER TABLE service_requests ADD COLUMN {col_name} {col_type};")
                    await db.execute(alter_stmt)
                else:
                    print(f"✅ Column '{col_name}' already exists.")
            
            await db.commit()
            print("🎉 Migration v3 Completed Successfully!")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(upgrade_schema())
