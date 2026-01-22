import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
import sys

async def verify_schema():
    output = []
    try:
        async with AsyncSessionLocal() as db:
            # Check service_requests columns
            result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='service_requests'"))
            columns = [r[0] for r in result.fetchall()]
            output.append(f"service_requests columns: {columns}")
            
            new_columns = ['priority', 'due_date', 'completed_at', 'assigned_by_id']
            for col in new_columns:
                if col in columns:
                    output.append(f"✅ Column '{col}' exists.")
                else:
                    output.append(f"❌ Column '{col}' is MISSING.")
            
            # Check request_comments table
            result = await db.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_name='request_comments'"))
            if result.scalar() > 0:
                output.append("✅ Table 'request_comments' exists.")
            else:
                output.append("❌ Table 'request_comments' is MISSING.")
                
    except Exception as e:
        output.append(f"❌ Error during verification: {e}")
    
    print("\n".join(output))

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_schema())
