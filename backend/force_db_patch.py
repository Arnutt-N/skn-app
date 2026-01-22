import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
import sys

async def patch_db():
    print("Starting database patch...")
    try:
        async with AsyncSessionLocal() as db:
            # 1. Create RequestPriority Type if not exists
            # Note: PostgreSQL Enum creation is a bit tricky with 'IF NOT EXISTS' in some versions
            # but we can check if it exists first.
            result = await db.execute(text("SELECT 1 FROM pg_type WHERE typname = 'requestpriority'"))
            if not result.scalar():
                print("Creating 'requestpriority' enum type...")
                # We need to run this outside of a transaction or ensure it's handled
                await db.execute(text("CREATE TYPE requestpriority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT')"))
                await db.commit()

            # 2. Add columns to service_requests
            print("Checking columns in 'service_requests'...")
            columns_to_add = [
                ("priority", "requestpriority DEFAULT 'MEDIUM'::requestpriority"),
                ("due_date", "TIMESTAMP WITH TIME ZONE"),
                ("completed_at", "TIMESTAMP WITH TIME ZONE"),
                ("assigned_by_id", "INTEGER REFERENCES users(id)")
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    await db.execute(text(f"ALTER TABLE service_requests ADD COLUMN {col_name} {col_type}"))
                    print(f"✅ Added column {col_name}")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"ℹ️ Column {col_name} already exists.")
                    else:
                        print(f"❌ Error adding {col_name}: {e}")
                await db.commit()

            # 3. Create request_comments table
            print("Creating 'request_comments' table if missing...")
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS request_comments (
                id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES service_requests(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            await db.execute(text(create_table_sql))
            print("✅ Handled 'request_comments' table.")
            await db.commit()

            print("Database patch completed successfully.")
            
    except Exception as e:
        print(f"❌ critical Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(patch_db())
