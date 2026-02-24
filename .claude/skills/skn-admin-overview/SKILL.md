---
name: skn-admin-overview
description: >
  Extends, modifies, or debugs the admin overview and settings pages in SKN App —
  the LINE settings page, admin home dashboard, service request reports, chatbot
  overview, and LINE friends list. Use when asked to "modify LINE settings page",
  "add connect button validation", "fix admin home dashboard", "add report card",
  "fix friends list filter", "modify chatbot overview", "แก้หน้าตั้งค่า LINE",
  "แก้หน้าหลัก admin", "เพิ่มรายงาน", "แก้รายชื่อ friends LINE".
  Do NOT use for backend settings endpoints (skn-settings-config), analytics endpoints
  (skn-analytics-audit), or service request management UI (skn-admin-requests).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React, TypeScript, Tailwind CSS v4, Lucide icons.
  Pages at /admin, /admin/settings/line, /admin/reports, /admin/chatbot, /admin/friends.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [admin, settings, dashboard, reports, friends, overview]
  related-skills:
    - skn-settings-config
    - skn-admin-component
    - skn-analytics-audit
    - skn-admin-requests
  documentation: ./references/admin_overview_reference.md
---

# skn-admin-overview

Five admin pages that don't belong to a single feature domain: the LINE credentials
settings page (`/admin/settings/line`), the admin home service dashboard (`/admin`),
the service request reports page (`/admin/reports`), the chatbot overview page
(`/admin/chatbot`), and the LINE friends list (`/admin/friends`).

---

## CRITICAL: Project-Specific Rules

1. **LINE settings uses a strict Connect → Save gating flow** — Save is disabled until
   Connect succeeds. Typing in the input resets `canSave` back to `false`. The order
   is mandatory:
   ```ts
   // 1. User types credentials → canSave = false
   onChange={(e) => { setSettings({...settings, key: e.target.value}); setCanSave(false) }}

   // 2. Connect (POST /admin/settings/line/validate) → sets canSave=true on success
   if (res.ok) { setValidationResult({success:true, botInfo: data.data}); setCanSave(true) }
   else { setValidationResult({success:false, error: ...}); setCanSave(false) }

   // 3. Save button only enabled when canSave=true:
   <Button disabled={!canSave || processing === 'SAVE'}>Save</Button>
   ```
   Never enable Save without a successful Connect. Users must re-Connect after
   changing either credential field.

2. **Settings API returns an array — map by key to find values** — `GET /admin/settings`
   returns `SettingItem[]` (array), not an object. Always find values by `key`:
   ```ts
   const settingsData = Array.isArray(data) ? data as SettingItem[] : []
   const mapped = {
     LINE_CHANNEL_ACCESS_TOKEN: settingsData.find(s => s.key === 'LINE_CHANNEL_ACCESS_TOKEN')?.value || '',
     LINE_CHANNEL_SECRET:       settingsData.find(s => s.key === 'LINE_CHANNEL_SECRET')?.value || '',
   }
   ```
   Save sends TWO separate POST calls — one per key, NOT a batch update.

3. **LINE settings auto-opens edit mode if credentials are missing** — On load, if
   either credential is empty, `isEditing` is set to `true` automatically:
   ```ts
   if (!mapped.LINE_CHANNEL_ACCESS_TOKEN || !mapped.LINE_CHANNEL_SECRET) {
     setIsEditing(true)
   }
   ```
   Do not change this behavior — it helps new users immediately start configuring.

4. **LINE settings has 3 separate modals** — Understand which modal is for what:
   ```ts
   showStatusModal      // Connect result (success with botInfo, or error message)
   showSaveSuccessModal // After successful Save
   showUnsavedModal     // Guard: user tries to navigate away while isEditing
   ```
   The unsaved-changes guard uses `handleNavigationAttempt(href)` instead of
   `router.push(href)` — always use this function for internal navigation while editing.

5. **`processing` state tracks which operation is running** — Use string values, not
   boolean, to allow different loading states for Connect vs Save:
   ```ts
   const [processing, setProcessing] = useState<string | null>(null)
   // Values: 'CONNECT' | 'SAVE' | null
   // Check: processing === 'CONNECT', processing === 'SAVE'
   // Never use a boolean — both buttons must be independently disabled/loading
   ```

6. **Admin home and chatbot overview are SERVER components** — These pages use
   `export default async function` and `export const dynamic = 'force-dynamic'`.
   They fetch data at request time on the server, not in `useEffect`:
   ```ts
   // admin/page.tsx and admin/chatbot/page.tsx:
   export const dynamic = 'force-dynamic'
   export default async function ServiceDashboard() {
     const data = await getRequestData()  // Server-side fetch
     return <div>{/* JSX with data */}</div>
   }
   ```
   Do NOT add `'use client'` to these pages. If interactivity is needed, extract
   it to a child client component (like `ChartsWrapper`).

7. **Admin home uses `Promise.allSettled` — partial failure is OK** — The dashboard
   shows partial data if one fetch fails; the error banner only appears if BOTH fail:
   ```ts
   const [statsResult, monthlyResult] = await Promise.allSettled([...])
   const bothFailed = statsResult.status === 'rejected' && monthlyResult.status === 'rejected'
   const error = bothFailed ? 'Failed to load...' : null
   ```
   Also uses `fetchWithTimeout(url, 15000)` with `AbortController` for a 15s timeout.
   Do NOT switch to `Promise.all` — it would make the dashboard fail if either
   request times out.

8. **Friends list uses server-side status filter + client-side text search** — Two
   separate filtering mechanisms that must not be confused:
   ```ts
   // Server-side (sent to API):
   GET /admin/friends?status=ACTIVE   // statusFilter state → API query param
   // Client-side (in memory):
   friends.filter(f =>
     f.display_name?.toLowerCase().includes(filter) ||
     f.line_user_id.toLowerCase().includes(filter)
   )
   ```
   When `statusFilter` changes, a new API fetch fires (via `useCallback` deps).
   The text search operates on the already-fetched `friends` array in state.

9. **Friends API response is wrapped — not a direct array** — The response has the
   shape `{ friends: Friend[] }`, not a direct array:
   ```ts
   const data = await res.json()
   setFriends(data.friends)  // NOT setFriends(data)
   ```

10. **Reports workload progress bar uses a hardcoded max of 10** — The bar width
    formula is `(count / 10) * 100%`. When adding new workload metrics, be aware
    this cap means bars cap at 10 tasks:
    ```ts
    style={{ width: `${(item.pending_count / 10) * 100}%` }}
    ```
    The "Excellent Team Work" score card in reports is also fully static/hardcoded.

---

## File Structure

```
frontend/app/admin/
├── page.tsx                  — Admin home dashboard (149 lines): server component, service request stats
├── settings/
│   └── line/
│       └── page.tsx          — LINE settings (341 lines): Connect→Save gating, 3 modals
├── reports/
│   └── page.tsx              — Reports (180 lines): workload + performance cards
├── chatbot/
│   └── page.tsx              — Chatbot overview (169 lines): server component, reply objects + intents
└── friends/
    └── page.tsx              — LINE Friends (155 lines): server status filter + client search
```

---

## Step 1 — Add a New LINE Credential Field

Pattern from existing `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET`:

**1a — Add to settings state:**
```ts
const [settings, setSettings] = useState({
  LINE_CHANNEL_ACCESS_TOKEN: '',
  LINE_CHANNEL_SECRET: '',
  LINE_LOGIN_CHANNEL_ID: '',  // New
})
```

**1b — Add to `fetchSettings` mapped object:**
```ts
const mapped = {
  // ...existing
  LINE_LOGIN_CHANNEL_ID: settingsData.find(s => s.key === 'LINE_LOGIN_CHANNEL_ID')?.value || '',
}
```

**1c — Add input field** (use `type="text"` for non-secret fields, `type="password"` for secrets).

**1d — Add to `handleSave` sequential POSTs:**
```ts
await fetch(`${API_BASE}/admin/settings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'LINE_LOGIN_CHANNEL_ID', value: settings.LINE_LOGIN_CHANNEL_ID, description: 'LINE Login Channel ID' })
})
```

**1e — Ensure onChange resets `canSave = false`** for the new field.

---

## Step 2 — Add a Stats Card to Admin Home or Chatbot Overview

Both pages use the `StatsCard` server component. Reference existing cards:

```tsx
<StatsCard
  title="New Metric"
  value={requestStats?.new_field || 0}
  icon={<SomeIcon className="w-6 h-6" />}
  color="primary"          // 'primary' | 'warning' | 'info' | 'success' | 'purple'
  link="/admin/some-page"  // Optional — makes card clickable
  description="Additional context"  // Optional subtitle
/>
```

Add the new field to the `getRequestData()` function and its API response mapping.

---

## Step 3 — Add a Column to the Friends Table

**3a — Add to `tableColumns` array:**
```ts
const tableColumns: AdminTableHeadColumn[] = [
  // ...existing columns
  { key: 'new_col', label: 'New Column', className: 'px-6 py-4' },
]
```

**3b — Add field to `Friend` interface:**
```ts
interface Friend {
  // ...existing
  new_field?: string;
}
```

**3c — Add `<td>` in the `filteredFriends.map()` row.**

**3d — If the column needs server-side filtering**, add a new filter state and
pass it as a query param to `GET /admin/friends`.

---

## Common Issues

### LINE settings Save button never enables
**Cause:** `canSave` is `false`. It only becomes `true` after a successful Connect.
**Fix:** Click "Connect" first. If Connect fails, check that `LINE_CHANNEL_ACCESS_TOKEN`
is a valid long-lived token (not expired). Connect validates the token via LINE API.

### Admin home shows Connection Error
**Cause:** Both `/admin/requests/stats` and `/admin/requests/stats/monthly` failed.
**Fix:** Ensure the backend is running. If only one endpoint fails, the dashboard
shows partial data without the error banner (by design via `Promise.allSettled`).
Check that the 15s timeout in `fetchWithTimeout` isn't too short.

### Friends page shows empty list despite data in DB
**Cause 1:** `data.friends` is empty because `statusFilter` excludes all records.
**Fix:** Clear the status filter (set to `''` or `null`).
**Cause 2:** `setFriends(data)` used instead of `setFriends(data.friends)`.
**Fix:** Always unwrap: `setFriends(data.friends)`.

### LINE settings navigates away without warning
**Cause:** Using `router.push(href)` directly instead of `handleNavigationAttempt(href)`.
**Fix:** Always use `handleNavigationAttempt('/some-path')` for navigation links
while editing. The Back button already does this correctly.

### Chatbot overview shows stale data after adding new items
**Cause:** `export const dynamic = 'force-dynamic'` should force fresh data on each
request, but Next.js might cache at CDN level.
**Fix:** Verify `cache: 'no-store'` is set in the fetch calls inside `getChatbotData()`.

---

## Quality Checklist

Before finishing, verify:
- [ ] LINE settings Save button is disabled until `canSave = true` (post-Connect success)
- [ ] Any new credential field resets `canSave = false` in its `onChange` handler
- [ ] Settings mapped from array using `.find(s => s.key === 'KEY')?.value`
- [ ] Save sends individual POST per key (not batch)
- [ ] Admin home and chatbot pages remain server components (`async function`, no `'use client'`)
- [ ] Admin home uses `Promise.allSettled` — not `Promise.all`
- [ ] Friends API response unwrapped: `data.friends` not `data`
- [ ] Friends text search is client-side; status filter is server-side (separate concerns)
- [ ] Navigation within LINE settings uses `handleNavigationAttempt()` not `router.push()`

## Additional Resources

For full TypeScript interfaces, API endpoint details, and component references —
see `references/admin_overview_reference.md`.
