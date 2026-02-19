import asyncio
from app.db.session import async_session
from app.services.settings_service import SettingsService
from app.models.system_setting import SystemSetting
from sqlalchemy import select

async def main():
    async with async_session() as db:
        print("Checking DB for LINE_CHANNEL_ACCESS_TOKEN...")
        query = select(SystemSetting).where(SystemSetting.key == "LINE_CHANNEL_ACCESS_TOKEN")
        result = await db.execute(query)
        setting = result.scalar_one_or_none()
        
        if setting:
            print(f"Found in DB: id={setting.id}, key='{setting.key}', value='{setting.value}'")
        else:
            print("Not found in DB.")
            
        print("-" * 20)
        
        token = await SettingsService.get_setting(db, "LINE_CHANNEL_ACCESS_TOKEN")
        print(f"SettingsService.get_setting returns: '{token}'")

if __name__ == "__main__":
    asyncio.run(main())
