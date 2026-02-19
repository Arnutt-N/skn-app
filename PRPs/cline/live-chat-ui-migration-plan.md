# Live Chat UI Migration Plan

> **Created:** 2026-02-14
> **Author:** Cline Agent
> **Source Design:** `examples/admin-chat-system`
> **Target:** Current Live Chat (`frontend/app/admin/live-chat`)

---

## 1. Project Overview

### Objective
Migrate UI design from `examples/admin-chat-system` to the current Live Chat module, while keeping Live Chat as a standalone page separate from the admin dashboard.

### Source Reference
- **Location:** `examples/admin-chat-system/`
- **Key Components:**
  - `app/page.tsx` - Main dashboard layout (3-panel)
  - `components/chat-room.tsx` - Chat interface with rich features
  - `components/admin-sidebar.tsx` - Navigation sidebar
  - `components/user-list-panel.tsx` - Conversation list
  - `components/user-profile-panel.tsx` - User details panel
  - `components/video-call-modal.tsx` - Video call overlay
  - `components/notification-toast.tsx` - Toast notifications

---

## 2. Current Live Chat Structure

### Existing Components
```
frontend/app/admin/live-chat/
├── _components/
│   ├── ChatArea.tsx          # Main chat messages area
│   ├── ChatHeader.tsx        # Chat header with actions
│   ├── ConversationItem.tsx  # Individual conversation row
│   ├── ConversationList.tsx  # List of conversations
│   ├── CustomerPanel.tsx     # Customer info side panel
│   ├── LiveChatShell.tsx     # Main container layout
│   ├── MessageBubble.tsx    # Message display
│   ├── MessageInput.tsx      # Input area
│   ├── QueueBadge.tsx        # Waiting queue badge
│   ├── SessionActions.tsx   # Claim/close/transfer actions
│   ├── TransferDialog.tsx    # Transfer to agent dialog
│   └── TypingIndicator.tsx   # Typing animation
├── _context/
│   └── LiveChatContext.tsx   # State management
├── _hooks/
│   ├── useChatReducer.ts     # State reducer
│   ├── useConversations.ts   # Conversation data
│   └── useMessages.ts        # Message handling
└── analytics/
    └── page.tsx              # Live chat analytics
```

---

## 3. UI Features to Migrate

### 3.1 Chat Room Features

| Feature | Source (`chat-room.tsx`) | Current Status | Migration Priority |
|---------|-------------------------|----------------|---------------------|
| **Message Bubbles** | Rich styling with reactions | Basic | HIGH |
| **Read Receipts** | Single check / Double check | Not implemented | HIGH |
| **Emoji Picker** | 10-column grid with hover | Basic | MEDIUM |
| **Sticker Picker** | 6-column grid with animations | Not implemented | MEDIUM |
| **Quick Replies Bar** | Horizontal scrollable bar | In input only | MEDIUM |
| **File Attachments** | File + Image upload | Implemented | KEEP |
| **Typing Indicator** | 3-dot animation | Implemented | KEEP |
| **Message Reactions** | Emoji reactions on messages | Not implemented | MEDIUM |
| **Input Expansion** | Minimize/Maximize toggle | Not implemented | LOW |
| **Timestamp** | Show message time | Implemented | KEEP |

### 3.2 Chat Header Features

| Feature | Source | Current Status | Priority |
|---------|--------|----------------|----------|
| **Video Call Button** | Phone/Video icons | Not implemented | MEDIUM |
| **Voice Call Button** | Phone icon | Not implemented | MEDIUM |
| **Profile Toggle** | UserCircle icon | Implemented | KEEP |
| **More Options Menu** | DropdownMenu | Basic | LOW |
| **Bot/Manual Toggle** | Per-user mode switch | Implemented | KEEP |

### 3.3 User List Features

| Feature | Source (`user-list-panel.tsx`) | Current Status | Priority |
|---------|-------------------------------|----------------|----------|
| **Status Indicators** | Online/Away/Busy/Offline colors | Limited | HIGH |
| **VIP Badge** | Special badge for VIP users | Not implemented | LOW |
| **Search/Filter** | Search conversations | Implemented | KEEP |
| **Sorting** | By recent activity | Basic | LOW |
| **Unread Count** | Badge on conversations | Implemented | KEEP |

### 3.4 Additional Features

| Feature | Source | Priority |
|---------|--------|----------|
| **Video Call Modal** | Full-screen modal with controls | MEDIUM |
| **Notification Toast** | Toast provider with notifications | LOW |
| **Theme Support** | Dark/Light mode ready | LOW |

---

## 4. Migration Steps

### Phase 1: Layout & Shell (Priority: HIGH)

- [ ] 1.1 Review and adapt `LiveChatShell.tsx` layout
- [ ] 1.2 Remove dependency on admin sidebar (standalone page)
- [ ] 1.3 Implement 3-panel layout: Conversation List | Chat Area | Customer Panel
- [ ] 1.4 Add responsive behavior for mobile

### Phase 2: Chat Room UI (Priority: HIGH)

- [ ] 2.1 Update `MessageBubble.tsx` with source styling
- [ ] 2.2 Add message reactions support
- [ ] 2.3 Implement read receipt indicators
- [ ] 2.4 Add timestamp formatting
- [ ] 2.5 Style typing indicator matching source

### Phase 3: Input Area (Priority: MEDIUM)

- [ ] 3.1 Create emoji picker component (10-column grid)
- [ ] 3.2 Create sticker picker component
- [ ] 3.3 Add quick replies horizontal bar
- [ ] 3.4 Implement input expansion toggle
- [ ] 3.5 Add send button with loading state

### Phase 4: Chat Header (Priority: MEDIUM)

- [ ] 4.1 Add video call button to header
- [ ] 4.2 Add voice call button to header
- [ ] 4.3 Enhance more options dropdown
- [ ] 4.4 Add connection status indicator

### Phase 5: Conversation List (Priority: MEDIUM)

- [ ] 5.1 Add status indicators (online/away/busy/offline)
- [ ] 5.2 Add VIP badge support
- [ ] 5.3 Enhance search functionality
- [ ] 5.4 Add sorting options

### Phase 6: Additional Features (Priority: LOW)

- [ ] 6.1 Create video call modal
- [ ] 6.2 Add notification toast system
- [ ] 6.3 Add sound notifications toggle

---

## 5. Design Tokens Mapping

### Color Mapping (Tailwind)

| Purpose | Source Class | Current Class | New Class |
|---------|-------------|---------------|-----------|
| Primary | `bg-primary` | `bg-primary` | Keep |
| Background | `bg-background` | `bg-slate-50` | Keep |
| Card | `bg-card` | `bg-white` | Keep |
| Muted | `bg-muted` | `bg-slate-100` | Keep |
| Online Status | `bg-online` (custom) | - | Add to theme |
| Away Status | `bg-away` (custom) | - | Add to theme |
| Busy Status | `bg-busy` (custom) | - | Add to theme |
| Offline Status | `bg-offline` (custom) | - | Add to theme |

### Typography

| Element | Source Style | Current Style |
|---------|-------------|---------------|
| Message Text | `text-sm leading-relaxed` | `text-sm` |
| Timestamp | `text-[10px]` | `text-xs` |
| Sender Name | `text-[10px] font-medium` | - |

---

## 6. Component Mapping

### Source → Target Mapping

```
examples/admin-chat-system/components/
├── admin-sidebar.tsx          → REMOVE (standalone)
├── chat-room.tsx              → _components/ChatArea.tsx (merge)
├── user-list-panel.tsx         → _components/ConversationList.tsx (merge)
├── user-profile-panel.tsx      → _components/CustomerPanel.tsx (merge)
├── video-call-modal.tsx        → NEW: VideoCallModal.tsx
├── notification-toast.tsx      → NEW: NotificationToast.tsx
└── theme-provider.tsx          → Already exists
```

---

## 7. Technical Considerations

### WebSocket Integration
- Keep existing WebSocket hooks (`useLiveChatSocket`)
- Maintain real-time message handling
- Preserve typing indicators

### State Management
- Continue using `LiveChatContext`
- Add new state for emoji/sticker pickers
- Add state for video call modal

### Performance already implemented (keep)
- Lazy load
- Virtual scrolling emoji/sticker data
- Optimize re-renders

---

## 8. File Changes Summary

### New Files to Create
- `frontend/app/admin/live-chat/_components/VideoCallModal.tsx`
- `frontend/app/admin/live-chat/_components/EmojiPicker.tsx`
- `frontend/app/admin/live-chat/_components/StickerPicker.tsx`
- `frontend/app/admin/live-chat/_components/QuickRepliesBar.tsx`
- `frontend/app/admin/live-chat/_components/MessageReactions.tsx`

### Files to Update
- `_components/ChatArea.tsx` - Major update
- `_components/MessageBubble.tsx` - Add reactions, read receipts
- `_components/MessageInput.tsx` - Add emoji/sticker pickers
- `_components/ChatHeader.tsx` - Add call buttons
- `_components/ConversationList.tsx` - Add status indicators
- `_components/LiveChatShell.tsx` - Layout adjustments
- `globals.css` - Add status colors

---

## 9. Implementation Order

```
Step 1:  Copy design tokens to globals.css
Step 2:  Update LiveChatShell layout
Step 3:  Update MessageBubble with reactions & read receipts
Step 4:  Create EmojiPicker component
Step 5:  Create StickerPicker component
Step 6:  Update MessageInput with pickers
Step 7:  Update ConversationList with status indicators
Step 8:  Update ChatHeader with call buttons
Step 9:  Create VideoCallModal
Step 10: Testing and polish
```

---

## 10. Success Criteria

- [ ] Live Chat remains a standalone page (`/admin/live-chat`)
- [ ] UI matches source design aesthetic
- [ ] All existing functionality preserved
- [ ] WebSocket integration continues to work
- [ ] Responsive design maintained
- [ ] No breaking changes to API

---

## Appendix A: Source Code Snippets

### Message Bubble Styling (Source)
```tsx
<div className={cn(
  "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
  isAdmin
    ? "rounded-tr-sm bg-primary text-primary-foreground"
    : "rounded-tl-sm bg-muted text-foreground"
)}>
```

### Status Indicator (Source)
```tsx
<span className={cn(
  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
  status === "online" ? "bg-online" : 
  status === "away" ? "bg-away" : 
  status === "busy" ? "bg-busy" : "bg-offline"
)} />
```

---

## Appendix B: Emoji Data Structure

```typescript
const emojiList = ["😀", "😃", "😄", "😁", "😆", ...]; // Full emoji array
const stickers = ["url1.png", "url2.png", ...]; // Sticker URLs
const quickReplies = [
  { id: 1, label: "Hello", message: "สวัสดีค่ะ/ครับ" },
  { id: 2, label: "Wait", message: "กรุณารอสักครู่ค่ะ/ครับ" },
  // ...
];
```

---

*End of Migration Plan*
