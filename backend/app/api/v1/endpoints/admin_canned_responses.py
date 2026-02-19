"""Admin canned responses API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.services.canned_response_service import canned_response_service

router = APIRouter()


class CannedResponseCreate(BaseModel):
    shortcut: str
    title: str
    content: str
    category: str = "info"


class CannedResponseUpdate(BaseModel):
    shortcut: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


@router.get("")
async def list_canned_responses(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List all active canned responses."""
    items = await canned_response_service.get_all(db, category=category)
    return {
        "items": [
            {
                "id": r.id,
                "shortcut": r.shortcut,
                "title": r.title,
                "content": r.content,
                "category": r.category,
                "usage_count": r.usage_count,
            }
            for r in items
        ],
        "total": len(items)
    }


@router.post("")
async def create_canned_response(
    data: CannedResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new canned response."""
    existing = await canned_response_service.get_by_shortcut(data.shortcut, db)
    if existing:
        raise HTTPException(status_code=409, detail=f"Shortcut '{data.shortcut}' already exists")

    response = await canned_response_service.create(
        {**data.model_dump(), "created_by": current_user.id},
        db
    )
    return {
        "id": response.id,
        "shortcut": response.shortcut,
        "title": response.title,
        "content": response.content,
        "category": response.category,
    }


@router.put("/{response_id}")
async def update_canned_response(
    response_id: int,
    data: CannedResponseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a canned response."""
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = await canned_response_service.update(response_id, update_data, db)
    if not response:
        raise HTTPException(status_code=404, detail="Canned response not found")

    return {
        "id": response.id,
        "shortcut": response.shortcut,
        "title": response.title,
        "content": response.content,
        "category": response.category,
    }


@router.delete("/{response_id}")
async def delete_canned_response(
    response_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Soft-delete a canned response."""
    deleted = await canned_response_service.delete(response_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Canned response not found")
    return {"status": "deleted", "id": response_id}
