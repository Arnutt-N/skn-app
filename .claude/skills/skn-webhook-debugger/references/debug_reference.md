# Webhook Debugger — Reference

Extracted from `backend/app/api/v1/endpoints/webhook.py`,
`backend/app/core/redis_client.py`, `backend/app/core/config.py`,
`backend/app/api/v1/endpoints/health.py`,
`backend/app/services/handoff_service.py`, and `backend/app/core/line_client.py`.

---

## Webhook Endpoint

```
POST /api/v1/line/webhook
Headers: X-Line-Signature: <base64(HMAC-SHA256(body, LINE_CHANNEL_SECRET))>
Body: LINE event JSON
Response: "OK" (always 200 if signature valid — processing is in BackgroundTasks)
```

**Signature formula:**
```python
import hmac, hashlib, base64

def sign(body_bytes: bytes, secret: str) -> str:
    return base64.b64encode(
        hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).digest()
    ).decode("utf-8")
```

**Important:** The body must be the raw bytes exactly as sent over the wire.
Re-encoding with `json.dumps()` after reading will produce a different signature.

---

## Event Processing Pipeline

```
POST /line/webhook
    │
    ▼ signature validation (WebhookParser)
    │  ✗ → 400 "Invalid signature"
    │  ✓ → return "OK" immediately
    │
    ▼ BackgroundTasks.add_task(process_webhook_events, events)
    │
    └─► process_webhook_events(events)
            │
            ├─ for each event:
            │   ├─ Get webhookEventId
            │   ├─ Redis EXISTS webhook:event:{id}  ← dedup check
            │   │   └─ EXISTS → skip (silent drop, logged as INFO)
            │   ├─ Redis SETEX webhook:event:{id} 300 "1"
            │   └─ dispatch:
            │       ├─ MessageEvent → handle_message_event()
            │       ├─ PostbackEvent → handle_postback_event()
            │       ├─ FollowEvent → handle_follow_event()
            │       └─ UnfollowEvent → handle_unfollow_event()
```

---

## handle_message_event() Decision Tree

```
handle_message_event(event, db)
    │
    ├─ reply_token == "00000000000000000000000000000000"?
    │   └─ YES → return immediately (LINE verify ping)
    │
    ├─ get_or_create_user(line_user_id, db)
    ├─ refresh_profile(..., stale_after_hours=24)
    ├─ user.last_message_at = now()
    │
    ├─ TextMessageContent?
    │   ├─ save_message(INCOMING, "text")
    │   ├─ broadcast NEW_MESSAGE to WS room
    │   ├─ show_loading_animation()
    │   │
    │   ├─ check_handoff_keywords(text, user, reply_token, db)
    │   │   ├─ match + user.chat_mode == BOT → initiate_handoff() → return True (skip below)
    │   │   └─ no match or HUMAN mode → return False (continue)
    │   │
    │   ├─ text == "ติดตาม" or "สถานะ" → handle_check_status() → return
    │   ├─ re.match(r"^0\d{9}$", text) → handle_bind_phone() → return
    │   │
    │   └─ Intent Matching (4 levels):
    │       1. EXACT IntentKeyword (IntentKeyword.keyword == text, EXACT match_type)
    │       2. Legacy EXACT AutoReply (AutoReply.keyword == text)
    │       3. CONTAINS IntentKeyword (text ILIKE '%keyword%', CONTAINS match_type)
    │       4. Legacy CONTAINS AutoReply (text ILIKE '%keyword%')
    │       └─ No match → logger.info("No auto-reply or intent found") → return (no reply)
    │
    └─ Non-text → _extract_non_text_message() → save_message() → broadcast NEW_MESSAGE
```

---

## Special Commands (Hard-Coded in Webhook)

| User sends | Handler | Action |
|---|---|---|
| `"ติดตาม"` or `"สถานะ"` | `handle_check_status()` | Fetch latest 5 ServiceRequests, reply Flex |
| 10-digit number `0xxxxxxxxx` | `handle_bind_phone()` | Bind phone → ServiceRequest, reply Flex |
| Any handoff keyword | `check_handoff_keywords()` → `initiate_handoff()` | Switch to HUMAN mode, notify Telegram |

---

## Postback Handler Dispatch

```python
# handle_postback_event()
data = event.postback.data

if data == "action=track_requests":
    # same as handle_check_status()
elif data.startswith("csat|"):
    # csat|{session_id}|{score}  → record CSAT score
else:
    pass  # unhandled postbacks are silently ignored
```

**To add a new postback handler:**
```python
elif data.startswith("your_prefix|"):
    await your_handler(line_user_id, data, event.reply_token, db)
```

---

## Redis Deduplication

**Key pattern:** `webhook:event:{webhookEventId}`
**TTL:** `settings.WEBHOOK_EVENT_TTL` = 300 seconds (5 minutes)
**Value:** `"1"` (placeholder — only existence is checked)

```python
# Manual inspection
from app.core.redis_client import redis_client

# Check if event was seen
exists = await redis_client.exists(f"webhook:event:{event_id}")

# Force-clear a specific event (allow reprocessing)
await redis_client.delete(f"webhook:event:{event_id}")

# Get remaining TTL (redis-cli only):
# redis-cli TTL webhook:event:{id}
```

**Edge case — Redis is down:**
- `redis_client.exists()` returns `False` (from `except` handler)
- `redis_client.setex()` silently no-ops
- Events are processed but **NOT deduplicated** (duplicates will be handled)
- Health check shows `redis: false`

---

## Circuit Breaker State

Attributes on the `line_service` singleton:

| Attribute | Type | Healthy value |
|---|---|---|
| `_cb_failures` | `int` | 0 |
| `_cb_open_until` | `datetime \| None` | `None` |
| `_cb_failure_threshold` | `int` | 5 (hardcoded) |
| `_cb_recovery_timeout_seconds` | `int` | 30 (hardcoded) |

**State inspection:**
```python
from app.services.line_service import line_service
print(line_service._cb_failures)    # 0-5
print(line_service._cb_open_until)  # None = closed, datetime = open until
```

**Operations that trip the circuit:**
`reply_text`, `reply_flex`, `reply_messages`, `push_messages`, `push_image_message`
(`show_loading_animation` is protected internally — never raises)

**Reset (dev only, same process):**
```python
line_service._cb_failures = 0
line_service._cb_open_until = None
```

---

## Health Check Endpoints

```
GET /api/v1/health
→ {"database": bool, "redis": bool, "status": "healthy"|"degraded"|"unhealthy"}

GET /api/v1/health/detailed
→ {
    "timestamp": "...",
    "status": "healthy|degraded|unhealthy",
    "services": {
        "database": {"status": "healthy", "latency_ms": 1.2},
        "redis": {"status": "healthy", "connected": true},
        "websocket": {WsHealthMonitor.get_health_status()}
    }
  }

GET /api/v1/health/websocket
→ ws_health_monitor.get_health_status() + ws_manager.get_stats()
```

---

## Handoff Keyword List

Defined in `backend/app/services/handoff_service.py` — `HANDOFF_KEYWORDS`:

**English:**
`agent`, `human`, `operator`, `representative`, `support`, `help desk`,
`live person`, `real person`, `talk to someone`, `speak to agent`,
`customer service`, `need help`, `talk to human`, `connect to agent`

**Thai:**
`พูดกับเจ้าหน้าที่`, `ติดต่อเจ้าหน้าที่`, `คุยกับคน`, `ขอคน`, `ต้องการคน`,
`เจ้าหน้าที่`, `ขอติดต่อแอดมิน`, `ต้องการความช่วยเหลือ`, `ขอความช่วยเหลือ`,
`ช่วยด้วย`, `คุยกับเจ้าหน้าที่`, `ต้องการเจ้าหน้าที่`, `ขอสาย`, `ต่อสาย`,
`คุยสด`, `เจ้าหน้าที่ให้คำปรึกษา`

**Match logic:** `any(kw in text.lower() for kw in HANDOFF_KEYWORDS)` — substring match

**Guard:** Only triggers if `user.chat_mode == ChatMode.BOT`.
If user is already in HUMAN mode, keyword is silently ignored.

---

## Mock Event JSON Templates

### Text Message Event
```json
{
    "destination": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "events": [{
        "type": "message",
        "mode": "active",
        "timestamp": 1700000000000,
        "source": {"type": "user", "userId": "Utest001"},
        "webhookEventId": "UNIQUE_ID_HERE",
        "deliveryContext": {"isRedelivery": false},
        "replyToken": "ffffffffffffffffffffffffffffffff",
        "message": {
            "id": "123456789",
            "type": "text",
            "text": "ราคา"
        }
    }]
}
```

### Follow Event
```json
{
    "destination": "Uxxxxxxxx",
    "events": [{
        "type": "follow",
        "mode": "active",
        "timestamp": 1700000000000,
        "source": {"type": "user", "userId": "Utest001"},
        "webhookEventId": "UNIQUE_ID",
        "deliveryContext": {"isRedelivery": false},
        "replyToken": "ffffffffffffffffffffffffffffffff"
    }]
}
```

### Postback Event
```json
{
    "destination": "Uxxxxxxxx",
    "events": [{
        "type": "postback",
        "mode": "active",
        "timestamp": 1700000000000,
        "source": {"type": "user", "userId": "Utest001"},
        "webhookEventId": "UNIQUE_ID",
        "deliveryContext": {"isRedelivery": false},
        "replyToken": "ffffffffffffffffffffffffffffffff",
        "postback": {
            "data": "action=track_requests"
        }
    }]
}
```

### LINE Verify Ping (triggers dummy token guard)
```json
{
    "destination": "Uxxxxxxxx",
    "events": [{
        "type": "message",
        "mode": "active",
        "timestamp": 1700000000000,
        "source": {"type": "user", "userId": "Utest001"},
        "webhookEventId": "UNIQUE_ID",
        "deliveryContext": {"isRedelivery": false},
        "replyToken": "00000000000000000000000000000000",
        "message": {"id": "1", "type": "text", "text": "hello"}
    }]
}
```

---

## Config Settings Reference

| Setting | Default | Purpose |
|---|---|---|
| `LINE_CHANNEL_SECRET` | `""` | Signs webhook events — used by `WebhookParser` |
| `LINE_CHANNEL_ACCESS_TOKEN` | `""` | Used by `line_service` to call LINE API |
| `WEBHOOK_EVENT_TTL` | `300` | Redis dedup TTL in seconds |
| `REDIS_URL` | `"redis://localhost:6379/0"` | Redis connection |
| `ENVIRONMENT` | `"development"` | `"development"` enables auth bypass in `deps.py` |
| `SERVER_BASE_URL` | `""` | Must be set for HTTPS media URLs (required by LINE) |

---

## Logger Names

| Module | Logger name |
|---|---|
| `webhook.py` | `app.api.v1.endpoints.webhook` |
| `handoff_service.py` | `app.services.handoff_service` |
| `line_service.py` | `app.services.line_service` |
| `redis_client.py` | `app.core.redis_client` |
| `friend_service.py` | `app.services.friend_service` |

**Enable DEBUG for specific logger:**
```python
import logging
logging.getLogger("app.api.v1.endpoints.webhook").setLevel(logging.DEBUG)
```

---

## Key Imports for Debug Scripts

```python
# Direct function call (bypasses HTTP + signature)
from app.api.v1.endpoints.webhook import process_webhook_events

# DB session
from app.db.session import AsyncSessionLocal

# Redis
from app.core.redis_client import redis_client

# Circuit breaker state
from app.services.line_service import line_service

# Config
from app.core.config import settings

# Handoff keywords
from app.services.handoff_service import HANDOFF_KEYWORDS

# Intent models
from app.models.intent import IntentKeyword, IntentCategory, IntentResponse, MatchType
from app.models.auto_reply import AutoReply
```
