# Core Runtime — Reference

Sources:
- `backend/app/core/config.py`
- `backend/app/db/session.py`
- `backend/app/core/redis_client.py`
- `backend/app/core/pubsub_manager.py`
- `backend/app/core/rate_limiter.py`
- `backend/app/tasks/session_cleanup.py`
- `backend/app/services/business_hours_service.py`
- `backend/app/services/sla_service.py`
- `backend/app/services/csat_service.py`
- `backend/app/services/handoff_service.py`

---

## `config.py` — Settings Fields (Complete)

All fields read from `backend/.env` via `pydantic_settings.BaseSettings`:

| Field | Type | Default | Notes |
|---|---|---|---|
| `PROJECT_NAME` | str | `"JskApp"` | FastAPI app title |
| `API_V1_STR` | str | `"/api/v1"` | URL prefix |
| `ENVIRONMENT` | str | `"development"` | Backend dev bypass check |
| `BACKEND_CORS_ORIGINS` | `List[AnyHttpUrl]` | `[]` | CORS allowed origins |
| `DATABASE_URL` | `PostgresDsn` | _(required)_ | asyncpg connection string |
| `SECRET_KEY` | str | _(required)_ | JWT signing key |
| `ALGORITHM` | str | `"HS256"` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | `30` | Access token TTL |
| `LINE_CHANNEL_ACCESS_TOKEN` | str | `""` | Messaging API token |
| `LINE_CHANNEL_SECRET` | str | `""` | Messaging API secret |
| `LINE_LOGIN_CHANNEL_ID` | str | `""` | LIFF login channel |
| `SERVER_BASE_URL` | str | `""` | Public HTTPS URL for media URLs |
| `WS_RATE_LIMIT_MESSAGES` | int | `30` | Max WS messages per window |
| `WS_RATE_LIMIT_WINDOW` | int | `60` | Rate limit window (seconds) |
| `WS_MAX_MESSAGE_LENGTH` | int | `5000` | Max WS message text length |
| `REDIS_URL` | str | `"redis://localhost:6379/0"` | Redis connection |
| `WEBHOOK_EVENT_TTL` | int | `300` | Dedup TTL (seconds) |
| `SLA_MAX_FRT_SECONDS` | int | `120` | First response time SLA |
| `SLA_MAX_RESOLUTION_SECONDS` | int | `1800` | Resolution time SLA |
| `SLA_MAX_QUEUE_WAIT_SECONDS` | int | `300` | Queue wait SLA |
| `SLA_ALERT_TELEGRAM_ENABLED` | bool | `False` | Telegram SLA alert switch |

Config reads `.env` file (`env_file=".env"`, `env_ignore_empty=True`, `extra="ignore"`).

---

## `db/session.py` — Database Session

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=False,   # Set True for SQL debug logging
    future=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db() -> AsyncSession:   # FastAPI Depends() only
    async with AsyncSessionLocal() as session:
        yield session
```

**Usage patterns:**

```python
# In FastAPI routes (via Depends):
@router.get("/")
async def endpoint(db: AsyncSession = Depends(get_db)):
    ...

# In background tasks, WS handlers, services:
async with AsyncSessionLocal() as db:
    result = await db.execute(select(Model).where(...))
    items = result.scalars().all()
    await db.commit()
```

**SQL debug:** Set `echo=True` to log all SQL to stdout (dev only).

---

## `redis_client.py` — API Reference

```python
from app.core.redis_client import redis_client

# Available methods:
await redis_client.connect()              # Called in startup_event only
await redis_client.disconnect()           # Called in shutdown_event only
await redis_client.setex(key, seconds, value)  # Set with TTL
await redis_client.get(key)               # → str | None
await redis_client.exists(key)            # → bool
await redis_client.delete(key)            # No-op if missing
redis_client.is_connected                 # bool property
```

**Existing key naming patterns in codebase:**

| Key Pattern | TTL | Usage |
|---|---|---|
| `webhook:event:{event_id}` | 300s | Webhook dedup |
| `sla:breach:{session_id}:{metric}` | varies | SLA breach tracking |

**Behaviour when disconnected:** All methods return `False`/`None` and log a warning.
No exceptions raised. Callers must handle `None` from `get()`.

---

## `pubsub_manager.py` — API Reference

```python
from app.core.pubsub_manager import pubsub_manager

# Publish a message to a channel (non-blocking):
await pubsub_manager.publish(channel='my_channel', message={'type': 'event', 'data': {}})

# Subscribe with a callback:
async def my_handler(data: dict):
    # process incoming message
    pass
await pubsub_manager.subscribe('my_channel', my_handler)

# Unsubscribe:
await pubsub_manager.unsubscribe('my_channel', my_handler)  # remove one callback
await pubsub_manager.unsubscribe('my_channel')              # remove all callbacks

# Status:
pubsub_manager.is_connected  # bool property
```

**Lifecycle:**
- Connected inside `ws_manager.initialize()` (during startup)
- Disconnected in `shutdown_event` via `pubsub_manager.disconnect()`
- Listener task runs as asyncio background task once subscribed

**Message format:** All messages are JSON-serialized on publish and deserialized on receive.

---

## `rate_limiter.py` — WebSocket Rate Limiter

```python
from app.core.rate_limiter import ws_rate_limiter

# Already called automatically in ws_live_chat.py main loop — no manual calls needed

# Algorithm: sliding window
# Window: WS_RATE_LIMIT_WINDOW seconds (default 60s)
# Limit: WS_RATE_LIMIT_MESSAGES per window (default 30)

ws_rate_limiter.is_allowed(client_id)   # → bool
ws_rate_limiter.get_remaining(client_id) # → int
ws_rate_limiter.reset(client_id)         # On disconnect
ws_rate_limiter.cleanup_stale(max_age=3600)  # Remove old buckets
```

---

## `session_cleanup.py` — Cleanup Task Constants

```python
INACTIVE_TIMEOUT_MINUTES = 30      # ACTIVE sessions: close if last_activity_at > 30min ago
WAITING_ABANDONMENT_MINUTES = 10   # WAITING sessions: close if claimed_at is None AND started_at > 10min ago
CLEANUP_INTERVAL_SECONDS = 300     # Loop runs every 5 minutes

# On close (both types):
# 1. session.status = CLOSED
# 2. session.closed_by = "SYSTEM" or "SYSTEM_TIMEOUT"
# 3. user.chat_mode = BOT
# 4. create_audit_log(admin_id=None, action="auto_close_session" or "abandon_waiting_session")
# 5. line_service.push_messages(user, [TextMessage("Chat session ended due to inactivity...")])
# 6. ws_manager.broadcast_to_all({"type": "session_closed", "payload": {...}})
# 7. analytics_service.emit_live_kpis_update(db)  ← only at end of batch
```

---

## `business_hours_service.py` — API Reference

```python
from app.services.business_hours_service import business_hours_service

# Check if current Bangkok time is within business hours:
is_open: bool = await business_hours_service.is_within_business_hours(db)
# → False if no BusinessHours row for today, or outside open/close time

# Get next open time as Thai string:
next_open: str = await business_hours_service.get_next_open_time(db)
# → "วันนี้ เวลา 08:00 น."        (today, before open)
# → "เปิดให้บริการอยู่ (ถึง 17:00 น.)"  (currently open)
# → "วันจันทร์ เวลา 08:00 น."     (next available day)
# → "ไม่มีเวลาทำการที่กำหนดไว้"   (no hours configured at all)

# Get full status object:
status: dict = await business_hours_service.get_current_status(db)
# → { is_open, current_hours: {open, close} | None, next_open: str | None, timezone: "Asia/Bangkok" }
```

**DB model**: `BusinessHours` table with `day_of_week` (0=Monday), `open_time`, `close_time`, `is_open`.
Default hours: Mon–Fri 08:00–17:00, Sat–Sun closed. Initialized by `startup_event`.

**Thai day names** (returned by `get_next_open_time`):
`0=วันจันทร์`, `1=วันอังคาร`, `2=วันพุธ`, `3=วันพฤหัสบดี`, `4=วันศุกร์`, `5=วันเสาร์`, `6=วันอาทิตย์`

---

## `sla_service.py` — API Reference

```python
from app.services.sla_service import sla_service

# Check SLA when session is claimed:
await sla_service.check_queue_wait_on_claim(session, db)
# Calculates: (session.claimed_at - session.started_at).total_seconds()
# Threshold: settings.SLA_MAX_QUEUE_WAIT_SECONDS (default 300s)

# Check SLA when session is closed:
await sla_service.check_resolution_on_close(session, db)
# Calculates: (session.closed_at - session.started_at).total_seconds()
# Threshold: settings.SLA_MAX_RESOLUTION_SECONDS (default 1800s)

# Check SLA when first response is sent:
await sla_service.check_frt_on_first_response(session, db)
# Calculates: (session.first_response_at - session.claimed_at).total_seconds()
# Threshold: settings.SLA_MAX_FRT_SECONDS (default 120s)
```

**On breach:** broadcasts `{"type": "sla_alert", "payload": {...}}` to all WS clients,
logs a WARNING. If `SLA_ALERT_TELEGRAM_ENABLED=True`, also sends Telegram alert.

**SLA alert payload:**
```json
{
  "metric": "queue_wait_seconds",
  "value_seconds": 320.5,
  "threshold_seconds": 300,
  "line_user_id": "Uabc...",
  "session_id": 42,
  "severity": "warning",
  "message": "SLA breach: queue_wait_seconds 320.5s > 300s"
}
```

---

## `csat_service.py` — API Reference

```python
from app.services.csat_service import csat_service

# Send survey after session close:
await csat_service.send_survey(line_user_id, session_id)
# Sends 5-star Flex Message via line_service.push_messages()

# Record postback response:
response = await csat_service.record_response(session_id, line_user_id, score, feedback, db)
# Dedup: if CsatResponse already exists for session_id, returns existing record
# score: int 1-5
# feedback: Optional[str]

# Get thank-you message:
text = csat_service.get_thank_you_message(score)
# score 1: "ขอบคุณสำหรับความคิดเห็นค่ะ เราจะนำไปปรับปรุง..."
# score 4-5: "ขอบคุณมากค่ะ ยินดีให้บริการเสมอค่ะ"
```

**Postback data format:** `f"csat|{session_id}|{score}"` (pipe-delimited string)
Parse in `webhook.py` PostbackEvent handler:
```python
if event.postback.data.startswith('csat|'):
    _, sid, sc = event.postback.data.split('|')
    await csat_service.record_response(int(sid), user_id, int(sc), None, db)
```

---

## `handoff_service.py` — API Reference

```python
from app.services.handoff_service import handoff_service

# Check in webhook MessageEvent handler:
initiated = await handoff_service.check_handoff_keywords(text, user, reply_token, db)
# Returns True if handoff was initiated → caller should return early (skip intent matching)
# Returns False if no keyword match OR user already in HUMAN mode

# Runtime-only keyword addition:
handoff_service.add_custom_keyword("ขอผู้เชี่ยวชาญ")

# Get all current keywords (future: from DB):
keywords = await handoff_service.get_configurable_keywords(db)
```

**English keywords (14):**
`agent, human, operator, representative, support, help desk, live person, real person, talk to someone, speak to agent, customer service, need help, talk to human, connect to agent`

**Thai keywords (17):**
`พูดกับเจ้าหน้าที่, ติดต่อเจ้าหน้าที่, คุยกับคน, ขอคน, ต้องการคน, เจ้าหน้าที่, ขอติดต่อแอดมิน, ต้องการความช่วยเหลือ, ขอความช่วยเหลือ, ช่วยด้วย, คุยกับเจ้าหน้าที่, ต้องการเจ้าหน้าที่, ขอสาย, ต่อสาย, คุยสด, เจ้าหน้าที่ให้คำปรึกษา`

**Match logic:** `keyword in text_lower` (substring contains, case-insensitive).
Only triggers if `user.chat_mode == ChatMode.BOT`.

---

## Known Gaps

| ID | Gap | Location | Severity | Fix |
|---|---|---|---|---|
| GAP-1 | Redis down → webhook dedup bypassed silently (dedup key check returns False) | `webhook.py` + `redis_client.py` | Medium | Add explicit `if not redis_client.is_connected: logger.warning(...)` in webhook dedup |
| GAP-2 | CSAT postback not handled in `webhook.py` — survey sent but never recorded | `webhook.py` | High | Add `startswith('csat|')` branch in PostbackEvent handler |
| GAP-3 | Handoff keywords not DB-configurable — `get_configurable_keywords()` has TODO | `handoff_service.py` | Low | Implement TODO: load from `SystemSetting` table |
| GAP-4 | Session cleanup constants not configurable via env | `session_cleanup.py` | Low | Add `INACTIVE_TIMEOUT_MINUTES`/`WAITING_ABANDONMENT_MINUTES` to `config.py` |
| GAP-5 | `SLA_ALERT_TELEGRAM_ENABLED` defaults False — SLA Telegram alerts are disabled | `config.py` | Info | Set `SLA_ALERT_TELEGRAM_ENABLED=True` in `.env` when Telegram is configured |
