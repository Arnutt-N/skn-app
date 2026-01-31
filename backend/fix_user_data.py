
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def fix_data():
    async with engine.begin() as conn:
        print("Fixing NULL values in users table...")
        await conn.execute(text("UPDATE users SET chat_mode = 'BOT' WHERE chat_mode IS NULL"))
        await conn.execute(text("UPDATE users SET friend_status = 'ACTIVE' WHERE friend_status IS NULL"))
        print("Data fix complete.")

if __name__ == "__main__":
    asyncio.run(fix_data())
