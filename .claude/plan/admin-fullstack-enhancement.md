# Implementation Plan: Admin Full-Stack Enhancement (v2)

> Generated: 2026-03-28 | Updated: 2026-03-28 (v2 — incorporates frontend + backend reviews)
> Status: PENDING REVIEW

## Task Type
- [x] Frontend (UI pages, sidebar, design system)
- [x] Backend (API endpoints, models, PDF generation)
- [x] Fullstack (Parallel BE + FE work)

---

## Cross-Cutting Architectural Decisions

### Frontend Architecture (from Frontend Review)

1. **CSS Tokens (Tailwind v4)**: All new tokens defined as CSS variables inside `@theme` directive in `globals.css`. No `tailwind.config.ts` extension.
2. **Form Validation**: Standardize on `react-hook-form` + `zod` schemas. Multi-step forms use `useFormContext` for cross-step state sharing.
3. **Server/Client Boundary**: Tables, layouts, data-fetching pages = Server Components. Modals, forms, interactive buttons, hooks = Client Components (`"use client"`).
4. **Sheet over Modal**: Admin forms with multiple fields use `Sheet` (side panel from shadcn/ui) instead of centered `Modal` — keeps dashboard context visible.
5. **Chat Infinite Scroll**: Chat bubble views use `IntersectionObserver` + cursor-based pagination (not manual "Load more" buttons).
6. **PDF Direct Download**: Use `<a>` with `Content-Disposition: attachment` header from backend, not `blob()` in browser memory. Avoids client-side OOM on large reports.

### Backend Architecture (from Backend Review)

1. **Reuse Existing APIs**: Extend `admin_live_chat.py` and `admin_export.py` for chat history features. Do NOT create parallel `admin_chat_histories.py`.
2. **UUID-aware**: `MediaFile.id` is UUID. All attachment references use `UUID`, not `int`.
3. **Soft-delete = cross-cutting**: Adding `is_deleted` to Message requires updating every read path (list, detail, search, export, reports, unread counts). Split into phases.
4. **BLOCK events not captured**: Current webhook does NOT capture BLOCK/UNBLOCK events. Do not show block analytics until ingestion exists.
5. **reportlab already installed**: No new dependency needed. PDF export for conversations already exists in `admin_export.py`.
6. **Archive = two-step**: Close session first, then archive. Separate concerns.
7. **Tests per phase**: Each backend change ships with tests extending existing test files.

---

## Requirements Summary

| # | Feature | Priority | Complexity | Changed in v2 |
|---|---------|----------|------------|----------------|
| 1 | Manage Requests — Admin Manual Create | HIGH | Medium | UUID attachments, JSONB format |
| 2 | Chat Histories — New Menu + CRUD | HIGH | Medium→Split | Reuse existing BE, defer soft-delete |
| 3 | Friends → Friend Histories — Rename + Enhance | MEDIUM | Low-Medium | Remove block analytics |
| 4 | Reports — PDF Export | MEDIUM | Low-Medium | reportlab exists, no matplotlib |
| 5 | Audit Menu — Add to Sidebar | LOW | Low | Unchanged |
| 6 | Design System — Update | MEDIUM | Medium | Library recs added |
| 7 | Live Chat — Add Create/Delete (soft) | MEDIUM | Medium | Two-step archive semantics |
| 8 | File Management — Add Update (metadata) | LOW | Low | UUID, scope to filename+category |

---

## Phase 0: Design System Foundation (MOVED UP)

> **Why move up?** New UI components (Timeline, FileUploadZone, StepForm, DateRangePicker) are dependencies for Phases 2-6. Building them first prevents ad-hoc implementations.

### Step 0.1: New Shared UI Components

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/components/ui/Timeline.tsx` | Create | Custom CSS Grid + pseudo-elements (no external lib) |
| `frontend/components/ui/FileUploadZone.tsx` | Create | Wraps `react-dropzone` for drag-and-drop |
| `frontend/components/ui/StepForm.tsx` | Create | Multi-step wizard using `react-hook-form` + `useFormContext` |
| `frontend/components/ui/SearchableSelect.tsx` | Create | Searchable dropdown (Combobox pattern) |
| `frontend/components/ui/DateRangePicker.tsx` | Create | Wraps `react-day-picker` + `date-fns` |
| `frontend/components/ui/ConfirmDialog.tsx` | Create | Standardized confirmation with danger variant |
| `frontend/components/ui/Sheet.tsx` | Create | Side panel (shadcn/ui Sheet) for admin forms |

**Component specs:**

```typescript
// Timeline.tsx — Pure CSS Grid, no external deps
interface TimelineProps {
  items: TimelineItem[];     // { date, title, description, type, icon? }
  variant?: 'default' | 'compact';
}
// Uses CSS Grid + ::before pseudo-elements for connector lines
// Color-coded dots by event type via design tokens

// FileUploadZone.tsx — react-dropzone wrapper
interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;           // bytes
  existingFiles?: MediaFile[]; // show already-attached files
}

// StepForm.tsx — react-hook-form multi-step
interface StepFormProps {
  steps: StepDefinition[];    // { title, schema: ZodSchema, fields: ReactNode }
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}
// Uses FormProvider + useFormContext for cross-step state

// DateRangePicker.tsx — react-day-picker + date-fns
interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
  presets?: { label: string; days: number }[];  // "7 วัน", "30 วัน", "90 วัน"
}
```

### Step 0.2: Design Token Updates

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/globals.css` | Modify | Add new tokens in `@theme` directive |

```css
/* New tokens in @theme */
--color-timeline-connector: hsl(220 13% 81%);
--color-timeline-dot-follow: hsl(142 71% 45%);
--color-timeline-dot-unfollow: hsl(38 92% 50%);
--color-timeline-dot-refollow: hsl(217 91% 60%);
--color-timeline-dot-block: hsl(0 84% 60%);

--chart-6: hsl(340 75% 55%);    /* Pink */
--chart-7: hsl(195 70% 50%);    /* Cyan */
--chart-8: hsl(30 80% 55%);     /* Orange */

--color-sheet-overlay: hsl(0 0% 0% / 0.4);
```

### Step 0.3: Consistency Audit

```
- Standardize all confirmation actions → ConfirmDialog.tsx
- Ensure all data tables → AdminTableHead + consistent pagination
- Ensure all admin forms → react-hook-form + zod
- Verify all modals use Modal.tsx or Sheet.tsx (check for ad-hoc)
```

**Dependencies to install:**
```bash
cd frontend && npm install react-hook-form zod @hookform/resolvers react-dropzone react-day-picker date-fns
```

**Deliverable**: 7 new shared UI components + design token expansion + consistency fixes

---

## Phase 1: Low-Hanging Fruit (Quick Wins)

### Step 1.1: Add Audit Menu to Sidebar

**Why**: Backend (`admin_audit.py`) and frontend (`audit/page.tsx`) already exist. Just missing from sidebar navigation.

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/layout.tsx` | Modify | Add Audit menu item to System Management group |

```typescript
// In sidebar menu items array, under "System Management" group:
{
  name: 'Audit Log',
  nameTh: 'บันทึกการใช้งาน',
  href: '/admin/audit',
  icon: Shield,  // from lucide-react
  roles: ['SUPER_ADMIN', 'ADMIN'],
}
```

**Deliverable**: Audit page accessible from sidebar menu

---

### Step 1.2: File Management — Add Metadata Update

**Why**: Users expect to rename files or change categories without re-uploading.

> **v2 corrections (from Backend Review):**
> - `media_id` is **UUID**, not `int`
> - `description` field does NOT exist in model — scope v1 to `filename` + `category` only
> - Add migration for `description` only if product requires it

**Backend:**

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/media.py` | Modify | Add PATCH `/admin/media/{media_id}` endpoint |

```python
from uuid import UUID

class MediaUpdateRequest(BaseModel):
    filename: str | None = None
    category: FileCategory | None = None  # Use existing FileCategory enum

@router.patch("/admin/media/{media_id}")
async def update_media_metadata(
    media_id: UUID,  # UUID, not int
    data: MediaUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    media = await db.get(MediaFile, media_id)
    if not media:
        raise HTTPException(404, "Media not found")

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(media, field, value)
    media.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(media)
    return media_to_dict(media)
```

**Frontend:**

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/files/page.tsx` | Modify | Add Edit button + Sheet panel (not modal) for editing |

```typescript
// Use Sheet (side panel) instead of centered modal:
// - filename (text input, pre-filled)
// - category (select dropdown, pre-filled)
// On save: PATCH /admin/media/{uuid} → refresh list
// Sheet keeps file list visible on the left
```

**Tests:**
```python
# test_media_update.py
- test_patch_filename_success(valid UUID, new filename)
- test_patch_category_success(valid UUID, new category)
- test_patch_invalid_uuid(returns 404)
- test_patch_invalid_category(returns 422)
- test_patch_unauthorized(no token → 401)
```

**Deliverable**: Edit button on each file → Sheet panel to update filename/category

---

## Phase 2: Manage Requests — Admin Manual Create

### Step 2.1: Backend — Add POST Endpoint

> **v2 corrections (from Backend Review):**
> - Attachments use **UUID**, stored as **JSONB** (matching existing pattern)
> - Resolve media UUIDs into attachment objects at save time
> - Reuse existing LIFF field mapping where possible

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/models/service_request.py` | Modify | Add `source` field |
| `backend/app/api/v1/endpoints/admin_requests.py` | Modify | Add POST `/` endpoint |

**Model change:**
```python
class RequestSource(str, Enum):
    LIFF = "LIFF"
    ADMIN = "ADMIN"
    PHONE = "PHONE"
    PAPER = "PAPER"
    WALK_IN = "WALK_IN"

# Add to ServiceRequest model:
source = Column(String(20), default="LIFF", nullable=False, index=True)
```

**Endpoint:**
```python
from uuid import UUID

class AdminCreateRequestSchema(BaseModel):
    source: RequestSource = RequestSource.ADMIN
    requester_name: str
    phone_number: str | None = None
    email: str | None = None
    # Thai address fields
    agency: str | None = None
    province: str | None = None
    district: str | None = None
    sub_district: str | None = None
    prefix: str | None = None
    firstname: str
    lastname: str
    # Request details
    topic_category: str
    topic_subcategory: str | None = None
    description: str
    priority: str = "MEDIUM"
    line_user_id: str | None = None
    # Attachments as media UUIDs — resolved to JSONB at save time
    attachment_ids: list[UUID] | None = None

@router.post("/")
async def create_request(
    data: AdminCreateRequestSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # 1. Build attachments JSONB from media UUIDs
    attachments = []
    if data.attachment_ids:
        for media_id in data.attachment_ids:
            media = await db.get(MediaFile, media_id)
            if not media:
                raise HTTPException(400, f"Media {media_id} not found")
            attachments.append({
                "id": str(media.id),
                "filename": media.filename,
                "mime_type": media.mime_type,
                "url": f"/api/v1/media/{media.id}"
            })

    # 2. Create ServiceRequest
    request = ServiceRequest(
        source=data.source.value,
        requester_name=data.requester_name,
        firstname=data.firstname,
        lastname=data.lastname,
        # ... map remaining fields
        attachments=attachments,  # JSONB
        status="PENDING",
        priority=data.priority,
    )
    db.add(request)
    await db.commit()

    # 3. Audit log
    # 4. Return created request
```

**Migration:**
```bash
python scripts/db_target.py alembic --target local revision --autogenerate -m "add source field to service_request"
python scripts/db_target.py alembic --target local upgrade head
```

**Tests:**
```python
# Extend existing request tests:
- test_create_request_admin_source()
- test_create_request_phone_source()
- test_create_request_with_valid_attachments(UUIDs)
- test_create_request_with_invalid_attachment_uuid(returns 400)
- test_create_request_no_attachments()
- test_create_request_source_default_is_admin()
```

### Step 2.2: Frontend — Add Create Request Form

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/requests/page.tsx` | Modify | Add "สร้างคำร้อง" button in header |
| `frontend/app/admin/requests/create/page.tsx` | Create | New page with multi-step form |

> **v2 enhancements (from Frontend Review):**
> - Use `StepForm.tsx` component with `react-hook-form` + `zod`
> - Server Component wrapper, Client Component form

```typescript
// create/page.tsx — Server Component (layout only)
// create/_components/CreateRequestForm.tsx — "use client" (interactive form)

// Zod schemas per step:
const step1Schema = z.object({
  source: z.enum(['ADMIN', 'PHONE', 'PAPER', 'WALK_IN']),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  phone_number: z.string().optional(),
  email: z.string().email().optional(),
  line_user_id: z.string().optional(),
});

const step2Schema = z.object({
  topic_category: z.string().min(1),
  topic_subcategory: z.string().optional(),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

const step3Schema = z.object({
  province: z.string().optional(),
  district: z.string().optional(),
  sub_district: z.string().optional(),
  attachment_ids: z.array(z.string().uuid()).optional(),
});

// Uses StepForm + FileUploadZone + SearchableSelect (from Phase 0)
// On submit: POST /admin/requests → redirect to /admin/requests/{id}
```

**Deliverable**: Admin can create requests from phone calls, paper forms, walk-ins

---

## Phase 3: Chat Histories — New Menu (Split into 3A + 3B)

> **v2 major restructure (from Backend Review):**
> - **Phase 3A**: Frontend-only — new pages that reuse existing `admin_live_chat` + `admin_export` endpoints
> - **Phase 3B**: Add optional chat-history stats endpoint (if UI needs aggregated data)
> - **Phase 3C** (deferred): Soft-delete — only after every read path is updated and tested

### Step 3A: Frontend Pages + Sidebar (reuse existing APIs)

**No new backend files needed.** Existing endpoints to reuse:

| Existing Endpoint | Used For |
|-------------------|----------|
| `GET /admin/live-chat/conversations` | List all conversations |
| `GET /admin/live-chat/conversations/{line_user_id}` | Conversation detail |
| `GET /admin/live-chat/conversations/{line_user_id}/messages` | Paginated messages (cursor-based) |
| `GET /admin/live-chat/messages/search` | Full-text search |
| `GET /admin/export/conversations/{line_user_id}` | CSV/PDF export |

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/chat-histories/page.tsx` | Create | Conversation list (Server Component + Client filters) |
| `frontend/app/admin/chat-histories/[lineUserId]/page.tsx` | Create | Conversation detail with chat bubbles |
| `frontend/app/admin/layout.tsx` | Modify | Add Chat Histories menu item |

**UI Design — List Page:**
```
┌──────────────────────────────────────────────────────┐
│  ประวัติแชท                [DateRangePicker] [Export]  │
├──────────┬───────────────────────────────────────────┤
│ Filters  │  User List (table)                        │
│ ─────── │  ┌────────────────────────────────────┐   │
│ Search   │  │ Avatar | Name | Messages | Last msg│   │
│ [______] │  │ ○ สมชาย  |  156  | 2 min ago       │   │
│          │  │ ○ สมหญิง |   89  | 1 hour ago      │   │
│ Direction│  │ ○ วิชัย   |   45  | yesterday       │   │
│ ☑ IN     │  └────────────────────────────────────┘   │
│ ☑ OUT    │                                           │
│          │  Infinite scroll (IntersectionObserver)    │
│ Type     │                                           │
│ ☑ Text   │                                           │
│ ☑ Image  │                                           │
└──────────┴───────────────────────────────────────────┘
```

**UI Design — Detail Page:**
> **v2 enhancement**: Infinite scroll with `IntersectionObserver` + cursor-based pagination (not manual "Load more")

```
┌──────────────────────────────────────────────────────┐
│  ← กลับ | สมชาย (U12345)      [Stats] [Export CSV/PDF]│
├──────────────────────────────────────────────────────┤
│  ↑ (IntersectionObserver triggers load older msgs)   │
│  Chat bubble view:                                   │
│  ┌──────────┐                                        │
│  │ สวัสดีครับ │  ← USER (incoming, left-aligned)       │
│  └──────────┘                                        │
│                   ┌─────────────────┐                │
│  BOT (outgoing) → │ สวัสดีค่ะ ยินดีต้อนรับ │              │
│                   └─────────────────┘                │
│                   ┌──────────────────┐               │
│  ADMIN (outgoing) → │ เจ้าหน้าที่รับเรื่องแล้ว │            │
│                   └──────────────────┘               │
│  Color-coded by sender_role:                         │
│    USER=gray-left, BOT=brand-right, ADMIN=blue-right │
└──────────────────────────────────────────────────────┘
```

**Sidebar menu item:**
```typescript
{
  name: 'Chat Histories',
  nameTh: 'ประวัติแชท',
  href: '/admin/chat-histories',
  icon: MessageSquare,
  roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'],
}
// Place under "Chatbot Management" group, after Live Chat
```

### Step 3B: Optional Stats Endpoint (if needed)

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/admin_live_chat.py` | Modify | Add per-user stats endpoint |

```python
# GET /admin/live-chat/conversations/{line_user_id}/stats
# Only add if frontend can't derive these client-side
# Returns:
#   - total_messages (in/out breakdown)
#   - first_message_at, last_message_at
#   - messages_by_type (text, image, sticker, etc.)
#   - active_hours (top 3 hours by message volume)
```

### Step 3C: Soft-Delete (DEFERRED — separate PR)

> **Why defer?** Adding `is_deleted` to Message requires updating every query:
> - `admin_live_chat.py` conversation list/detail/search
> - `admin_export.py` CSV/PDF export
> - `admin_reports.py` message counts
> - `admin_analytics.py` analytics
> - WebSocket message broadcasts
> - Unread count calculations
>
> This is a **cross-cutting change** that should be its own PR with comprehensive tests.

**When to implement:** After Phase 3A is stable and all read paths are identified.

**Deliverable (3A)**: Full chat history browser using existing APIs — search, filter, export, infinite scroll

---

## Phase 4: Friends → Friend Histories

### Step 4.1: Rename Menu + Enhance Backend

> **v2 correction (from Backend Review):**
> - Remove BLOCK/UNBLOCK analytics — webhook does NOT capture these events
> - Limit to: FOLLOW, UNFOLLOW, REFOLLOW (events that actually exist)
> - Duration calculations only where derivable from real event data

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/layout.tsx` | Modify | Rename "Friends" → "Friend Histories" (ประวัติเพื่อน) |
| `backend/app/api/v1/endpoints/admin_friends.py` | Modify | Enhance `/events` endpoint with duration + refollow numbering |

**Backend Enhancement:**
```python
# Enhanced GET /admin/friends/{line_user_id}/events
# Return timeline with (only real events):
# - Event type: FOLLOW, UNFOLLOW, REFOLLOW
# - Refollow number: ครั้งที่ 1, ครั้งที่ 2, ครั้งที่ 3
# - Timestamp
# - Source (WEBHOOK, MANUAL)
# - duration_since_previous: timedelta to previous event (derivable)
#
# DO NOT include:
# - BLOCK/UNBLOCK (not captured by webhook)
# - Block duration analytics (no data source)
# - Risk scoring (insufficient data)

# Optional: GET /admin/friends/{line_user_id}/timeline
# Only if frontend needs aggregated payload:
# - Total follow duration (sum of follow periods)
# - Refollow count
# - Previous/next event timestamps
```

### Step 4.2: Frontend — Enhanced History View

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/friends/page.tsx` | Modify | Rename header, enhance refollow badge details |
| `frontend/app/admin/friends/[lineUserId]/page.tsx` | Create | Timeline page using `Timeline.tsx` component |

**UI Design — Timeline View (v2: only real events):**
```
┌─────────────────────────────────────────────────────┐
│  ← ประวัติเพื่อน | สมชาย (U12345)                      │
├─────────────────────────────────────────────────────┤
│  Summary Cards:                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ สถานะ     │ │ ครั้งที่ Follow│ │ ครั้งที่ Refollow│          │
│  │ ACTIVE ✓ │ │    3     │ │    2     │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  Timeline (uses Timeline.tsx component):            │
│  ● 2026-03-15  REFOLLOW (ครั้งที่ 2)                  │
│  │  กลับมาเป็นเพื่อนอีกครั้ง หลัง unfollow 10 วัน         │
│  ●─ 2026-03-05  UNFOLLOW                            │
│  │  ยกเลิกการติดตาม                                    │
│  ● 2026-02-01  REFOLLOW (ครั้งที่ 1)                  │
│  │  กลับมาเป็นเพื่อนอีกครั้ง หลัง unfollow 17 วัน         │
│  ●─ 2026-01-15  UNFOLLOW                            │
│  │  ยกเลิกการติดตาม                                    │
│  ● 2025-12-01  FOLLOW (เพิ่มเพื่อนครั้งแรก)             │
└─────────────────────────────────────────────────────┘
```

> Note: When BLOCK webhook capture is implemented later, the timeline will automatically show BLOCK events.

**Deliverable**: Timeline view showing real friend lifecycle with refollow numbering

---

## Phase 5: Reports — PDF Export

> **v2 corrections (from Backend Review):**
> - `reportlab` is **already in requirements.txt** — no new dependency needed
> - PDF export already exists in `admin_export.py` for conversations
> - Start with summary PDFs using existing report data, no matplotlib needed initially
> - Use `Content-Disposition: attachment` for direct download (from Frontend Review)

### Step 5.1: Backend — PDF Report Service

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/services/pdf_report_service.py` | Create | PDF generation for admin reports |
| `backend/app/api/v1/endpoints/admin_reports.py` | Modify | Add PDF export endpoint |

```python
# New endpoint: GET /admin/reports/export/pdf?report_type=overview&period=30
# report_type: overview, service-requests, messages, operators, followers

# Reuses data from existing report endpoints internally:
# - self._get_overview_data(db, period)  ← same logic as GET /admin/reports/overview
# - self._get_requests_data(db, period)  ← same logic as GET /admin/reports/service-requests

class PDFReportService:
    """Uses reportlab (already installed) to generate PDF reports."""

    def generate_report(self, report_type: str, data: dict) -> BytesIO:
        """Route to correct generator based on report_type."""
        ...

    def _build_overview_pdf(self, data: dict) -> BytesIO:
        # Header: title + date range + generation timestamp
        # KPI summary table (4 metrics)
        # Trend data as formatted table (no charts in v1)
        # Footer: page numbers

    def _build_requests_pdf(self, data: dict) -> BytesIO:
        # Status breakdown table
        # Category breakdown table
        # Monthly counts table

    def _build_operators_pdf(self, data: dict) -> BytesIO:
        # Operator performance table (name, sessions, avg response, messages)

    def _build_followers_pdf(self, data: dict) -> BytesIO:
        # Follower summary: total, new, lost, refollow, growth rate

# Return with headers:
# Content-Type: application/pdf
# Content-Disposition: attachment; filename="report_overview_2026-03-28.pdf"
```

### Step 5.2: Frontend — PDF Download Buttons

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/reports/page.tsx` | Modify | Add PDF download button next to CSV export |

> **v2 enhancement (from Frontend Review):** Direct download via `<a>` tag, not `blob()` in memory

```typescript
// Direct download approach (avoids client-side OOM):
function PDFDownloadButton({ reportType, period }: Props) {
  const { token } = useAuth();
  const url = `${API_URL}/admin/reports/export/pdf?report_type=${reportType}&period=${period}`;

  // Option A: If no auth header needed (presigned URL)
  return <a href={url} target="_blank"><Button>ดาวน์โหลด PDF</Button></a>;

  // Option B: If auth required, use proxy route or short-lived token
  // Create Next.js API route that proxies to backend with auth header
}
```

**Tests:**
```python
# Extend existing report tests:
- test_pdf_export_overview(returns 200, content-type application/pdf)
- test_pdf_export_requests(valid PDF bytes)
- test_pdf_export_operators(valid table data in PDF)
- test_pdf_export_invalid_type(returns 400)
- test_pdf_export_unauthorized(returns 401)
```

**Deliverable**: PDF export button on each report tab, direct download

---

## Phase 6: Live Chat — Add Create & Archive

> **v2 clarification (from Backend Review):**
> - Archive = **two-step process**: close session first, then archive
> - Archive is a separate lifecycle flag on **already closed** sessions
> - Archive hides from default conversation list view (filter `is_archived=False`)
> - Creating session should follow existing ownership and audit patterns

### Step 6.1: Backend — Manual Session Create + Archive

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/admin_live_chat.py` | Modify | Add POST create + PATCH archive endpoints |
| `backend/app/models/chat_session.py` | Modify | Add `is_archived`, `archived_at`, `archived_by` fields |

**Migration:**
```bash
python scripts/db_target.py alembic --target local revision --autogenerate -m "add archive fields to chat_session"
python scripts/db_target.py alembic --target local upgrade head
```

**Endpoints:**
```python
# POST /admin/live-chat/conversations
class CreateSessionRequest(BaseModel):
    line_user_id: str
    initial_message: str | None = None
    reason: str | None = None

@router.post("/conversations")
async def create_conversation(data: CreateSessionRequest, ...):
    # 1. Verify line_user_id exists in Users
    # 2. Check no ACTIVE session already exists for this user
    # 3. Switch user chat_mode to HUMAN
    # 4. Create ChatSession(status=ACTIVE, operator_id=current_user.id)
    # 5. If initial_message → send via LINE API using existing send path
    # 6. Audit log: action="create_session"
    # 7. WebSocket broadcast: session_created event

# PATCH /admin/live-chat/conversations/{line_user_id}/archive
# Two-step: must be CLOSED first
@router.patch("/conversations/{line_user_id}/archive")
async def archive_conversation(line_user_id: str, ...):
    # 1. Find session — must be status=CLOSED
    # 2. If ACTIVE/WAITING → return 400 "Close session first"
    # 3. Set is_archived=True, archived_at=now, archived_by=current_user.id
    # 4. Messages remain intact
    # 5. Audit log: action="archive_session"

# Update GET /admin/live-chat/conversations
# Add filter: include_archived (default False)
```

### Step 6.2: Frontend — Create & Archive UI

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/live-chat/_components/ConversationList.tsx` | Modify | Add "เริ่มแชทใหม่" button + archive option on closed sessions |
| `frontend/app/admin/live-chat/_components/CreateChatSheet.tsx` | Create | Sheet panel to search LINE user + start chat |

```typescript
// CreateChatSheet (Sheet, not Dialog — keeps conversation list visible)
// - SearchableSelect to find LINE user by name or ID
// - Optional initial message textarea
// - Optional reason field
// - Submit: POST /admin/live-chat/conversations

// Archive button: only visible on CLOSED sessions
// - ConfirmDialog: "ซ่อนการสนทนานี้จากรายการหลัก?"
// - PATCH /admin/live-chat/conversations/{id}/archive
// - Toggle "แสดงการสนทนาที่ซ่อน" to show archived
```

**Tests:**
```python
# Extend existing live chat tests:
- test_create_session_success()
- test_create_session_duplicate_active(returns 400)
- test_create_session_with_initial_message()
- test_archive_closed_session()
- test_archive_active_session_fails(returns 400)
- test_conversation_list_excludes_archived()
- test_conversation_list_include_archived()
```

**Deliverable**: Admin can initiate chats and archive closed conversations

---

## Implementation Order (Revised)

```
Phase 0 (Design System) ──────── First
  ├─ 0.1 New shared UI components (7 components)
  ├─ 0.2 Design token updates
  └─ 0.3 Consistency audit

Phase 1 (Quick Wins) ──────────── Then
  ├─ 1.1 Audit menu → sidebar
  └─ 1.2 File metadata update (UUID-aware)

Phase 2 (Manage Requests) ─────── Parallel BE+FE
  ├─ 2.1 Backend POST + source migration
  └─ 2.2 Frontend create form (uses StepForm, FileUploadZone)

Phase 3A (Chat Histories UI) ──── Frontend-only
  ├─ 3A Frontend pages (reuse existing BE endpoints)
  └─ 3B Optional stats endpoint

Phase 4 (Friend Histories) ────── Parallel BE+FE
  ├─ 4.1 Rename + enhance backend (real events only)
  └─ 4.2 Timeline UI (uses Timeline.tsx)

Phase 5 (Reports PDF) ─────────── Parallel BE+FE
  ├─ 5.1 PDF service (reportlab, already installed)
  └─ 5.2 Frontend direct-download buttons

Phase 6 (Live Chat CRUD) ──────── Parallel BE+FE
  ├─ 6.1 Backend create + archive (two-step)
  └─ 6.2 Frontend Sheet + ConfirmDialog

Phase 3C (Soft-Delete) ─────────── DEFERRED (separate PR)
  └─ Cross-cutting Message.is_deleted across all read paths
```

## Key Files Summary (v2)

| File | Operation | Phase |
|------|-----------|-------|
| `frontend/components/ui/Timeline.tsx` | Create | 0.1 |
| `frontend/components/ui/FileUploadZone.tsx` | Create | 0.1 |
| `frontend/components/ui/StepForm.tsx` | Create | 0.1 |
| `frontend/components/ui/SearchableSelect.tsx` | Create | 0.1 |
| `frontend/components/ui/DateRangePicker.tsx` | Create | 0.1 |
| `frontend/components/ui/ConfirmDialog.tsx` | Create | 0.1 |
| `frontend/components/ui/Sheet.tsx` | Create | 0.1 |
| `frontend/app/globals.css` | Modify | 0.2 |
| `frontend/app/admin/layout.tsx` | Modify | 1.1, 3A, 4.1 |
| `backend/app/api/v1/endpoints/media.py` | Modify | 1.2 |
| `frontend/app/admin/files/page.tsx` | Modify | 1.2 |
| `backend/app/models/service_request.py` | Modify | 2.1 |
| `backend/app/api/v1/endpoints/admin_requests.py` | Modify | 2.1 |
| `frontend/app/admin/requests/page.tsx` | Modify | 2.2 |
| `frontend/app/admin/requests/create/page.tsx` | Create | 2.2 |
| `frontend/app/admin/chat-histories/page.tsx` | Create | 3A |
| `frontend/app/admin/chat-histories/[lineUserId]/page.tsx` | Create | 3A |
| `backend/app/api/v1/endpoints/admin_live_chat.py` | Modify | 3B, 6.1 |
| `backend/app/api/v1/endpoints/admin_friends.py` | Modify | 4.1 |
| `frontend/app/admin/friends/page.tsx` | Modify | 4.2 |
| `frontend/app/admin/friends/[lineUserId]/page.tsx` | Create | 4.2 |
| `backend/app/services/pdf_report_service.py` | Create | 5.1 |
| `backend/app/api/v1/endpoints/admin_reports.py` | Modify | 5.1 |
| `frontend/app/admin/reports/page.tsx` | Modify | 5.2 |
| `backend/app/models/chat_session.py` | Modify | 6.1 |
| `frontend/app/admin/live-chat/_components/ConversationList.tsx` | Modify | 6.2 |
| `frontend/app/admin/live-chat/_components/CreateChatSheet.tsx` | Create | 6.2 |

## Risks and Mitigation (v2)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Service Request `source` migration | Existing data | Default existing rows to `LIFF`, non-destructive |
| Chat history query performance | Slow on millions of messages | Cursor-based pagination, existing indexes on `line_user_id + created_at` |
| PDF generation memory | Server OOM on large reports | Stream PDF via `StreamingResponse`, limit period to 90 days |
| Live Chat create — user doesn't want contact | UX issue | Check no active session exists, rate limit admin-initiated chats |
| Chat session archive hiding data | Admin confusion | Toggle "show archived" filter, audit log tracks who archived |
| Friend timeline showing fake block data | Data integrity | **Removed** — only show real events (FOLLOW/UNFOLLOW/REFOLLOW) |
| Design system breaking changes | UI regressions | New components only, no breaking changes to existing ones |
| Soft-delete message read path consistency | Data integrity | **Deferred to Phase 3C** — separate PR with full audit |

## Database Migrations Required (v2)

1. `service_request` — Add `source` column (VARCHAR 20, default 'LIFF', NOT NULL)
2. `chat_session` — Add `is_archived` (BOOLEAN default false), `archived_at` (TIMESTAMP nullable), `archived_by` (FK users.id nullable)

> **Removed from v2:** Message soft-delete migration (deferred to Phase 3C as separate PR)

## Dependencies

**Backend (pip):** None new — `reportlab` already installed

**Frontend (npm):**
```bash
npm install react-hook-form zod @hookform/resolvers react-dropzone react-day-picker date-fns
```

## SESSION_ID (for /ccg:execute use)

- CODEX_SESSION: N/A (codeagent-wrapper not available)
- GEMINI_SESSION: N/A (codeagent-wrapper not available)
