import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def update_db():
    async with AsyncSessionLocal() as db:
        print("Checking service_requests table...")
        
        # 1. Check if table exists
        result = await db.execute(text("SELECT to_regclass('public.service_requests')"))
        table_exists = result.scalar()
        
        if not table_exists:
            print("Creating table 'service_requests'...")
            # Simple creation based on current model (simplified)
            # We use raw SQL to be sure, adapting from the model definition
            sql = """
            CREATE TABLE IF NOT EXISTS service_requests (
                id SERIAL PRIMARY KEY,
                requester_id INTEGER,
                line_user_id VARCHAR,
                requester_name VARCHAR,
                phone_number VARCHAR,
                email VARCHAR,
                agency VARCHAR,
                location JSONB DEFAULT '{}',
                category VARCHAR,
                subcategory VARCHAR,
                description TEXT,
                details JSONB DEFAULT '{}',
                status VARCHAR DEFAULT 'PENDING',
                assigned_agent_id INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS ix_service_requests_id ON service_requests (id);
            CREATE INDEX IF NOT EXISTS ix_service_requests_line_user_id ON service_requests (line_user_id);
            CREATE INDEX IF NOT EXISTS ix_service_requests_status ON service_requests (status);
            CREATE INDEX IF NOT EXISTS ix_service_requests_category ON service_requests (category);
            """
            await db.execute(text(sql))
            await db.commit()
            print("Table created.")
        else:
            print("Table exists. Checking for 'line_user_id' column...")
            # 2. Check column
            try:
                await db.execute(text("SELECT line_user_id FROM service_requests LIMIT 1"))
                print("Column 'line_user_id' already exists.")
            except Exception:
                print("Adding column 'line_user_id'...")
                await db.rollback() # Clear error state
                await db.execute(text("ALTER TABLE service_requests ADD COLUMN line_user_id VARCHAR"))
                await db.execute(text("CREATE INDEX ix_service_requests_line_user_id ON service_requests (line_user_id)"))
                await db.commit()
                print("Column added.")

if __name__ == "__main__":
    asyncio.run(update_db())
