# App Shell — Reference

Sources:
- `frontend/app/admin/layout.tsx`
- `frontend/contexts/AuthContext.tsx`
- `frontend/lib/utils.ts`
- `frontend/lib/websocket/types.ts`
- `frontend/lib/websocket/client.ts`
- `frontend/lib/websocket/messageQueue.ts`
- `frontend/lib/websocket/reconnectStrategy.ts`
- `frontend/hooks/useWebSocket.ts`

---

## Admin Layout

### MenuItem Interface

```ts
interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  openInNewTab?: boolean;   // Adds target="_blank" to SidebarItem
}
```

### menuGroups Structure (current)

```ts
const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Service Requests',
    items: [
      { name: 'Dashboard',        href: '/admin',           icon: LayoutDashboard },
      { name: 'Manage Requests',  href: '/admin/requests',  icon: FileText },
    ]
  },
  {
    title: 'Chatbot Management',
    items: [
      { name: 'Chatbot Overview', href: '/admin/chatbot',       icon: Bot },
      { name: 'Live Chat',        href: '/admin/live-chat',     icon: MessageCircle, openInNewTab: true },
      { name: 'Auto-Replies',     href: '/admin/auto-replies',  icon: Reply },
      { name: 'Reply Objects',    href: '/admin/reply-objects', icon: MessageSquareReply },
      { name: 'Rich Menus',       href: '/admin/rich-menus',    icon: PanelTop },
      { name: 'Chat Histories',   href: '/admin/chat-histories',icon: History },
      { name: 'Friend Histories', href: '/admin/friend-histories', icon: Users },
      { name: 'Broadcast',        href: '/admin/broadcast',     icon: Megaphone },
    ]
  },
  {
    title: 'System Management',
    items: [
      { name: 'File Management',  href: '/admin/file-management', icon: FolderOpen },
      { name: 'User Management',  href: '/admin/users',           icon: UserCog },
      { name: 'Reports',          href: '/admin/reports',         icon: BarChart3 },
      { name: 'Settings',         href: '/admin/settings',        icon: Settings },
      { name: 'Design System',    href: '/admin/design-system',   icon: Palette },
    ]
  }
]
```

### Layout Behavior

| Behavior | Detail |
|---|---|
| Sidebar width expanded | `w-64` (256px) |
| Sidebar width collapsed | `w-20` (80px) |
| Sidebar background | `bg-[#0f172a]` + gradient `from-slate-900 via-[#1e1b4b] to-[#172554]` |
| Sidebar logo area height | `h-20` (80px) |
| Navbar height | `h-20` (80px) |
| Navbar classes | `glass-navbar` (defined in globals.css) |
| Auto-collapse threshold | `window.innerWidth < 1024` |
| Main content margin | `lg:ml-64` expanded / `lg:ml-20` collapsed |
| Mobile sidebar | Hidden by default, shown with `isMobileMenuOpen` |
| Mobile close | Overlay click closes (`-translate-x-full lg:translate-x-0`) |
| Live chat path | Renders without layout shell (full screen) |
| Page animations | `animate-fade-in-up` on main content div |

### Active Item Algorithm

```ts
const allItems = menuGroups.flatMap(g => g.items)
const activeItem = allItems
  .filter(item =>
    !item.external &&
    (pathname === item.href || pathname.startsWith(item.href + '/'))
  )
  .sort((a, b) => b.href.length - a.href.length)[0]

// Per-item check:
const isActive = activeItem ? item.href === activeItem.href : pathname === item.href
```

---

## AuthContext

### Interfaces

```ts
interface User {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER';
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;   // !!user && !!token
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### DEV_MODE Behavior

```ts
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// DEV_MODE=true:
// - Skips localStorage restore
// - Auto-sets user={id:'1', username:'admin', role:'ADMIN'}
// - Sets token=MOCK_TOKEN (static base64-encoded JWT with exp=9999999999)
// - Writes to localStorage for hooks that read it directly
// - login() is available but in practice never called

// DEV_MODE=false (production):
// - Reads localStorage 'auth_token' and 'auth_user' on mount
// - Calls isTokenExpired() — redirects to /login if expired
// - login() calls POST /api/v1/auth/login
```

### localStorage Keys

| Key | Value | Set By |
|---|---|---|
| `auth_token` | JWT access token string | `login()`, `refreshToken()`, DEV_MODE init |
| `auth_refresh_token` | JWT refresh token string | `login()`, `refreshToken()` (if returned) |
| `auth_user` | `JSON.stringify(User)` | `login()`, DEV_MODE init |

### API Calls

```ts
// Login:
POST /api/v1/auth/login
Body: { username: string, password: string }
Response: { access_token: string, refresh_token?: string, user: User }

// Refresh:
POST /api/v1/auth/refresh
Headers: { Authorization: 'Bearer {refresh_token}' }
Response: { access_token: string, refresh_token?: string }
```

### Token Expiry Check

```ts
function isTokenExpired(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return true
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  if (!payload.exp) return false
  return Date.now() >= payload.exp * 1000
}
// Expired = redirect to /login on init
```

### AdminAuthGate (in layout.tsx)

```tsx
function AdminAuthGate({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return <LoadingSpinner />  // Spinning brand-500 circle
  }

  return <>{children}</>
}
```

---

## WebSocket Types (`lib/websocket/types.ts`)

### MessageType Enum (complete)

```ts
export enum MessageType {
  // Client → Server
  AUTH                   = 'auth',
  JOIN_ROOM              = 'join_room',
  LEAVE_ROOM             = 'leave_room',
  SEND_MESSAGE           = 'send_message',
  TYPING_START           = 'typing_start',
  TYPING_STOP            = 'typing_stop',
  CLAIM_SESSION          = 'claim_session',
  CLOSE_SESSION          = 'close_session',
  TRANSFER_SESSION       = 'transfer_session',
  SUBSCRIBE_ANALYTICS    = 'subscribe_analytics',
  UNSUBSCRIBE_ANALYTICS  = 'unsubscribe_analytics',
  PING                   = 'ping',

  // Server → Client
  AUTH_SUCCESS           = 'auth_success',
  AUTH_ERROR             = 'auth_error',
  NEW_MESSAGE            = 'new_message',
  MESSAGE_SENT           = 'message_sent',
  MESSAGE_ACK            = 'message_ack',
  MESSAGE_FAILED         = 'message_failed',
  TYPING_INDICATOR       = 'typing_indicator',
  SESSION_CLAIMED        = 'session_claimed',
  SESSION_CLOSED         = 'session_closed',
  SESSION_TRANSFERRED    = 'session_transferred',
  PRESENCE_UPDATE        = 'presence_update',
  CONVERSATION_UPDATE    = 'conversation_update',
  OPERATOR_JOINED        = 'operator_joined',
  OPERATOR_LEFT          = 'operator_left',
  ANALYTICS_UPDATE       = 'analytics_update',
  ERROR                  = 'error',
  PONG                   = 'pong',
}
```

### ConnectionState

```ts
export type ConnectionState =
  | 'disconnected'   // Initial state, or after explicit disconnect
  | 'connecting'     // WebSocket connecting
  | 'authenticating' // After onopen, waiting for AUTH_SUCCESS
  | 'connected'      // AUTH_SUCCESS received — ready for send()
  | 'reconnecting'   // Waiting for backoff delay before retry
```

### WebSocketMessage

```ts
export interface WebSocketMessage {
  type: MessageType | string;
  payload: unknown;
  timestamp: string;  // ISO datetime string
}
```

### UseWebSocketOptions

```ts
export interface UseWebSocketOptions {
  url: string;
  adminId?: string;             // default: '1'
  token?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}
```

### Payload Interfaces

```ts
// Server sends these payloads in WebSocketMessage.payload:

interface ConversationUpdatePayload {
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  chat_mode: 'BOT' | 'HUMAN';
  unread_count?: number;
  tags?: Array<{ id: number; name: string; color: string }>;
  session?: Session;
  messages?: Message[];
  last_message?: { content: string; created_at: string };
}

interface TypingIndicatorPayload {
  line_user_id: string;
  admin_id: string;
  is_typing: boolean;
}

interface SessionPayload {
  line_user_id: string;
  session_id: number;
  status: string;
  operator_id?: number;
}

interface PresencePayload {
  operators: Array<{ id: string; status: string; active_chats: number }>;
}

interface MessageAckPayload {
  temp_id: string;
  message_id: number;
  timestamp: string;
}

interface MessageFailedPayload {
  temp_id: string;
  error: string;
  retryable: boolean;
}

interface SessionTransferredPayload {
  line_user_id: string;
  session_id: number;
  from_operator_id: number;
  to_operator_id: number;
  reason?: string;
}

interface ErrorPayload {
  message: string;
  code?: string;
}
```

---

## WebSocketClient (`lib/websocket/client.ts`)

### Constructor Options

```ts
new WebSocketClient({
  url: string,
  adminId?: string,          // default: '1'
  token?: string,
  onStateChange?: (state: ConnectionState) => void,
  onMessage?: (message: WebSocketMessage) => void,
  onConnect?: () => void,    // fires on AUTH_SUCCESS, not onopen
  onDisconnect?: () => void,
  onError?: (error: Error) => void,
  heartbeatInterval?: number,      // ms, default: 25000
  maxReconnectAttempts?: number,   // default: 10
})
```

### Connection Lifecycle

```
ws.onopen → sendRaw(AUTH, {admin_id, token})
         ↓
message.type === AUTH_SUCCESS:
  → setState('connected')
  → reconnectAttempt = 0
  → reconnectStrategy.reset()
  → startHeartbeat()     // PING every 25s
  → processQueue()       // flush queued messages
  → onConnect()

message.type === AUTH_ERROR:
  → setState('disconnected')
  → onError('Authentication failed')
  → ws.close()

ws.onclose:
  → stopHeartbeat()
  → setState('disconnected')
  → onDisconnect() (if was connected)
  → attemptReconnect()
```

### Public API

```ts
client.connect()         // Start connection (no-op if already connecting/connected)
client.disconnect()      // Stop connection + clear timers
client.reconnect()       // disconnect() then connect()
client.send(type, payload): boolean  // true if sent, false if queued
client.getState(): ConnectionState
client.isConnected(): boolean
client.getReconnectAttempt(): number
client.getQueueLength(): number
```

---

## ExponentialBackoffStrategy (`lib/websocket/reconnectStrategy.ts`)

```ts
new ExponentialBackoffStrategy(
  baseDelay = 1000,    // ms
  maxDelay = 30000,    // ms cap
  maxAttempts = 10,    // after this, shouldRetry() returns false
  jitter = true        // adds Math.random() * 1000 ms
)

// Delay formula:
const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
const delay = jitter ? exponentialDelay + Math.random() * 1000 : exponentialDelay

// Example delays (with jitter):
// attempt 1: ~2000-3000ms
// attempt 2: ~4000-5000ms
// attempt 5: ~32000ms (capped at 31000ms)
// attempt 10: ~31000ms (capped)
```

---

## MessageQueue (`lib/websocket/messageQueue.ts`)

```ts
// Limits:
const maxSize = 100    // overflow drops oldest
const maxRetries = 3   // requeue() returns false after 3 tries

// API:
queue.enqueue(type, payload): string   // Returns message ID
queue.dequeue(): QueuedMessage | undefined
queue.requeue(message): boolean        // Returns false if retries exhausted
queue.remove(id): boolean
queue.clear(): void
queue.length: number
queue.isEmpty(): boolean
queue.getPending(): QueuedMessage[]
```

---

## useWebSocket Hook (`hooks/useWebSocket.ts`)

```ts
import { useWebSocket } from '@/hooks/useWebSocket'
import { MessageType, type UseWebSocketReturn } from '@/lib/websocket/types'

const {
  send,              // (type, payload) => void — queues if not connected
  connectionState,   // ConnectionState
  isConnected,       // connectionState === 'connected'
  isReconnecting,    // connectionState === 'reconnecting'
  reconnectAttempts, // number — resets to 0 after successful connect
  reconnect,         // () => void — manual reconnect
  disconnect,        // () => void — manual disconnect
} = useWebSocket(options: UseWebSocketOptions)
```

**Important:** The hook creates a new `WebSocketClient` instance when any of these
change: `url`, `adminId`, `token`, `onMessage`, `onConnect`, `onDisconnect`, `onError`.
Always use `useCallback`/`useMemo` for callback props.

---

## `cn()` Utility (`lib/utils.ts`)

```ts
import { cn } from '@/lib/utils'

// cn() = clsx() + tailwind-merge()
// - clsx: handles conditional, array, object class merging
// - tailwind-merge: deduplicates conflicting Tailwind classes

cn('px-4 py-2', condition && 'bg-red-500', { 'opacity-50': disabled })
// → merges all truthy values, deduplicates Tailwind conflicts
```

---

## Known Gaps

| ID | Gap | Location | Severity | Fix |
|---|---|---|---|---|
| GAP-1 | Sidebar collapse state not persisted to localStorage — resets on every resize | layout.tsx | Low | Add localStorage read/write in the resize handler |
| GAP-2 | AuthContext `logout()` uses `window.location.href` (full page reload) instead of Next.js `router.push()` | AuthContext.tsx | Low | Use `useRouter().push('/login')` for SPA navigation |
| GAP-3 | `useWebSocket` recreates client when callbacks change — inline handlers cause reconnect storms | useWebSocket.ts | Medium | Wrap callbacks in stable refs inside the hook itself |
| GAP-4 | Admin layout has a hardcoded decorative texture URL from `transparenttextures.com` — CDN dependency | layout.tsx | Low | Self-host the texture or use a CSS pattern |
| GAP-5 | `auth_user` is stored as plaintext JSON in localStorage — contains username and role | AuthContext.tsx | Low | Use httpOnly cookies for token storage |
