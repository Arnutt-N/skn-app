---
name: skn-backend-infra
description: >
  Covers the SKN App backend infrastructure layer and remaining frontend pages.
  Use when asked to "add a new router", "register an endpoint in api.py",
  "add a new FastAPI router", "check which APIs are registered", "fix health check",
  "add health endpoint", "configure CORS", "backend startup sequence",
  "static file uploads path", "add background task on startup",
  "why does /admin/friends return 404", "fix friends page", "register admin_friends",
  "login page auth", "add login page", "friends list page", "reports page",
  "เพิ่ม router ใหม่", "ลงทะเบียน endpoint ใหม่", "แก้ api.py", "health check backend".
  Do NOT use for feature-specific endpoint logic (use the feature skill instead);
  this skill covers the infrastructure wiring: api.py registration, main.py lifecycle,
  health endpoints, and the login/friends/reports frontend pages.
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI, SQLAlchemy 2.0 async, Redis, Next.js 16, React 19, TypeScript.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [backend, infrastructure, api, router, health, cors, startup, login, friends, reports]
  related-skills:
    - skn-fastapi-endpoint
    - skn-app-shell
    - skn-auth-security
    - skn-performance-audit
  documentation: ./references/backend_infra_reference.md
---

# skn-backend-infra

The backend infrastructure layer covers:

1. **`backend/app/main.py`** — FastAPI app factory: CORS middleware, startup/shutdown hooks,
   static file serving for uploaded media, and router mounting.

2. **`backend/app/api/v1/api.py`** — Router registration. The **authoritative list** of which
   endpoints are active. Any router not listed here returns 404.

3. **`backend/app/api/v1/endpoints/health.py`** — 3 health check endpoints: basic, WebSocket,
   and detailed with latency metrics.

4. **Remaining frontend pages** — Login page (`/login`), Friends page (`/admin/friends`),
   and Reports page (`/admin/reports`).

---

## CRITICAL: Project-Specific Rules

1. **`admin_friends.py` exists but is NOT registered in `api.py` — critical gap** —
   The file `backend/app/api/v1/endpoints/admin_friends.py` contains fully implemented
   `GET /` (list friends) and `GET /{line_user_id}/events` endpoints, but the router
   was **never added** to `api_router` in `api.py`. As a result:
   - `frontend/app/admin/friends/page.tsx` always gets 404 responses
   - The page shows "No users found" even if data exists
   To fix, add to `api.py`:
   ```python
   from app.api.v1.endpoints import admin_friends  # add to imports
   api_router.include_router(admin_friends.router, prefix="/admin/friends", tags=["admin"])
   ```

2. **`api.py` is the single source of truth for active routes** — A router module can
   exist with perfectly valid code but will return 404 until it appears in `api.py`.
   When adding any new endpoint file, always add both the import and `include_router()`.
   The pattern is always:
   ```python
   from app.api.v1.endpoints import my_feature  # import
   api_router.include_router(my_feature.router, prefix="/admin/my-feature", tags=["admin"])
   ```

3. **`main.py` startup order is dependency-ordered — do not reorder** — The startup
   sequence initializes services in dependency order:
   ```python
   await redis_client.connect()            # 1. Redis first
   await ws_manager.initialize()           # 2. WS manager (uses Redis pub/sub)
   # DB table creation (system_settings)   # 3. DB schema bootstrap
   await business_hours_service.initialize_defaults(db)  # 4. Business logic defaults
   await start_cleanup_task()              # 5. Background tasks last
   ```
   Inserting a new startup step that depends on Redis must come after step 1.
   A step that needs the DB must come after the DB initialization block.

4. **Static files are served at `/uploads` — NOT via the CDN or API prefix** —
   Uploaded files are accessible at `http://host/uploads/<filename>` (no `/api/v1/`
   prefix). The physical path is resolved as:
   ```python
   ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
   # ROOT_DIR = backend/ (parent of app/)
   UPLOADS_DIR = ROOT_DIR + "/uploads"
   # → backend/uploads/<filename>
   ```
   In production, `SERVER_BASE_URL + "/uploads/<filename>"` forms the public URL.

5. **CORS is configured from `settings.BACKEND_CORS_ORIGINS`** — The list comes from
   `backend/.env`. For local dev, set `BACKEND_CORS_ORIGINS=["*"]` or
   `BACKEND_CORS_ORIGINS=["http://localhost:3000"]`. Trailing slashes are stripped
   (`str(origin).rstrip("/")`). Never hardcode origins in `main.py`.

6. **Health endpoints have no auth — accessible without token** — All 3 health
   endpoints (`/health`, `/health/websocket`, `/health/detailed`) are public GET
   endpoints with no authentication. They are registered without a prefix (at the
   `api/v1/` level, not under `/admin/`):
   - `GET /api/v1/health` — basic: `{database, redis, status}`
   - `GET /api/v1/health/websocket` — WS metrics + connection stats
   - `GET /api/v1/health/detailed` — all services with latency_ms

7. **Login page wraps itself in `<AuthProvider>` — admin layout does NOT** —
   The login page manually wraps its inner component in `<AuthProvider>`:
   ```tsx
   export default function LoginPage() {
     return (
       <AuthProvider>
         <LoginForm />  {/* useAuth() is valid here */}
       </AuthProvider>
     );
   }
   ```
   All `/admin/*` pages get `<AuthProvider>` from the layout — never add a second
   `<AuthProvider>` inside an admin page component.

8. **Friends page uses client-side filtering, status filtering via query param** —
   `frontend/app/admin/friends/page.tsx` fetches `GET /admin/friends?status=STATUS`
   where status is `ACTIVE`, `BLOCKED`, or `UNFOLLOWED`. Client-side text filter
   (`filter` state) is applied after the fetch — it is NOT sent to the backend.
   The response shape is `{ friends: Friend[], total: number }`.

9. **Reports page calls two service-request stats endpoints in parallel** —
   `frontend/app/admin/reports/page.tsx` uses `Promise.all()`:
   - `GET /admin/requests/stats/workload` → `Workload[]` (agent_name, pending_count, in_progress_count)
   - `GET /admin/requests/stats/performance` → `{ avg_cycle_time_days, on_time_percentage }`
   These endpoints are part of `admin_requests` router (covered by `skn-admin-requests` skill).

---

## File Structure

```
backend/app/
├── main.py              — FastAPI app: CORS, startup/shutdown, static files, router mount
└── api/v1/
    ├── api.py           — Router registration (authoritative list of active endpoints)
    └── endpoints/
        ├── health.py    — GET /health, /health/websocket, /health/detailed
        └── admin_friends.py  — ⚠️ UNREGISTERED — list friends + event history

frontend/app/
├── login/
│   └── page.tsx         — Login form (own <AuthProvider>, useAuth().login(), useToast)
└── admin/
    ├── friends/
    │   └── page.tsx     — LINE friends list (status filter, no auth headers sent)
    └── reports/
        └── page.tsx     — Service request stats (workload + performance, parallel fetch)
```

---

## Step 1 — Add a New Router to the App

When creating a new endpoint file (e.g., `admin_broadcast.py`):

**1a — Create the endpoint module** (follow skn-fastapi-endpoint patterns):
```python
# backend/app/api/v1/endpoints/admin_broadcast.py
from fastapi import APIRouter
router = APIRouter()
# ... endpoints ...
```

**1b — Register in `api.py`** (add BOTH the import and include_router):
```python
from app.api.v1.endpoints import (
    # ...existing imports...
    admin_broadcast,   # add here
)

# ...after existing include_router calls...
api_router.include_router(admin_broadcast.router, prefix="/admin/broadcast", tags=["admin"])
```

**1c — Verify** with `uvicorn app.main:app --reload` and check the Swagger docs
at `http://localhost:8000/api/v1/docs`.

---

## Step 2 — Add a Startup Hook

To initialize a new service on app startup:

```python
# In main.py, inside startup_event():
@app.on_event("startup")
async def startup_event():
    await redis_client.connect()      # DO NOT reorder above this
    await ws_manager.initialize()     # DO NOT reorder above this

    # Add your step here — after Redis if needed, after DB block if needs DB:
    from app.services.my_service import my_service
    await my_service.initialize()
    print("My service initialized.")

    await start_cleanup_task()        # keep background tasks last
```

---

## Step 3 — Fix the Friends Page (Unregistered Router)

The friends backend is fully implemented but the router is missing from `api.py`.

**Edit `backend/app/api/v1/api.py`:**
```python
from app.api.v1.endpoints import (
    # ...existing imports...
    admin_friends,   # ADD THIS
)

# ADD THIS LINE (after admin_tags include_router):
api_router.include_router(admin_friends.router, prefix="/admin/friends", tags=["admin"])
```

After this fix:
- `GET /api/v1/admin/friends` — returns `{ friends: [...], total: N }`
- `GET /api/v1/admin/friends/{line_user_id}/events` — returns friend event history

---

## Common Issues

### New endpoint returns 404 even though the file looks correct
**Cause:** The router is not included in `api.py`.
**Fix:** Add both the import AND `include_router()` call to `api.py`.

### `/admin/friends` returns 404
**Cause:** `admin_friends.py` is not registered in `api.py` (known gap).
**Fix:** See Step 3 above.

### Login page shows blank / auth not working
**Cause:** The login page renders its own `<AuthProvider>` — if another `<AuthProvider>`
wraps it (e.g., in a layout), `useAuth()` state may be from the wrong provider.
**Fix:** Ensure the login route (`/login`) is NOT inside the admin layout. The app's
root layout should not wrap `/login` in `<AuthProvider>`.

### `uploads/` path not found on startup
**Cause:** The `UPLOADS_DIR` path is resolved relative to `main.py`'s location.
If `uvicorn` is run from the wrong directory, the path may differ.
**Fix:** Always run `uvicorn app.main:app` from the `backend/` directory.
`UPLOADS_DIR = os.path.join(ROOT_DIR, "uploads")` where ROOT_DIR = `backend/`.

### Static files inaccessible in production
**Cause:** Reverse proxy (nginx) needs to forward `/uploads/*` requests to the FastAPI app.
**Fix:** Either configure nginx `proxy_pass` for `/uploads` or move to a separate file
storage service. Currently, `main.py` mounts `/uploads` directly via `StaticFiles`.

---

## Quality Checklist

Before finishing any backend infrastructure change:
- [ ] New router added to BOTH the import block AND `include_router()` in `api.py`
- [ ] `include_router()` prefix matches the frontend API call URLs
- [ ] Startup sequence order preserved: Redis → WS → DB → Services → Tasks
- [ ] No hardcoded CORS origins in `main.py` (use `settings.BACKEND_CORS_ORIGINS`)
- [ ] `/uploads` path assumed at `backend/uploads/` when run from `backend/` dir
- [ ] Health endpoints remain public (no auth dependency)
- [ ] Admin page components do NOT create their own `<AuthProvider>` (login page is the exception)

## Additional Resources

See `references/backend_infra_reference.md` for:
- Complete `api.py` router registration table (all 20 routers)
- `main.py` startup sequence diagram
- Health endpoint response shapes
- Frontend pages quick reference (login, friends, reports)
