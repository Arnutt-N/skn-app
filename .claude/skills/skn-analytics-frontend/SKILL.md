---
name: skn-analytics-frontend
description: >
  Extends, modifies, or debugs the admin analytics and audit frontend in SKN App —
  the live analytics dashboard (KPIs, charts, operator table), audit log viewer,
  and legacy live-chat analytics page. Use when asked to "add KPI card", "add chart",
  "modify analytics dashboard", "add audit filter", "fix operator performance table",
  "add heatmap column", "เพิ่ม KPI card", "แก้ไข dashboard analytics", "เพิ่มฟิลเตอร์
  audit log", "แก้ตาราง operator performance", "หน้า analytics admin".
  Do NOT use for backend analytics endpoints (skn-analytics-audit), or WebSocket
  infrastructure (skn-live-chat-ops).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React, TypeScript, Tailwind CSS v4, Recharts, Lucide icons.
  Admin pages at /admin/analytics, /admin/audit, /admin/live-chat/analytics.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [admin, analytics, audit, dashboard, charts, recharts]
  related-skills:
    - skn-analytics-audit
    - skn-live-chat-ops
    - skn-admin-component
  documentation: ./references/analytics_frontend_reference.md
---

# skn-analytics-frontend

Three pages cover analytics in the admin dashboard: the main Live Analytics Dashboard
(`/admin/analytics`) with real-time KPIs, charts, and operator table; the Audit Log
viewer (`/admin/audit`); and the legacy Live Chat Analytics (`/admin/live-chat/analytics`)
with date-range filtering. The main dashboard is the primary page; the legacy page
pre-dates the Recharts/WebSocket migration.

---

## CRITICAL: Project-Specific Rules

1. **Two separate analytics pages use DIFFERENT API paths** — The main dashboard at
   `/admin/analytics` calls `/admin/analytics/*` endpoints. The legacy page at
   `/admin/live-chat/analytics` calls `/admin/live-chat/analytics*` endpoints. Never
   mix them:
   ```
   /admin/analytics page       → GET /admin/analytics/live-kpis
                                 GET /admin/analytics/operator-performance?days=N
                                 GET /admin/analytics/dashboard?days=N
   /admin/live-chat/analytics  → GET /admin/live-chat/analytics?from_date=&to_date=
                                 GET /admin/live-chat/analytics/operators?from_date=&to_date=
   ```

2. **Main analytics uses auth headers — audit and legacy pages do NOT** — The main
   dashboard reads `{ user, token }` from `useAuth()` and passes `Authorization: Bearer`
   on every fetch. The audit log page and legacy analytics make unauthenticated fetches:
   ```ts
   // Main analytics (authenticated):
   const authHeaders = useMemo<HeadersInit>(
     () => (token ? { Authorization: `Bearer ${token}` } : {} as HeadersInit),
     [token]
   )
   fetch('/api/v1/admin/analytics/live-kpis', { headers: authHeaders })

   // Audit page (unauthenticated):
   fetch(`/api/v1/admin/audit/logs?${params}`)  // No headers
   ```

3. **WebSocket real-time KPI updates — with 30s polling fallback** — The main dashboard
   subscribes to `ANALYTICS_UPDATE` events via `useWebSocket`. If disconnected, it falls
   back to polling every 30s:
   ```ts
   // Subscribe on connect:
   if (connectionState === 'connected') send(MessageType.SUBSCRIBE_ANALYTICS, {})
   // Unsubscribe on unmount:
   return () => { if (connectionState === 'connected') send(MessageType.UNSUBSCRIBE_ANALYTICS, {}) }
   // Fallback poll:
   const shouldPoll = connectionState !== 'connected'
   if (shouldPoll) interval = setInterval(fetchData, 30000)
   ```
   New KPI fields arrive via `onMessage: (msg) => { if (msg.type === MessageType.ANALYTICS_UPDATE) setKpis(msg.payload as KPIData) }`.

4. **Audit pagination is offset-based — reset offset on filter change** — Pagination
   uses `offset` (not page number). Adding a new filter must reset offset to 0:
   ```ts
   const [offset, setOffset] = useState(0)
   const [limit] = useState(50)   // Fixed per-page limit
   // Next page: setOffset(offset + limit)
   // Prev page: setOffset(Math.max(0, offset - limit))
   // Filter change: setOffset(0)   ← REQUIRED or wrong page shows
   ```

5. **Operator filter via row click — resets with button** — Clicking an operator row
   in the operator table sets `selectedOperator` to that `operator_id`. This appends
   `&operator_id=N` to the next fetch. A "Clear Operator Filter" button appears only
   when a filter is active:
   ```tsx
   // Row click:
   onClick={() => setSelectedOperator(op.operator_id)}
   // className when selected:
   selectedOperator === op.operator_id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
   // Clear button (conditional):
   {selectedOperator && <Button onClick={() => setSelectedOperator(null)}>Clear</Button>}
   ```

6. **Heatmap is a 7×24 CSS grid — intensity is value/max** — The peak hours heatmap
   renders as a flat grid with inline `backgroundColor` using RGBA opacity:
   ```ts
   const CHART_BRAND_RGB = '124, 58, 237'
   // Build matrix:
   const matrix = Array.from({ length: 7 }, () => Array(24).fill(0))
   peak_hours.forEach(e => { matrix[e.day_of_week][e.hour] = e.message_count })
   const max = matrix.flat().reduce((acc, v) => v > acc ? v : acc, 0)
   // Per cell:
   const intensity = max ? Math.max(0.08, value / max) : 0
   style={{ backgroundColor: `rgba(${CHART_BRAND_RGB}, ${intensity})` }}
   ```
   Rows = day_of_week (0=Sun), columns = hour (0-23). Do not use Tailwind opacity
   classes — inline style is required for dynamic intensity.

7. **`formatDuration` utility — use for all time displays** — All second-valued metrics
   go through this:
   ```ts
   function formatDuration(seconds: number): string {
     if (seconds < 60) return `${Math.round(seconds)}s`
     return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
   }
   ```
   Always use this (not manual `toFixed` or division) for consistency.

8. **`TrendBadge` component — shows delta% with arrow** — Pass a `TrendMetric` from
   `dashboard.trends.*`. If the metric is undefined (loading), renders fallback text:
   ```ts
   interface TrendMetric { current: number; previous: number; delta: number; delta_percent: number }
   // Usage in card:
   <TrendBadge metric={dashboard?.trends.sessions_today} />
   // Positive delta = green ArrowUpRight, Negative = red ArrowDownRight
   // Colors: positive → "text-success-text", negative → "text-danger-text"
   ```

9. **Chart colors use CSS-token-based hex values — not Tailwind classes** — Recharts
   cannot read Tailwind classes, so colors are defined as CSS strings:
   ```ts
   const CHART_BRAND   = 'hsl(262 83% 58%)'   // brand-600
   const CHART_SUCCESS = 'hsl(142 71% 45%)'   // success
   // Use in <Line stroke={CHART_BRAND}> or <Bar fill={CHART_SUCCESS}>
   ```

10. **`ACTION_COLORS` map drives audit badge styling** — Badge styles are pre-mapped
    by action name. Unknown actions fall back to a gray default:
    ```ts
    const ACTION_COLORS: Record<string, string> = {
      'claim_session': 'bg-info/12 text-info',
      'close_session': 'bg-danger/12 text-danger',
      'send_message':  'bg-success/12 text-success',
      'create':        'bg-indigo-500/12 text-indigo-600',
      'update':        'bg-warning/12 text-warning',
      'delete':        'bg-danger/12 text-danger',
      'login':         'bg-slate-100 text-slate-600',
      'logout':        'bg-slate-100 text-slate-600',
    }
    // Fallback: 'bg-gray-100 text-gray-800'
    ```

---

## File Structure

```
frontend/app/admin/
├── analytics/
│   └── page.tsx          — Main analytics dashboard (454 lines): KPIs, charts, heatmap, operator table
├── audit/
│   └── page.tsx          — Audit log viewer (290 lines): paginated logs + stats
└── live-chat/
    └── analytics/
        └── page.tsx      — Legacy live-chat analytics (216 lines): date range, sessions + operators
```

---

## Step 1 — Add a New KPI Card

All KPI cards are in the responsive grid in `analytics/page.tsx`:

**1a — Add field to `KPIData` interface (if new):**
```ts
interface KPIData {
  // ...existing
  new_metric?: number;
}
```

**1b — Add Card component in the KPI grid:**
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-text-tertiary flex items-center justify-between">
      <span className="flex items-center gap-2">
        <SomeIcon className="w-4 h-4" /> New Metric
      </span>
      <TrendBadge metric={dashboard?.trends.new_metric} />
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{kpis?.new_metric ?? '-'}</div>
    <p className="text-xs text-text-tertiary mt-1">description</p>
  </CardContent>
</Card>
```

**1c — If time-based, use `formatDuration(kpis.new_metric_seconds)`.**

**1d — For trend badge**, add matching field to `DashboardData.trends` interface and
ensure the backend `/admin/analytics/dashboard` response includes it.

---

## Step 2 — Add a Chart Panel

Charts use Recharts inside a `Card` with `ResponsiveContainer`:

```tsx
<Card>
  <CardHeader><CardTitle>Chart Title</CardTitle></CardHeader>
  <CardContent className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dashboard?.new_series || []}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={CHART_BRAND} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

Add the series data to `DashboardData` interface and include it in the `fetchData` response.

---

## Step 3 — Add an Audit Log Filter

Audit filters use immediate-fetch with offset reset. Pattern from existing filters:

**3a — Add filter state:**
```ts
const [filter, setFilter] = useState({ action: '', resource_type: '', admin_id: '' })
```

**3b — Add to API params in `fetchLogs`:**
```ts
if (filter.admin_id) params.append('admin_id', filter.admin_id)
```

**3c — Add Input component (reset offset on change):**
```tsx
<Input
  placeholder="Filter by admin ID..."
  value={filter.admin_id}
  onChange={(e) => {
    setFilter(f => ({ ...f, admin_id: e.target.value }))
    setOffset(0)   // ← Always reset offset when filter changes
  }}
  className="w-48"
/>
```

---

## Step 4 — Add a New Action to `ACTION_COLORS`

When a new audit action type is added to the backend, add its badge color:

```ts
const ACTION_COLORS: Record<string, string> = {
  // ...existing
  'transfer_session': 'bg-warning/12 text-warning',
  'export_data':      'bg-indigo-500/12 text-indigo-600',
}
```

---

## Common Issues

### KPI cards show `-` even after data loads
**Cause:** `KPIData` field is optional (`?`) and the backend returns `null` for the field.
**Fix:** The `?? '-'` pattern handles `null`/`undefined` correctly. If data never loads,
check the `Authorization` header — the main analytics page requires `useAuth()` token.

### Heatmap all cells are dim (uniform low intensity)
**Cause:** `heatmap.max = 0` when `dashboard.peak_hours = []`. The `intensity` formula
returns `0` and all cells have `opacity: 0`.
**Fix:** `Math.max(0.08, value / max)` prevents fully-transparent cells only when `max > 0`.
When `max = 0`, `intensity = 0` is intentional (no data). Not a bug.

### Audit page shows page 2 data after changing filter
**Cause:** `offset` was not reset when the filter changed.
**Fix:** Always call `setOffset(0)` alongside any filter `setState` in the audit page.

### Recharts chart shows no data after adding new series
**Cause:** `dataKey` doesn't match the field name in the data array, or the data array is `[]`.
**Fix:** Verify `dataKey="field_name"` matches the exact property name in `dashboard?.new_series`.

### WebSocket KPIs stop updating after tab is backgrounded
**Behavior:** Browser throttles `setInterval` for backgrounded tabs. WebSocket pushes still arrive.
**Fix:** This is expected browser behavior. No action needed — WS updates bypass the throttle.

---

## Quality Checklist

Before finishing, verify:
- [ ] New KPI cards use `formatDuration()` for seconds-valued fields
- [ ] `TrendBadge` receives a `TrendMetric` from `dashboard.trends.*` (not raw number)
- [ ] Chart colors use `CHART_BRAND` / `CHART_SUCCESS` constants (not inline hex/tailwind)
- [ ] Heatmap intensity uses `Math.max(0.08, value/max)` pattern with inline `style`
- [ ] Audit filter changes reset `offset` to 0
- [ ] New actions added to `ACTION_COLORS` map for badge styling
- [ ] Auth headers (`authHeaders`) passed to all fetches in main analytics page
- [ ] Audit and legacy live-chat analytics pages remain unauthenticated (no token header)
- [ ] Operator filter row click sets `selectedOperator` state (not a separate fetch call)

## Additional Resources

For full TypeScript interfaces, API endpoints table, and data shapes —
see `references/analytics_frontend_reference.md`.
