# skn-service-request

Full-stack service request feature for the SKN App (JskApp). Covers the complete flow: citizen submits via LINE LIFF 4-step form → backend saves to DB → admin manages in list/kanban/detail views → agents assigned by workload → LINE user tracks status via Flex message.

Use this skill when asked to:
- "Add a field to service requests" / "เพิ่ม field ใน service request"
- "Add a field to the LIFF form" / "แก้ฟอร์ม LIFF"
- "Add a new status or priority"
- "Fix the service request stats / dashboard"
- "Let admins assign requests to agents" / "มอบหมายงานให้เจ้าหน้าที่"
- "Add a comment to a request" / "เพิ่ม comment"
- "Show request history to LINE user" / "แสดงสถานะให้ผู้ใช้"
- "Build a service request form for LIFF"
- "Send request status flex message"
- "Fix the assign modal / agent dropdown"
- "Why are form fields not saving to the database"

> **Settings/Config is a separate skill** — `GET/POST /admin/settings` (LINE config, Telegram config, system settings) is planned as a dedicated `skn-settings-config` skill. Do not add settings logic here.

---

## System Flow

```
[LINE User]
  └─→ LIFF Mini-App (4-step form)
        Step 1: Personal (prefix, firstname, lastname, phone, email)
        Step 2: Agency + Location (province→district→subdistrict cascading)
        Step 3: Topic category + subcategory + description
        Step 4: Attachments (image/PDF upload)
        → Confirmation modal → POST /api/v1/liff/service-requests
        → Success screen (auto-close 5s in LINE app)

[Admin Dashboard]
  ├── /admin/requests          → List view (table, search, filter, assign, delete)
  ├── /admin/requests/kanban   → Kanban view (4 columns by status)
  └── /admin/requests/[id]     → Detail view (edit status/priority, assign, comments)

[Backend]
  ├── POST /liff/service-requests        — Citizen creation (no auth)
  ├── GET/PATCH/DELETE /admin/requests   — Admin CRUD
  ├── GET /admin/requests/stats/*        — Dashboard stats (4 sub-routes)
  ├── GET /admin/users                   — Agent list for AssignModal (by workload)
  └── POST/GET /admin/requests/{id}/comments — Internal notes

[LINE Webhook feedback]
  ├── "ติดตาม" / "สถานะ" → Flex status bubble
  └── Phone 0xxxxxxxxx  → Bind phone + show status
```

---

## Critical Rules

1. **LIFF creates with `status=None`** — Do NOT set `status=RequestStatus.PENDING`. The stats query guards `status.is_(None)` as pending. Changing to PENDING breaks that guard.

2. **Stats pending guard** — `GET /stats` counts pending as `(status == PENDING) | status.is_(None)`. Always preserve this OR condition.

3. **`completed_at` auto-set** — When `status → COMPLETED`, set `request.completed_at = func.now()`. Never skip; it drives `get_performance_stats()` cycle time.

4. **No admin creation endpoint** — Requests are created by citizens via LIFF only. Do not add an admin creation endpoint unless the business flow also changes.

5. **`assignee_name` manual construction** — `ServiceRequestResponse` does not JOIN User automatically. Endpoints that need `assignee_name` must `outerjoin(User, assigned_agent_id == User.id)` and manually patch the field onto the response dict.

6. **`user_id` for comments is a Query param** — `POST /{id}/comments` takes `user_id: int = Query(...)`. Known TODO; replace with `Depends(get_current_user_id)` when JWT auth is added.

7. **Dual category columns** — `topic_category` (current) + `category` (legacy, indexed). Filter on `topic_category` in new code; leave `category` alone unless explicitly migrating.

8. **JSONB fields** — `attachments`, `details`, `location` are `JSONB`. Pass plain `dict`/`list`. LIFF creation hard-codes `details={"source": "LIFF v2"}`.

9. **`func.to_char()` is PostgreSQL-specific** — `GET /stats/monthly` will fail on SQLite. The project is PostgreSQL-only; this is intentional.

10. **Flex status map keys are strings** — `status_map.get(str(req.status), ...)`. Adding a new `RequestStatus` enum value requires adding it to `status_map` in `flex_messages.py`.

11. **⚠️ Form fields silently dropped (known gap)** — The LIFF form collects `agency`, `prefix`, `email`, `province`, `district`, `sub_district`, `topic_subcategory` — but these are NOT in `ServiceRequestCreate`. Pydantic v2 ignores unknown fields by default. They are currently **not saved to the DB**. To fix: add fields to the schema AND either create model columns or store in `location`/`details` JSONB.

---

## Step-by-Step Guide

### Step 1 — Understand the model

**File:** `backend/app/models/service_request.py`

```python
class RequestStatus(enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class RequestPriority(enum.Enum):
    LOW = "LOW"   MEDIUM = "MEDIUM"   HIGH = "HIGH"   URGENT = "URGENT"

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    # Requester
    line_user_id, requester_id (FK users), firstname, lastname, phone_number
    # Content
    topic_category, category (legacy), description
    attachments (JSONB), details (JSONB), location (JSONB)
    # Status
    status (Enum nullable), priority (Enum nullable), due_date, completed_at
    # Assignment
    assigned_agent_id (FK users), assigned_by_id (FK users)
```

---

### Step 2 — LIFF frontend form (citizen path)

**File:** `frontend/app/liff/service-request/page.tsx`

The form is a 4-step wizard with step-level validation before advancing:

| Step | Fields collected | Validation |
|---|---|---|
| 0 Personal | `prefix`*, `firstname`*, `lastname`*, `phone_number`* (min 9), `email` | All required except email |
| 1 Agency/Location | `agency`*, `province`* (ID → Thai name), `district`* (ID → Thai name), `sub_district`* | Cascading selects; disabled until parent chosen |
| 2 Topic | `topic_category`*, `topic_subcategory`*, `description`* | Subcategory options driven by `TOPIC_OPTIONS[topic_category]` |
| 3 Attachments | `attachments[]` (optional) | None required |

**Location cascade:** Each level fetches from backend on change:
```
GET /api/v1/locations/provinces
GET /api/v1/locations/provinces/{id}/districts
GET /api/v1/locations/districts/{id}/sub-districts
```
Province/district IDs are used for the cascading logic but the Thai **names** are stored in `formData`, not IDs.

**File upload** (Step 4):
```
POST /api/v1/media { file: File }
→ { id, filename }
→ stored as: { id, url: `/api/v1/media/${data.id}`, name: data.filename }
```

**Submit payload** sent to `POST /api/v1/liff/service-requests`:
```json
{
  "prefix": "...", "firstname": "...", "lastname": "...",
  "phone_number": "...", "email": "...",
  "agency": "...", "province": "...", "district": "...", "sub_district": "...",
  "topic_category": "...", "topic_subcategory": "...",
  "description": "...",
  "attachments": [{ "id": "...", "url": "...", "name": "..." }],
  "line_user_id": "U..."   ← from liff.getProfile()
}
```

**⚠️ Gap:** Only `firstname`, `lastname`, `phone_number`, `topic_category`, `description`, `attachments`, `line_user_id` are saved. The rest (`agency`, `prefix`, `email`, `province`, `district`, `sub_district`, `topic_subcategory`) are silently dropped by Pydantic.

**Success screen:**
- Inside LINE app → countdown 5s then `liff.closeWindow()`
- External browser → show "พิมพ์ ติดตาม ใน LINE OA" message + manual close

**Topic categories** (hardcoded in frontend — `TOPIC_OPTIONS` const):
```
กองทุนยุติธรรม → [ค่าจ้างทนายความ, ค่าธรรมเนียมศาล, เงินประกันตัว, อื่นๆ]
เงินเยียวยาเหยื่ออาชญากรรม → [5 sub-options]
ไกล่เกลี่ยข้อพิพาท → [2 sub-options]
ร้องเรียน/ร้องทุกข์ → [อธิบายสั้นๆ]
```
These are hardcoded in the frontend, not fetched from DB. Sync any changes with the admin filter dropdown.

---

### Step 3 — Backend LIFF creation endpoint

**File:** `backend/app/api/v1/endpoints/liff.py`

```python
@router.post("/service-requests", response_model=ServiceRequestResponse)
async def create_service_request_liff(data: ServiceRequestCreate, db: AsyncSession = Depends(get_db)):
    # No auth — takes line_user_id directly from body
    service_request = ServiceRequest(
        line_user_id=data.line_user_id,
        topic_category=data.topic_category,
        description=data.description,
        firstname=data.firstname,
        lastname=data.lastname,
        phone_number=data.phone_number,
        details={"source": "LIFF v2"},   # ← Always tag source
        status=None,    # ← NOT RequestStatus.PENDING
        priority=None,
    )
    # agency/prefix/email/province/district/sub_district/topic_subcategory not saved here
    db.add(service_request)
    await db.commit()
    await db.refresh(service_request)
    # Manually construct response (schema field names differ from model)
    return ServiceRequestResponse(id=service_request.id, ...)
```

---

### Step 4 — Admin frontend views

#### List view — `frontend/app/admin/requests/page.tsx`

- **Table columns**: Requester name + topic, Agency/location, Date, Status badge, Assignee, Actions
- **Search**: 500ms debounce → `?search=` param → ilike across firstname/lastname/phone/description
- **Filter**: Status dropdown + Category dropdown → query params
- **Assign**: Click assignee name (or "Assign" button) → opens `AssignModal`
- **View**: Eye icon → opens `Modal` quick preview with link to detail page
- **Edit**: Pencil icon → navigates to `/admin/requests/[id]`
- **Delete**: Trash icon → opens confirmation `Modal` → `DELETE /admin/requests/{id}` → optimistic remove from local state
- **Status display**: `null`/`undefined` status shown as "มาใหม่ (รอรับงาน)" (orange badge) — not "pending"

#### Kanban view — `frontend/app/admin/requests/kanban/page.tsx`

- 4 columns: PENDING → IN_PROGRESS → COMPLETED → REJECTED
- Fetches `GET /admin/requests?limit=200` (all, client-side grouped)
- Read-only — dragging/moving not yet implemented
- Search within the kanban view

#### Detail view — `frontend/app/admin/requests/[id]/page.tsx`

- Full info: personal data, agency, location, topic, description, attachments
- Status update → `PATCH /admin/requests/{id}` with `{status}`
- Priority update → `PATCH /admin/requests/{id}` with `{priority}`
- Due date update → `PATCH /admin/requests/{id}` with `{due_date}`
- Reassign agent → opens `AssignModal` → `PATCH /admin/requests/{id}` with `{assigned_agent_id}`
- Comments → `POST /admin/requests/{id}/comments?user_id=N` + `GET /admin/requests/{id}/comments`

---

### Step 5 — Agent assignment (AssignModal + workload endpoint)

**File:** `frontend/components/admin/AssignModal.tsx`
**API:** `GET /api/v1/admin/users` — `backend/app/api/v1/endpoints/admin_users.py`

The assign flow:
1. Admin opens `AssignModal` (from list or detail page)
2. Modal calls `GET /admin/users` → returns `UserWorkload[]` sorted by `active_tasks ASC` (least busy first)
3. Admin picks an agent
4. Frontend calls `PATCH /admin/requests/{id}` with `{ assigned_agent_id: agentId, status: 'in_progress' }` (auto-advances status if was pending)

```python
# GET /admin/users — admin_users.py
# Returns users with their current workload, sorted least-busy first
class UserWorkload(BaseModel):
    id: int
    display_name: Optional[str] = None
    role: UserRole
    active_tasks: int     # pending + in_progress
    pending_tasks: int
    in_progress_tasks: int

# N+1 known hotspot — runs 1 DB query per user (see skn-performance-audit)
# Sort key: active_tasks ASC (least busy agent shown first)
user_workloads.sort(key=lambda x: x.active_tasks)
```

---

### Step 6 — Admin CRUD (list, update, delete, stats)

**File:** `backend/app/api/v1/endpoints/admin_requests.py`

```python
# List with outerjoin for assignee_name
query = (
    select(ServiceRequest, User.display_name.label("assignee_name"))
    .outerjoin(User, ServiceRequest.assigned_agent_id == User.id)
    .order_by(ServiceRequest.created_at.desc())
    .offset(skip).limit(limit)
)
# Filter: status, topic_category, search (ilike x4)
for req, assignee_name in result.all():
    req_dict = ServiceRequestResponse.model_validate(req).model_dump()
    req_dict['assignee_name'] = assignee_name

# Update — MUST set completed_at on COMPLETED
if update_data.status == RequestStatus.COMPLETED:
    request.completed_at = func.now()

# Stats
# GET /stats — single-query with func.count().filter() per status
# GET /stats/monthly — func.to_char('YYYY-MM') + group + [::-1] for chart order
# GET /stats/workload — join User on assigned_agent_id
# GET /stats/performance — avg epoch / 86400 + on_time %
```

---

### Step 7 — Comments

```python
# POST /{id}/comments
# user_id = Query param (NOT from auth token — known TODO)
user_id: int = Query(..., description="Commenter user ID")
comment = RequestComment(request_id=request_id, user_id=user_id, content=comment_data.content)

# GET /{id}/comments
query = select(RequestComment, User.display_name) \
    .join(User, RequestComment.user_id == User.id) \
    .where(RequestComment.request_id == request_id) \
    .order_by(RequestComment.created_at.asc())
```

---

### Step 8 — Flex status message (LINE)

**File:** `backend/app/services/flex_messages.py`

```python
flex_dict = build_request_status_list(requests)   # list of ServiceRequest objects

await api.reply_message(ReplyMessageRequest(
    reply_token=reply_token,
    messages=[FlexMessage(alt_text="คำร้องของคุณ", contents=FlexContainer.from_dict(flex_dict))]
))
```

**Triggers** (`webhook.py`):
- `"ติดตาม"` / `"สถานะ"` → `handle_check_status()` → latest 5 by `line_user_id`
- Phone `^0\d{9}$` → `handle_bind_phone()` → bind phone + show status

**Status map:**
```python
status_map = {
    "PENDING":           {"text": "รอดำเนินการ",    "color": "#F59E0B"},
    "IN_PROGRESS":       {"text": "กำลังดำเนินงาน", "color": "#3B82F6"},
    "AWAITING_APPROVAL": {"text": "รออนุมัติ",      "color": "#6366F1"},
    "COMPLETED":         {"text": "เสร็จสิ้น",       "color": "#10B981"},
    "REJECTED":          {"text": "ยกเลิก/ปฏิเสธ",  "color": "#EF4444"},
}
# status_map.get(str(req.status), {"text": str(req.status), "color": "#999999"})
```

---

### Step 9 — Adding a new field end-to-end

1. **Model** (`service_request.py`) — add `Column`
2. **Schema** (`service_request_liff.py`) — add to `ServiceRequestCreate` AND `ServiceRequestResponse`
3. **Migration** — `alembic revision --autogenerate -m "add X to service_requests"` then `upgrade head`
4. **LIFF backend endpoint** (`liff.py`) — explicitly pass `field=data.field` in `ServiceRequest(...)` constructor
5. **LIFF frontend form** (`liff/service-request/page.tsx`) — add to `formData` state, form input, and `validateStep()` if required
6. **Admin update** (`admin_requests.py` → `RequestUpdate`) — add to the Pydantic model + `if update_data.field:` block
7. **Admin frontend** — add to list table columns, detail view, and kanban card if needed
8. **Flex** — add to `build_request_status_list()` if it should appear in LINE status message

---

## Known Gaps

### GAP-1: Form fields silently dropped on LIFF submission
**Fields affected:** `agency`, `prefix`, `email`, `province`, `district`, `sub_district`, `topic_subcategory`
**Root cause:** These are collected by the frontend form but are not in `ServiceRequestCreate`. Pydantic v2 silently ignores unknown fields (`model_config` doesn't set `extra='allow'`).
**Fix:** Add to `ServiceRequestCreate` + either add model columns or store in `location`/`details` JSONB + update `liff.py` to pass them in the `ServiceRequest(...)` constructor.
**Suggested JSONB storage:**
```python
# In liff.py — collect dropped fields into JSONB columns
location={"province": data.province, "district": data.district, "sub_district": data.sub_district},
details={"source": "LIFF v2", "agency": data.agency, "prefix": data.prefix, "email": data.email,
         "topic_subcategory": data.topic_subcategory}
```

### GAP-2: No role management CRUD
`UserRole` enum exists (`SUPER_ADMIN/ADMIN/AGENT/USER`) and is on the `User` model, but there is no `PATCH /admin/users/{id}` endpoint to change a user's role. The users frontend page is also `ComingSoon`.
**Fix:** Add `PATCH /admin/users/{id}` with `{ role: UserRole }` payload.

### GAP-3: Comments user_id from Query param
`POST /{id}/comments` requires `?user_id=N` as a Query param — this is a stopgap until JWT auth is complete.
**Fix (when auth ready):** Replace `user_id: int = Query(...)` with `user_id: int = Depends(get_current_user_id)`.

### GAP-4: Admin Users page is ComingSoon
`GET /admin/users` backend is fully implemented. Frontend at `frontend/app/admin/users/page.tsx` only renders `<ComingSoon />`.

### GAP-5: Kanban is read-only
Kanban board (`/admin/requests/kanban/page.tsx`) shows requests grouped by status but does not support drag-and-drop status updates. Status changes must go through the detail page.

### GAP-6: Settings page is ComingSoon (by design)
`GET/POST /admin/settings` backend exists. The frontend settings page is intentionally deferred — planned as a dedicated `skn-settings-config` skill covering LINE channel config, Telegram notification config, business hours, and other system settings.

---

## Common Issues

### Form fields not saving to DB
**Cause**: GAP-1 — `agency`, `province`, `district`, `sub_district`, `prefix`, `email`, `topic_subcategory` are not in `ServiceRequestCreate`. They arrive in the request body but Pydantic discards them.
**Fix**: Add to schema + pass explicitly in `liff.py` constructor → run Alembic migration if adding columns.

### `status=None` requests missing from "pending" stats
**Cause**: Stats query must use `(status == PENDING) | status.is_(None)`. If written as just `status == PENDING`, LIFF-created requests (status=None) are missed.
**Fix**: Restore the `| ServiceRequest.status.is_(None)` clause.

### `assignee_name` always `None`
**Cause**: Missing `outerjoin(User, ...)` in the query. `assignee_name` is not a model column; it must be JOINed and manually patched onto the response dict.
**Fix**: Use `select(ServiceRequest, User.display_name.label("assignee_name")).outerjoin(...)` pattern.

### Flex bubble shows raw enum string instead of Thai label
**Cause**: New `RequestStatus` value added without updating `status_map` in `flex_messages.py`.
**Fix**: Add the new key → Thai label → hex color to `status_map`.

### `completed_at` always NULL
**Cause**: `update_request()` modified without preserving `request.completed_at = func.now()` on status → COMPLETED.
**Fix**: Re-add the `if update_data.status == RequestStatus.COMPLETED:` guard.

### Comments 422 (missing `user_id`)
**Cause**: `user_id` is `Query(...)` — required as a URL query param, not in the JSON body.
**Fix (short-term)**: Call `POST /{id}/comments?user_id=<id>`. Fix (long-term): Switch to JWT auth dep.

### AssignModal agent list empty
**Cause**: `GET /admin/users` failing or returning no results. Check if any users exist with `AGENT` or `ADMIN` role.
**Fix**: Verify `GET /admin/users` returns data; the modal renders the full list regardless of role.

---

## Quality Checklist

- [ ] `status=None` for LIFF-created requests (not `PENDING`)
- [ ] Stats pending guard includes `status.is_(None)`
- [ ] `completed_at = func.now()` set when status → COMPLETED
- [ ] `assignee_name` uses `outerjoin(User)` + manual response dict patching
- [ ] New `RequestStatus` value added to `status_map` in `flex_messages.py`
- [ ] New field added to `ServiceRequestCreate` AND `ServiceRequestResponse` schemas
- [ ] New field explicitly passed in `liff.py` `ServiceRequest(...)` constructor
- [ ] New column has Alembic migration generated and applied
- [ ] LIFF form `formData` state + input + `validateStep()` updated for new field
- [ ] Comments `user_id` from `Query(...)` param (until JWT auth added)
- [ ] `func.to_char()` monthly stats only for PostgreSQL target
- [ ] JSONB fields passed as `dict`/`list` (not JSON strings)
- [ ] Settings logic goes in `skn-settings-config` skill, NOT here
