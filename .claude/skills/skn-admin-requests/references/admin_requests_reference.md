# Admin Requests Frontend — Reference

Sources: `frontend/app/admin/requests/page.tsx`,
`frontend/app/admin/requests/[id]/page.tsx`,
`frontend/app/admin/requests/kanban/page.tsx`,
`frontend/components/admin/AssignModal.tsx`

---

## File Locations

| File | Purpose |
|---|---|
| `frontend/app/admin/requests/page.tsx` | List view (415 lines): filter+search, inline modals |
| `frontend/app/admin/requests/[id]/page.tsx` | Detail view (719 lines): 4-tab layout, bulk save |
| `frontend/app/admin/requests/kanban/page.tsx` | Kanban board (188 lines): 4 static columns |
| `frontend/components/admin/AssignModal.tsx` | Shared assignment modal |

---

## TypeScript Interfaces

### List Page (`requests/page.tsx`) — lowercase status

```ts
interface ServiceRequest {
  id: number;
  prefix: string;
  firstname: string;
  lastname: string;
  phone_number: string;
  agency: string;
  province: string;
  district: string;
  topic_category: string;
  topic_subcategory: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | null; // null = LIFF-submitted
  created_at: string;
  assigned_agent_id?: number;
  assignee_name?: string;
}
```

### Detail Page (`[id]/page.tsx`) — UPPERCASE status

```ts
interface ServiceRequestDetail {
  id: number;
  prefix: string;
  firstname: string;
  lastname: string;
  phone_number: string;
  email: string;
  agency: string;
  province: string;
  district: string;
  sub_district: string;
  topic_category: string;
  topic_subcategory: string;
  description: string;
  attachments: Array<{ name: string; url: string }>;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;     // ISO 8601
  created_at: string;
  assigned_agent_id?: number;
  assignee_name?: string;
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  display_name: string;
  created_at: string;
}

// Local manage tab state (NOT sent to API until Save):
type ManageFormData = {
  status: string;    // initialized from request.status
  priority: string;  // initialized from request.priority
  due_date: string;  // request.due_date.split('T')[0] or ''
  comment: string;   // always '' on init, posted to comments API
}
```

### AssignModal

```ts
interface Agent {
  id: number;
  display_name: string;
  role: string;
  active_tasks: number;      // pending + in_progress count
  pending_tasks: number;
  in_progress_tasks: number;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentId: number, agentName: string) => Promise<void>;
  currentAssigneeId?: number;
}
```

---

## Status Inconsistency Map

| Page | Interface | Values |
|---|---|---|
| List (`page.tsx`) | `ServiceRequest.status` | `'pending'` `'in_progress'` `'completed'` `'rejected'` `null` |
| Detail (`[id]/page.tsx`) | `ServiceRequestDetail.status` | `'PENDING'` `'IN_PROGRESS'` `'COMPLETED'` `'REJECTED'` |
| Kanban columns | `COLUMNS[n].id` | `'PENDING'` `'IN_PROGRESS'` `'COMPLETED'` `'REJECTED'` |
| Manage tab status buttons | `s.value` | `'PENDING'` `'IN_PROGRESS'` `'AWAITING_APPROVAL'` `'COMPLETED'` |

Note: `AWAITING_APPROVAL` appears only in the manage tab buttons — not in the `ServiceRequestDetail` status type. Add it to the interface if actually used.

---

## API Endpoints

| Method | Path | Purpose | Page |
|---|---|---|---|
| `GET` | `/admin/requests?status=X&category=Y&search=Z` | List with filters | List |
| `GET` | `/admin/requests/{id}` | Single request detail | Detail |
| `PATCH` | `/admin/requests/{id}` | Update fields (status/priority/due_date/assigned_agent_id) | Detail |
| `DELETE` | `/admin/requests/{id}` | Delete request | List |
| `GET` | `/admin/requests/{id}/comments` | Load comment history | Detail |
| `POST` | `/admin/requests/{id}/comments?user_id={n}` | Add comment | Detail |
| `GET` | `/admin/requests?limit=200` | All requests for kanban | Kanban |
| `GET` | `/admin/users?role=AGENT` | Fetch assignable agents | AssignModal |

---

## List Page — Filter Behavior

```ts
// URL search params drive filter state:
const searchParams = useSearchParams()
const [status, setStatus] = useState(searchParams.get('status') || '')
const [category, setCategory] = useState(searchParams.get('category') || '')
const [search, setSearch] = useState(searchParams.get('search') || '')

// 500ms debounce on search:
useEffect(() => {
  const timer = setTimeout(fetchRequests, 500)
  return () => clearTimeout(timer)
}, [status, category, search])

// Build API query:
const params = new URLSearchParams()
if (status) params.append('status', status)     // lowercase
if (category) params.append('category', category)
if (search) params.append('search', search)
GET /api/v1/admin/requests?${params}
```

---

## List Page — Status Styles

```ts
function getStatusStyles(status: string | null) {
  // Must handle null (LIFF-submitted, not yet processed):
  if (!status || status === null) return {
    label: 'มาใหม่ (รอรับงาน)',
    variant: 'warning'      // yellow badge
  }
  const map: Record<string, {label: string; variant: string}> = {
    'pending':     { label: 'รอดำเนินการ',      variant: 'warning' },
    'in_progress': { label: 'กำลังดำเนินการ',   variant: 'info' },
    'completed':   { label: 'เสร็จสิ้น',        variant: 'success' },
    'rejected':    { label: 'ยกเลิก',           variant: 'danger' },
  }
  return map[status] || { label: status, variant: 'default' }
}
```

---

## List Page — Assign Handler

```ts
// On AssignModal confirm:
const handleAssign = async (agentId: number) => {
  const res = await fetch(`${API_BASE}/admin/requests/${assigningRequest.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assigned_agent_id: agentId,
      // Auto-advance from pending/null → in_progress:
      ...((!assigningRequest.status || assigningRequest.status === 'pending') && {
        status: 'in_progress'
      })
    })
  })
  fetchRequests()  // Refresh list
}
```

---

## Detail Page — Bulk Save Pattern

```ts
// 1. Local state accumulates changes (no API call on button click):
onClick={() => setManageFormData(prev => ({ ...prev, status: s.value }))}

// 2. handleSaveManage runs on Save button only:
const handleSaveManage = async () => {
  const updates: Record<string, string | null> = {}
  if (manageFormData.status !== request.status) updates.status = manageFormData.status
  if (manageFormData.priority !== request.priority) updates.priority = manageFormData.priority
  const currentDueDate = request.due_date ? request.due_date.split('T')[0] : ''
  if (manageFormData.due_date !== currentDueDate) {
    updates.due_date = manageFormData.due_date || null  // empty string → null to clear
  }
  if (Object.keys(updates).length > 0) {
    await handleUpdateField(updates)  // PATCH + fetchDetail inside
  }
  if (manageFormData.comment.trim()) {
    await fetch(`.../comments?user_id=${currentUserId}`, {
      method: 'POST',
      body: JSON.stringify({ content: manageFormData.comment })
    })
    await fetchComments()
  }
}

// 3. handleCancelManage reverts to original:
const handleCancelManage = () => {
  setManageFormData({
    status: request.status,
    priority: request.priority,
    due_date: request.due_date ? request.due_date.split('T')[0] : '',
    comment: ''
  })
}
```

---

## Detail Page — Quick Action Buttons

Bypass manage tab, call PATCH immediately:

```ts
// "รับเรื่อง" button (disabled if already IN_PROGRESS, COMPLETED, or REJECTED):
onClick={() => handleUpdateField({ status: 'IN_PROGRESS' })}
disabled={['COMPLETED', 'REJECTED', 'IN_PROGRESS'].includes(request.status)}

// "ปิดงาน" button (disabled if already COMPLETED):
onClick={() => handleUpdateField({ status: 'COMPLETED' })}
disabled={request.status === 'COMPLETED'}
```

---

## Detail Page — Assignment in Detail View

```ts
const handleAssignRequest = async (agentId: number) => {
  await handleUpdateField({
    assigned_agent_id: agentId,
    // Auto-advance PENDING → IN_PROGRESS:
    status: request?.status === 'PENDING' ? 'IN_PROGRESS' : undefined
  })
  if (request?.status === 'PENDING') {
    setManageFormData(prev => ({ ...prev, status: 'IN_PROGRESS' }))
  }
}
```

---

## Detail Page — currentUserId Hack (GAP-2)

```ts
// No auth context. Fetches first user from /admin/users as workaround:
const fetchCurrentUser = async () => {
  const res = await fetch(`${API_BASE}/admin/users`)
  if (res.ok) {
    const users = await res.json()
    if (users.length > 0) {
      setCurrentUserId(users[0].id)   // Takes first user
    } else {
      setCurrentUserId(1)              // Hardcoded fallback
    }
  } else {
    setCurrentUserId(1)                // Error fallback
  }
}
// All three mount together in the same useEffect:
void fetchDetail()
void fetchComments()
void fetchCurrentUser()
```

---

## Kanban Page

```ts
// 4 static columns:
const COLUMNS = [
  { id: 'PENDING',     label: 'รอดำเนินการ',    color: 'text-amber-600',  bgColor: 'bg-amber-50',  borderColor: 'border-amber-200' },
  { id: 'IN_PROGRESS', label: 'กำลังดำเนินการ',  color: 'text-blue-600',   bgColor: 'bg-blue-50',   borderColor: 'border-blue-200' },
  { id: 'COMPLETED',   label: 'เสร็จสิ้น',       color: 'text-emerald-600',bgColor: 'bg-emerald-50',borderColor: 'border-emerald-200' },
  { id: 'REJECTED',    label: 'ยกเลิก',          color: 'text-rose-600',   bgColor: 'bg-rose-50',   borderColor: 'border-rose-200' },
]

// Fetch ALL records (no pagination):
GET /admin/requests?limit=200

// Client-side filter:
const filteredRequests = requests.filter(req =>
  req.firstname.includes(search) ||
  req.lastname.includes(search) ||
  req.topic_category.includes(search)
)

// Column filter:
const columnRequests = filteredRequests.filter(req => req.status === column.id)

// Overdue indicator:
const isOverdue = (date?: string) => date && new Date(date) < new Date()
// → shows red AlertTriangle icon on card

// Priority styles:
const getPriorityStyle = (priority: string) => ({
  'URGENT': 'text-rose-600 bg-rose-50 border-rose-200',
  'HIGH':   'text-amber-600 bg-amber-50 border-amber-200',
  'MEDIUM': 'text-blue-600 bg-blue-50 border-blue-200',
  'LOW':    'text-slate-500 bg-slate-50 border-slate-200',
}[priority] || 'text-slate-500 bg-slate-50 border-slate-200')

// Card click navigates to detail:
onClick={() => router.push(`/admin/requests/${req.id}`)
```

---

## AssignModal Behavior

```ts
// Opens on modal isOpen=true:
// 1. Fetches GET /admin/users?role=AGENT (AGENT role users only)
// 2. Renders list with workload badge color:
//    0 tasks = green, <5 = blue, <10 = amber, ≥10 = red
// 3. Highlights currentAssigneeId row with blue ring
// 4. On "เลือก" click: calls onAssign(agent.id, agent.display_name) then onClose()

// Workload color thresholds:
const getWorkloadColor = (count: number) => {
  if (count === 0)  return 'text-green-500 bg-green-50 border-green-200'
  if (count < 5)   return 'text-blue-500 bg-blue-50 border-blue-200'
  if (count < 10)  return 'text-amber-500 bg-amber-50 border-amber-200'
  return 'text-red-500 bg-red-50 border-red-200'
}
```

---

## Known Gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | Status enum inconsistency (lowercase list vs UPPERCASE detail/kanban) | Medium | Normalize to UPPERCASE in backend; update list page interface |
| GAP-2 | `currentUserId` fetched from first admin user (not authenticated user) | High | Wire real auth session to detail page; use auth context instead |
| GAP-3 | Pagination in list page is disabled/placeholder (shows count only) | Medium | Implement server-side pagination with page/limit params |
| GAP-4 | `AWAITING_APPROVAL` in manage tab buttons but not in `ServiceRequestDetail` status type | Low | Add to interface or remove from UI |
| GAP-5 | Kanban loads all records with `limit=200` — will break with large datasets | Medium | Add virtual scroll or column-level pagination |
| GAP-6 | No realtime refresh — list/kanban only updates on manual reload | Low | Add polling or WebSocket push from live-chat WS connection |
