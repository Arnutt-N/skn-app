import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
import sys

async def verify():
    output = []
    try:
        async with AsyncSessionLocal() as db:
            # Check Tables
            result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [r[0] for r in result.fetchall()]
            output.append(f"Tables found: {tables}")
            
            # Check Auto Replies
            if 'auto_replies' in tables:
                count = await db.execute(text("SELECT count(*) FROM auto_replies"))
                output.append(f"Auto Replies: {count.scalar()} rows")
            else:
                output.append("❌ Table 'auto_replies' NOT found.")

            # Check Media Files
            if 'media_files' in tables:
                count = await db.execute(text("SELECT count(*) FROM media_files"))
                output.append(f"Media Files: {count.scalar()} rows")
                
    except Exception as e:
        output.append(f"❌ Error: {e}")
    
    with open("verification.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify())
