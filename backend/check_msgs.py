import asyncio
import sys
import os

# Add backend to python path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models.message import Message
from sqlalchemy import select

async def main():
    print("Connecting to Database...")
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Message).order_by(Message.created_at.desc()).limit(10))
            messages = result.scalars().all()
            
            print(f"\n✅ Found {len(messages)} latest messages:\n")
            print("=" * 60)
            
            # Helper for Timezone
            import zoneinfo
            bangkok_tz = zoneinfo.ZoneInfo("Asia/Bangkok")
            
            for msg in messages:
                # Convert UTC to Bangkok Time
                local_time = msg.created_at.astimezone(bangkok_tz) if msg.created_at else "N/A"
                
                print(f"ID       : {msg.id}")
                print(f"User     : {msg.line_user_id}")
                print(f"Direction: {msg.direction} ({msg.message_type})")
                print(f"Content  : {msg.content}")
                print(f"Time (TH): {local_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
                print("-" * 60)
                
            if len(messages) == 0:
                print("No messages found yet. Try 'ping' the bot first!")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Windows specific fix for asyncio
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
