# Investigation: Live Chat Issues - Code Quality & Error Handling

**Issue**: Free-form investigation - Live chat code quality and error handling improvements
**Type**: REFACTOR
**Investigated**: 2026-02-01T15:30:00Z

### Assessment

| Metric     | Value   | Reasoning                                                                 |
| ---------- | ------- | ------------------------------------------------------------------------- |
| Priority   | MEDIUM  | Issues are code quality improvements that prevent future bugs but current functionality works |
| Complexity | MEDIUM  | 6+ files across backend and frontend with WebSocket and REST integration points |
| Confidence | HIGH    | Clear code patterns identified with specific line numbers and evidence |

---

## Problem Statement

The live chat implementation has several code quality issues including hardcoded values, unsafe type conversions, race conditions, memory leaks, and inconsistent error handling. These issues don't currently break functionality but could cause problems under load or edge cases.

---

## Analysis

### Root Cause / Change Rationale

The live chat system was rapidly developed and needs refinement for production readiness. Key issues include:

1. **Hardcoded Admin ID** - Security/functionality risk
2. **Unsafe type conversions** - Potential runtime crashes
3. **Race conditions** - Message delivery issues under load
4. **Memory leaks** - Unbounded growth in WebSocket manager
5. **Silent failures** - Errors logged but not propagated to users

### Evidence Chain

**Issue 1: Hardcoded Admin ID (HIGH PRIORITY)**

WHY: All WebSocket connections use admin ID "1"
↓ BECAUSE: The adminId is hardcoded in the hook
Evidence: `frontend/hooks/useLiveChatSocket.ts:128` - `adminId: '1', // Mock admin ID - should come from auth context`

↓ ROOT CAUSE: No auth context integration for dynamic admin ID
Evidence: `frontend/hooks/useLiveChatSocket.ts:1-30` - No import of auth context, adminId passed as prop but defaulted to '1'

---

**Issue 2: Unsafe Type Conversion**

WHY: Potential ValueError if admin_id is not a valid integer string
↓ BECAUSE: Direct int() conversion without validation
Evidence: `backend/app/api/v1/endpoints/ws_live_chat.py:302` - `int(admin_id)` without try-catch

↓ ROOT CAUSE: No input validation before type conversion
Evidence: `backend/app/api/v1/endpoints/ws_live_chat.py:295-305` - Conversion happens in message handler without validation

---

**Issue 3: Race Condition in Message Sending**

WHY: Messages could be lost during connection state changes
↓ BECAUSE: State check and send are not atomic operations
Evidence: `frontend/lib/websocket/client.ts:176-183` - Check `readyState` then send, but connection could close between check and send

↓ ROOT CAUSE: No atomic operation or locking mechanism
Evidence: `frontend/lib/websocket/client.ts:176-203` - Two separate operations without synchronization

---

**Issue 4: Memory Leak in WebSocket Manager**

WHY: admin_metadata grows unbounded over time
↓ BECAUSE: No cleanup of offline admin entries
Evidence: `backend/app/core/websocket_manager.py:155-165` - `get_online_admins()` iterates all metadata but offline entries are never removed

↓ ROOT CAUSE: Missing cleanup in disconnect handler
Evidence: `backend/app/core/websocket_manager.py:85-95` - `disconnect()` removes from room but doesn't clean up `admin_metadata`

---

**Issue 5: Silent Failures**

WHY: Errors are logged but callers don't know about failures
↓ BECAUSE: Exceptions caught and logged without re-raising or returning status
Evidence: `backend/app/core/websocket_manager.py:114-119` - `send_personal()` catches all exceptions, logs them, but returns None

↓ ROOT CAUSE: No return value or exception propagation
Evidence: `backend/app/core/websocket_manager.py:114-119` - Function has no return value to indicate success/failure

---

### Affected Files

| File | Lines | Action | Description |
| ---- | ----- | ------ | ----------- |
| `frontend/hooks/useLiveChatSocket.ts` | 15-35 | UPDATE | Accept adminId from props/context instead of hardcoded |
| `frontend/hooks/useLiveChatSocket.ts` | 128 | UPDATE | Remove hardcoded adminId default |
| `frontend/app/admin/live-chat/page.tsx` | 45-60 | UPDATE | Get admin ID from auth and pass to hook |
| `backend/app/api/v1/endpoints/ws_live_chat.py` | 295-305 | UPDATE | Add try-catch around int(admin_id) conversion |
| `backend/app/api/v1/endpoints/ws_live_chat.py` | 360-410 | UPDATE | Add error responses for claim/close session failures |
| `frontend/lib/websocket/client.ts` | 176-203 | UPDATE | Add atomic send with proper error handling |
| `backend/app/core/websocket_manager.py` | 85-95 | UPDATE | Clean up admin_metadata on disconnect |
| `backend/app/core/websocket_manager.py` | 114-119 | UPDATE | Return success/failure status from send_personal |
| `backend/app/core/websocket_manager.py` | 136-143 | UPDATE | Return success/failure status from broadcast_to_room |

### Integration Points

- `frontend/app/admin/live-chat/page.tsx:45` - Uses useLiveChatSocket hook
- `backend/app/api/v1/endpoints/ws_live_chat.py:295` - Receives admin_id from WebSocket auth
- `backend/app/services/live_chat_service.py` - Called by WebSocket handlers for DB operations
- `backend/app/core/websocket_manager.py` - Used by ws_live_chat.py for room management

### Git History

- **Introduced**: e8624df - feat(frontend,db): add live chat UI and database migrations
- **Last modified**: 67387c4 - fix(live-chat): fix navigation, sidebar overlap, and API error handling
- **Implication**: These are pre-existing code quality issues from initial implementation, not regressions

---

## Implementation Plan

### Step 1: Fix Hardcoded Admin ID

**File**: `frontend/hooks/useLiveChatSocket.ts`
**Lines**: 15-35, 128
**Action**: UPDATE

**Current code:**

```typescript
// Line 15-25 (interface)
interface UseLiveChatSocketOptions {
  url?: string;
  adminId?: string;  // Optional with default
}

// Line 128
const { send, connectionState, isConnected, reconnect } = useWebSocket({
    url: wsUrl,
    adminId: '1', // Mock admin ID - should come from auth context
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
});
```

**Required change:**

```typescript
// Make adminId required
interface UseLiveChatSocketOptions {
  url?: string;
  adminId: string;  // Required - must be provided
}

// Remove default, use from props
const { adminId } = options;

const { send, connectionState, isConnected, reconnect } = useWebSocket({
    url: wsUrl,
    adminId, // Use from options
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
});
```

**Why**: Ensures proper authentication and prevents all users appearing as admin "1"

---

### Step 2: Update Live Chat Page to Pass Admin ID

**File**: `frontend/app/admin/live-chat/page.tsx`
**Lines**: 45-60
**Action**: UPDATE

**Current code:**

```typescript
// Line 45-50
export default function LiveChatPage() {
    // ...
    const {
        // ...
    } = useLiveChatSocket({
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/live-chat'
    });
```

**Required change:**

```typescript
// Add auth context import and usage
import { useAuth } from '@/hooks/useAuth'; // or appropriate auth hook

export default function LiveChatPage() {
    const { user } = useAuth(); // Get authenticated user
    // ...
    const {
        // ...
    } = useLiveChatSocket({
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/live-chat',
        adminId: user?.id || '' // Pass actual admin ID
    });
```

**Why**: Connects the live chat to actual authentication system

---

### Step 3: Add Safe Type Conversion in WebSocket Handler

**File**: `backend/app/api/v1/endpoints/ws_live_chat.py`
**Lines**: 295-305
**Action**: UPDATE

**Current code:**

```python
# Line 295-305
if msg_type == WSEventType.SEND_MESSAGE.value:
    text = payload.get("text", "").strip()
    if not text:
        continue

    async with AsyncSessionLocal() as db:
        message = await live_chat_service.send_message(
            line_user_id, text, int(admin_id), db
        )
```

**Required change:**

```python
# Add validation
try:
    admin_id_int = int(admin_id)
except (ValueError, TypeError):
    await websocket.send_json({
        "type": WSEventType.ERROR.value,
        "payload": {
            "code": WSErrorCode.INVALID_REQUEST.value,
            "message": "Invalid admin ID format"
        }
    })
    continue

if msg_type == WSEventType.SEND_MESSAGE.value:
    text = payload.get("text", "").strip()
    if not text:
        await websocket.send_json({
            "type": WSEventType.ERROR.value,
            "payload": {
                "code": WSErrorCode.INVALID_REQUEST.value,
                "message": "Message text cannot be empty"
            }
        })
        continue

    async with AsyncSessionLocal() as db:
        message = await live_chat_service.send_message(
            line_user_id, text, admin_id_int, db
        )
```

**Why**: Prevents server crashes from malformed admin IDs and provides proper error feedback

---

### Step 4: Add Error Responses for Session Operations

**File**: `backend/app/api/v1/endpoints/ws_live_chat.py`
**Lines**: 360-410
**Action**: UPDATE

**Current code:**

```python
# Line 363-368
if msg_type == WSEventType.CLAIM_SESSION.value:
    if not current_room:
        continue  # Silent failure

    line_user_id = current_room.split(":")[1]

    async with AsyncSessionLocal() as db:
        # ...
```

**Required change:**

```python
if msg_type == WSEventType.CLAIM_SESSION.value:
    if not current_room:
        await websocket.send_json({
            "type": WSEventType.ERROR.value,
            "payload": {
                "code": WSErrorCode.NOT_IN_ROOM.value,
                "message": "Must join a conversation before claiming session"
            }
        })
        continue

    line_user_id = current_room.split(":")[1]

    async with AsyncSessionLocal() as db:
        try:
            session = await live_chat_service.claim_session(line_user_id, admin_id_int, db)
            if not session:
                await websocket.send_json({
                    "type": WSEventType.ERROR.value,
                    "payload": {
                        "code": WSErrorCode.SESSION_NOT_FOUND.value,
                        "message": "Session not found or already claimed"
                    }
                })
                continue
        except Exception as e:
            logger.error(f"Error claiming session: {e}")
            await websocket.send_json({
                "type": WSEventType.ERROR.value,
                "payload": {
                    "code": WSErrorCode.INTERNAL_ERROR.value,
                    "message": "Failed to claim session"
                }
            })
            continue
```

**Why**: Provides clear error feedback instead of silent failures

---

### Step 5: Fix Race Condition in WebSocket Client

**File**: `frontend/lib/websocket/client.ts`
**Lines**: 176-203
**Action**: UPDATE

**Current code:**

```typescript
// Line 176-183
send(type: MessageType | string, payload: unknown): void {
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
        this.sendRaw(type, payload);
    } else {
        this.messageQueue.enqueue(type, payload);
    }
}
```

**Required change:**

```typescript
send(type: MessageType | string, payload: unknown): boolean {
    // Use a single atomic check
    const ws = this.ws;
    if (this.state === 'connected' && ws?.readyState === WebSocket.OPEN) {
        try {
            this.sendRaw(type, payload);
            return true;
        } catch (error) {
            // If send fails, queue for retry
            console.error('Failed to send WebSocket message, queueing:', error);
            this.messageQueue.enqueue(type, payload);
            return false;
        }
    } else {
        this.messageQueue.enqueue(type, payload);
        return false;
    }
}
```

**Why**: Handles send failures gracefully and provides feedback to caller

---

### Step 6: Fix Memory Leak in WebSocket Manager

**File**: `backend/app/core/websocket_manager.py`
**Lines**: 85-95
**Action**: UPDATE

**Current code:**

```python
# Line 85-95
async def disconnect(self, websocket: WebSocket, admin_id: str):
    """Remove connection and clean up rooms."""
    if admin_id in self.active_connections:
        del self.active_connections[admin_id]

    # Remove from all rooms
    for room_id in list(self.rooms.keys()):
        if admin_id in self.rooms[room_id]:
            self.rooms[room_id].remove(admin_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
```

**Required change:**

```python
async def disconnect(self, websocket: WebSocket, admin_id: str):
    """Remove connection and clean up rooms."""
    if admin_id in self.active_connections:
        del self.active_connections[admin_id]

    # Clean up admin metadata to prevent memory leak
    if admin_id in self.admin_metadata:
        del self.admin_metadata[admin_id]

    # Remove from all rooms
    for room_id in list(self.rooms.keys()):
        if admin_id in self.rooms[room_id]:
            self.rooms[room_id].remove(admin_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
```

**Why**: Prevents unbounded memory growth from stale admin metadata

---

### Step 7: Add Return Status to Send Methods

**File**: `backend/app/core/websocket_manager.py`
**Lines**: 114-119, 136-143
**Action**: UPDATE

**Current code:**

```python
# Line 114-119
async def send_personal(self, websocket: WebSocket, data: dict):
    try:
        await websocket.send_json(data)
    except Exception as e:
        logger.error(f"Error sending to websocket: {e}")
```

**Required change:**

```python
async def send_personal(self, websocket: WebSocket, data: dict) -> bool:
    """Send message to specific websocket. Returns True if successful."""
    try:
        await websocket.send_json(data)
        return True
    except Exception as e:
        logger.error(f"Error sending to websocket: {e}")
        return False
```

And for broadcast:

```python
async def broadcast_to_room(self, room_id: str, data: dict, exclude_admin: Optional[str] = None) -> int:
    """Broadcast to all in room. Returns count of successful sends."""
    if room_id not in self.rooms:
        return 0

    success_count = 0
    for admin_id in self.rooms[room_id]:
        if admin_id == exclude_admin:
            continue
        if admin_id in self.active_connections:
            if await self.send_personal(self.active_connections[admin_id], data):
                success_count += 1

    return success_count
```

**Why**: Allows callers to handle delivery failures appropriately

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: frontend/hooks/useTheme.ts:1-15
// Pattern for hook options with required props
import { useState, useEffect } from 'react';

interface UseThemeOptions {
  defaultTheme?: string;  // Optional with default
}

export function useTheme(options: UseThemeOptions = {}) {
    const { defaultTheme = 'light' } = options;
    // ...
}
```

```python
# SOURCE: backend/app/api/v1/endpoints/webhook.py:45-60
# Pattern for error handling with specific error codes
try:
    # ... operation
except ValueError as e:
    logger.error(f"Validation error: {e}")
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

---

## Edge Cases & Risks

| Risk/Edge Case | Mitigation |
| -------------- | ---------- |
| Auth context not available | Add fallback to localStorage or require login |
| WebSocket disconnect during send | Message queued for retry on reconnect |
| Database transaction failure | Use explicit transaction with rollback |
| Concurrent admin metadata access | Use asyncio.Lock if needed (currently single-threaded) |
| Large message queue | Add max queue size and drop oldest |

---

## Validation

### Automated Checks

```bash
# Type checking
cd frontend && npm run type-check

# Backend type checking
cd backend && python -m mypy app/

# Run tests
cd frontend && npm test -- --testPathPattern="live-chat|websocket"
cd backend && python -m pytest tests/ -v -k "websocket or live_chat"

# Linting
cd frontend && npm run lint
cd backend && python -m ruff check app/
```

### Manual Verification

1. Open live chat page and verify admin ID is correctly passed in auth message
2. Check browser DevTools Network tab for WebSocket messages
3. Verify error messages appear in UI when operations fail
4. Test reconnect after network interruption - messages should be queued and sent
5. Monitor backend logs for any unhandled exceptions

---

## Scope Boundaries

**IN SCOPE:**

- Hardcoded admin ID fix
- Type conversion safety
- Error response improvements
- Race condition fixes
- Memory leak fixes
- Return status from send methods

**OUT OF SCOPE (do not touch):**

- WebSocket protocol changes
- Database schema modifications
- LINE API integration changes
- UI/UX redesign (already completed)
- Authentication system implementation (use existing)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-01T15:30:00Z
- **Artifact**: `.claude/PRPs/issues/investigation-live-chat-issues-20260201.md`
