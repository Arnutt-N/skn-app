---
name: skn-reply-auto
description: >
  Manages reply objects, auto-reply rules, and conversation export in the SKN App.
  Reply objects are reusable message templates identified by $object_id (e.g. $flex_traffic).
  Auto-replies are legacy keyword-triggered rules that predate the intent manager.
  Export produces CSV or PDF conversation transcripts for admins.
  Use when asked to "create reply object", "add flex template", "auto-reply rule",
  "keyword reply", "export conversation", "download chat CSV", "export PDF transcript",
  "สร้าง reply object", "ตั้งค่า auto reply", "export บทสนทนา", "$flex_traffic",
  "reply_objects", "auto_replies", "admin_export".
  Do NOT use for intent/chatbot management (skn-intent-manager), live chat sessions
  (skn-live-chat-ops), or canned responses (skn-operator-tools).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend, PostgreSQL.
  PDF export additionally requires: pip install reportlab
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [reply-objects, auto-reply, export, legacy, keyword-matching]
  related-skills:
    - skn-intent-manager
    - skn-line-flex-builder
    - skn-operator-tools
  documentation: ./references/reply_auto_reference.md
---

# skn-reply-auto

Three admin data management features:

1. **Reply Objects** (`admin_reply_objects.py`) — reusable message templates stored
   in the DB and referenced via `$object_id` syntax in auto-reply responses.
2. **Auto Replies** (`admin_auto_replies.py`) — legacy keyword-triggered rules that
   run alongside (or instead of) the intent manager. Each rule matches a keyword and
   responds with a message type.
3. **Export** (`admin_export.py`) — download a LINE conversation as CSV or PDF.

---

## CRITICAL: Project-Specific Rules

1. **Reply objects use string `object_id` as the route key, not integer PK** —
   every GET/PUT/DELETE route uses `/{object_id}` (e.g. `"flex_traffic"`), not `/{id}`.
   The integer `id` column exists but is never used in API routes. Do not confuse them.

2. **`$object_id` syntax in auto-reply `text_content`** — when `reply_type = "text"`,
   the `text_content` field can contain tokens like `$flex_traffic` or `$image_contact`.
   The webhook handler (see `skn-webhook-handler`) resolves these tokens into actual
   message objects before sending. Always use the `object_id` value without the `$` prefix
   when creating the ReplyObject; the `$` is only used in the `text_content` reference.

3. **Schema/model enum mismatch for `MatchType`** — the Pydantic schema
   (`schemas/auto_reply.py`) defines `STARTS_WITH` in `MatchTypeEnum`, but the SQLAlchemy
   model (`models/auto_reply.py`) does NOT have `STARTS_WITH` in `MatchType`. Sending
   `match_type="starts_with"` will cause a DB-level error. Only use: `exact`,
   `contains`, `regex`. See GAP-1.

4. **Schema/model enum mismatch for `ReplyType`** — the Pydantic schema only defines
   5 types (`TEXT`, `FLEX`, `IMAGE`, `STICKER`, `VIDEO`), but the DB model has 9
   (`TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `LOCATION`, `STICKER`, `FLEX`, `TEMPLATE`,
   `IMAGEMAP`). Types `AUDIO`, `LOCATION`, `TEMPLATE`, `IMAGEMAP` can be stored in
   the DB but cannot be submitted via the API schema as-is.

5. **`ObjectType` has `IMAGEMAP` in model but not in schema** — `models/reply_object.py`
   defines `IMAGEMAP` in `ObjectType`, but `schemas/reply_object.py` `ObjectTypeEnum`
   does not include it. Sending `object_type="imagemap"` via API will fail Pydantic
   validation.

6. **Both `admin_reply_objects.py` and `admin_auto_replies.py` have NO auth** —
   neither uses `get_current_admin`. All CRUD operations are unauthenticated. See GAP-2.

7. **Auto-replies are a LEGACY system** — the intent manager (`skn-intent-manager`)
   is the primary chatbot system. Auto-replies predate it and may conflict. If both
   are active, the webhook handler applies them in a defined priority order. Check
   `webhook.py` / `skn-webhook-handler` for the resolution order.

8. **Export requires `get_current_admin`** — unlike reply_objects and auto_replies,
   both CSV and PDF export endpoints use `Depends(get_current_admin)`.

9. **PDF export has an optional `reportlab` dependency** — if `reportlab` is not
   installed, `GET .../pdf` returns HTTP 500 with `"PDF export dependency not installed"`.
   Install with `pip install reportlab` and add to `requirements.txt`.

10. **CSV uses `utf-8-sig` encoding** — the BOM (`\ufeff`) is prepended so Excel
    opens the file without encoding issues. `data = buffer.getvalue().encode("utf-8-sig")`.

11. **Export filename is sanitized and date-ranged** — format:
    `{display_name}_{YYYYMMDD}-{YYYYMMDD}.{ext}`. Characters that are not alphanumeric,
    `-`, or `_` are replaced with `_`. Max 80 chars for the display_name portion.

---

## Context7 Docs

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | StreamingResponse, Response, HTTPException |
| SQLAlchemy | `"sqlalchemy"` | JSONB, UUID, Enum, async select |
| Pydantic | `"pydantic"` | Enum validation, model_dump(exclude_unset=True) |

---

## Step 1 — Reply Objects (`/admin/reply-objects`)

**File:** `backend/app/api/v1/endpoints/admin_reply_objects.py`
**Registered at:** `api.py` → `prefix="/admin/reply-objects", tags=["admin"]`
**Auth:** ❌ None

### Endpoints

```python
GET    /admin/reply-objects          # list, optional ?category=&object_type=
GET    /admin/reply-objects/{object_id}   # get by string object_id (not int)
POST   /admin/reply-objects          # create (400 if object_id duplicate)
PUT    /admin/reply-objects/{object_id}   # update (fields in update_data)
DELETE /admin/reply-objects/{object_id}  # hard delete (not soft)
```

### Create Example

```python
# POST /admin/reply-objects
{
    "object_id": "flex_traffic",         # unique string — referenced as $flex_traffic
    "name": "Traffic Update Card",
    "category": "transport",
    "object_type": "flex",               # "text"|"flex"|"image"|"sticker"|"video"|"audio"|"location"
    "payload": {                         # JSONB — structure by object_type:
        "type": "bubble",                #   FLEX: full Flex Message bubble/carousel JSON
        "body": { ... }                  #   IMAGE: {"url": "...", "preview_url": "..."}
    },                                   #   STICKER: {"package_id": "...", "sticker_id": "..."}
    "alt_text": "Traffic update",        #   LOCATION: {"title":"...", "address":"...", "latitude":0, "longitude":0}
    "preview_url": "https://..."
}
```

### Update: uses `model_dump(exclude_unset=True)` + `setattr` loop

```python
update_data = data.model_dump(exclude_unset=True)
for field, value in update_data.items():
    if field == "object_type" and value:
        value = ObjectType(value)    # convert string → enum
    setattr(obj, field, value)
await db.commit()
await db.refresh(obj)
```

### Model

```python
class ObjectType(str, enum.Enum):
    TEXT = "text"; FLEX = "flex"; IMAGE = "image"; STICKER = "sticker"
    VIDEO = "video"; AUDIO = "audio"; LOCATION = "location"; IMAGEMAP = "imagemap"

class ReplyObject(Base):
    __tablename__ = "reply_objects"
    id          = Column(Integer, primary_key=True)     # NOT used in API routes
    object_id   = Column(String(100), unique=True)      # ← route key: "flex_traffic"
    name        = Column(String(255), nullable=False)
    category    = Column(String(100), nullable=True)
    object_type = Column(Enum(ObjectType), nullable=False)
    payload     = Column(JSONB, nullable=False)          # structure by type
    alt_text    = Column(String(400), nullable=True)
    preview_url = Column(String(500), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## Step 2 — Auto Replies (`/admin/auto-replies`)

**File:** `backend/app/api/v1/endpoints/admin_auto_replies.py`
**Registered at:** `api.py` → `prefix="/admin/auto-replies", tags=["admin"]`
**Auth:** ❌ None

### Endpoints

```python
GET    /admin/auto-replies            # list, optional ?keyword= search
GET    /admin/auto-replies/{id}       # get by int id
POST   /admin/auto-replies            # create (400 if keyword duplicate)
PUT    /admin/auto-replies/{id}       # update
DELETE /admin/auto-replies/{id}       # hard delete
```

### Create Example

```python
# POST /admin/auto-replies
{
    "keyword": "สวัสดี",
    "match_type": "contains",         # ONLY: "exact"|"contains"|"regex"
                                      # DO NOT use "starts_with" — not in model enum
    "reply_type": "text",             # "text"|"flex"|"image"|"sticker"|"video"
    "text_content": "สวัสดีครับ! $flex_menu",  # can reference $object_id tokens
    "payload": null                   # for direct Flex payload (legacy)
}
```

### $object_id Reference in text_content

```python
# text_content with $object_id reference:
"text_content": "ดูข้อมูลเพิ่มเติม $flex_traffic"
# → webhook handler resolves $flex_traffic by querying ReplyObject with object_id="flex_traffic"
# → sends the Flex bubble stored in ReplyObject.payload

# text_content without reference (plain text):
"text_content": "สวัสดีครับ ยินดีให้บริการ"
# → sent as a TextMessage
```

### Model

```python
class MatchType(str, enum.Enum):
    EXACT = "exact"; CONTAINS = "contains"; REGEX = "regex"
    # NO STARTS_WITH — do not use it

class ReplyType(str, enum.Enum):
    TEXT = "text"; IMAGE = "image"; VIDEO = "video"; AUDIO = "audio"
    LOCATION = "location"; STICKER = "sticker"; FLEX = "flex"
    TEMPLATE = "template"; IMAGEMAP = "imagemap"

class AutoReply(Base):
    __tablename__ = "auto_replies"
    id           = Column(Integer, primary_key=True)
    keyword      = Column(String, unique=True, index=True)
    match_type   = Column(Enum(MatchType), default=MatchType.CONTAINS)
    reply_type   = Column(Enum(ReplyType), nullable=False)
    text_content = Column(Text, nullable=True)       # may contain $object_id refs
    media_id     = Column(UUID(as_uuid=True), ForeignKey("media_files.id"), nullable=True)
    payload      = Column(JSONB, nullable=True)       # direct Flex payload (legacy)
    is_active    = Column(Boolean, default=True)
```

---

## Step 3 — Export (`/admin/export`)

**File:** `backend/app/api/v1/endpoints/admin_export.py`
**Registered at:** `api.py` → `prefix="/admin/export", tags=["admin"]`
**Auth:** ✅ `get_current_admin` required

### Endpoints

```python
GET /admin/export/conversations/{line_user_id}/csv    # CSV transcript
GET /admin/export/conversations/{line_user_id}/pdf    # PDF transcript
```

### CSV Export

```python
# Response: StreamingResponse
# Content-Type: text/csv; charset=utf-8
# Filename: {name}_{YYYYMMDD}-{YYYYMMDD}.csv
# Encoding: utf-8-sig (BOM for Excel)

# Columns:
["timestamp", "line_user_id", "direction", "sender", "message_type", "content"]

# Returns 404 if conversation has no messages
```

### PDF Export

```python
# Requires: pip install reportlab
# Response: Response (bytes)
# Content-Type: application/pdf
# Filename: {name}_{YYYYMMDD}-{YYYYMMDD}.pdf

# PDF structure:
# - Header: "Conversation Export: {display_name}"
# - LINE User ID + generated timestamp
# - One line per message: [{timestamp}] {direction}/{sender} ({type}) {content}
# - Content truncated at 180 chars
# - Multi-page support (new page when y < 48)

# Returns 500 if reportlab not installed:
# {"detail": "PDF export dependency not installed"}
```

### Filename Construction

```python
def _build_export_filename(display_name, messages, extension):
    # Sanitize: keep alphanumeric, '-', '_'; replace others with '_'; max 80 chars
    safe_name = _sanitize_filename(display_name)
    start = messages[0].created_at.strftime("%Y%m%d")
    end   = messages[-1].created_at.strftime("%Y%m%d")
    return f"{safe_name}_{start}-{end}.{extension}"
    # Example: "สมชาย_วงศ์ใหญ่" → "______20260101-20260115.csv"
    # Example: "Admin-Test" → "Admin-Test_20260101-20260115.pdf"
```

---

## Step 4 — Reply Object + Auto Reply Interaction

How the two systems connect:

```
Admin creates ReplyObject:
  POST /admin/reply-objects
  {"object_id": "flex_faq", "object_type": "flex", "payload": {...}}

Admin creates AutoReply referencing it:
  POST /admin/auto-replies
  {"keyword": "คำถาม", "match_type": "contains", "reply_type": "text",
   "text_content": "ดูคำถามที่พบบ่อย $flex_faq"}

User sends "มีคำถาม":
  Webhook handler → MatchType.CONTAINS match on "คำถาม"
  → parse_response() extracts $flex_faq token
  → queries reply_objects WHERE object_id = "flex_faq"
  → sends Flex bubble from ReplyObject.payload
```

See `skn-webhook-handler` for the full `parse_response()` and `resolve_payload_urls()` pipeline.

---

## Step 5 — Add a New Reply Object Type (e.g., BUTTON_TEMPLATE)

If extending `ObjectType` to support a new type:

**5a — Add to model enum** (`models/reply_object.py`):
```python
class ObjectType(str, enum.Enum):
    ...
    BUTTON_TEMPLATE = "button_template"
```

**5b — Add to schema enum** (`schemas/reply_object.py`):
```python
class ObjectTypeEnum(str, Enum):
    ...
    BUTTON_TEMPLATE = "button_template"
```

**5c — Run Alembic migration to update the Postgres enum type**:
```python
# In migration upgrade():
op.execute("ALTER TYPE objecttype ADD VALUE 'button_template'")
```
See `skn-migration-helper` — enum ALTER TYPE pattern.

**5d — Document payload structure** for the new type in the skill/comments.

---

## Known Gaps

### GAP-1: `STARTS_WITH` in schema but not in model enum
`schemas/auto_reply.py` defines `MatchTypeEnum.STARTS_WITH = "starts_with"` but
`models/auto_reply.py` `MatchType` has no `STARTS_WITH`. Sending this value passes
Pydantic validation but fails at `MatchType(data.match_type.value)` in the endpoint.
**Fix:** Either add `STARTS_WITH = "starts_with"` to the model enum + Alembic migration,
or remove it from the schema.

### GAP-2: No auth on reply_objects and auto_replies endpoints
Both CRUD endpoint files have no `get_current_admin` dependency.
**Fix:** Add `current_user: User = Depends(get_current_admin)` to each endpoint.

### GAP-3: `IMAGEMAP` missing from schema ObjectTypeEnum
Model has `ObjectType.IMAGEMAP` but schema `ObjectTypeEnum` does not. Cannot create
an imagemap reply object via the API.
**Fix:** Add `IMAGEMAP = "imagemap"` to `ObjectTypeEnum` in `schemas/reply_object.py`.

### GAP-4: `reportlab` not in requirements.txt
PDF export will fail with 500 in production if `reportlab` is not installed.
**Fix:** Add `reportlab` to `backend/requirements.txt`.

### GAP-5: Auto-reply `keyword` uniqueness is per-keyword, not per-rule
A keyword can only have one auto-reply rule. Sending the same keyword twice returns 400.
If multiple responses for the same keyword are needed, use the intent manager instead
(see `skn-intent-manager` — supports multiple responses per intent).

### GAP-6: `media_id` FK on AutoReply never populated via API
`AutoReply.media_id` (UUID FK to `media_files`) exists in the model for Image/Video/Audio
replies, but the API schema has no `media_id` field. There is no way to set it via
the REST endpoint.
**Fix:** Add `media_id: Optional[str] = None` to `AutoReplyCreate`/`AutoReplyUpdate`.

---

## Common Issues

### `POST /admin/auto-replies` returns 500 on `match_type="starts_with"`
**Cause:** GAP-1 — `STARTS_WITH` not in model enum. Pydantic accepts it but DB rejects it.
**Fix:** Use only `"exact"`, `"contains"`, or `"regex"`.

### `POST /admin/reply-objects` returns 422 on `object_type="imagemap"`
**Cause:** GAP-3 — `imagemap` not in `ObjectTypeEnum` schema.
**Fix:** Use one of the 7 defined types or add `IMAGEMAP` to schema enum.

### `GET .../pdf` returns 500 with "PDF export dependency not installed"
**Cause:** GAP-4 — `reportlab` not installed.
**Fix:** `pip install reportlab` and add to `requirements.txt`.

### Reply object `$object_id` token not resolved in webhook
**Cause:** The `object_id` value used in `text_content` does not match an existing
`ReplyObject.object_id` in the DB.
**Fix:** Verify the exact `object_id` string. Query `GET /admin/reply-objects` to
list all objects and check `object_id` values.

### Auto-reply not triggering for user message
**Cause 1:** Intent manager takes priority and matches first (see `skn-webhook-handler`).
**Cause 2:** `is_active=False` — check the rule is active.
**Cause 3:** `match_type="regex"` with invalid regex pattern.
**Fix:** Check the webhook handler's matching priority chain.

---

## Quality Checklist

Before finishing, verify:
- [ ] Reply object routes use `object_id` string param (not int `id`)
- [ ] `$object_id` token in `text_content` matches an existing `ReplyObject.object_id`
- [ ] `match_type` is one of `exact|contains|regex` — never `starts_with`
- [ ] `reply_type` is one of the 5 schema-valid types — not `audio|location|template|imagemap`
- [ ] `reportlab` in `requirements.txt` if PDF export is needed
- [ ] New `ObjectType` or `MatchType` enum values require both schema AND model update + Alembic migration
- [ ] Export endpoints use `get_current_admin` (unlike reply_objects/auto_replies)
- [ ] CSV files use `utf-8-sig` encoding for Excel compatibility
