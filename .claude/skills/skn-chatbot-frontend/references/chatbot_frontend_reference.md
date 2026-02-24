# Chatbot Frontend — Reference

Sources: `frontend/app/admin/auto-replies/page.tsx`,
`frontend/app/admin/auto-replies/[id]/page.tsx`,
`frontend/app/admin/reply-objects/page.tsx`

---

## File Locations

| File | Purpose |
|---|---|
| `frontend/app/admin/auto-replies/page.tsx` | Intent categories list (248 lines) |
| `frontend/app/admin/auto-replies/[id]/page.tsx` | Category detail: keywords + responses (582 lines) |
| `frontend/app/admin/reply-objects/page.tsx` | Reply objects CRUD (290 lines) |

---

## TypeScript Interfaces

### Categories List (`auto-replies/page.tsx`)

```ts
interface IntentCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  keyword_count: number;
  response_count: number;
  keywords_preview: string[];   // First 3 keywords — display only
}

// Add form state:
type CategoryForm = {
  name: string;
  description: string;
  is_active: boolean;
}
```

### Category Detail (`auto-replies/[id]/page.tsx`)

```ts
interface IntentKeyword {
  id: number;
  keyword: string;
  match_type: string;   // 'exact' | 'contains' | 'starts_with' | 'regex'
}

interface IntentResponse {
  id: number;
  reply_type: string;   // 'text' | 'flex' | 'image' | 'sticker' | 'video'
  text_content: string | null;
  payload: object | null;    // Parsed JSON object (not string) from API
  is_active: boolean;
  order: number;
}

interface IntentCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  keywords: IntentKeyword[];
  responses: IntentResponse[];
}

// Keyword form state:
type KeywordForm = {
  keyword: string;
  match_type: string;   // default: 'exact'
}

// Response form state (payload is string for textarea editing):
type ResponseForm = {
  reply_type: string;    // default: 'text'
  text_content: string;
  payload: string;       // JSON string — parsed only on submit
  is_active: boolean;
}
```

### Reply Objects (`reply-objects/page.tsx`)

```ts
interface ReplyObject {
  id: number;           // Never used in API calls
  object_id: string;    // 'welcome_flex', 'service_menu' — used as API path key
  name: string;
  object_type: string;  // 'text' | 'flex' | 'image' | 'sticker' | 'video' | 'audio' | 'location'
  category: string;
  payload: object | null;    // Parsed JSON from API
  alt_text: string | null;
  is_active: boolean;
  created_at: string;
}

// Form state (payload is JSON string for textarea):
type ReplyObjectForm = {
  object_id: string;
  name: string;
  object_type: string;
  category: string;
  payload: string;       // JSON string — parsed on submit
  alt_text: string;
  is_active: boolean;
}
```

---

## Constants

```ts
// Category detail page:
const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex']
const REPLY_TYPES = ['text', 'flex', 'image', 'sticker', 'video']

// Reply objects page:
const OBJECT_TYPES = ['text', 'flex', 'image', 'sticker', 'video', 'audio', 'location']
```

---

## API Endpoints

### Intent Categories

| Method | Path | Purpose | Page |
|---|---|---|---|
| `GET` | `/admin/intents/categories` | List all categories | List |
| `POST` | `/admin/intents/categories` | Create category | List |
| `PUT` | `/admin/intents/categories/{id}` | Update category (name/description/is_active) | List + Detail |
| `DELETE` | `/admin/intents/categories/{id}` | Delete category | List |
| `GET` | `/admin/intents/categories/{id}` | Category detail (includes keywords + responses) | Detail |

### Keywords

| Method | Path | Purpose | Page |
|---|---|---|---|
| `POST` | `/admin/intents/keywords` | Create keyword | Detail |
| `PUT` | `/admin/intents/keywords/{id}` | Update keyword | Detail |
| `DELETE` | `/admin/intents/keywords/{id}` | Delete keyword | Detail |

### Responses

| Method | Path | Purpose | Page |
|---|---|---|---|
| `POST` | `/admin/intents/responses` | Create response | Detail |
| `PUT` | `/admin/intents/responses/{id}` | Update response | Detail |
| `DELETE` | `/admin/intents/responses/{id}` | Delete response | Detail |

### Reply Objects

| Method | Path | Purpose | Page |
|---|---|---|---|
| `GET` | `/admin/reply-objects` | List all reply objects | Reply Objects |
| `POST` | `/admin/reply-objects` | Create reply object | Reply Objects |
| `PUT` | `/admin/reply-objects/{object_id}` | Update (string key) | Reply Objects |
| `DELETE` | `/admin/reply-objects/{object_id}` | Delete (string key) | Reply Objects |

---

## List Page — is_active Toggle

```ts
// Toggle button sends immediate PUT:
const handleToggle = async (cat: IntentCategory) => {
  await fetch(`${API_BASE}/admin/intents/categories/${cat.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: !cat.is_active })
  })
  fetchCategories()
}
```

---

## Detail Page — Keyword Submit Flow

```ts
const handleKeywordSubmit = async () => {
  if (!keywordForm.keyword.trim()) return

  const body = {
    keyword: keywordForm.keyword,
    match_type: keywordForm.match_type,
    category_id: params.id    // From URL — NOT a form field
  }

  if (editingKeywordId) {
    await fetch(`${API_BASE}/admin/intents/keywords/${editingKeywordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } else {
    await fetch(`${API_BASE}/admin/intents/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
  fetchCategory()
  setKeywordForm({ keyword: '', match_type: 'exact' })
  setEditingKeywordId(null)
}
```

---

## Detail Page — Response Submit Flow

```ts
const handleResponseSubmit = async () => {
  // Payload parsing only for flex/template:
  let payload: object | null = null
  if (responseForm.reply_type === 'flex' || responseForm.reply_type === 'template') {
    try {
      payload = JSON.parse(responseForm.payload)
    } catch {
      setPayloadError('Invalid JSON format')
      return    // Abort submit
    }
  }

  const body = {
    reply_type: responseForm.reply_type,
    text_content: responseForm.text_content || null,
    payload,
    is_active: responseForm.is_active,
    category_id: params.id    // From URL — NOT a form field
  }

  if (editingResponseId) {
    await fetch(`${API_BASE}/admin/intents/responses/${editingResponseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } else {
    await fetch(`${API_BASE}/admin/intents/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
  fetchCategory()
  setResponseForm({ reply_type: 'text', text_content: '', payload: '', is_active: true })
  setEditingResponseId(null)
  setPayloadError('')
}
```

---

## Reply Objects — Submit Flow

```ts
const handleSubmit = async () => {
  // Parse payload JSON string → object:
  let payload = null
  if (formData.payload.trim()) {
    try {
      payload = JSON.parse(formData.payload)
    } catch {
      alert('Invalid JSON payload')
      return
    }
  }

  const body = { ...formData, payload }

  if (editingId) {
    // editingId = obj.object_id (string), NOT numeric id
    await fetch(`${API_BASE}/admin/reply-objects/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } else {
    await fetch(`${API_BASE}/admin/reply-objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
  fetchObjects()
  setEditingId(null)    // editingId stores object_id string
  resetForm()
}
```

---

## Reply Objects — Edit Initialization

```ts
// On edit button click:
const handleEdit = (obj: ReplyObject) => {
  setEditingId(obj.object_id)   // String key, e.g. 'welcome_flex'
  setFormData({
    object_id: obj.object_id,
    name: obj.name,
    object_type: obj.object_type,
    category: obj.category,
    payload: obj.payload ? JSON.stringify(obj.payload, null, 2) : '',  // Object → string
    alt_text: obj.alt_text || '',
    is_active: obj.is_active,
  })
}
```

---

## Detail Page — `isEditing` Initialization

```ts
// URL param controls initial edit state:
const searchParams = useSearchParams()
const [isEditing, setIsEditing] = useState(searchParams.get('mode') === 'edit')

// List page links to detail with edit mode:
// Eye icon:  /admin/auto-replies/{id}          → isEditing = false
// Edit icon: /admin/auto-replies/{id}?mode=edit → isEditing = true
```

---

## Response Display by Type

```tsx
{/* Response card display: */}
{response.reply_type === 'text' && (
  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
    {response.text_content}
  </p>
)}
{(response.reply_type === 'flex' || response.reply_type === 'template') && (
  <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto max-h-20">
    {JSON.stringify(response.payload, null, 2)}
  </pre>
)}
{['image', 'sticker', 'video'].includes(response.reply_type) && (
  <span className="text-xs text-gray-400">
    [{response.reply_type.toUpperCase()}]
  </span>
)}
```

---

## Known Gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | No bulk reorder for responses — `order` field set manually | Medium | Add drag-and-drop reorder or up/down arrows |
| GAP-2 | `keywords_preview` in list page is first 3 from API — no full count badge | Low | Show `keyword_count` as number badge alongside preview |
| GAP-3 | Reply object payload `alt_text` not validated for non-text types | Low | Add conditional validation by object_type |
| GAP-4 | No pagination on reply objects list — loads all records | Medium | Add server-side pagination |
| GAP-5 | Response `order` not adjustable from UI — backend sets default order | Medium | Add reorder UI |
| GAP-6 | Keyword radio buttons have no label wrapping — hard to click on mobile | Low | Wrap radio+label in `<label>` element |
