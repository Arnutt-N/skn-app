# Operator Tools — Reference

Sources: `admin_canned_responses.py`, `admin_tags.py`, `admin_friends.py`,
`models/canned_response.py`, `models/tag.py`, `services/canned_response_service.py`,
`services/tag_service.py`, `services/friend_service.py`

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/canned-responses` | ✅ admin | List active responses (optional `category` filter) |
| `POST` | `/admin/canned-responses` | ✅ admin | Create new (409 if shortcut exists) |
| `PUT` | `/admin/canned-responses/{id}` | ✅ admin | Update fields |
| `DELETE` | `/admin/canned-responses/{id}` | ✅ admin | Soft-delete (is_active=False) |
| `GET` | `/admin/tags` | ✅ admin | List all tags |
| `POST` | `/admin/tags` | ✅ admin | Create tag (400 if name exists) |
| `POST` | `/admin/tags/{tag_id}/users/{user_id}` | ✅ admin | Assign tag to user |
| `DELETE` | `/admin/tags/{tag_id}/users/{user_id}` | ✅ admin | Remove tag from user |
| `GET` | `/admin/tags/users/{user_id}` | ✅ admin | List tags for a user |
| `GET` | `/admin/friends` | ❌ none | List friends (status filter) |
| `GET` | `/admin/friends/{line_user_id}/events` | ❌ none | Friend event history |

---

## CannedResponse Model

**File:** `backend/app/models/canned_response.py`

```python
class CannedResponse(Base):
    __tablename__ = "canned_responses"

    id          = Column(Integer, primary_key=True)
    shortcut    = Column(String(30), unique=True, index=True)  # e.g. "/greet"
    title       = Column(String(100), nullable=False)          # display label
    content     = Column(Text, nullable=False)                 # message text
    category    = Column(String(50), index=True)               # free-form
    is_active   = Column(Boolean, default=True)                # soft-delete flag
    usage_count = Column(Integer, default=0)                   # NOT auto-incremented
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

---

## Tag + UserTag Models

**File:** `backend/app/models/tag.py`

```python
class Tag(Base):
    __tablename__ = "tags"
    id         = Column(Integer, primary_key=True)
    name       = Column(String(50), unique=True, index=True)
    color      = Column(String(7), default="#6366f1")   # "#RRGGBB"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    users      = relationship("User", secondary="user_tags", ...)
    user_links = relationship("UserTag", cascade="all, delete-orphan", ...)

class UserTag(Base):
    __tablename__ = "user_tags"
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tag_id     = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

Note: Both FKs have `ondelete="CASCADE"` — deleting a `User` or `Tag` removes all
associated `UserTag` rows automatically.

---

## Canned Response — Request/Response Schemas

```python
# Create
{
    "shortcut": "/greet",
    "title": "สวัสดี",
    "content": "สวัสดีครับ ยินดีให้บริการ",
    "category": "greeting"   # default "info"
}

# Update (all optional)
{
    "shortcut": "/hi",
    "content": "สวัสดีครับ!"
}

# Response (create/update)
{
    "id": 1,
    "shortcut": "/greet",
    "title": "สวัสดี",
    "content": "สวัสดีครับ ยินดีให้บริการ",
    "category": "greeting"
}

# List item (includes usage_count)
{
    "id": 1,
    "shortcut": "/greet",
    "title": "สวัสดี",
    "content": "สวัสดีครับ ยินดีให้บริการ",
    "category": "greeting",
    "usage_count": 42
}
```

---

## Canned Response — Service Interface

```python
from app.services.canned_response_service import canned_response_service

await canned_response_service.get_all(db, category=None)            → List[CannedResponse]
await canned_response_service.get_by_shortcut(shortcut: str, db)    → Optional[CannedResponse]
await canned_response_service.create(data: dict, db)                → CannedResponse
await canned_response_service.update(id: int, data: dict, db)       → Optional[CannedResponse]
await canned_response_service.delete(id: int, db)                   → bool  # soft-delete
await canned_response_service.increment_usage(id: int, db)          → None  # +1 usage_count
```

---

## Tag — Service Interface

```python
from app.services.tag_service import tag_service

await tag_service.list_tags(db)                                              → List[Tag]
await tag_service.create_tag(db, name: str, color: str)                      → Tag  # raises ValueError on dup
await tag_service.assign_tag_to_user(db, user_id: int, tag_id: int)          → None # raises LookupError if not found
await tag_service.remove_tag_from_user(db, user_id: int, tag_id: int)        → bool
await tag_service.list_user_tags(db, user_id: int)                           → List[Tag]
```

---

## Friend — Service Interface

```python
from app.services.friend_service import friend_service

await friend_service.list_friends(status: str | None, db, skip: int, limit: int) → List[User]
await friend_service.get_friend_events(line_user_id: str, db)                    → List[FriendEvent]
```

---

## Friend Status Values

| Value | Trigger | Source |
|---|---|---|
| `"ACTIVE"` | User follows the bot | `follow` LINE webhook event |
| `"BLOCKED"` | User blocks the bot | `join`/block LINE event |
| `"DELETED"` | User unfollows the bot | `unfollow` LINE webhook event |

Stored in `User.friend_status` (plain `String` column, no enum).
Updated by the webhook handler in `backend/app/api/v1/endpoints/webhook.py`.

---

## Convention: Canned Response Categories

| Category | Used for |
|---|---|
| `"info"` | General information (default) |
| `"greeting"` | Opening messages |
| `"closing"` | Session wrap-up messages |
| `"escalation"` | Handoff or delay notifications |

These are conventions only — no enum or DB constraint enforces them.

---

## Known Gaps Summary

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | `usage_count` never incremented | Medium | Call `increment_usage()` in WS send_message handler |
| GAP-2 | No `DELETE /admin/tags/{tag_id}` endpoint | Low | Add endpoint with cascade-aware delete |
| GAP-3 | Friends endpoints have no auth | Medium | Add `get_current_admin` dependency |
| GAP-4 | No frontend pages for tags/canned responses | Low | Build with skn-admin-component |
| GAP-5 | No keyword search on canned responses | Low | Add `search` query param with `ilike` |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/api/v1/endpoints/admin_canned_responses.py` | Canned response CRUD endpoints |
| `backend/app/api/v1/endpoints/admin_tags.py` | Tag CRUD + assign/remove endpoints |
| `backend/app/api/v1/endpoints/admin_friends.py` | Friend list + event history |
| `backend/app/models/canned_response.py` | `CannedResponse` model |
| `backend/app/models/tag.py` | `Tag` + `UserTag` models |
| `backend/app/services/canned_response_service.py` | Canned response service |
| `backend/app/services/tag_service.py` | Tag service (create, assign, remove) |
| `backend/app/services/friend_service.py` | Friend list + event history service |
