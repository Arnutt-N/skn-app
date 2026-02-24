# Analytics Frontend — Reference

Sources: `frontend/app/admin/analytics/page.tsx`,
`frontend/app/admin/audit/page.tsx`,
`frontend/app/admin/live-chat/analytics/page.tsx`

---

## File Locations

| File | Purpose |
|---|---|
| `frontend/app/admin/analytics/page.tsx` | Main analytics dashboard (454 lines) — real-time KPIs, charts, heatmap, operator table |
| `frontend/app/admin/audit/page.tsx` | Audit log viewer (290 lines) — paginated logs + action stats |
| `frontend/app/admin/live-chat/analytics/page.tsx` | Legacy live-chat analytics (216 lines) — date-range, sessions + operator workload |

---

## TypeScript Interfaces

### Main Analytics Dashboard

```ts
interface KPIData {
  waiting: number;
  active: number;
  avg_first_response_seconds: number;
  avg_resolution_seconds: number;
  csat_average: number;
  csat_percentage: number;
  fcr_rate: number;
  abandonment_rate?: number;
  sla_breach_events_24h?: number;
  sessions_today: number;
  human_mode_users: number;
  timestamp: string;
}

interface OperatorPerformance {
  operator_id: number;
  operator_name: string;
  total_sessions: number;
  avg_first_response_seconds: number;
  avg_resolution_seconds: number;
  avg_queue_wait_seconds: number;
  availability_seconds: number;
  availability_percent: number;
}

interface TrendMetric {
  current: number;
  previous: number;
  delta: number;
  delta_percent: number;
}

interface DashboardData {
  trends: {
    sessions_today: TrendMetric;
    avg_first_response_seconds: TrendMetric;
    avg_resolution_seconds: TrendMetric;
    csat_percentage: TrendMetric;
    fcr_rate: TrendMetric;
    abandonment_rate: TrendMetric;
  };
  session_volume: { day: string; sessions: number }[];
  peak_hours: { day_of_week: number; hour: number; message_count: number }[];
  funnel: { bot_entries: number; human_handoff: number; resolved: number };
  percentiles: {
    frt: { p50: number; p90: number; p99: number };
    resolution: { p50: number; p90: number; p99: number };
  };
}
```

### Audit Log Page

```ts
interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;    // fallback: 'Admin {admin_id}' if empty
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditStats {
  total_actions: number;
  action_breakdown: Record<string, number>;   // action → count, sorted client-side
  resource_breakdown: Record<string, number>; // type → count, sorted client-side
  period_days: number;
}
```

### Legacy Live-Chat Analytics

```ts
interface AnalyticsSummary {
  total_sessions: number;
  avg_response_time: number;    // seconds
  avg_resolution_time: number;  // seconds → displayed as minutes (/ 60)
  total_messages: number;
}

interface DailyStat {
  date: string;
  total_sessions: number;
}

interface OperatorStat {
  operator_name?: string;       // null falls back to 'System'
  total_sessions: number;
  avg_response_time: number;    // seconds, displayed as-is
  avg_resolution_time: number;  // seconds → displayed as minutes
}
```

---

## API Endpoints

### Main Analytics Dashboard (`/admin/analytics`)

| Method | Path | Params | Auth |
|---|---|---|---|
| `GET` | `/admin/analytics/live-kpis` | — | Bearer token |
| `GET` | `/admin/analytics/operator-performance` | `days=N`, `operator_id=N` (optional) | Bearer token |
| `GET` | `/admin/analytics/dashboard` | `days=N` | Bearer token |

### Audit Log (`/admin/audit`)

| Method | Path | Params | Auth |
|---|---|---|---|
| `GET` | `/admin/audit/logs` | `limit=50`, `offset=N`, `days=N`, `action=X`, `resource_type=Y` | None |
| `GET` | `/admin/audit/stats` | `days=N` | None |

### Legacy Live-Chat Analytics (`/admin/live-chat/analytics`)

| Method | Path | Params | Auth |
|---|---|---|---|
| `GET` | `/admin/live-chat/analytics` | `from_date=YYYY-MM-DD`, `to_date=YYYY-MM-DD` | None |
| `GET` | `/admin/live-chat/analytics/operators` | `from_date=YYYY-MM-DD`, `to_date=YYYY-MM-DD` | None |

---

## Chart Color Constants

```ts
// Main analytics page — used in Recharts:
const CHART_BRAND     = 'hsl(262 83% 58%)'    // --color-brand-600 (purple)
const CHART_SUCCESS   = 'hsl(142 71% 45%)'    // --color-success (green)
const CHART_BRAND_RGB = '124, 58, 237'        // brand-600 for rgba() heatmap cells

// Legacy live-chat analytics page — hardcoded:
// Line stroke: '#6366f1' (indigo-500)
// Bar fill:    '#818cf8' (indigo-400)
```

---

## WebSocket Integration (Main Analytics Only)

```ts
// useWebSocket hook usage:
const { connectionState, send } = useWebSocket({
  url: wsUrl,
  adminId: user?.id || '1',
  token: token || undefined,
  onMessage: (message: WebSocketMessage) => {
    if (message.type === MessageType.ANALYTICS_UPDATE) {
      setKpis(message.payload as KPIData)
    }
  },
})

// Subscribe when connected:
useEffect(() => {
  if (connectionState === 'connected') send(MessageType.SUBSCRIBE_ANALYTICS, {})
  return () => {
    if (connectionState === 'connected') send(MessageType.UNSUBSCRIBE_ANALYTICS, {})
  }
}, [connectionState, send])

// Polling fallback when WS not connected:
const shouldPoll = connectionState !== 'connected'
if (shouldPoll) interval = setInterval(fetchData, 30000)
```

---

## Parallel Data Fetch Pattern

```ts
// Main analytics — 3 parallel requests:
const [kpisRes, opsRes, dashRes] = await Promise.all([
  fetch('/api/v1/admin/analytics/live-kpis', { headers: authHeaders }),
  fetch(`/api/v1/admin/analytics/operator-performance?days=${days}${opQuery}`, { headers: authHeaders }),
  fetch(`/api/v1/admin/analytics/dashboard?days=${days}`, { headers: authHeaders }),
])

// Audit — 2 parallel requests:
const [logsRes, statsRes] = await Promise.all([
  fetch(`/api/v1/admin/audit/logs?${params}`),
  fetch(`/api/v1/admin/audit/stats?days=${days}`)
])

// Legacy live-chat — 2 parallel:
const [analyticsRes, operatorsRes] = await Promise.all([
  fetch(`${API_BASE}/admin/live-chat/analytics${query}`),
  fetch(`${API_BASE}/admin/live-chat/analytics/operators${query}`)
])
```

---

## Audit Pagination

```ts
const [offset, setOffset] = useState(0)
const [limit] = useState(50)         // Fixed, not configurable

// Navigation:
setOffset(offset + limit)            // Next page
setOffset(Math.max(0, offset - limit)) // Prev page

// Disable logic:
disabled={offset === 0}              // Prev disabled at start
disabled={offset + limit >= total}   // Next disabled at end

// Display:
const currentPage = Math.floor(offset / limit) + 1
const totalPages  = Math.ceil(total / limit)

// ⚠️ Always reset offset on filter change:
onChange={(e) => {
  setFilter(...)
  setOffset(0)   // Required — otherwise shows wrong page
}}
```

---

## Heatmap Construction

```ts
// 7 rows (day_of_week: 0=Sun to 6=Sat) × 24 cols (hour: 0-23):
const heatmap = useMemo(() => {
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  ;(dashboard?.peak_hours || []).forEach((entry) => {
    matrix[entry.day_of_week][entry.hour] = entry.message_count
  })
  const max = matrix.flat().reduce((acc, v) => (v > acc ? v : acc), 0)
  return { matrix, max }
}, [dashboard])

// Render (inline style required for dynamic opacity):
style={{ backgroundColor: `rgba(${CHART_BRAND_RGB}, ${intensity})` }}

// Intensity: minimum 0.08 (never fully transparent for cells with data):
const intensity = heatmap.max ? Math.max(0.08, value / heatmap.max) : 0
```

---

## `TrendBadge` Component

```tsx
function TrendBadge({ metric }: { metric?: TrendMetric }) {
  if (!metric) return <span className="text-xs text-text-tertiary">vs yesterday</span>
  const positive = metric.delta >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  const cls = positive ? 'text-success-text' : 'text-danger-text'
  return (
    <span className={`text-xs inline-flex items-center gap-1 ${cls}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(metric.delta_percent).toFixed(1)}%
    </span>
  )
}
```

---

## `ACTION_COLORS` Map (Audit Page)

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
// Usage:
<Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}>
  {log.action}
</Badge>
```

---

## `formatDuration` Utility

```ts
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}
```

---

## Known Gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | Audit page has no auth headers — any user can access `/admin/audit/logs` | Medium | Add `Authorization: Bearer {token}` via `useAuth()` |
| GAP-2 | Legacy live-chat analytics page (`/admin/live-chat/analytics`) is a duplicate of main — both show operator performance | Low | Deprecate or remove legacy page once main dashboard covers all use cases |
| GAP-3 | Main analytics page fetches all 3 endpoints on every `days` or `selectedOperator` change — including live-kpis which is independent of `days` | Low | Split `fetchKpis` from `fetchCharts` — only refetch live-kpis via WebSocket |
| GAP-4 | Heatmap rows have no day-of-week labels (0=Sun is in tooltip only) | Low | Add `['Sun','Mon','Tue','Wed','Thu','Fri','Sat']` row labels on the left |
| GAP-5 | `days` input on audit page has max=90 but backend rejects >90 days silently | Low | Add validation: `Math.min(90, Number(e.target.value))` |
