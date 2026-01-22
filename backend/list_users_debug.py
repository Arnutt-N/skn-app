import asyncio
from sqlalchemy import text
from app.db.session import async_session

async def list_users():
    async with async_session() as session:
        result = await session.execute(text("SELECT id, username, role FROM users"))
        users = result.fetchall()
        print("Existing Users:")
        for u in users:
            print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
