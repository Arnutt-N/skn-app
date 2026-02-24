# Backend Infrastructure — Reference

Sources:
- `backend/app/main.py`
- `backend/app/api/v1/api.py`
- `backend/app/api/v1/endpoints/health.py`
- `backend/app/api/v1/endpoints/admin_friends.py`
- `frontend/app/login/page.tsx`
- `frontend/app/admin/friends/page.tsx`
- `frontend/app/admin/reports/page.tsx`

---

## `api.py` — Router Registration Table (Complete)

All routes active under `/api/v1/`:

| Module | Prefix | Tags | Notes |
|---|---|---|---|
| `webhook` | `/line` | line | LINE Messaging API webhook |
| `auth` | `/auth` | auth | Login, refresh, me |
| `media` | _(none)_ | media | File upload/download |
| `liff` | `/liff` | liff | LIFF app endpoints |
| `locations` | `/locations` | locations | Province/district/sub-district |
| `admin_reply_objects` | `/admin/reply-objects` | admin | Reply object CRUD |
| `admin_auto_replies` | `/admin/auto-replies` | admin | Legacy keyword rules |
| `admin_intents` | `/admin/intents` | admin | Chatbot intent CRUD |
| `admin_requests` | `/admin/requests` | admin | Service request CRUD |
| `admin_users` | `/admin/users` | admin | User/agent management |
| `rich_menus` | `/admin/rich-menus` | admin | LINE Rich Menu management |
| `settings` | `/admin/settings` | admin | LINE config, system settings |
| `admin_live_chat` | `/admin/live-chat` | admin | Conversation + session REST API |
| `admin_analytics` | `/admin/analytics` | admin | KPI, operator stats, hourly |
| `admin_audit` | `/admin/audit` | admin | Audit logs + stats |
| `admin_canned_responses` | `/admin/canned-responses` | admin | Canned message shortcuts |
| `admin_export` | `/admin/export` | admin | CSV/PDF export |
| `admin_tags` | `/admin/tags` | admin | User tag management |
| `ws_live_chat` | _(none)_ | websocket | `WS /api/v1/ws/live-chat` |
| `health` | _(none)_ | health | `/health`, `/health/websocket`, `/health/detailed` |

**NOT REGISTERED (gap):**

| Module | Status | Fix |
|---|---|---|
| `admin_friends` | File exists, NOT in api.py | Add import + `include_router(prefix="/admin/friends")` |

---

## `main.py` — Startup Sequence

```
app startup:
  1. redis_client.connect()
     └─ Opens aioredis connection pool

  2. ws_manager.initialize()
     └─ Starts Redis pub/sub listener for multi-process WS message routing

  3. DB bootstrap (inline SQL, no Alembic):
     └─ CREATE TABLE IF NOT EXISTS system_settings (...)
     └─ CREATE INDEX IF NOT EXISTS ix_system_settings_key ...

  4. business_hours_service.initialize_defaults(db)
     └─ Inserts default Monday-Friday 08:00-17:00 rows if empty

  5. start_cleanup_task()
     └─ Starts asyncio background task for session cleanup

app shutdown:
  1. pubsub_manager.disconnect()
  2. redis_client.disconnect()
```

### App Configuration

```python
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for JskApp ...",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",   # /api/v1/openapi.json
    docs_url=f"{settings.API_V1_STR}/docs",               # /api/v1/docs
)
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`settings.BACKEND_CORS_ORIGINS` is loaded from `backend/.env`.

### Static Files

```python
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
UPLOADS_DIR = ROOT_DIR + "/uploads"    # backend/uploads/
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
```

Public URL: `http://host/uploads/<filename>` (no `/api/v1/` prefix)

---

## `health.py` — Health Check Endpoints

### `GET /api/v1/health`

```json
{
  "database": true,
  "redis": true,
  "status": "healthy"
}
```

Statuses: `"healthy"` (both ok), `"degraded"` (DB ok, Redis down), `"unhealthy"` (DB down).

### `GET /api/v1/health/websocket`

```json
{
  "<ws_health_monitor fields>": "...",
  "connection_stats": "<ws_manager.get_stats() result>"
}
```

### `GET /api/v1/health/detailed`

```json
{
  "timestamp": "2026-02-24T12:00:00",
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 1.23
    },
    "redis": {
      "status": "healthy",
      "connected": true
    },
    "websocket": {
      "status": "healthy",
      "<ws_health fields>": "..."
    }
  }
}
```

All 3 endpoints: `GET`, no auth, no prefix (NOT under `/admin/`).

---

## `admin_friends.py` — Unregistered Endpoints

```python
# GET /admin/friends?status=ACTIVE&skip=0&limit=100
# Response: { friends: [...], total: N }

# GET /admin/friends/{line_user_id}/events
# Response: { events: [...], total: N }
```

Dependencies: `friend_service` (service layer), `FriendEventListResponse` schema.
No auth required (matches existing pattern — GAP-3 in skn-operator-tools).

---

## Frontend Pages Quick Reference

### `frontend/app/login/page.tsx`

```tsx
// Architecture: LoginPage wraps LoginForm in its own <AuthProvider>
export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}

// LoginForm:
// - Uses useAuth().login(username, password) — calls POST /api/v1/auth/login
// - Uses useToast() for error/success feedback
// - Button isLoading + glow + shine props while submitting
// - On success: AuthContext handles navigation (window.location.href = '/admin')
// - On failure: toast 'Login Failed'
```

**Components used:** `Card`, `CardHeader/Title/Description/Content/Footer`, `Input`, `Button`, `useToast`, `Label`

### `frontend/app/admin/friends/page.tsx`

```tsx
// State:
// - friends: Friend[]         (fetched from API)
// - filter: string            (client-side text filter — NOT sent to API)
// - statusFilter: string|null (sent to API as ?status=VALUE)

// API call:
// GET /admin/friends?status={statusFilter}  (status omitted if null)
// Response: { friends: Friend[], total: number }

// Friend interface:
// { line_user_id, display_name, picture_url?, friend_status, friend_since?, last_message_at?, chat_mode }

// ⚠️ Will 404 until admin_friends router is registered in api.py
// No Authorization header sent (no useAuth())

// Status values: 'ACTIVE' | 'BLOCKED' | 'UNFOLLOWED'
// chat_mode values: 'BOT' | 'HUMAN'
```

**Components used:** `AdminSearchFilterBar`, `AdminTableHead`, `AdminTableHeadColumn`

### `frontend/app/admin/reports/page.tsx`

```tsx
// Two parallel fetches:
const [workloadRes, perfRes] = await Promise.all([
  fetch(`${API_BASE}/admin/requests/stats/workload`),
  fetch(`${API_BASE}/admin/requests/stats/performance`)
]);

// Workload[]:
// { agent_name: string, pending_count: number, in_progress_count: number }

// Performance:
// { avg_cycle_time_days: number, on_time_percentage: number }

// Rendering:
// - on_time_percentage → gradient "On-Time Completion" card
// - avg_cycle_time_days → "Cycle Time" metric card
// - workload.reduce(sum pending + in_progress) → "Total Active Tasks" card
// - workload.map() → horizontal bar segments (amber=pending, blue=in_progress)
// - Hardcoded "A+ Excellent Team Work" summary card (not data-driven)
```

**Components used:** `Card`, `CardContent/Header/Title`, `Badge`, `Button`, `LoadingSpinner`, `PageHeader`

---

## Known Gaps

| ID | Gap | Location | Severity | Fix |
|---|---|---|---|---|
| GAP-1 | `admin_friends.py` not registered in `api.py` — frontend gets 404 | `api.py` | High | Add import + `include_router(prefix="/admin/friends")` |
| GAP-2 | `main.py` uses deprecated `@app.on_event("startup/shutdown")` — should use `lifespan` | `main.py` | Low | Migrate to `@asynccontextmanager` lifespan pattern |
| GAP-3 | `system_settings` table created manually in `startup_event()` — bypasses Alembic | `main.py` | Medium | Create proper Alembic migration, remove bootstrap SQL |
| GAP-4 | Reports page hardcodes "A+ Excellent Team Work" — not data-driven | `reports/page.tsx` | Low | Calculate score from API data |
| GAP-5 | Friends page sends no auth headers — relies on no-auth admin API pattern | `friends/page.tsx` | Low | Add `Authorization: Bearer {token}` using `useAuth()` |
