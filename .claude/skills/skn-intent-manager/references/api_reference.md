# Intent Manager — API & Schema Reference

Extracted from `backend/app/api/v1/endpoints/admin_intents.py`,
`backend/app/models/intent.py`, and `backend/app/schemas/intent.py`.

---

## API Endpoints

All routes under prefix `/api/v1/admin/intents` (registered in `api.py`).

### Categories

| Method | Path | Body Schema | Response Schema | Notes |
|---|---|---|---|---|
| `GET` | `/categories` | — | `List[IntentCategoryResponse]` | Includes `keyword_count`, `response_count`, `keywords_preview` (first 5) |
| `POST` | `/categories` | `IntentCategoryCreate` | `IntentCategoryResponse` | 400 if name already exists |
| `GET` | `/categories/{id}` | — | `IntentCategoryDetailResponse` | Full keywords + responses via selectinload |
| `PUT` | `/categories/{id}` | `IntentCategoryUpdate` | `IntentCategoryResponse` | Partial update (exclude_unset) |
| `DELETE` | `/categories/{id}` | — | 204 | Cascades to keywords + responses |

### Keywords

| Method | Path | Body Schema | Response Schema | Notes |
|---|---|---|---|---|
| `POST` | `/keywords` | `IntentKeywordCreate` | `IntentKeywordResponse` | `category_id` required |
| `PUT` | `/keywords/{id}` | `IntentKeywordUpdate` | `IntentKeywordResponse` | Partial update |
| `DELETE` | `/keywords/{id}` | — | 204 | |

### Responses

| Method | Path | Body Schema | Response Schema | Notes |
|---|---|---|---|---|
| `POST` | `/responses` | `IntentResponseCreate` | `IntentResponseResponse` | `category_id` required |
| `PUT` | `/responses/{id}` | `IntentResponseUpdate` | `IntentResponseResponse` | Partial update |
| `DELETE` | `/responses/{id}` | — | 204 | |

---

## Enum Values

### MatchType (`backend/app/models/intent.py`)

| Enum Member | DB Value | Webhook Behaviour |
|---|---|---|
| `EXACT` | `"exact"` | `keyword == text` (case-sensitive) |
| `CONTAINS` | `"contains"` | `text ILIKE '%keyword%'` (case-insensitive) |
| `STARTS_WITH` | `"starts_with"` | Reserved — not yet implemented in webhook |
| `REGEX` | `"regex"` | Reserved — not yet implemented in webhook |

### ReplyType (`backend/app/models/intent.py`)

| Enum Member | DB Value | Webhook Handling |
|---|---|---|
| `TEXT` | `"text"` | `TextMessage(text=text_content)` |
| `FLEX` | `"flex"` | `FlexMessage(contents=FlexContainer.from_dict(payload))` |
| `IMAGE` | `"image"` | Handled via `parse_response()` |
| `STICKER` | `"sticker"` | Handled via `parse_response()` |
| `VIDEO` | `"video"` | Handled via `parse_response()` |
| `TEMPLATE` | `"template"` | `FlexMessage` path (same as flex) |
| `AUDIO` | `"audio"` | Defined in model, not in frontend REPLY_TYPES array |
| `LOCATION` | `"location"` | Defined in model, not in frontend REPLY_TYPES array |
| `IMAGEMAP` | `"imagemap"` | Defined in model, not in frontend REPLY_TYPES array |

Frontend `REPLY_TYPES` array: `['text', 'flex', 'image', 'sticker', 'video']`

---

## Pydantic Schemas

### IntentCategoryCreate
```python
name: str            # required, min=1, max=255, must be unique
description: str     # optional
is_active: bool      # default True
```

### IntentCategoryUpdate
```python
name: Optional[str]
description: Optional[str]
is_active: Optional[bool]
# All fields optional — uses exclude_unset=True
```

### IntentCategoryResponse
```python
id: int
name: str
description: Optional[str]
is_active: bool
created_at: datetime
keyword_count: int          # computed via separate scalar query
response_count: int         # computed via separate scalar query
keywords_preview: List[str] # first 5 keywords, computed manually
```

### IntentCategoryDetailResponse (extends IntentCategoryResponse)
```python
keywords: List[IntentKeywordResponse]   # loaded via selectinload
responses: List[IntentResponseResponse] # loaded via selectinload
```

### IntentKeywordCreate
```python
keyword: str              # required, min=1, max=255
match_type: MatchTypeEnum # default "contains"
category_id: int          # required
```

### IntentKeywordUpdate
```python
keyword: Optional[str]
match_type: Optional[MatchTypeEnum]
```

### IntentResponseCreate
```python
reply_type: ReplyTypeEnum  # default "text"
text_content: Optional[str]
media_id: Optional[UUID]
payload: Optional[Dict[str, Any]]  # JSONB — flex/template container dict
order: int                 # default 0 (send order, lower = first)
is_active: bool            # default True
category_id: int           # required
```

### IntentResponseUpdate
```python
reply_type: Optional[ReplyTypeEnum]
text_content: Optional[str]
media_id: Optional[UUID]
payload: Optional[Dict[str, Any]]
order: Optional[int]
is_active: Optional[bool]
```

---

## SQLAlchemy Model Details

### Cascade Delete

Both `IntentKeyword` and `IntentResponse` use:
```python
category_id = Column(Integer, ForeignKey("intent_categories.id", ondelete="CASCADE"))
```

And `IntentCategory` defines the relationships with:
```python
keywords = relationship("IntentKeyword", back_populates="category", cascade="all, delete-orphan")
responses = relationship("IntentResponse", back_populates="category", cascade="all, delete-orphan")
```

### selectinload Pattern

Always use `selectinload` for detail queries. Never access `.keywords` or `.responses`
without it in async context — it will raise `MissingGreenlet`.

```python
from sqlalchemy.orm import selectinload

stmt = select(IntentCategory).options(
    selectinload(IntentCategory.keywords),
    selectinload(IntentCategory.responses)
).filter(IntentCategory.id == cat_id)
```

For conditional loading (active responses only in webhook):
```python
selectinload(IntentCategory.responses.and_(IntentResponse.is_active == True))
```

### Count Enrichment

The list endpoint adds computed fields manually (Pydantic can't compute these from
SQLAlchemy relationships in async):

```python
k_count = await db.scalar(
    select(func.count(IntentKeyword.id))
    .filter(IntentKeyword.category_id == cat.id)
)
resp = IntentCategoryResponse.model_validate(cat)
resp.keyword_count = k_count
```

---

## Frontend Constants

Defined inline in `frontend/app/admin/auto-replies/[id]/page.tsx`:

```typescript
const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex'];
const REPLY_TYPES = ['text', 'flex', 'image', 'sticker', 'video'];
```

---

## Webhook Integration Points (`webhook.py`)

| Step | Query | Priority |
|---|---|---|
| EXACT match | `IntentKeyword.keyword == text AND match_type == EXACT` | 1 (highest) |
| CONTAINS match | `literal(text).ilike('%' + keyword + '%') AND match_type == CONTAINS` | 2 |
| Legacy AutoReply EXACT | `AutoReply.keyword == text` | 3 |
| Legacy AutoReply CONTAINS | `literal(text).ilike('%' + keyword + '%')` | 4 (lowest) |

**Response build limit:** `if len(all_messages) >= 5: break`

**Flex payload preprocessing (in webhook):**
```python
from app.utils.url_utils import resolve_payload_urls, strip_flex_body
resolved = resolve_payload_urls(payload)   # convert relative media URLs to absolute
stripped = strip_flex_body(resolved)       # strip outer wrapper if present
container = FlexContainer.from_dict(stripped)
```

---

## Frontend Page Locations

| Page | File | Purpose |
|---|---|---|
| Category list | `frontend/app/admin/auto-replies/page.tsx` | Table with status toggle + create modal |
| Category detail | `frontend/app/admin/auto-replies/[id]/page.tsx` | Keyword + response management |
| Chatbot overview | `frontend/app/admin/chatbot/page.tsx` | Stats cards + recent intents |
