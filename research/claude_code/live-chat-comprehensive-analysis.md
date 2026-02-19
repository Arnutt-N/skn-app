# SKN-App Live Chat & Related Features: Comprehensive Analysis Report

**Authors**: Claude Code + Kimi Code CLI (merged best-of-both)
**Date**: 2026-02-07
**Branch**: `fix/live-chat-redesign-issues`
**Scope**: Live Chat, Friends Management, Chat Histories, Chat Analytics

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Feature-by-Feature Deep Dive](#3-feature-by-feature-deep-dive)
4. [WebSocket Client Architecture](#4-websocket-client-architecture)
5. [Database Schema Analysis](#5-database-schema-analysis)
6. [UX/UI Analysis & Best Practices](#6-uxui-analysis--best-practices)
7. [Backend Architecture Best Practices](#7-backend-architecture-best-practices)
8. [Security Assessment](#8-security-assessment)
9. [Performance Analysis](#9-performance-analysis)
10. [Gap Analysis & Recommendations](#10-gap-analysis--recommendations)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [References & Sources](#12-references--sources)

---

## 1. Executive Summary

The SKN-App is a LINE Official Account management system with a comprehensive live chat operator dashboard, friend management, chatbot with intent matching, and analytics. Built with **FastAPI** (async) + **PostgreSQL** + **Redis** backend and **Next.js 16** + **React 19** + **Tailwind CSS 4** frontend.

### Scorecard

| Area | Score | Assessment |
|------|-------|------------|
| Backend Architecture | 8.5/10 | Well-structured async patterns, clean service separation |
| WebSocket Implementation | 8/10 | Enterprise-grade with Pub/Sub, but in-memory state limits true horizontal scaling |
| Frontend UI/UX | 6.5/10 | Functional but monolithic; needs decomposition, accessibility, mobile layout |
| Database Design | 8/10 | Solid foundation; needs pagination indexes and partitioning for scale |
| Analytics & Reporting | 6/10 | Basic KPIs present; no charts, trends, or real-time push |
| Security | 5/10 | **Critical**: Dev mode bypass active, JWT in localStorage, no CSRF |
| Code Quality | 8.5/10 | Clean patterns, good typing, audit logging, rate limiting |

### Current Strengths
- Full WebSocket real-time communication with event-driven architecture
- Redis Pub/Sub channels defined (`live_chat:broadcast`, `live_chat:room:{id}`) with subscription handlers
- Session lifecycle management (WAITING -> ACTIVE -> CLOSED) with audit logging
- Business hours awareness with after-hours messaging and next-open calculation
- Queue position tracking with estimated wait times
- CSAT survey integration via LINE Flex message postbacks
- Webhook event deduplication via Redis TTL cache
- Rate limiting (sliding window) and health monitoring on WebSocket connections
- Canned responses (8 Thai defaults), session transfer, notification sounds
- WebSocket client with exponential backoff reconnection, message queuing, heartbeat
- Input sanitization with bleach in WebSocket payload validation

### Critical Issues
- **Authentication**: Dev mode bypass (`admin_id` without JWT) active in both REST and WebSocket
- **Frontend Security**: JWT in localStorage (XSS vector), mock token with exp:9999999999
- **Scalability**: WebSocket manager uses in-memory dicts for connection state; Redis Pub/Sub publishes messages but connection registry is still local
- **UX**: Monolithic 600+ line live chat component with 20+ useState hooks
- **Accessibility**: Fails WCAG 2.1 Level A on 7 of 8 audited components
- **Analytics**: No charts, no trend indicators, no real-time push, 30s polling only

---

## 2. Current Architecture Analysis

### 2.1 Backend Architecture

```
backend/app/
├── api/v1/endpoints/
│   ├── ws_live_chat.py          # WebSocket endpoint (589 lines)
│   ├── webhook.py               # LINE webhook handler (461 lines)
│   ├── admin_live_chat.py       # REST: conversations, sessions
│   ├── admin_analytics.py       # Analytics REST endpoints
│   ├── admin_audit.py           # Audit log endpoints
│   ├── admin_canned_responses.py # Quick replies CRUD
│   └── health.py                # Health check endpoint
├── core/
│   ├── websocket_manager.py     # Connection & room management + Redis Pub/Sub
│   ├── websocket_health.py      # WS connection monitoring
│   ├── pubsub_manager.py        # Redis Pub/Sub abstraction
│   ├── redis_client.py          # Redis connection
│   ├── audit.py                 # @audit_action decorator
│   ├── rate_limiter.py          # Sliding window rate limiter
│   ├── security.py              # JWT: create/verify/refresh + bcrypt password hashing
│   └── config.py                # Pydantic settings from .env
├── services/
│   ├── live_chat_service.py     # Session lifecycle (540 lines) — singleton pattern
│   ├── analytics_service.py     # KPI calculations (243 lines)
│   ├── friend_service.py        # Follow/unfollow management (121 lines)
│   ├── csat_service.py          # Satisfaction surveys (Flex postback)
│   ├── canned_response_service.py # Quick replies (8 Thai defaults)
│   ├── business_hours_service.py  # Operating hours + next-open
│   ├── handoff_service.py       # Bot-to-human keyword detection
│   └── line_service.py          # LINE Messaging API wrapper
├── models/
│   ├── user.py                  # User with roles, chat_mode, friend_status (52 lines)
│   ├── chat_session.py          # Session with status lifecycle (36 lines)
│   ├── message.py               # Messages with direction & sender_role
│   ├── audit_log.py             # Action audit trail
│   ├── csat_response.py         # Satisfaction scores (1-5) ← ALREADY EXISTS
│   ├── canned_response.py       # Quick reply templates
│   └── business_hours.py        # Operating schedule
└── schemas/
    └── ws_events.py             # WebSocket event validation (bleach sanitization)
```

### 2.2 Frontend Architecture

```
frontend/
├── app/admin/
│   ├── live-chat/page.tsx       # Monolithic live chat (600+ lines, 20+ useState)
│   ├── analytics/page.tsx       # KPI dashboard (8 cards, by Kimi Code)
│   ├── audit/page.tsx           # Audit log viewer (by Kimi Code)
│   └── layout.tsx               # Sidebar navigation
├── hooks/
│   ├── useLiveChatSocket.ts     # WebSocket connection hook
│   ├── useNotificationSound.ts  # Web Audio API oscillator (800Hz, 300ms)
│   └── useSessionTimeout.ts     # 30min inactivity, 5min warning
├── components/admin/
│   ├── CannedResponsePicker.tsx # "/" trigger, category grouping, search
│   └── SessionTimeoutWarning.tsx # Timeout dialog
├── contexts/
│   └── AuthContext.tsx           # Auth with DEV_MODE=true bypass
└── lib/websocket/
    ├── client.ts                # WebSocketClient class (backoff, queue, heartbeat)
    ├── types.ts                 # Event types + payload interfaces
    ├── reconnectStrategy.ts     # Exponential backoff (1s-30s, max 10 attempts)
    └── messageQueue.ts          # Offline message queuing
```

### 2.3 Data Flow

```
LINE User                    Backend                        Frontend (Operator)
   │                           │                                │
   ├─ Send message ──────────> │                                │
   │   (LINE webhook)          ├─ Dedup via Redis (event_id)    │
   │                           ├─ Save to DB (Message model)    │
   │                           ├─ WS broadcast ────────────────>│ NEW_MESSAGE
   │                           ├─ Redis Pub/Sub publish ───────>│ (other servers)
   │                           │                                │
   │   (HUMAN mode?)           │                                │
   │   ├─ Yes: Route to ops    │                                │
   │   └─ No: Intent match     │                                │
   │       ├─ EXACT keyword    │                                │
   │       ├─ CONTAINS keyword │                                │
   │       ├─ Legacy AutoReply │                                │
   │       └─ Handoff keyword  │                                │
   │                           │                                │
   │                           │ <───── send_message ───────────│
   │ <── LINE push message ────│                                │
   │                           ├─ Save to DB                    │
   │                           ├─ WS: MESSAGE_SENT ────────────>│ (sender ACK)
   │                           └─ WS: NEW_MESSAGE ─────────────>│ (other ops)
```

### 2.4 Business Hours & Handoff Flow

```
User Request → Business Hours Check → Create Session (WAITING)
                                  ↓
                    After Hours → Queue for Next Day + Notify User
                                  ↓
                    Queue Position → Flex Message with Est. Wait
                                  ↓
                    Telegram Alert → Operator Claims → ACTIVE
                                  ↓
                    Messages Exchanged → Operator Closes → CSAT Survey
                                  ↓
                    CSAT Flex (1-5 stars) → Postback → Record Score
```

---

## 3. Feature-by-Feature Deep Dive

### 3.1 Live Chat

**Backend** (`ws_live_chat.py` + `live_chat_service.py`)

| Feature | Status | Location |
|---------|--------|----------|
| WebSocket auth (JWT + dev mode) | Implemented | `ws_live_chat.py:handle_auth()` |
| Join/Leave rooms | Implemented | Room-based: `conversation:{line_user_id}` |
| Send messages to LINE | Implemented | `live_chat_service.send_message()` → LINE Push API |
| Claim session | Implemented | WAITING -> ACTIVE with `@audit_action` |
| Close session | Implemented | ACTIVE -> CLOSED, reverts user to BOT mode |
| Transfer session | Implemented | Validates roles, tracks `transfer_count` |
| Typing indicators | Implemented | Broadcast to room, exclude sender |
| Ping/Pong keepalive | Implemented | 25s heartbeat, server time in response |
| Rate limiting | Implemented | 30 msg/60s sliding window (`ws_rate_limiter`) |
| Health monitoring | Implemented | Connection/message/error tracking |
| Queue position | Implemented | FIFO with `estimated_wait = position * avg_resolution` |
| Business hours | Implemented | After-hours auto-response with `get_next_open_time()` |
| CSAT survey | Implemented | Flex message on close, postback handler records 1-5 |
| Canned responses | Implemented | REST CRUD + "/" trigger picker (8 Thai defaults) |
| Notification sounds | Implemented | Web Audio API: 800Hz sine, 300ms, 30% gain |
| Input sanitization | Implemented | `bleach.clean()` in `ws_events.py` payload validation |
| Optimistic UI | Implemented | `temp-${Date.now()}` → replace on `MESSAGE_SENT` ACK |

**Gaps Identified:**

| # | Gap | Severity |
|---|-----|----------|
| 1 | No message pagination — `get_recent_messages()` fixed at 50 messages | High |
| 2 | No message search — cannot find messages by content | Medium |
| 3 | No read receipts — `unread_count` always returns 0 | Medium |
| 4 | No file/image support — only text messages handled (LINE supports images, video, stickers) | Medium |
| 5 | No message delivery status — optimistic UI but no LINE delivery confirmation | Low |
| 6 | Session claim race condition — no optimistic locking on concurrent claims | Medium |
| 7 | No reconnection state recovery — must re-auth and re-join room on reconnect | Medium |
| 8 | No offline message queue server-side — client queues but server drops if WS disconnected | Low |
| 9 | Auto-retry on reconnection could send duplicates (lines 304-315 in page.tsx) | Low |

**Frontend** (`live-chat/page.tsx`)

The page is a **monolithic 600+ line component** with:

| Category | Variables | Lines |
|----------|-----------|-------|
| Data | conversations, currentChat, messages | 47-51 |
| UI State | selectedId, loading, filterStatus, searchQuery | 49-56 |
| Interaction | inputText, sending, claiming | 57-58 |
| Panels | showCustomerPanel, showTransferDialog, showCannedPicker | 59-64 |
| WebSocket | wsStatus, typingUsers, soundEnabled | 61-65 |
| Optimistic UI | pendingMessages, failedMessages | 67-68 |
| Refs | 6 refs for scroll, input, timers | various |

Issues:
- No component decomposition (conversation list, message area, customer panel all in one file)
- Inline styles mixed with Tailwind classes
- No virtualization for long message lists
- No skeleton loading states
- Dual data fetching: WS primary + REST polling fallback (5s conversations, 3s messages) — polling continues even when WS is connected

### 3.2 Friends Management

**Backend** (`friend_service.py` + `webhook.py`)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Follow event handling | Implemented | Creates User record, logs FriendEvent |
| Unfollow event handling | Implemented | Sets `friend_status="UNFOLLOWED"` |
| Re-follow detection | Implemented | Checks previous status, logs REFOLLOW |
| Profile fetch from LINE | Implemented | `get_line_bot_api().get_profile()` |
| Friend listing | Implemented | Query with status filter, sorted by `last_message_at` |
| Friend event history | Implemented | FriendEvent model with type + source |

**User Model Fields:**
```python
friend_status = Column(String)       # "ACTIVE" | "UNFOLLOWED"
friend_since = Column(DateTime)      # First follow timestamp
last_message_at = Column(DateTime)   # Last message for sorting
display_name = Column(String)        # From LINE profile
picture_url = Column(String)         # From LINE profile
```

**Gaps Identified:**

| # | Gap | Note |
|---|-----|------|
| 1 | No friend tags/labels | Cannot categorize or segment friends |
| 2 | No friend search by name | Only listing with status filter |
| 3 | No friend statistics | Total active/unfollowed counts not surfaced |
| 4 | No profile refresh | Profile data fetched once at follow; never updated |
| 5 | No friend source tracking | Cannot tell how user found the OA |
| 6 | No bulk operations | Cannot mass-tag or mass-message |
| 7 | **No frontend friends page** | `frontend/app/admin/friends/` directory does not exist |
| 8 | No blocked user handling | Only follow/unfollow tracked |

### 3.3 Chat Histories

**Backend** (`live_chat_service.py` + `message.py`)

| Feature | Status |
|---------|--------|
| Message storage | Message model with direction, content, sender_role |
| Recent messages | `get_recent_messages(line_user_id, limit, db)` |
| Conversation list | `get_conversations()` — N+1 query (1 query per user for last message) |
| Message types | `message_type` field exists but only "text" and "multi" used |
| Direction tracking | INCOMING (user) / OUTGOING (bot/operator) |
| Sender role | USER, ADMIN, BOT via `sender_role` field |
| Operator name | Stored with outgoing messages |

**Gaps Identified:**

| # | Gap |
|---|-----|
| 1 | No pagination — only `limit` param; no cursor/offset for scrolling back |
| 2 | No full-text search |
| 3 | No message export (CSV/PDF for compliance) |
| 4 | No media storage — LINE images/files not saved; only text stored |
| 5 | No message editing/deletion (no soft delete) |
| 6 | No conversation archiving |
| 7 | No message threading (flat list; no reply-to) |
| 8 | N+1 query in `get_conversations()` — per-user query for last message (~line 363) |
| 9 | Hardcoded 50-message limit in `get_conversation_detail()` |

### 3.4 Chat Analytics

**Backend** (`analytics_service.py`)

**Current KPIs:**
```python
{
    "waiting": int,                      # Users in queue (real-time)
    "active": int,                       # Active sessions (real-time)
    "avg_first_response_seconds": float, # FRT last hour
    "avg_resolution_seconds": float,     # Resolution today
    "csat_average": float,               # CSAT avg last 24h
    "csat_percentage": float,            # CSAT as percentage
    "fcr_rate": float,                   # First Contact Resolution (no reopen in 24h)
    "sessions_today": int,
    "human_mode_users": int
}
```

**Additional Features:**
- Operator performance: per-operator FRT, resolution time, session counts
- Hourly message stats: `date_trunc('hour')` grouping for charts
- Daily aggregates: `ChatAnalytics` model with pre-computed data

**Frontend:** 8 KPI cards in responsive grid (1/2/3/4 columns) with color-coded borders (red for waiting >0, green for active >0). 30s polling. No charts.

**Gaps Identified:**

| # | Gap | Impact |
|---|-----|--------|
| 1 | No real-time streaming — 30s poll, no WebSocket push for KPIs | High |
| 2 | No chat abandonment rate — not tracking queue dropoffs | High |
| 3 | No conversation tags/topics — cannot categorize inquiries | Medium |
| 4 | No conversion tracking — cannot link sessions to service requests | Medium |
| 5 | No peak hours analysis — hourly data exists but no detection | Low |
| 6 | No SLA monitoring — no alerts when FRT/resolution exceeds threshold | Medium |
| 7 | No agent availability tracking — no online-time correlation with waits | Low |
| 8 | No chat volume forecasting | Low |
| 9 | No export/reporting | Low |
| 10 | FCR calculation is O(n) queries — each session checked individually | Medium |
| 11 | No trend indicators (improving/degrading arrows) | Low |
| 12 | No time-series charts or heatmaps | Medium |
| 13 | No drill-down (click operator for details) | Low |
| 14 | No loading skeletons (shows "-" during fetch) | Low |

---

## 4. WebSocket Client Architecture

### 4.1 Client Implementation (`frontend/lib/websocket/client.ts`)

```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectStrategy = new ExponentialBackoffStrategy();
  private messageQueue = new MessageQueue();

  // Configuration
  heartbeatIntervalMs = 25000;    // 25s ping
  maxReconnectAttempts = 10;      // Give up after 10 tries
}
```

**Connection State Machine:**
```
disconnected → connecting → authenticating → connected
                  ↑                              ↓
                  └──────── reconnecting ←───────┘
```

**Reconnection Strategy:**
- Exponential backoff with jitter
- Base delay: 1s, Max delay: 30s
- Max 10 reconnection attempts
- Message queue persists across disconnections

### 4.2 Event Types (`frontend/lib/websocket/types.ts`)

| Direction | Events |
|-----------|--------|
| Client -> Server | `auth`, `join_room`, `leave_room`, `send_message`, `typing_start`, `typing_stop`, `claim_session`, `close_session`, `transfer_session`, `ping` |
| Server -> Client | `auth_success`, `auth_error`, `new_message`, `message_sent`, `typing_indicator`, `session_claimed`, `session_closed`, `session_transferred`, `presence_update`, `conversation_update`, `operator_joined`, `operator_left`, `error`, `pong` |

All event types are TypeScript enums with typed payload interfaces.

### 4.3 Hook Integration (`frontend/hooks/useLiveChatSocket.ts`)

- Wraps `WebSocketClient` in React hook
- Exposes: `send()`, `joinRoom()`, `leaveRoom()`, `connectionState`
- Auto-reconnect on mount, cleanup on unmount
- Dispatches callbacks: `onMessage`, `onConnect`, `onDisconnect`

---

## 5. Database Schema Analysis

### 5.1 Core Tables

```sql
-- Users (dual-purpose: LINE users + Admin operators)
users:
  id, line_user_id, username, hashed_password
  role: SUPER_ADMIN | ADMIN | AGENT | USER
  chat_mode: BOT | HUMAN
  friend_status, friend_since, last_message_at
  display_name, picture_url

-- Chat Sessions
chat_sessions:
  id, line_user_id, operator_id
  status: WAITING | ACTIVE | CLOSED
  started_at, claimed_at, closed_at, first_response_at
  message_count, transfer_count, closed_by

-- Messages
messages:
  id, line_user_id
  direction: INCOMING | OUTGOING
  message_type: text | image | sticker | location | flex | multi
  content, payload (JSONB)
  sender_role: USER | BOT | ADMIN
  operator_name, created_at

-- CSAT Responses (ALREADY EXISTS)
csat_responses:
  id, session_id, line_user_id
  score (1-5), feedback, created_at

-- Canned Responses
canned_responses:
  id, title, content, shortcut, category
  is_active, sort_order, created_at

-- Friend Events
friend_events:
  id, line_user_id
  event_type: FOLLOW | UNFOLLOW | REFOLLOW
  source: WEBHOOK | MANUAL, created_at

-- Chat Analytics (daily aggregates)
chat_analytics:
  id, date, operator_id
  total_sessions, avg_response_time_seconds
  avg_resolution_time_seconds, total_messages_sent
```

### 5.2 Current Indexes

```sql
-- Existing
✅ messages.line_user_id          -- Conversation history
✅ chat_sessions.line_user_id     -- Active session lookup
✅ chat_sessions.status           -- Queue management
✅ friend_events.line_user_id     -- Friend history
```

### 5.3 Recommended Additional Indexes

```sql
-- For analytics time-range queries
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_claimed_at ON chat_sessions(claimed_at);

-- For message pagination (cursor-based)
CREATE INDEX idx_messages_user_created ON messages(line_user_id, created_at DESC);

-- For message search
CREATE INDEX idx_messages_content_trgm ON messages USING gin(content gin_trgm_ops);
```

### 5.4 Recommended Schema Additions

**1. Message Read Tracking (Redis-backed):**
```
Redis key: read:{admin_id}:{line_user_id} = timestamp
-- Track per-admin, per-conversation last-read time
-- Lightweight, no new table needed
```

**2. User Tags:**
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_tags (
    user_id INTEGER REFERENCES users(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (user_id, tag_id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**3. Materialized View for Daily Stats (high-volume optimization):**
```sql
CREATE MATERIALIZED VIEW daily_message_stats AS
SELECT
    date_trunc('day', created_at) as day,
    line_user_id,
    count(*) as message_count,
    count(*) FILTER (WHERE direction = 'INCOMING') as incoming_count,
    count(*) FILTER (WHERE direction = 'OUTGOING') as outgoing_count
FROM messages
GROUP BY 1, 2;

CREATE INDEX idx_daily_stats_day ON daily_message_stats(day);
-- REFRESH MATERIALIZED VIEW daily_message_stats; (via cron/task)
```

**4. Table Partitioning for Messages (when exceeding 10M+ rows):**
```sql
CREATE TABLE messages_partitioned (
    LIKE messages INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE messages_2026_01 PARTITION OF messages_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 6. UX/UI Analysis & Best Practices

### 6.1 Live Chat Dashboard UX

**Current Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (w-72)    │  Chat Area (flex-1)    │  Panel (w-64) │
│  ─────────────     │  ─────────────────     │  ───────────  │
│  Search & Filters  │  Chat Header           │  Profile      │
│  Conversation List │  ─────────────────     │  ───────────  │
│  - Avatar          │  Messages              │  Session Info │
│  - Name            │  - User messages       │  Actions      │
│  - Preview         │  - Admin messages      │               │
│  - Unread badge    │  - Typing indicator    │               │
│  - Status dot      │  ─────────────────     │               │
│                    │  Input Area            │               │
└─────────────────────────────────────────────────────────────┘
```

Note: Live chat bypasses admin layout entirely — renders full-screen wrapped only in AuthProvider.

**Issues per Skill Analysis:**

| Aspect | Current | Best Practice (per Skills) |
|--------|---------|---------------------------|
| Component Size | 600+ lines monolithic | Decompose into <200 line components (senior-frontend) |
| State Management | 20+ `useState` hooks | Context + `useReducer` or Zustand (react_patterns) |
| Responsive | Basic `<1024px` sidebar collapse | Container queries for panel-level responsiveness (responsive-design) |
| Accessibility | No ARIA attributes | Semantic HTML, `aria-live` for messages, focus management (frontend_best_practices) |
| Design System | Inline Tailwind classes | CVA variants, design tokens via `@theme` (tailwind-design-system) |
| Animation | None | Motion for message enter/exit, loading states (frontend-design) |
| Typography | System fonts | Thai font pairing: `Noto_Sans_Thai` + `Inter` (frontend-design) |
| Dark Mode | Theme hook exists but incomplete | Full dark mode with CSS variables (tailwind-design-system) |
| Virtualization | None | `@tanstack/react-virtual` for long message lists (react_patterns) |
| Error Boundaries | None | Wrap chat panels in error boundaries (react_patterns) |

### 6.2 Recommended Component Decomposition

```
app/admin/live-chat/
├── page.tsx                    # Layout shell (<100 lines), Suspense boundaries
├── _components/
│   ├── ConversationList.tsx    # Left panel: search, filters, conversation items
│   ├── ConversationItem.tsx    # Single conversation row (memo'd)
│   ├── ChatArea.tsx            # Center: messages + input
│   ├── MessageBubble.tsx       # Individual message with status (memo'd)
│   ├── MessageInput.tsx        # Text input + canned response trigger
│   ├── CustomerPanel.tsx       # Right panel: user info + actions
│   ├── SessionActions.tsx      # Claim/Close/Transfer buttons
│   ├── TransferDialog.tsx      # Transfer session modal (focus trap)
│   ├── QueueBadge.tsx          # Queue position indicator
│   ├── ChatHeader.tsx          # Chat area header
│   └── TypingIndicator.tsx     # Animated typing dots
├── _hooks/
│   ├── useChatReducer.ts       # useReducer for all chat state
│   ├── useConversations.ts     # Conversation list + filtering
│   └── useMessages.ts          # Message pagination + optimistic updates
└── _context/
    └── LiveChatContext.tsx      # Shared state provider
```

### 6.3 Design System Recommendations

**Semantic Color Tokens (Tailwind v4 `@theme`):**
```css
@theme {
  --color-chat-user: oklch(0.55 0.22 264);
  --color-chat-admin: oklch(0.65 0.18 145);
  --color-chat-bot: oklch(0.6 0.05 240);
  --color-status-waiting: oklch(0.65 0.2 45);
  --color-status-active: oklch(0.65 0.2 145);
  --color-status-closed: oklch(0.5 0.05 250);
}
```

**Message Bubble Variants (CVA):**
```typescript
const messageBubbleVariants = cva(
  'rounded-2xl px-4 py-2.5 max-w-[70%]',
  {
    variants: {
      sender: {
        user: 'bg-white text-slate-700 rounded-bl-md',
        admin: 'bg-indigo-600 text-white rounded-br-md',
        bot: 'bg-slate-200 text-slate-600 rounded-br-md',
      },
      status: {
        sent: 'opacity-100',
        pending: 'opacity-70',
        failed: 'opacity-100 border-2 border-red-500',
      }
    }
  }
);
```

**Thai Font Pairing:**
```typescript
import { Noto_Sans_Thai, Inter } from 'next/font/google';

const notoSansThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-thai' });
const inter = Inter({ subsets: ['latin'], variable: '--font-display' });
```

**Fluid Typography:**
```css
:root {
  --text-base: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
  --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
}
```

**Message Enter Animation (Motion):**
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {message.content}
</motion.div>
```

### 6.4 Responsive Design Strategy

```
Breakpoints:
- Base (<640px):  Single panel — conversation list OR chat (slide transition)
- sm (640px):     Conversation list slides in as overlay
- md (768px):     Two panels: conversation list + chat area
- lg (1024px):    Three panels: list + chat + customer panel
- xl (1280px):    Three panels with expanded customer panel

Container Queries (per responsive-design skill):
<div className="@container">
  <div className="flex flex-col @lg:flex-row">
    <Sidebar className="w-full @lg:w-72" />
    <ChatArea className="flex-1" />
    <Panel className="hidden @xl:block @xl:w-64" />
  </div>
</div>
```

### 6.5 Analytics Dashboard UX

**Recommended Layout:**
```
Row 1: Real-time KPIs (4 cards with trend arrows)
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Waiting  │ │ Active   │ │ Avg FRT  │ │ CSAT     │
│   Queue  │ │ Sessions │ │ (seconds)│ │  Score   │
│  ▲ 3 +2  │ │  5 ─     │ │ 45s ▼-5s │ │ 4.2 ▲   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

Row 2: Trend Charts (2 charts)
┌─────────────────────┐ ┌─────────────────────┐
│ Session Volume      │ │ Response Time       │
│ (7-day trend line)  │ │ (24h trend + P90)   │
└─────────────────────┘ └─────────────────────┘

Row 3: Heatmap + Performance
┌─────────────────────┐ ┌─────────────────────┐
│ Peak Hours Heatmap  │ │ Conversation Funnel  │
│ (hourly 7-day grid) │ │ Bot → Human → Resolved│
└─────────────────────┘ └─────────────────────┘

Row 4: Operator Table (sortable, clickable for drill-down)
┌─────────────────────────────────────────────┐
│ Name | Sessions | Avg FRT | Avg Resolution  │
└─────────────────────────────────────────────┘
```

**Essential KPIs to Track:**

| Category | Metric | Status | Priority |
|----------|--------|--------|----------|
| Speed | First Response Time | Implemented | Add SLA alerts |
| Speed | Average Resolution | Implemented | Add P50/P90/P99 |
| Quality | CSAT Score | Implemented | Add trend sparklines |
| Quality | FCR Rate | Implemented | Optimize O(n) query |
| Volume | Sessions per Day | Implemented | Add forecasting |
| Volume | **Chat Abandonment Rate** | **Missing** | **P1 — track queue dropoffs** |
| Volume | **Peak Hours** | **Missing** | **P2 — auto-detect** |
| Efficiency | **Transfer Rate** | **Missing** | **P2 — use transfer_count** |
| Efficiency | **Agent Availability** | **Missing** | **P3 — track online time** |
| Revenue | **Conversion Rate** | **Missing** | **P3 — link to service requests** |

### 6.6 Accessibility Audit Results

| Component | Issue | WCAG Level | Fix |
|-----------|-------|------------|-----|
| Conversation list | No keyboard navigation | **A** (2.1.1) | `role="listbox"`, arrow keys |
| Icon-only buttons | Missing aria-label | **A** (1.1.1) | Add `aria-label` to all |
| Message area | No aria-live for new messages | **A** (4.1.3) | `aria-live="polite"` |
| Chat input | No associated label | **A** (1.3.1) | `<label htmlFor>` |
| Connection status | Has aria-live="polite" | **Pass** | - |
| Transfer dialog | No focus trap | **A** (2.4.3) | Trap Tab within dialog |
| Canned picker | No arrow key nav | **AA** (2.1.1) | `role="listbox"`, arrow keys |
| Session actions | No role="group" | **A** (1.3.1) | Wrap with `aria-label` |

---

## 7. Backend Architecture Best Practices

### 7.1 WebSocket Scaling (Redis Pub/Sub)

**Current State**: `pubsub_manager.py` defines channels and handlers. `websocket_manager.py` has `BROADCAST_CHANNEL` and `ROOM_CHANNEL_PREFIX` constants, publishes to Redis on `broadcast_to_room()` and `broadcast_to_all()`, and subscribes via `_handle_remote_broadcast()`. However, the **connection registry** (`connections`, `rooms`, `ws_to_admin` dicts) remains in-memory — all state is lost on process restart and operators connected to different instances won't share connection state.

**What's working**: Message delivery across instances via Pub/Sub publish + subscribe.
**What's not**: Presence tracking, room membership, and connection health are per-process only.

**Recommendation**: Store connection metadata in Redis:
```python
# Redis keys for shared state
f"ws:connections:{admin_id}" = {connected_at, server_id, rooms: [...]}
f"ws:rooms:{room_id}" = set of admin_ids (Redis SET)
f"ws:presence" = sorted set of admin_ids with heartbeat timestamps
```

### 7.2 Authentication

**Current Problem**: Dev mode allows `admin_id` without JWT validation in both `ws_live_chat.py:48-53` and `deps.py:30-46`.

**Existing Infrastructure** (in `core/security.py` — already implemented):
- `create_access_token()` — JWT with 30min expiry, type="access"
- `create_refresh_token()` — JWT with 7-day expiry, type="refresh"
- `verify_password()` / `get_password_hash()` — bcrypt via passlib
- `verify_token()` / `verify_jwt_token()` — decode + validate
- `is_token_expired()` — expiry check

**What's missing**: Login endpoint to issue tokens. The infrastructure exists but no `POST /auth/login` endpoint calls it.

### 7.3 Database Query Optimization

**N+1 in `get_conversations()`** (`live_chat_service.py:~363`):
```python
for user, session in rows:
    # One query PER user for last message — N+1!
    last_msg_stmt = select(Message).where(
        Message.line_user_id == user.line_user_id
    ).order_by(desc(Message.created_at)).limit(1)
```

**Fix with window function:**
```python
from sqlalchemy import func
last_msg_subq = (
    select(
        Message,
        func.row_number().over(
            partition_by=Message.line_user_id,
            order_by=desc(Message.created_at)
        ).label('rn')
    ).subquery()
)
# Filter rn=1 and join — single query
```

**FCR Calculation** (`analytics_service.py:~126`):
```python
for session in sessions:       # O(n) sessions
    reopened = await db.scalar(...)  # 1 query each = O(n) total
```

**Fix**: Single query with NOT EXISTS subquery:
```python
fcr_count = await db.scalar(
    select(func.count()).where(
        ChatSession.id.in_(session_ids),
        ~exists(
            select(ChatSession.id).where(
                ChatSession.line_user_id == ChatSession.line_user_id,
                ChatSession.created_at > ChatSession.closed_at,
                ChatSession.created_at < ChatSession.closed_at + timedelta(hours=24)
            ).correlate(ChatSession)
        )
    )
)
```

### 7.4 Resilience Patterns

**Circuit Breaker for LINE API** (recommended):
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
async def send_line_message(self, user_id: str, message):
    """Prevent cascade failures when LINE API is down."""
    await self.api.push_message(PushMessageRequest(to=user_id, messages=[message]))
```

### 7.5 Message Search

**Option A — Simple ILIKE** (good for Thai, low setup):
```python
stmt = select(Message).where(Message.content.ilike(f"%{query}%"))
```

**Option B — PostgreSQL Full-Text with Thai** (better ranking):
```python
# Requires: CREATE EXTENSION pg_trgm;
search_query = func.plainto_tsquery('thai', query)
stmt = select(Message).where(
    func.to_tsvector('thai', Message.content).op('@@')(search_query)
)
```

---

## 8. Security Assessment

### 8.1 Severity Table

| Risk | Location | Severity | Detail |
|------|----------|----------|--------|
| Dev mode auth bypass (WS) | `ws_live_chat.py:48-53` | **Critical** | Any user can impersonate any admin via `{"admin_id": "1"}` |
| Dev mode auth bypass (REST) | `deps.py:30-46` | **Critical** | No token = auto-admin in "development" mode |
| Hard-coded `DEV_MODE=true` | `AuthContext.tsx:25` | **Critical** | Frontend never requires login |
| Mock token exp:9999999999 | `AuthContext.tsx:34` | **High** | Mock token never expires |
| JWT in localStorage | `AuthContext.tsx:61` | **High** | XSS can steal tokens |
| No CSRF protection | All fetch calls | **Medium** | Cross-site request forgery possible |
| No input sanitization on display | Message rendering in React | **Medium** | React escapes by default, but `dangerouslySetInnerHTML` risk |
| No Content Security Policy | No CSP headers | **Medium** | Script injection possible |
| Session timeout client-only | `useSessionTimeout.ts` | **Low** | Server doesn't validate; bypass by not loading component |

### 8.2 Current Security Measures (working)

- JWT decode + validation in `deps.py` and `ws_live_chat.py` (when tokens are provided)
- Input sanitization via `bleach.clean()` in `ws_events.py`
- Rate limiting: 30 msg/60s sliding window per admin
- SQL injection protection via SQLAlchemy parameterized queries
- Webhook signature validation via LINE SDK `WebhookParser`
- Webhook event deduplication via Redis TTL

### 8.3 Additional Security Recommendations

| Priority | Recommendation |
|----------|---------------|
| P0 | Gate dev mode behind `ENVIRONMENT` env var; reject in production |
| P0 | Create `POST /auth/login` endpoint using existing `security.py` functions |
| P1 | Move JWT to httpOnly cookie or add XSS mitigations |
| P1 | Add `Content-Security-Policy` headers |
| P2 | Implement data retention policies (auto-cleanup of old messages) |
| P2 | Add GDPR compliance (right to be forgotten) |
| P3 | Content moderation for abusive messages |
| P3 | End-to-end encryption for sensitive conversations |

---

## 9. Performance Analysis

### 9.1 Current Benchmarks (Estimated)

| Metric | Target | Current Est. | Status |
|--------|--------|-------------|--------|
| WebSocket Connection | < 500ms | ~300ms | Good |
| Message Delivery (WS) | < 100ms | ~50ms | Good |
| Conversation List Load | < 1s | ~800ms | OK (N+1 slows it) |
| Message History (50) | < 500ms | ~400ms | Good |
| LINE Push API | < 2s | ~1.5s | OK (external) |
| Concurrent Users | 1000+ | Not tested | Unknown |

### 9.2 Performance Issues

| Issue | Impact | Solution |
|-------|--------|----------|
| No virtual scrolling | Slow with 100+ messages | `@tanstack/react-virtual` |
| Full Lucide icon import | Large bundle size | Tree-shake to named imports |
| No code splitting | All admin components loaded upfront | `next/dynamic` for panels |
| No memoization | Re-renders on every state change | `React.memo`, `useMemo`, `useCallback` |
| No request debouncing | Typing triggers event per keystroke | Debounce to 300ms |
| REST polling overlap | Polls even when WS is connected | Stop polling when WS healthy |
| N+1 in conversations | Linear with user count | Window function (see 7.3) |
| FCR O(n) queries | Slow with many sessions | Single query with NOT EXISTS |

### 9.3 Optimization Targets

| Target | How |
|--------|-----|
| Reduce initial load | Code splitting for customer panel, transfer dialog |
| Virtual scrolling | `@tanstack/react-virtual` for messages |
| Redis caching | Cache conversation list (5s TTL) |
| CDN for avatars | Proxy LINE profile pictures through CDN |
| Message partitioning | Partition by month when >10M rows |
| Materialized views | Pre-compute daily analytics |
| Connection pooling | Tune SQLAlchemy pool size for WS connections |

---

## 10. Gap Analysis & Recommendations

### 10.1 Priority Matrix (all 17 gaps consolidated)

| # | Gap | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 1 | Auth: Remove dev mode bypass / add real JWT login | **Critical** | Medium | **P0** |
| 2 | Security: Fix JWT storage, add CSP headers | **Critical** | Low | **P0** |
| 3 | Chat History: Add cursor-based pagination | **High** | Medium | **P1** |
| 4 | Live Chat UX: Decompose monolithic component | **High** | High | **P1** |
| 5 | Analytics: Add abandonment rate tracking | **High** | Low | **P1** |
| 6 | Chat History: Support media messages (image/sticker/file) | **Medium** | Medium | **P2** |
| 7 | Friends: Add tags/segmentation + frontend page | **Medium** | Medium | **P2** |
| 8 | WebSocket: Store connection state in Redis for true horizontal scaling | **Medium** | Medium | **P2** |
| 9 | Unread count: Implement real tracking via Redis | **Medium** | Low | **P2** |
| 10 | Analytics: Real-time KPI push via WebSocket | **Medium** | Low | **P2** |
| 11 | Live Chat: Virtual scrolling for long threads | **Medium** | Low | **P2** |
| 12 | Accessibility: ARIA, keyboard nav, screen reader | **Medium** | Medium | **P2** |
| 13 | Responsive: Mobile-optimized live chat (single-panel slide) | **Medium** | Medium | **P2** |
| 14 | Message search: ILIKE or full-text | **Medium** | Low | **P2** |
| 15 | Session claim: Optimistic locking for race condition | **Low** | Low | **P3** |
| 16 | Analytics: SLA monitoring + operator availability | **Low** | Medium | **P3** |
| 17 | Chat History: Export CSV/PDF, N+1 fix, profile refresh | **Low** | Low | **P3** |

### 10.2 Key Recommendations with Code

#### P0: Authentication (Critical)

**Problem**: Any user can impersonate any admin.

**Solution** — Login endpoint using existing `security.py`:
```python
# backend/app/api/v1/endpoints/auth.py
@router.post("/auth/login")
async def login(credentials: LoginSchema, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(
        select(User).where(User.username == credentials.username)
    )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "user": {"id": user.id, "username": user.username, "role": user.role}
    }
```

#### P1: Chat History Pagination

**Problem**: Fixed 50-message limit; users cannot scroll back.

**Solution** — Cursor-based:
```python
async def get_messages_paginated(self, line_user_id: str, before_id: Optional[int], limit: int, db):
    query = select(Message).where(Message.line_user_id == line_user_id)
    if before_id:
        query = query.where(Message.id < before_id)
    query = query.order_by(desc(Message.id)).limit(limit + 1)
    result = await db.execute(query)
    messages = result.scalars().all()
    has_more = len(messages) > limit
    return {"messages": list(reversed(messages[:limit])), "has_more": has_more}
```

**Frontend**: IntersectionObserver on sentinel div at top, preserve scroll position after prepend.

#### P2: Circuit Breaker for LINE API

**Problem**: LINE API failures cascade to WebSocket handlers.

**Solution**:
```python
@circuit(failure_threshold=5, recovery_timeout=30)
async def send_line_message(self, user_id: str, message):
    await self.api.push_message(PushMessageRequest(to=user_id, messages=[message]))
```

---

## 11. Implementation Roadmap

### Phase 1: Security & Stability (1-2 weeks)
- [ ] Add `ENVIRONMENT` to `config.py`; gate dev mode bypass
- [ ] Create `POST /auth/login` + `POST /auth/refresh` + `GET /auth/me`
- [ ] Create seed script for admin users with hashed passwords
- [ ] Update `AuthContext.tsx`: `DEV_MODE` from env, real login flow
- [ ] Create `/login` page
- [ ] Fix N+1 query in `get_conversations()` (window function)
- [ ] Fix session claim race condition (optimistic locking)

### Phase 2: Core UX Improvements (2-3 weeks)
- [ ] Decompose live chat into components (per 6.2 architecture)
- [ ] Add chat history cursor-based pagination (backend + frontend infinite scroll)
- [ ] Implement real unread count via Redis `last_read_at`
- [ ] Add message search (ILIKE for Thai)
- [ ] Add accessibility attributes (per 6.6 audit)

### Phase 3: Enhanced Features (2-3 weeks)
- [ ] Friends tagging/segmentation (Tag model + CRUD + frontend)
- [ ] Media message support (images, stickers, files — download from LINE CDN)
- [ ] Chat abandonment rate tracking (WAITING >10min = abandoned)
- [ ] Real-time KPI push via WebSocket `analytics_update` event
- [ ] Mobile-responsive live chat (single-panel slide below 768px)
- [ ] Virtual scrolling with `@tanstack/react-virtual`

### Phase 4: Scaling & Analytics (2-3 weeks)
- [ ] Store WS connection state in Redis for true horizontal scaling
- [ ] Operator availability tracking (online time → Redis sorted set)
- [ ] SLA threshold alerts (FRT >120s, queue >5min → WS + Telegram)
- [ ] Chat history export (CSV/PDF)
- [ ] Enhanced analytics: trend arrows, time-series charts, heatmaps, drill-down
- [ ] Friends profile refresh (re-fetch LINE profile when stale >24h)

---

## 12. References & Sources

### Web Research
- [60+ Chat UI design examples | Muzli](https://muz.li/inspiration/chat-ui/)
- [20 Best Dashboard UI/UX Design Principles 2025](https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795)
- [Top UX/UI Design Trends 2026 | Fuselab](https://fuselabcreative.com/ui-ux-design-trends-2026-modern-ui-trends-ux-trends-guide/)
- [16 Chat UI Design Patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [Dashboard UI Design Guide 2026](https://www.designstudiouiux.com/blog/dashboard-ui-design-guide/)
- [Top UI/UX Design Trends 2026 | Syngrid](https://syngrid.com/top-ui-ux-design-trends-2026/)
- [10 Live Chat Metrics to Track | Hiver](https://hiverhq.com/blog/live-chat-metrics)
- [12 Key Live Chat Metrics & KPIs | REVE Chat](https://www.revechat.com/blog/live-chat-metrics/)
- [14 Live Chat Metrics & KPIs | ProProfs](https://www.proprofschat.com/blog/live-chat-metrics/)
- [Scaling Pub/Sub with WebSockets and Redis | Ably](https://ably.com/blog/scaling-pub-sub-with-websockets-and-redis)
- [Design a Chat App System | System Design](https://newsletter.systemdesign.one/p/design-a-chat-system)
- [Building Real-Time Chat with Redis | Redis.io](https://redis.io/tutorials/howtos/chatapp/)
- [Scaling WebSocket Services with Redis Pub/Sub | Leapcell](https://leapcell.io/blog/scaling-websocket-services-with-redis-pub-sub-in-node-js)
- [How We Scaled 1 Million WebSocket Connections](https://arizawan.com/2025/02/how-we-scaled-1-million-websocket-connections-real-world-engineering-insights/)
- [LINE Official Account Content Dispatch](https://apps-line.me/en/blogs/1709/)
- [LINE Chat Settings | LINEYahoo](https://www.linebiz.com/jp-en/manual/OfficialAccountManager/chat-various-settings/)
- [Architecture behind chatting on LINE LIVE](https://engineering.linecorp.com/en/blog/the-architecture-behind-chatting-on-line-live/)

### Skills Referenced
- `frontend-design/SKILL.md` — Design thinking, anti-patterns, Tailwind v4, shadcn/ui, Motion
- `responsive-design/SKILL.md` — Container queries, fluid typography, breakpoint strategies
- `responsive-design/references/container-queries.md` — Named containers, CQ units
- `responsive-design/references/breakpoint-strategies.md` — Mobile-first, content-based
- `senior-frontend/SKILL.md` — Component generation, bundle analysis, React patterns
- `senior-frontend/references/frontend_best_practices.md` — Accessibility, testing, TypeScript, security
- `senior-frontend/references/react_patterns.md` — Compound components, hooks, state, performance
- `tailwind-design-system/SKILL.md` — Design tokens, CVA patterns, dark mode, form components

### Context7 Documentation
- FastAPI WebSocket docs — Authentication patterns, dependency injection
- Next.js v16.1.1 docs — Server Components, data fetching, streaming

### Codebase Files Analyzed (20+)
- `backend/app/api/v1/endpoints/ws_live_chat.py` (589 lines)
- `backend/app/api/v1/endpoints/webhook.py` (461 lines)
- `backend/app/services/live_chat_service.py` (540 lines)
- `backend/app/services/analytics_service.py` (243 lines)
- `backend/app/services/friend_service.py` (121 lines)
- `backend/app/core/websocket_manager.py` (connection registry + Pub/Sub)
- `backend/app/core/security.py` (JWT + bcrypt — 168 lines)
- `backend/app/core/config.py` (settings)
- `backend/app/api/deps.py` (auth dependency)
- `backend/app/models/user.py` (52 lines)
- `backend/app/models/chat_session.py` (36 lines)
- `backend/app/models/csat_response.py`
- `backend/app/schemas/ws_events.py` (bleach sanitization)
- `frontend/app/admin/live-chat/page.tsx` (600+ lines)
- `frontend/hooks/useLiveChatSocket.ts`
- `frontend/contexts/AuthContext.tsx`
- `frontend/components/admin/CannedResponsePicker.tsx`
- `frontend/hooks/useNotificationSound.ts`
- `frontend/lib/websocket/client.ts`
- `frontend/lib/websocket/types.ts`

### Technology Stack
| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0 async |
| Database | PostgreSQL 16+ |
| Cache | Redis 7+ |
| Frontend | Next.js 16.1.1, React 19.2.3, TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| WebSocket | Native WebSocket + Custom Manager + Redis Pub/Sub |
| LINE SDK | line-bot-sdk 3.0+ |
| Auth | python-jose (JWT), passlib (bcrypt) |

---

*This merged report combines deep codebase analysis (20+ files), two parallel subagent explorations (backend + frontend), Context7 documentation research, 17+ web sources, 8 skill reference files, and fact-checking of both original reports for accuracy.*
