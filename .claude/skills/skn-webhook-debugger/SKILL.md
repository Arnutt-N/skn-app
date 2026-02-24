---
name: skn-webhook-debugger
description: >
  Debugs, tests, and traces the LINE webhook pipeline in the SKN App (JskApp).
  Use when asked to "debug webhook", "test webhook event", "send mock event",
  "webhook not responding", "intent not matching", "deduplication issue",
  "webhook 400 invalid signature", "circuit breaker open", "check health",
  "แก้ bug webhook", "ทดสอบ webhook", "ส่ง mock event", "ดู log webhook".
  Do NOT use for adding new event handlers (use skn-webhook-handler instead).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend on localhost:8000,
  Redis via docker-compose, Python 3.11+ venv.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: devops
  tags: [webhook, debug, testing, redis, circuit-breaker, health]
---

# SKN Webhook Debugger

Provides tools, scripts, and step-by-step instructions for debugging the LINE
webhook pipeline — from signature validation through Redis dedup, intent
matching, and LINE API response.

---

## CRITICAL: Project-Specific Rules

These rules are non-negotiable and must be followed every time:

1. **Two methods to inject test events** — (A) Signed POST to `/api/v1/line/webhook`
   (real HTTP with computed HMAC signature); (B) Call `process_webhook_events()`
   directly in a script (no signature needed). Method B is far easier for debugging.

2. **Redis dedup is a silent drop** — if a `webhookEventId` was seen within 5 minutes
   (`WEBHOOK_EVENT_TTL=300`), the event is dropped with no log error and no HTTP error.
   Always use unique `webhookEventId` values in test payloads, OR clear the Redis key first.

3. **Signature formula** — `base64(HMAC-SHA256(body_bytes, LINE_CHANNEL_SECRET.encode()))`
   The secret is the raw string from `settings.LINE_CHANNEL_SECRET`. The body must be
   byte-identical to what is signed — no extra whitespace or re-encoding.

4. **Logger names follow module path** — the webhook logger is
   `logging.getLogger("app.api.v1.endpoints.webhook")`. To see `DEBUG` level output,
   set `LOGGING_LEVEL=DEBUG` or configure uvicorn with `--log-level debug`.

5. **Circuit breaker state is on `line_service` singleton** — check
   `line_service._cb_failures` (int) and `line_service._cb_open_until` (datetime|None).
   A non-None `_cb_open_until` means LINE API calls are blocked until that datetime.

6. **Verify dummy token is `"00000000000000000000000000000000"` (32 zeros)** — this is
   how LINE verifies your webhook during OA setup. The handler returns immediately without
   processing. Never include this in test events when you want intent matching to fire.

7. **`process_webhook_events()` opens its own DB session** — it uses `AsyncSessionLocal()`
   internally. Never pass an existing `db` session to it; it creates its own `async with`.

8. **FastAPI TestClient is sync, webhook processing is async** — `TestClient.post()` will
   send the HTTP request but the `BackgroundTasks` event processing may not complete before
   the test returns. Use `asyncio.run()` + direct function call for reliable testing.

9. **Health check endpoints exist at `/api/v1/health`** — use these first before deeper
   debugging to rule out DB/Redis/WebSocket connectivity issues.

10. **Intent matching order** (reference for tracing):
    EXACT IntentKeyword → CONTAINS IntentKeyword → Legacy EXACT AutoReply → Legacy CONTAINS AutoReply.
    If none match, `logger.info("No auto-reply or intent found for: {text}")` is logged and
    no reply is sent (silent drop — not an error).

---

## Context7 Docs

Context7 MCP is active in this project (`.mcp.json`). Use it before writing test code.

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | TestClient, BackgroundTasks, HTTPException |
| httpx | `"httpx"` | AsyncClient, post, headers |
| redis-py | `"redis"` | asyncio, from_url, setex, delete |
| linebot.v3 | `"line-bot-sdk-python"` | WebhookParser, events, MessageEvent |

---

## Step 1: Health Check (Start Here)

Before debugging the webhook logic, confirm all services are running:

```bash
# From terminal
curl http://localhost:8000/api/v1/health
```

Expected healthy response:
```json
{"database": true, "redis": true, "status": "healthy"}
```

Detailed check (shows latency + WebSocket stats):
```bash
curl http://localhost:8000/api/v1/health/detailed
```

**If `database: false`:** PostgreSQL container is not running → `docker-compose up -d db`
**If `redis: false`:** Redis container is not running → `docker-compose up -d redis`
**If `status: "degraded"`:** Redis is down but DB is up — dedup won't work (events process but no dedup protection)

---

## Step 2: Check Circuit Breaker State

If LINE replies are not being sent, the circuit breaker may be open:

```python
# backend/debug_circuit.py
import asyncio, sys
sys.path.insert(0, ".")

async def check_circuit():
    from app.services.line_service import line_service
    from datetime import datetime

    failures = line_service._cb_failures
    open_until = line_service._cb_open_until

    print(f"Failures: {failures} / {line_service._cb_failure_threshold}")
    if open_until:
        remaining = (open_until - datetime.utcnow()).total_seconds()
        if remaining > 0:
            print(f"Circuit OPEN — clears in {remaining:.0f}s")
        else:
            print(f"Circuit OPEN but expired — will close on next successful call")
    else:
        print("Circuit CLOSED — normal operation")

asyncio.run(check_circuit())
```

Run from `backend/`:
```bash
cd backend && python debug_circuit.py
```

**To manually reset the circuit:**
```python
from app.services.line_service import line_service
line_service._cb_failures = 0
line_service._cb_open_until = None
```
(only effective if backend is running in same process — for production, restart the server)

---

## Step 3: Inject a Mock Event (Direct Method — Recommended)

This bypasses signature validation entirely. Run from `backend/`:

```python
# backend/debug_webhook.py
import asyncio, sys
sys.path.insert(0, ".")

# Set Windows event loop policy if needed
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def inject_text_event(line_user_id: str, text: str):
    """Inject a text message event directly into the processing pipeline."""
    from app.api.v1.endpoints.webhook import process_webhook_events
    from linebot.v3.webhooks import (
        MessageEvent, TextMessageContent, Source
    )
    from datetime import datetime
    import uuid

    # Construct mock event — mirrors real LINE event structure
    mock_event = MessageEvent(
        reply_token="test_reply_token_" + uuid.uuid4().hex[:8],
        webhook_event_id=uuid.uuid4().hex,           # Unique — avoids Redis dedup
        type="message",
        mode="active",
        timestamp=int(datetime.utcnow().timestamp() * 1000),
        source=type("Source", (), {"user_id": line_user_id, "type": "user"})(),
        message=TextMessageContent(
            id=str(uuid.uuid4().int)[:10],
            type="text",
            text=text,
            emojis=[]
        )
    )

    print(f"Injecting event: user={line_user_id}, text='{text}'")
    await process_webhook_events([mock_event])
    print("Done. Check backend logs for intent matching result.")

asyncio.run(inject_text_event("U_test_user_001", "ราคา"))
```

```bash
cd backend && python debug_webhook.py
```

**Note on reply_token:** The test `reply_token` will fail when `line_service.reply_*()` is called
(invalid token → LINE API 400). This is expected — the intent match still happens and is logged.
To suppress the error, set `reply_token = "00000000000000000000000000000000"` (but that triggers
the verify-dummy guard and exits immediately). Best: use a real reply token from a live event.

---

## Step 4: Send a Signed HTTP Request

Use this when you want to test the full HTTP path including signature validation:

```python
# backend/send_signed_webhook.py
import hmac, hashlib, base64, json, httpx, asyncio, uuid

LINE_CHANNEL_SECRET = "your_channel_secret_here"  # from backend/.env
WEBHOOK_URL = "http://localhost:8000/api/v1/line/webhook"

def compute_signature(body_bytes: bytes, secret: str) -> str:
    """Compute X-Line-Signature for a webhook body."""
    hash_ = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256)
    return base64.b64encode(hash_.digest()).decode("utf-8")

async def send_mock_text_event(line_user_id: str, text: str):
    payload = {
        "destination": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # OA User ID (any valid format)
        "events": [
            {
                "type": "message",
                "mode": "active",
                "timestamp": 1700000000000,
                "source": {"type": "user", "userId": line_user_id},
                "webhookEventId": uuid.uuid4().hex,   # ← MUST be unique each run
                "deliveryContext": {"isRedelivery": False},
                "replyToken": "ffffffffffffffffffffffffffffffff",
                "message": {
                    "id": "123456789",
                    "type": "text",
                    "text": text
                }
            }
        ]
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    sig = compute_signature(body, LINE_CHANNEL_SECRET)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            WEBHOOK_URL,
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-Line-Signature": sig
            }
        )
    print(f"Status: {resp.status_code}, Body: {resp.text}")

asyncio.run(send_mock_text_event("U_test_001", "ราคา"))
```

---

## Step 5: Inspect Redis Dedup Cache

Check if a specific event ID is cached (causing it to be dropped):

```python
# backend/debug_redis.py
import asyncio, sys
sys.path.insert(0, ".")

async def check_event(event_id: str):
    from app.core.redis_client import redis_client
    await redis_client.connect()

    key = f"webhook:event:{event_id}"
    exists = await redis_client.exists(key)
    value = await redis_client.get(key)

    print(f"Key: {key}")
    print(f"Exists: {exists}, Value: {value}")

    # To clear it so the event can be reprocessed:
    # await redis_client.delete(key)
    # print("Cleared.")

asyncio.run(check_event("your_webhook_event_id_here"))
```

**List all dedup keys (requires redis-cli):**
```bash
redis-cli KEYS "webhook:event:*"
redis-cli TTL "webhook:event:abc123"  # Remaining TTL in seconds
redis-cli DEL "webhook:event:abc123"  # Force clear a specific event
```

**Clear ALL dedup keys (dev only):**
```bash
redis-cli KEYS "webhook:event:*" | xargs redis-cli DEL
```

---

## Step 6: Trace Intent Matching

To understand why an intent did/did not match, check the SQL logic step by step:

```python
# backend/debug_intent.py
import asyncio, sys
sys.path.insert(0, ".")

async def trace_intent(text: str):
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select, func, literal
    from app.models.intent import IntentKeyword, IntentCategory, IntentResponse, MatchType
    from app.models.auto_reply import AutoReply
    from sqlalchemy.orm import selectinload

    async with AsyncSessionLocal() as db:
        print(f"\n=== Intent trace for: '{text}' ===\n")

        # Step 1: EXACT IntentKeyword
        stmt = select(IntentKeyword).options(
            selectinload(IntentKeyword.category)
        ).filter(
            IntentKeyword.keyword == text,
            IntentKeyword.match_type == MatchType.EXACT
        )
        result = await db.execute(stmt)
        match = result.scalars().first()
        if match:
            print(f"[MATCH] Step 1 — EXACT IntentKeyword: '{match.keyword}' → category '{match.category.name}'")
            return

        print(f"[MISS] Step 1 — No EXACT IntentKeyword for '{text}'")

        # Step 2: Legacy EXACT AutoReply
        stmt = select(AutoReply).filter(AutoReply.keyword == text, AutoReply.is_active == True)
        result = await db.execute(stmt)
        rule = result.scalars().first()
        if rule:
            print(f"[MATCH] Step 2 — Legacy EXACT AutoReply: '{rule.keyword}'")
            return

        print(f"[MISS] Step 2 — No Legacy EXACT AutoReply")

        # Step 3: CONTAINS IntentKeyword
        stmt = select(IntentKeyword).options(
            selectinload(IntentKeyword.category)
        ).filter(
            literal(text).ilike(func.concat('%', IntentKeyword.keyword, '%')),
            IntentKeyword.match_type == MatchType.CONTAINS
        ).limit(1)
        result = await db.execute(stmt)
        match = result.scalars().first()
        if match:
            print(f"[MATCH] Step 3 — CONTAINS IntentKeyword: '{match.keyword}' → category '{match.category.name}'")
            return

        print(f"[MISS] Step 3 — No CONTAINS IntentKeyword")

        # Step 4: Legacy CONTAINS AutoReply
        stmt = select(AutoReply).filter(
            literal(text).ilike(func.concat('%', AutoReply.keyword, '%')),
            AutoReply.is_active == True
        ).limit(1)
        result = await db.execute(stmt)
        rule = result.scalars().first()
        if rule:
            print(f"[MATCH] Step 4 — Legacy CONTAINS AutoReply: '{rule.keyword}'")
            return

        print(f"[MISS] Step 4 — No match found. Webhook would return silently (no reply).")

asyncio.run(trace_intent("ขอราคาหน่อยครับ"))
```

---

## Step 7: Inspect Uvicorn Logs

**Key log messages to look for:**

| Log message | Logger | Meaning |
|---|---|---|
| `"Duplicate webhook event {id}, skipping"` | webhook | Redis dedup fired — event dropped |
| `"Received Verify Event (dummy token). Skipping reply."` | webhook | LINE OA verification ping — normal |
| `"User {id} followed the OA"` | webhook | Follow event processed |
| `"No auto-reply or intent found for: {text}"` | webhook | 4-level matching found nothing |
| `"No active responses found for category: {name}"` | webhook | Category found but all responses inactive |
| `"Category '{name}' is inactive."` | webhook | Category exists but `is_active=False` |
| `"Handoff keyword detected: '{kw}' for user {id}"` | handoff | Handoff triggered, skip intent |
| `"Failed to initiate handoff for user {id}: {e}"` | handoff | Handoff error |
| `"LINE API circuit is open"` | line_service | Circuit breaker — LINE blocked |
| `"Redis connected successfully"` | redis | Startup success |
| `"Failed to connect to Redis: {e}"` | redis | Redis unreachable |

**Enable DEBUG logging** in uvicorn:
```bash
cd backend
uvicorn app.main:app --reload --log-level debug
```

Or set in code (useful in debug scripts):
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logging.getLogger("app.api.v1.endpoints.webhook").setLevel(logging.DEBUG)
```

---

## Examples

### Example 1: "Webhook ไม่ตอบกลับ — ไม่มีอะไรเกิดขึ้น"

**Diagnosis flow:**
1. `GET /api/v1/health` → check DB and Redis are up
2. Check uvicorn logs for `"Duplicate webhook event"` → if yes, Redis dedup is dropping it
3. Check logs for `"No auto-reply or intent found"` → intent matching not finding a match
4. Run `debug_intent.py` with the user's text to trace all 4 levels
5. Check if category `is_active=True` and has active responses

### Example 2: "Webhook ส่งกลับ 400 Invalid signature"

**Cause:** `X-Line-Signature` is wrong.
**Fix:**
```python
# Recompute correctly
import hmac, hashlib, base64
sig = base64.b64encode(
    hmac.new(
        settings.LINE_CHANNEL_SECRET.encode("utf-8"),
        body_bytes,   # exact bytes POSTed — no extra whitespace
        hashlib.sha256
    ).digest()
).decode("utf-8")
```
**Common mistake:** using `json.dumps()` with default formatting adds spaces after `:` and `,`;
the body sent must be byte-identical to the body used for signing.

### Example 3: "LINE API error / replies not sending"

**Steps:**
1. Run `debug_circuit.py` → check if `_cb_open_until` is set
2. If circuit is open, wait for it to expire (30s), then retry
3. If circuit is closed but still failing, check `LINE_CHANNEL_ACCESS_TOKEN` in DB:
   ```bash
   # psql
   SELECT value FROM system_settings WHERE key = 'LINE_CHANNEL_ACCESS_TOKEN';
   ```
4. Verify the token is still valid (tokens can expire or be regenerated in LINE Console)

### Example 4: "Handoff keyword is not triggering"

**Steps:**
1. Check if user `chat_mode == "HUMAN"` — handoff only fires in `BOT` mode
2. Print `HANDOFF_KEYWORDS` list and confirm the user's text contains one:
   ```python
   from app.services.handoff_service import HANDOFF_KEYWORDS
   text = "ขอติดต่อเจ้าหน้าที่"
   print(any(kw in text.lower() for kw in HANDOFF_KEYWORDS))
   ```
3. Check business hours — `live_chat_service.initiate_handoff()` may reject outside hours

### Example 5: "Test event works in dev but not production"

**Most common causes:**
- `WEBHOOK_EVENT_TTL=300` — if you resent the same event within 5 min, it's deduped
- `SERVER_BASE_URL` not set — media URLs are relative, not HTTPS-absolute (LINE won't load them)
- `ENVIRONMENT` not set to `"production"` — auth bypass is still active
- `LINE_CHANNEL_SECRET` mismatch between .env and LINE Console

---

## Common Issues

### `400 Invalid signature` on webhook POST
**Cause:** HMAC computed on wrong data (re-encoded string vs raw bytes) or wrong secret.
**Fix:** Use `body = await request.body()` (raw bytes) — never re-encode after reading.

### Events dropped silently (no log, no reply)
**Cause:** Redis dedup cache hit — `webhook:event:{id}` exists with TTL.
**Fix:** Use unique `webhookEventId` per test, or `redis-cli DEL webhook:event:{id}`.

### `"No auto-reply or intent found for: {text}"` logged, but intent exists in DB
**Cause:** Intent keyword case mismatch or wrong `MatchType`. EXACT is case-sensitive;
CONTAINS uses `ILIKE` (case-insensitive). Check:
```sql
SELECT keyword, match_type FROM intent_keywords WHERE keyword ILIKE '%ราคา%';
```

### `"Category is inactive"` log
**Cause:** `IntentCategory.is_active = False`.
**Fix:** Update via `PUT /api/v1/admin/intents/categories/{id}` with `"is_active": true`.

### BackgroundTasks not completing in tests
**Cause:** `TestClient.post()` returns before background tasks run.
**Fix:** Call `process_webhook_events([event])` directly with `asyncio.run()`.

### `"LINE API circuit is open"` — replies blocked
**Cause:** 5+ consecutive LINE API failures opened the circuit (stays open 30s).
**Fix:** Wait 30s; fix the LINE API issue (invalid token, network); circuit auto-resets on next success.

---

## Quality Checklist

Before finishing a debug session, verify:
- [ ] All debug scripts run from `backend/` directory (not root)
- [ ] Test `webhookEventId` values are unique (use `uuid.uuid4().hex`)
- [ ] Debug scripts never hardcode production credentials — read from `.env`
- [ ] Redis dedup cache not polluted with test event IDs (clear after testing)
- [ ] Uvicorn restarted if circuit breaker state was manually reset (singleton is per-process)
- [ ] `asyncio.WindowsSelectorEventLoopPolicy` set on Windows for async scripts
