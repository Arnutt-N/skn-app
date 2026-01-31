from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Optional
from app.api import deps
from app.services.live_chat_service import live_chat_service
from app.schemas.live_chat import (
    ConversationList, ConversationDetail,
    SendMessageRequest, ModeToggleRequest
)
from app.models.chat_session import ClosedBy

router = APIRouter()

@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    status: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """List all conversations for inbox"""
    return await live_chat_service.get_conversations(status, db)

@router.get("/conversations/{line_user_id}", response_model=ConversationDetail)
async def get_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get full chat history with a user"""
    detail = await live_chat_service.get_conversation_detail(line_user_id, db)
    if not detail:
        raise HTTPException(status_code=404, detail="User not found")
    return detail

@router.post("/conversations/{line_user_id}/messages")
async def send_message(
    line_user_id: str,
    request: SendMessageRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Send message to user via LINE"""
    if not request.text:
        raise HTTPException(status_code=400, detail="Message text is required")
        
    # Mock operator ID as 1 (Admin) for now since we removed auth
    return await live_chat_service.send_message(
        line_user_id, request.text, 1, db
    )

@router.post("/conversations/{line_user_id}/claim")
async def claim_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Operator claims the chat session"""
    # Mock operator ID as 1 (Admin)
    session = await live_chat_service.claim_session(
        line_user_id, 1, db
    )
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    return session

@router.post("/conversations/{line_user_id}/close")
async def close_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Close session and return to bot mode"""
    session = await live_chat_service.close_session(
        line_user_id, ClosedBy.OPERATOR, db
    )
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    return session

@router.post("/conversations/{line_user_id}/mode")
async def toggle_mode(
    line_user_id: str,
    request: ModeToggleRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Toggle chat mode: BOT | HUMAN"""
    success = await live_chat_service.set_chat_mode(
        line_user_id, request.mode, db
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "mode": request.mode}

@router.get("/analytics")
async def get_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get chat analytics dashboard data"""
    return await live_chat_service.get_analytics(
        from_date, to_date, operator_id, db
    )

@router.get("/analytics/operators")
async def get_operator_stats(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get per-operator performance metrics"""
    return await live_chat_service.get_operator_analytics(
        from_date, to_date, db
    )
