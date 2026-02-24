---
name: skn-analytics-audit
description: >
  Adds, modifies, or queries analytics KPIs and audit logs in the SKN App (JskApp).
  Covers the analytics dashboard endpoints (live KPIs, operator performance, hourly stats,
  dashboard aggregates), the audit log endpoints (filtered log list, action stats),
  and the @audit_action decorator for recording admin actions.
  Use when asked to "add KPI", "get operator performance", "dashboard analytics",
  "audit log", "track admin action", "SLA metrics", "CSAT score", "FCR rate",
  "hourly message stats", "operator stats", "เพิ่ม KPI", "ดู audit log",
  "track action ใน admin", "ดู performance operator".
  Do NOT use for service request stats (skn-service-request) or live chat session
  lifecycle (skn-live-chat-ops).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend, PostgreSQL, Redis (for SLA breach events).
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [analytics, audit, kpi, dashboard, reporting]
  related-skills:
    - skn-auth-security
    - skn-fastapi-endpoint
    - skn-live-chat-ops
    - skn-performance-audit
  documentation: ./references/analytics_reference.md
---

# skn-analytics-audit

Covers two reporting subsystems:
1. **Analytics** (`admin_analytics.py` + `analytics_service.py`) — real-time KPIs,
   operator performance, hourly message charts, and dashboard aggregates.
2. **Audit** (`admin_audit.py` + `AuditLog` model) — filtered audit log queries,
   action/resource breakdowns, and the `@audit_action` decorator.

Both subsystems were built as part of Phase 4 (by Kimi Code) and are fully registered.

---

## CRITICAL: Project-Specific Rules

1. **All analytics endpoints require `get_current_admin`** — every route in
   `admin_analytics.py` and `admin_audit.py` uses `Depends(get_current_admin)`.
   Do not remove or relax this dependency.

2. **`analytics_service` is a singleton** — `analytics_service = AnalyticsService()`
   at module level in `analytics_service.py`. Import and use the singleton, do not
   instantiate the class directly.

3. **FRT is measured from `claimed_at` to `first_response_at`** — both fields are on
   `ChatSession`. FRT is calculated only for sessions where `first_response_at` is
   not null. The window is "last 1 hour" for live KPIs.

4. **CSAT scores come from `CsatResponse` model** — not from `ChatSession`. The model
   has a `score` column and `created_at`. CSAT window for live KPIs = last 24 hours.

5. **Audit log enrichment is N+1** — `GET /admin/audit/logs` fetches each log's admin
   name in a loop. For large log volumes (limit > 50) this can be slow. See GAP-2
   for the optimized JOIN approach.

6. **`AuditLog.admin_id` is nullable** — system actions (cron jobs, webhook handlers)
   log with `admin_id = None`. Always handle this case in enrichment code.

7. **`@audit_action` does NOT call `db.commit()`** — the decorator records the log
   row but relies on the endpoint's own commit cycle. If the endpoint rolls back,
   the audit log is also rolled back. This is intentional.

8. **`AuditLog.details` is JSONB** — store structured context here (request payload,
   old vs new values, etc.). Use `{}` as the default, never `None`.

9. **SLA breach events come from Redis** — `calculate_sla_breach_events(db, hours=24)`
   in the analytics service reads from Redis keys, not from a DB table. Redis key
   pattern: `sla:breach:*` (check `sla_service.py` for exact key names).

10. **`days` query param max differs by endpoint** — analytics endpoints cap at 30 days;
    audit endpoints cap at 90 days. Always respect these limits in new endpoints.

---

## Context7 Docs

Context7 MCP is active. Use before writing SQLAlchemy aggregation or async patterns.

| Library | Resolve Name | Key Topics |
|---|---|---|
| SQLAlchemy | `"sqlalchemy"` | func.avg, func.count, func.extract, group_by, scalar |
| FastAPI | `"fastapi"` | Query params, Depends, response_model |

---

## Step 1 — Analytics Endpoints

**File:** `backend/app/api/v1/endpoints/admin_analytics.py`
**Registered at:** `api.py` → `prefix="/admin/analytics", tags=["admin"]`

All four endpoints delegate entirely to `analytics_service`. Add new KPI endpoints
by adding a method to `AnalyticsService` and wiring a new route here.

```python
# GET /admin/analytics/live-kpis
# Returns: dict with 10 KPI fields (see Step 2)
return await analytics_service.get_live_kpis(db)

# GET /admin/analytics/operator-performance?operator_id=&days=7
# Returns: list of operators with session counts + avg FRT + avg resolution time
return await analytics_service.get_operator_performance(db, operator_id, days)

# GET /admin/analytics/hourly-stats?hours=24
# Returns: message counts per hour for the specified period (max 168 = 7 days)
return await analytics_service.get_hourly_stats(db, hours)

# GET /admin/analytics/dashboard?days=7
# Returns: aggregated payload — trends, funnel, heatmap, percentiles
return await analytics_service.get_dashboard(db, days)
```

---

## Step 2 — Live KPIs Response Shape

**Method:** `analytics_service.get_live_kpis(db)` in `analytics_service.py`

```python
{
    "waiting":                    int,   # ChatSession.status == WAITING
    "active":                     int,   # ChatSession.status == ACTIVE
    "avg_first_response_seconds": float, # FRT avg, last 1 hour, only claimed sessions
    "avg_resolution_seconds":     float, # resolution avg, sessions closed today
    "csat_average":               float, # avg CsatResponse.score, last 24h
    "csat_percentage":            float, # (csat_avg / 5.0) * 100
    "fcr_rate":                   float, # First Contact Resolution %, last 7 days
    "sla_breach_events_24h":      int,   # breach events from Redis, last 24h
    "sessions_today":             int,   # ChatSession.started_at > today 00:00 UTC
    "human_mode_users":           int,   # User.chat_mode == HUMAN
}
```

**Key time windows:**
| KPI | Window |
|---|---|
| FRT | last 1 hour (`ChatSession.claimed_at > now() - 1h`) |
| Resolution | today (`ChatSession.closed_at > today 00:00 UTC`) |
| CSAT | last 24 hours |
| FCR rate | last 7 days |
| SLA breach events | last 24 hours (from Redis) |
| Sessions today | today 00:00 UTC |

---

## Step 3 — Add a New KPI to the Dashboard

To add a new metric (e.g., `abandoned_sessions`):

**Step 3a — Add method to `AnalyticsService`:**
```python
# backend/app/services/analytics_service.py

async def get_abandoned_count(self, db: AsyncSession) -> int:
    """Sessions that waited > SLA threshold and never got claimed."""
    threshold = datetime.now(timezone.utc) - timedelta(
        seconds=settings.SLA_MAX_QUEUE_WAIT_SECONDS
    )
    return await db.scalar(
        select(func.count()).where(
            ChatSession.status == SessionStatus.WAITING,
            ChatSession.started_at < threshold,
        )
    ) or 0
```

**Step 3b — Add to `get_live_kpis()` return dict:**
```python
# In analytics_service.get_live_kpis()
abandoned = await self.get_abandoned_count(db)
return {
    ...existing keys...,
    "abandoned_sessions": abandoned,
}
```

**Step 3c — No endpoint change needed** — `GET /admin/analytics/live-kpis` returns
the full dict from the service. The new key appears automatically.

---

## Step 4 — Audit Log Endpoints

**File:** `backend/app/api/v1/endpoints/admin_audit.py`
**Registered at:** `api.py` → `prefix="/admin/audit", tags=["admin"]`

### GET `/admin/audit/logs`

```python
# Query params (all optional):
# admin_id: int — filter by who did the action
# action: str — e.g., "claim_session", "close_session", "send_message"
# resource_type: str — e.g., "chat_session", "message"
# days: int (1–90, default 7) — look-back window
# limit: int (1–500, default 50)
# offset: int (default 0)

# Response shape:
{
    "total": int,
    "logs": [
        {
            "id": int,
            "admin_id": int | None,
            "admin_name": str | None,    # enriched from User table (N+1)
            "action": str,
            "resource_type": str,
            "resource_id": str,
            "details": dict,             # JSONB — free-form context
            "ip_address": str | None,
            "user_agent": str | None,
            "created_at": "ISO 8601 string"
        }
    ],
    "limit": int,
    "offset": int
}
```

### GET `/admin/audit/stats`

```python
# Query params:
# days: int (1–90, default 7)

# Response shape:
{
    "total_actions": int,
    "action_breakdown": {"claim_session": 12, "close_session": 8, ...},
    "resource_breakdown": {"chat_session": 15, "message": 5, ...},
    "period_days": int
}
```

---

## Step 5 — `@audit_action` Decorator

**File:** `backend/app/core/audit.py`
**Used by:** any endpoint that modifies state (live chat, requests, intents, etc.)

```python
from app.core.audit import audit_action

# Apply as decorator on endpoint functions
@router.post("/{session_id}/claim")
@audit_action("claim_session", "chat_session")
async def claim_session(session_id: int, db: ...):
    ...

# The decorator automatically:
# 1. Extracts admin user from the request context
# 2. Creates an AuditLog row with action + resource_type
# 3. Does NOT commit — relies on the endpoint's commit cycle
# 4. kwargs passed to the endpoint become part of details{}
```

**What `@audit_action` captures automatically:**
- `admin_id` — from `get_current_admin` dependency
- `action` — first param of decorator
- `resource_type` — second param
- `resource_id` — the first path param (e.g., `session_id`)
- `details` — kwargs dict passed to the endpoint function
- `ip_address`, `user_agent` — from `Request` headers (if available)

**Important:** `@audit_action` passes **kwargs only** — it does NOT capture
positional args. Structure endpoint params as keyword args for full detail capture.

---

## Step 6 — Add Audit Logging to a New Endpoint

```python
# Example: audit-logging a new "archive_request" action
from app.core.audit import audit_action

@router.post("/{request_id}/archive")
@audit_action("archive_request", "service_request")  # action, resource_type
async def archive_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    # ... do the archive logic ...
    await db.commit()
    # audit log row is created automatically by decorator
    return {"status": "archived"}
```

---

## Step 7 — Query Audit Logs Programmatically

```python
from sqlalchemy import select, desc
from app.models.audit_log import AuditLog
from datetime import datetime, timedelta

# Last 50 "close_session" actions in the last 7 days
cutoff = datetime.utcnow() - timedelta(days=7)
result = await db.execute(
    select(AuditLog)
    .where(
        AuditLog.action == "close_session",
        AuditLog.created_at > cutoff,
    )
    .order_by(desc(AuditLog.created_at))
    .limit(50)
)
logs = result.scalars().all()
```

---

## Known Gaps

### GAP-1: Analytics service has no error handling for Redis failure
`calculate_sla_breach_events()` reads from Redis. If Redis is down, it raises an
unhandled exception and the entire `/live-kpis` endpoint fails.
**Fix:** Wrap Redis calls in try/except, return `0` on failure.

### GAP-2: Audit log admin name enrichment is N+1
`GET /admin/audit/logs` fetches each log's admin name in a loop.
**Fix:** Replace with a single LEFT JOIN:
```python
from sqlalchemy import outerjoin
result = await db.execute(
    select(AuditLog, User.display_name.label("admin_name"))
    .outerjoin(User, AuditLog.admin_id == User.id)
    .where(AuditLog.created_at > cutoff)
    .order_by(desc(AuditLog.created_at))
    .offset(offset).limit(limit)
)
```

### GAP-3: No frontend analytics/audit pages documented
`frontend/app/admin/analytics/` and `frontend/app/admin/audit/` exist but skill
does not cover their component structure. Use `skn-admin-component` patterns.

### GAP-4: `@audit_action` silently drops positional args from `details`
Only kwargs are captured in `details{}`. Positional-only function params will
not appear in the audit record. Always define endpoint params as keyword args
when `@audit_action` is applied.

### GAP-5: No audit log deletion / retention policy endpoint
Old audit logs accumulate indefinitely. No `DELETE /admin/audit/logs` or retention
cron job exists.
**Fix:** Add a `PATCH /admin/audit/purge?older_than_days=90` endpoint (SUPER_ADMIN only).

---

## Common Issues

### `GET /admin/analytics/live-kpis` returns 500 error
**Cause 1:** Redis is unavailable — `calculate_sla_breach_events()` throws.
**Fix:** Add try/except around the Redis call in `analytics_service.py`.

**Cause 2:** `CsatResponse` table doesn't exist (migration not run).
**Fix:** Run `alembic upgrade head` from `backend/`.

### `GET /admin/audit/logs` is slow
**Cause:** N+1 admin name enrichment (one query per log row).
**Fix:** See GAP-2 — replace with a single LEFT JOIN.

### Audit logs show `admin_name: null`
**Cause:** The action was recorded with `admin_id = None` (system action), OR
the admin user was deleted after the log was created.
**Fix:** This is expected for system actions. Display as "System" in the UI.

### New endpoint actions not appearing in `GET /admin/audit/stats`
**Cause:** `@audit_action` is not applied to the endpoint, or the decorator is
placed after (below) the `@router.post(...)` line.
**Fix:** Decorator order matters — `@audit_action` must be directly below the
`@router.*` decorator:
```python
@router.post("/path")        # ← first
@audit_action("action", "resource")  # ← second
async def my_endpoint(...):
```

### `avg_first_response_seconds` is always 0
**Cause:** No sessions have `first_response_at` set, or no sessions were claimed
in the last hour.
**Fix:** Verify `ChatSession.first_response_at` is being set in `live_chat_service`
when an operator first sends a message.

---

## Quality Checklist

Before finishing, verify:
- [ ] All analytics/audit endpoints use `Depends(get_current_admin)`
- [ ] New analytics methods added to `AnalyticsService` singleton instance
- [ ] `@audit_action` placed directly below `@router.*` (decorator order)
- [ ] `AuditLog.details` initialized to `{}` not `None`
- [ ] `AuditLog.admin_id` handled as nullable in enrichment code
- [ ] Redis failure in SLA breach calculation wrapped in try/except
- [ ] New audit log queries include a `created_at > cutoff` date filter (avoid full table scan)
- [ ] `days` parameter respects max limits (30 for analytics, 90 for audit)
