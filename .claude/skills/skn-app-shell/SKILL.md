---
name: skn-app-shell
description: >
  Extends or modifies the SKN App frontend application shell — the admin layout
  (sidebar, navbar, menu groups, live-chat special case), AuthContext (DEV_MODE,
  login/logout/refresh, localStorage), and the WebSocket client infrastructure
  (WebSocketClient class, MessageType enum, ConnectionState, useWebSocket hook).
  Use when asked to "add a menu item to admin sidebar", "add a new admin page to nav",
  "modify admin layout", "fix auth context", "add login", "add route to nav",
  "modify websocket client", "add new message type", "fix reconnect logic",
  "use useWebSocket", "เพิ่มเมนู sidebar admin", "แก้ layout admin", "เพิ่ม menu admin",
  "แก้ websocket client", "เพิ่ม MessageType".
  Do NOT use for page-specific implementations (use the page-specific skill instead),
  live-chat page UI (skn-live-chat-frontend), or WebSocket event handlers on the
  backend (skn-live-chat-ops).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide icons.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [admin, layout, auth, websocket, sidebar, navigation, shell]
  related-skills:
    - skn-ui-library
    - skn-admin-component
    - skn-auth-security
    - skn-live-chat-frontend
    - skn-live-chat-ops
  documentation: ./references/app_shell_reference.md
---

# skn-app-shell

The application shell covers three layers:

1. **Admin Layout** (`frontend/app/admin/layout.tsx`) — The responsive sidebar + navbar
   wrapper for all `/admin/*` pages. Contains the nav menu groups, auth gate, live-chat
   special case, mobile overlay, and SessionTimeoutWarning.

2. **AuthContext** (`frontend/contexts/AuthContext.tsx`) — JWT token management with
   DEV_MODE auto-login. Provides `useAuth()` hook for all admin components.

3. **WebSocket Client Infrastructure** (`frontend/lib/websocket/`) — A `WebSocketClient`
   class with auth handshake, heartbeat, message queue, and exponential backoff. Wrapped
   by the `useWebSocket` hook in `frontend/hooks/useWebSocket.ts`.

---

## CRITICAL: Project-Specific Rules

1. **Live Chat bypasses the sidebar layout entirely** — When `pathname.includes('/admin/live-chat')`,
   the layout renders children directly inside `<AuthProvider>` + `<AdminAuthGate>` only,
   with no sidebar, no navbar, and no SessionTimeoutWarning. This is intentional (full-screen
   live chat). Never add sidebar elements to the live-chat path:
   ```tsx
   if (isLiveChat) {
     return (
       <AuthProvider>
         <AdminAuthGate>{children}</AdminAuthGate>
       </AuthProvider>
     )
   }
   ```

2. **Sidebar auto-collapses at <1024px — no localStorage persistence** — The collapse
   state is managed by a `resize` event listener that resets it based on window width.
   It is NOT persisted to localStorage. Adding persistence requires a separate
   `useEffect` to save/restore from localStorage:
   ```ts
   // Current behavior:
   if (window.innerWidth < 1024) setIsSidebarCollapsed(true)
   else setIsSidebarCollapsed(false)
   // Note: this overwrites user preference on every resize
   ```

3. **Active menu item = longest `href` that starts with `pathname`** — Active state is
   resolved by finding all matching items and picking the one with the longest `href`.
   This means `/admin/requests/123` correctly highlights `Manage Requests` (`/admin/requests`)
   and not `Dashboard` (`/admin`). When adding new menu items, ensure `href` is specific
   enough not to shadow existing routes:
   ```ts
   const activeItem = allItems
     .filter(item => pathname === item.href || pathname.startsWith(item.href + '/'))
     .sort((a, b) => b.href.length - a.href.length)[0]
   ```

4. **Navigation structure is 3 hardcoded `menuGroups` — not dynamic** — The sidebar uses
   a static `menuGroups` array with 3 groups (Service Requests, Chatbot Management,
   System Management). To add a new page, add its entry to the correct group:
   ```ts
   const menuGroups = [
     {
       title: 'Service Requests',
       items: [
         { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
         { name: 'Manage Requests', href: '/admin/requests', icon: FileText },
       ]
     },
     { title: 'Chatbot Management', items: [...] },
     { title: 'System Management', items: [...] },
   ]
   ```
   The `MenuItem` type: `{ name, href, icon (ComponentType), external?, openInNewTab? }`.
   `openInNewTab: true` renders the link with `target="_blank"` (used for Live Chat).

5. **AuthContext has TWO modes — DEV_MODE and production** — `DEV_MODE` is controlled by
   `process.env.NEXT_PUBLIC_DEV_MODE === 'true'`. In DEV mode, it auto-sets a mock admin
   (id='1') and mock JWT; it never calls the login API. In production mode, tokens are
   stored/restored from localStorage. Never bypass this by hardcoding tokens:
   ```ts
   const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
   // DEV_MODE=true:  auto-login as MOCK_ADMIN, skip API call
   // DEV_MODE=false: POST /api/v1/auth/login → store in localStorage
   ```

6. **AuthContext `isAuthenticated = !!user && !!token` — both must be truthy** — If only
   the token is set (but `user` is null), `isAuthenticated` is `false`. This matters when
   restoring state from localStorage on mount: both `auth_token` and `auth_user` must
   be present and the token must not be expired. The `AdminAuthGate` redirects to `/login`
   if `!isAuthenticated && !isLoading`.

7. **Three localStorage keys for auth — all must be cleared on logout** — The auth system
   uses exactly 3 keys. Always clear all three on logout:
   ```ts
   localStorage.getItem('auth_token')          // JWT access token
   localStorage.getItem('auth_refresh_token')  // JWT refresh token
   localStorage.getItem('auth_user')           // JSON-serialized User object
   // logout() removes all 3 + redirects window.location.href = '/login'
   ```

8. **WebSocket connection requires AUTH_SUCCESS — not just `onopen`** — The connection
   lifecycle is: `onopen` → send AUTH → wait for `AUTH_SUCCESS` → setState('connected').
   The `onConnect` callback fires only after AUTH_SUCCESS, NOT after `onopen`. Messages
   queued while authenticating are replayed via `processQueue()`:
   ```
   State machine:
   disconnected → connecting → authenticating → connected
                                              ↘ disconnected (AUTH_ERROR)
   connected → disconnected → reconnecting → connecting → ...
   ```

9. **`send()` queues messages when not connected — do NOT check `isConnected` before sending**
   — The `WebSocketClient.send()` method automatically queues messages when not connected
   and replays them after reconnect. Callers should just call `send()` directly; manual
   `isConnected` checks before sending are redundant:
   ```ts
   // Correct — just send, client handles queueing:
   send(MessageType.JOIN_ROOM, { line_user_id: 'U...' })
   // Redundant and fragile:
   if (isConnected) send(MessageType.JOIN_ROOM, { line_user_id: 'U...' })
   ```

10. **`useWebSocket` recreates the client when dependencies change — stabilize callbacks**
    — The hook's `useEffect` depends on `[url, adminId, token, onMessage, onConnect,
    onDisconnect, onError]`. Unstable function references (inline arrow functions) will
    cause the client to disconnect and reconnect on every render. Always wrap callbacks
    in `useCallback` or `useMemo`:
    ```ts
    // Wrong — causes reconnect storm:
    useWebSocket({
      url: wsUrl,
      onMessage: (msg) => { setKpis(msg.payload as KPIData) }  // new ref every render
    })
    // Correct:
    const handleMessage = useCallback((msg: WebSocketMessage) => {
      if (msg.type === MessageType.ANALYTICS_UPDATE) setKpis(msg.payload as KPIData)
    }, [])
    useWebSocket({ url: wsUrl, onMessage: handleMessage })
    ```

11. **Exponential backoff: base=1000ms, max=30000ms, maxAttempts=10, +jitter** — The
    reconnect strategy adds 0-1000ms random jitter to each delay to prevent thundering
    herd. After 10 failed attempts, reconnecting stops and the state stays 'disconnected'.
    Manual reconnect is still possible via the `reconnect()` method:
    ```ts
    // Delay formula: min(1000 * 2^attempt, 30000) + random(0, 1000)
    // attempt 1: ~2000ms, attempt 2: ~4000ms, ... attempt 10: ~31000ms
    ```

12. **Heartbeat: PING every 25 seconds, PONG silently consumed** — The heartbeat only
    runs when `state === 'connected'` and `ws.readyState === WebSocket.OPEN`. PONG
    messages are consumed inside `handleMessage()` and never dispatched to `onMessage`.
    No explicit timeout — if the server doesn't respond, the OS TCP keepalive handles it.

---

## File Structure

```
frontend/
├── app/admin/
│   └── layout.tsx              — Admin shell: sidebar, navbar, auth gate, session timeout
├── contexts/
│   └── AuthContext.tsx          — JWT auth: DEV_MODE, login/logout/refresh, useAuth() hook
├── lib/
│   ├── utils.ts                 — cn() utility: clsx + tailwind-merge
│   └── websocket/
│       ├── types.ts             — MessageType enum, interfaces: WebSocketMessage, ConnectionState, UseWebSocketOptions
│       ├── client.ts            — WebSocketClient class: auth, heartbeat, queue, reconnect
│       ├── messageQueue.ts      — MessageQueue: FIFO with 100-item cap, 3 retries
│       └── reconnectStrategy.ts — ExponentialBackoffStrategy: base=1s, max=30s, jitter
└── hooks/
    └── useWebSocket.ts          — React wrapper for WebSocketClient
```

---

## Step 1 — Add a Menu Item to the Admin Sidebar

To add a new page `My Feature` at `/admin/my-feature`:

**1a — Choose an icon from Lucide:**
```ts
import { Sparkles } from 'lucide-react'
```

**1b — Add entry to the correct `menuGroups` section in `layout.tsx`:**
```ts
{
  title: 'System Management',
  items: [
    // ...existing items
    { name: 'My Feature', href: '/admin/my-feature', icon: Sparkles },
  ]
}
```

**1c — Verify the `href` is specific enough** — ensure `/admin/my-feature` won't be
matched by a shorter existing path.

---

## Step 2 — Use the Auth Context in a Page

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext'

export default function MyPage() {
  const { user, token, isAuthenticated, logout } = useAuth()

  // Build Authorization header for API calls:
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // ...
}
```

**In server components:** Auth is not available (no hooks). Use the layout's
`AdminAuthGate` — it guarantees all child pages are authenticated.

---

## Step 3 — Use `useWebSocket` for Real-Time Data

```tsx
'use client';

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { MessageType, type WebSocketMessage } from '@/lib/websocket/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function RealtimePage() {
  const { user, token } = useAuth()
  const wsUrl = API_BASE.replace('http', 'ws').replace('/api/v1', '/api/v1/ws/live-chat')

  // Stable callback reference — prevents reconnect storms
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === MessageType.NEW_MESSAGE) {
      // handle message
    }
  }, [])

  const { connectionState, send } = useWebSocket({
    url: wsUrl,
    adminId: user?.id || '1',
    token: token || undefined,
    onMessage: handleMessage,
  })

  // Send when connected (queued automatically if not):
  const joinRoom = () => send(MessageType.JOIN_ROOM, { line_user_id: 'Uabc' })

  return <div>Status: {connectionState}</div>
}
```

---

## Step 4 — Add a New MessageType

When adding a new WebSocket event type (after updating the backend):

**4a — Add to `MessageType` enum in `frontend/lib/websocket/types.ts`:**
```ts
export enum MessageType {
  // ...existing
  MY_EVENT = 'my_event',        // Client → Server
  MY_RESPONSE = 'my_response',  // Server → Client
}
```

**4b — Add a payload interface (optional but recommended):**
```ts
export interface MyEventPayload {
  some_field: string;
}
```

**4c — Handle in `onMessage` callback of the consuming page.**

---

## Common Issues

### Admin layout shows blank page after navigating to a new route
**Cause:** The new route's page component is a server component but tries to use `useAuth()`.
**Fix:** Only use `useAuth()` in client components (`'use client'`). Server components
are always authenticated (guaranteed by `AdminAuthGate` in the layout).

### WebSocket reconnects on every render
**Cause:** An `onMessage` or other callback prop is an inline arrow function, creating
a new reference every render. This causes `useWebSocket`'s `useEffect` to re-run.
**Fix:** Wrap all callbacks in `useCallback(fn, [stable deps])`.

### Auth state not persisted after page refresh in production
**Cause:** Either `auth_token` or `auth_user` is missing from localStorage, or the
token is expired (`isTokenExpired()` returns true).
**Fix:** In production, check `NEXT_PUBLIC_DEV_MODE` is not set to `'true'`. Also
check that `localStorage.setItem('auth_user', JSON.stringify(data.user))` is called
during login (not just `auth_token`).

### New sidebar menu item highlights wrong active item
**Cause:** The new item's `href` is a prefix of another item (e.g. `/admin/settings`
overlaps `/admin/settings/line`).
**Fix:** The active algorithm picks the **longest** matching `href`, so the more specific
href wins. Verify the new item's href isn't identical to or shorter than an existing one.

### Live Chat page renders with sidebar
**Cause:** `pathname.includes('/admin/live-chat')` check failed — likely a new sub-path
that doesn't include `live-chat`.
**Fix:** Keep live chat routes under `/admin/live-chat/*`. If a new full-screen page is
needed outside that path, add an additional `||` check to the `isLiveChat` condition.

---

## Quality Checklist

Before finishing, verify:
- [ ] New menu items added to `menuGroups` array (not elsewhere)
- [ ] Menu item icon is a Lucide `ComponentType` (not a JSX element)
- [ ] Live Chat routes remain under `/admin/live-chat/*`
- [ ] `useAuth()` only called from client components
- [ ] `isAuthenticated` check uses both `user` and `token` (no shortcutting)
- [ ] `logout()` clears all 3 localStorage keys (`auth_token`, `auth_refresh_token`, `auth_user`)
- [ ] `useWebSocket` callbacks (onMessage, onConnect) wrapped in `useCallback`
- [ ] New `MessageType` values added to the enum in `types.ts` (both client and server sides)
- [ ] `send()` called directly (no manual `isConnected` guard before sending)

## Additional Resources

For full interface definitions, MessageType enum, auth flow, and connection state machine —
see `references/app_shell_reference.md`.
