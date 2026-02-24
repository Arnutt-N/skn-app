---
name: skn-core-runtime
description: >
  Covers the SKN App backend core runtime layer — configuration, database session,
  Redis caching, Redis pub/sub, WebSocket rate limiting, session cleanup background task,
  business hours service, SLA monitoring, CSAT survey, and keyword handoff.
  Use when asked to "check business hours", "add SLA alert", "send CSAT survey",
  "use Redis for caching", "use redis_client", "use pubsub_manager",
  "use AsyncSessionLocal", "change DB session", "session cleanup timeout",
  "session auto-close", "handoff keyword", "add handoff trigger word",
  "WS rate limit", "rate limiter config", "settings env var", "config.py",
  "CSAT postback", "CSAT score", "SLA threshold", "SLA breach alert",
  "เช็คเวลาทำการ", "ส่ง CSAT", "handoff keyword ภาษาไทย", "auto close session",
  "ตั้งค่า SLA", "redis cache", "pub sub cross server".
  Do NOT use for LINE-specific sending (skn-line-service-ops), live-chat WS events
  (skn-live-chat-ops), or endpoint creation (skn-fastapi-endpoint).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI, SQLAlchemy 2.0 async, Redis (aioredis), PostgreSQL, pytz.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [core, config, redis, database, session, csat, sla, business-hours, handoff, rate-limiter]
  related-skills:
    - skn-fastapi-endpoint
    - skn-live-chat-ops
    - skn-analytics-audit
    - skn-backend-infra
    - skn-webhook-handler
  documentation: ./references/core_runtime_reference.md
---

# skn-core-runtime

The core runtime layer provides shared infrastructure used by almost every other module:

1. **`core/config.py`** — `Settings` Pydantic model loaded from `backend/.env`. The `settings` singleton is imported everywhere.

2. **`db/session.py`** — `AsyncSessionLocal` (the session factory) and `get_db` (FastAPI dependency). Background tasks use `async with AsyncSessionLocal() as db:` — never `Depends()`.

3. **`core/redis_client.py`** — `redis_client` singleton for caching/deduplication: `setex`, `get`, `exists`, `delete`. Gracefully no-ops when Redis is disconnected.

4. **`core/pubsub_manager.py`** — `pubsub_manager` singleton for cross-process WebSocket broadcast via Redis Pub/Sub. Separate Redis connection from `redis_client`.

5. **`core/rate_limiter.py`** — `ws_rate_limiter` singleton: sliding-window WS message rate limiter. Already applied in the WS main loop — do not call manually.

6. **`tasks/session_cleanup.py`** — Background task that closes inactive chat sessions (ACTIVE > 30min, WAITING > 10min with no claim). Sends LINE push and WS broadcast on close.

7. **`services/business_hours_service.py`** — `business_hours_service`: checks if current Bangkok time is within DB-configured hours. Thai day names for user-facing next-open messages.

8. **`services/sla_service.py`** — `sla_service`: 3 check methods called by `live_chat_service`. Broadcasts `sla_alert` to all WebSocket clients when thresholds are exceeded.

9. **`services/csat_service.py`** — `csat_service`: sends a 5-star Flex Message survey, records postback response with dedup, returns localized thank-you.

10. **`services/handoff_service.py`** — `handoff_service`: keyword-triggered BOT→HUMAN handoff. 14 English + 17 Thai keywords hardcoded.

---

## CRITICAL: Project-Specific Rules

1. **Use `AsyncSessionLocal` (not `Depends(get_db)`) inside background tasks and WS handlers** —
   `Depends(get_db)` only works inside FastAPI route functions. Everywhere else (tasks,
   WebSocket handlers, services called from tasks) always use:
   ```python
   from app.db.session import AsyncSessionLocal

   async with AsyncSessionLocal() as db:
       result = await db.execute(...)
       await db.commit()
   ```

2. **`redis_client` and `pubsub_manager` are separate connections — do NOT mix** —
   `redis_client` uses `redis.asyncio` for regular KV operations. `pubsub_manager` uses
   a separate `aioredis` connection in pub/sub mode. The pub/sub connection cannot issue
   regular commands (get/set); the KV connection cannot subscribe to channels:
   ```python
   # Caching / dedup:
   await redis_client.setex('key', 300, 'value')
   await redis_client.exists('key')

   # Cross-process WS broadcast:
   await pubsub_manager.publish('channel', {'type': 'event', 'payload': {}})
   ```

3. **`redis_client` methods fail silently — callers must handle None returns** —
   When Redis is not connected, `get()` returns `None`, `exists()` returns `False`,
   `setex()`/`delete()` do nothing. Code that relies on Redis (e.g. dedup checks)
   should assume Redis may be unavailable:
   ```python
   # Correct:
   if await redis_client.exists(dedup_key):
       return  # silently skip if Redis is unavailable: exists() = False → not skipped
   # WRONG pattern — GAP-1: if Redis is down, webhook dedup is bypassed (no error raised)
   ```

4. **Session cleanup constants are in `tasks/session_cleanup.py` — not in settings** —
   ```python
   INACTIVE_TIMEOUT_MINUTES = 30      # Active sessions
   WAITING_ABANDONMENT_MINUTES = 10   # Unclaimed WAITING sessions
   CLEANUP_INTERVAL_SECONDS = 300     # Runs every 5 minutes
   ```
   To change timeouts, edit the constants. There is no env var for these yet.

5. **CSAT postback data format: `"csat|{session_id}|{score}"` — pipe-delimited** —
   `csat_service._build_survey_flex()` encodes postback data as `f"csat|{session_id}|{i}"`.
   The webhook handler (`webhook.py`) must parse this to call `csat_service.record_response()`:
   ```python
   # In webhook PostbackEvent handler:
   data = event.postback.data  # e.g. "csat|42|4"
   if data.startswith('csat|'):
       _, session_id_str, score_str = data.split('|')
       await csat_service.record_response(int(session_id_str), user_id, int(score_str), None, db)
       await line_service.reply_text(reply_token, csat_service.get_thank_you_message(int(score_str)))
   ```

6. **Handoff keywords are hardcoded in memory — NOT in the database** —
   `HANDOFF_KEYWORDS` list in `handoff_service.py` has 14 EN + 17 TH keywords.
   `get_configurable_keywords()` has a `TODO` comment — it currently just returns the
   hardcoded list. `add_custom_keyword()` only modifies the in-memory list and resets on
   restart. To persist keywords, implement the TODO using `SystemSetting`:
   ```python
   # Existing call site (in webhook.py):
   handoff = await handoff_service.check_handoff_keywords(text, user, reply_token, db)
   if handoff:
       return  # Skip intent matching — handoff initiated
   ```

7. **Business hours uses Asia/Bangkok (UTC+7) — always check via service, not raw datetime** —
   ```python
   from app.services.business_hours_service import business_hours_service

   is_open = await business_hours_service.is_within_business_hours(db)
   # Returns False if no business hours row exists for current day
   # Use in webhook: if not is_open → reply with next open time
   next_open = await business_hours_service.get_next_open_time(db)
   # Returns Thai string: "วันจันทร์ เวลา 08:00 น." or "เปิดให้บริการอยู่ (ถึง 17:00 น.)"
   ```

8. **SLA thresholds come from `settings` — all configurable via env** —
   ```python
   settings.SLA_MAX_FRT_SECONDS = 120         # First response time: 2 minutes
   settings.SLA_MAX_RESOLUTION_SECONDS = 1800  # Resolution time: 30 minutes
   settings.SLA_MAX_QUEUE_WAIT_SECONDS = 300   # Queue wait: 5 minutes
   settings.SLA_ALERT_TELEGRAM_ENABLED = False  # Telegram alerts off by default
   ```
   SLA checks are called by `live_chat_service` — they broadcast `sla_alert` via
   `ws_manager.broadcast_to_all()` when thresholds are exceeded.

9. **`settings.ENVIRONMENT == "development"` controls backend dev bypass — NOT `DEV_MODE`** —
   The backend's development bypass (skip auth in `deps.py`) checks `settings.ENVIRONMENT`.
   The frontend's `NEXT_PUBLIC_DEV_MODE` is a completely separate flag that only affects
   the React auth context mock. Never confuse them:
   ```python
   # Backend bypass (deps.py):
   if settings.ENVIRONMENT == "development":
       return mock_user
   # Frontend bypass (AuthContext.tsx):
   const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
   ```

---

## File Structure

```
backend/app/
├── core/
│   ├── config.py           — Settings: all env vars, settings singleton
│   ├── redis_client.py     — redis_client: setex/get/exists/delete, silent fail
│   ├── pubsub_manager.py   — pubsub_manager: publish/subscribe/unsubscribe
│   └── rate_limiter.py     — ws_rate_limiter: sliding window, auto-applied in WS loop
├── db/
│   └── session.py          — AsyncSessionLocal, get_db, engine (echo=False)
├── tasks/
│   └── session_cleanup.py  — Cleanup loop: 30min inactive, 10min waiting timeout
└── services/
    ├── business_hours_service.py — business_hours_service: Asia/Bangkok check
    ├── sla_service.py            — sla_service: 3 check methods + sla_alert broadcast
    ├── csat_service.py           — csat_service: flex survey, record_response, thank-you
    └── handoff_service.py        — handoff_service: keyword check (EN+TH), BOT-only trigger
```

---

## Step 1 — Use Redis for Caching / Deduplication

```python
from app.core.redis_client import redis_client

# Set with TTL (dedup key):
await redis_client.setex(f'myfeature:dedup:{event_id}', 300, '1')

# Check existence:
if await redis_client.exists(f'myfeature:dedup:{event_id}'):
    return  # already processed

# Get cached value:
cached = await redis_client.get(f'myfeature:cache:{key}')
if cached:
    return json.loads(cached)

# Delete:
await redis_client.delete(f'myfeature:lock:{key}')
```

**Key naming convention:** `{feature}:{purpose}:{identifier}` (e.g. `webhook:event:abc123`)

---

## Step 2 — Check Business Hours in Webhook

```python
from app.services.business_hours_service import business_hours_service

# In a webhook MessageEvent handler:
is_open = await business_hours_service.is_within_business_hours(db)
if not is_open:
    next_open = await business_hours_service.get_next_open_time(db)
    await line_service.reply_text(
        reply_token,
        f"ขณะนี้ปิดทำการ กรุณาติดต่อกลับ {next_open}"
    )
    return
```

---

## Step 3 — Add a New Handoff Keyword

To add a keyword that triggers bot→human handoff:

```python
# Option A: Edit HANDOFF_KEYWORDS directly in handoff_service.py (persists across restarts):
HANDOFF_KEYWORDS_TH = [
    # ...existing keywords...
    "ต้องการผู้เชี่ยวชาญ",   # Add here
]

# Option B: At runtime only (resets on restart):
from app.services.handoff_service import handoff_service
handoff_service.add_custom_keyword("specialist")
```

Implement the TODO in `get_configurable_keywords()` to load from `SystemSetting` for
persistent keyword management without code changes.

---

## Step 4 — Use SLA Service for a New Session Event

When adding a new session lifecycle point (e.g., a message transfer), call the SLA
service if a threshold should be monitored:

```python
from app.services.sla_service import sla_service

# After updating session in DB:
await sla_service.check_queue_wait_on_claim(session, db)
# or
await sla_service.check_resolution_on_close(session, db)
# or
await sla_service.check_frt_on_first_response(session, db)
```

These methods are no-ops if the session object lacks the required timestamps.

---

## Common Issues

### Redis errors crash the app on startup
**Cause:** `redis_client.connect()` catches exceptions and sets `_redis = None` — it
should NOT crash startup. If it does, check that `REDIS_URL` in `backend/.env` is correct.
**Fix:** Verify `REDIS_URL=redis://localhost:6379/0` and that Redis is running:
`docker-compose up -d redis`.

### Sessions not being auto-closed
**Cause:** Cleanup task may not have started, or thresholds not reached yet.
**Check:** Look for `"Session cleanup task started"` in logs. Timeouts are 30min
(active) and 10min (waiting) — the loop runs every 5min.
**Fix:** If the task never started, ensure `await start_cleanup_task()` runs in
`main.py`'s `startup_event`.

### CSAT survey sent but response not recorded
**Cause:** The webhook PostbackEvent handler isn't parsing `"csat|..."` data.
**Fix:** Add the `startswith('csat|')` check to the PostbackEvent handler. See
critical rule #5 for the exact code.

### Business hours always returns False
**Cause:** `BusinessHours` table is empty — `initialize_defaults()` only runs if the
table has no rows. If the table was seeded incorrectly, rows exist but are wrong.
**Fix:** Check `SELECT * FROM business_hours;`. Default hours are Mon–Fri 08:00–17:00.
Delete all rows and restart the app to re-trigger `initialize_defaults()`.

---

## Quality Checklist

Before using any core runtime module:
- [ ] Background task / WS handler uses `async with AsyncSessionLocal() as db:` (not `Depends`)
- [ ] Redis operations handle `None` return from `get()` (Redis may be disconnected)
- [ ] CSAT postback handler in `webhook.py` parses `"csat|{session_id}|{score}"`
- [ ] New handoff keywords added to `HANDOFF_KEYWORDS_EN` or `HANDOFF_KEYWORDS_TH` list
- [ ] Business hours check uses `business_hours_service.is_within_business_hours(db)` with DB session
- [ ] SLA thresholds read from `settings.*` — never hardcoded in service logic
- [ ] `ENVIRONMENT` (backend) and `NEXT_PUBLIC_DEV_MODE` (frontend) are distinct — don't confuse

## Additional Resources

See `references/core_runtime_reference.md` for:
- Complete `Settings` fields table with defaults
- Redis key naming conventions used in the project
- Session cleanup sequence diagram
- CSAT survey flex structure
- SLA threshold table
- Business hours DB model fields
