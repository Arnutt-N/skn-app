# Reply Objects, Auto Replies & Export — Reference

Sources: `admin_reply_objects.py`, `admin_auto_replies.py`, `admin_export.py`,
`models/reply_object.py`, `models/auto_reply.py`,
`schemas/reply_object.py`, `schemas/auto_reply.py`

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/reply-objects` | ❌ | List (filter: `category`, `object_type`) |
| `GET` | `/admin/reply-objects/{object_id}` | ❌ | Get by string object_id |
| `POST` | `/admin/reply-objects` | ❌ | Create (400 on duplicate object_id) |
| `PUT` | `/admin/reply-objects/{object_id}` | ❌ | Update fields |
| `DELETE` | `/admin/reply-objects/{object_id}` | ❌ | Hard delete |
| `GET` | `/admin/auto-replies` | ❌ | List (filter: `keyword` search) |
| `GET` | `/admin/auto-replies/{id}` | ❌ | Get by int id |
| `POST` | `/admin/auto-replies` | ❌ | Create (400 on duplicate keyword) |
| `PUT` | `/admin/auto-replies/{id}` | ❌ | Update fields |
| `DELETE` | `/admin/auto-replies/{id}` | ❌ | Hard delete |
| `GET` | `/admin/export/conversations/{line_user_id}/csv` | ✅ admin | Download CSV |
| `GET` | `/admin/export/conversations/{line_user_id}/pdf` | ✅ admin | Download PDF (needs reportlab) |

---

## ReplyObject Model

**File:** `backend/app/models/reply_object.py`

```python
class ObjectType(str, enum.Enum):
    TEXT     = "text"
    FLEX     = "flex"
    IMAGE    = "image"
    STICKER  = "sticker"
    VIDEO    = "video"
    AUDIO    = "audio"
    LOCATION = "location"
    IMAGEMAP = "imagemap"   # ← in model but NOT in schema enum

class ReplyObject(Base):
    __tablename__ = "reply_objects"
    id          = Column(Integer, primary_key=True)   # NOT used in API routes
    object_id   = Column(String(100), unique=True)    # route key: "flex_traffic"
    name        = Column(String(255))
    category    = Column(String(100), nullable=True)
    object_type = Column(Enum(ObjectType))
    payload     = Column(JSONB)
    alt_text    = Column(String(400), nullable=True)
    preview_url = Column(String(500), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## ReplyObject Schema

**File:** `backend/app/schemas/reply_object.py`

```python
class ObjectTypeEnum(str, Enum):  # Pydantic schema enum
    TEXT     = "text"
    FLEX     = "flex"
    IMAGE    = "image"
    STICKER  = "sticker"
    VIDEO    = "video"
    AUDIO    = "audio"
    LOCATION = "location"
    # IMAGEMAP missing — cannot create imagemap via API (GAP-3)

class ReplyObjectCreate(BaseModel):
    object_id:   str              # max 100 chars, unique
    name:        str              # max 255 chars
    category:    Optional[str]    # max 100 chars
    object_type: ObjectTypeEnum
    payload:     Dict[str, Any]   # JSONB structure by type (see below)
    alt_text:    Optional[str]    # max 400
    preview_url: Optional[str]    # max 500

class ReplyObjectUpdate(BaseModel):
    name:        Optional[str]
    category:    Optional[str]
    object_type: Optional[ObjectTypeEnum]
    payload:     Optional[Dict[str, Any]]
    alt_text:    Optional[str]
    preview_url: Optional[str]
    is_active:   Optional[bool]
    # Note: object_id is NOT updatable via PUT

class ReplyObjectResponse(ReplyObjectCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True
```

---

## Payload Structure by ObjectType

```python
# FLEX — full Flex Message bubble or carousel JSON
{"type": "bubble", "body": {"type": "box", ...}}
{"type": "carousel", "contents": [...]}

# IMAGE
{"url": "https://...", "preview_url": "https://..."}

# STICKER
{"package_id": "11537", "sticker_id": "52002734"}

# LOCATION
{"title": "สำนักงาน", "address": "กรุงเทพ", "latitude": 13.75, "longitude": 100.52}

# TEXT
{"content": "ข้อความตัวอย่าง"}

# VIDEO
{"original_content_url": "https://...", "preview_image_url": "https://..."}

# AUDIO
{"original_content_url": "https://...", "duration": 5000}
```

---

## AutoReply Model

**File:** `backend/app/models/auto_reply.py`

```python
class MatchType(str, enum.Enum):  # DB enum
    EXACT    = "exact"
    CONTAINS = "contains"
    REGEX    = "regex"
    # NO STARTS_WITH — schema has it but model does not (GAP-1)

class ReplyType(str, enum.Enum):  # DB enum (9 values)
    TEXT     = "text";    IMAGE    = "image"
    VIDEO    = "video";   AUDIO    = "audio"
    LOCATION = "location"; STICKER = "sticker"
    FLEX     = "flex";    TEMPLATE = "template"
    IMAGEMAP = "imagemap"

class AutoReply(Base):
    __tablename__ = "auto_replies"
    id           = Column(Integer, primary_key=True)
    keyword      = Column(String, unique=True, index=True)
    match_type   = Column(Enum(MatchType), default=MatchType.CONTAINS)
    reply_type   = Column(Enum(ReplyType), nullable=False)
    text_content = Column(Text, nullable=True)       # may contain $object_id
    media_id     = Column(UUID(as_uuid=True), ForeignKey("media_files.id"), nullable=True)
    payload      = Column(JSONB, nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## AutoReply Schema

**File:** `backend/app/schemas/auto_reply.py`

```python
class MatchTypeEnum(str, Enum):  # Pydantic (has extra STARTS_WITH — GAP-1)
    EXACT       = "exact"
    CONTAINS    = "contains"
    STARTS_WITH = "starts_with"   # ← NOT in model enum, causes DB error
    REGEX       = "regex"

class ReplyTypeEnum(str, Enum):  # Pydantic (subset of model — 5 of 9 types)
    TEXT    = "text"
    FLEX    = "flex"
    IMAGE   = "image"
    STICKER = "sticker"
    VIDEO   = "video"
    # Missing: AUDIO, LOCATION, TEMPLATE, IMAGEMAP

class AutoReplyCreate(BaseModel):
    keyword:      str              # max 255, must be unique
    match_type:   MatchTypeEnum    # default "contains"
    reply_type:   ReplyTypeEnum    # default "text"
    text_content: Optional[str]    # may include $object_id tokens
    payload:      Optional[Dict[str, Any]]  # direct Flex payload (legacy)
```

---

## Enum Mismatch Summary

⚠️ Critical discrepancies between model (DB) and schema (API):

| Field | Model enum values | Schema enum values | Impact |
|---|---|---|---|
| `MatchType` | `exact, contains, regex` | `exact, contains, starts_with, regex` | `starts_with` → DB error |
| `ReplyType` | 9 values | 5 values | `audio/location/template/imagemap` → schema reject |
| `ObjectType` | 8 values (incl. `imagemap`) | 7 values (no `imagemap`) | `imagemap` → schema reject |

---

## Export — CSV Columns

```
timestamp, line_user_id, direction, sender, message_type, content
```

- `direction`: `"INCOMING"` or `"OUTGOING"` (from `MessageDirection` enum)
- `sender`: `message.sender_role.value` (e.g., `"BOT"`, `"OPERATOR"`, `"USER"`)
- `message_type`: stored string, e.g., `"text"`, `"image"`
- Encoding: `utf-8-sig` (Excel-compatible BOM)

## Export — PDF Structure

```
Line 1: "Conversation Export: {display_name}"
Line 2: "LINE User ID: {line_user_id}"
Line 3: "Generated UTC: {iso_timestamp}"
Line 4: (blank)
Line N: "[{ISO timestamp}] {direction}/{sender_role} ({message_type}) {content[:180]}"
```

- Font: Helvetica 9pt (no Thai font support — Thai text may not render correctly)
- Page size: A4
- New page when `y < 48`

## Export — Filename Pattern

```python
# Input: display_name="สมชาย วงศ์ใหญ่", first_msg=2026-01-01, last_msg=2026-01-15
# Sanitize: keep [a-zA-Z0-9-_], replace others with '_'
# Result: "______20260101-20260115.csv"  (Thai chars → underscores)

# Input: display_name="Admin-Test"
# Result: "Admin-Test_20260101-20260115.pdf"
```

---

## Reply Object + Auto Reply — Integration Flow

```
1. Create ReplyObject:
   POST /admin/reply-objects
   {"object_id": "flex_faq", "object_type": "flex", "payload": {<bubble JSON>}}

2. Create AutoReply:
   POST /admin/auto-replies
   {"keyword": "คำถาม", "match_type": "contains", "reply_type": "text",
    "text_content": "ดูข้อมูลเพิ่มเติม $flex_faq"}

3. User sends: "มีคำถามอยากถาม"
   → Webhook → MatchType.CONTAINS("คำถาม") match
   → parse_response("ดูข้อมูลเพิ่มเติม $flex_faq") → extract token "flex_faq"
   → resolve_payload_urls() → query ReplyObject WHERE object_id="flex_faq"
   → send Flex bubble from ReplyObject.payload
```

---

## Known Gaps Summary

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | `STARTS_WITH` in schema, not in model | High | Add to model enum + migration, or remove from schema |
| GAP-2 | No auth on reply_objects/auto_replies | Medium | Add `get_current_admin` |
| GAP-3 | `IMAGEMAP` missing from schema ObjectTypeEnum | Low | Add to schema |
| GAP-4 | `reportlab` not in requirements.txt | Medium | `pip install reportlab` + add to requirements.txt |
| GAP-5 | One keyword → one rule only | Low | Use intent manager for multi-response |
| GAP-6 | `media_id` on AutoReply not settable via API | Low | Add `media_id` field to schema |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/api/v1/endpoints/admin_reply_objects.py` | ReplyObject CRUD (string object_id key) |
| `backend/app/api/v1/endpoints/admin_auto_replies.py` | AutoReply CRUD (legacy keyword rules) |
| `backend/app/api/v1/endpoints/admin_export.py` | CSV + PDF conversation export |
| `backend/app/models/reply_object.py` | `ReplyObject` + `ObjectType` enum |
| `backend/app/models/auto_reply.py` | `AutoReply` + `MatchType` + `ReplyType` enums |
| `backend/app/schemas/reply_object.py` | Pydantic schemas (note: IMAGEMAP missing) |
| `backend/app/schemas/auto_reply.py` | Pydantic schemas (note: STARTS_WITH mismatch) |
