from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any, Optional
import httpx
from app.models.rich_menu import RichMenu, RichMenuStatus
from app.services.settings_service import SettingsService
import os

class RichMenuService:
    API_BASE = "https://api.line.me/v2/bot"
    DATA_API_BASE = "https://api-data.line.me/v2/bot"

    @staticmethod
    async def get_client_headers(db: AsyncSession) -> Dict[str, str]:
        token = await SettingsService.get_setting(db, "LINE_CHANNEL_ACCESS_TOKEN")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @staticmethod
    async def create_on_line(db: AsyncSession, rich_menu_config: Dict[str, Any]) -> str:
        headers = await RichMenuService.get_client_headers(db)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{RichMenuService.API_BASE}/richmenu",
                headers=headers,
                json=rich_menu_config
            )
            response.raise_for_status()
            return response.json()["richMenuId"]

    @staticmethod
    async def upload_image_to_line(db: AsyncSession, line_rich_menu_id: str, image_bytes: bytes, content_type: str):
        headers = await RichMenuService.get_client_headers(db)
        headers["Content-Type"] = content_type
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{RichMenuService.DATA_API_BASE}/richmenu/{line_rich_menu_id}/content",
                headers=headers,
                content=image_bytes
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def set_default_on_line(db: AsyncSession, line_rich_menu_id: str):
        headers = await RichMenuService.get_client_headers(db)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{RichMenuService.API_BASE}/user/all/richmenu/{line_rich_menu_id}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def delete_from_line(db: AsyncSession, line_rich_menu_id: str):
        headers = await RichMenuService.get_client_headers(db)
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{RichMenuService.API_BASE}/richmenu/{line_rich_menu_id}",
                headers=headers
            )
            # 404 is acceptable if already deleted on LINE
            if response.status_code != 404:
                response.raise_for_status()
            return response.status_code

    @staticmethod
    async def list_from_line(db: AsyncSession) -> List[Dict[str, Any]]:
        headers = await RichMenuService.get_client_headers(db)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{RichMenuService.API_BASE}/richmenu/list",
                headers=headers
            )
            response.raise_for_status()
            return response.json().get("richmenus", [])
