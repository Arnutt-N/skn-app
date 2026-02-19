import asyncio
import sys
import os

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.services.credential_service import credential_service
from app.models.credential import Provider, Credential
from app.core.config import settings
from sqlalchemy import select

async def migrate_line_credentials():
    print("Starting migration of LINE credentials...")
    async with SessionLocal() as db:
        # Check if already migrated
        result = await db.execute(
            select(Credential).where(Credential.provider == Provider.LINE)
        )
        existing = result.scalar_one_or_none()
        if existing:
            print("LINE credentials already exist in database. Skipping.")
            return

        # Read from settings
        if not settings.LINE_CHANNEL_SECRET or not settings.LINE_CHANNEL_ACCESS_TOKEN:
            print("No LINE credentials found in environment/settings. Skipping.")
            return

        line_creds = {
            "channel_secret": settings.LINE_CHANNEL_SECRET,
            "channel_access_token": settings.LINE_CHANNEL_ACCESS_TOKEN
        }

        # Metadata from settings
        # Note: We might have LINE_LOGIN_CHANNEL_ID but not LIFF_ID in config.py
        # Check config.py again
        
        metadata = {
            "channel_id": getattr(settings, "LINE_LOGIN_CHANNEL_ID", ""),
            "liff_id": getattr(settings, "LIFF_ID", "")
        }

        credential = Credential(
            name="Main LINE OA (Migrated)",
            provider=Provider.LINE,
            credentials=credential_service.encrypt_credentials(line_creds),
            metadata_json=metadata,
            is_active=True,
            is_default=True
        )
        
        db.add(credential)
        await db.commit()
        print(f"Successfully migrated LINE credentials. ID: {credential.id}")

if __name__ == "__main__":
    asyncio.run(migrate_line_credentials())
