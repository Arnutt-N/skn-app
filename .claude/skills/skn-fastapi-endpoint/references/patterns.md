# SKN App Backend — Code Patterns Reference

ไฟล์นี้รวม code snippets จริงจาก codebase สำหรับอ้างอิงเมื่อสร้าง endpoint

---

## Auth & Current User

### ใช้ Auth ใน Endpoint (Admin only)

```python
from app.api import deps
from app.models.user import User

@router.get("/protected", response_model=SomeResponse)
async def protected_endpoint(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),  # ADMIN/SUPER_ADMIN only
) -> Any:
    # current_user.id, current_user.role, current_user.display_name ใช้ได้เลย
    pass
```

### ใช้ Auth (User ทั่วไปก็ได้)

```python
current_user: User = Depends(deps.get_current_user)  # รับ user ทุก role
```

### Dev Mode Bypass

```python
# ใน deps.py — auth bypass อัตโนมัติเมื่อ settings.ENVIRONMENT == "development"
# ไม่ต้องทำอะไรพิเศษ — ส่ง request ไม่ต้องมี Authorization header ก็ได้
```

---

## Audit Logging

### ใช้ Decorator (สำหรับ Service Methods)

```python
from app.core.audit import audit_action

class SomeService:
    @audit_action("create_item", "item")
    async def create(self, data: dict, operator_id: int, db: AsyncSession):
        # audit log สร้างอัตโนมัติ — ต้องมี operator_id และ db เป็น kwargs
        item = Item(**data)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item
```

### Manual Audit Log (สำหรับ Endpoint โดยตรง)

```python
from app.core.audit import create_audit_log

@router.post("/{item_id}/approve")
async def approve_item(
    item_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    # ... logic ...
    await create_audit_log(
        db=db,
        admin_id=current_user.id,
        action="approve_item",
        resource_type="item",
        resource_id=str(item_id),
        details={"approved_by": current_user.display_name},
    )
    await db.commit()
    return item
```

---

## Complex Query Patterns

### JOIN Query

```python
from sqlalchemy.orm import selectinload

# Left join กับ label
query = (
    select(ServiceRequest, User.display_name.label("assignee_name"))
    .outerjoin(User, ServiceRequest.assigned_agent_id == User.id)
    .order_by(ServiceRequest.created_at.desc())
    .offset(skip)
    .limit(limit)
)
result = await db.execute(query)
for req, assignee_name in result.all():
    req_dict = ServiceRequestResponse.model_validate(req).model_dump()
    req_dict['assignee_name'] = assignee_name
    items.append(req_dict)
```

### Eager Loading Relationships

```python
query = (
    select(Item)
    .options(selectinload(Item.children))  # Load relationships ใน query เดียว
    .where(Item.id == item_id)
)
result = await db.execute(query)
item = result.scalar_one_or_none()
```

### Count Query

```python
total = await db.scalar(
    select(func.count(Item.id)).where(Item.status == "ACTIVE")
)
```

### Search with Multiple Conditions

```python
if search:
    search_filter = (
        (Item.title.ilike(f"%{search}%")) |
        (Item.description.ilike(f"%{search}%")) |
        (Item.code.ilike(f"%{search}%"))
    )
    query = query.where(search_filter)
```

### Bulk Update

```python
from sqlalchemy import update

await db.execute(
    update(Item)
    .where(Item.status == "PENDING")
    .values(status="PROCESSED", processed_at=func.now())
)
await db.commit()
```

### Bulk Delete

```python
from sqlalchemy import delete

await db.execute(
    delete(Item).where(Item.id.in_(ids))
)
await db.commit()
```

---

## Pagination Patterns

### Offset-based Pagination

```python
@router.get("", response_model=List[ItemResponse])
async def list_items(
    skip: int = 0,
    limit: int = Query(default=100, le=500),  # max 500
    db: AsyncSession = Depends(deps.get_db),
):
    query = select(Item).order_by(Item.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

### Cursor-based Pagination (สำหรับ real-time data)

```python
@router.get("/{user_id}/messages")
async def get_messages(
    user_id: str,
    before_id: Optional[int] = None,  # cursor
    limit: int = 50,
    db: AsyncSession = Depends(deps.get_db),
):
    query = select(Message).where(Message.line_user_id == user_id)
    if before_id:
        query = query.where(Message.id < before_id)  # ดึงก่อน cursor
    query = query.order_by(Message.id.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

### Pagination with Total Count

```python
class PaginatedResponse(BaseModel):
    items: List[ItemResponse]
    total: int
    skip: int
    limit: int

@router.get("", response_model=PaginatedResponse)
async def list_items(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
):
    base_query = select(Item)
    total = await db.scalar(select(func.count()).select_from(base_query.subquery()))
    result = await db.execute(base_query.offset(skip).limit(limit))
    items = result.scalars().all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}
```

---

## File Upload

```python
from fastapi import UploadFile, File
import os

@router.post("/{item_id}/attachment")
async def upload_attachment(
    item_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin),
):
    # Read file bytes
    content = await file.read()
    filename = file.filename or "attachment"
    content_type = file.content_type

    # Save to uploads directory
    upload_dir = "uploads/items"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{item_id}_{filename}"
    with open(file_path, "wb") as f:
        f.write(content)

    # Update record
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.attachment_url = f"/uploads/items/{item_id}_{filename}"
    await db.commit()
    await db.refresh(item)
    return item
```

---

## Background Tasks

```python
from fastapi import BackgroundTasks

async def send_notification(user_id: int, message: str):
    """Background task — รันหลัง response ถูกส่งแล้ว"""
    # ส่ง LINE message, email, etc.
    pass

@router.post("/{item_id}/notify")
async def notify_user(
    item_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # เพิ่ม background task — response จะถูกส่งทันที ไม่รอ task เสร็จ
    background_tasks.add_task(send_notification, item.user_id, "Your item is ready")

    return {"message": "Notification queued"}
```

---

## Response Patterns

### Multiple Status Codes

```python
from fastapi import status

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(...):
    ...

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(...):
    return None  # ต้อง return None สำหรับ 204
```

### Custom Error Response

```python
from fastapi.responses import JSONResponse

@router.post("/validate")
async def validate_item(data: ItemCreate):
    errors = []
    if not data.title:
        errors.append({"field": "title", "message": "Title is required"})
    if errors:
        return JSONResponse(
            status_code=422,
            content={"errors": errors}
        )
    return {"valid": True}
```

---

## เส้นทางไฟล์สำคัญ (Quick Reference)

```
backend/app/
├── api/
│   ├── deps.py                         ← get_db, get_current_user, get_current_admin
│   └── v1/
│       ├── api.py                      ← Register routers ที่นี่
│       └── endpoints/
│           ├── admin_requests.py       ← ตัวอย่าง CRUD ครบ
│           ├── admin_live_chat.py      ← ตัวอย่าง auth + complex queries
│           └── admin_intents.py        ← ตัวอย่าง nested resources
├── core/
│   └── audit.py                        ← @audit_action decorator
├── db/
│   ├── base.py                         ← Import models ที่นี่เพื่อให้ Alembic detect
│   └── session.py                      ← get_db, AsyncSessionLocal
├── models/                             ← SQLAlchemy models
└── schemas/                            ← Pydantic schemas
```
