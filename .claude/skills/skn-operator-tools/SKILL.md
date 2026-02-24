---
name: skn-operator-tools
description: >
  Manages operator support tools in the SKN App — canned responses (message shortcuts),
  user tags (colour-coded labels for LINE users), and LINE friend management.
  Use when asked to "add canned response", "create message shortcut", "tag user",
  "assign tag", "LINE friend list", "friend status", "friend history",
  "เพิ่ม canned response", "สร้าง shortcut ข้อความ", "ติด tag ผู้ใช้",
  "รายชื่อ friends LINE", "ประวัติ friend event".
  Do NOT use for live chat session lifecycle (skn-live-chat-ops), intent/auto-reply
  management (skn-intent-manager), or rich menu (skn-rich-menu-builder).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend, PostgreSQL.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [canned-responses, tags, friends, operator, live-chat]
  related-skills:
    - skn-live-chat-ops
    - skn-fastapi-endpoint
    - skn-user-management
  documentation: ./references/operator_tools_reference.md
---

# skn-operator-tools

Three operator-facing support systems:

1. **Canned Responses** (`admin_canned_responses.py`) — shortcut-triggered message
   templates for operators to reuse during live chat.
2. **Tags** (`admin_tags.py`) — colour-coded labels that can be assigned to LINE users
   to categorise them (e.g. "VIP", "Complaint", "Pending Follow-up").
3. **Friends** (`admin_friends.py`) — LINE friend list with status filtering and
   per-user event history (follow/unfollow events).

---

## CRITICAL: Project-Specific Rules

1. **Canned response `shortcut` must be unique** — `canned_response_service.get_by_shortcut()`
   is checked before create; returns 409 if duplicate. Never skip this check.

2. **`CannedResponse` uses soft-delete** — `DELETE /{id}` sets `is_active = False`,
   it does not remove the row. `get_all()` filters `is_active = True`. Do not hard-delete
   canned responses; history and `usage_count` would be lost.

3. **`usage_count` must be incremented on use** — when an operator sends a canned
   response in live chat, call `canned_response_service.increment_usage(id, db)`.
   This is NOT done automatically by the endpoint — the live chat WS handler must
   call it explicitly.

4. **Tag `name` is unique** — `tag_service.create_tag()` raises `ValueError` on
   duplicate name. The endpoint catches this and returns 400.

5. **`UserTag` is a junction table with composite PK** — `(user_id, tag_id)`.
   Assigning the same tag twice raises `LookupError` from the service. Remove
   before re-assigning if needed.

6. **Tag color is hex, 7 chars including `#`** — e.g., `"#6366f1"`. Store and
   validate as a 7-character string. No validation is enforced by the model column
   (`String(7)`), so the endpoint must validate format if strict validation is needed.

7. **Friends endpoint has NO `get_current_admin` auth** — `admin_friends.py` uses only
   `Depends(deps.get_db)`. All routes are unauthenticated in the current implementation.
   This is a known gap (GAP-3).

8. **`friend_status` values are plain strings** — the `User.friend_status` column
   stores strings like `"ACTIVE"`, `"BLOCKED"`, `"DELETED"`. There is no
   `FriendStatus` enum. Filter with plain string comparison.

9. **`FriendEvent` is a separate model** — follow/unfollow/block events are stored in
   a `friend_events` table (via `FriendEventListResponse`). These are read from
   `friend_service.get_friend_events(line_user_id, db)`, not from the `User` table.

10. **Canned response `category` is a free-form string** — no enum or validation.
    Convention used in the UI: `"info"`, `"greeting"`, `"closing"`, `"escalation"`.
    Using the wrong category just affects filtering, not functionality.

---

## Context7 Docs

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | HTTPException, Query, Depends |
| SQLAlchemy | `"sqlalchemy"` | async session, unique constraint, soft-delete pattern |
| Pydantic | `"pydantic"` | BaseModel, Optional, model_dump(exclude_unset=True) |

---

## Step 1 — Canned Responses (`/admin/canned-responses`)

**File:** `backend/app/api/v1/endpoints/admin_canned_responses.py`
**Registered at:** `api.py` → `prefix="/admin/canned-responses", tags=["admin"]`

### Schemas (defined inline in endpoint file)

```python
class CannedResponseCreate(BaseModel):
    shortcut: str           # e.g. "/greet" — must be unique
    title: str              # display name shown in picker
    content: str            # full message text sent to user
    category: str = "info"  # free-form: "info", "greeting", "closing", "escalation"

class CannedResponseUpdate(BaseModel):
    shortcut:  Optional[str] = None
    title:     Optional[str] = None
    content:   Optional[str] = None
    category:  Optional[str] = None
```

### Endpoints

```python
# GET /admin/canned-responses?category=greeting
# → {"items": [{id, shortcut, title, content, category, usage_count}], "total": int}
# Filters by is_active=True (soft-delete aware)

# POST /admin/canned-responses
# → 409 if shortcut already exists
# → {id, shortcut, title, content, category}
# created_by = current_user.id (auto-set by service)

# PUT /admin/canned-responses/{id}
# → 400 if no fields provided
# → 404 if not found
# → updated response dict

# DELETE /admin/canned-responses/{id}
# → 404 if not found
# → {"status": "deleted", "id": int}   ← soft-delete (is_active=False)
```

### Service Methods

```python
from app.services.canned_response_service import canned_response_service

# List active responses (optional category filter)
items = await canned_response_service.get_all(db, category=None)

# Check shortcut uniqueness before create
existing = await canned_response_service.get_by_shortcut(shortcut, db)
if existing:
    raise HTTPException(409, f"Shortcut '{shortcut}' already exists")

# Create
response = await canned_response_service.create(
    {**data.model_dump(), "created_by": current_user.id}, db
)

# Update (pass only changed fields)
updated = await canned_response_service.update(id, update_dict, db)

# Soft-delete
deleted = await canned_response_service.delete(id, db)  # returns bool

# Increment usage count when operator uses the response in live chat
await canned_response_service.increment_usage(id, db)
```

---

## Step 2 — Tags (`/admin/tags`)

**File:** `backend/app/api/v1/endpoints/admin_tags.py`
**Registered at:** `api.py` → `prefix="/admin/tags", tags=["admin"]`

### Schema

```python
class TagCreateRequest(BaseModel):
    name:  str
    color: str = "#6366f1"   # hex color, 7 chars incl. "#"
```

### Endpoints

```python
# GET /admin/tags
# → {"items": [{id, name, color}], "total": int}

# POST /admin/tags
# body: {name, color}
# → 400 if name already exists (ValueError from service)
# → {id, name, color}

# POST /admin/tags/{tag_id}/users/{user_id}
# → 404 if tag or user not found (LookupError from service)
# → {"status": "assigned", "tag_id": int, "user_id": int}

# DELETE /admin/tags/{tag_id}/users/{user_id}
# → 404 if assignment not found
# → {"status": "removed", "tag_id": int, "user_id": int}

# GET /admin/tags/users/{user_id}
# → {"items": [{id, name, color}], "total": int}
```

### Service Methods

```python
from app.services.tag_service import tag_service

# List all tags
tags = await tag_service.list_tags(db)

# Create (raises ValueError on duplicate name)
try:
    tag = await tag_service.create_tag(db, name=name, color=color)
except ValueError as exc:
    raise HTTPException(400, str(exc))

# Assign tag to user (raises LookupError if tag/user not found)
try:
    await tag_service.assign_tag_to_user(db, user_id=user_id, tag_id=tag_id)
except LookupError as exc:
    raise HTTPException(404, str(exc))

# Remove tag from user (returns bool)
removed = await tag_service.remove_tag_from_user(db, user_id=user_id, tag_id=tag_id)
if not removed:
    raise HTTPException(404, "Tag assignment not found")

# List tags for a specific user
tags = await tag_service.list_user_tags(db, user_id=user_id)
```

### Tag + UserTag Models

```python
# backend/app/models/tag.py

class Tag(Base):
    __tablename__ = "tags"
    id    = Column(Integer, primary_key=True)
    name  = Column(String(50), unique=True, index=True)
    color = Column(String(7), default="#6366f1")   # hex, 7 chars

class UserTag(Base):
    __tablename__ = "user_tags"
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tag_id     = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## Step 3 — Friends (`/admin/friends`)

**File:** `backend/app/api/v1/endpoints/admin_friends.py`
**Registered at:** `api.py` → `prefix="/admin/friends", tags=["admin"]`
**Auth:** ⚠️ None — uses only `Depends(deps.get_db)` (see GAP-3)

### Endpoints

```python
# GET /admin/friends?status=ACTIVE&skip=0&limit=100
# → {"friends": [User records], "total": int}
# status filter: "ACTIVE", "BLOCKED", "DELETED" (plain string, no enum)

# GET /admin/friends/{line_user_id}/events
# → FriendEventListResponse: {"events": [...], "total": int}
# Returns follow/unfollow/block event history for the LINE user
```

### Service Methods

```python
from app.services.friend_service import friend_service

# List friends with optional status filter
friends = await friend_service.list_friends(
    status="ACTIVE",   # or None for all
    db=db,
    skip=0,
    limit=100
)

# Get event history for a specific LINE user
events = await friend_service.get_friend_events(line_user_id, db)
```

### Friend Status Values

| Value | Meaning |
|---|---|
| `"ACTIVE"` | User has followed (default) |
| `"BLOCKED"` | User has blocked the bot |
| `"DELETED"` | User has unfollowed |

Set by the webhook handler when LINE sends follow/unfollow/block events.
`User.friend_status` is a plain `String` column — no enum model.

---

## Step 4 — Integrate Canned Responses into Live Chat

When an operator selects and sends a canned response via WebSocket:

```python
# In ws_live_chat.py — inside the "send_message" event handler

elif event_type == "send_message":
    payload = data.get("payload", {})
    canned_id = payload.get("canned_response_id")   # optional

    # Increment usage if sent via canned response
    if canned_id:
        async with AsyncSessionLocal() as db_inner:
            await canned_response_service.increment_usage(canned_id, db_inner)

    # ... rest of send_message logic
```

On the frontend, the operator canned response picker sends:
```json
{
    "type": "send_message",
    "payload": {
        "text": "สวัสดีครับ ยินดีให้บริการ",
        "canned_response_id": 5
    }
}
```

---

## Step 5 — Add a New Tag to a User (end-to-end)

```python
# 1. Frontend: POST /admin/tags to create the tag (if not exists)
# 2. Frontend: POST /admin/tags/{tag_id}/users/{user_id} to assign

# Backend (tags endpoint) — example manual call:
from app.services.tag_service import tag_service

# Create "VIP" tag with purple color
tag = await tag_service.create_tag(db, name="VIP", color="#7c3aed")

# Assign to user ID 42
await tag_service.assign_tag_to_user(db, user_id=42, tag_id=tag.id)

# Get all tags for user 42
tags = await tag_service.list_user_tags(db, user_id=42)
# → [Tag(id=1, name="VIP", color="#7c3aed")]
```

---

## Known Gaps

### GAP-1: `usage_count` not auto-incremented on send
`CannedResponse.usage_count` exists but is never incremented automatically.
The live chat WebSocket handler (`ws_live_chat.py`) does not call
`canned_response_service.increment_usage()`. Stats will always show 0.
**Fix:** Add the increment call in the `send_message` WebSocket event handler
when `canned_response_id` is provided in the payload.

### GAP-2: No tag delete endpoint
`DELETE /admin/tags/{tag_id}` does not exist — you can only remove a tag from
a user (`DELETE /admin/tags/{tag_id}/users/{user_id}`).
**Fix:** Add `DELETE /admin/tags/{tag_id}` which deletes the Tag row (cascades
`UserTag` rows via `ondelete="CASCADE"`).

### GAP-3: Friends endpoint has no auth
`admin_friends.py` routes have no `get_current_admin` dependency.
Any unauthenticated request can list all LINE friends.
**Fix:** Add `current_user: User = Depends(get_current_admin)` to both routes.

### GAP-4: No frontend pages for tags or canned responses
No admin UI pages exist for managing tags or canned responses outside of live chat.
**Fix:** Build pages at `frontend/app/admin/` using `skn-admin-component` patterns.

### GAP-5: Canned response search not implemented
`GET /admin/canned-responses` only supports `category` filter, not keyword search.
**Fix:** Add optional `search` query param — `ilike` on `title` or `content`.

---

## Common Issues

### `POST /admin/canned-responses` returns 409
**Cause:** `shortcut` already exists (unique constraint).
**Fix:** Choose a different shortcut, or `PUT /admin/canned-responses/{id}` to
update the existing one.

### `POST /admin/tags/{tag_id}/users/{user_id}` returns 404
**Cause:** Either the `tag_id` or `user_id` does not exist in the DB.
**Fix:** Verify both IDs exist: `GET /admin/tags` for tag IDs,
`GET /admin/users` for user IDs.

### `GET /admin/canned-responses` returns empty list
**Cause:** All canned responses have `is_active=False` (soft-deleted), or none
have been created yet.
**Fix:** `GET /admin/canned-responses` only returns active (`is_active=True`) records.

### `usage_count` is always 0
**Cause:** GAP-1 — increment is never called from the WebSocket handler.
**Fix:** See GAP-1 fix in Step 4.

### `GET /admin/friends` returns all friends regardless of status filter
**Cause:** `status` param not being passed or the service ignores it.
**Fix:** Verify `friend_service.list_friends(status, db, skip, limit)` — first
positional arg is `status`.

---

## Quality Checklist

Before finishing, verify:
- [ ] Canned response `shortcut` uniqueness checked before create (409 on conflict)
- [ ] `CannedResponse` deleted via soft-delete (`is_active=False`) not hard-delete
- [ ] Tag `name` uniqueness handled — `ValueError` caught → 400 response
- [ ] `UserTag` remove returns `False` when not found → 404 response
- [ ] Tag `color` stored as 7-char hex string including `#`
- [ ] `canned_response_service.increment_usage()` called when operator sends canned message
- [ ] Friends routes add `get_current_admin` if auth is required (GAP-3)
- [ ] Cascade delete on `UserTag` works when `Tag` is deleted (ondelete="CASCADE")
