# Feature: Live Chat Remaining Compliance - Phases 5 & 6

## Summary

Complete the remaining 5 features needed to bring Live Chat compliance from ~85% to 100%: (1) Canned Responses for operators, (2) Notification Sounds, (3) Operator-to-operator Session Transfer, (4) CSAT Survey collection via LINE Flex Messages, and (5) Auth Login/Refresh endpoints to replace DEV_MODE. These build on the existing mature infrastructure (WebSocket, Redis Pub/Sub, Audit Logging, Business Hours are all complete).

## User Story

As an **admin operator** managing live chat conversations,
I want to have **quick reply templates, sound alerts, transfer capability, and satisfaction surveys**,
So that I can **handle conversations faster, never miss messages, escalate when needed, and measure service quality**.

## Problem Statement

The live chat system has comprehensive infrastructure (WebSocket, Redis Pub/Sub, audit, health monitoring, session lifecycle, business hours, keyword handoff) but is missing 5 operator productivity and quality measurement features that prevent 100% compliance.

## Solution Statement

Implement 5 focused features that plug into existing infrastructure. Each feature is independent and can be implemented/tested in isolation. All use existing patterns (singleton services, audit decorators, WebSocket events, SQLAlchemy async models).

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Backend services, WebSocket endpoint, Frontend live-chat page, Database schema |
| Dependencies | redis>=5.0.0, pytz>=2024.1, python-jose[cryptography]>=3.3.0 (all installed) |
| Estimated Tasks | 14 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                           OPERATOR CONSOLE (CURRENT)                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌──────────────┐    ┌─────────────────────────┐    ┌──────────────┐   ║
║   │ Conversation │    │   Chat Messages Area     │    │  Customer    │   ║
║   │    List      │    │                          │    │   Info       │   ║
║   │              │    │   [messages...]           │    │             │   ║
║   │  - Search    │    │                          │    │  - Name     │   ║
║   │  - Filter    │    │   ┌──────────────────┐   │    │  - LINE ID  │   ║
║   │  - Status    │    │   │ Text Input [Send]│   │    │  - Status   │   ║
║   │              │    │   └──────────────────┘   │    │             │   ║
║   └──────────────┘    └─────────────────────────┘    └──────────────┘   ║
║                                                                          ║
║   MISSING:                                                               ║
║   - No quick reply templates → Operator types everything manually        ║
║   - No sound alerts → Misses messages when tab unfocused                 ║
║   - No transfer button → Cannot escalate to other operators              ║
║   - No CSAT survey → Cannot measure customer satisfaction                ║
║   - DEV_MODE=true → No real login, mock JWT token                        ║
║                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                        OPERATOR CONSOLE (ENHANCED)                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌──────────────┐    ┌─────────────────────────┐    ┌──────────────┐   ║
║   │ Conversation │    │ [User] [Claim] [Transfer]│    │  Customer    │   ║
║   │    List      │    │ [Done] [🔊/🔇]          │    │   Info       │   ║
║   │              │    │                          │    │             │   ║
║   │  🔔 Sound   │    │   [messages...]           │    │  - Name     │   ║
║   │  alerts on   │    │                          │    │  - LINE ID  │   ║
║   │  new msgs    │    │   ┌─────┬────────┬────┐  │    │  - Status   │   ║
║   │              │    │   │📋QR │Text    │Send│  │    │  - CSAT ⭐  │   ║
║   │              │    │   └─────┴────────┴────┘  │    │             │   ║
║   └──────────────┘    └─────────────────────────┘    └──────────────┘   ║
║                                                                          ║
║   NEW CAPABILITIES:                                                      ║
║   ✅ Quick Reply picker (📋) → 8+ Thai templates by category            ║
║   ✅ Sound alerts (🔊) → Plays on new msg when tab unfocused            ║
║   ✅ Transfer button → Select operator + reason, session reassigned      ║
║   ✅ CSAT survey → Auto-sent via LINE Flex after session close           ║
║   ✅ Real auth → Login page, JWT tokens, token refresh                   ║
║                                                                          ║
║   DATA FLOW (CSAT):                                                      ║
║   Operator closes → CSAT Flex sent to LINE user → User taps ⭐ →        ║
║   Postback received → CsatResponse saved → Analytics dashboard updated   ║
║                                                                          ║
║   DATA FLOW (Transfer):                                                  ║
║   Operator clicks Transfer → Selects target → WS transfer_session →     ║
║   Session.operator_id updated → Both operators notified → Audit logged   ║
║                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Chat input area | Plain text only | Quick Reply (📋) button opens template picker | Operators respond 3-5x faster with pre-written Thai responses |
| Chat header | Claim + Done buttons only | + Transfer button + Sound toggle | Can escalate and control alerts |
| Session close flow | Close → user returns to BOT | Close → CSAT Flex sent → user rates → returns to BOT | Satisfaction data collected automatically |
| Login | DEV_MODE auto-login mock admin | Real login page with username/password | Production-ready authentication |
| WebSocket auth | Mock JWT token accepted | Real JWT validated, token refresh on expiry | Secure operator sessions |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `backend/app/services/live_chat_service.py` | all | Pattern to MIRROR: audit decorator, session queries, LINE message sending |
| P0 | `backend/app/api/v1/endpoints/ws_live_chat.py` | all | WebSocket event handler pattern - add transfer_session event here |
| P0 | `frontend/app/admin/live-chat/page.tsx` | all | UI integration point for all frontend features |
| P1 | `backend/app/models/chat_session.py` | all | Schema to EXTEND with transfer fields |
| P1 | `backend/app/core/audit.py` | all | Audit decorator pattern to REUSE |
| P1 | `frontend/hooks/useLiveChatSocket.ts` | all | Hook to EXTEND with transfer event |
| P1 | `frontend/lib/websocket/types.ts` | all | Types to EXTEND with new MessageTypes |
| P1 | `frontend/contexts/AuthContext.tsx` | all | Auth context to modify for production login |
| P2 | `backend/app/core/security.py` | all | JWT functions already implemented |
| P2 | `backend/app/api/deps.py` | all | Auth dependency injection pattern |
| P2 | `backend/app/core/config.py` | all | Settings pattern, ENVIRONMENT var |
| P2 | `backend/app/models/csat_response.py` | all | CSAT model already exists |
| P2 | `backend/app/api/v1/api.py` | all | Router registration pattern |

---

## Patterns to Mirror

**SINGLETON_SERVICE:**
```python
# SOURCE: backend/app/services/live_chat_service.py:494
# Every service is instantiated as module-level singleton
live_chat_service = LiveChatService()
```

**AUDIT_DECORATOR:**
```python
# SOURCE: backend/app/services/live_chat_service.py:145-160
@audit_action("claim_session", "chat_session")
async def claim_session(self, line_user_id: str, operator_id: int, db: AsyncSession):
    session = await self.get_active_session(line_user_id, db)
    if session and session.status == SessionStatus.WAITING:
        session.operator_id = operator_id
        session.status = SessionStatus.ACTIVE
        session.claimed_at = datetime.utcnow()
        session.last_activity_at = datetime.utcnow()
        await db.commit()
    return session
```

**WS_EVENT_HANDLER:**
```python
# SOURCE: backend/app/api/v1/endpoints/ws_live_chat.py (event dispatch pattern)
# Each event type is handled as an elif block in the main receive loop:
elif event_type == "claim_session":
    line_user_id = payload.get("line_user_id")
    # ... validate, call service, broadcast result
```

**MODEL_DEFINITION:**
```python
# SOURCE: backend/app/models/chat_session.py:17-33
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    # ... columns use Column(Type, nullable=, default=, index=)
```

**FRONTEND_HOOK_EVENT:**
```typescript
// SOURCE: frontend/hooks/useLiveChatSocket.ts:95-100
// Event handlers follow onXxxEvent callback pattern:
case MessageType.SESSION_CLAIMED:
    options.onSessionClaimed?.(payload.line_user_id, payload.operator_id);
    break;
```

**FRONTEND_BUTTON_PATTERN:**
```tsx
// SOURCE: frontend/app/admin/live-chat/page.tsx:839-843
// Buttons in chat header use same pattern:
{currentChat?.session?.status === 'WAITING' && (
    <button onClick={handleClaim} disabled={claiming} className="flex items-center gap-1 px-3 py-1.5 ...">
        {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        {claiming ? 'Claiming...' : 'Claim'}
    </button>
)}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `backend/app/models/canned_response.py` | CREATE | Canned response model |
| `backend/app/services/canned_response_service.py` | CREATE | CRUD + default templates |
| `backend/app/api/v1/endpoints/admin_canned_responses.py` | CREATE | REST API for canned responses |
| `backend/app/services/csat_service.py` | CREATE | CSAT survey send + record |
| `backend/app/api/v1/endpoints/auth.py` | CREATE | Login + refresh endpoints |
| `backend/alembic/versions/xxx_add_canned_responses_and_transfer.py` | CREATE | Migration for new tables/columns |
| `backend/app/models/chat_session.py` | UPDATE | Add transfer_count, transfer_reason fields |
| `backend/app/services/live_chat_service.py` | UPDATE | Add transfer_session method, CSAT trigger on close |
| `backend/app/api/v1/endpoints/ws_live_chat.py` | UPDATE | Add transfer_session event handler |
| `backend/app/api/v1/api.py` | UPDATE | Register new routers |
| `backend/app/models/__init__.py` | UPDATE | Import CannedResponse |
| `frontend/lib/websocket/types.ts` | UPDATE | Add TRANSFER_SESSION, SESSION_TRANSFERRED types |
| `frontend/hooks/useLiveChatSocket.ts` | UPDATE | Add transferSession method, onSessionTransferred callback |
| `frontend/components/admin/CannedResponsePicker.tsx` | CREATE | Quick reply popover UI |
| `frontend/hooks/useNotificationSound.ts` | CREATE | Sound notification hook |
| `frontend/app/admin/live-chat/page.tsx` | UPDATE | Integrate transfer UI, canned picker, sound toggle |
| `frontend/contexts/AuthContext.tsx` | UPDATE | Set DEV_MODE=false, implement real login flow |

---

## NOT Building (Scope Limits)

- **Login page UI** - Out of scope; just need the backend endpoints and AuthContext update. A login page can be a follow-up task.
- **Canned response admin CRUD UI** - Out of scope; backend API is enough. Operators use the picker, admins manage via API/database.
- **CSAT analytics dashboard** - Already exists in Phase 4 (Kimi Code). Just need the data collection pipeline.
- **Sound file creation** - Will use Web Audio API tone generation, not custom .mp3 files.
- **Browser push notifications** - Nice-to-have but not required for compliance. Focus on in-tab audio.
- **Operator availability status** (online/away/busy) - Was in Phase 5 of original plan but is not a compliance blocker.
- **Concurrent chat limits** - Was in Phase 5 but is not a compliance blocker.

---

## Step-by-Step Tasks

### Task 1: UPDATE `backend/app/models/chat_session.py` - Add transfer fields

- **ACTION**: Add `transfer_count` and `transfer_reason` columns to ChatSession
- **IMPLEMENT**:
  ```python
  transfer_count = Column(Integer, default=0)
  transfer_reason = Column(String(255), nullable=True)
  ```
- **MIRROR**: Existing column pattern in `chat_session.py:20-30`
- **GOTCHA**: Do NOT rename existing columns or break relationships
- **VALIDATE**: `cd backend && python -c "from app.models.chat_session import ChatSession; print('OK')"`

### Task 2: CREATE `backend/app/models/canned_response.py` - Model

- **ACTION**: Create CannedResponse SQLAlchemy model
- **IMPLEMENT**:
  - Fields: `id`, `shortcut` (unique, e.g. "/greeting"), `title`, `content` (Text), `category` (greeting/closing/escalation/info), `is_active`, `usage_count`, `created_by` (FK users.id), `created_at`, `updated_at`
- **MIRROR**: `backend/app/models/chat_session.py` for Base import and Column patterns
- **IMPORTS**: `from app.db.base import Base`
- **VALIDATE**: `python -c "from app.models.canned_response import CannedResponse; print('OK')"`

### Task 3: UPDATE `backend/app/models/__init__.py` - Register new model

- **ACTION**: Add import for CannedResponse
- **MIRROR**: Existing import pattern in `__init__.py`
- **VALIDATE**: `python -c "from app.models import CannedResponse; print('OK')"`

### Task 4: CREATE migration `backend/alembic/versions/b2c3d4e5f6g7_add_canned_responses_and_transfer.py`

- **ACTION**: Create Alembic migration for:
  1. `canned_responses` table (all fields from Task 2)
  2. Add `transfer_count` INTEGER DEFAULT 0 to `chat_sessions`
  3. Add `transfer_reason` VARCHAR(255) NULLABLE to `chat_sessions`
- **MIRROR**: `backend/alembic/versions/a1b2c3d4e5f6_add_audit_business_hours_csat_tables.py` for migration structure
- **GOTCHA**: Use `op.add_column` for existing table, `op.create_table` for new table. Include downgrade.
- **VALIDATE**: `cd backend && alembic upgrade head`

### Task 5: CREATE `backend/app/services/canned_response_service.py` - Service + defaults

- **ACTION**: Create service with CRUD methods and Thai default templates
- **IMPLEMENT**:
  - `get_all(db, category=None)` - List all active responses
  - `get_by_shortcut(db, shortcut)` - Lookup by /shortcut
  - `create(db, data)` / `update(db, id, data)` / `delete(db, id)`
  - `increment_usage(db, id)` - Track usage count
  - `initialize_defaults(db)` - Seed 8 default Thai templates
  - Default templates: `/greeting`, `/closing`, `/wait`, `/transfer`, `/hours`, `/contact`, `/thanks`, `/sorry`
- **MIRROR**: Singleton pattern from `live_chat_service.py:494`
- **VALIDATE**: `python -c "from app.services.canned_response_service import canned_response_service; print('OK')"`

### Task 6: CREATE `backend/app/api/v1/endpoints/admin_canned_responses.py` - REST API

- **ACTION**: Create CRUD endpoints for canned responses
- **IMPLEMENT**:
  - `GET /admin/canned-responses` - List all (with optional category filter)
  - `POST /admin/canned-responses` - Create new
  - `PUT /admin/canned-responses/{id}` - Update
  - `DELETE /admin/canned-responses/{id}` - Soft delete (is_active=False)
- **MIRROR**: Router pattern from `backend/app/api/v1/endpoints/admin_audit.py`
- **IMPORTS**: `from app.api.deps import get_db, get_current_admin`
- **VALIDATE**: Start server and check `/api/v1/docs` shows new endpoints

### Task 7: CREATE `backend/app/services/csat_service.py` - CSAT survey flow

- **ACTION**: Create service to send CSAT survey and record responses
- **IMPLEMENT**:
  - `send_survey(line_user_id, session_id)` - Send LINE Flex Message with 1-5 star rating buttons using postback actions (`data=f"csat|{session_id}|{score}"`)
  - `record_response(session_id, line_user_id, score, comment, db)` - Save to CsatResponse (existing model), prevent duplicates
  - Thai text: "ขอบคุณที่ใช้บริการ กรุณาให้คะแนนความพึงพอใจ"
  - Thank-you messages customized by score (1-2: will improve, 3: thanks, 4-5: happy to serve)
- **MIRROR**: `live_chat_service.py:95-143` for Flex Message building pattern
- **GOTCHA**: CsatResponse model already exists at `backend/app/models/csat_response.py`. Just create the service.
- **VALIDATE**: `python -c "from app.services.csat_service import csat_service; print('OK')"`

### Task 8: UPDATE `backend/app/services/live_chat_service.py` - Transfer + CSAT trigger

- **ACTION**: Add two features to existing service:
  1. `transfer_session(line_user_id, from_operator_id, to_operator_id, reason, db)` method with `@audit_action("transfer_session", "chat_session")` decorator
  2. In `close_session()` - Add CSAT survey send after closing
- **IMPLEMENT** (transfer):
  - Verify session exists and is ACTIVE
  - Verify from_operator matches current session.operator_id
  - Update session.operator_id to to_operator_id
  - Increment session.transfer_count
  - Set session.transfer_reason
  - Commit and return session
- **IMPLEMENT** (CSAT):
  - After session.status = CLOSED, call `csat_service.send_survey(line_user_id, session.id)` wrapped in try/except
- **MIRROR**: `claim_session()` at line 145-160 for pattern
- **GOTCHA**: Import csat_service at top of file. Handle missing import gracefully.
- **VALIDATE**: `python -c "from app.services.live_chat_service import live_chat_service; print(hasattr(live_chat_service, 'transfer_session'))"`

### Task 9: UPDATE `backend/app/api/v1/endpoints/ws_live_chat.py` - Add transfer event + CSAT postback

- **ACTION**: Add `transfer_session` WebSocket event handler
- **IMPLEMENT**:
  ```python
  elif event_type == "transfer_session":
      to_operator_id = payload.get("to_operator_id")
      reason = payload.get("reason", "")
      line_user_id = payload.get("line_user_id")
      # validate, call live_chat_service.transfer_session(), broadcast session_transferred
  ```
- **MIRROR**: `claim_session` handler pattern (lines 396-443)
- **BROADCAST**: `session_transferred` event with from/to operator info
- **VALIDATE**: Start server, check WebSocket endpoint accepts new event

### Task 10: UPDATE `backend/app/api/v1/endpoints/webhook.py` - CSAT postback handler

- **ACTION**: Add handler for CSAT postback events (`data.startswith("csat|")`)
- **IMPLEMENT**: Parse `csat|{session_id}|{score}` from postback data, call `csat_service.record_response()`, reply with thank-you message
- **MIRROR**: Existing postback handling pattern in webhook.py
- **VALIDATE**: `python -c "from app.api.v1.endpoints.webhook import router; print('OK')"`

### Task 11: UPDATE `backend/app/api/v1/api.py` - Register new routers

- **ACTION**: Add canned_responses router to API
- **IMPLEMENT**: Import and include `admin_canned_responses.router` with prefix `/admin/canned-responses`
- **MIRROR**: Existing router registration pattern
- **VALIDATE**: Start server, check `/api/v1/docs`

### Task 12: UPDATE `frontend/lib/websocket/types.ts` - Add new event types

- **ACTION**: Add transfer-related MessageType values and interfaces
- **IMPLEMENT**:
  - Add to MessageType enum: `TRANSFER_SESSION = 'transfer_session'`, `SESSION_TRANSFERRED = 'session_transferred'`
  - Add `SessionTransferredPayload` interface: `{ line_user_id, from_operator: {id, username}, to_operator: {id, username}, reason, transferred_at }`
- **MIRROR**: Existing enum/interface patterns in types.ts
- **VALIDATE**: `cd frontend && npx tsc --noEmit`

### Task 13: CREATE frontend components and hooks

- **ACTION**: Create three files:
  1. `frontend/components/admin/CannedResponsePicker.tsx` - Popover with search, category badges, template list. On select, fills message input.
  2. `frontend/hooks/useNotificationSound.ts` - Web Audio API beep tone (no .mp3 needed). Play on new_message when tab not focused. Toggle on/off. Volume control. Persist preference in localStorage.
- **IMPLEMENT** (CannedResponsePicker):
  - Fetch from `GET /admin/canned-responses` on mount
  - Search filters by shortcut, title, content
  - Category color badges (green=greeting, blue=closing, orange=escalation, gray=info)
  - Click template → `onSelect(content)` callback
  - Uses Popover pattern (div with absolute positioning, no shadcn dependency)
- **IMPLEMENT** (useNotificationSound):
  - Use `AudioContext` + `OscillatorNode` for simple beep (440Hz, 200ms)
  - `play(type)` function, `playIfNotFocused(type)` using `document.hasFocus()`
  - `enabled`/`setEnabled` state, persisted to localStorage `notification_sound_enabled`
- **MIRROR**: Component pattern from `ChatModeToggle.tsx`, hook pattern from `useSessionTimeout.ts`
- **VALIDATE**: `cd frontend && npx tsc --noEmit`

### Task 14: UPDATE `frontend/app/admin/live-chat/page.tsx` - Integrate all features

- **ACTION**: Add Transfer button, CannedResponsePicker, Sound toggle to live chat UI
- **IMPLEMENT**:
  1. **Transfer button** in chat header (next to Done button): Opens modal with operator dropdown + reason input. Calls `ws.send('transfer_session', { to_operator_id, reason, line_user_id })`.
  2. **CannedResponsePicker** button (📋) next to message input: On select, fills input text.
  3. **Sound toggle** button (🔊/🔇) in chat header: Uses `useNotificationSound` hook. Plays on new_message event when tab unfocused.
  4. **Handle SESSION_TRANSFERRED** event: Update conversation list to reflect new operator.
- **MIRROR**: Existing button patterns in chat header (lines 839-848)
- **GOTCHA**: Do not break existing Claim/Done button logic. Add new buttons alongside.
- **VALIDATE**: `cd frontend && npm run build`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `backend/tests/test_canned_responses.py` | CRUD operations, default seeding, shortcut uniqueness | Canned response service |
| `backend/tests/test_csat_service.py` | Survey send, response recording, duplicate prevention | CSAT flow |
| `backend/tests/test_transfer.py` | Transfer success, wrong operator, no session, audit log | Transfer logic |

### Edge Cases Checklist

- [ ] Transfer to self (should reject)
- [ ] Transfer non-existent session (should error)
- [ ] Transfer by non-assigned operator (should reject)
- [ ] CSAT duplicate response (should return existing, not create new)
- [ ] CSAT postback with invalid session_id (should handle gracefully)
- [ ] Canned response with duplicate shortcut (should reject)
- [ ] Sound notification when tab IS focused (should NOT play)
- [ ] CannedResponsePicker when API is down (should show error, not crash)
- [ ] Transfer when target operator is offline (should still work - they see it when they reconnect)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
# Backend
cd backend && python -c "from app.main import app; print('Backend imports OK')"

# Frontend
cd frontend && npx tsc --noEmit
```

**EXPECT**: Exit 0, no errors

### Level 2: UNIT_TESTS

```bash
cd backend && python -m pytest tests/test_canned_responses.py tests/test_csat_service.py tests/test_transfer.py -v
```

**EXPECT**: All tests pass

### Level 3: FULL_SUITE

```bash
cd backend && python -m pytest
cd frontend && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION

```bash
cd backend && alembic upgrade head && alembic current
```

**EXPECT**: Migration applied successfully, at head

### Level 6: MANUAL_VALIDATION

1. Start backend + frontend
2. Open live chat at http://localhost:3000/admin/live-chat
3. Click 📋 button → canned response picker opens with 8 templates
4. Select template → text fills in input
5. Claim a WAITING session → Done button appears
6. Click Transfer → modal shows operator list + reason
7. Transfer → session moves to target operator
8. Close session → CSAT Flex Message sent to LINE user (verify in logs)
9. Unfocus tab → send message from LINE → audio beep plays
10. Toggle 🔇 → no sound on next message

---

## Acceptance Criteria

- [ ] 8+ Thai canned response templates seeded in database
- [ ] CannedResponsePicker UI with search and category filtering
- [ ] Sound notification plays for new messages when tab unfocused
- [ ] Sound toggle persists across page refreshes
- [ ] Operator can transfer ACTIVE session to another operator
- [ ] Transfer creates audit log entry
- [ ] Transfer notifies both operators via WebSocket
- [ ] CSAT survey sent automatically when session closes
- [ ] CSAT postback recorded in csat_responses table
- [ ] Duplicate CSAT responses prevented
- [ ] All new code follows existing patterns (audit decorator, singleton service, etc.)
- [ ] No regressions in existing live chat functionality

---

## Completion Checklist

- [ ] All 14 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis passes (backend imports + frontend tsc)
- [ ] Level 2: Unit tests pass
- [ ] Level 3: Full test suite + build succeeds
- [ ] Level 4: Database migration applied
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Alembic migration conflicts with existing migrations | MED | HIGH | Check `alembic current` before creating; use unique revision ID |
| LINE Flex Message format errors for CSAT | LOW | MED | Test with LINE's Flex Message Simulator first |
| Web Audio API blocked by browser autoplay policy | MED | LOW | Only play after user interaction (page click); graceful fallback |
| Frontend build break from new imports | LOW | MED | Run `npx tsc --noEmit` after each frontend change |
| Transfer race condition (two operators claim simultaneously) | LOW | MED | Check operator_id matches before transfer; DB constraint |

---

## Notes

### What's Already Done (DO NOT RE-IMPLEMENT)

The following are already fully implemented and working. Do NOT create duplicate implementations:

1. **Webhook deduplication** - `webhook.py:63-76` (Redis-backed)
2. **JWT authentication** - `security.py` (create/verify tokens)
3. **WebSocket auth** - `ws_live_chat.py:28-101` (JWT + dev fallback)
4. **Auth dependencies** - `deps.py` (get_current_user, get_current_admin)
5. **Redis Pub/Sub** - `pubsub_manager.py` + `websocket_manager.py` (cross-server)
6. **WebSocket health monitor** - `websocket_health.py` + `health.py`
7. **Session auto-cleanup** - `tasks/session_cleanup.py` (30min timeout)
8. **Business hours** - `business_hours_service.py` (Mon-Fri 08:00-17:00)
9. **Keyword handoff** - `handoff_service.py` (Thai/English keywords)
10. **Queue position** - `live_chat_service.py:211-273` (FIFO + estimated wait)
11. **Audit logging** - `audit.py` decorator + `audit_log.py` model
12. **Session timeout** - `useSessionTimeout.ts` + `SessionTimeoutWarning.tsx` (30min + 5min warning)
13. **Rate limiting** - WebSocket rate limiter (30 msgs/60s)
14. **CsatResponse model** - `csat_response.py` (model exists, just needs service)
15. **Analytics dashboard** - Phase 4 complete (8 KPI cards, audit viewer)

### Auth Login Endpoint (Optional Enhancement)

The backend `security.py` has JWT create/verify but no login endpoint exists (`/api/v1/auth/login`). The frontend AuthContext has a `login()` method that calls this endpoint. Creating this endpoint is a production requirement but is tracked separately - the plan focuses on the 5 compliance features. If time permits, add:
- `POST /api/v1/auth/login` - Accept username/password, return JWT
- `POST /api/v1/auth/refresh` - Accept Bearer token, return new JWT
