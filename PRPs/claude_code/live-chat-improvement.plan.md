# Live Chat System Improvement Plan

**Source**: `research/claude_code/live-chat-comprehensive-analysis.md` (merged Claude + Kimi)
**Created**: 2026-02-07
**Updated**: 2026-02-07
**Author**: Claude Code
**Branch**: `fix/live-chat-redesign-issues`

---

## Overview

Implement improvements across 4 phases based on the merged analysis report (17 priority gaps + database optimizations + design system + resilience patterns + performance fixes). Each step has explicit files, acceptance criteria, and dependencies.

**Scorecard targets** (from report Section 1):

| Area | Current | Target |
|------|---------|--------|
| Security | 5/10 | 9/10 (Phase 1) |
| Frontend UI/UX | 6.5/10 | 8.5/10 (Phase 2-3) |
| Analytics | 6/10 | 8/10 (Phase 3-4) |
| Database | 8/10 | 9/10 (Phase 1+4) |
| WebSocket | 8/10 | 9/10 (Phase 4) |

---

## Phase 1: Security & Stability

> Priority: P0 + P3 quick wins | Estimated: 1-2 weeks
> Goal: Remove critical auth bypass, fix query performance, harden session claims, add DB indexes

### Step 1.1: Add ENVIRONMENT setting to config

**Files to modify:**
- `backend/app/core/config.py` — Add `ENVIRONMENT: str = "development"` field

**What to do:**
- Add `ENVIRONMENT` field to `Settings` class (already partially referenced in `deps.py:31` via `getattr(settings, 'ENVIRONMENT', 'development')`)
- This becomes the single gate for all dev-mode bypasses

**Acceptance criteria:**
- `settings.ENVIRONMENT` is available and defaults to `"development"`
- Can be overridden via `.env` file with `ENVIRONMENT=production`

---

### Step 1.2: Implement real JWT auth login endpoint

**Files to create:**
- `backend/app/api/v1/endpoints/auth.py` — Login, refresh, and me endpoints
- `backend/app/schemas/auth.py` — LoginRequest, LoginResponse, TokenResponse schemas

**Files to modify:**
- `backend/app/api/v1/api.py` — Register auth router at `/auth`
- `backend/app/api/deps.py` — Use `settings.ENVIRONMENT` instead of `getattr()` fallback

**What to do:**
1. Create `POST /api/v1/auth/login` endpoint:
   - Accept `{username, password}`
   - Query `User` by `username` where `role in (ADMIN, SUPER_ADMIN, AGENT)`
   - Verify password with `verify_password()` from `core/security.py`
   - Return `{access_token, refresh_token, token_type, user: {id, username, role, display_name}}`
2. Create `POST /api/v1/auth/refresh` endpoint:
   - Accept refresh token in Authorization header
   - Verify token type is "refresh" via `verify_token()` (already in `security.py`)
   - Issue new access token (30min) via `create_access_token()`
3. Create `GET /api/v1/auth/me` endpoint:
   - Return current user info from JWT
   - Uses `Depends(get_current_user)`

**Existing code to leverage** (report Section 7.2):
- `core/security.py:22` — `create_access_token()` (30min, type="access")
- `core/security.py:63` — `create_refresh_token()` (7 days, type="refresh")
- `core/security.py:12` — `verify_password()` (bcrypt via passlib)
- `core/security.py:17` — `get_password_hash()` (bcrypt)
- `core/security.py:90` — `verify_token()` (decode + validate)
- `core/security.py:147` — `is_token_expired()` (expiry check)
- `deps.py:17` — `get_current_user()` with JWT decode logic

**Acceptance criteria:**
- Login returns valid JWT tokens (access 30min + refresh 7day)
- Refresh extends session without re-login
- Invalid credentials return 401
- `/auth/me` returns user info from token

**Dependencies:** Step 1.1

---

### Step 1.3: Gate dev mode bypass behind ENVIRONMENT flag

**Files to modify:**
- `backend/app/api/v1/endpoints/ws_live_chat.py` (line 48-53) — Wrap dev mode in `if settings.ENVIRONMENT == "development"`
- `backend/app/api/deps.py` (line 30-46) — Replace `getattr(settings, 'ENVIRONMENT', 'development')` with `settings.ENVIRONMENT`

**What to do:**
1. In `ws_live_chat.py:handle_auth()`, wrap the admin_id bypass:
   ```python
   if not token:
       if settings.ENVIRONMENT == "development":
           admin_id = payload.get('admin_id')
           if admin_id:
               logger.warning(f"WebSocket auth (DEV MODE) for admin {admin_id}")
               return str(admin_id)
       # ... error response
   ```
2. In `deps.py:get_current_user()`, replace `getattr()` with direct access
3. Add log warning when dev mode bypass is used

**Security context** (report Section 8.1):
- WS bypass at `ws_live_chat.py:48-53` — **Critical**: any user can impersonate any admin
- REST bypass at `deps.py:30-46` — **Critical**: no token = auto-admin
- Frontend `AuthContext.tsx:25` — **Critical**: `DEV_MODE=true` hardcoded

**Acceptance criteria:**
- With `ENVIRONMENT=production`, admin_id bypass is rejected in both WS and REST
- With `ENVIRONMENT=development`, existing dev flow still works
- Warning logged every time dev bypass is used

**Dependencies:** Step 1.1

---

### Step 1.4: Create seed script for admin users with hashed passwords

**Files to create:**
- `backend/scripts/seed_admin.py` — Create default admin user with hashed password

**What to do:**
1. Script that creates admin user with `get_password_hash()` from `core/security.py`
2. Only runs if no admin users exist (idempotent)
3. Default: username=`admin`, password from env var `ADMIN_DEFAULT_PASSWORD`
4. Set `role=UserRole.ADMIN`, `hashed_password` field

**Acceptance criteria:**
- Running script creates admin user with bcrypt-hashed password
- Login endpoint accepts these credentials
- Script is idempotent (safe to run multiple times)

**Dependencies:** Step 1.2

---

### Step 1.5: Update frontend AuthContext to use real login

**Files to modify:**
- `frontend/contexts/AuthContext.tsx` — Replace `DEV_MODE = true` with environment-based check

**What to do:**
1. Change `DEV_MODE` to read from env: `const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'`
2. The `login()` function at line 72 already calls `/api/v1/auth/login` — just needs backend to exist
3. The `refreshToken()` at line 111 already calls `/api/v1/auth/refresh` — same
4. Add token expiration check on init (line 57 has `// TODO: Validate token expiration`) using `is_token_expired` equivalent on client side
5. Move JWT storage from `localStorage` to `httpOnly` cookie (or at minimum add XSS note)

**Security context** (report Section 8.1):
- `AuthContext.tsx:25` — `DEV_MODE=true` hardcoded (Critical)
- `AuthContext.tsx:34` — Mock token with `exp:9999999999` (High)
- `AuthContext.tsx:61` — JWT in localStorage (High — XSS vector)

**Acceptance criteria:**
- `DEV_MODE` controlled by `NEXT_PUBLIC_DEV_MODE` env var
- Real login flow works end-to-end
- Token expiration checked on page load; expired tokens trigger logout
- At minimum, document the localStorage XSS risk with a TODO for httpOnly cookie

**Dependencies:** Step 1.2

---

### Step 1.6: Create login page

**Files to create:**
- `frontend/app/login/page.tsx` — Login form page

**What to do:**
1. Simple login form: username + password fields
2. Calls `useAuth().login()`
3. Redirects to `/admin` on success
4. Shows error toast on failure
5. Redirect to `/login` if not authenticated (from `AuthContext.logout()` at line 108, already does `window.location.href = '/login'`)
6. Use Thai-friendly typography: `Noto_Sans_Thai` + `Inter` (report Section 6.3)

**Acceptance criteria:**
- Login form renders at `/login`
- Successful login redirects to `/admin`
- Failed login shows error message
- Unauthenticated users redirected to `/login`

**Dependencies:** Step 1.5

---

### Step 1.7: Fix N+1 query in `get_conversations()`

**Files to modify:**
- `backend/app/services/live_chat_service.py` — Refactor `get_conversations()` method (~line 363)

**What to do** (report Section 7.3):
1. Replace per-user message query loop with window function subquery:
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
   # Filter rn=1 and join — single query for users + sessions + latest message
   ```
2. Join users + sessions + latest message in one query

**Performance context** (report Section 9.1):
- Conversation list load: ~800ms currently (target: <500ms after fix)

**Acceptance criteria:**
- `get_conversations()` executes 1-2 queries instead of N+1
- Same response format as before
- Tested with 50+ conversations
- Load time measurably improved

**Dependencies:** None

---

### Step 1.8: Fix session claim race condition

**Files to modify:**
- `backend/app/services/live_chat_service.py` — Add optimistic locking to `claim_session()`

**What to do:**
1. Use `status` as guard — atomic UPDATE with WHERE clause:
   ```python
   result = await db.execute(
       update(ChatSession)
       .where(ChatSession.id == session_id, ChatSession.status == SessionStatus.WAITING)
       .values(status=SessionStatus.ACTIVE, operator_id=operator_id, claimed_at=func.now())
   )
   if result.rowcount == 0:
       raise HTTPException(409, "Session already claimed by another operator")
   ```
2. Check `rowcount == 1` after update; if 0, session was already claimed
3. Return clear error: "Session already claimed by another operator"
4. Audit log records the successful claim only

**Acceptance criteria:**
- Two simultaneous claim attempts: only one succeeds, other gets 409
- No database integrity errors
- Audit log records the successful claim only

**Dependencies:** None

---

### Step 1.9: Add database indexes for performance

**Files to create:**
- `backend/alembic/versions/xxx_add_performance_indexes.py` — Migration

**What to do** (report Section 5.3):
```sql
-- For analytics time-range queries
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_claimed_at ON chat_sessions(claimed_at);

-- For message pagination (cursor-based, needed for Step 2.2)
CREATE INDEX idx_messages_user_created ON messages(line_user_id, created_at DESC);
```

**Acceptance criteria:**
- Migration applies cleanly
- `alembic current` shows new revision
- Query plans show index usage for conversation list and message history queries

**Dependencies:** None

---

### Step 1.10: Fix FCR calculation performance

**Files to modify:**
- `backend/app/services/analytics_service.py` (~line 126) — Replace O(n) loop with single query

**What to do** (report Section 7.3):
```python
# Replace per-session loop with NOT EXISTS subquery
from sqlalchemy import exists, and_

reopened_subq = (
    select(ChatSession.id).where(
        and_(
            ChatSession.line_user_id == closed_session.c.line_user_id,
            ChatSession.created_at > closed_session.c.closed_at,
            ChatSession.created_at < closed_session.c.closed_at + timedelta(hours=24)
        )
    ).exists()
)

fcr_count = await db.scalar(
    select(func.count()).select_from(closed_session).where(~reopened_subq)
)
```

**Acceptance criteria:**
- FCR rate calculated in 1-2 queries regardless of session count
- Same numeric result as before
- Measurable improvement with 100+ sessions

**Dependencies:** None

---

## Phase 2: Core UX Improvements

> Priority: P1 | Estimated: 2-3 weeks
> Goal: Decompose monolithic frontend, add pagination, unread tracking, search, accessibility, design system foundations

### Step 2.1: Set up design system foundations

**Files to create:**
- `frontend/app/globals.css` additions (or separate `frontend/styles/design-tokens.css`)

**What to do** (report Section 6.3):
1. Add semantic color tokens for chat using Tailwind v4 `@theme`:
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
2. Add fluid typography CSS variables:
   ```css
   :root {
     --text-base: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
     --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
   }
   ```
3. Set up Thai font pairing in layout:
   ```typescript
   import { Noto_Sans_Thai, Inter } from 'next/font/google';
   const notoSansThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-thai' });
   const inter = Inter({ subsets: ['latin'], variable: '--font-display' });
   ```

**Acceptance criteria:**
- Semantic color tokens available as `bg-chat-user`, `bg-status-waiting` etc.
- Thai text renders in Noto Sans Thai
- Fluid typography scales between mobile and desktop

**Dependencies:** None

---

### Step 2.2: Decompose live chat page into components

**Files to create:**
```
frontend/app/admin/live-chat/
├── _components/
│   ├── ConversationList.tsx    # Left panel: search + filters + list
│   ├── ConversationItem.tsx    # Single row in conversation list (React.memo)
│   ├── ChatArea.tsx            # Center: messages + input
│   ├── MessageBubble.tsx       # Individual message with CVA variants (React.memo)
│   ├── MessageInput.tsx        # Text input + canned response trigger
│   ├── CustomerPanel.tsx       # Right panel: user info + actions
│   ├── SessionActions.tsx      # Claim/Close/Transfer buttons
│   ├── ChatHeader.tsx          # Chat area header with user info
│   ├── TransferDialog.tsx      # Transfer session modal (with focus trap)
│   ├── QueueBadge.tsx          # Queue position indicator
│   └── TypingIndicator.tsx     # Animated typing dots
├── _hooks/
│   ├── useChatReducer.ts       # useReducer for all chat state
│   ├── useConversations.ts     # Conversation list data + filtering
│   └── useMessages.ts          # Message pagination + optimistic updates
└── _context/
    └── LiveChatContext.tsx      # Shared state provider
```

**Files to modify:**
- `frontend/app/admin/live-chat/page.tsx` — Reduce to layout shell importing components

**What to do:**
1. Extract state into `useChatReducer` with actions: `SET_CONVERSATIONS`, `SELECT_CHAT`, `ADD_MESSAGE`, `UPDATE_SESSION`, `SET_FILTER`, `SET_TYPING`, etc.
2. Create `LiveChatContext` provider wrapping the reducer + WebSocket hook
3. Extract each panel into its own component (<200 lines each)
4. Keep `useLiveChatSocket` hook as-is but consume via context
5. Add `React.memo()` to `ConversationItem` and `MessageBubble` to prevent unnecessary re-renders
6. Use CVA variants for `MessageBubble` (report Section 6.3):
   ```typescript
   const messageBubbleVariants = cva(
     'rounded-2xl px-4 py-2.5 max-w-[70%]',
     {
       variants: {
         sender: {
           user: 'bg-chat-user text-white rounded-bl-md',
           admin: 'bg-chat-admin text-white rounded-br-md',
           bot: 'bg-chat-bot text-slate-600 rounded-br-md',
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
7. Add `AnimatePresence` + `motion.div` for message enter animations (report Section 6.3)
8. Fix: Stop REST polling when WebSocket is connected (report Section 9.2)

**Acceptance criteria:**
- `page.tsx` is under 100 lines (layout shell only)
- Each component under 200 lines
- All existing functionality preserved (send, claim, close, transfer, canned responses, typing, sounds)
- No visual changes except improved message bubble styling
- REST polling stops when WS is healthy

**Dependencies:** Step 2.1

---

### Step 2.3: Add chat history pagination (backend)

**Files to modify:**
- `backend/app/services/live_chat_service.py` — Add `get_messages_paginated()` method
- `backend/app/api/v1/endpoints/admin_live_chat.py` — Add paginated messages endpoint

**What to do:**
1. Add cursor-based pagination method:
   ```python
   async def get_messages_paginated(
       self, line_user_id: str, before_id: Optional[int] = None,
       limit: int = 50, db: AsyncSession
   ) -> dict:
       query = select(Message).where(Message.line_user_id == line_user_id)
       if before_id:
           query = query.where(Message.id < before_id)
       query = query.order_by(desc(Message.id)).limit(limit + 1)
       result = await db.execute(query)
       messages = result.scalars().all()
       has_more = len(messages) > limit
       return {"messages": list(reversed(messages[:limit])), "has_more": has_more}
   ```
2. Add REST endpoint: `GET /admin/live-chat/conversations/{line_user_id}/messages?before_id=&limit=`
3. Also support via WebSocket: `load_history` event with `{line_user_id, before_id, limit}`

**Performance note:** Uses composite index `idx_messages_user_created` from Step 1.9.

**Acceptance criteria:**
- First load returns latest 50 messages + `has_more` flag
- Passing `before_id` returns older messages
- Empty result when no more messages
- Response time <200ms with index

**Dependencies:** Step 1.9 (index)

---

### Step 2.4: Add chat history pagination (frontend)

**Files to modify:**
- `frontend/app/admin/live-chat/_components/ChatArea.tsx` (from Step 2.2)
- Or `frontend/app/admin/live-chat/page.tsx` if Step 2.2 not yet done

**What to do:**
1. Add `IntersectionObserver` on a sentinel div at top of messages list
2. When sentinel visible + `has_more === true`, fetch older messages via `before_id` of oldest message
3. Maintain scroll position after prepending old messages (save `scrollHeight` before, restore after)
4. Show "Loading older messages..." spinner at top while fetching

**Acceptance criteria:**
- Scrolling up loads older messages automatically
- Scroll position preserved (no jump)
- Loading indicator shown during fetch
- Stops requesting when `has_more === false`

**Dependencies:** Step 2.3

---

### Step 2.5: Implement real unread count tracking

**Files to modify:**
- `backend/app/core/websocket_manager.py` — Track which rooms each admin has joined
- `backend/app/services/live_chat_service.py` — Add unread count calculation
- `backend/app/api/v1/endpoints/ws_live_chat.py` — Reset unread on `join_room`

**What to do** (report Section 5.4):
1. Track `last_read_at` per admin per conversation via Redis:
   ```
   Redis key: read:{admin_id}:{line_user_id} = ISO timestamp
   ```
2. On `join_room`: update `last_read_at` to now
3. On `new_message` broadcast: include `unread_count` for operators NOT in that room
4. In `get_conversations()`: calculate unread as count of messages after `last_read_at`
5. Frontend: Show red badge with count on `ConversationItem`

**Acceptance criteria:**
- Unread badge shows correct count per conversation
- Entering a conversation resets its unread count to 0
- New messages increment unread for operators not in that room

**Dependencies:** Step 1.7

---

### Step 2.6: Add message search

**Files to modify:**
- `backend/app/services/live_chat_service.py` — Add `search_messages()` method
- `backend/app/api/v1/endpoints/admin_live_chat.py` — Add search endpoint

**Files to create (if decomposed):**
- `frontend/app/admin/live-chat/_components/MessageSearch.tsx`

**What to do** (report Section 7.5):
1. Backend — Start with ILIKE (good for Thai, no extension needed):
   ```python
   async def search_messages(self, query: str, line_user_id: Optional[str], limit: int, db):
       stmt = select(Message).where(Message.content.ilike(f"%{query}%"))
       if line_user_id:
           stmt = stmt.where(Message.line_user_id == line_user_id)
       stmt = stmt.order_by(desc(Message.created_at)).limit(limit)
   ```
   Optional upgrade later: PostgreSQL full-text with Thai tokenizer:
   ```python
   search_query = func.plainto_tsquery('thai', query)
   stmt = select(Message).where(
       func.to_tsvector('thai', Message.content).op('@@')(search_query)
   )
   ```
2. REST endpoint: `GET /admin/live-chat/messages/search?q=&line_user_id=&limit=`
3. Frontend: Search input in conversation list header; shows results with conversation context
4. Click result jumps to that message in conversation

**Acceptance criteria:**
- Search across all conversations or within specific one
- Results show message content + sender + conversation name
- Clicking result navigates to that conversation
- Debounced input (300ms)

**Dependencies:** None

---

### Step 2.7: Add accessibility attributes

**Files to modify:**
- All live chat components (from Step 2.2 decomposition, or `page.tsx` directly)
- `frontend/components/admin/CannedResponsePicker.tsx`

**What to do** (report Section 6.6 — 7 of 8 components failing WCAG A):

| Component | Fix |
|-----------|-----|
| ConversationList | `role="listbox"`, items get `role="option"`, arrow key navigation |
| Icon-only buttons | Add `aria-label` to all (Send, Sound toggle, Close panel, etc.) |
| ChatArea messages | `aria-live="polite"` region for new messages |
| Chat input | Associate with `<label>` via `htmlFor`/`id` |
| TransferDialog | Add focus trap (focus first element on open, trap Tab within dialog) |
| CannedResponsePicker | `role="listbox"`, arrow key navigation, Enter to select |
| SessionActions | Wrap in `role="group"` with `aria-label="Session actions"` |

**Acceptance criteria:**
- Pass WCAG 2.1 Level A for all items in the audit table
- Keyboard navigation works for conversation list and canned picker
- Screen reader announces new messages via aria-live

**Dependencies:** Ideally after Step 2.2

---

## Phase 3: Enhanced Features

> Priority: P2 | Estimated: 2-3 weeks
> Goal: Friends tagging, media messages, abandonment tracking, real-time analytics, mobile layout, resilience

### Step 3.1: Friends tagging and segmentation

**Files to create:**
- `backend/app/models/tag.py` — Tag and UserTag models
- `backend/app/services/tag_service.py` — CRUD for tags and user-tag associations
- `backend/app/api/v1/endpoints/admin_tags.py` — REST API for tag management
- `backend/alembic/versions/xxx_add_tags_tables.py` — Migration

**Files to modify:**
- `backend/app/models/__init__.py` — Import new models
- `backend/app/api/v1/api.py` — Register tags router
- `backend/app/services/live_chat_service.py` — Include tags in `get_conversations()` response

**What to do** (report Section 5.4):
1. Models:
   ```python
   class Tag(Base):
       __tablename__ = "tags"
       id = Column(Integer, primary_key=True)
       name = Column(String(50), unique=True, nullable=False)
       color = Column(String(7), default="#6366f1")  # hex
       created_at = Column(DateTime, server_default=func.now())

   class UserTag(Base):
       __tablename__ = "user_tags"
       user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
       tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
       created_at = Column(DateTime, server_default=func.now())
   ```
2. API endpoints: `GET/POST /admin/tags`, `POST/DELETE /admin/tags/{tag_id}/users/{user_id}`
3. Frontend: Tag badges on conversation items, filter by tag, tag management in customer panel

**Acceptance criteria:**
- CRUD for tags (name + color)
- Assign/remove tags from users
- Filter conversation list by tag
- Tags visible in conversation list items

**Dependencies:** None

---

### Step 3.2: Media message support (images, stickers, files)

**Files to modify:**
- `backend/app/api/v1/endpoints/webhook.py` — Handle image/sticker/file message events
- `backend/app/services/line_service.py` — Download LINE media content
- `backend/app/services/live_chat_service.py` — Store media messages
- `backend/app/models/message.py` — Ensure `message_type` + `payload` JSONB used for media metadata

**Frontend files to modify:**
- `_components/MessageBubble.tsx` (or `page.tsx`) — Render images, stickers, files

**What to do:**
1. Backend webhook: When `message.type` is `image`/`video`/`audio`/`file`:
   - Download content via LINE Content API (URL expires in 14 days)
   - Store locally in `/media/` directory (upgrade to S3/R2 later)
   - Save `message_type` + `payload` JSON with `{url, content_type, file_name, size}`
2. Backend send: Support sending images from operator (upload + LINE push)
3. Frontend: Render based on `message_type`:
   - `image`: `<img>` with lightbox on click
   - `sticker`: Render LINE sticker by package/sticker ID
   - `file`: Download link with file name and size
4. Add `MessageBubble` CVA variant for media:
   ```typescript
   type: { text: '', image: 'p-1', sticker: 'bg-transparent p-0', file: 'bg-slate-50' }
   ```

**Acceptance criteria:**
- Incoming LINE images displayed in chat
- Incoming stickers rendered
- Media persists beyond LINE's 14-day expiration
- Operator can view media in conversation

**Dependencies:** None

---

### Step 3.3: Chat abandonment rate tracking

**Files to modify:**
- `backend/app/services/analytics_service.py` — Add abandonment calculation
- `backend/app/tasks/session_cleanup.py` — Mark abandoned sessions

**What to do:**
1. Define "abandoned": Session in WAITING status for >10 minutes with no claim
2. In session cleanup task: Mark sessions as `ABANDONED` (add to `SessionStatus` enum) or close with `closed_by="SYSTEM_TIMEOUT"`
3. Analytics: Calculate `abandonment_rate = abandoned / (abandoned + claimed)` per time period
4. Add to KPI response in `get_realtime_kpis()`

**Acceptance criteria:**
- Abandoned sessions detected and marked
- Abandonment rate appears in analytics KPIs
- Rate calculated per day for historical view

**Dependencies:** None

---

### Step 3.4: Real-time KPI push via WebSocket

**Files to modify:**
- `backend/app/api/v1/endpoints/ws_live_chat.py` — Add `subscribe_analytics` event
- `backend/app/services/analytics_service.py` — Emit KPI updates on session state changes

**What to do:**
1. When session status changes (claimed, closed, transferred): recalculate affected KPIs
2. Broadcast `analytics_update` event to admins subscribed to analytics channel
3. Frontend analytics page: Subscribe via WebSocket instead of 30s polling
4. Fall back to polling when WS disconnected

**Acceptance criteria:**
- KPI cards update within 2 seconds of session state change
- No polling needed when WebSocket is connected
- Falls back to polling when WS disconnected

**Dependencies:** None

---

### Step 3.5: Mobile-responsive live chat layout

**Files to modify:**
- Live chat components (from Step 2.2 decomposition)

**What to do** (report Section 6.4):
1. Below 768px (md): Show only one panel at a time
   - Default: conversation list (full width)
   - Tap conversation: slide to chat area (full width)
   - Back button in chat header returns to list
   - Customer panel: slide-over from right
2. Use container queries for component-level responsiveness:
   ```tsx
   <div className="@container">
     <div className="flex flex-col @lg:flex-row">
       <Sidebar className="w-full @lg:w-72" />
       <ChatArea className="flex-1" />
       <Panel className="hidden @xl:block @xl:w-64" />
     </div>
   </div>
   ```
3. Add slide transitions between panels

**Acceptance criteria:**
- Usable on 375px width (iPhone SE)
- Smooth panel transitions
- Back navigation works
- No horizontal scroll

**Dependencies:** Step 2.2

---

### Step 3.6: Add circuit breaker for LINE API

**Files to modify:**
- `backend/app/services/line_service.py` — Wrap LINE API calls

**Files to add to requirements:**
- `circuitbreaker` package in `requirements.txt`

**What to do** (report Section 7.4):
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
async def push_message(self, user_id: str, messages: list):
    """Prevent cascade failures when LINE API is down."""
    await self.api.push_message(PushMessageRequest(to=user_id, messages=messages))
```

**Acceptance criteria:**
- After 5 consecutive LINE API failures, circuit opens and fast-fails for 30s
- Recovery: circuit closes after successful call post-timeout
- Errors logged with circuit state

**Dependencies:** None

---

### Step 3.7: Add virtual scrolling for long message lists

**Files to modify:**
- `_components/ChatArea.tsx` (from Step 2.2)

**Files to add to package.json:**
- `@tanstack/react-virtual`

**What to do:**
1. Virtualize message list: only render visible messages + buffer
2. Maintain scroll-to-bottom behavior for new messages
3. Support variable height messages (text vs media vs sticker)
4. Integrate with infinite scroll (Step 2.4) — load more when virtual scroller reaches top

**Performance context** (report Section 9.2):
- Currently no virtualization — DOM grows unbounded with messages
- Target: constant memory regardless of message count

**Acceptance criteria:**
- Smooth scrolling with 500+ messages
- Memory usage stays flat regardless of message count
- Auto-scroll to bottom on new message (when already at bottom)

**Dependencies:** Step 2.2, Step 2.4

---

## Phase 4: Scaling & Analytics

> Priority: P2-P3 | Estimated: 2-3 weeks
> Goal: Redis state, operator tracking, SLA alerts, export, enhanced analytics, data retention

### Step 4.1: Store WebSocket connection state in Redis

**Files to modify:**
- `backend/app/core/websocket_manager.py` — Move connection registry to Redis

**What to do** (report Section 7.1):

Currently the connection registry is in-memory dicts:
```python
connections: Dict[str, Set[WebSocket]]   # admin_id → ws set
rooms: Dict[str, Set[str]]              # room_id → admin_id set
admin_metadata: Dict[str, dict]         # admin_id → metadata
```

Pub/Sub message delivery already works, but presence/rooms are local.

Move metadata to Redis:
```python
# Redis keys for shared state
f"ws:connections:{admin_id}" = JSON {connected_at, server_id, rooms: [...]}
f"ws:rooms:{room_id}" = Redis SET of admin_ids
f"ws:presence" = Redis SORTED SET (admin_id → last_heartbeat_timestamp)
```

Keep local `WebSocket` object mapping (can't serialize sockets), but use Redis for cross-instance queries.

**Acceptance criteria:**
- Presence query returns operators from all server instances
- Room membership visible across instances
- Graceful handling of Redis disconnection (fallback to local-only)

**Dependencies:** None

---

### Step 4.2: Operator availability tracking

**Files to modify:**
- `backend/app/core/websocket_manager.py` — Track operator online/offline times in Redis
- `backend/app/services/analytics_service.py` — Calculate availability metrics

**What to do:**
1. On auth success: Set Redis key `operator:online:{admin_id}` with timestamp
2. On disconnect: Record offline time, calculate session duration
3. Store daily availability in Redis sorted set: `operator:availability:{date}` → `{admin_id: total_seconds}`
4. Analytics: Show operator availability % and correlate with queue wait times

**Acceptance criteria:**
- Operator online/offline times tracked
- Availability percentage calculated per operator
- Visible in analytics dashboard

**Dependencies:** Step 4.1

---

### Step 4.3: SLA threshold alerts

**Files to create:**
- `backend/app/services/sla_service.py` — SLA monitoring and alerting

**Files to modify:**
- `backend/app/services/live_chat_service.py` — Trigger SLA check on session events

**What to do:**
1. Define SLA thresholds in settings (or DB):
   - Max FRT: 120 seconds
   - Max resolution time: 30 minutes
   - Max queue wait: 5 minutes
2. On session state change: Check if threshold exceeded
3. Alert via: WebSocket event to all admins + optional Telegram notification
4. Dashboard: Show SLA breach count in KPIs

**Acceptance criteria:**
- Alert triggered when FRT exceeds threshold
- Alert triggered when queue wait exceeds threshold
- Alerts visible in dashboard
- Configurable thresholds

**Dependencies:** Step 3.4

---

### Step 4.4: Chat history export (CSV/PDF)

**Files to create:**
- `backend/app/api/v1/endpoints/admin_export.py` — Export endpoints

**Files to modify:**
- `backend/app/api/v1/api.py` — Register export router

**What to do:**
1. `GET /admin/export/conversations/{line_user_id}/csv` — Download conversation as CSV
2. `GET /admin/export/conversations/{line_user_id}/pdf` — Download as PDF (use `reportlab`)
3. Include: timestamp, sender, message content, message type
4. Frontend: Export button in customer panel

**Acceptance criteria:**
- CSV downloads with all messages for a conversation
- PDF formatted with readable layout
- Filename includes user display name and date range

**Dependencies:** None

---

### Step 4.5: Enhanced analytics dashboard

**Files to modify:**
- `frontend/app/admin/analytics/page.tsx` — Add charts and trend indicators
- `backend/app/services/analytics_service.py` — Add trend calculation + P50/P90/P99 endpoints

**What to do** (report Section 6.5):
1. Add trend arrows to KPI cards (compare today vs yesterday)
2. Add time-series chart for session volume (last 7 days) using `recharts`
3. Add heatmap for peak hours (hourly message counts, 7-day grid)
4. Add conversation funnel: Bot → Human → Resolved
5. Add drill-down: Click operator row to see their detailed stats
6. Add loading skeletons instead of "-" during fetch
7. Backend: Add P50/P90/P99 percentiles for FRT and resolution time

**Acceptance criteria:**
- Trend indicators show improving/degrading for each KPI
- Session volume chart renders for last 7 days
- Peak hours heatmap shows hourly patterns
- Loading states are smooth (skeleton, not blank)

**Dependencies:** Step 3.4

---

### Step 4.6: Friends profile refresh mechanism

**Files to modify:**
- `backend/app/services/friend_service.py` — Add profile refresh method
- `backend/app/models/user.py` — Add `profile_updated_at` column

**Files to create:**
- `backend/alembic/versions/xxx_add_profile_updated_at.py` — Migration

**What to do:**
1. Add `refresh_profile(line_user_id)` method that re-fetches LINE profile
2. Update `display_name` and `picture_url` in database
3. Trigger on: manual button click, or when user sends message (if last refresh >24h)
4. Add `profile_updated_at` column to User model

**Acceptance criteria:**
- Profile refreshed on demand
- Auto-refresh when stale (>24h) and user sends message
- Updated name/picture reflected in conversation list

**Dependencies:** None

---

### Step 4.7: Database scaling preparations

**Files to create:**
- `backend/alembic/versions/xxx_add_materialized_view.py` — Migration for materialized view
- `backend/scripts/refresh_materialized_views.py` — Cron-compatible refresh script

**What to do** (report Section 5.4):
1. Create materialized view for daily message stats:
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
   ```
2. Create refresh script for cron (`REFRESH MATERIALIZED VIEW CONCURRENTLY`)
3. Document: Add table partitioning for messages when exceeding 10M+ rows (future, not now)

**Acceptance criteria:**
- Materialized view created and queryable
- Refresh script runs without downtime (`CONCURRENTLY`)
- Analytics queries can use materialized view for historical data

**Dependencies:** None

---

## Dependency Graph

```
Phase 1 (parallel tracks):
  1.1 ─→ 1.2 ─→ 1.4
  1.1 ─→ 1.3       ├─→ 1.5 ─→ 1.6
  1.7 (independent)
  1.8 (independent)
  1.9 (independent) ─→ 2.3
  1.10 (independent)

Phase 2 (start 2.1-2.2 early):
  2.1 ─→ 2.2 (design tokens first)
  2.2 (decompose)
  2.3 ─→ 2.4 (backend pagination → frontend)
  2.5 (after 1.7)
  2.6 (independent)
  2.7 (after 2.2)

Phase 3:
  3.1 (independent)
  3.2 (independent)
  3.3 (independent)
  3.4 ─→ 4.3, 4.5
  3.5 (after 2.2)
  3.6 (independent)
  3.7 (after 2.2, 2.4)

Phase 4:
  4.1 ─→ 4.2
  4.3 (after 3.4)
  4.4 (independent)
  4.5 (after 3.4)
  4.6 (independent)
  4.7 (independent)
```

---

## Files Summary

### New files to create (18+):
| File | Step | Purpose |
|------|------|---------|
| `backend/app/api/v1/endpoints/auth.py` | 1.2 | Login/refresh/me endpoints |
| `backend/app/schemas/auth.py` | 1.2 | Auth request/response schemas |
| `backend/scripts/seed_admin.py` | 1.4 | Admin user seeder |
| `backend/alembic/versions/xxx_add_performance_indexes.py` | 1.9 | DB indexes |
| `frontend/app/login/page.tsx` | 1.6 | Login page |
| `frontend/app/admin/live-chat/_components/*.tsx` (11) | 2.2 | Decomposed components |
| `frontend/app/admin/live-chat/_hooks/*.ts` (3) | 2.2 | Chat state hooks |
| `frontend/app/admin/live-chat/_context/LiveChatContext.tsx` | 2.2 | Shared state |
| `backend/app/models/tag.py` | 3.1 | Tag + UserTag models |
| `backend/app/services/tag_service.py` | 3.1 | Tag CRUD service |
| `backend/app/api/v1/endpoints/admin_tags.py` | 3.1 | Tag REST API |
| `backend/app/services/sla_service.py` | 4.3 | SLA monitoring |
| `backend/app/api/v1/endpoints/admin_export.py` | 4.4 | Export endpoints |
| `backend/scripts/refresh_materialized_views.py` | 4.7 | View refresh |

### Existing files to modify (key ones):
| File | Steps |
|------|-------|
| `backend/app/core/config.py` | 1.1 |
| `backend/app/api/v1/api.py` | 1.2, 3.1, 4.4 |
| `backend/app/api/deps.py` | 1.2, 1.3 |
| `backend/app/api/v1/endpoints/ws_live_chat.py` | 1.3, 2.5, 3.4 |
| `backend/app/services/live_chat_service.py` | 1.7, 1.8, 2.3, 2.5, 2.6, 3.1 |
| `backend/app/services/analytics_service.py` | 1.10, 3.3, 3.4, 4.2, 4.5 |
| `backend/app/services/line_service.py` | 3.2, 3.6 |
| `backend/app/services/friend_service.py` | 4.6 |
| `backend/app/core/websocket_manager.py` | 2.5, 4.1, 4.2 |
| `frontend/contexts/AuthContext.tsx` | 1.5 |
| `frontend/app/admin/live-chat/page.tsx` | 2.2, 2.4, 2.7, 3.5 |
| `frontend/app/admin/analytics/page.tsx` | 4.5 |
| `frontend/components/admin/CannedResponsePicker.tsx` | 2.7 |

---

## Validation Checklist

After each phase, verify:

- [ ] **Phase 1**: `ENVIRONMENT=production` blocks all dev bypasses; login flow works e2e; N+1 query fixed (conversation list <500ms); claim race returns 409; FCR calculates in 1-2 queries; indexes applied
- [ ] **Phase 2**: Design tokens render correctly; page decomposed to <100 lines; pagination works with 200+ messages; unread counts accurate; search returns Thai text; WCAG A passes on all 8 components
- [ ] **Phase 3**: Tags CRUD + filtering works; images display in chat; abandonment rate in KPIs; analytics update in real-time; mobile usable at 375px; LINE API circuit breaker activates after 5 failures
- [ ] **Phase 4**: Redis stores connection state across instances; operator availability tracked; SLA alerts fire on threshold breach; CSV/PDF export downloads; trend charts render; materialized view refreshes
