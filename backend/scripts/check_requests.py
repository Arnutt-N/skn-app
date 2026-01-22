import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.service_request import ServiceRequest
from sqlalchemy import select, desc

async def check_requests():
    async with AsyncSessionLocal() as db:
        print("\n--- Checking Latest Service Requests ---")
        stmt = select(ServiceRequest).order_by(desc(ServiceRequest.created_at)).limit(5)
        result = await db.execute(stmt)
        requests = result.scalars().all()
        
        if not requests:
            print("❌ No requests found in database yet.")
        else:
            print(f"✅ Found {len(requests)} requests:")
            for req in requests:
                print(f"[{req.id}] Name: {req.requester_name}, Phone: {req.phone_number}, Type: {req.category}, LINE ID: {req.line_user_id}")

if __name__ == "__main__":
    asyncio.run(check_requests())
