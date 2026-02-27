---
name: skn-devtools
description: >
  Covers the SKN App development tooling — Docker Compose infrastructure,
  backend utility/seed scripts, and pytest testing patterns.
  Use when asked to "start the database", "start Docker", "seed admin user",
  "create admin", "run tests", "write a test", "add pytest fixture",
  "test WebSocket", "test webhook", "debug routes", "list all routes",
  "debug JWT token", "verify DB connection", "docker-compose",
  "wrong database name", "hashed_secret not working", "login not working after seed",
  "run backend tests", "conftest", "TestClient", "drain_auth_responses",
  "เริ่ม Docker", "seed ข้อมูล admin", "รัน tests", "เขียน test", "debug route",
  "เชื่อมต่อ DB ไม่ได้", "test WebSocket".
  Do NOT use for endpoint creation (skn-fastapi-endpoint), model changes
  (skn-data-models), or migration commands (skn-migration-helper).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Docker Desktop, Python 3.11+, pytest, psycopg2, asyncpg.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: devops
  tags: [docker, testing, pytest, seed, admin, utility, devtools, websocket-test]
  related-skills:
    - skn-migration-helper
    - skn-backend-infra
    - skn-auth-security
    - skn-live-chat-ops
  documentation: ./references/devtools_reference.md
---

# skn-devtools

Development tooling for the SKN App covering three areas:

1. **`docker-compose.yml`** — Infrastructure services: PostgreSQL 16 and Redis 7.

2. **`backend/*.py` utility scripts** — 30+ standalone scripts at the backend root for
   seeding, debugging, verifying, and managing the system. Run directly with `python`.

3. **`backend/tests/`** — 17 pytest test files covering WebSocket, webhook, analytics,
   live chat, services, and security. Uses `TestClient(app)` + custom WS helpers.

---

## CRITICAL: Project-Specific Rules

1. **`create_admin.py` inserts `hashed_password='hashed_secret'` — NOT a bcrypt hash** —
   The seeded admin user cannot login via `POST /api/v1/auth/login` because
   `pwd_context.verify(password, 'hashed_secret')` returns `False`. The seed scripts
   are only useful in **DEV_MODE** where `settings.ENVIRONMENT == "development"` bypasses
   auth. To create a properly loginable admin, use the API directly after first-run seeding,
   or modify the script to use `from app.core.security import get_password_hash`:
   ```python
   from app.core.security import get_password_hash
   hashed = get_password_hash("your-password")
   # Then insert with hashed value instead of 'hashed_secret'
   ```

2. **`seed_admin_sync.py` uses the old database name `jsk_app_db` — NOT `skn_app_db`** —
   `docker-compose.yml` creates a database named `skn_app_db` (via `POSTGRES_DB=skn_app_db`).
   The synchronous seed script hardcodes `database="jsk_app_db"` — the old name before
   the project was renamed. Running it against docker-compose's DB will fail with
   "database does not exist". Use `create_admin.py` (async) instead, which reads from
   `settings.DATABASE_URL`.

3. **WebSocket tests MUST drain 2 responses after `auth` before testing** —
   After sending `{"type": "auth", ...}`, the server always sends 2 messages:
   `auth_success` then `presence_update`. Not consuming both before your assertion
   will cause tests to receive the wrong message type:
   ```python
   # CORRECT — use the conftest helper:
   from tests.conftest import auth_websocket
   auth_websocket(websocket)  # sends auth + drains auth_success + presence_update

   # OR manually:
   websocket.send_json({"type": "auth", "payload": {"admin_id": "1"}})
   websocket.receive_json()  # auth_success
   websocket.receive_json()  # presence_update
   # NOW your test starts here
   ```

4. **`TestClient(app)` is synchronous — no `asyncio.run()` needed in tests** —
   Starlette's `TestClient` wraps the async ASGI app and handles the event loop
   internally. Pytest tests are plain `def` functions, not `async def`. WebSocket
   tests use `client.websocket_connect()` as a synchronous context manager:
   ```python
   def test_my_feature():
       client = TestClient(app)
       with client.websocket_connect("/api/v1/ws/live-chat") as ws:
           # synchronous sends and receives
           ws.send_json({...})
           data = ws.receive_json()
   ```

5. **All tests must be run from the `backend/` directory** —
   Test files import `from app.main import app` which requires `backend/` to be on the
   Python path. Running `pytest` from the project root or from `backend/tests/` will
   cause `ModuleNotFoundError: No module named 'app'`:
   ```bash
   cd backend
   python -m pytest tests/                  # all tests
   python -m pytest tests/test_websocket.py # single file
   python -m pytest tests/ -k "webhook"     # filter by name
   python -m pytest tests/ -v               # verbose output
   ```

6. **Docker Compose only manages `db` and `redis` — NOT the backend or frontend** —
   `docker-compose.yml` has only 2 services. Backend (`uvicorn`) and frontend (`npm run dev`)
   must be started separately. There is no `backend` or `frontend` service in compose:
   ```bash
   docker-compose up -d db redis         # start infrastructure
   cd backend && uvicorn app.main:app --reload  # start backend separately
   cd frontend && npm run dev                   # start frontend separately
   ```

7. **`debug_routes.py` quickly verifies route registration** —
   After adding a new router to `api.py`, run this to confirm the route appears:
   ```bash
   cd backend && python debug_routes.py
   ```
   Useful for catching the `admin_friends` registration gap and similar issues.

8. **`create_admin.py` is idempotent — safe to run multiple times** —
   It checks `SELECT count(*) FROM users` first and only inserts if the table is empty.
   Running it on a populated DB does nothing. Same logic in `seed_admin_sync.py`.

---

## File Structure

```
skn-app/
├── docker-compose.yml           — PostgreSQL 16 + Redis 7 infrastructure

backend/
├── tests/
│   ├── conftest.py              — test_client fixture, drain_auth_responses(), auth_websocket()
│   ├── test_websocket.py        — WS connect, auth, ping/pong, auth-guard
│   ├── test_websocket_manager_redis.py — Redis pub/sub WS routing
│   ├── test_ws_security.py      — Rate limiting, input validation, auth enforcement
│   ├── test_live_chat_service.py — Session lifecycle (claim, close, transfer)
│   ├── test_session_claim.py    — Session claim logic
│   ├── test_session_cleanup.py  — Auto-close inactivity/waiting timeout
│   ├── test_multi_operator.py   — Multiple operators in same room
│   ├── test_reconnection.py     — WS reconnect after disconnect
│   ├── test_webhook_deduplication.py — Redis-based dedup (TTL=300s)
│   ├── test_webhook_media.py    — Media message webhook handling
│   ├── test_sla_service.py      — SLA breach detection
│   ├── test_analytics_service.py — KPI calculation
│   ├── test_admin_analytics_export_endpoints.py — Export CSV/PDF endpoints
│   ├── test_friend_service.py   — LINE friend list/status
│   ├── test_tag_service.py      — User tag CRUD
│   ├── test_live_chat_media_service.py — Media in live chat
│   └── test_line_service_circuit_breaker.py — Circuit breaker behavior

├── create_admin.py              — Async admin seed (reads DATABASE_URL, idempotent)
├── seed_admin_sync.py           — Sync psycopg2 seed (⚠️ wrong DB name: jsk_app_db)
├── debug_routes.py              — Print all registered FastAPI routes
├── debug_token.py               — Decode/verify a JWT token
├── list_routes.py               — Alternative route listing
├── list_users_debug.py          — Print all users from DB
├── find_users.py                — Search users by criteria
├── verify_db.py                 — Test DB connection
├── verify_api.py                — Test API endpoint responses
├── test_endpoint.py             — Basic endpoint smoke test
├── manage_rich_menu.py          — Rich menu management CLI
└── run.py                       — Alternative uvicorn launcher
```

---

## Step 1 — Start the Development Environment

```bash
# 1. Start infrastructure (PostgreSQL + Redis):
docker-compose up -d db redis

# 2. Verify containers are running:
docker ps  # should show skn-postgres and skn-redis

# 3. Seed initial admin user (only if DB is empty):
cd backend
python create_admin.py

# 4. Apply all migrations:
alembic upgrade head

# 5. Start backend:
uvicorn app.main:app --reload

# 6. Start frontend (separate terminal):
cd frontend && npm run dev
```

---

## Step 2 — Write a New Test

```python
# backend/tests/test_my_feature.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import auth_websocket, drain_auth_responses

# REST API test:
def test_my_endpoint():
    client = TestClient(app)
    response = client.get("/api/v1/admin/my-feature")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data

# WebSocket test:
def test_my_ws_event():
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as ws:
        auth_websocket(ws)          # auth + drain 2 messages
        ws.send_json({
            "type": "my_event",
            "payload": {"key": "value"}
        })
        response = ws.receive_json()
        assert response["type"] == "my_event_response"
        assert response["payload"]["status"] == "ok"
```

---

## Step 3 — Create a Proper Admin User (Real bcrypt Password)

```python
# Run from backend/ directory:
# python -c "..."

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.core.security import get_password_hash

async def seed():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT count(*) FROM users"))
        if result.scalar() == 0:
            await conn.execute(text("""
                INSERT INTO users (username, display_name, role, is_active, hashed_password, created_at, updated_at)
                VALUES ('admin', 'Admin', 'ADMIN', true, :pw, NOW(), NOW())
            """), {"pw": get_password_hash("your-secure-password")})
            print("Admin created with real bcrypt hash — can login via /auth/login")
    await engine.dispose()

asyncio.run(seed())
```

---

## Common Issues

### `ModuleNotFoundError: No module named 'app'` when running tests
**Cause:** Running pytest from the wrong directory (project root or `tests/`).
**Fix:** Always run from `backend/`: `cd backend && python -m pytest tests/`

### `seed_admin_sync.py` fails with `database "jsk_app_db" does not exist`
**Cause:** Script hardcodes old DB name `jsk_app_db`; docker-compose creates `skn_app_db`.
**Fix:** Use `create_admin.py` instead (reads `DATABASE_URL` from settings).

### Seeded admin can't login — `401 Incorrect username or password`
**Cause:** `create_admin.py` / `seed_admin_sync.py` insert `hashed_password='hashed_secret'`,
not a real bcrypt hash. `pwd_context.verify()` fails.
**Fix:** Use Step 3 above (real bcrypt hash), or enable DEV_MODE to bypass auth.

### WS test receives wrong message type in assertion
**Cause:** Not draining `auth_success` + `presence_update` before the test assertion.
**Fix:** Call `auth_websocket(ws)` from `conftest.py` or manually drain 2 messages.

### `docker-compose up` starts but backend can't connect to DB
**Cause:** PostgreSQL takes ~2-3 seconds to initialize. FastAPI starts before DB is ready.
**Fix:** Add a small wait or retry in dev, or use `pg_isready` in startup script.

---

## Quality Checklist

When adding or modifying tests:
- [ ] Test file lives in `backend/tests/`
- [ ] Import from `tests.conftest` for WS helpers (`auth_websocket`, `drain_auth_responses`)
- [ ] WS tests drain both `auth_success` and `presence_update` before asserting
- [ ] No `async def` in test functions — use synchronous `def` with `TestClient`
- [ ] Run from `backend/` directory: `cd backend && python -m pytest tests/`

When seeding admin users:
- [ ] Use `create_admin.py` (not `seed_admin_sync.py`) — correct DB name
- [ ] Use `get_password_hash()` for real bcrypt hash if real login needed
- [ ] Confirm tables exist first: `alembic upgrade head` before seeding

## Additional Resources

See `references/devtools_reference.md` for:
- Docker Compose service configuration table
- Complete utility script index with usage
- All 17 test files with their coverage area
- `conftest.py` helper function signatures
