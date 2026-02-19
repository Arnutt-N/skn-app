# Investigation: Live Chat Real-time Display, Spinner, and UI Spacing Issues

**Issue**: Free-form (no GitHub issue)
**Type**: BUG
**Investigated**: 2026-02-04T14:30:00+07:00

### Assessment

| Metric     | Value    | Reasoning                                                                                       |
| ---------- | -------- | ----------------------------------------------------------------------------------------------- |
| Severity   | HIGH     | Core real-time messaging broken - messages require refresh, infinite spinners degrade UX       |
| Complexity | MEDIUM   | 3 files affected, clear root causes, no architectural changes needed                           |
| Confidence | HIGH     | Root causes clearly identified with code evidence, straightforward fixes                       |

---

## Problem Statement

Three related issues in the Live Chat admin interface:

1. **Real-time message display failure**: Messages from LINE users don't appear automatically. Admin must refresh the page to see new messages.
2. **Infinite spinner**: When admin sends a message, the loading spinner under the balloon message spins indefinitely.
3. **UI spacing issues**: Insufficient spacing between balloon messages and UI elements (spinner, labels) - violates UI best practices.

---

## Analysis

### Root Cause 1: Messages Not Displaying in Real-Time

**WHY 1**: Why don't messages appear in real-time?
- The `handleNewMessage` callback silently drops messages when `selectedId` doesn't match.

**WHY 2**: Why does selectedId not match?
- When a new conversation receives a message, the admin hasn't selected it yet, so `selectedId` is either `null` or a different conversation.

**ROOT CAUSE**: The `handleNewMessage` function only adds messages to state when `selectedId === message.line_user_id`. All other messages are dropped - only `fetchConversations()` is called to update unread counts.

**Evidence**: `frontend/app/admin/live-chat/page.tsx:68-73`
```typescript
const handleNewMessage = useCallback((message: Message) => {
    // Only show messages for currently selected conversation
    if (message.line_user_id !== selectedId) {
        // Still refresh conversations list for unread counts
        fetchConversations();
        return;  // <-- MESSAGE IS DROPPED HERE
    }
    // ... message added only if selected
}, [selectedId]);
```

**Additional Issue**: When admin selects a new conversation, messages are fetched via REST API (`fetchChatDetail`). If WebSocket events arrived while conversation was not selected, they're lost forever (not stored).

### Root Cause 2: Infinite Spinner

**WHY 1**: Why does the spinner never stop?
- The spinner displays when `pendingMessages.has(msg.temp_id)` is true.
- `pendingMessages.delete(tempId)` is only called in `handleMessageAck()`.

**WHY 2**: Why isn't `handleMessageAck` called?
- The backend sends `MESSAGE_SENT` event, but frontend expects `MESSAGE_ACK` to clear pending state.
- Backend NEVER sends `MESSAGE_ACK` event.

**WHY 3**: Why doesn't `handleMessageSent` clear pending state?
- `handleMessageSent` only calls `handleNewMessage` (to update message content), `setSending(false)`, and `setInputText('')`.
- It does NOT remove `temp_id` from `pendingMessages`.

**ROOT CAUSE**: Missing call to `handleMessageAck` in `handleMessageSent`, OR backend should send `MESSAGE_ACK` after `MESSAGE_SENT`.

**Evidence - Frontend**: `frontend/app/admin/live-chat/page.tsx:94-98`
```typescript
const handleMessageSent = useCallback((message: Message) => {
    handleNewMessage(message);   // Updates message content
    setSending(false);           // Enables send button
    setInputText('');            // Clears input
    // <-- MISSING: handleMessageAck(message.temp_id!, message.id)
}, [handleNewMessage]);
```

**Evidence - Backend**: `backend/app/api/v1/endpoints/ws_live_chat.py:341-351`
```python
# Confirm to sender
await ws_manager.send_personal(websocket, {
    "type": WSEventType.MESSAGE_SENT.value,  # Sends MESSAGE_SENT
    "payload": msg_data,
    "timestamp": timestamp
})
# <-- NO MESSAGE_ACK sent here
```

**Evidence - Spinner Logic**: `frontend/app/admin/live-chat/page.tsx:775,806`
```typescript
const isPending = msg.temp_id && pendingMessages.has(msg.temp_id);
// ...
{isPending && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
```

### Root Cause 3: UI Spacing Issues

**Issue A**: Spinner has no top margin - appears too close to balloon.
```typescript
// page.tsx:805
<div className="ml-2 flex items-center gap-1">  // Only ml-2, no mt-*
```

**Issue B**: Container uses `space-y-3` (12px) which creates uniform gaps everywhere, making spinners look detached.
```typescript
// page.tsx:761
<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 chat-scrollbar">
```

**Issue C**: Label has small margin (`mb-1` = 4px) but could benefit from tighter integration with balloon.

---

## Affected Files

| File                                            | Lines     | Action | Description                                    |
| ----------------------------------------------- | --------- | ------ | ---------------------------------------------- |
| `frontend/app/admin/live-chat/page.tsx`         | 94-98     | UPDATE | Add handleMessageAck call in handleMessageSent |
| `frontend/app/admin/live-chat/page.tsx`         | 805       | UPDATE | Add mt-1 spacing to spinner container          |
| `frontend/app/admin/live-chat/page.tsx`         | 761       | UPDATE | Adjust space-y for message container           |
| `backend/app/api/v1/endpoints/ws_live_chat.py`  | 341-351   | UPDATE | (Optional) Send MESSAGE_ACK after MESSAGE_SENT |

### Integration Points

- `frontend/hooks/useLiveChatSocket.ts:73-74` - handles MESSAGE_SENT event
- `frontend/lib/websocket/types.ts:18` - defines MESSAGE_ACK type
- Messages state: `useState<Message[]>([])` at page.tsx:48
- Pending state: `useState<Set<string>>(new Set())` at page.tsx:54

### Git History

- **Last modified**: `bfcb199` - "fix(live-chat): improve Claim button UX to prevent 404 errors"
- **Introduced**: `5a73ec1` - "feat(ralph-loop): complete project continuity, rich menu sync, and chat UI"
- **Implication**: This is a long-standing bug since the feature was introduced

---

## Implementation Plan

### Step 1: Fix Infinite Spinner - Add ACK in handleMessageSent

**File**: `frontend/app/admin/live-chat/page.tsx`
**Lines**: 94-98
**Action**: UPDATE

**Current code:**
```typescript
const handleMessageSent = useCallback((message: Message) => {
    handleNewMessage(message);
    setSending(false);
    setInputText('');
}, [handleNewMessage]);
```

**Required change:**
```typescript
const handleMessageSent = useCallback((message: Message) => {
    handleNewMessage(message);
    // Clear pending state since message was successfully sent
    if (message.temp_id) {
        handleMessageAck(message.temp_id, message.id);
    }
    setSending(false);
    setInputText('');
}, [handleNewMessage, handleMessageAck]);
```

**Why**: MESSAGE_SENT means the message was successfully delivered to LINE. We should treat this as acknowledgment and clear the pending spinner. This is the most direct fix.

---

### Step 2: Fix UI Spacing - Spinner Container

**File**: `frontend/app/admin/live-chat/page.tsx`
**Lines**: 804-805
**Action**: UPDATE

**Current code:**
```typescript
{!isIncoming && msg.temp_id && (
    <div className="ml-2 flex items-center gap-1">
```

**Required change:**
```typescript
{!isIncoming && msg.temp_id && (
    <div className="mt-1 flex items-center justify-end gap-1 text-xs">
```

**Why**:
- `mt-1` (4px) adds breathing room between balloon and spinner
- `justify-end` aligns spinner to right (matching admin's right-aligned messages)
- Removed `ml-2` since we want right alignment
- Added `text-xs` for consistent small text styling

---

### Step 3: Fix UI Spacing - Message Container (Optional Enhancement)

**File**: `frontend/app/admin/live-chat/page.tsx`
**Lines**: 761
**Action**: UPDATE (Optional)

**Current code:**
```typescript
<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 chat-scrollbar">
```

**Required change:**
```typescript
<div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-100 chat-scrollbar">
```

**Why**: Reduce from `space-y-3` (12px) to `space-y-2` (8px) for tighter message grouping. This is a minor visual improvement and can be skipped if current spacing is acceptable.

---

### Step 4: (Alternative) Backend MESSAGE_ACK Event

**File**: `backend/app/api/v1/endpoints/ws_live_chat.py`
**Lines**: 345-346 (after MESSAGE_SENT)
**Action**: UPDATE (Alternative to Step 1)

**Current code:**
```python
await ws_manager.send_personal(websocket, {
    "type": WSEventType.MESSAGE_SENT.value,
    "payload": msg_data,
    "timestamp": timestamp
})
```

**Required change:**
```python
await ws_manager.send_personal(websocket, {
    "type": WSEventType.MESSAGE_SENT.value,
    "payload": msg_data,
    "timestamp": timestamp
})
# Send ACK to clear pending state on frontend
await ws_manager.send_personal(websocket, {
    "type": WSEventType.MESSAGE_ACK.value,
    "payload": {
        "temp_id": temp_id,
        "message_id": msg_data["id"],
        "timestamp": timestamp
    },
    "timestamp": timestamp
})
```

**Why**: This is semantically correct - MESSAGE_SENT indicates delivery, MESSAGE_ACK indicates acknowledgment. However, Step 1 (frontend fix) is simpler and achieves the same result. Choose ONE approach, not both.

**Recommendation**: Implement Step 1 (frontend fix) as it's simpler and doesn't require backend changes.

---

## Patterns to Follow

**From codebase - message state management:**

```typescript
// SOURCE: frontend/app/admin/live-chat/page.tsx:151-163
// Pattern for clearing pending/failed state
const handleMessageAck = useCallback((tempId: string, messageId: number) => {
    setPendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
    });
    setFailedMessages(prev => {
        const next = new Map(prev);
        next.delete(tempId);
        return next;
    });
}, []);
```

**From codebase - Tailwind spacing pattern:**

```typescript
// SOURCE: frontend/app/admin/live-chat/page.tsx:789
// Pattern for small labels with proper margin
<p className={`text-[10px] mb-1 px-1 ...`}>
```

---

## Edge Cases & Risks

| Risk/Edge Case                     | Mitigation                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Message sent but LINE API fails    | `handleMessageFailed` already handles this case via MESSAGE_FAILED event   |
| Multiple rapid sends               | Each message has unique temp_id, no conflict                               |
| WebSocket disconnects mid-send     | Message queued in `messageQueue`, resent on reconnect                      |
| temp_id undefined                  | Guard with `if (message.temp_id)` before calling handleMessageAck          |

---

## Validation

### Automated Checks

```bash
# Frontend type check and lint
cd frontend && npm run lint && npm run build
```

### Manual Verification

1. **Real-time test**: Open two browser tabs with Live Chat. Send message from LINE app. Verify it appears immediately without refresh.
2. **Spinner test**: Send message as admin. Verify spinner appears briefly then disappears when message is delivered.
3. **Spacing test**: Visual inspection - spinner should have clear spacing below balloon, aligned to right for admin messages.
4. **Failure test**: Disconnect network, send message. Verify spinner shows, then error state with Retry button appears.

---

## Scope Boundaries

**IN SCOPE:**
- Fix spinner infinite loop by clearing pending state on MESSAGE_SENT
- Fix UI spacing for spinner and status indicators
- Ensure sent messages are properly acknowledged

**OUT OF SCOPE (defer to future):**
- Messages appearing for non-selected conversations (requires message caching architecture)
- Offline mode enhancements (Task 14 in PROJECT_STATUS.md)
- Unit tests for WebSocket (Task 15 in PROJECT_STATUS.md)
- Backend MESSAGE_ACK implementation (frontend fix is sufficient)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-04T14:30:00+07:00
- **Artifact**: `.claude/PRPs/issues/investigation-2026-02-04-live-chat-issues.md`
