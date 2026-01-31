#!/bin/bash
# Stop any existing servers
pkill -f uvicorn

# Navigate to backend
cd /home/arnutt-n/projects/skn-app/backend

# Activate venv
source venv_linux/bin/activate

# Install dependencies just in case
pip install -r requirements.txt

# Ensure PYTHONPATH
export PYTHONPATH=.

# Verify Database Connection & Tables
echo "Verifying Database..."
python3 -c "import asyncio; from app.db.session import engine; from sqlalchemy import text; 
async def check():
    async with engine.begin() as conn:
        await conn.execute(text('SELECT 1 FROM chat_sessions LIMIT 1'))
        print('✅ Database connection successful and chat_sessions table exists.')
asyncio.run(check())"

# Start Server
echo "Starting Uvicorn..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
