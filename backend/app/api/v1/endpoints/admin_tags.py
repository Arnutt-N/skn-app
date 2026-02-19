from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.services.tag_service import tag_service

router = APIRouter()


class TagCreateRequest(BaseModel):
    name: str
    color: str = "#6366f1"


@router.get("")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_admin),
):
    tags = await tag_service.list_tags(db)
    return {"items": [{"id": t.id, "name": t.name, "color": t.color} for t in tags], "total": len(tags)}


@router.post("")
async def create_tag(
    payload: TagCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_admin),
):
    try:
        tag = await tag_service.create_tag(db, name=payload.name, color=payload.color)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"id": tag.id, "name": tag.name, "color": tag.color}


@router.post("/{tag_id}/users/{user_id}")
async def assign_tag_to_user(
    tag_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_admin),
):
    try:
        await tag_service.assign_tag_to_user(db, user_id=user_id, tag_id=tag_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "assigned", "tag_id": tag_id, "user_id": user_id}


@router.delete("/{tag_id}/users/{user_id}")
async def remove_tag_from_user(
    tag_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_admin),
):
    removed = await tag_service.remove_tag_from_user(db, user_id=user_id, tag_id=tag_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Tag assignment not found")
    return {"status": "removed", "tag_id": tag_id, "user_id": user_id}


@router.get("/users/{user_id}")
async def list_user_tags(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_admin),
):
    tags = await tag_service.list_user_tags(db, user_id=user_id)
    return {"items": [{"id": t.id, "name": t.name, "color": t.color} for t in tags], "total": len(tags)}
