#!/bin/bash
# Move to backend directory
cd "$(dirname "$0")"

echo "Initializing database table..."
# Use python to create the table properly with async support
source venv_linux/bin/activate
python3 << 'EOF'
import asyncio
import asyncpg

async def run():
    try:
        conn = await asyncpg.connect(user='postgres', password='postgres', database='skn_app', host='127.0.0.1')
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
        print("Success: system_settings table initialized.")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
EOF

echo "Checking backend status..."
# Try to reach the backend
curl -s http://localhost:8000/api/v1/admin/rich-menus | grep -q "id" && echo "Backend is ONLINE" || echo "Backend is OFFLINE or erroring"
