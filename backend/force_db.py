import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect(user='postgres', password='postgres', database='skn_app', host='127.0.0.1')
    try:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS ix_system_settings_key ON system_settings (key);')
        print("Success: system_settings table created/verified.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run())
