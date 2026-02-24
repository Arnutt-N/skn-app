---
name: skn-intent-manager
description: >
  Creates, modifies, or debugs the chatbot intent system in the SKN App —
  covering intent categories, keywords, responses, and the webhook matching
  pipeline. Use when asked to "create intent", "add auto-reply category",
  "configure chatbot response", "add keyword trigger", "สร้าง intent",
  "เพิ่ม auto-reply", "ตั้งค่า chatbot", "เพิ่ม keyword", "สร้าง category",
  "แก้ chatbot ตอบ", "bot ไม่ตอบ", "intent ไม่ทำงาน".
  Do NOT use for LINE flex message building (use skn-line-flex-builder),
  live chat WebSocket (use skn-live-chat-ops), or LIFF endpoints.
license: MIT
compatibility: >
  SKN App (JskApp) backend + frontend. FastAPI async, SQLAlchemy 2.0,
  Next.js 16 / React 19. Routes: /api/v1/admin/intents/*
  Frontend: /admin/auto-replies, /admin/auto-replies/[id]
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: line-integration
  tags: [intent, chatbot, auto-reply, keyword, line-bot]
---

# skn-intent-manager

Manages the SKN App chatbot intent system: a three-model hierarchy
(Category → Keywords + Responses) that powers keyword-triggered auto-replies
on the LINE OA bot.

---

## CRITICAL: Project-Specific Rules

1. **Three models, two children** — `IntentCategory` is the parent. `IntentKeyword` and `IntentResponse` are its children, both with `ondelete="CASCADE"`. Deleting a category removes all its keywords and responses automatically.
2. **Always `selectinload` for detail** — never lazy-load in async SQLAlchemy. Use `selectinload(IntentCategory.keywords)` + `selectinload(IntentCategory.responses)` in the detail query.
3. **Category name is unique** — check uniqueness before creating: `select(IntentCategory).filter(name == data.name)`.
4. **`model_validate` for enriched responses** — when a response schema has computed fields (e.g., `keyword_count`), use `IntentCategoryResponse.model_validate(cat)` then set the extra fields manually. `.model_dump()` + constructor won't include them.
5. **Max 5 messages per LINE reply** — `IntentResponse.order` controls sequence; webhook enforces `if len(all_messages) >= 5: break`.
6. **Webhook matching priority** — EXACT → CONTAINS → Legacy AutoReply. The order matters: adding a CONTAINS keyword that overlaps an EXACT match is safe (EXACT wins). Never add regex to match_type without testing — the webhook only handles EXACT and CONTAINS.
7. **Payload JSONB for flex** — `IntentResponse.payload` is a JSONB column. Frontend stores it as a JSON string, parses with `JSON.parse()` before POSTing. Backend receives it as `dict`.
8. **Frontend: no SWR / React Query** — use `useCallback` + `useEffect` with a `window.setTimeout(..., 0)` wrapper (already the project pattern in `auto-replies/page.tsx`).

---

## Context7 Docs

Context7 MCP is active (`.mcp.json`). Use before writing SQLAlchemy async patterns
or Pydantic v2 validation logic.

| Library | Resolve Name | Key Topics |
|---|---|---|
| SQLAlchemy | `"sqlalchemy"` | selectinload, async session, JSONB column |
| FastAPI | `"fastapi"` | response_model, status codes, dependencies |
| Pydantic | `"pydantic"` | model_validate, computed fields, JSONB dict |

Usage: `mcp__context7__resolve-library-id libraryName="sqlalchemy"` →
`mcp__context7__get-library-docs context7CompatibleLibraryID="..." topic="selectinload async" tokens=5000`

---

## Architecture Overview

```
IntentCategory (intent_categories)
├── name: str (unique)
├── description: str | None
├── is_active: bool
├── keywords: List[IntentKeyword]   ← cascade delete
└── responses: List[IntentResponse] ← cascade delete

IntentKeyword (intent_keywords)
├── category_id: FK → intent_categories
├── keyword: str
└── match_type: MatchType (exact | contains | starts_with | regex)

IntentResponse (intent_responses)
├── category_id: FK → intent_categories
├── reply_type: ReplyType (text | flex | image | sticker | video | template)
├── text_content: str | None   ← used for reply_type=text
├── payload: JSONB | None      ← used for reply_type=flex/template
├── order: int                 ← send order (0 = first)
└── is_active: bool
```

**API prefix:** `/api/v1/admin/intents`
**Registered in:** `backend/app/api/v1/api.py`

**Webhook matching flow (in `webhook.py`):**
```
User sends message
    │
    ├─ Handoff keyword check → initiate live chat if matched
    ├─ Special commands ("ติดตาม", phone number)
    │
    ├─ 1. EXACT IntentKeyword match   ← highest priority
    ├─ 2. CONTAINS IntentKeyword match
    ├─ 3. Legacy AutoReply EXACT
    ├─ 4. Legacy AutoReply CONTAINS
    │
    └─ Build up to 5 reply messages → line_service.reply_messages()
```

---

## Step 1: Add a New Intent Category (Backend)

```python
# In admin_intents.py — already exists, this is the pattern to follow

@router.post("/categories", response_model=IntentCategoryResponse, status_code=201)
async def create_category(data: IntentCategoryCreate, db: AsyncSession = Depends(get_db)):
    # 1. Uniqueness check
    existing = await db.execute(
        select(IntentCategory).filter(IntentCategory.name == data.name)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Category name already exists")

    # 2. Create
    cat = IntentCategory(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat
```

**Schema for create:**
```python
class IntentCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = True
```

---

## Step 2: Fetch Category Detail with selectinload

The detail endpoint loads keywords and responses in a single query using `selectinload`.
This is mandatory — lazy loading is not available in async SQLAlchemy sessions.

```python
@router.get("/categories/{cat_id}", response_model=IntentCategoryDetailResponse)
async def get_category(cat_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(IntentCategory).options(
        selectinload(IntentCategory.keywords),
        selectinload(IntentCategory.responses)
    ).filter(IntentCategory.id == cat_id)

    result = await db.execute(stmt)
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat
```

**Count enrichment pattern (for list endpoint):**
```python
# Pydantic can't auto-compute counts from relationships in async — enrich manually
resp = IntentCategoryResponse.model_validate(cat)
resp.keyword_count = await db.scalar(
    select(func.count(IntentKeyword.id)).filter(IntentKeyword.category_id == cat.id)
)
resp.keywords_preview = list((await db.execute(
    select(IntentKeyword.keyword)
    .filter(IntentKeyword.category_id == cat.id)
    .limit(5)
)).scalars().all())
```

---

## Step 3: Manage Keywords

Keywords link text patterns to a category. The `match_type` controls how the webhook
matches incoming user messages.

```python
# Create a keyword
@router.post("/keywords", response_model=IntentKeywordResponse, status_code=201)
async def create_keyword(data: IntentKeywordCreate, db: AsyncSession = Depends(get_db)):
    keyword = IntentKeyword(**data.model_dump())
    db.add(keyword)
    await db.commit()
    await db.refresh(keyword)
    return keyword
```

**MatchType behaviour in webhook:**

| match_type | DB query | Example |
|---|---|---|
| `exact` | `keyword == text` | "pricing" only matches text "pricing" |
| `contains` | `literal(text).ilike('%' + keyword + '%')` | "pricing" matches "send me pricing now" |
| `starts_with` | Not yet implemented in webhook | Reserved |
| `regex` | Not yet implemented in webhook | Reserved |

**Guidance:** Use `contains` for most cases. Use `exact` for short Thai words that
could be substrings of unrelated messages (e.g., "ไป" would false-match many sentences).

---

## Step 4: Manage Responses

Responses define what the bot sends back. A category can have multiple responses
sent in sequence (up to LINE's 5-message limit).

```python
# Create a text response
await fetch(`${API_BASE}/admin/intents/responses`, {
    method: 'POST',
    body: JSON.stringify({
        category_id: categoryId,
        reply_type: 'text',
        text_content: 'สวัสดีครับ ยินดีให้บริการ',
        order: 0,
        is_active: true
    })
})

# Create a flex response — payload must be the Flex container JSON
await fetch(`${API_BASE}/admin/intents/responses`, {
    method: 'POST',
    body: JSON.stringify({
        category_id: categoryId,
        reply_type: 'flex',
        payload: {            // JSONB dict, NOT a JSON string
            "type": "bubble",
            "body": { "type": "box", "layout": "vertical", "contents": [...] }
        },
        order: 1,
        is_active: true
    })
})
```

**Backend `payload` handling in webhook:**
```python
# When payload is present, webhook builds FlexMessage:
container = FlexContainer.from_dict(strip_flex_body(resolve_payload_urls(payload)))
all_messages.append(FlexMessage(alt_text=keyword_label, contents=container))

# When only text_content:
all_messages.append(TextMessage(text=text_content))
```

**Response ordering:** `order=0` fires first. Multiple responses are sent in
a single `reply_messages()` call (max 5). Responses with `is_active=False` are
skipped in webhook matching.

---

## Step 5: Understand the Webhook Matching Pipeline

When a LINE user sends a message, `webhook.py` runs this sequence:

```python
# 1. EXACT match — highest priority
stmt = select(IntentKeyword).options(
    selectinload(IntentKeyword.category)
    .selectinload(IntentCategory.responses.and_(IntentResponse.is_active == True))
).filter(
    IntentKeyword.keyword == text,
    IntentKeyword.match_type == MatchType.EXACT
)

# 2. CONTAINS match — if no exact found
stmt = select(IntentKeyword).options(...).filter(
    literal(text).ilike(func.concat('%', IntentKeyword.keyword, '%')),
    IntentKeyword.match_type == MatchType.CONTAINS
).limit(1)

# 3. Legacy AutoReply fallback (backward compat — do not remove)

# 4. Build messages (sorted by response.order, max 5)
for res in category.responses:
    if len(all_messages) >= 5:
        break
    ...
await line_service.reply_messages(event.reply_token, all_messages)
```

**Key point for debugging "bot doesn't reply":**
- Category `is_active=False` → silently skipped
- Response `is_active=False` → skipped when loading with `.and_(is_active == True)`
- No EXACT or CONTAINS keyword matched → no reply sent
- All responses errored in the `try/except` → logs error, sends fallback text

---

## Step 6: Frontend — Category List Page

**File:** `frontend/app/admin/auto-replies/page.tsx`

Pattern: `'use client'`, `useCallback` fetch, `useEffect` with `setTimeout(0)` wrapper,
inline create modal using the project's `Modal` component.

```typescript
'use client';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import PageHeader from '@/app/admin/components/PageHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Fetch pattern
const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/admin/intents/categories`);
        if (res.ok) setCategories(await res.json());
    } finally {
        setLoading(false);
    }
}, [API_BASE]);

// Mount pattern — setTimeout(0) prevents SSR hydration issues
useEffect(() => {
    const timer = window.setTimeout(() => { void fetchCategories(); }, 0);
    return () => window.clearTimeout(timer);
}, [fetchCategories]);
```

**Status toggle pattern (inline PUT, no modal):**
```typescript
const handleToggleStatus = async (id: number, isActive: boolean) => {
    const res = await fetch(`${API_BASE}/admin/intents/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
    });
    if (res.ok) fetchCategories();
};
```

---

## Step 7: Frontend — Category Detail Page

**File:** `frontend/app/admin/auto-replies/[id]/page.tsx`

Pattern: `useParams()` for `id`, `useSearchParams()` for `?mode=edit`, dual-form
management (keyword form + response form), JSON payload string ↔ parsed object.

**Flex payload round-trip:**
```typescript
// On load: parse stored JSONB → string for textarea
payload: resp.payload ? JSON.stringify(resp.payload, null, 2) : '{}'

// On submit: parse string → object, validate JSON
try {
    payload = JSON.parse(responseFormData.payload);
} catch {
    setPayloadError('Invalid JSON format');
    return;
}
// Send parsed payload (dict) to API
body: JSON.stringify({ ...responseFormData, payload: payload, category_id: params.id })
```

**MatchType selector (radio grid, not a `<select>`):**
```typescript
const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex'];
// Rendered as a 2-column radio grid — see existing component for reference
```

---

## Common Issues

### "bot ไม่ตอบ" — bot doesn't reply to a keyword

1. Check `IntentCategory.is_active` — must be `true`
2. Check `IntentResponse.is_active` — at least one response must be `true`
3. Check keyword `match_type` — `contains` is case-insensitive (ILIKE), `exact` is case-sensitive
4. Check if the message triggers handoff keywords first (`handoff_service.check_handoff_keywords`)
5. Check if the message matches a special command ("ติดตาม", "สถานะ") before intent matching

### Category delete doesn't cascade

**Cause:** Model defined `ondelete="CASCADE"` but Alembic migration wasn't re-run.
**Fix:** `alembic revision --autogenerate -m "fix cascade"` + `alembic upgrade head`

### `MissingGreenlet` or lazy load error on responses

**Cause:** Accessing `category.responses` without `selectinload` in async context.
**Fix:** Always include `selectinload(IntentCategory.responses)` in the query options.

### `keyword_count` always returns 0 in list response

**Cause:** Using constructor (`IntentCategoryResponse(**cat.__dict__)`) instead of `model_validate`.
**Fix:** Use `IntentCategoryResponse.model_validate(cat)`, then set `resp.keyword_count = ...` manually.

### Flex payload "Invalid JSON" on frontend

**Cause:** Sending the raw JSON string instead of parsed dict to the API.
**Fix:** Always `JSON.parse(responseFormData.payload)` before including in request body.

### CONTAINS match fires unexpectedly on short keywords

**Cause:** Short Thai keywords (e.g., "ไป", "ดี") are substrings of many natural sentences.
**Fix:** Use `exact` match for short words, or make keywords longer and more specific.

---

## Quality Checklist

Before finishing, verify:

- [ ] New category has at least one keyword and one active response
- [ ] `selectinload` used in every detail query (not lazy load)
- [ ] Category uniqueness checked before `POST /categories`
- [ ] `model_validate` used for enriched list responses (not `model_dump` + constructor)
- [ ] Flex responses: `payload` is a valid dict (not a JSON string) when sent to backend
- [ ] `order` field set correctly — 0-indexed, lower = sent first
- [ ] `is_active=True` on both category and at least one response
- [ ] Tested manually: send the trigger keyword in LINE → confirm reply fires
- [ ] Frontend: `window.setTimeout(() => void fetch(), 0)` pattern used on `useEffect`

---

*See `references/api_reference.md` for full API endpoint table, enum values, and schema fields.*
