from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.service_request import ServiceRequest, RequestStatus
from app.schemas.service_request_liff import ServiceRequestResponse
from pydantic import BaseModel
from app.models.user import User

router = APIRouter()

class RequestStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    completed: int
    rejected: int

class StatusUpdate(BaseModel):
    status: RequestStatus
    assigned_agent_id: Optional[int] = None

@router.get("/stats", response_model=RequestStats)
async def get_request_stats(db: AsyncSession = Depends(get_db)):
    """Get summary statistics for admin dashboard."""
    query = select(
        func.count(ServiceRequest.id).label("total"),
        func.count(ServiceRequest.id).filter((ServiceRequest.status == RequestStatus.PENDING) | (ServiceRequest.status.is_(None))).label("pending"),
        func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress"),
        func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.COMPLETED).label("completed"),
        func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.REJECTED).label("rejected")
    )
    result = await db.execute(query)
    row = result.one()
    return RequestStats(**row._asdict())

class MonthlyStats(BaseModel):
    month: str
    count: int

@router.get("/stats/monthly", response_model=List[MonthlyStats])
async def get_monthly_stats(db: AsyncSession = Depends(get_db)):
    """Get request counts grouped by month (last 12 months)."""
    # Using text() for the order by to reference the alias
    from sqlalchemy import text
    month_expr = func.to_char(ServiceRequest.created_at, 'YYYY-MM')
    query = (
        select(
            month_expr.label('month'),
            func.count(ServiceRequest.id).label('count')
        )
        .group_by(month_expr)
        .order_by(text('month DESC'))
        .limit(12)
    )

    result = await db.execute(query)
    # Reverse to get chronological order (oldest to newest) for chart
    stats = [MonthlyStats(month=row.month, count=row.count) for row in result.all()]
    return stats[::-1]

class WorkloadStats(BaseModel):
    agent_name: str
    pending_count: int
    in_progress_count: int

@router.get("/stats/workload", response_model=List[WorkloadStats])
async def get_workload_stats(db: AsyncSession = Depends(get_db)):
    """Get workload distribution across agents."""
    query = (
        select(
            User.display_name.label("agent_name"),
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.PENDING).label("pending_count"),
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress_count")
        )
        .join(User, ServiceRequest.assigned_agent_id == User.id)
        .group_by(User.display_name)
    )
    result = await db.execute(query)
    return [WorkloadStats(**row._asdict()) for row in result.all()]

class PerformanceStats(BaseModel):
    avg_cycle_time_days: float
    on_time_percentage: float

@router.get("/stats/performance", response_model=PerformanceStats)
async def get_performance_stats(db: AsyncSession = Depends(get_db)):
    """Analyze agent performance."""
    # Simplified calculation for cycle time
    cycle_time_query = select(
        func.avg(
            func.extract('epoch', ServiceRequest.completed_at - ServiceRequest.created_at) / 86400
        ).label("avg_cycle_time_days")
    ).where(ServiceRequest.status == RequestStatus.COMPLETED)
    
    on_time_query = select(
        func.count(ServiceRequest.id).filter(ServiceRequest.completed_at <= ServiceRequest.due_date).label("on_time_count"),
        func.count(ServiceRequest.id).label("total_completed")
    ).where(ServiceRequest.status == RequestStatus.COMPLETED, ServiceRequest.due_date.isnot(None))

    ct_result = await db.execute(cycle_time_query)
    ot_result = await db.execute(on_time_query)
    
    ct_row = ct_result.one()
    ot_row = ot_result.one()
    
    avg_ct = ct_row.avg_cycle_time_days or 0.0
    total_ot = ot_row.total_completed or 1 # Avoid division by zero
    ot_percent = (ot_row.on_time_count / total_ot) * 100 if ot_row.total_completed else 100.0
    
    return PerformanceStats(avg_cycle_time_days=round(avg_ct, 2), on_time_percentage=round(ot_percent, 1))


@router.get("", response_model=List[ServiceRequestResponse])
async def list_requests(
    status: Optional[RequestStatus] = None,
    category: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by name, phone, or description"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all service requests with filtering and search."""
    # query = select(ServiceRequest).offset(skip).limit(limit).order_by(ServiceRequest.created_at.desc())
    
    # Use join to get assignee name
    query = (
        select(ServiceRequest, User.display_name.label("assignee_name"))
        .outerjoin(User, ServiceRequest.assigned_agent_id == User.id)
        .order_by(ServiceRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    if status:
        query = query.where(ServiceRequest.status == status)
    if category:
        query = query.where(ServiceRequest.topic_category == category)
    
    if search:
        search_filter = (
            (ServiceRequest.firstname.ilike(f"%{search}%")) |
            (ServiceRequest.lastname.ilike(f"%{search}%")) |
            (ServiceRequest.phone_number.ilike(f"%{search}%")) |
            (ServiceRequest.description.ilike(f"%{search}%"))
        )
        query = query.where(search_filter)
        
    result = await db.execute(query)
    
    # Manually construct response to include assignee_name
    requests = []
    for req, assignee_name in result.all():
        req_dict = ServiceRequestResponse.model_validate(req).model_dump()
        req_dict['assignee_name'] = assignee_name
        requests.append(req_dict)
        
    return requests


@router.get("/{request_id}", response_model=ServiceRequestResponse)
async def get_request_detail(request_id: int, db: AsyncSession = Depends(get_db)):
    """Get full details of a specific request."""
    result = await db.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

class RequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_agent_id: Optional[int] = None
    assigned_by_id: Optional[int] = None

@router.patch("/{request_id}", response_model=ServiceRequestResponse)
async def update_request(
    request_id: int, 
    update_data: RequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update request status, priority, due date or assign an agent."""
    query = select(ServiceRequest).where(ServiceRequest.id == request_id)
    result = await db.execute(query)
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update fields
    if update_data.status is not None:
        request.status = update_data.status
        if update_data.status == RequestStatus.COMPLETED:
            request.completed_at = func.now()
            
    if update_data.priority is not None:
        request.priority = update_data.priority
    if update_data.due_date is not None:
        request.due_date = update_data.due_date
    if update_data.assigned_agent_id is not None:
        request.assigned_agent_id = update_data.assigned_agent_id
    if update_data.assigned_by_id is not None:
        request.assigned_by_id = update_data.assigned_by_id
        
    await db.commit()
    await db.refresh(request)
    return request

@router.delete("/{request_id}", status_code=204)
async def delete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a service request permanently."""
    query = select(ServiceRequest).where(ServiceRequest.id == request_id)
    result = await db.execute(query)
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    await db.delete(request)
    await db.commit()
    return None

from app.schemas.service_request_liff import RequestCommentCreate, RequestCommentResponse

from app.models.request_comment import RequestComment

@router.post("/{request_id}/comments", response_model=RequestCommentResponse)
async def create_comment(
    request_id: int,
    comment_data: RequestCommentCreate,
    user_id: int = Query(..., description="The user ID of the commenter"), # In real app, get from Auth token
    db: AsyncSession = Depends(get_db)
):
    """Add a new internal comment to a request."""
    comment = RequestComment(
        request_id=request_id,
        user_id=user_id,
        content=comment_data.content
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    # Get user display name for response
    user_result = await db.execute(select(User.display_name).where(User.id == user_id))
    display_name = user_result.scalar_one_or_none()
    
    return RequestCommentResponse(
        id=comment.id,
        request_id=comment.request_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        display_name=display_name
    )

@router.get("/{request_id}/comments", response_model=List[RequestCommentResponse])
async def list_comments(request_id: int, db: AsyncSession = Depends(get_db)):
    """List all internal comments for a specific request."""
    query = (
        select(RequestComment, User.display_name)
        .join(User, RequestComment.user_id == User.id)
        .where(RequestComment.request_id == request_id)
        .order_by(RequestComment.created_at.asc())
    )
    result = await db.execute(query)
    
    comments = []
    for comment, display_name in result.all():
        comments.append(RequestCommentResponse(
            id=comment.id,
            request_id=comment.request_id,
            user_id=comment.user_id,
            content=comment.content,
            created_at=comment.created_at,
            display_name=display_name
        ))
    return comments

