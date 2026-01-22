from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.service_request import ServiceRequest, RequestStatus
from pydantic import BaseModel

router = APIRouter()

class UserWorkload(BaseModel):
    id: int
    display_name: Optional[str] = None
    role: UserRole
    active_tasks: int # Pending + In Progress
    pending_tasks: int
    in_progress_tasks: int

@router.get("", response_model=List[UserWorkload])
async def list_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List users with their current workload statistics."""
    
    # 1. Base Query
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
        
    if search:
        query = query.where(
            or_(
                User.display_name.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%")
            )
        )
        
    result = await db.execute(query)
    users = result.scalars().all()
    
    # 2. Compute Workload
    # Note: In a larger scale system, this should be an optimized localized query or view.
    user_workloads = []
    
    for user in users:
        # Count tasks assigned to this user
        stats_query = select(
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.PENDING).label("pending"),
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress")
        ).where(ServiceRequest.assigned_agent_id == user.id)
        
        stats_res = await db.execute(stats_query)
        stats = stats_res.one()
        
        user_workloads.append(UserWorkload(
            id=user.id,
            display_name=user.display_name or user.username,
            role=user.role,
            active_tasks=stats.pending + stats.in_progress,
            pending_tasks=stats.pending,
            in_progress_tasks=stats.in_progress
        ))
        
    # Sort by active tasks (least busy first)
    user_workloads.sort(key=lambda x: x.active_tasks)
    
    return user_workloads
