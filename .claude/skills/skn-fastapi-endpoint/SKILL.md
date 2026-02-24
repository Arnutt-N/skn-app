---
name: skn-fastapi-endpoint
description: >
  Creates complete FastAPI endpoints for the SKN App (JskApp) backend following
  the project's exact async SQLAlchemy 2.0 patterns, Pydantic schemas, and router
  registration workflow. Use when asked to "create endpoint", "add API route",
  "new backend API", "add backend feature", "create CRUD for [resource]",
  "เพิ่ม endpoint", "สร้าง API", "เพิ่ม route", or any new admin API endpoint.
  Do NOT use for WebSocket endpoints, LINE webhook handlers, or frontend components.
license: MIT
compatibility: >
  SKN App (JskApp) backend. Python 3.11+, FastAPI, SQLAlchemy 2.0 async,
  PostgreSQL + asyncpg. Run via: cd backend && uvicorn app.main:app --reload
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [fastapi, sqlalchemy, postgresql, async, crud]
---

# skn-fastapi-endpoint

Creates a complete FastAPI endpoint for the SKN App backend, following all
project-specific patterns extracted from the live codebase.

---

## CRITICAL: Project-Specific Rules

These rules are non-negotiable and must be followed every time:

1. **Always async** — every endpoint function and DB operation must use `async/await`
2. **No prefix/tags on the router** — only applied in `api.py` at `include_router()` time
3. **Query pattern:** `result = await db.execute(select(...))` → `.scalar_one_or_none()` or `.scalars().all()`
4. **Commit then refresh:** `await db.commit()` → `await db.refresh(obj)` → `return obj`
5. **Auth is optional per endpoint** — dev mode bypasses auth via `settings.ENVIRONMENT == "development"` in `deps.py`; use `Depends(deps.get_current_admin)` only when the endpoint requires it
6. **Register in api.py** — every new router must be imported and added via `include_router()` in `backend/app/api/v1/api.py`

---

## Context7 Docs

Context7 MCP is active in this project. Use it before writing code to verify
version-specific API patterns, especially for SQLAlchemy 2.0 async and Pydantic v2.

**Relevant libraries:**

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | dependencies, response models, background tasks |
| SQLAlchemy | `"sqlalchemy"` | async session, select, insert, update |
| Pydantic | `"pydantic"` | v2 validators, model_config, field_validator |
| Alembic | `"alembic"` | autogenerate, async env, upgrade/downgrade |

**Usage:**
```
# 1. Resolve to Context7 library ID
mcp__context7__resolve-library-id  libraryName="sqlalchemy"
→ { context7CompatibleLibraryID: "/sqlalchemy/sqlalchemy" }

# 2. Fetch targeted docs
mcp__context7__get-library-docs
    context7CompatibleLibraryID="/sqlalchemy/sqlalchemy"
    topic="async session select"
    tokens=5000
```

When to use: SQLAlchemy 2.0 query syntax, Pydantic v2 field validation, or
Alembic async env setup — areas where v1→v2 breaking changes are common.

---

## Step 1: Understand the Requirement

Before writing any code, answer:

- **What is the resource?** (e.g., `Announcement`, `Tag`, `Report`)
- **Which CRUD operations are needed?** (List / Get One / Create / Update / Delete)
- **Is a new Model required?** Or does an existing model cover it?
- **What URL prefix?** Pattern: `/admin/[resource-name-plural]`
- **Auth required?** If yes, add `Depends(deps.get_current_admin)`

Check existing models before creating a new one:
```
backend/app/models/
├── user.py
├── service_request.py
├── message.py
├── chat_session.py
└── credential.py
```

---

## Step 2: Create the SQLAlchemy Model (if needed)

Create `backend/app/models/[resource].py`:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class [Resource]Status(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class [Resource](Base):
    __tablename__ = "[resources]"

    id = Column(Integer, primary_key=True, index=True)

    # Core fields
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Enum field
    status = Column(Enum([Resource]Status), default=[Resource]Status.ACTIVE, index=True)

    # Optional FK relationship
    # created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    # creator = relationship("User", foreign_keys=[created_by])

    # Optional flexible JSON data
    # extra_data = Column(JSONB, default={})

    # Timestamps — server_default means the DB sets this automatically on INSERT
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

After creating the model:
1. Verify Alembic can detect it (check `backend/app/db/base.py` imports if needed)
2. Run migration — see Step 6

---

## Step 3: Create Pydantic Schemas

Create `backend/app/schemas/[resource].py`:

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class [Resource]StatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


# Shared base fields
class [Resource]Base(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: [Resource]StatusEnum = [Resource]StatusEnum.ACTIVE


# Used for POST requests
class [Resource]Create([Resource]Base):
    pass


# Used for PATCH requests — all fields optional
class [Resource]Update(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[[Resource]StatusEnum] = None


# Returned to the client
class [Resource]Response([Resource]Base):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True    # Maps SQLAlchemy model → Pydantic
        use_enum_values = True    # Serialize enums as string values
```

---

## Step 4: Create the Endpoint File

Create `backend/app/api/v1/endpoints/admin_[resource].py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Any

from app.api import deps
from app.models.[resource] import [Resource], [Resource]Status
from app.schemas.[resource] import (
    [Resource]Create,
    [Resource]Update,
    [Resource]Response,
)

router = APIRouter()  # No prefix or tags here — applied in api.py


# ─── LIST ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[[Resource]Response])
async def list_[resources](
    status: Optional[[Resource]Status] = None,
    search: Optional[str] = Query(None, description="Search by title"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """List all [resources] with optional filtering."""
    query = (
        select([Resource])
        .order_by([Resource].created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    if status:
        query = query.where([Resource].status == status)
    if search:
        query = query.where([Resource].title.ilike(f"%{search}%"))

    result = await db.execute(query)
    return result.scalars().all()


# ─── GET ONE ────────────────────────────────────────────────────────────────

@router.get("/{[resource]_id}", response_model=[Resource]Response)
async def get_[resource](
    [resource]_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get a single [resource] by ID."""
    result = await db.execute(
        select([Resource]).where([Resource].id == [resource]_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="[Resource] not found")
    return item


# ─── CREATE ─────────────────────────────────────────────────────────────────

@router.post("", response_model=[Resource]Response, status_code=status.HTTP_201_CREATED)
async def create_[resource](
    data: [Resource]Create,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Create a new [resource]."""
    # Uniqueness check (remove if not needed)
    existing = await db.execute(
        select([Resource]).where([Resource].title == data.title)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="[Resource] with this title already exists")

    item = [Resource](**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


# ─── UPDATE ─────────────────────────────────────────────────────────────────

@router.patch("/{[resource]_id}", response_model=[Resource]Response)
async def update_[resource](
    [resource]_id: int,
    data: [Resource]Update,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Update [resource] fields (partial update)."""
    result = await db.execute(
        select([Resource]).where([Resource].id == [resource]_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="[Resource] not found")

    # Only update fields that were actually sent (exclude_unset=True)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)
    return item


# ─── DELETE ─────────────────────────────────────────────────────────────────

@router.delete("/{[resource]_id}", status_code=204)
async def delete_[resource](
    [resource]_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> None:
    """Delete a [resource] permanently."""
    result = await db.execute(
        select([Resource]).where([Resource].id == [resource]_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="[Resource] not found")

    await db.delete(item)
    await db.commit()
    return None
```

---

## Step 5: Register the Router in api.py

Open `backend/app/api/v1/api.py` and add two lines:

```python
# Add to the import block (keep alphabetical order)
from app.api.v1.endpoints import (
    ...
    admin_[resource],    # ← add this
    ...
)

# Add to the include_router block (before ws_live_chat and health)
api_router.include_router(admin_[resource].router, prefix="/admin/[resources]", tags=["admin"])
```

Result: endpoint is live at `/api/v1/admin/[resources]`

---

## Step 6: Create Alembic Migration (if new Model was created)

```bash
cd backend

# Check current state
alembic current

# Auto-generate migration from model changes
alembic revision --autogenerate -m "add [resource] table"

# Inspect the generated file in alembic/versions/
# Should contain op.create_table("[resources]", ...)

# Apply migration
alembic upgrade head
```

**If Alembic does not detect the model:** check that the model is imported in `backend/app/db/base.py`

---

## Step 7: Verify

```bash
# Start backend (with auto-reload)
cd backend && uvicorn app.main:app --reload

# Open Swagger UI
# http://localhost:8000/api/v1/docs
# → find section "admin" → new endpoints should appear
```

Quick smoke test via curl:
```bash
# Create
curl -X POST http://localhost:8000/api/v1/admin/[resources] \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Item"}'

# List
curl http://localhost:8000/api/v1/admin/[resources]

# Get one
curl http://localhost:8000/api/v1/admin/[resources]/1

# Update
curl -X PATCH http://localhost:8000/api/v1/admin/[resources]/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'

# Delete
curl -X DELETE http://localhost:8000/api/v1/admin/[resources]/1
```

---

## Examples

### Example 1: Create an Announcements API

**User says:** "Create an API to manage announcements"

**Actions:**
1. Create `backend/app/models/announcement.py` — fields: `title`, `content`, `is_active`, `published_at`
2. Create `backend/app/schemas/announcement.py` — `AnnouncementCreate`, `AnnouncementUpdate`, `AnnouncementResponse`
3. Create `backend/app/api/v1/endpoints/admin_announcements.py` — CRUD endpoints
4. Add to `api.py`: `prefix="/admin/announcements"`
5. Run `alembic revision --autogenerate -m "add announcements table"`
6. Run `alembic upgrade head`

**Result:** `/api/v1/admin/announcements` is fully operational

### Example 2: Add an Endpoint to an Existing Resource

**User says:** "Add a bulk delete endpoint for requests"

**Actions:**
1. Open `backend/app/api/v1/endpoints/admin_requests.py`
2. Append the new endpoint — no router re-registration needed:

```python
from sqlalchemy import delete

@router.delete("/bulk", status_code=204)
async def bulk_delete_requests(
    ids: List[int],
    db: AsyncSession = Depends(deps.get_db),
) -> None:
    """Delete multiple service requests at once."""
    await db.execute(
        delete(ServiceRequest).where(ServiceRequest.id.in_(ids))
    )
    await db.commit()
    return None
```

---

## Common Issues

### `greenlet_spawn has not been called`
**Cause:** Sync SQLAlchemy operation called inside async context.
**Fix:** Ensure every DB call uses `await db.execute(...)`, not `db.execute(...)`.

### `Table already exists`
**Cause:** Migration was run twice, or table was created manually.
**Fix:**
```bash
alembic current
alembic history
alembic stamp head    # mark current state without running migrations
```

### `ImportError` on server start
**Cause:** Circular import or wrong module path.
**Fix:** Verify `api.py` uses `from app.api.v1.endpoints import admin_[resource]`

### Model not detected by Alembic
**Cause:** Model not imported into base metadata.
**Fix:** Check `backend/app/db/base.py` — model must be imported there.

### `updated_at` is null after CREATE
**Cause:** `onupdate=func.now()` only fires on UPDATE, not INSERT — this is correct behavior.
**Fix:** Only an issue if you need a value on insert; add `server_default=func.now()` alongside `onupdate`.

---

## Quality Checklist

Before finishing, verify:
- [ ] Every handler is `async def`
- [ ] Every DB call has `await`
- [ ] `router = APIRouter()` has no `prefix` or `tags`
- [ ] Router registered in `api.py` with `prefix` and `tags=["admin"]`
- [ ] 404 raised when resource not found
- [ ] `await db.commit()` and `await db.refresh(obj)` before returning
- [ ] Pydantic schema has `class Config: from_attributes = True`
- [ ] `alembic upgrade head` run if a new model was created
- [ ] Verified in Swagger UI at `localhost:8000/api/v1/docs`

---

*See `references/patterns.md` for additional snippets: auth injection, audit logging,
JOIN queries, pagination, cursor-based pagination, file upload, background tasks.*
