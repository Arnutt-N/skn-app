---
name: skn-admin-requests
description: >
  Extends, modifies, or debugs the admin service request frontend in SKN App —
  the 3-page admin interface (list, detail, kanban) for managing citizen service
  requests submitted via LIFF. Use when asked to "add filter to requests list",
  "modify request detail page", "add request status", "fix request kanban",
  "add comment to request", "change request assignment flow", "เพิ่มฟิลเตอร์คำร้อง",
  "แก้ไขหน้าจัดการคำร้อง", "เพิ่ม status คำร้อง", "แก้ปัญหา kanban", "มอบหมายคำร้อง".
  Do NOT use for LIFF form submission (skn-liff-form) or backend request endpoints
  (skn-liff-data, skn-fastapi-endpoint).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React, TypeScript, Tailwind CSS v4, Lucide icons.
  Admin pages at /admin/requests, /admin/requests/[id], /admin/requests/kanban.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [admin, service-request, kanban, frontend, management]
  related-skills:
    - skn-liff-form
    - skn-liff-data
    - skn-admin-component
    - skn-fastapi-endpoint
  documentation: ./references/admin_requests_reference.md
---

# skn-admin-requests

The admin service request interface is a 3-page frontend for managing citizen requests
submitted via the LIFF form. It includes a list view with filter/search, a full detail
view with 4 tabs, and a kanban board. All pages are `'use client'` with no server-side
data fetching.

---

## CRITICAL: Project-Specific Rules

1. **Status enum inconsistency — do NOT mix cases** — The list page interface uses
   lowercase status strings; the detail and kanban pages use UPPERCASE enums.
   ```ts
   // List page (requests/page.tsx) — lowercase:
   status: 'pending' | 'in_progress' | 'completed' | 'rejected' | null
   // Detail page ([id]/page.tsx) — UPPERCASE:
   status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
   // Kanban (kanban/page.tsx) — UPPERCASE columns: 'PENDING', 'IN_PROGRESS', ...
   ```
   When adding a new status, update both interfaces. When filtering/comparing status in
   the list page, use lowercase; in detail/kanban, use UPPERCASE.

2. **`null` status = LIFF-submitted, not yet processed** — Service requests created via
   LIFF have `status = null`. The list page `getStatusStyles(status)` must handle `null`
   (shown as "มาใหม่ (รอรับงาน)"). Never assume status is always set.
   ```ts
   // List page: getStatusStyles handles null
   if (!status || status === null) return { label: 'มาใหม่ (รอรับงาน)', variant: 'warning' }
   ```

3. **Manage tab uses bulk save — do NOT add direct API calls there** — The manage tab
   in the detail page accumulates changes in local `manageFormData` state and sends a
   single PATCH only when the user clicks Save. Do not add `onChange` API calls in the
   manage tab; keep the local-state-then-save pattern.
   ```ts
   // Local state only — no API call on click:
   onClick={() => setManageFormData(prev => ({ ...prev, status: s.value }))}
   // API call only in handleSaveManage():
   if (manageFormData.status !== request.status) updates.status = manageFormData.status;
   await handleUpdateField(updates)
   ```

4. **Quick action buttons bypass manage tab** — "รับเรื่อง" and "ปิดงาน" buttons in
   the detail page header call `handleUpdateField({status: 'IN_PROGRESS'})` and
   `handleUpdateField({status: 'COMPLETED'})` directly (no local state). They are
   independent of manage tab state.

5. **`handleSaveManage` sends only changed fields** — Compare against original `request`
   object. Send `due_date = null` to clear (not empty string). After PATCH, `fetchDetail()`
   is called inside `handleUpdateField` to sync UI.
   ```ts
   if (manageFormData.due_date !== currentDueDate) {
     updates.due_date = manageFormData.due_date || null  // empty string → null
   }
   ```

6. **Comments: `user_id` is a query param, NOT in the body** —
   ```ts
   // Correct:
   POST /api/v1/admin/requests/{id}/comments?user_id={n}
   body: { content: "text" }
   // Wrong:
   POST /api/v1/admin/requests/{id}/comments
   body: { content: "text", user_id: n }   ← backend ignores this
   ```

7. **`currentUserId` is fetched from `/admin/users` — not from auth context** — The
   detail page has no auth context wired in. It fetches `/admin/users`, takes `users[0].id`,
   and falls back to `1` on error. This is a known gap (GAP-2). Do not try to "fix" it
   by changing the auth flow unless doing a full auth integration.

8. **`AssignModal` signature differs between pages** — List page uses
   `onAssign={(agentId) => handleAssign(agentId)}` (1-arg). Detail page uses
   `onAssign={handleAssignRequest}` where `handleAssignRequest(agentId: number)` auto-
   advances status from 'PENDING' to 'IN_PROGRESS'. The shared component signature is
   `onAssign: (agentId: number, agentName: string) => Promise<void>`.

9. **Kanban fetches `?limit=200` — it loads ALL records** — No pagination in kanban.
   All filtering is client-side. Do not add server-side pagination to kanban without
   rearchitecting the client-side filter logic.

10. **No drag-and-drop in kanban** — Cards are read-only. Clicking a card navigates to
    the detail page (`/admin/requests/{id}`). Status changes happen only in the detail
    page manage tab.

11. **`manageFormData` initializes from `request` on fetch** — When `fetchDetail()`
    completes, `setManageFormData` is called with `data.status`, `data.priority`,
    `data.due_date.split('T')[0]`. Always update this initialization if adding new
    manage fields.

---

## File Structure

```
frontend/app/admin/requests/
├── page.tsx            — List view (415 lines): filter, search, inline modals
├── [id]/
│   └── page.tsx        — Detail view (719 lines): 4-tab layout, bulk save
└── kanban/
    └── page.tsx        — Kanban board (188 lines): 4 static columns

frontend/components/admin/
└── AssignModal.tsx     — Shared assignment modal (fetches AGENT users)
```

---

## Step 1 — Add a New Field to the List View

**1a — Add to `ServiceRequest` interface (list page):**
```ts
interface ServiceRequest {
  // ...existing fields
  new_field: string | null;
}
```

**1b — Add column header in `<thead>`:**
```tsx
<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
  New Field
</th>
```

**1c — Add cell in `<tbody>` row:**
```tsx
<td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
  {req.new_field || '-'}
</td>
```

**1d — If filterable, add to URL params and filter logic** (see Step 2 below).

---

## Step 2 — Add a Filter to the List View

Filters use URL search params. Pattern from existing `status` and `category` filters:

**2a — Add URL param state:**
```ts
const [newFilter, setNewFilter] = useState(searchParams.get('new_filter') || '');
```

**2b — Include in `fetchRequests`:**
```ts
const params = new URLSearchParams()
if (status) params.append('status', status)
if (newFilter) params.append('new_filter', newFilter)
// ...
const res = await fetch(`${API_BASE}/admin/requests?${params}`)
```

**2c — Add filter `<select>` in the filter row:**
```tsx
<select value={newFilter} onChange={(e) => setNewFilter(e.target.value)}>
  <option value="">ทั้งหมด</option>
  <option value="value1">Label 1</option>
</select>
```

**2d — Update URL on filter change** (use existing `useEffect` that watches filters).

---

## Step 3 — Add a New Tab to the Detail View

**3a — Add tab definition:**
```ts
const tabs = [
  // ...existing tabs
  { id: 'new_tab', label: 'หัวข้อใหม่', icon: SomeIcon },
]
```

**3b — Add tab content:**
```tsx
{activeTab === 'new_tab' && (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Tab content */}
  </div>
)}
```

**3c — If tab needs API data**, add `fetchNewTabData` useCallback + call in the
`useEffect` alongside `fetchDetail` and `fetchComments`.

---

## Step 4 — Add a New Manage Field (Bulk Save)

Fields in the manage tab follow the bulk-save pattern:

**4a — Add to `manageFormData` state initial shape:**
```ts
const [manageFormData, setManageFormData] = useState({
  status: '',
  priority: '',
  due_date: '',
  comment: '',
  new_field: '',  // Add here
})
```

**4b — Initialize in `fetchDetail` callback:**
```ts
setManageFormData(prev => ({
  ...prev,
  status: data.status,
  priority: data.priority,
  due_date: data.due_date ? data.due_date.split('T')[0] : '',
  new_field: data.new_field || '',  // Initialize here
  comment: ''
}))
```

**4c — Add to change detection in `handleSaveManage`:**
```ts
if (manageFormData.new_field !== request.new_field) {
  updates.new_field = manageFormData.new_field || null
}
```

**4d — Add UI input in the manage tab JSX:**
```tsx
<input
  value={manageFormData.new_field}
  onChange={(e) => setManageFormData(prev => ({ ...prev, new_field: e.target.value }))}
/>
```

---

## Step 5 — Add a New Status Value

Status values appear in 3 places that must all be updated:

**5a — List page `ServiceRequest` interface** (lowercase):
```ts
status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'new_status' | null
```

**5b — List page `getStatusStyles()` function** (lowercase):
```ts
case 'new_status': return { label: 'ป้ายกำกับ', variant: 'info' }
```

**5c — Detail page `ServiceRequestDetail` interface** (UPPERCASE):
```ts
status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'NEW_STATUS'
```

**5d — Detail page header status badge** (add UPPERCASE case):
```ts
request.status === 'NEW_STATUS' ? 'ป้ายกำกับ' : '...'
```

**5e — Manage tab status buttons array** (UPPERCASE + Thai label):
```ts
{ value: 'NEW_STATUS', label: 'ป้ายกำกับ', activeClass: '...', dotClass: '...' }
```

**5f — Kanban columns array** (UPPERCASE):
```ts
{ id: 'NEW_STATUS', label: 'ป้ายกำกับ', color: '...', bgColor: '...' }
```

**5g — Backend migration** — add to `RequestStatus` enum in the model + Alembic
`ALTER TYPE` migration (see `skn-migration-helper`).

---

## Common Issues

### Status filter shows no results
**Cause:** Mixing uppercase/lowercase. List page sends lowercase to API (`status=pending`),
but the UI dropdown is pre-filtered with the wrong case.
**Fix:** Ensure `<select>` values in list page match what the backend accepts for the
`status` query param. Check backend `admin_requests.py` for case-sensitivity.

### Manage tab reverts on Save
**Cause:** `fetchDetail()` is called inside `handleUpdateField()`, which reinitializes
`manageFormData` from the server response. This is expected — manage tab always syncs
to the latest backend state after save.
**Fix:** No fix needed; this is by design. Unsaved changes are wiped on Save.

### Comment fails with "User ID Missing"
**Cause:** `fetchCurrentUser()` failed or returned empty array. `currentUserId` is `null`.
**Fix:** Check `/admin/users` endpoint returns users. If database is empty, seed at least
one user. Until real auth is wired in, this is a known GAP-2.

### Kanban shows all requests in one column
**Cause:** Status values from backend don't match column IDs. If backend returns lowercase
(`'pending'`) but columns filter with UPPERCASE (`'PENDING'`), all cards fall through.
**Fix:** Normalize status comparison: `req.status?.toUpperCase() === column.id`.
Or ensure backend returns UPPERCASE consistently.

### AssignModal shows empty agent list
**Cause:** `GET /admin/users?role=AGENT` returns `[]` (no AGENT role users in DB).
**Fix:** Create at least one user with `role='AGENT'` in the database. The modal only
shows users with `role=AGENT`; ADMIN/SUPER_ADMIN users are excluded.

---

## Quality Checklist

Before finishing, verify:
- [ ] Status values match case convention for the target page (lowercase=list, UPPERCASE=detail/kanban)
- [ ] `null` status handled in list page `getStatusStyles()`
- [ ] New manage tab fields added to `manageFormData` initial state AND `fetchDetail` initializer
- [ ] `handleSaveManage` diff-checks new fields against original `request`
- [ ] `due_date` sends `null` (not empty string) when cleared
- [ ] Comments use `?user_id=N` as query param (not in body)
- [ ] Kanban columns array updated if adding new status
- [ ] `AssignModal` `onAssign` callback matches `(agentId: number, agentName: string) => Promise<void>`
- [ ] Quick action buttons in detail header disabled when appropriate

## Additional Resources

For full TypeScript interfaces, API endpoint table, and `AssignModal` props —
see `references/admin_requests_reference.md`.
