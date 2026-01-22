from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.service_request import ServiceRequest
from app.schemas.service_request_liff import ServiceRequestCreate, ServiceRequestResponse
from typing import Any

router = APIRouter()

@router.post(
    "/service-requests",
    response_model=ServiceRequestResponse,
    status_code=201,
    summary="Create Service Request (LIFF)",
    description="Submit a new service request form from the LIFF application. Accepts personal details, location, and issue topics.",
    response_description="The created service request with ID and status."
)
async def create_service_request(
    request: ServiceRequestCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new service request from LIFF.
    """
    # Map Pydantic to SQLAlchemy Model
    # Note: Our Pydantic has 'name', 'phone', 'service_type'
    # But our DB Model has 'requester_name', 'phone_number', 'category'
    
    # Construct full name
    full_name = f"{request.prefix or ''}{request.firstname} {request.lastname}".strip()
    if request.name and not full_name:
        full_name = request.name # Fallback
        
    db_obj = ServiceRequest(
        # Context
        line_user_id=request.line_user_id,
        status=None, # User requested no initial status
        priority=None, # User requested no initial priority
        details={"source": "LIFF v2"},
        
        # Personal
        prefix=request.prefix,
        firstname=request.firstname,
        lastname=request.lastname,
        requester_name=full_name,
        phone_number=request.phone_number,
        email=request.email,
        
        # Location
        agency=request.agency,
        province=request.province,
        district=request.district,
        sub_district=request.sub_district,
        
        # Topic
        topic_category=request.topic_category,
        topic_subcategory=request.topic_subcategory,
        
        # Legacy/Compatibility Mapping
        category=request.topic_category or request.service_type,
        
        # Content
        description=request.description,
        attachments=request.attachments
    )
    
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # Map back to Response Schema
    # Because field names differ, we construct response manually or rely on ORM mapping if aliases were used better.
    # But simplest is to just return dict that Pydantic can parse if Config.from_attributes=True
    
    return ServiceRequestResponse(
        id=db_obj.id,
        line_user_id=db_obj.line_user_id,
        created_at=db_obj.created_at,
        status=db_obj.status.value if hasattr(db_obj.status, 'value') else db_obj.status,
        priority=db_obj.priority.value if hasattr(db_obj.priority, 'value') else db_obj.priority, # No default value
        
        # Mapped fields
        name=db_obj.requester_name,
        phone=db_obj.phone_number,
        service_type=db_obj.topic_category or db_obj.category,
        
        # Direct fields
        prefix=db_obj.prefix,
        firstname=db_obj.firstname,
        lastname=db_obj.lastname,
        email=db_obj.email,
        agency=db_obj.agency,
        province=db_obj.province,
        district=db_obj.district,
        sub_district=db_obj.sub_district,
        topic_category=db_obj.topic_category,
        topic_subcategory=db_obj.topic_subcategory,
        description=db_obj.description,
        attachments=db_obj.attachments or []
    )
