# Analytics & Audit — Reference

Sources: `admin_analytics.py`, `admin_audit.py`, `services/analytics_service.py`,
`models/audit_log.py`, `core/audit.py`

---

## Analytics Endpoints

**Prefix:** `/api/v1/admin/analytics` — all require `get_current_admin`

| Method | Path | Params | Response |
|---|---|---|---|
| `GET` | `/admin/analytics/live-kpis` | — | Live KPI dict (10 fields) |
| `GET` | `/admin/analytics/operator-performance` | `operator_id?`, `days=7` (1–30) | List of operator metrics |
| `GET` | `/admin/analytics/hourly-stats` | `hours=24` (1–168) | Message counts per hour |
| `GET` | `/admin/analytics/dashboard` | `days=7` (1–30) | Aggregated dashboard payload |

---

## Live KPIs Response Schema

```python
{
    "waiting":                    int,   # sessions in WAITING status
    "active":                     int,   # sessions in ACTIVE status
    "avg_first_response_seconds": float, # FRT avg — last 1 hour claimed sessions
    "avg_resolution_seconds":     float, # resolution avg — sessions closed today
    "csat_average":               float, # avg CsatResponse.score — last 24h (0–5)
    "csat_percentage":            float, # (csat_avg / 5.0) * 100
    "fcr_rate":                   float, # First Contact Resolution % — last 7 days
    "sla_breach_events_24h":      int,   # from Redis — last 24h
    "sessions_today":             int,   # ChatSession.started_at > today 00:00 UTC
    "human_mode_users":           int,   # User.chat_mode == HUMAN
}
```

**Calculation windows:**
```
FRT:               ChatSession.claimed_at > (now - 1h), first_response_at not null
Resolution:        ChatSession.closed_at > today 00:00 UTC
CSAT:              CsatResponse.created_at > (now - 24h)
FCR rate:          last 7 days
SLA breach events: Redis sla:breach:* keys — last 24h
Sessions today:    ChatSession.started_at > today 00:00 UTC
```

---

## FRT Calculation (SQL Pattern)

```python
from sqlalchemy import func, select
from datetime import datetime, timedelta, timezone
from app.models.chat_session import ChatSession, SessionStatus

hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

avg_frt = await db.scalar(
    select(
        func.avg(
            func.extract('epoch', ChatSession.first_response_at - ChatSession.claimed_at)
        )
    ).where(
        ChatSession.first_response_at.isnot(None),
        ChatSession.claimed_at > hour_ago,
    )
) or 0
```

---

## Resolution Time Calculation (SQL Pattern)

```python
today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

avg_resolution = await db.scalar(
    select(
        func.avg(
            func.extract('epoch', ChatSession.closed_at - ChatSession.started_at)
        )
    ).where(
        ChatSession.status == SessionStatus.CLOSED,
        ChatSession.closed_at > today_start,
    )
) or 0
```

---

## AuditLog Model

**File:** `backend/app/models/audit_log.py`

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id            = Column(Integer, primary_key=True, index=True)
    admin_id      = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action        = Column(String(50), index=True)   # e.g. "claim_session"
    resource_type = Column(String(50))               # e.g. "chat_session"
    resource_id   = Column(String(100))              # e.g. "42"
    details       = Column(JSONB, default={})        # free-form context
    ip_address    = Column(String(50), nullable=True)
    user_agent    = Column(String(255), nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow, index=True)

    admin = relationship("User", back_populates="audit_logs")
```

Note: `created_at` uses `datetime.utcnow` (naive UTC), not `DateTime(timezone=True)`.
When filtering, use `datetime.utcnow()` (not `datetime.now(timezone.utc)`) for
consistency.

---

## Audit Endpoints

**Prefix:** `/api/v1/admin/audit` — all require `get_current_admin`

### GET `/admin/audit/logs`

```
Query params:
  admin_id:      int   (optional) — filter by acting admin
  action:        str   (optional) — filter by action type
  resource_type: str   (optional) — filter by resource type
  days:          int   (default 7, max 90)
  limit:         int   (default 50, max 500)
  offset:        int   (default 0)

Response:
  {
    "total": int,       ← count of matching rows
    "logs": [...],      ← paginated enriched logs
    "limit": int,
    "offset": int
  }

Each log item:
  {
    "id": int,
    "admin_id": int | null,
    "admin_name": str | null,   ← enriched from User table (N+1 — one query per log)
    "action": str,
    "resource_type": str,
    "resource_id": str,
    "details": dict,            ← JSONB
    "ip_address": str | null,
    "user_agent": str | null,
    "created_at": "2026-02-23T10:00:00"   ← ISO 8601
  }
```

### GET `/admin/audit/stats`

```
Query params:
  days: int (default 7, max 90)

Response:
  {
    "total_actions": int,
    "action_breakdown":   {"claim_session": 12, ...},
    "resource_breakdown": {"chat_session": 15, ...},
    "period_days": int
  }
```

---

## @audit_action Decorator

**File:** `backend/app/core/audit.py`

```python
from app.core.audit import audit_action

# Correct usage — decorator order matters:
@router.post("/{session_id}/claim")   # 1st
@audit_action("claim_session", "chat_session")  # 2nd
async def claim_session(session_id: int, ...):
    ...
```

**What it captures:**
- `action` — first arg to decorator
- `resource_type` — second arg to decorator
- `resource_id` — first path param (cast to str)
- `admin_id` — from current_user in request context
- `details` — endpoint kwargs dict (positional args NOT captured)
- `ip_address`, `user_agent` — from request headers

**Does NOT commit** — audit row is part of the endpoint's transaction.
Rolled-back endpoints also roll back their audit log row.

---

## Known Action + Resource Type Values

From existing endpoint usage:

| action | resource_type | endpoint |
|---|---|---|
| `claim_session` | `chat_session` | `/admin/live-chat/{id}/claim` |
| `close_session` | `chat_session` | `/admin/live-chat/{id}/close` |
| `transfer_session` | `chat_session` | `/admin/live-chat/{id}/transfer` |
| `send_message` | `message` | WebSocket send_message event |
| `update_intent` | `intent` | `/admin/intents/{id}` |
| `delete_intent` | `intent` | `/admin/intents/{id}` |
| `update_request` | `service_request` | `/admin/requests/{id}` |
| `assign_request` | `service_request` | `/admin/requests/{id}/assign` |

---

## CsatResponse Model (referenced by analytics)

**File:** `backend/app/models/csat_response.py`

```python
class CsatResponse(Base):
    __tablename__ = "csat_responses"
    id         = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    score      = Column(Integer)        # 1–5
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## AnalyticsService — Public Interface

**File:** `backend/app/services/analytics_service.py`
**Singleton:** `analytics_service = AnalyticsService()` at module bottom

```python
await analytics_service.get_live_kpis(db)             → dict
await analytics_service.get_operator_performance(db, operator_id=None, days=7) → list
await analytics_service.get_hourly_stats(db, hours=24) → list[{hour, count}]
await analytics_service.get_dashboard(db, days=7)      → dict (trends, funnel, heatmap, percentiles)

# Internal helpers (not called directly from endpoints)
await analytics_service.calculate_fcr_rate(db, days=7)           → float
await analytics_service.calculate_abandonment_rate(db, days=7)   → float
await analytics_service.calculate_sla_breach_events(db, hours=24) → int  ← reads Redis
```

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/api/v1/endpoints/admin_analytics.py` | 4 analytics endpoints |
| `backend/app/api/v1/endpoints/admin_audit.py` | Audit log list + stats endpoints |
| `backend/app/services/analytics_service.py` | KPI calculation logic |
| `backend/app/models/audit_log.py` | `AuditLog` model |
| `backend/app/models/csat_response.py` | `CsatResponse` model (score source) |
| `backend/app/core/audit.py` | `@audit_action` decorator |
| `frontend/app/admin/analytics/` | Analytics dashboard UI (not covered in this skill) |
| `frontend/app/admin/audit/` | Audit log UI (not covered in this skill) |

---

## Known Gaps Summary

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | Redis failure crashes `/live-kpis` | Medium | try/except in `calculate_sla_breach_events()` |
| GAP-2 | Audit log admin name enrichment is N+1 | Low-Medium | LEFT JOIN on User in logs query |
| GAP-3 | No frontend coverage in this skill | Low | Use skn-admin-component patterns |
| GAP-4 | `@audit_action` drops positional args from details | Low | Use keyword args in endpoints |
| GAP-5 | No audit log retention/purge endpoint | Low | Add `PATCH /admin/audit/purge` (SUPER_ADMIN) |
