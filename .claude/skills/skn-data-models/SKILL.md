---
name: skn-data-models
description: >
  Complete reference for all SQLAlchemy data models in the SKN App backend —
  every table, field, enum, relationship, and FK constraint.
  Use when asked to "add a field to a model", "add a new model", "create a table",
  "add relationship", "what fields does User have", "what does ChatSession look like",
  "what is the Booking model", "what is Organization model", "add FK to User",
  "JSONB field", "models/__init__.py", "Alembic missing model", "autogenerate empty",
  "resolve media URL", "url_utils", "SERVER_BASE_URL", "LINE image not showing",
  "strip flex body", "resolve payload URLs",
  "เพิ่ม field ใน model", "สร้าง model ใหม่", "แก้ไข relationship", "FK ใน SQLAlchemy",
  "URL รูปภาพใน LINE".
  Do NOT use for migration commands (skn-migration-helper), endpoint creation
  (skn-fastapi-endpoint), or Pydantic schema definitions (use the feature skill).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: SQLAlchemy 2.0 async, PostgreSQL with JSONB support, pytz.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [models, sqlalchemy, database, orm, schema, booking, organization, url-utils]
  related-skills:
    - skn-fastapi-endpoint
    - skn-migration-helper
    - skn-core-runtime
    - skn-service-request
    - skn-live-chat-ops
    - skn-webhook-handler
  documentation: ./references/data_models_reference.md
---

# skn-data-models

The data model layer defines all database tables as SQLAlchemy ORM classes.
There are **18 models** exported from `backend/app/models/__init__.py`.

Two models are **completely unimplemented by any feature yet**: `Booking` and `Organization`.
They have tables, relationships, and are imported — but no endpoints, services, or admin
pages exist for them.

Also covers **`backend/app/utils/url_utils.py`** — the URL resolver utility that converts
relative `/api/v1/media/...` paths to absolute HTTPS URLs for LINE API compatibility.

---

## CRITICAL: Project-Specific Rules

1. **Every new model MUST be added to `models/__init__.py`** — Alembic's `autogenerate`
   only detects models that are imported (directly or indirectly) before `target_metadata`
   is set. If your model file exists but isn't in `__init__.py`, `alembic revision
   --autogenerate` will produce an empty migration:
   ```python
   # backend/app/models/__init__.py — ADD your model here:
   from .my_new_model import MyNewModel
   ```
   Then verify in `backend/alembic/env.py` that `from app.models import *` or equivalent
   is present.

2. **`ChatSession.status` is stored as `String(20)` — NOT as a DB-level Enum** —
   Despite the `SessionStatus` Python enum existing, the column is `Column(String(20))`.
   This means:
   - DB stores `"WAITING"`, `"ACTIVE"`, `"CLOSED"` as plain strings
   - Queries can use strings: `where(ChatSession.status == "ACTIVE")`
   - The SessionStatus enum values are used for default assignment, not for DB constraint
   - Adding a new status = add a new enum value AND the string will be valid without migration

3. **`User` model has 7 relationships — always specify `foreign_keys=` when adding a new FK** —
   The `User` table is referenced by many models. SQLAlchemy can't infer which FK to use
   when a model references `User` more than once. Always use `foreign_keys=[ColumnName]`:
   ```python
   # CORRECT:
   requester = relationship("User", back_populates="requests", foreign_keys=[requester_id])
   assignee  = relationship("User", back_populates="assigned_requests", foreign_keys=[assigned_agent_id])

   # WRONG — SQLAlchemy AmbiguousForeignKeysError:
   assignee = relationship("User")
   ```

4. **`friend_status` on User is a plain String — not an enum column** —
   Valid values are `"ACTIVE"`, `"BLOCKED"`, `"UNFOLLOWED"`, `"DELETED"`. There is no
   DB-level enum constraint. Filter with string literals:
   ```python
   select(User).where(User.friend_status == "ACTIVE", User.line_user_id.isnot(None))
   ```

5. **JSONB fields (`details`, `location`, `attachments`, `payload`) require PostgreSQL** —
   The `JSONB` type is PostgreSQL-specific. When filtering on JSONB:
   ```python
   from sqlalchemy.dialects.postgresql import JSONB
   # Field access (contains):
   select(ServiceRequest).where(ServiceRequest.details["key"].as_string() == "value")
   # JSONB containment:
   select(ServiceRequest).where(ServiceRequest.details.contains({"key": "value"}))
   ```
   Default values `default={}` are set at Python level, not DB level — use `server_default`
   for DB-level defaults if needed.

6. **`resolve_payload_urls()` must be called before sending Flex to LINE** —
   Relative URLs (`/api/v1/media/abc`) will fail in LINE's rendering engine (LINE
   cannot reach localhost). Always call before `FlexContainer.from_dict()`:
   ```python
   from app.utils.url_utils import resolve_payload_urls
   payload = resolve_payload_urls(reply_object.payload)
   # THEN:
   FlexContainer.from_dict(payload)
   ```
   This only affects `"url"` keys matching `/api/...` — absolute URLs are passed through.

7. **`SERVER_BASE_URL` must be set in production for media to work in LINE** —
   `url_utils.get_base_url()` falls back to `http://localhost:8000` if unconfigured.
   LINE's servers cannot reach localhost. In production, set:
   ```
   SERVER_BASE_URL=https://your-domain.com
   ```
   in `backend/.env`. Forgetting this causes images in Flex messages to appear broken.

8. **`Booking` and `Organization` exist but have NO endpoints — they are scaffolded** —
   Both models have tables, proper columns, and relationships wired to `User`. However:
   - No router file for bookings or organizations
   - No services, no schemas, no admin pages
   - They appear in `models/__init__.py` and thus exist in migrations
   To implement: follow `skn-fastapi-endpoint` pattern for CRUD + register in `api.py`.

9. **`expire_on_commit=False` is set on `AsyncSessionLocal`** — After a `commit()`, objects
   do NOT expire and their attributes remain accessible without an additional DB query.
   This is the async-safe default — do NOT remove this setting.

---

## File Structure

```
backend/app/
├── db/
│   ├── base.py            — Base = declarative_base()  (import ALL models before using)
│   └── session.py         — AsyncSessionLocal, get_db
├── models/
│   ├── __init__.py        — Authoritative import list (18 models — Alembic reads this)
│   ├── user.py            — User, UserRole, ChatMode  (7 relationships!)
│   ├── organization.py    — Organization (⚠️ no endpoints yet)
│   ├── service_request.py — ServiceRequest, RequestStatus, RequestPriority (JSONB fields)
│   ├── booking.py         — Booking, BookingStatus  (⚠️ no endpoints yet)
│   ├── message.py         — Message, MessageDirection, SenderRole
│   ├── media_file.py      — MediaFile (binary storage in DB)
│   ├── chat_session.py    — ChatSession, SessionStatus (String col!), ClosedBy
│   ├── auto_reply.py      — AutoReply, MatchType, ReplyType
│   ├── reply_object.py    — ReplyObject (string PK: object_id)
│   ├── geography.py       — Province, District, SubDistrict (must be seeded)
│   ├── intent.py          — IntentCategory, IntentKeyword, IntentResponse
│   ├── audit_log.py       — AuditLog (admin_id nullable for system actions)
│   ├── business_hours.py  — BusinessHours (day_of_week 0=Monday)
│   ├── csat_response.py   — CsatResponse (dedup by session_id)
│   ├── canned_response.py — CannedResponse (shortcut unique, usage_count)
│   ├── tag.py             — Tag, UserTag (junction, composite PK)
│   ├── request_comment.py — RequestComment (user_id as query param)
│   └── system_setting.py  — SystemSetting (key-value, created inline in startup)
└── utils/
    └── url_utils.py       — resolve_media_url, resolve_payload_urls, strip_flex_body
```

---

## Step 1 — Add a Field to an Existing Model

```python
# 1. Edit the model file:
# backend/app/models/service_request.py
class ServiceRequest(Base):
    # ... existing columns ...
    urgency_level = Column(Integer, nullable=True)   # NEW FIELD

# 2. Generate migration:
# cd backend && alembic revision --autogenerate -m "add urgency_level to service_requests"

# 3. Review generated migration in alembic/versions/
# 4. Apply: alembic upgrade head
```

---

## Step 2 — Add a New Model

```python
# 1. Create backend/app/models/my_feature.py:
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class MyFeature(Base):
    __tablename__ = "my_features"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", foreign_keys=[user_id])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 2. Register in models/__init__.py:
from .my_feature import MyFeature   # ADD THIS

# 3. Generate migration and apply (skn-migration-helper)
# 4. Create endpoint + register in api.py (skn-fastapi-endpoint + skn-backend-infra)
```

---

## Step 3 — Resolve Media URLs Before Sending to LINE

```python
from app.utils.url_utils import resolve_payload_urls, resolve_media_url, strip_flex_body

# For a single image URL:
absolute_url = resolve_media_url("/api/v1/media/abc-123")
# → "https://your-domain.com/api/v1/media/abc-123"

# For a full Flex payload (recursively resolves all "url" keys):
resolved = resolve_payload_urls(reply_object.payload)
container = FlexContainer.from_dict(resolved)

# To send image-only (strip text body):
image_only = strip_flex_body(flex_payload)
# Use when text is sent as separate TextMessage balloon
```

---

## Common Issues

### `alembic revision --autogenerate` produces an empty migration
**Cause:** The new model is not imported in `models/__init__.py`.
**Fix:** Add `from .my_model import MyModel` to `models/__init__.py`.

### `AmbiguousForeignKeysError` when adding a new FK to User
**Cause:** Multiple FKs to `users.id` without `foreign_keys=` specified.
**Fix:** Always pass `foreign_keys=[column_name]` to every `relationship()` that
references `User`.

### Images in LINE Flex messages appear broken
**Cause 1:** `SERVER_BASE_URL` not set in `backend/.env` (falls back to localhost).
**Cause 2:** `resolve_payload_urls()` not called before `FlexContainer.from_dict()`.
**Fix:** Set `SERVER_BASE_URL=https://your-domain.com` AND always resolve before sending.

### `sqlalchemy.exc.SAWarning: relationship overlaps...` in User model
**Cause:** SQLAlchemy warnings about `tags`/`tag_links` overlap — already handled with
`overlaps=` parameters in `user.py`. Do not remove the `overlaps=` arguments.

---

## Quality Checklist

When working with models:
- [ ] New model added to `models/__init__.py`
- [ ] New relationships on `User` use `foreign_keys=[column]`
- [ ] JSONB columns use `JSONB` from `sqlalchemy.dialects.postgresql`
- [ ] `created_at` uses `server_default=func.now()`, `updated_at` uses `onupdate=func.now()`
- [ ] FK columns are `nullable=True` unless enforcing NOT NULL
- [ ] Media URLs resolved via `resolve_payload_urls()` before sending to LINE
- [ ] `SERVER_BASE_URL` is set in production `.env`
- [ ] Migration generated and reviewed before applying

## Additional Resources

See `references/data_models_reference.md` for:
- Complete field tables for all 18 models
- Enum value tables (UserRole, ChatMode, SessionStatus, etc.)
- Relationship map (who references whom)
- `url_utils.py` function signatures
- JSONB query pattern examples
