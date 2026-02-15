# Live Chat Standalone UI Migration Plan

**Source UI**: `examples/admin-chat-system`  
**Target Module**: `frontend/app/admin/live-chat` (logic + data flow)  
**Created**: 2026-02-14  
**Author**: CodeX  
**Status**: Planning  

---

## Objective

Migrate the visual design language and interaction polish from `examples/admin-chat-system` into the current production-ready Live Chat implementation, while keeping Live Chat standalone on a new page outside admin routing.

This is a UI/UX migration, not a backend rewrite.

---

## Non-Negotiable Constraints

1. Keep existing Live Chat backend/API/WebSocket contracts unchanged.
2. Preserve current business behavior:
   - session claim/close/transfer
   - bot/human mode switching
   - optimistic send + ack/fail + retry
   - history pagination + virtualization
3. Live Chat must run on a standalone route (not nested in `/admin/...`).
4. Existing `/admin/live-chat` should remain available during transition via redirect or compatibility route.

---

## Current State Summary

### Strong foundation already in current live chat

- Real-time socket client with reconnect/auth/heartbeat.
- REST fallback when socket is unavailable.
- reducer + context architecture for complex state.
- mobile behavior, search, message jump, history loading.

### Design and UX assets available in example

- richer panel styling and badge language
- denser composer interactions (emoji/sticker/quick actions)
- stronger motion polish (toasts, typing, transitions)
- profile panel visual treatment

---

## Target Route Architecture (Standalone)

### Route plan

1. New standalone entry route: `/live-chat`
2. Keep analytics as: `/live-chat/analytics` (optional phase 2)
3. Transition behavior:
   - `/admin/live-chat` -> temporary redirect to `/live-chat`
   - remove old route only after sign-off

### Proposed frontend structure

1. New route shell:
   - `frontend/app/live-chat/page.tsx`
   - `frontend/app/live-chat/layout.tsx`
2. Move or alias reusable module pieces:
   - `frontend/app/live-chat/_components/*`
   - `frontend/app/live-chat/_context/LiveChatContext.tsx`
   - `frontend/app/live-chat/_hooks/*`
   - `frontend/app/live-chat/_types.ts`
3. Keep current APIs unchanged under `/api/v1/admin/live-chat/*`.

Note: Route is standalone, but API namespace can stay admin-scoped for now.

---

## UI Migration Strategy

Use current live-chat as behavioral source of truth and example as visual source of truth.

### Component mapping

1. Example `admin-sidebar.tsx`  
   Target: standalone page frame navigation for live-chat only (not full admin sidebar).

2. Example `user-list-panel.tsx`  
   Target: `ConversationList.tsx` visual refresh only, preserve filtering/search logic.

3. Example `chat-room.tsx`  
   Target: `ChatArea.tsx`, `ChatHeader.tsx`, `MessageInput.tsx`, `MessageBubble.tsx`.

4. Example `user-profile-panel.tsx`  
   Target: `CustomerPanel.tsx` visual + layout upgrade, preserve export/refresh behavior.

5. Example `notification-toast.tsx`  
   Target: new shared notification layer (optional phase), integrate with real events.

6. Example `video-call-modal.tsx`  
   Out of MVP; treat as future enhancement only unless backend requirements are approved.

---

## Phased Implementation Plan

## Phase 0 - Baseline and Safety

1. Snapshot current UX and performance baselines:
   - conversation load time
   - first message render
   - send/ack latency feel
2. Add visual regression references (screenshots of current live chat).
3. Fix mojibake/encoding text before UI pass to avoid corrupted labels.

**Exit criteria**
- baseline captured and documented
- no encoding corruption in live chat UI strings

---

## Phase 1 - Standalone Route Extraction

1. Create `/live-chat` route with existing `LiveChatProvider` + `LiveChatShell`.
2. Update query-state handling from `/admin/live-chat?chat=...` to `/live-chat?chat=...`.
3. Add compatibility redirect from `/admin/live-chat` to `/live-chat`.
4. Update admin menu link to open `/live-chat` in new tab.

**Files likely touched**
- `frontend/app/live-chat/page.tsx` (new)
- `frontend/app/live-chat/layout.tsx` (new)
- `frontend/app/admin/live-chat/page.tsx` (redirect shim)
- `frontend/app/admin/layout.tsx` (link update)
- `frontend/app/.../LiveChatContext.tsx` (history replace route strings)

**Exit criteria**
- live chat fully usable at `/live-chat`
- old link still works through redirect

---

## Phase 2 - Design System Alignment

1. Introduce scoped live-chat theme tokens (do not break global admin styles).
2. Port visual styles:
   - sidebar/list gradients
   - badges, states, spacing scale
   - motion classes (typing, toast, subtle transitions)
3. Keep accessibility:
   - focus states
   - keyboard navigation in list
   - contrast checks

**Files likely touched**
- `frontend/app/live-chat/styles` or module-scoped css
- `ConversationList.tsx`
- `ChatArea.tsx`
- `ChatHeader.tsx`
- `CustomerPanel.tsx`

**Exit criteria**
- target UI resembles example style
- no regression in keyboard/accessibility behavior

---

## Phase 3 - Composer and Message UX Upgrade

1. Upgrade `MessageInput` with design parity features:
   - emoji picker
   - quick canned action chips (keep existing canned response integration)
   - attachment affordances aligned to new design
2. Improve message bubble visuals while preserving current message-type rendering and retry states.
3. Keep bot/human restrictions and sending guards unchanged.

**Files likely touched**
- `MessageInput.tsx`
- `MessageBubble.tsx`
- optional shared picker components

**Exit criteria**
- richer composer UX is live
- send/retry/typing logic remains stable

---

## Phase 4 - Notification Layer and Finishing

1. Add optional in-page toast stack for:
   - new incoming message (when not focused)
   - transfer/claim events
   - connection state warnings
2. Integrate with existing sound toggle behavior.
3. Add final polish (skeletons, empty states, micro animations).

**Files likely touched**
- new toast provider in live-chat route
- `LiveChatContext.tsx` event hooks
- `LiveChatShell.tsx`

**Exit criteria**
- notifications are useful and non-spammy
- sound + toast settings behave predictably

---

## Test and Validation Plan

1. Functional checks:
   - open conversation
   - send text/media
   - retry failed message
   - claim/transfer/close
   - switch BOT/HUMAN
   - load older messages
2. State resiliency:
   - disconnect/reconnect socket
   - fallback REST behavior
   - refresh page with `?chat=...`
3. Device checks:
   - desktop
   - mobile drawer/panel behavior
4. Performance checks:
   - verify virtualization still active for large message sets
   - no major FPS jank in message scroll

---

## Risks and Mitigations

1. Risk: visual refactor breaks live data behavior.  
   Mitigation: keep data hooks untouched first; style-only commits before behavior changes.

2. Risk: route migration breaks deep links.  
   Mitigation: maintain redirect and query param compatibility window.

3. Risk: CSS collisions with existing admin styles.  
   Mitigation: use scoped classes/module styles for `/live-chat`.

4. Risk: feature creep from example-only demo parts.  
   Mitigation: keep video-call modal out of MVP.

---

## Deliverables

1. Standalone live chat page at `/live-chat`.
2. Updated design aligned with `examples/admin-chat-system`.
3. Compatibility redirect from `/admin/live-chat`.
4. Migration notes and before/after screenshots.

---

## Suggested Delivery Sequence

1. Phase 0 + Phase 1 in first PR (route + compatibility).
2. Phase 2 in second PR (visual shell/list/panel).
3. Phase 3 in third PR (composer/message UI).
4. Phase 4 in final PR (toast and polish).

This sequence keeps risk low and allows quick rollback per phase.

