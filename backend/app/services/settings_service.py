from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.system_setting import SystemSetting
from app.core.config import settings

class SettingsService:
    @staticmethod
    async def get_setting(db: AsyncSession, key: str, default: str = "") -> str:
        query = select(SystemSetting.value).where(SystemSetting.key == key)
        result = await db.execute(query)
        db_value = result.scalar_one_or_none()
        
        if db_value is not None:
            return db_value
            
        # Fallback to env
        return getattr(settings, key, default)

    @staticmethod
    async def set_setting(db: AsyncSession, key: str, value: str, description: str = None) -> SystemSetting:
        query = select(SystemSetting).where(SystemSetting.key == key)
        result = await db.execute(query)
        db_setting = result.scalar_one_or_none()
        
        if db_setting:
            db_setting.value = value
            if description:
                db_setting.description = description
        else:
            db_setting = SystemSetting(key=key, value=value, description=description)
            db.add(db_setting)
            
        await db.commit()
        await db.refresh(db_setting)
        return db_setting
