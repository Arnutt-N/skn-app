# Service Request — Reference

Sources: `service_request.py` (model), `service_request_liff.py` (schema),
`admin_requests.py`, `admin_users.py`, `liff.py`, `request_comment.py`,
`flex_messages.py`, `frontend/app/liff/service-request/page.tsx`,
`frontend/app/admin/requests/**`.

---

## Model: `ServiceRequest`

**File:** `backend/app/models/service_request.py`

```python
class RequestStatus(enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class RequestPriority(enum.Enum):
    LOW = "LOW"    MEDIUM = "MEDIUM"    HIGH = "HIGH"    URGENT = "URGENT"

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id            = Column(Integer, primary_key=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    # Requester
    line_user_id  = Column(String)
    requester_id  = Column(Integer, ForeignKey("users.id"))
    firstname     = Column(String)
    lastname      = Column(String)
    phone_number  = Column(String)

    # Content
    topic_category = Column(String)              # Current; used in Flex + admin filter
    category       = Column(String, index=True)  # Legacy — do not use in new code
    description    = Column(Text)
    attachments    = Column(JSONB)               # [{id, url, name}]
    details        = Column(JSONB)               # {"source": "LIFF v2", ...}
    location       = Column(JSONB)               # {province, district, sub_district, ...}

    # Status & scheduling
    status       = Column(Enum(RequestStatus), nullable=True)   # ← nullable!
    priority     = Column(Enum(RequestPriority), nullable=True)
    due_date     = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))              # Set by update endpoint

    # Assignment
    assigned_agent_id = Column(Integer, ForeignKey("users.id"))
    assigned_by_id    = Column(Integer, ForeignKey("users.id"))
```

---

## Model: `RequestComment`

**File:** `backend/app/models/request_comment.py`

```python
class RequestComment(Base):
    __tablename__ = "request_comments"
    id         = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    content    = Column(Text, nullable=False)
```

---

## Schemas

**File:** `backend/app/schemas/service_request_liff.py`

```python
class ServiceRequestCreate(BaseModel):
    # ⚠️ Only these fields are currently in schema — others sent from form are dropped
    line_user_id:   Optional[str] = None
    requester_id:   Optional[int] = None
    firstname:      Optional[str] = None
    lastname:       Optional[str] = None
    phone_number:   Optional[str] = None
    topic_category: Optional[str] = None
    category:       Optional[str] = None   # legacy
    description:    Optional[str] = None
    attachments:    Optional[list] = None
    details:        Optional[dict] = None
    location:       Optional[dict] = None

class ServiceRequestResponse(ServiceRequestCreate):
    id:                int
    status:            Optional[str] = None
    priority:          Optional[str] = None
    due_date:          Optional[datetime] = None
    completed_at:      Optional[datetime] = None
    assigned_agent_id: Optional[int] = None
    assignee_name:     Optional[str] = None   # ← Not a model column; injected manually
    created_at:        Optional[datetime] = None
    updated_at:        Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class RequestCommentCreate(BaseModel):
    content: str

class RequestCommentResponse(RequestCommentCreate):
    id:           int
    request_id:   int
    user_id:      int
    created_at:   datetime
    display_name: Optional[str] = None   # From JOIN with User
```

---

## LIFF Form — What's Sent vs. What's Saved

**File:** `frontend/app/liff/service-request/page.tsx`

| Field | Sent in POST? | Saved to DB? | Notes |
|---|---|---|---|
| `line_user_id` | ✅ | ✅ | From `liff.getProfile()` |
| `firstname` | ✅ | ✅ | Step 1 required |
| `lastname` | ✅ | ✅ | Step 1 required |
| `phone_number` | ✅ | ✅ | Step 1 required, min 9 chars |
| `topic_category` | ✅ | ✅ | Step 3 required |
| `description` | ✅ | ✅ | Step 3 required |
| `attachments` | ✅ | ✅ | Array of {id, url, name} |
| `prefix` | ✅ | ❌ GAP-1 | Not in `ServiceRequestCreate` |
| `email` | ✅ | ❌ GAP-1 | Optional field, not saved |
| `agency` | ✅ | ❌ GAP-1 | Step 2 required |
| `province` | ✅ | ❌ GAP-1 | Thai name string |
| `district` | ✅ | ❌ GAP-1 | Thai name string |
| `sub_district` | ✅ | ❌ GAP-1 | Thai name string |
| `topic_subcategory` | ✅ | ❌ GAP-1 | Sub-option under topic_category |

**Suggested fix for GAP-1 fields** — add to `ServiceRequestCreate` and store in JSONB:
```python
# In liff.py ServiceRequest() constructor:
location={"province": data.province, "district": data.district, "sub_district": data.sub_district},
details={"source": "LIFF v2", "agency": data.agency, "prefix": data.prefix,
         "email": data.email, "topic_subcategory": data.topic_subcategory}
```

---

## LIFF Form — Topic Options (Hardcoded Frontend Constant)

**File:** `frontend/app/liff/service-request/page.tsx` — `TOPIC_OPTIONS` const

```
กองทุนยุติธรรม:
  ค่าจ้างทนายความ / ค่าธรรมเนียมศาล / เงินประกันตัว / อื่นๆ

เงินเยียวยาเหยื่ออาชญากรรม:
  กรณีถูกทำร้ายร่างกาย/ถูกลูกหลง / กรณีอุบัติเหตุจราจร /
  กรณีอนาจาร/ข่มขืน / กรณีจำเลยในคดีอาญาที่ศาลยกฟ้อง / อื่นๆ

ไกล่เกลี่ยข้อพิพาท:
  ข้อพิพาททางแพ่ง (ที่ดิน มรดก ครอบครัว หนี้ ค้ำประกัน เช่าชื้อ) /
  ข้อพิพาททางอาญา (เพศ ร่างกาย ทรัพย์ รถชน) / อื่นๆ

ร้องเรียน/ร้องทุกข์:
  อธิบายสั้นๆ
```

**Note:** These are NOT fetched from DB — they're hardcoded in the frontend. The admin category filter dropdown (`/admin/requests`) uses its own hardcoded list. Keep them in sync if adding categories.

---

## Admin Frontend Views

### List page — `frontend/app/admin/requests/page.tsx`

```
State: requests[], filter{status,category}, search (debounced 500ms)
Fetch: GET /admin/requests?status=&category=&search=

Table columns: Requester+topic | Agency/location | Date | Status badge | Assignee | Actions
Actions: Eye (view modal) | Pencil (→ /admin/requests/[id]) | Trash (delete modal)

Status null/undefined display: "มาใหม่ (รอรับงาน)" orange badge (not "pending")

Assign flow:
  Click assignee name OR "Assign" button → AssignModal
  → GET /admin/users (sorted by workload)
  → confirmAssign(agentId):
      PATCH /admin/requests/{id} {
        assigned_agent_id: agentId,
        status: req.status === 'pending' ? 'in_progress' : undefined
      }

Delete flow:
  Trash → confirmation Modal → DELETE /admin/requests/{id}
  → remove from local state (no full refetch)
```

### Kanban page — `frontend/app/admin/requests/kanban/page.tsx`

```
Fetch: GET /admin/requests?limit=200 (all, client-side grouped)
Columns: PENDING | IN_PROGRESS | COMPLETED | REJECTED
Read-only — status change requires navigating to detail page
Search: client-side filter within loaded data
```

### Detail page — `frontend/app/admin/requests/[id]/page.tsx`

```
Fetch: GET /admin/requests/{id}
       GET /admin/requests/{id}/comments

Actions:
  Status update  → PATCH /admin/requests/{id} {status}
  Priority update → PATCH /admin/requests/{id} {priority}
  Due date       → PATCH /admin/requests/{id} {due_date}
  Reassign       → AssignModal → PATCH /admin/requests/{id} {assigned_agent_id}
  Add comment    → POST /admin/requests/{id}/comments?user_id=N {content}
  Attachments    → rendered as file links (url from attachments JSONB)
```

---

## API Endpoints Summary

### Service Request APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/liff/service-requests` | None | Citizen LIFF creation |
| `GET` | `/admin/requests` | None (TODO) | List with filter+search |
| `GET` | `/admin/requests/stats` | None (TODO) | Aggregated counts |
| `GET` | `/admin/requests/stats/monthly` | None (TODO) | Per-month chart data |
| `GET` | `/admin/requests/stats/workload` | None (TODO) | Per-agent workload |
| `GET` | `/admin/requests/stats/performance` | None (TODO) | Cycle time + on-time % |
| `GET` | `/admin/requests/{id}` | None (TODO) | Single request detail |
| `PATCH` | `/admin/requests/{id}` | None (TODO) | Update status/priority/assign |
| `DELETE` | `/admin/requests/{id}` | None (TODO) | Hard delete |
| `POST` | `/admin/requests/{id}/comments` | None (TODO) | Add comment (user_id=Query) |
| `GET` | `/admin/requests/{id}/comments` | None (TODO) | List comments |

### Related APIs

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | User workload list (for AssignModal) |
| `POST` | `/media` | File upload (used by LIFF form attachments) |
| `GET` | `/locations/provinces` | Province list for LIFF form cascade |
| `GET` | `/locations/provinces/{id}/districts` | District list |
| `GET` | `/locations/districts/{id}/sub-districts` | Sub-district list |

---

## Stats Query Patterns

### GET /stats — conditional aggregation
```python
query = select(
    func.count(ServiceRequest.id).label("total"),
    func.count(ServiceRequest.id).filter(
        (ServiceRequest.status == RequestStatus.PENDING) | (ServiceRequest.status.is_(None))
    ).label("pending"),   # ← None = unset LIFF-created request
    func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress"),
    func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.COMPLETED).label("completed"),
    func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.REJECTED).label("rejected")
)
row = (await db.execute(query)).one()
return RequestStats(**row._asdict())
```

### GET /stats/monthly — PostgreSQL date grouping
```python
from sqlalchemy import text
month_expr = func.to_char(ServiceRequest.created_at, 'YYYY-MM')
query = (
    select(month_expr.label('month'), func.count(ServiceRequest.id).label('count'))
    .group_by(month_expr)
    .order_by(text('month DESC'))   # text() needed to reference alias
    .limit(12)
)
stats = [MonthlyStats(month=r.month, count=r.count) for r in (await db.execute(query)).all()]
return stats[::-1]   # ← Reverse to chronological order for chart
```

### GET /stats/workload — join User
```python
query = (
    select(
        User.display_name.label("agent_name"),
        func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.PENDING).label("pending_count"),
        func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress_count")
    )
    .join(User, ServiceRequest.assigned_agent_id == User.id)
    .group_by(User.display_name)
)
```

### GET /stats/performance — cycle time + on-time %
```python
# Avg days from created_at to completed_at
cycle = select(func.avg(func.extract('epoch', ServiceRequest.completed_at - ServiceRequest.created_at) / 86400)) \
    .where(ServiceRequest.status == RequestStatus.COMPLETED)

# % completed on or before due_date
on_time = select(
    func.count(ServiceRequest.id).filter(ServiceRequest.completed_at <= ServiceRequest.due_date).label("on_time"),
    func.count(ServiceRequest.id).label("total")
).where(ServiceRequest.status == RequestStatus.COMPLETED, ServiceRequest.due_date.isnot(None))
```

---

## Update Pattern

```python
class RequestUpdate(BaseModel):
    status:            Optional[RequestStatus] = None
    priority:          Optional[str] = None
    due_date:          Optional[datetime] = None
    assigned_agent_id: Optional[int] = None
    assigned_by_id:    Optional[int] = None

# In handler — MUST set completed_at on COMPLETED
if update_data.status is not None:
    request.status = update_data.status
    if update_data.status == RequestStatus.COMPLETED:
        request.completed_at = func.now()   # ← Drives performance stats
```

---

## Comments Pattern

```python
# Create — user_id from URL Query param (not auth token)
user_id: int = Query(..., description="Commenter user ID")   # ← GAP-3
comment = RequestComment(request_id=request_id, user_id=user_id, content=comment_data.content)
db.add(comment); await db.commit(); await db.refresh(comment)
display_name = await db.scalar(select(User.display_name).where(User.id == user_id))
return RequestCommentResponse(..., display_name=display_name)

# List — JOIN User for display_name
query = select(RequestComment, User.display_name) \
    .join(User, RequestComment.user_id == User.id) \
    .where(RequestComment.request_id == request_id) \
    .order_by(RequestComment.created_at.asc())
```

---

## User Workload (AssignModal source)

**File:** `backend/app/api/v1/endpoints/admin_users.py`

```python
class UserWorkload(BaseModel):
    id: int
    display_name: Optional[str]
    role: UserRole
    active_tasks: int      # = pending + in_progress (for this agent)
    pending_tasks: int
    in_progress_tasks: int

# N+1 pattern: 1 stats query per user — known performance hotspot
# Sorted: user_workloads.sort(key=lambda x: x.active_tasks)  ← least busy first
```

---

## Flex Message: `build_request_status_list()`

**File:** `backend/app/services/flex_messages.py`

### Status color map
```python
status_map = {
    "PENDING":           {"text": "รอดำเนินการ",    "color": "#F59E0B"},  # Amber
    "IN_PROGRESS":       {"text": "กำลังดำเนินงาน", "color": "#3B82F6"},  # Blue
    "AWAITING_APPROVAL": {"text": "รออนุมัติ",      "color": "#6366F1"},  # Indigo
    "COMPLETED":         {"text": "เสร็จสิ้น",       "color": "#10B981"},  # Emerald
    "REJECTED":          {"text": "ยกเลิก/ปฏิเสธ",  "color": "#EF4444"},  # Rose
}
# Access: status_map.get(str(req.status), {"text": str(req.status), "color": "#999999"})
```

### Bubble structure
```
Flex Bubble
├── header: "📋 คำร้องของคุณ" (#1DB446 green) + "{n} รายการล่าสุด"
└── body: vertical box
    └── for each request:
        ├── "#{id} — {topic_category or 'ไม่ระบุหมวดหมู่'}" (bold sm)
        ├── colored dot + status label | filler | created_at (dd/mm/yy)
        └── separator (omitted for last item)
```

### Triggers in `webhook.py`
| Command | Handler | Behavior |
|---|---|---|
| `"ติดตาม"` or `"สถานะ"` | `handle_check_status()` | Fetch latest 5 by `line_user_id` DESC |
| Phone `^0\d{9}$` | `handle_bind_phone()` | Bind phone to account, then show status |

---

## Known Gaps Summary

| ID | Gap | Location | Severity |
|---|---|---|---|
| GAP-1 | Form fields dropped (agency, prefix, email, location, subcategory) | `liff.py` + schema | High — data lost on submit |
| GAP-2 | No role management CRUD | `admin_users.py` missing | Medium — can't change user roles via API |
| GAP-3 | Comments user_id from Query param | `admin_requests.py` | Low — workaround until JWT auth |
| GAP-4 | Admin users page ComingSoon | `frontend/app/admin/users/page.tsx` | Medium — frontend only |
| GAP-5 | Kanban read-only | `frontend/app/admin/requests/kanban/page.tsx` | Low — can update via detail page |
| GAP-6 | Settings page deferred | `frontend/app/admin/settings/page.tsx` | By design — separate skill planned |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/models/service_request.py` | Model — enums, JSONB, nullable status |
| `backend/app/models/request_comment.py` | Comment model with CASCADE delete |
| `backend/app/schemas/service_request_liff.py` | All schemas (Create, Response, Comment) |
| `backend/app/api/v1/endpoints/admin_requests.py` | Admin CRUD + 4 stats routes + comments |
| `backend/app/api/v1/endpoints/admin_users.py` | User workload list (for AssignModal) |
| `backend/app/api/v1/endpoints/liff.py` | LIFF citizen creation endpoint |
| `backend/app/services/flex_messages.py` | `build_request_status_list()` for LINE |
| `backend/app/api/v1/api.py` | Router registration |
| `frontend/app/liff/service-request/page.tsx` | 4-step LIFF form |
| `frontend/app/admin/requests/page.tsx` | Admin list view |
| `frontend/app/admin/requests/kanban/page.tsx` | Admin kanban board view |
| `frontend/app/admin/requests/[id]/page.tsx` | Admin detail + edit + comments |
| `frontend/components/admin/AssignModal.tsx` | Agent assignment modal (uses /admin/users) |
