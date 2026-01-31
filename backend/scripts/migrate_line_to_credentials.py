"""
Migration script to move LINE credentials from system_settings/env to credentials table.
Run once during deployment.

Usage:
    cd backend
    python -m scripts.migrate_line_to_credentials
"""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.credential import Credential, Provider
from app.models.system_setting import SystemSetting
from app.services.credential_service import credential_service
from app.core.config import settings


async def migrate():
    async with AsyncSessionLocal() as db:
        # Check if already migrated
        existing = await credential_service.get_default_credential(Provider.LINE, db)
        if existing:
            print("LINE credential already exists in credentials table. Skipping.")
            return

        # Try to get from system_settings first
        token_result = await db.execute(
            select(SystemSetting.value).where(SystemSetting.key == "LINE_CHANNEL_ACCESS_TOKEN")
        )
        db_token = token_result.scalar_one_or_none()

        secret_result = await db.execute(
            select(SystemSetting.value).where(SystemSetting.key == "LINE_CHANNEL_SECRET")
        )
        db_secret = secret_result.scalar_one_or_none()

        # Fallback to env
        access_token = db_token or settings.LINE_CHANNEL_ACCESS_TOKEN
        channel_secret = db_secret or settings.LINE_CHANNEL_SECRET

        if not access_token or not channel_secret:
            print("No LINE credentials found to migrate.")
            return

        # Create credential
        encrypted = credential_service.encrypt_credentials({
            "channel_access_token": access_token,
            "channel_secret": channel_secret
        })

        credential = Credential(
            name="Main LINE OA",
            provider=Provider.LINE,
            credentials=encrypted,
            metadata_json={
                "channel_id": getattr(settings, "LINE_CHANNEL_ID", ""),
                "liff_id": getattr(settings, "LIFF_ID", "")
            },
            is_active=True,
            is_default=True
        )
        db.add(credential)
        await db.commit()
        print("LINE credentials migrated successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
