# Dev Tools — Reference

Sources: `docker-compose.yml`, `backend/tests/conftest.py`, `backend/tests/test_websocket.py`,
`backend/create_admin.py`, `backend/seed_admin_sync.py`

---

## Docker Compose — Service Configuration

```yaml
# docker-compose.yml — only db and redis (no backend/frontend services)
version: '3.8'
services:
  db:
    container_name: skn-postgres
    image:          postgres:16-alpine
    POSTGRES_USER:  postgres
    POSTGRES_PASSWORD: password
    POSTGRES_DB:    skn_app_db        # ← correct DB name
    port:           5432:5432
    volume:         postgres_data

  redis:
    container_name: skn-redis
    image:          redis:7-alpine
    port:           6379:6379
    volume:         redis_data
```

**Common commands:**
```bash
docker-compose up -d db redis        # start both services
docker-compose stop                  # stop (preserve volumes)
docker-compose down                  # stop + remove containers (preserve volumes)
docker-compose down -v               # stop + remove containers + DELETE volumes
docker ps                            # verify running
docker logs skn-postgres             # DB startup logs
```

**Connection string for `backend/.env`:**
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/skn_app_db
REDIS_URL=redis://localhost:6379/0
```

---

## Utility Scripts Index (`backend/*.py`)

| Script | Purpose | Run from |
|---|---|---|
| `create_admin.py` | Async admin seed — reads DATABASE_URL, idempotent | `backend/` |
| `seed_admin_sync.py` | Sync psycopg2 seed — ⚠️ hardcoded `jsk_app_db` | `backend/` |
| `debug_routes.py` | Print all registered FastAPI routes | `backend/` |
| `list_routes.py` | Alternative route listing | `backend/` |
| `debug_token.py` | Decode/verify a JWT token string | `backend/` |
| `debug_settings.py` | Print loaded settings values | `backend/` |
| `verify_db.py` | Test DB connection + query | `backend/` |
| `verify_api.py` | HTTP smoke test key endpoints | `backend/` |
| `test_endpoint.py` | Basic endpoint smoke test | `backend/` |
| `test_db_conn.py` | Async DB connection check | `backend/` |
| `list_users_debug.py` | Print all users from DB | `backend/` |
| `find_users.py` | Search users by criteria | `backend/` |
| `manage_rich_menu.py` | Rich menu CLI (create/list/delete/set-default) | `backend/` |
| `add_enum_value.py` | Add value to PostgreSQL enum type | `backend/` |
| `fix_db_enum.py` | Fix enum type inconsistencies | `backend/` |
| `check_migration.py` | Check Alembic migration state | `backend/` |
| `debug_heads.py` | Show Alembic branch heads | `backend/` |
| `import_data.py` | Import data from CSV/Excel | `backend/` |
| `read_csv.py` | Read and inspect CSV files | `backend/` |
| `read_excel.py` | Read and inspect Excel files | `backend/` |
| `run.py` | Alternative uvicorn launcher | `backend/` |
| `run_tests_internal.py` | Run tests programmatically | `backend/` |

---

## `conftest.py` — Test Helpers

```python
# backend/tests/conftest.py

@pytest.fixture
def test_client() -> TestClient:
    """Create a test client for API tests. Use as function parameter."""
    return TestClient(app)

def drain_auth_responses(websocket) -> None:
    """Drain the 2 mandatory post-auth server messages.
    Always call after send_json auth, before your test assertions."""
    websocket.receive_json()  # auth_success
    websocket.receive_json()  # presence_update

def auth_websocket(websocket, admin_id: str = "1") -> None:
    """Authenticate + drain. One-liner for WS test setup."""
    websocket.send_json({"type": "auth", "payload": {"admin_id": admin_id}})
    drain_auth_responses(websocket)
```

**Import in tests:**
```python
from tests.conftest import auth_websocket, drain_auth_responses
```

---

## Test Files — Coverage Map (17 files)

| File | What it tests |
|---|---|
| `test_websocket.py` | Connect, auth, ping/pong, auth-guard, unknown message type |
| `test_websocket_manager_redis.py` | Redis pub/sub cross-process WS message routing |
| `test_ws_security.py` | Rate limiting (> 30 msg/min), input length limit, auth enforcement |
| `test_live_chat_service.py` | Session claim, close, operator assignment, message routing |
| `test_session_claim.py` | Claim waiting session logic edge cases |
| `test_session_cleanup.py` | Auto-close after 30min (active) / 10min (waiting) |
| `test_multi_operator.py` | Multiple operators in same conversation room |
| `test_reconnection.py` | WS reconnect — session state preserved after disconnect |
| `test_webhook_deduplication.py` | Redis dedup (same event_id → processed once) |
| `test_webhook_media.py` | Image/file webhook event handling, media persistence |
| `test_sla_service.py` | FRT, queue wait, resolution time breach detection |
| `test_analytics_service.py` | KPI calculation (waiting count, CSAT avg, FCR rate) |
| `test_admin_analytics_export_endpoints.py` | CSV/PDF export endpoint responses |
| `test_friend_service.py` | Friend list, status filter, event history |
| `test_tag_service.py` | Tag CRUD, UserTag junction, value uniqueness |
| `test_live_chat_media_service.py` | Media upload/download in live chat context |
| `test_line_service_circuit_breaker.py` | Circuit breaker: 5 failures → open, 30s cooldown |

---

## WebSocket Test Pattern

```python
# Full WS test template:
def test_ws_feature():
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/live-chat") as ws:
        # Step 1: Authenticate (always first)
        auth_websocket(ws)              # sends auth + drains 2 responses

        # Step 2: Join a room (if needed)
        ws.send_json({"type": "join_room", "payload": {"line_user_id": "U123"}})
        room_response = ws.receive_json()
        assert room_response["type"] == "conversation_update"

        # Step 3: Your test operation
        ws.send_json({"type": "send_message", "payload": {"text": "hello"}})
        sent = ws.receive_json()
        assert sent["type"] == "message_sent"
        assert sent["payload"]["text"] == "hello"
```

---

## Known Gaps

| ID | Gap | Location | Severity |
|---|---|---|---|
| GAP-1 | `seed_admin_sync.py` hardcodes `jsk_app_db` (old name) — fails with docker-compose | `seed_admin_sync.py` | Medium |
| GAP-2 | Both seed scripts insert `hashed_password='hashed_secret'` — seeded admin can't login | `create_admin.py`, `seed_admin_sync.py` | High |
| GAP-3 | No `docker-compose.yml` health checks — backend starts before DB is ready | `docker-compose.yml` | Low |
| GAP-4 | No `backend` or `frontend` service in docker-compose — full stack requires manual steps | `docker-compose.yml` | Info |
| GAP-5 | Tests assume `ENVIRONMENT=development` auth bypass — would fail in production mode | `tests/` | Medium |
