import asyncio
from sqlalchemy import text
import sys
sys.path.insert(0, '.')
from app.db.session import engine

async def create_table():
    async with engine.begin() as conn:
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR NOT NULL UNIQUE,
                value TEXT,
                description VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        '''))
        await conn.execute(text('CREATE INDEX IF NOT EXISTS ix_system_settings_key ON system_settings (key)'))
        print('Table created successfully!')

if __name__ == "__main__":
    asyncio.run(create_table())
