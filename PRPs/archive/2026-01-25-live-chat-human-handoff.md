# PRP: Live Chat Human Handoff System

**Created:** 2026-01-25
**Status:** Draft
**Author:** Claude Code (Brainstorming Session)

---

## Executive Summary

This document outlines the implementation plan for a **Live Chat Human Handoff System** for the SknApp LINE Official Account platform. The system enables seamless transition from bot to human operator support while keeping users in LINE, with admin notifications via Telegram.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Telegram Integration](#6-telegram-integration)
7. [Multi-Credential Management](#7-multi-credential-management)
8. [Analytics & Metrics](#8-analytics--metrics)
9. [Implementation Phases](#9-implementation-phases)
10. [File Structure](#10-file-structure)
11. [UX Enhancements](#11-ux-enhancements)

---

## 1. Overview

### Goals

- Enable users to request human support via configurable keywords
- Route messages to admin panel when in "human mode"
- Provide inbox-style chat interface for operators
- Track friend status (follow/unfollow/refollow) with full history
- Send Telegram notifications when users request human chat
- Store complete chat history with analytics
- Support multiple credential types (LINE, Telegram, N8N, Google Sheets)

### Key Features

| Feature | Description |
|---------|-------------|
| **Human Handoff** | Configurable keywords trigger handoff via Intent system |
| **Live Chat Inbox** | Left sidebar conversations, right panel chat view |
| **Bot/Manual Toggle** | Per-user mode switching with immediate effect |
| **Telegram Alerts** | Notify admin group with user context and direct link |
| **Auto-Greeting** | System message when handoff triggers |
| **Friend Tracking** | Full event history for analytics |
| **Chat Analytics** | Response time, resolution time, operator performance |
| **Multi-Credentials** | Manage LINE, Telegram, N8N, Google Sheets credentials |

---

## 2. Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LINE User                                    │
│  1. Sends keyword (e.g., "ติดต่อเจ้าหน้าที่")                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LINE Webhook (existing)                          │
│  2. Detects handoff intent → Sets user.chat_mode = HUMAN            │
│  3. Sends auto-greeting to user                                     │
│  4. Sends Telegram notification to admin group                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 Admin Panel - Live Chat Page                        │
│  5. Shows new chat in inbox with notification badge                 │
│  6. Operator claims chat, reads context, responds                   │
│  7. Messages sent via LINE Push API                                 │
│  8. Toggle back to BOT mode when resolved                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Message Routing Logic

```
Message received
       ↓
Check user.chat_mode
       ↓
┌──────┴──────┐
BOT           HUMAN
↓             ↓
Intent        Save message
matching      Notify admin panel
↓             (no bot response)
HANDOFF?
↓ Yes
Set HUMAN mode
Send greeting
Telegram notify
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **Webhook Handler** | Route messages based on `chat_mode` |
| **Live Chat Page** | Inbox UI for operators (`/admin/live-chat`) |
| **Telegram Service** | Send notifications to admin group |
| **Friend Events Table** | Log follow/unfollow history |
| **Chat Sessions Table** | Track handoff sessions for analytics |
| **Credentials Table** | Store multi-provider credentials |

---

## 3. Database Schema

### 3.1 New Tables

#### `friend_events` - Track friend status changes

```sql
CREATE TABLE friend_events (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL,  -- FOLLOW | UNFOLLOW | REFOLLOW
    source VARCHAR(20) DEFAULT 'WEBHOOK',  -- WEBHOOK | MANUAL
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_friend_events_line_user ON friend_events(line_user_id);
CREATE INDEX idx_friend_events_created ON friend_events(created_at);
```

#### `chat_sessions` - Track human handoff sessions

```sql
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(50) NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',  -- WAITING | ACTIVE | CLOSED
    started_at TIMESTAMP DEFAULT NOW(),
    claimed_at TIMESTAMP,
    closed_at TIMESTAMP,
    first_response_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    closed_by VARCHAR(20)  -- OPERATOR | SYSTEM | USER
);

CREATE INDEX idx_chat_sessions_line_user ON chat_sessions(line_user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_operator ON chat_sessions(operator_id);
```

#### `chat_analytics` - Aggregated daily stats

```sql
CREATE TABLE chat_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    total_sessions INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    avg_resolution_time_seconds INTEGER,
    total_messages_sent INTEGER DEFAULT 0,
    UNIQUE(date, operator_id)
);

CREATE INDEX idx_chat_analytics_date ON chat_analytics(date);
```

#### `credentials` - Multi-provider credentials

```sql
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,  -- LINE | TELEGRAM | N8N | GOOGLE_SHEETS | CUSTOM
    credentials TEXT NOT NULL,  -- Encrypted JSONB
    metadata JSONB,  -- Non-sensitive config
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credentials_provider ON credentials(provider);
CREATE INDEX idx_credentials_active ON credentials(is_active);
```

### 3.2 Modified Tables

#### `users` - Add fields

```sql
ALTER TABLE users ADD COLUMN friend_status VARCHAR(20) DEFAULT 'ACTIVE';
-- ACTIVE | BLOCKED | UNFOLLOWED

ALTER TABLE users ADD COLUMN friend_since TIMESTAMP;
ALTER TABLE users ADD COLUMN last_message_at TIMESTAMP;
```

#### `intent_responses` - Add HANDOFF type

```sql
-- Add HANDOFF to reply_type enum
ALTER TYPE reply_type ADD VALUE 'HANDOFF';
```

### 3.3 Credential Schemas per Provider

| Provider | Credentials (encrypted) | Metadata |
|----------|------------------------|----------|
| **LINE** | `channel_secret`, `channel_access_token` | `channel_id`, `bot_name`, `liff_id` |
| **TELEGRAM** | `bot_token` | `bot_username`, `admin_chat_id` |
| **N8N** | `api_key` | `base_url`, `webhook_url` |
| **GOOGLE_SHEETS** | `service_account_json` | `spreadsheet_id`, `sheet_name` |
| **CUSTOM** | `api_key`, `api_secret` | `base_url`, `headers` |

---

## 4. Backend Implementation

### 4.1 New Models

#### `backend/app/models/friend_event.py`

```python
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class FriendEventType(str, Enum):
    FOLLOW = "FOLLOW"
    UNFOLLOW = "UNFOLLOW"
    REFOLLOW = "REFOLLOW"

class EventSource(str, Enum):
    WEBHOOK = "WEBHOOK"
    MANUAL = "MANUAL"

class FriendEvent(Base):
    __tablename__ = "friend_events"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(20), nullable=False)
    source = Column(String(20), default=EventSource.WEBHOOK)
    created_at = Column(DateTime, server_default=func.now())
```

#### `backend/app/models/chat_session.py`

```python
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class SessionStatus(str, Enum):
    WAITING = "WAITING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class ClosedBy(str, Enum):
    OPERATOR = "OPERATOR"
    SYSTEM = "SYSTEM"
    USER = "USER"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String(50), nullable=False, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default=SessionStatus.WAITING)
    started_at = Column(DateTime, server_default=func.now())
    claimed_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    first_response_at = Column(DateTime, nullable=True)
    message_count = Column(Integer, default=0)
    closed_by = Column(String(20), nullable=True)

    operator = relationship("User", back_populates="chat_sessions")
```

#### `backend/app/models/credential.py`

```python
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database import Base

class Provider(str, Enum):
    LINE = "LINE"
    TELEGRAM = "TELEGRAM"
    N8N = "N8N"
    GOOGLE_SHEETS = "GOOGLE_SHEETS"
    CUSTOM = "CUSTOM"

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False, index=True)
    credentials = Column(Text, nullable=False)  # Encrypted
    metadata = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

### 4.2 New Services

#### `backend/app/services/telegram_service.py`

```python
import httpx
from app.core.config import settings

class TelegramService:
    def __init__(self):
        self.bot_token = None
        self.chat_id = None

    async def load_credentials(self, db):
        """Load Telegram credentials from database"""
        # Get default Telegram credential
        credential = await credential_service.get_default_credential(
            Provider.TELEGRAM, db
        )
        if credential:
            decrypted = credential_service.decrypt_credentials(credential.credentials)
            self.bot_token = decrypted.get("bot_token")
            self.chat_id = credential.metadata.get("admin_chat_id")

    async def send_handoff_notification(
        self,
        user_display_name: str,
        user_picture_url: str | None,
        recent_messages: list,
        admin_panel_url: str,
        db
    ) -> bool:
        """Send notification to Telegram admin group"""
        await self.load_credentials(db)

        if not self.bot_token or not self.chat_id:
            return False

        # Format message
        messages_text = "\n".join([f"• \"{m.content}\"" for m in recent_messages])

        text = f"""🔔 ผู้ใช้ขอคุยกับเจ้าหน้าที่

👤 ชื่อ: {user_display_name}

💬 ข้อความล่าสุด:
{messages_text}

🔗 เปิดแชท: {admin_panel_url}"""

        # Send to Telegram
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": "HTML"
            })
            return response.status_code == 200

telegram_service = TelegramService()
```

#### `backend/app/services/live_chat_service.py`

```python
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.user import User, ChatMode
from app.models.chat_session import ChatSession, SessionStatus, ClosedBy
from app.models.message import Message
from app.services.line_service import line_service
from app.services.telegram_service import telegram_service
from app.core.config import settings

class LiveChatService:
    async def initiate_handoff(
        self,
        user: User,
        reply_token: str,
        db: AsyncSession,
        background_tasks
    ):
        """Initiate human handoff for a user"""
        # 1. Update user mode
        user.chat_mode = ChatMode.HUMAN

        # 2. Create chat session
        session = ChatSession(
            line_user_id=user.line_user_id,
            status=SessionStatus.WAITING,
            started_at=datetime.utcnow()
        )
        db.add(session)

        # 3. Send auto-greeting
        greeting = "เจ้าหน้าที่จะติดต่อกลับในไม่ช้า กรุณารอสักครู่"
        await line_service.reply_text(reply_token, greeting)

        # 4. Telegram notification (background)
        recent_msgs = await self.get_recent_messages(user.line_user_id, 3, db)
        admin_url = f"{settings.ADMIN_URL}/admin/live-chat?user={user.line_user_id}"

        background_tasks.add_task(
            telegram_service.send_handoff_notification,
            user.display_name or "Unknown",
            user.picture_url,
            recent_msgs,
            admin_url,
            db
        )

        await db.commit()
        return session

    async def claim_session(
        self,
        line_user_id: str,
        operator_id: int,
        db: AsyncSession
    ):
        """Operator claims a chat session"""
        session = await self.get_active_session(line_user_id, db)
        if session and session.status == SessionStatus.WAITING:
            session.operator_id = operator_id
            session.status = SessionStatus.ACTIVE
            session.claimed_at = datetime.utcnow()
            await db.commit()
        return session

    async def close_session(
        self,
        line_user_id: str,
        closed_by: ClosedBy,
        db: AsyncSession
    ):
        """Close a chat session and return to bot mode"""
        session = await self.get_active_session(line_user_id, db)
        if session:
            session.status = SessionStatus.CLOSED
            session.closed_at = datetime.utcnow()
            session.closed_by = closed_by

        # Return user to bot mode
        user = await self.get_user_by_line_id(line_user_id, db)
        if user:
            user.chat_mode = ChatMode.BOT

        await db.commit()
        return session

    async def get_conversations(
        self,
        status: str | None,
        db: AsyncSession
    ):
        """Get all conversations for inbox"""
        # Implementation: join users, sessions, get last message
        pass

    async def get_recent_messages(
        self,
        line_user_id: str,
        limit: int,
        db: AsyncSession
    ):
        """Get recent messages for a user"""
        result = await db.execute(
            select(Message)
            .where(Message.line_user_id == line_user_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        return list(reversed(result.scalars().all()))

    async def get_active_session(self, line_user_id: str, db: AsyncSession):
        """Get active session for user"""
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.line_user_id == line_user_id)
            .where(ChatSession.status.in_([SessionStatus.WAITING, SessionStatus.ACTIVE]))
            .order_by(ChatSession.started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

live_chat_service = LiveChatService()
```

#### `backend/app/services/credential_service.py`

```python
from cryptography.fernet import Fernet
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.credential import Credential, Provider
from app.core.config import settings

class CredentialService:
    def __init__(self):
        self.cipher = Fernet(settings.ENCRYPTION_KEY.encode())

    def encrypt_credentials(self, data: dict) -> str:
        """Encrypt credentials dict to string"""
        json_str = json.dumps(data)
        return self.cipher.encrypt(json_str.encode()).decode()

    def decrypt_credentials(self, encrypted: str) -> dict:
        """Decrypt credentials string to dict"""
        decrypted = self.cipher.decrypt(encrypted.encode())
        return json.loads(decrypted.decode())

    async def get_default_credential(
        self,
        provider: Provider,
        db: AsyncSession
    ) -> Credential | None:
        """Get default active credential for a provider"""
        result = await db.execute(
            select(Credential)
            .where(Credential.provider == provider)
            .where(Credential.is_active == True)
            .where(Credential.is_default == True)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def verify_line_connection(self, credential: Credential) -> dict:
        """Verify LINE credential by calling API"""
        decrypted = self.decrypt_credentials(credential.credentials)
        # Call LINE API to verify token
        # Return { success: bool, message: str, bot_info: dict }
        pass

    async def verify_telegram_connection(self, credential: Credential) -> dict:
        """Verify Telegram credential by calling getMe"""
        decrypted = self.decrypt_credentials(credential.credentials)
        # Call Telegram getMe API
        # Return { success: bool, message: str, bot_username: str }
        pass

    async def set_default(
        self,
        credential_id: int,
        db: AsyncSession
    ):
        """Set credential as default for its provider"""
        credential = await db.get(Credential, credential_id)
        if not credential:
            return None

        # Unset other defaults for this provider
        await db.execute(
            update(Credential)
            .where(Credential.provider == credential.provider)
            .where(Credential.id != credential_id)
            .values(is_default=False)
        )

        credential.is_default = True
        await db.commit()
        return credential

credential_service = CredentialService()
```

### 4.3 API Endpoints

#### `backend/app/api/v1/endpoints/live_chat.py`

```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.services.live_chat_service import live_chat_service
from app.schemas.live_chat import (
    ConversationList, ConversationDetail,
    SendMessageRequest, ModeToggleRequest
)

router = APIRouter(prefix="/admin/live-chat", tags=["Live Chat"])

@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all conversations for inbox"""
    return await live_chat_service.get_conversations(status, db)

@router.get("/conversations/{line_user_id}", response_model=ConversationDetail)
async def get_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get full chat history with a user"""
    return await live_chat_service.get_conversation_detail(line_user_id, db)

@router.post("/conversations/{line_user_id}/messages")
async def send_message(
    line_user_id: str,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send message to user via LINE"""
    return await live_chat_service.send_message(
        line_user_id, request, current_user.id, db
    )

@router.post("/conversations/{line_user_id}/claim")
async def claim_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Operator claims the chat session"""
    return await live_chat_service.claim_session(
        line_user_id, current_user.id, db
    )

@router.post("/conversations/{line_user_id}/close")
async def close_conversation(
    line_user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Close session and return to bot mode"""
    return await live_chat_service.close_session(
        line_user_id, ClosedBy.OPERATOR, db
    )

@router.post("/conversations/{line_user_id}/mode")
async def toggle_mode(
    line_user_id: str,
    request: ModeToggleRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Toggle chat mode: BOT | HUMAN"""
    return await live_chat_service.set_chat_mode(
        line_user_id, request.mode, db
    )

@router.get("/analytics")
async def get_analytics(
    from_date: str | None = None,
    to_date: str | None = None,
    operator_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get chat analytics dashboard data"""
    return await live_chat_service.get_analytics(
        from_date, to_date, operator_id, db
    )

@router.get("/analytics/operators")
async def get_operator_stats(
    from_date: str | None = None,
    to_date: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get per-operator performance metrics"""
    return await live_chat_service.get_operator_analytics(
        from_date, to_date, db
    )
```

#### `backend/app/api/v1/endpoints/credentials.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.services.credential_service import credential_service
from app.schemas.credential import (
    CredentialCreate, CredentialUpdate,
    CredentialResponse, CredentialListResponse
)

router = APIRouter(prefix="/admin/credentials", tags=["Credentials"])

@router.get("", response_model=CredentialListResponse)
async def list_credentials(
    provider: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all credentials (secrets masked)"""
    return await credential_service.list_credentials(provider, db)

@router.post("", response_model=CredentialResponse)
async def create_credential(
    request: CredentialCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new credential"""
    return await credential_service.create_credential(request, db)

@router.get("/{id}", response_model=CredentialResponse)
async def get_credential(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get single credential (secrets masked)"""
    return await credential_service.get_credential(id, db)

@router.put("/{id}", response_model=CredentialResponse)
async def update_credential(
    id: int,
    request: CredentialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update credential"""
    return await credential_service.update_credential(id, request, db)

@router.delete("/{id}")
async def delete_credential(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete credential"""
    return await credential_service.delete_credential(id, db)

@router.post("/{id}/verify")
async def verify_credential(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Test connection for credential"""
    return await credential_service.verify_credential(id, db)

@router.post("/{id}/set-default")
async def set_default_credential(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Set as default for provider"""
    return await credential_service.set_default(id, db)
```

#### `backend/app/api/v1/endpoints/friends.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.services.friend_service import friend_service
from app.schemas.friend import FriendListResponse, FriendEventListResponse

router = APIRouter(prefix="/admin/friends", tags=["Friends"])

@router.get("", response_model=FriendListResponse)
async def list_friends(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all friends with status"""
    return await friend_service.list_friends(status, db)

@router.get("/{line_user_id}/events", response_model=FriendEventListResponse)
async def get_friend_events(
    line_user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get friend history for a user"""
    return await friend_service.get_friend_events(line_user_id, db)
```

### 4.4 Webhook Modifications

#### `backend/app/api/v1/endpoints/webhook.py` - Changes

```python
# Add to existing webhook handler

from app.services.live_chat_service import live_chat_service
from app.services.friend_service import friend_service
from app.models.user import ChatMode
from app.models.intent import ReplyType

# In handle_message function, add chat mode check FIRST:

async def handle_message(event, db: AsyncSession, background_tasks):
    user = await get_or_create_user(event.source.user_id, db)

    # Always save incoming message
    await line_service.save_message(event, MessageDirection.INCOMING, db)

    # Update last_message_at
    user.last_message_at = datetime.utcnow()

    # CHECK CHAT MODE FIRST
    if user.chat_mode == ChatMode.HUMAN:
        # Don't process with bot - message already saved
        # Admin panel will see it via polling/websocket
        return

    # BOT mode - existing intent matching logic
    intent_response = await match_intent(event.message.text, db)

    # Check for HANDOFF response type
    if intent_response and intent_response.reply_type == ReplyType.HANDOFF:
        await live_chat_service.initiate_handoff(
            user, event.reply_token, db, background_tasks
        )
        return

    # Normal bot response (existing code)
    # ...

# Add follow/unfollow handlers:

async def handle_follow(event, db: AsyncSession):
    """Handle follow event"""
    await friend_service.handle_follow(event.source.user_id, db)

async def handle_unfollow(event, db: AsyncSession):
    """Handle unfollow event"""
    await friend_service.handle_unfollow(event.source.user_id, db)
```

---

## 5. Frontend Implementation

### 5.1 Live Chat Page (`/admin/live-chat`)

#### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Card (white, rounded-xl, shadow-md)                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Live Chat                                    Badge: 3 Waiting     │  │
│  │ จัดการแชทกับผู้ใช้งาน                            [Stats Button]    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
├───────────────────┬─────────────────────────────────────────────────────┤
│                   │                                                     │
│  Tabs (border-b)  │  User Header Card                                   │
│  [All] [Waiting]  │  ┌─────────────────────────────────────────────┐    │
│  [Active] [Bot]   │  │ Avatar  สมชาย นามสมมติ     [BOT|HUMAN]      │    │
│                   │  │ 64x64   Badge: Active      Toggle Switch    │    │
│  Search Input     │  │         Friend since: 15 ม.ค. 67            │    │
│                   │  └─────────────────────────────────────────────┘    │
│  ─────────────    │                                                     │
│                   │  Chat Messages (scrollable)                         │
│  Conversation     │  ┌─────────────────────────────────────────────┐    │
│  List             │  │  System message (center, slate-500)         │    │
│  ┌─────────────┐  │  │  User bubble (left, slate-100 bg)           │    │
│  │ Avatar Name │  │  │  Operator bubble (right, indigo-500 bg)     │    │
│  │ Preview...  │  │  └─────────────────────────────────────────────┘    │
│  │ 2m • 🟠     │  │                                                     │
│  └─────────────┘  │  Input Area                                         │
│                   │  ┌─────────────────────────────────────────────┐    │
│                   │  │ Textarea + [File] [Reply Object] [Send]     │    │
│                   │  └─────────────────────────────────────────────┘    │
└───────────────────┴─────────────────────────────────────────────────────┘
```

#### Color System (Consistent with Theme)

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Waiting badge | Warning | `bg-orange-100 text-orange-700` |
| Active session | Success | `bg-emerald-100 text-emerald-700` |
| Claimed by other | Info | `bg-cyan-100 text-cyan-700` |
| Bot mode | Gray | `bg-slate-100 text-slate-600` |
| Send button | Primary | `bg-[#7367F0] hover:bg-[#5e50ee]` |
| Unread count | Danger | `bg-[#EA5455] text-white` |
| User bubble | Slate | `bg-slate-100 text-slate-800` |
| Operator bubble | Primary | `bg-indigo-500 text-white` |
| System message | Muted | `text-slate-500 text-center` |

### 5.2 Settings Page Refactor (`/admin/settings`)

#### New Tabbed Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Card: System Settings                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tabs: [Credentials] [General] [Notifications]                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Credentials                              [+ Add Credential]   │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │                                                               │  │
│  │  Filter: [All ▼] [LINE] [Telegram] [N8N] [Google] [Custom]   │  │
│  │                                                               │  │
│  │  DataTable with columns:                                      │  │
│  │  Provider | Name | Status | Default | Actions                 │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Dynamic Form per Provider (Modal)

**LINE Form (preserve existing):**
- Channel ID (text)
- Channel Secret (password with show/hide)
- Channel Access Token (password with show/hide)
- LIFF ID (text, optional)
- [Verify Connection] button

**Telegram Form:**
- Bot Token (password)
- Bot Username (text, auto-filled after verify)
- Admin Chat ID (text)
- [Verify Connection] button

**N8N Form:**
- Base URL (text)
- API Key (password)
- Webhook URL (text, optional)
- [Verify Connection] button

**Google Sheets Form:**
- Service Account JSON (textarea or file upload)
- Spreadsheet ID (text)
- Sheet Name (text)
- [Verify Connection] button

---

## 6. Telegram Integration

### Setup Requirements

**Environment Variables:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_ADMIN_CHAT_ID=your_group_chat_id
ENCRYPTION_KEY=your_fernet_encryption_key
```

### Notification Message Format

```
🔔 ผู้ใช้ขอคุยกับเจ้าหน้าที่

👤 ชื่อ: สมชาย นามสมมติ
📱 LINE ID: U1234567890

💬 ข้อความล่าสุด:
• "สวัสดีครับ"
• "มีเรื่องอยากสอบถาม"
• "ติดต่อเจ้าหน้าที่"

🔗 เปิดแชท: https://your-domain.com/admin/live-chat?user=U1234567890
```

### Handoff Flow

```
User sends handoff keyword
       ↓
Webhook detects HANDOFF intent response type
       ↓
1. Set user.chat_mode = HUMAN
2. Create chat_session (status=WAITING)
3. Send auto-greeting to user via LINE
4. Send Telegram notification (async background task)
       ↓
Operator clicks link → Opens admin panel with user selected
```

---

## 7. Multi-Credential Management

### Provider Support Matrix

| Provider | Verify Method | Use Case |
|----------|--------------|----------|
| LINE | GET /v2/bot/info | Messaging, LIFF |
| Telegram | GET /getMe | Admin notifications |
| N8N | GET /healthz | Workflow automation |
| Google Sheets | GET spreadsheet | Data sync, reports |
| Custom | Configurable | Third-party APIs |

### Security

- All credentials encrypted using Fernet symmetric encryption
- Decryption only at runtime when needed
- API responses mask sensitive values (show only last 4 chars)
- Audit log for credential access (future enhancement)

### Migration Script

```python
# Migrate existing LINE credentials from settings/env to new table
async def migrate_line_credentials(db: AsyncSession):
    # Check if already migrated
    existing = await credential_service.get_default_credential(Provider.LINE, db)
    if existing:
        return

    # Read from current source (env or settings table)
    line_creds = {
        "channel_secret": settings.LINE_CHANNEL_SECRET,
        "channel_access_token": settings.LINE_CHANNEL_ACCESS_TOKEN
    }

    credential = Credential(
        name="Main LINE OA",
        provider=Provider.LINE,
        credentials=credential_service.encrypt_credentials(line_creds),
        metadata={
            "channel_id": settings.LINE_CHANNEL_ID,
            "liff_id": settings.LIFF_ID
        },
        is_active=True,
        is_default=True
    )
    db.add(credential)
    await db.commit()
```

---

## 8. Analytics & Metrics

### Key Metrics

**Response Time Metrics:**
| Metric | Calculation |
|--------|-------------|
| First Response Time | `claimed_at - started_at` |
| Avg Response Time | Average time between user message and operator reply |
| Resolution Time | `closed_at - started_at` |

**Volume Metrics:**
| Metric | Description |
|--------|-------------|
| Total Sessions | Count of chat_sessions per period |
| Waiting Queue | Sessions with status=WAITING |
| Active Chats | Sessions with status=ACTIVE |
| Messages per Session | `message_count` field |

**Operator Metrics:**
| Metric | Description |
|--------|-------------|
| Sessions Handled | Count per operator |
| Avg First Response | Per operator average |
| Avg Resolution Time | Per operator average |

### Analytics Dashboard Layout

```
Stats Cards (4 columns):
- Total Sessions Today
- Avg First Response Time
- Avg Resolution Time
- Avg Messages per Session

Charts (2 columns):
- Sessions Over Time (7 days line chart)
- Response Time Trend (hourly average)

Operator Performance Table:
- Columns: Operator, Sessions, Avg Response, Avg Resolve
```

### Background Aggregation Job

Daily job to populate `chat_analytics` table for fast dashboard queries.

---

## 9. Implementation Phases

### Phase 1: Foundation (Database & Core)
- [ ] Create `FriendEvent`, `ChatSession`, `ChatAnalytics`, `Credential` models
- [ ] Create Pydantic schemas for all new models
- [ ] Run Alembic migrations (5 migrations)
- [ ] Add enums: `FriendEventType`, `SessionStatus`, `ClosedBy`, `Provider`
- [ ] Add `HANDOFF` to `ReplyType` enum

### Phase 2: Credential System
- [ ] Implement `CredentialService` with encryption
- [ ] Create credential REST API endpoints
- [ ] Refactor settings page with tabbed layout
- [ ] Build dynamic provider forms (LINE, Telegram, N8N, Google Sheets)
- [ ] Create migration script for existing LINE credentials
- [ ] Add verify connection functionality per provider

### Phase 3: Friend Tracking
- [ ] Implement `FriendService` for event logging
- [ ] Add follow/unfollow webhook handlers
- [ ] Create friends REST API endpoints
- [ ] Build Friends admin page with status & history

### Phase 4: Live Chat Core
- [ ] Implement `TelegramService` for notifications
- [ ] Implement `LiveChatService` for session management
- [ ] Modify webhook handler for chat mode routing
- [ ] Add HANDOFF intent response type to admin UI
- [ ] Test handoff flow end-to-end

### Phase 5: Live Chat UI
- [ ] Build Live Chat page with inbox layout
- [ ] Create `LiveChatInbox` component (conversation list)
- [ ] Create `LiveChatPanel` component (message display)
- [ ] Create `LiveChatInput` component (text, file, reply object)
- [ ] Create `ReplyObjectPicker` modal
- [ ] Implement real-time updates (polling initially)
- [ ] Add BOT/HUMAN mode toggle with confirmation

### Phase 6: Analytics
- [ ] Implement analytics calculation in `LiveChatService`
- [ ] Create analytics REST API endpoints
- [ ] Build analytics dashboard page
- [ ] Create daily aggregation background job
- [ ] Add operator performance table

---

## 10. File Structure

### New Backend Files

```
backend/app/
├── models/
│   ├── friend_event.py          # NEW
│   ├── chat_session.py          # NEW
│   ├── chat_analytics.py        # NEW
│   └── credential.py            # NEW
├── schemas/
│   ├── friend_event.py          # NEW
│   ├── chat_session.py          # NEW
│   ├── live_chat.py             # NEW
│   └── credential.py            # NEW
├── services/
│   ├── telegram_service.py      # NEW
│   ├── live_chat_service.py     # NEW
│   ├── friend_service.py        # NEW
│   └── credential_service.py    # NEW
├── api/v1/endpoints/
│   ├── webhook.py               # MODIFY
│   ├── live_chat.py             # NEW
│   ├── friends.py               # NEW
│   └── credentials.py           # NEW
└── core/
    └── config.py                # MODIFY
```

### New Frontend Files

```
frontend/
├── app/admin/
│   ├── live-chat/
│   │   ├── page.tsx             # NEW
│   │   └── analytics/
│   │       └── page.tsx         # NEW
│   ├── friends/
│   │   └── page.tsx             # NEW
│   └── settings/
│       └── page.tsx             # MODIFY (add tabs)
├── components/admin/
│   ├── LiveChatInbox.tsx        # NEW
│   ├── LiveChatPanel.tsx        # NEW
│   ├── LiveChatInput.tsx        # NEW
│   ├── ReplyObjectPicker.tsx    # NEW
│   ├── FriendEventTimeline.tsx  # NEW
│   └── CredentialForm.tsx       # NEW
└── lib/api/
    ├── liveChat.ts              # NEW
    ├── friends.ts               # NEW
    └── credentials.ts           # NEW
```

### Database Migrations

```
alembic/versions/
├── xxxx_add_friend_events_table.py
├── xxxx_add_chat_sessions_table.py
├── xxxx_add_chat_analytics_table.py
├── xxxx_add_credentials_table.py
├── xxxx_add_user_friend_fields.py
└── xxxx_add_handoff_reply_type.py
```

---

## 11. UX Enhancements

### Included in This Release

| Feature | Description |
|---------|-------------|
| Auto-greeting | System sends "เจ้าหน้าที่จะติดต่อกลับในไม่ช้า" when handoff triggers |

### Future Enhancements (Not in Scope)

| Feature | Description |
|---------|-------------|
| Typing indicators | User sees "operator is typing..." in LINE |
| Queue position | Show user their position if operators are busy |
| Business hours | Auto-reply outside hours |
| Canned responses | Quick-reply buttons for operators |
| Chat transfer | Operator can transfer to another operator |
| Customer satisfaction | Post-chat rating |

---

## Appendix: Environment Variables

Add to `.env`:

```env
# Telegram (can also be stored in credentials table)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# Encryption
ENCRYPTION_KEY=your_32_byte_fernet_key

# Admin URL (for notification links)
ADMIN_URL=https://your-domain.com
```

---

## Appendix: API Response Examples

### GET /admin/live-chat/conversations

```json
{
  "conversations": [
    {
      "line_user_id": "U1234567890",
      "display_name": "สมชาย นามสมมติ",
      "picture_url": "https://...",
      "friend_status": "ACTIVE",
      "chat_mode": "HUMAN",
      "session": {
        "id": 1,
        "status": "WAITING",
        "started_at": "2026-01-25T10:00:00Z",
        "operator": null
      },
      "last_message": {
        "content": "ติดต่อเจ้าหน้าที่",
        "created_at": "2026-01-25T10:00:00Z"
      },
      "unread_count": 2
    }
  ],
  "total": 1,
  "waiting_count": 1,
  "active_count": 0
}
```

### GET /admin/credentials

```json
{
  "credentials": [
    {
      "id": 1,
      "name": "Main LINE OA",
      "provider": "LINE",
      "metadata": {
        "channel_id": "123456",
        "bot_name": "SKN Bot"
      },
      "is_active": true,
      "is_default": true,
      "credentials_masked": "****F0A3"
    }
  ]
}
```

---

*End of PRP Document*
