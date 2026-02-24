# Admin Overview Pages — Reference

Sources: `frontend/app/admin/page.tsx`,
`frontend/app/admin/settings/line/page.tsx`,
`frontend/app/admin/reports/page.tsx`,
`frontend/app/admin/chatbot/page.tsx`,
`frontend/app/admin/friends/page.tsx`

---

## File Locations

| File | Purpose | Type |
|---|---|---|
| `frontend/app/admin/page.tsx` | Admin home dashboard (149 lines): service request stats | Server component |
| `frontend/app/admin/settings/line/page.tsx` | LINE credentials settings (341 lines): Connect→Save flow | Client component |
| `frontend/app/admin/reports/page.tsx` | Service request reports (180 lines): workload + performance | Client component |
| `frontend/app/admin/chatbot/page.tsx` | Chatbot overview (169 lines): reply objects + intent stats | Server component |
| `frontend/app/admin/friends/page.tsx` | LINE Friends list (155 lines): server filter + client search | Client component |

---

## TypeScript Interfaces

### LINE Settings Page

```ts
interface SettingItem {
  key: string;
  value?: string;
}

interface ValidationResult {
  success: boolean;
  botInfo?: {
    displayName?: string;   // LINE bot's display name
    userId?: string;        // LINE bot's user ID
  };
  error?: string;
}

// Page state:
type SettingsState = {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
}
// processing: 'CONNECT' | 'SAVE' | null
```

### Reports Page

```ts
interface Workload {
  agent_name: string;
  pending_count: number;
  in_progress_count: number;
}

interface Performance {
  avg_cycle_time_days: number;
  on_time_percentage: number;   // 0-100
}
```

### Chatbot Overview (Server Component)

```ts
interface ReplyObjectSummary {
  id: number;
  object_id: string;    // e.g. 'welcome_flex'
  name: string;
  object_type: string;
}

interface IntentCategorySummary {
  id: number;
  name: string;
  is_active: boolean;
  response_count: number;
  keyword_count: number;
}
```

### Friends Page

```ts
interface Friend {
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  friend_status: string;    // 'ACTIVE' | 'BLOCKED' | 'UNFOLLOWED'
  friend_since?: string;    // ISO datetime
  last_message_at?: string; // ISO datetime
  chat_mode: string;        // 'BOT' | 'HUMAN'
}
```

### Admin Home (Server Component)

```ts
// requestStats shape (from /admin/requests/stats):
interface RequestStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
}

// monthlyData shape (from /admin/requests/stats/monthly):
type MonthlyData = Array<{ month: string; count: number }>
```

---

## API Endpoints

### LINE Settings Page

| Method | Path | Body | Purpose |
|---|---|---|---|
| `GET` | `/admin/settings` | — | Fetch all settings (returns `SettingItem[]`) |
| `POST` | `/admin/settings/line/validate` | `{channel_access_token}` | Validate token via LINE API |
| `POST` | `/admin/settings` | `{key, value, description}` | Save single setting (called twice — once per key) |

### Reports Page

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/requests/stats/workload` | Agent workload counts |
| `GET` | `/admin/requests/stats/performance` | Team performance metrics |

### Chatbot Overview (Server Component)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/reply-objects` | All reply objects |
| `GET` | `/admin/intents/categories` | All intent categories |

### Friends Page

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/friends` | All friends (no filter) |
| `GET` | `/admin/friends?status=ACTIVE` | Filter by status |

### Admin Home (Server Component)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/requests/stats` | Service request counts by status |
| `GET` | `/admin/requests/stats/monthly` | Monthly request volume data |

---

## LINE Settings — Full State & Flow

```ts
// State:
const [settings, setSettings] = useState({ LINE_CHANNEL_ACCESS_TOKEN: '', LINE_CHANNEL_SECRET: '' })
const [isEditing, setIsEditing] = useState(false)
const [processing, setProcessing] = useState<string | null>(null)  // 'CONNECT' | 'SAVE'
const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
const [canSave, setCanSave] = useState(false)

// Modals:
const [showStatusModal, setShowStatusModal] = useState(false)     // Connect result
const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false)
const [showUnsavedModal, setShowUnsavedModal] = useState(false)   // Navigation guard
const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

// handleConnect — POST /admin/settings/line/validate:
const res = await fetch(`${API_BASE}/admin/settings/line/validate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ channel_access_token: settings.LINE_CHANNEL_ACCESS_TOKEN })
})
// On success: setValidationResult({success:true, botInfo: data.data}); setCanSave(true)
// On failure: setValidationResult({success:false, error: data.detail}); setCanSave(false)
// Always: setShowStatusModal(true)

// handleSave — 2 sequential POST /admin/settings calls:
await fetch(`${API_BASE}/admin/settings`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'LINE_CHANNEL_ACCESS_TOKEN', value: settings.LINE_CHANNEL_ACCESS_TOKEN, description: 'LINE API Access Token' })
})
await fetch(`${API_BASE}/admin/settings`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'LINE_CHANNEL_SECRET', value: settings.LINE_CHANNEL_SECRET, description: 'LINE API Channel Secret' })
})

// Navigation guard:
const handleNavigationAttempt = (href: string) => {
  if (isEditing) { setPendingNavigation(href); setShowUnsavedModal(true) }
  else { router.push(href) }
}
```

---

## Admin Home — `fetchWithTimeout` Pattern

```ts
// 15-second timeout with AbortController:
async function fetchWithTimeout(url: string, timeout = 15000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeoutId)
    return res
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Partial failure tolerance with Promise.allSettled:
const [statsResult, monthlyResult] = await Promise.allSettled([
  fetchWithTimeout(`${API_BASE}/admin/requests/stats`),
  fetchWithTimeout(`${API_BASE}/admin/requests/stats/monthly`)
])
const bothFailed = statsResult.status === 'rejected' && monthlyResult.status === 'rejected'
const error = bothFailed ? 'Failed to load service data.' : null
```

---

## Friends Page — Dual Filter Pattern

```ts
// Server-side status filter (triggers re-fetch):
const [statusFilter, setStatusFilter] = useState<string | null>(null)
const fetchFriends = useCallback(async () => {
  const query = statusFilter ? `?status=${statusFilter}` : ''
  const res = await fetch(`${API_BASE}/admin/friends${query}`)
  if (res.ok) {
    const data = await res.json()
    setFriends(data.friends)  // Unwrap: data.friends NOT data
  }
}, [API_BASE, statusFilter])

// Client-side text search (no re-fetch):
const [filter, setFilter] = useState('')
const filteredFriends = friends.filter(f =>
  f.display_name?.toLowerCase().includes(filter.toLowerCase()) ||
  f.line_user_id.toLowerCase().includes(filter.toLowerCase())
)
```

---

## Status and Chat Mode Badge Styles (Friends Page)

```ts
// friend_status badge:
friend_status === 'ACTIVE'   → 'bg-success/12 text-success'
friend_status === 'BLOCKED'  → 'bg-danger/12 text-danger'
else                         → 'bg-slate-100 text-slate-600'

// chat_mode badge:
chat_mode === 'HUMAN' → 'bg-primary/12 text-primary'
else                  → 'bg-slate-100 text-slate-600'
```

---

## Reports — Workload Bar Formula

```ts
// Bar width is capped at 10 tasks (hardcoded max):
<div className="bg-amber-400 h-full" style={{ width: `${(item.pending_count / 10) * 100}%` }} />
<div className="bg-blue-400 h-full" style={{ width: `${(item.in_progress_count / 10) * 100}%` }} />

// Total active tasks (all agents):
workload.reduce((acc, curr) => acc + curr.pending_count + curr.in_progress_count, 0)
```

---

## Server Component Notes

Both `admin/page.tsx` and `admin/chatbot/page.tsx` are **Next.js Server Components**:

```ts
export const dynamic = 'force-dynamic'   // No caching — fresh data on every request

export default async function PageName() {
  const data = await fetchData()         // Server-side fetch, no useEffect
  return <div>...</div>                  // Rendered on server
}
```

Rules for these pages:
- **No `'use client'`** at the top
- **No React hooks** (`useState`, `useEffect`, `useCallback`)
- Interactivity requires extracting to child client components (e.g. `ChartsWrapper`)
- `fetch` options: `cache: 'no-store'` for fresh data every request

---

## Known Gaps

| ID | Gap | Page | Severity | Fix |
|---|---|---|---|---|
| GAP-1 | LINE settings Save sends 2 separate POST requests — not atomic; one could fail silently | Settings | Medium | Use a PATCH endpoint or batch update |
| GAP-2 | Reports workload bar caps at 10 tasks (hardcoded) — misleading for agents with >10 tasks | Reports | Low | Use dynamic max from the data |
| GAP-3 | "Excellent Team Work" score card in reports is fully static/hardcoded | Reports | Low | Compute from actual data |
| GAP-4 | Friends `MoreVertical` action button has no click handler — no user detail/edit | Friends | Medium | Add dropdown menu: view conversation, block/unblock |
| GAP-5 | Admin home `StatsCard` links use UPPERCASE status in query params (`?status=PENDING`) — must match the list page filter which sends lowercase | Home | Medium | Normalize to one case convention |
| GAP-6 | LINE settings validate endpoint only validates `channel_access_token` — `channel_secret` is not tested | Settings | Medium | Add secret validation (webhook signature test) |
