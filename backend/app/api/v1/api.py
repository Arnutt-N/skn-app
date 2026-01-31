from fastapi import APIRouter

api_router = APIRouter()

from app.api.v1.endpoints import (
    webhook, 
    media, 
    admin_reply_objects, 
    admin_auto_replies,
    admin_intents,
    liff,
    locations,
    admin_requests,
    admin_users,
    rich_menus,
    settings,
    admin_live_chat,
    ws_live_chat
)

api_router.include_router(webhook.router, prefix="/line", tags=["line"])
api_router.include_router(media.router, tags=["media"])
api_router.include_router(liff.router, prefix="/liff", tags=["liff"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])

# Admin APIs (no auth for now)
api_router.include_router(admin_reply_objects.router, prefix="/admin/reply-objects", tags=["admin"])
api_router.include_router(admin_auto_replies.router, prefix="/admin/auto-replies", tags=["admin"]) # Legacy
api_router.include_router(admin_intents.router, prefix="/admin/intents", tags=["admin"])
api_router.include_router(admin_requests.router, prefix="/admin/requests", tags=["admin"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin"])
api_router.include_router(rich_menus.router, prefix="/admin/rich-menus", tags=["admin"])
api_router.include_router(settings.router, prefix="/admin/settings", tags=["admin"])
api_router.include_router(admin_live_chat.router, prefix="/admin/live-chat", tags=["admin"])
api_router.include_router(ws_live_chat.router, tags=["websocket"])

