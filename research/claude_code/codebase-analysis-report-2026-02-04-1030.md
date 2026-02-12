# SknApp (JskApp) - Comprehensive Codebase Analysis Report

> **Generated:** 2026-02-04 10:30 UTC
> **Analyzer:** Claude Code (Opus 4.5)
> **Project:** LINE Official Account System for Community Justice Services

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Schema](#5-database-schema)
6. [WebSocket Real-Time System](#6-websocket-real-time-system)
7. [LINE Integration](#7-line-integration)
8. [API Reference](#8-api-reference)
9. [Security & Authentication](#9-security--authentication)
10. [Key Design Patterns](#10-key-design-patterns)
11. [File Reference Index](#11-file-reference-index)
12. [Recommendations](#12-recommendations)

---

## 1. Executive Summary

**JskApp** is a full-stack LINE Official Account system designed for Community Justice Services in Thailand. The platform enables:

- **Service Request Management**: Citizens submit requests via LIFF (LINE Front-end Framework)
- **Live Chat Operations**: Real-time operator-to-user messaging with WebSocket
- **Chatbot Automation**: Intent-based auto-replies with keyword matching
- **Rich Menu Configuration**: Visual menu builder with LINE API sync
- **Admin Dashboard**: Statistics, analytics, and system management

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 16)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Admin   │  │   LIFF   │  │ WebSocket│  │   REST Client    │ │
│  │Dashboard │  │  Mini-App│  │  Client  │  │                  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼──────────┘
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  LINE    │  │ WebSocket│  │ Services │  │    REST API      │ │
│  │ Webhook  │  │ Handler  │  │  Layer   │  │   Endpoints      │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼──────────┘
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Data Layer (PostgreSQL + Redis)                     │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│  │  19 Tables (SQLAlchemy│  │  WebSocket State (In-Memory)   │  │
│  │  Async ORM)           │  │  Rate Limiting (Sliding Window)│  │
│  └──────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Statistics

| Metric | Value |
|--------|-------|
| Backend Files | ~50 Python files |
| Frontend Files | ~40 TypeScript/TSX files |
| Database Tables | 19 (16 migrated, 3 pending) |
| API Endpoints | 40+ REST + 1 WebSocket |
| Alembic Migrations | 12 versions |
| Lines of Code | ~15,000+ |

---

## 2. Technology Stack

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.109.0+ |
| Runtime | Python | 3.11+ |
| ORM | SQLAlchemy (async) | 2.0.25+ |
| Database | PostgreSQL | 14+ |
| Migrations | Alembic | 1.13.1+ |
| HTTP Client | httpx | 0.26.0+ |
| LINE SDK | line-bot-sdk | 3.0.0+ |
| Auth | python-jose (JWT) | - |
| Validation | Pydantic | 2.5.0+ |
| Sanitization | bleach | 6.0.0+ |

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Charts | Recharts | 2.15.0 |
| Icons | Lucide React | 0.473.0 |
| LINE SDK | @line/liff | 2.27.3 |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Container | Docker Compose |
| Cache | Redis |
| OS | Windows (WSL2 required) |

---

## 3. Backend Architecture

### 3.1 Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                    # Dependency injection (DB sessions)
│   │   └── v1/
│   │       ├── api.py                 # Router registry
│   │       └── endpoints/
│   │           ├── webhook.py         # LINE webhook handler
│   │           ├── ws_live_chat.py    # WebSocket endpoint
│   │           ├── liff.py            # LIFF endpoints
│   │           ├── admin_live_chat.py # Live chat REST API
│   │           ├── admin_requests.py  # Service requests API
│   │           ├── admin_intents.py   # Chatbot intents API
│   │           ├── rich_menus.py      # Rich menu API
│   │           └── ...                # Other admin endpoints
│   ├── core/
│   │   ├── config.py                  # Environment settings
│   │   ├── line_client.py             # LINE SDK (lazy init)
│   │   ├── websocket_manager.py       # Connection manager
│   │   └── rate_limiter.py            # Sliding window limiter
│   ├── db/
│   │   ├── base.py                    # SQLAlchemy Base
│   │   └── session.py                 # AsyncSession factory
│   ├── models/                        # 17 SQLAlchemy models
│   ├── schemas/                       # Pydantic schemas
│   ├── services/                      # Business logic layer
│   └── main.py                        # FastAPI app init
├── alembic/                           # Database migrations
├── requirements.txt
└── tests/
```

### 3.2 Key Services

| Service | File | Purpose |
|---------|------|---------|
| LineService | `services/line_service.py` | LINE Messaging API wrapper |
| LiveChatService | `services/live_chat_service.py` | Session & message orchestration |
| TelegramService | `services/telegram_service.py` | Operator notifications |
| RichMenuService | `services/rich_menu_service.py` | Rich menu sync |
| CredentialService | `services/credential_service.py` | Encrypted credential storage |
| SettingsService | `services/settings_service.py` | System configuration |

### 3.3 Configuration (`core/config.py`)

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: PostgresDsn

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # LINE
    LINE_CHANNEL_ACCESS_TOKEN: str
    LINE_CHANNEL_SECRET: str
    LINE_LOGIN_CHANNEL_ID: str

    # WebSocket
    WS_RATE_LIMIT_MESSAGES: int = 30
    WS_RATE_LIMIT_WINDOW: int = 60
    WS_MAX_MESSAGE_LENGTH: int = 5000

    # Server
    SERVER_BASE_URL: str
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl]
```

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx                     # Root layout (Noto Sans Thai)
│   ├── page.tsx                       # Landing page
│   ├── globals.css                    # Tailwind v4 theme
│   ├── admin/
│   │   ├── layout.tsx                 # Admin sidebar layout
│   │   ├── page.tsx                   # Dashboard
│   │   ├── requests/                  # Service request management
│   │   ├── live-chat/                 # Real-time messaging
│   │   ├── chatbot/                   # Intent configuration
│   │   ├── rich-menus/                # Rich menu builder
│   │   └── settings/                  # System settings
│   └── liff/
│       ├── layout.tsx                 # LIFF SDK loader
│       └── request-v2/                # Service request form
├── components/
│   ├── ui/                            # Reusable UI (Button, Card, Modal, etc.)
│   └── admin/                         # Admin-specific components
├── hooks/
│   ├── useWebSocket.ts                # WebSocket React wrapper
│   ├── useLiveChatSocket.ts           # Live chat hook
│   └── useTheme.ts                    # Dark mode toggle
├── lib/
│   └── websocket/
│       ├── client.ts                  # WebSocketClient class
│       ├── messageQueue.ts            # Message buffering
│       ├── reconnectStrategy.ts       # Exponential backoff
│       └── types.ts                   # TypeScript interfaces
└── types/
    └── location.ts                    # Geography types
```

### 4.2 Key Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Landing page with links |
| `/admin` | Server | Dashboard with stats/charts |
| `/admin/requests` | Client | Service request management |
| `/admin/live-chat` | Client | Real-time messaging UI |
| `/admin/chatbot` | Server | Intent overview |
| `/admin/settings/line` | Client | LINE credentials |
| `/liff/request-v2` | Client | 4-step service request form |

### 4.3 Component Library

**UI Components (`components/ui/`):**
- `Button` - 8 variants, loading state, icons
- `Card` - hover/glass variants, subcomponents
- `Badge` - 6 colors with outline option
- `Alert` - closable with icons
- `Modal` - portal-based, 5 sizes
- `Tabs` - tab navigation

**Admin Components (`components/admin/`):**
- `ChatModeToggle` - BOT/HUMAN mode switcher
- `TypingIndicator` - animated dots
- `AssignModal` - agent assignment with workload

### 4.4 Color System

```css
/* globals.css @theme */
--color-primary: #7367F0;    /* Indigo */
--color-success: #28C76F;    /* Green */
--color-danger: #EA5455;     /* Red */
--color-warning: #FF9F43;    /* Orange */
--color-info: #00CFE8;       /* Cyan */
--color-background: #F8F8F9;
--color-foreground: #2f2b3d;
```

---

## 5. Database Schema

### 5.1 Entity-Relationship Overview

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    User     │────▶│ ServiceRequest  │◀────│RequestComment│
│             │     │                 │     │              │
│ line_user_id│     │ line_user_id    │     │ CASCADE      │
│ chat_mode   │     │ status          │     └──────────────┘
│ role        │     │ priority        │
└──────┬──────┘     └─────────────────┘
       │
       │ operator_id
       ▼
┌─────────────┐     ┌─────────────────┐
│ ChatSession │     │    Message      │
│             │     │                 │
│ status      │     │ line_user_id    │
│ WAITING     │     │ direction       │
│ ACTIVE      │     │ sender_role     │
│ CLOSED      │     │ operator_name   │
└─────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ IntentCategory  │────▶│ IntentKeyword   │     │ IntentResponse│
│                 │     │                 │     │              │
│ name (unique)   │     │ match_type      │     │ reply_type   │
│ CASCADE DELETE  │     │ keyword         │     │ payload      │
└─────────────────┘     └─────────────────┘     └──────────────┘
```

### 5.2 Table Summary (19 Tables)

| # | Table | Status | Purpose |
|---|-------|--------|---------|
| 1 | users | ✅ Active | User accounts (LINE users + admins) |
| 2 | organizations | ✅ Active | Organization hierarchy |
| 3 | bookings | ✅ Active | Appointment queue |
| 4 | service_requests | ✅ Active | Citizen service requests |
| 5 | messages | ✅ Active | Chat message log |
| 6 | chat_sessions | ✅ Active | Live chat sessions |
| 7 | friend_events | ✅ Active | LINE follow/unfollow |
| 8 | chat_analytics | ✅ Active | Operator metrics |
| 9 | intent_categories | ✅ Active | Chatbot intents |
| 10 | intent_keywords | ✅ Active | Intent triggers |
| 11 | intent_responses | ✅ Active | Intent replies |
| 12 | auto_replies | ✅ Active | Legacy auto-reply |
| 13 | reply_objects | ✅ Active | Message templates |
| 14 | rich_menus | ✅ Active | LINE rich menus |
| 15 | media_files | ✅ Active | Binary storage |
| 16 | system_settings | ✅ Active | Key-value config |
| 17 | credentials | ✅ Active | Encrypted tokens |
| 18 | provinces | ⚠️ Pending | Thai geography |
| 19 | districts | ⚠️ Pending | Thai geography |
| 20 | sub_districts | ⚠️ Pending | Thai geography |
| 21 | request_comments | ⚠️ Pending | Request comments |

### 5.3 Key Enums

```python
# User Roles
UserRole = SUPER_ADMIN | ADMIN | AGENT | USER

# Chat Mode
ChatMode = BOT | HUMAN

# Message Direction
MessageDirection = INCOMING | OUTGOING

# Sender Role
SenderRole = USER | BOT | ADMIN

# Request Status
RequestStatus = PENDING | IN_PROGRESS | AWAITING_APPROVAL | COMPLETED | REJECTED

# Request Priority
RequestPriority = LOW | MEDIUM | HIGH | URGENT

# Match Type
MatchType = EXACT | CONTAINS | REGEX | STARTS_WITH

# Reply Type
ReplyType = TEXT | IMAGE | VIDEO | AUDIO | LOCATION | STICKER | FLEX | TEMPLATE | IMAGEMAP | HANDOFF

# Rich Menu Status
RichMenuStatus = DRAFT | PUBLISHED | INACTIVE
```

### 5.4 Migration History

| Revision | Description | Type |
|----------|-------------|------|
| 1349087a4a24 | Initial tables | Auto |
| d2df2a419a56 | Add messages | Auto |
| 9aef5616e35e | Auto-replies & media | Auto |
| cd2257cee794 | Reply objects | Auto |
| add_system_settings | System settings | Manual |
| e3f4g5h6i7j8 | Rich menus | Manual |
| f1a2b3c4d5e6 | Live chat & credentials | Manual |
| add_sync_status_to_rich_menus | Rich menu sync | Manual |
| 8a9b1c2d3e4f | Intent tables | Manual |
| 157caa418be7 | Merge heads (1st) | Merge |
| a9b8c7d6e5f4 | Operator name | Manual |
| cfac53729da9 | Merge heads (2nd) | Merge |

---

## 6. WebSocket Real-Time System

### 6.1 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │useLiveChatSocket│  │ MessageQueue  │  │ExponentialBackoff│  │
│  │                │  │ (max 100)     │  │ (max 30s)        │  │
│  └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘  │
│          │                   │                    │            │
│          ▼                   ▼                    ▼            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │               WebSocketClient                              │ │
│  │  States: disconnected → connecting → authenticating →      │ │
│  │          connected ↔ reconnecting                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬─────────────────────────────────┘
                               │ ws://host/api/v1/ws/live-chat
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │               ws_live_chat.py                              │ │
│  │  • JWT/admin_id authentication                             │ │
│  │  • Rate limiting (30 msg/60s)                              │ │
│  │  • Message validation & sanitization                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                               │                                 │
│                               ▼                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            ConnectionManager (websocket_manager.py)        │ │
│  │  • connections: Dict[admin_id → Set[WebSocket]]           │ │
│  │  • rooms: Dict[room_id → Set[admin_id]]                   │ │
│  │  • Room ID: "conversation:{line_user_id}"                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Event Protocol

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `auth` | `{admin_id, token?}` | Authenticate connection |
| `join_room` | `{line_user_id}` | Enter conversation |
| `leave_room` | - | Exit current room |
| `send_message` | `{text, temp_id?}` | Send message to LINE user |
| `typing_start` | `{line_user_id}` | Show typing indicator |
| `typing_stop` | `{line_user_id}` | Hide typing indicator |
| `claim_session` | - | Operator claims session |
| `close_session` | - | End session |
| `ping` | - | Keepalive (25s interval) |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `auth_success` | `{admin_id}` | Authentication approved |
| `auth_error` | `{message, code}` | Authentication failed |
| `new_message` | `{message}` | Incoming LINE message |
| `message_sent` | `{id, temp_id, created_at}` | Send confirmation |
| `message_ack` | `{id, temp_id}` | Message acknowledged |
| `message_failed` | `{temp_id, error}` | Send failed |
| `typing_indicator` | `{line_user_id, typing}` | Typing status |
| `session_claimed` | `{session_id, operator_id}` | Session claimed |
| `session_closed` | `{session_id, closed_by}` | Session ended |
| `presence_update` | `{operators: [...]}` | Online operators list |
| `conversation_update` | `{...full state}` | Full conversation snapshot |
| `operator_joined` | `{admin_id, room_id}` | Operator entered room |
| `operator_left` | `{admin_id, room_id}` | Operator left room |
| `pong` | - | Keepalive response |
| `error` | `{message, code}` | Error message |

### 6.3 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_TOKEN` | JWT validation failed |
| `AUTH_EXPIRED_TOKEN` | Token expired |
| `AUTH_MISSING_TOKEN` | No token provided |
| `RATE_LIMIT_EXCEEDED` | Too many messages |
| `VALIDATION_ERROR` | Schema validation failed |
| `MESSAGE_TOO_LONG` | Exceeds 5000 chars |
| `NOT_AUTHENTICATED` | Must auth first |
| `NOT_IN_ROOM` | Must join room first |

### 6.4 Reconnection Strategy

```
Attempt 1: 1s + jitter (0-1s)
Attempt 2: 2s + jitter
Attempt 3: 4s + jitter
Attempt 4: 8s + jitter
Attempt 5: 16s + jitter
Attempt 6-10: 30s + jitter (capped)
```

---

## 7. LINE Integration

### 7.1 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Webhook Handler | `backend/app/api/v1/endpoints/webhook.py` | Process LINE events |
| LINE Service | `backend/app/services/line_service.py` | API wrapper |
| LINE Client | `backend/app/core/line_client.py` | SDK initialization |
| LIFF Layout | `frontend/app/liff/layout.tsx` | LIFF SDK loader |
| LIFF Form | `frontend/app/liff/request-v2/page.tsx` | Service request form |
| Rich Menu Service | `backend/app/services/rich_menu_service.py` | Menu sync |
| Flex Messages | `backend/app/services/flex_messages.py` | Message templates |

### 7.2 Webhook Flow

```
LINE Platform
     │
     │ POST /api/v1/line/webhook
     │ X-Line-Signature: <hmac>
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    webhook.py                                │
│                                                              │
│  1. Validate X-Line-Signature (WebhookParser)               │
│  2. Parse events (MessageEvent, PostbackEvent)              │
│  3. Add to BackgroundTasks                                  │
│                                                              │
│  handle_message_event():                                     │
│    • Save message to DB (INCOMING)                          │
│    • Broadcast to WebSocket                                 │
│    • Show loading animation                                 │
│    • Check special commands (ติดตาม/สถานะ/phone)            │
│    • Route based on chat_mode:                              │
│      - BOT: Intent matching → auto-reply                    │
│      - HUMAN: Forward to operator                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Intent Matching Pipeline

```
User Message
     │
     ▼
┌─────────────────────────────────────────┐
│ 1. EXACT Match (IntentKeyword)          │
│    SELECT * FROM intent_keywords        │
│    WHERE keyword = :text                │
│    AND match_type = 'exact'             │
└─────────────────────────────────────────┘
     │ No match
     ▼
┌─────────────────────────────────────────┐
│ 2. Legacy EXACT (AutoReply)             │
│    SELECT * FROM auto_replies           │
│    WHERE keyword = :text                │
│    AND match_type = 'exact'             │
└─────────────────────────────────────────┘
     │ No match
     ▼
┌─────────────────────────────────────────┐
│ 3. CONTAINS Match (IntentKeyword)       │
│    SELECT * FROM intent_keywords        │
│    WHERE :text ILIKE '%' || keyword || '%'│
│    AND match_type = 'contains'          │
└─────────────────────────────────────────┘
     │
     ▼
Build Response (max 5 messages per LINE API)
```

### 7.4 Live Chat Session Flow

```
User in BOT mode
     │
     │ Triggers handoff (keyword or button)
     ▼
┌─────────────────────────────────────────┐
│ initiate_handoff()                       │
│  • user.chat_mode = HUMAN               │
│  • Create ChatSession (WAITING)         │
│  • Send greeting message                │
│  • Notify operators (Telegram)          │
└─────────────────────────────────────────┘
     │
     ▼
Operator sees in Live Chat UI
     │
     │ Clicks "Claim"
     ▼
┌─────────────────────────────────────────┐
│ claim_session()                          │
│  • session.status = ACTIVE              │
│  • session.operator_id = operator_id    │
│  • session.claimed_at = now()           │
│  • Broadcast session_claimed event      │
└─────────────────────────────────────────┘
     │
     ▼
Operator sends messages via WebSocket
     │
     │ push_messages() to LINE
     ▼
User receives message in LINE app
     │
     │ Operator clicks "Close"
     ▼
┌─────────────────────────────────────────┐
│ close_session()                          │
│  • session.status = CLOSED              │
│  • session.closed_at = now()            │
│  • user.chat_mode = BOT                 │
│  • Broadcast session_closed event       │
└─────────────────────────────────────────┘
```

---

## 8. API Reference

### 8.1 REST Endpoints

**LINE & LIFF:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/line/webhook` | LINE webhook receiver |
| POST | `/api/v1/liff/service-requests` | Create service request |

**Live Chat:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/live-chat/conversations` | List conversations |
| GET | `/admin/live-chat/conversations/{id}` | Get detail |
| POST | `/admin/live-chat/conversations/{id}/messages` | Send message |
| POST | `/admin/live-chat/conversations/{id}/claim` | Claim session |
| POST | `/admin/live-chat/conversations/{id}/close` | Close session |
| POST | `/admin/live-chat/conversations/{id}/mode` | Toggle chat mode |

**Service Requests:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/requests` | List requests |
| GET | `/admin/requests/stats` | Statistics |
| GET | `/admin/requests/stats/monthly` | Monthly chart |
| GET | `/admin/requests/stats/workload` | Agent workload |
| POST | `/admin/requests/{id}/assign` | Assign to agent |

**Intents:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/intents/categories` | List categories |
| POST | `/admin/intents/categories` | Create category |
| GET | `/admin/intents/categories/{id}` | Get with keywords/responses |
| PUT | `/admin/intents/categories/{id}` | Update category |
| DELETE | `/admin/intents/categories/{id}` | Delete category |

**Rich Menus:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/rich-menus` | List menus |
| POST | `/admin/rich-menus` | Create menu |
| POST | `/admin/rich-menus/{id}/upload` | Upload image |
| POST | `/admin/rich-menus/{id}/sync` | Sync to LINE |
| POST | `/admin/rich-menus/{id}/publish` | Set as default |
| DELETE | `/admin/rich-menus/{id}` | Delete menu |

### 8.2 WebSocket Endpoint

```
WS /api/v1/ws/live-chat
```

See [Section 6.2](#62-event-protocol) for event protocol.

---

## 9. Security & Authentication

### 9.1 JWT Authentication

```python
# Configuration
SECRET_KEY: str              # From environment
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

# Token Claims
{
    "sub": "<admin_id>",
    "exp": <expiration_timestamp>
}
```

### 9.2 LINE Webhook Signature

```python
# Validation
parser = WebhookParser(settings.LINE_CHANNEL_SECRET)
events = parser.parse(body, x_line_signature)  # Raises InvalidSignatureError
```

### 9.3 Input Validation

```python
# Message sanitization (ws_events.py)
@field_validator('text', mode='before')
def sanitize_text(cls, v: str) -> str:
    cleaned = bleach.clean(v, tags=[], strip=True)  # Remove HTML
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()  # Normalize whitespace
    return cleaned

# LINE user ID validation
line_user_id: str = Field(..., pattern=r'^U[a-f0-9]{32}$')
```

### 9.4 Rate Limiting

```python
# WebSocket rate limiting (sliding window)
max_messages: int = 30
window_seconds: int = 60

# Algorithm:
# 1. Remove timestamps older than (now - window)
# 2. Check if bucket size >= max_messages
# 3. If under limit, add current timestamp and allow
```

### 9.5 Credential Encryption

```python
# Fernet encryption (AES-128)
from cryptography.fernet import Fernet

cipher = Fernet(settings.ENCRYPTION_KEY)
encrypted = cipher.encrypt(json.dumps(credentials).encode())
decrypted = json.loads(cipher.decrypt(encrypted).decode())
```

---

## 10. Key Design Patterns

### 10.1 Async-First Architecture

All I/O operations use async/await:

```python
async def get_user(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

### 10.2 Lazy Initialization

LINE SDK requires event loop at runtime:

```python
# line_client.py
_line_bot_api: Optional[AsyncMessagingApi] = None

def get_line_bot_api() -> AsyncMessagingApi:
    global _line_bot_api
    if _line_bot_api is None:
        _line_bot_api = AsyncMessagingApi(get_async_api_client())
    return _line_bot_api
```

### 10.3 Singleton Services

```python
# Service instances
line_service = LineService()
ws_manager = ConnectionManager()
telegram_service = TelegramService()
live_chat_service = LiveChatService()
```

### 10.4 Dependency Injection

```python
# FastAPI Depends
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/")
async def endpoint(db: AsyncSession = Depends(get_db)):
    # db is injected
```

### 10.5 Room-Based Broadcasting

```python
# WebSocket rooms
room_id = f"conversation:{line_user_id}"
await ws_manager.broadcast_to_room(room_id, event_data, exclude_admin=sender_id)
```

### 10.6 Optimistic UI

```typescript
// Frontend: Add message immediately
setMessages(prev => [...prev, optimisticMessage]);

// Then send via WebSocket
wsSendMessage(text, tempId);

// On ACK: Update with real ID
// On FAIL: Show retry option
```

### 10.7 Message Queuing

```typescript
// Queue messages when disconnected
messageQueue.enqueue(type, payload);

// Process on reconnect
while (!messageQueue.isEmpty()) {
    const msg = messageQueue.dequeue();
    await send(msg.type, msg.payload);
}
```

---

## 11. File Reference Index

### 11.1 Backend Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `app/main.py` | 1-74 | FastAPI app initialization |
| `app/core/config.py` | 1-43 | Environment settings |
| `app/core/line_client.py` | 1-33 | LINE SDK lazy init |
| `app/core/websocket_manager.py` | 1-184 | Connection manager |
| `app/core/rate_limiter.py` | 1-90 | Sliding window limiter |
| `app/api/v1/api.py` | 1-36 | Router registry |
| `app/api/v1/endpoints/webhook.py` | 1-350 | LINE webhook handler |
| `app/api/v1/endpoints/ws_live_chat.py` | 1-500 | WebSocket endpoint |
| `app/services/line_service.py` | 1-130 | LINE API wrapper |
| `app/services/live_chat_service.py` | 1-334 | Chat orchestration |
| `app/models/user.py` | 1-51 | User model |
| `app/models/message.py` | 1-36 | Message model |
| `app/models/chat_session.py` | 1-32 | Session model |
| `app/models/intent.py` | 1-71 | Intent models |
| `app/schemas/ws_events.py` | 1-148 | WebSocket schemas |

### 11.2 Frontend Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `app/layout.tsx` | 1-27 | Root layout |
| `app/globals.css` | 1-57 | Tailwind theme |
| `app/admin/layout.tsx` | 1-242 | Admin sidebar |
| `app/admin/page.tsx` | 1-143 | Dashboard |
| `app/admin/live-chat/page.tsx` | 1-500+ | Live chat UI |
| `app/liff/request-v2/page.tsx` | 1-596 | LIFF form |
| `hooks/useWebSocket.ts` | 1-67 | WebSocket hook |
| `hooks/useLiveChatSocket.ts` | 1-224 | Live chat hook |
| `lib/websocket/client.ts` | 1-256 | WebSocket client |
| `lib/websocket/messageQueue.ts` | 1-76 | Message buffering |
| `lib/websocket/types.ts` | 1-126 | TypeScript types |
| `components/ui/Button.tsx` | 1-55 | Button component |
| `components/ui/Modal.tsx` | 1-82 | Modal component |

---

## 12. Recommendations

### 12.1 Critical Issues

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Missing Geography Migration | Medium | Create migration for provinces/districts/sub_districts |
| Missing RequestComments Migration | Low | Create migration before using comment feature |
| Media in Database | Medium | Consider migrating to S3/R2 for scalability |
| Dev Mode Auth | High | Remove `admin_id` auth in production |

### 12.2 Performance Improvements

| Area | Current | Recommended |
|------|---------|-------------|
| Message Table | No partitioning | Partition by date or line_user_id |
| Media Storage | LargeBinary in DB | External storage (S3/R2) |
| Chat Analytics | Full table scan | Add composite index on (date, operator_id) |
| WebSocket | In-memory state | Consider Redis for horizontal scaling |

### 12.3 Code Quality

| Area | Recommendation |
|------|----------------|
| Models | Add missing models to `__init__.py` exports |
| Tests | Increase test coverage (currently minimal) |
| Documentation | Add OpenAPI descriptions to all endpoints |
| Logging | Add structured logging with correlation IDs |

### 12.4 Security Hardening

| Area | Recommendation |
|------|----------------|
| WebSocket | Require JWT in production (remove dev mode) |
| CORS | Restrict to specific domains in production |
| Rate Limiting | Add per-IP rate limiting for REST endpoints |
| Secrets | Use vault/secret manager instead of env vars |

---

## Appendix A: Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sknapp

# Security
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-fernet-key-here

# LINE
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret
LINE_LOGIN_CHANNEL_ID=your-channel-id

# Server
SERVER_BASE_URL=https://your-domain.com
ADMIN_URL=/admin

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_LIFF_ID=your-liff-id
```

---

## Appendix B: Development Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Database
cd backend
alembic upgrade head          # Apply all migrations
alembic revision --autogenerate -m "description"  # Generate migration
alembic downgrade -1          # Rollback one step

# Docker
docker-compose up -d db redis  # Start database and Redis
```

---

**End of Report**

*Generated by Claude Code analysis agents on 2026-02-04*
