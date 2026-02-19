from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Optional
from app.api import deps
from app.services.live_chat_service import live_chat_service
from app.schemas.live_chat import (
    ConversationList, ConversationDetail,
    SendMessageRequest, ModeToggleRequest
)
from app.models.chat_session import ClosedBy
from app.models.user import User
from app.core.websocket_manager import ws_manager
from app.schemas.ws_events import WSEventType
from app.services.analytics_service import analytics_service
from app.services.friend_service import friend_service
from datetime import datetime

router = APIRouter()

@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    status: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """List all conversations for inbox"""
    return await live_chat_service.get_conversations(status, db, admin_id=current_user.id)

@router.get("/conversations/{line_user_id}", response_model=ConversationDetail)
async def get_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Get full chat history with a user"""
    await ws_manager.mark_conversation_read(str(current_user.id), line_user_id)
    detail = await live_chat_service.get_conversation_detail(line_user_id, db)
    if not detail:
        raise HTTPException(status_code=404, detail="User not found")
    return detail

@router.get("/conversations/{line_user_id}/messages")
async def get_conversation_messages(
    line_user_id: str,
    before_id: Optional[int] = None,
    limit: int = 50,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Get paginated conversation messages with cursor-based pagination."""
    return await live_chat_service.get_messages_paginated(
        line_user_id=line_user_id,
        before_id=before_id,
        limit=limit,
        db=db,
    )

@router.post("/conversations/{line_user_id}/messages")
async def send_message(
    line_user_id: str,
    request: SendMessageRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Send message to user via LINE"""
    if not request.text:
        raise HTTPException(status_code=400, detail="Message text is required")

    result = await live_chat_service.send_message(
        line_user_id, request.text, current_user.id, db
    )
    await db.commit()
    return result

@router.post("/conversations/{line_user_id}/media")
async def send_media(
    line_user_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Upload and send media message to user via LINE."""
    content = await file.read()
    result = await live_chat_service.send_media_message(
        line_user_id=line_user_id,
        operator_id=current_user.id,
        file_bytes=content,
        file_name=file.filename or "attachment",
        content_type=file.content_type,
        db=db,
    )
    await db.commit()
    sent_message = result.get("message", {})
    created_at = sent_message.get("created_at") or datetime.utcnow().isoformat()

    room_id = ws_manager.get_room_id(line_user_id)
    await ws_manager.broadcast_to_room(room_id, {
        "type": WSEventType.NEW_MESSAGE.value,
        "payload": sent_message,
        "timestamp": datetime.utcnow().isoformat(),
    })

    detail = await live_chat_service.get_conversation_detail(line_user_id, db)
    display_name = detail["display_name"] if detail else "LINE User"
    picture_url = detail["picture_url"] if detail else None
    chat_mode = detail["chat_mode"].value if detail and hasattr(detail["chat_mode"], "value") else (detail["chat_mode"] if detail else "BOT")

    try:
        read_marker = datetime.fromisoformat(created_at) if isinstance(created_at, str) else datetime.utcnow()
    except ValueError:
        read_marker = datetime.utcnow()

    for admin_id in ws_manager.get_connected_admin_ids():
        if await ws_manager.is_admin_in_room_global(admin_id, room_id):
            await ws_manager.mark_conversation_read(
                admin_id,
                line_user_id,
                read_marker,
            )
            unread_count = 0
        else:
            unread_count = await live_chat_service.get_unread_count(
                line_user_id=line_user_id,
                admin_id=admin_id,
                db=db,
            )

        await ws_manager.send_to_admin(admin_id, {
            "type": WSEventType.CONVERSATION_UPDATE.value,
            "payload": {
                "line_user_id": line_user_id,
                "display_name": display_name or "LINE User",
                "picture_url": picture_url,
                "chat_mode": chat_mode,
                "last_message": {
                    "content": sent_message.get("content") or "[Media]",
                    "created_at": created_at,
                },
                "unread_count": unread_count,
            },
            "timestamp": datetime.utcnow().isoformat(),
        })

    return result

@router.post("/conversations/{line_user_id}/claim")
async def claim_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Operator claims the chat session"""
    session = await live_chat_service.claim_session(
        line_user_id, current_user.id, db
    )
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    await db.commit()
    await analytics_service.emit_live_kpis_update(db)
    return session

@router.post("/conversations/{line_user_id}/close")
async def close_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Close session and return to bot mode"""
    session = await live_chat_service.close_session(
        line_user_id, ClosedBy.OPERATOR, db
    )
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    await db.commit()
    await analytics_service.emit_live_kpis_update(db)
    return session

@router.post("/conversations/{line_user_id}/mode")
async def toggle_mode(
    line_user_id: str,
    request: ModeToggleRequest,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Toggle chat mode: BOT | HUMAN"""
    success = await live_chat_service.set_chat_mode(
        line_user_id, request.mode, db
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    await db.commit()
    return {"success": True, "mode": request.mode}

@router.post("/conversations/{line_user_id}/refresh-profile")
async def refresh_profile(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Manually refresh LINE profile for a conversation user."""
    user = await friend_service.refresh_profile(
        line_user_id=line_user_id,
        db=db,
        force=True,
        stale_after_hours=24,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True,
        "line_user_id": line_user_id,
        "display_name": user.display_name,
        "picture_url": user.picture_url,
        "profile_updated_at": user.profile_updated_at.isoformat() if user.profile_updated_at else None,
    }

@router.get("/analytics")
async def get_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Get chat analytics dashboard data"""
    return await live_chat_service.get_analytics(
        from_date, to_date, operator_id, db
    )

@router.get("/analytics/operators")
async def get_operator_stats(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Get per-operator performance metrics"""
    return await live_chat_service.get_operator_analytics(
        from_date, to_date, db
    )

@router.get("/messages/search")
async def search_messages(
    q: str,
    line_user_id: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Search message text across conversations or within a specific conversation."""
    return {
        "items": await live_chat_service.search_messages(
            query=q,
            line_user_id=line_user_id,
            limit=limit,
            db=db,
        )
    }
