# Investigation: wsSendMessage TDZ ReferenceError in LiveChatPage

**Issue**: Free-form (Runtime Error Report)
**Type**: BUG
**Investigated**: 2026-02-02T20:30:00+07:00

### Assessment

| Metric     | Value    | Reasoning                                                                                                   |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| Severity   | CRITICAL | Page crashes on load - users cannot access Live Chat at all, no workaround exists                           |
| Complexity | LOW      | Single file, single fix - move useEffect after hook declaration, no architectural changes needed            |
| Confidence | HIGH     | Error message is explicit about TDZ violation, code path is clear, fix is deterministic                     |

---

## Problem Statement

The Live Chat page crashes immediately on load with `ReferenceError: Cannot access 'wsSendMessage' before initialization`. This is caused by a Temporal Dead Zone (TDZ) violation where a `useEffect` hook references `wsSendMessage` in its dependency array before the variable is declared by the `useLiveChatSocket` hook.

---

## Analysis

### Root Cause

**5 Whys Analysis:**

WHY 1: Why does the page crash with "Cannot access 'wsSendMessage' before initialization"?
→ Because `wsSendMessage` is used in a useEffect dependency array on line 180 before it's declared
→ Evidence: `page.tsx:180` - `}, [wsStatus, failedMessages, messages, wsSendMessage]);`

WHY 2: Why is `wsSendMessage` used before declaration?
→ Because the useEffect for auto-retry (lines 169-180) was placed BEFORE the useLiveChatSocket hook call (line 183)
→ Evidence: `page.tsx:183` - `const { ... sendMessage: wsSendMessage ... } = useLiveChatSocket({...});`

WHY 3: Why does JavaScript throw an error for this?
→ Because `const` and `let` declarations have a Temporal Dead Zone - they exist but cannot be accessed before their declaration line
→ Evidence: ECMAScript specification - variables are hoisted but not initialized until the declaration is evaluated

**ROOT CAUSE**: The auto-retry useEffect hook (lines 169-180) is positioned above the `useLiveChatSocket` hook call (line 183), causing a TDZ violation when React evaluates the dependency array.

### Evidence Chain

```
SYMPTOM: ReferenceError at page.tsx:180
↓
CAUSE: wsSendMessage in dependency array before declaration
Evidence: `page.tsx:180` - `[wsStatus, failedMessages, messages, wsSendMessage]`
↓
ROOT CAUSE: Hook ordering violation - useEffect before useLiveChatSocket
Evidence: `page.tsx:169-195` - useEffect at 169, declaration at 183
```

### Affected Files

| File                                  | Lines   | Action | Description                                     |
| ------------------------------------- | ------- | ------ | ----------------------------------------------- |
| `frontend/app/admin/live-chat/page.tsx` | 169-195 | UPDATE | Move auto-retry useEffect after hook declaration |

### Integration Points

- `useLiveChatSocket` hook (line 183) provides `wsSendMessage` function
- Auto-retry useEffect (line 169) uses `wsSendMessage` to retry failed messages
- Other useEffect hooks also depend on functions from `useLiveChatSocket`

### Git History

- **Introduced**: `5a73ec1b` - 2026-01-31 - "feat(ralph-loop): complete project continuity, rich menu sync, and chat UI"
- **Last modified**: `cbb8ad6e` - 2026-02-02 - "fix(live-chat): address code quality and error handling issues"
- **Implication**: Original bug introduced in ralph-loop feature, not caught during recent fix pass

---

## Implementation Plan

### Step 1: Move auto-retry useEffect after useLiveChatSocket hook declaration

**File**: `frontend/app/admin/live-chat/page.tsx`
**Lines**: 169-195
**Action**: UPDATE

**Current code (problematic):**

```typescript
// Line 169-180 - Auto-retry useEffect BEFORE wsSendMessage is declared
useEffect(() => {
    if (wsStatus === 'connected' && failedMessages.size > 0) {
        const retryEntries = Array.from(failedMessages.entries());
        retryEntries.forEach(([tempId]) => {
            // Find message in messages to get its text
            const msg = messages.find(m => m.temp_id === tempId);
            if (msg) {
                wsSendMessage(msg.content, tempId);  // ERROR: TDZ violation
            }
        });
    }
}, [wsStatus, failedMessages, messages, wsSendMessage]);  // ERROR: TDZ violation

// Line 183-195 - wsSendMessage declared HERE
const { joinRoom, leaveRoom, sendMessage: wsSendMessage, ... } = useLiveChatSocket({...});
```

**Required change:**

Move the auto-retry useEffect to AFTER the useLiveChatSocket hook declaration. The correct order should be:

```typescript
// 1. First: useLiveChatSocket hook (declares wsSendMessage)
const { joinRoom, leaveRoom, sendMessage: wsSendMessage, startTyping, claimSession, closeSession, reconnect, retryMessage } = useLiveChatSocket({
    adminId,
    onNewMessage: handleNewMessage,
    onMessageSent: handleMessageSent,
    onMessageAck: handleMessageAck,
    onMessageFailed: handleMessageFailed,
    onTyping: handleTyping,
    onSessionClaimed: handleSessionClaimed,
    onSessionClosed: handleSessionClosed,
    onConversationUpdate: handleConversationUpdate,
    onConnectionChange: handleConnectionChange,
    onError: (error) => console.error('WebSocket error:', error),
});

// 2. Then: Auto-retry useEffect (can now safely reference wsSendMessage)
useEffect(() => {
    if (wsStatus === 'connected' && failedMessages.size > 0) {
        const retryEntries = Array.from(failedMessages.entries());
        retryEntries.forEach(([tempId]) => {
            const msg = messages.find(m => m.temp_id === tempId);
            if (msg) {
                wsSendMessage(msg.content, tempId);
            }
        });
    }
}, [wsStatus, failedMessages, messages, wsSendMessage]);
```

**Why**: React hooks must be declared before any code that references their return values. The auto-retry useEffect depends on `wsSendMessage` which comes from `useLiveChatSocket`, so the hook must be called first.

---

## Patterns to Follow

**From codebase - React hooks ordering pattern:**

```typescript
// SOURCE: frontend/app/admin/live-chat/page.tsx:229-238
// Pattern: useEffect hooks that use external functions come AFTER their sources
useEffect(() => {
    fetchConversations();
    // Keep polling as fallback when WebSocket is not connected
    const interval = setInterval(() => {
        if (wsStatus !== 'connected') {
            fetchConversations();
        }
    }, 5000);
    return () => clearInterval(interval);
}, [filterStatus, wsStatus]);
```

This useEffect references `wsStatus` which comes from state, not a hook return value. The auto-retry useEffect should follow the same pattern of being placed after its dependencies are available.

---

## Edge Cases & Risks

| Risk/Edge Case                              | Mitigation                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Other hooks may have similar ordering issues | Visual scan of all useEffect hooks shows they use state, not hook returns |
| Moving code may break other dependencies    | The move is self-contained; no other code depends on useEffect position  |
| ESLint exhaustive-deps warning              | All dependencies are already correct, just need reordering               |

---

## Validation

### Automated Checks

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

### Manual Verification

1. Load `/admin/live-chat` page - should not crash
2. Select a conversation - should work normally
3. Test message retry flow - send message, disconnect, reconnect - should auto-retry

---

## Scope Boundaries

**IN SCOPE:**

- Move auto-retry useEffect after useLiveChatSocket hook declaration

**OUT OF SCOPE (do not touch):**

- Other useEffect hooks (already correctly positioned)
- useLiveChatSocket hook implementation
- Any other files

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-02T20:30:00+07:00
- **Artifact**: `.claude/PRPs/issues/investigation-live-chat-tdd-error-20260202.md`
