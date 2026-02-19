# Live Chat UI Migration Plan

## Overview

This document outlines the migration plan to adapt the UI design from `examples/admin-chat-system` to the current Live Chat system in SknApp. The goal is to modernize the Live Chat interface while maintaining its standalone nature (separate from the admin panel).

---

## Current State Analysis

### Current Live Chat Location
- **Path**: `frontend/app/admin/live-chat/`
- **Layout**: Standalone (bypasses admin sidebar via `layout.tsx`)
- **Components**: Uses custom components in `_components/` folder
- **State Management**: Context-based with `LiveChatContext`
- **WebSocket**: Custom hook `useLiveChatSocket`

### Current Architecture
```
frontend/app/admin/live-chat/
├── page.tsx                    # Entry point with Suspense
├── layout.tsx                  # Standalone layout (no admin sidebar)
├── _types.ts                   # TypeScript types
├── _components/
│   ├── LiveChatShell.tsx       # Main layout shell
│   ├── ConversationList.tsx    # Sidebar conversation list
│   ├── ChatArea.tsx            # Main chat area
│   ├── ChatHeader.tsx          # Chat header with actions
│   ├── MessageBubble.tsx       # Individual message
│   ├── MessageInput.tsx        # Input area
│   ├── CustomerPanel.tsx       # Right panel (user info)
│   ├── ConversationItem.tsx    # Single conversation row
│   ├── QueueBadge.tsx          # Status badges
│   ├── SessionActions.tsx      # Action buttons
│   ├── TransferDialog.tsx      # Transfer modal
│   └── TypingIndicator.tsx     # Typing animation
├── _context/
│   └── LiveChatContext.tsx     # Main state management
└── _hooks/
    ├── useChatReducer.ts       # Reducer logic
    ├── useConversations.ts     # Conversation filtering
    └── useMessages.ts          # Message handling
```

### Source Design (admin-chat-system)
- **Design System**: Modern shadcn/ui with Tailwind CSS
- **Layout**: 3-panel layout (Sidebar + User List + Chat + Profile)
- **Features**: 
  - Collapsible sidebar navigation
  - Rich user cards with status indicators
  - Bot/Manual mode toggle per user
  - Emoji/sticker picker
  - Quick replies
  - Video call modal
  - Toast notifications
  - Dark sidebar theme

---

## Migration Goals

1. **Visual Modernization**: Adopt the cleaner, more modern design from admin-chat-system
2. **Enhanced UX**: Add missing features (emoji picker, quick replies, better animations)
3. **Maintain Standalone**: Keep Live Chat as a separate full-screen experience
4. **Preserve Functionality**: All existing WebSocket and API integrations must continue working
5. **Thai Language Support**: Maintain Noto Sans Thai font integration

---

## Detailed Migration Plan

### Phase 1: Create New Standalone Live Chat Route

**Objective**: Create a new route `/live-chat` (outside admin) for true standalone experience

#### Tasks:
1. **Create new route structure**
   ```
   frontend/app/live-chat/
   ├── page.tsx
   ├── layout.tsx
   └── loading.tsx
   ```

2. **Create layout.tsx**
   - Full-screen layout without admin navigation
   - Preserve auth check (redirect to login if not authenticated)
   - Load Noto Sans Thai font
   - Apply dark theme as default

3. **Update middleware/routing** (if needed)
   - Ensure `/live-chat` is accessible for authenticated users
   - Add route to navigation menus

#### Files to Create:
- `frontend/app/live-chat/layout.tsx`
- `frontend/app/live-chat/page.tsx`
- `frontend/app/live-chat/loading.tsx`

---

### Phase 2: Component Migration & Adaptation

#### 2.1 Create New Component Structure

```
frontend/app/live-chat/
├── _components/
│   ├── LiveChatShell.tsx       # Main 3-panel layout
│   ├── ConversationSidebar.tsx # Left sidebar (replaces ConversationList)
│   ├── ChatRoom.tsx            # Center chat area (replaces ChatArea)
│   ├── ChatHeader.tsx          # Chat header with user info
│   ├── MessageBubble.tsx       # Individual message bubble
│   ├── MessageInput.tsx        # Input with emoji/stickers
│   ├── UserProfilePanel.tsx    # Right panel (replaces CustomerPanel)
│   ├── VideoCallModal.tsx      # Video call overlay
│   └── NotificationToast.tsx   # Toast notifications
├── _hooks/
│   ├── useLiveChatStore.ts     # Zustand store (replaces Context)
│   └── useConversations.ts     # Filtered conversations
└── _lib/
    └── utils.ts                # Helper functions
```

#### 2.2 Migrate Individual Components

##### A. LiveChatShell (from LiveChatShell.tsx)
**Current**: 2-panel layout (ConversationList + ChatArea)
**New**: 3-panel layout with optional profile panel

**Changes:**
- Add collapsible profile panel on the right
- Implement responsive design for mobile
- Add dark theme background

##### B. ConversationSidebar (from admin-sidebar.tsx + user-list-panel.tsx)
**Source**: Combine admin-sidebar navigation + user-list-panel

**Features to Port:**
- Dark gradient background (`from-[#2B2840] to-[#1E1B33]` - keep current or use new slate theme)
- Search bar with icon
- Filter tabs: All / Waiting / Active
- User cards with:
  - Avatar with status indicator (online/away/busy/offline)
  - Name and role badges (VIP, New)
  - Last message preview
  - Unread count badge (animated)
  - Bot/Manual mode indicator
  - Typing indicator
- Keyboard navigation (arrow keys, Enter)

**Adaptations:**
- Keep current dark gradient or use new slate theme from example
- Maintain WebSocket real-time updates
- Keep existing conversation data structure

##### C. ChatRoom (from chat-room.tsx)
**Source**: chat-room.tsx from admin-chat-system

**Features to Port:**
- Message types: text, image, file, sticker, emoji
- Message bubbles with sender info
- Read receipts (✓ / ✓✓)
- Reactions support
- Typing indicator
- Date separators
- Auto-scroll to bottom

**New Features to Add:**
- Emoji picker (30 emojis)
- Sticker picker (12 stickers)
- Quick replies bar (6 templates)
- Expandable input area
- File upload drag & drop

**Adaptations:**
- Integrate with existing WebSocket message flow
- Support existing message types from backend
- Maintain virtual scrolling for performance

##### D. ChatHeader (from ChatHeader.tsx)
**Source**: Combine current ChatHeader + admin-chat-system header

**Features to Port:**
- User avatar with status
- User name with VIP badge
- **Bot/Manual mode toggle button** (key feature!)
- Action buttons: Video call, Profile, More options
- Connection status indicator

**Adaptations:**
- Keep session actions (Claim, Close, Transfer)
- Add mode toggle integration with API

##### E. MessageInput (from MessageInput.tsx)
**Source**: New design based on admin-chat-system

**Features to Port:**
- Toolbar with buttons: Emoji, Sticker, Image, File, Quick Replies
- Expandable textarea (auto-resize)
- Send button with animation
- Emoji picker grid
- Sticker picker grid
- Quick replies horizontal scroll

**Adaptations:**
- Integrate with existing sendMessage API
- Support canned responses ("/" trigger)
- Maintain sound toggle

##### F. UserProfilePanel (from user-profile-panel.tsx)
**Source**: user-profile-panel.tsx from admin-chat-system

**Features to Port:**
- Large avatar with status
- User name and status message
- Tags display (VIP, custom tags)
- Quick actions: Video Call, Mute, Block
- Stats cards: Conversations, Rating, Join Date
- Contact info: Email, Phone, Location
- Activity info: Joined, Last Active, Assigned To
- Internal notes textarea

**Adaptations:**
- Use existing customer data structure
- Integrate with existing tag system
- Add edit capabilities if needed

##### G. VideoCallModal (from video-call-modal.tsx)
**Source**: video-call-modal.tsx

**Features to Port:**
- Full-screen modal overlay
- Remote video placeholder
- Self video preview
- Call controls: Mute, Video, Screen Share, Chat, End
- Call duration timer
- Connecting state with animation

**Adaptations:**
- Integrate with existing video call logic (if any)
- Or keep as UI placeholder for future implementation

##### H. NotificationToast (from notification-toast.tsx)
**Source**: notification-toast.tsx

**Features to Port:**
- Toast stack in top-right corner
- Sound notification (Web Audio API)
- Vibration support
- Auto-dismiss after 5s
- Different types: message, system, call
- Avatar support for message notifications

**Adaptations:**
- Integrate with WebSocket new message events
- Maintain existing notification sound hook

---

### Phase 3: State Management Migration

#### 3.1 Migrate from Context to Zustand

**Current**: React Context + useReducer
**New**: Zustand store for better performance

**Store Structure:**
```typescript
interface LiveChatStore {
  // Conversations
  conversations: Conversation[];
  selectedId: string | null;
  filterStatus: 'WAITING' | 'ACTIVE' | null;
  searchQuery: string;
  
  // Messages
  messages: Message[];
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
  
  // UI State
  isProfileOpen: boolean;
  isVideoCallActive: boolean;
  showTransferDialog: boolean;
  soundEnabled: boolean;
  inputExpanded: boolean;
  showEmojiPicker: boolean;
  showStickerPicker: boolean;
  showQuickReplies: boolean;
  
  // Loading States
  loading: boolean;
  sending: boolean;
  claiming: boolean;
  backendOnline: boolean;
  
  // Actions
  setSelectedConversation: (id: string | null) => void;
  setFilterStatus: (status: 'WAITING' | 'ACTIVE' | null) => void;
  setSearchQuery: (query: string) => void;
  toggleProfile: () => void;
  toggleSound: () => void;
  sendMessage: (content: string, type?: MessageType) => void;
  // ... more actions
}
```

#### 3.2 Preserve WebSocket Integration

**Keep Existing:**
- `useLiveChatSocket` hook (works well)
- Message handling logic
- Typing indicators
- Session events (claimed, closed, transferred)

**Integration Points:**
- Connect WebSocket events to Zustand actions
- Maintain optimistic updates
- Keep retry logic for failed messages

---

### Phase 4: Styling & Theme Migration

#### 4.1 CSS Variables Update

Add to `globals.css`:
```css
:root {
  /* Status Colors */
  --online: 142 71% 45%;
  --away: 38 92% 50%;
  --busy: 0 84% 60%;
  --offline: 220 10% 46%;
  
  /* Chat-specific colors */
  --chat-sidebar: 222 47% 11%;
  --chat-background: 220 20% 97%;
}
```

#### 4.2 Tailwind Config Updates

Add to `tailwind.config.ts`:
```typescript
colors: {
  online: 'hsl(var(--online))',
  away: 'hsl(var(--away))',
  busy: 'hsl(var(--busy))',
  offline: 'hsl(var(--offline))',
}
```

#### 4.3 Animation Classes

Add custom animations to CSS:
- `typing-bounce` - Typing indicator dots
- `slide-in-left/right` - Message bubbles
- `blink-badge` - Unread notifications
- `scale-in` - Modals/popups
- `toast-slide` - Notifications

---

### Phase 5: Data Integration

#### 5.1 API Endpoints (Keep Existing)

All existing API calls remain unchanged:
- `GET /api/v1/admin/live-chat/conversations`
- `GET /api/v1/admin/live-chat/conversations/:id`
- `POST /api/v1/admin/live-chat/conversations/:id/messages`
- `POST /api/v1/admin/live-chat/conversations/:id/media`
- `POST /api/v1/admin/live-chat/conversations/:id/claim`
- `POST /api/v1/admin/live-chat/conversations/:id/close`
- `POST /api/v1/admin/live-chat/conversations/:id/mode`
- `POST /api/v1/admin/live-chat/conversations/:id/transfer`
- `GET /api/v1/admin/live-chat/messages/search`

#### 5.2 WebSocket Events (Keep Existing)

- `new_message`
- `message_sent`
- `message_ack`
- `message_failed`
- `typing`
- `session_claimed`
- `session_closed`
- `session_transferred`
- `conversation_update`

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Create `/live-chat` route structure
- [ ] Create standalone layout with auth check
- [ ] Add route to middleware/navigation
- [ ] Test basic routing

### Phase 2: Core Components
- [ ] Create `LiveChatShell` with 3-panel layout
- [ ] Create `ConversationSidebar` with search & filters
- [ ] Create `ChatRoom` with message list
- [ ] Create `ChatHeader` with mode toggle
- [ ] Create `MessageInput` with emoji/stickers
- [ ] Create `MessageBubble` with all message types

### Phase 3: Supporting Components
- [ ] Create `UserProfilePanel`
- [ ] Create `VideoCallModal`
- [ ] Create `NotificationToast`
- [ ] Create `TypingIndicator`

### Phase 4: State Management
- [ ] Create Zustand store
- [ ] Migrate reducer logic
- [ ] Integrate WebSocket hook
- [ ] Test all actions

### Phase 5: Styling
- [ ] Add CSS variables
- [ ] Add custom animations
- [ ] Implement dark theme
- [ ] Mobile responsive design

### Phase 6: Testing & Polish
- [ ] Test WebSocket connectivity
- [ ] Test message sending/receiving
- [ ] Test file uploads
- [ ] Test session management (claim, close, transfer)
- [ ] Test mobile responsiveness
- [ ] Performance testing (virtual scrolling)
- [ ] Accessibility audit

---

## File Mapping Reference

| Current File | New File | Source Design |
|-------------|----------|---------------|
| `LiveChatShell.tsx` | `LiveChatShell.tsx` | Custom adaptation |
| `ConversationList.tsx` | `ConversationSidebar.tsx` | `user-list-panel.tsx` |
| `ChatArea.tsx` | `ChatRoom.tsx` | `chat-room.tsx` |
| `ChatHeader.tsx` | `ChatHeader.tsx` | `chat-room.tsx` header |
| `MessageInput.tsx` | `MessageInput.tsx` | `chat-room.tsx` input |
| `MessageBubble.tsx` | `MessageBubble.tsx` | `MessageBubble` component |
| `CustomerPanel.tsx` | `UserProfilePanel.tsx` | `user-profile-panel.tsx` |
| `TypingIndicator.tsx` | `TypingIndicator.tsx` | `TypingIndicator` |
| N/A | `VideoCallModal.tsx` | `video-call-modal.tsx` |
| N/A | `NotificationToast.tsx` | `notification-toast.tsx` |

---

## Key Design Decisions

### 1. Keep Dark Sidebar Theme
**Decision**: Maintain the current dark gradient sidebar (`from-[#2B2840] to-[#1E1B33]`) rather than the slate sidebar from admin-chat-system.

**Rationale**: Current theme is more professional for a support interface and matches the existing admin panel aesthetic.

### 2. Bot/Manual Toggle
**Decision**: Add the prominent Bot/Manual toggle button in the chat header (from admin-chat-system).

**Rationale**: This is a key feature showing which mode each conversation is in and allows quick switching.

### 3. Emoji/Sticker Support
**Decision**: Add emoji picker and sticker picker to message input.

**Rationale**: Enhances user experience for more expressive conversations.

### 4. Standalone Route
**Decision**: Create new `/live-chat` route outside admin folder.

**Rationale**: Provides true standalone experience for operators who only need chat functionality.

### 5. Zustand over Context
**Decision**: Migrate to Zustand for state management.

**Rationale**: Better performance, simpler code, DevTools support.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebSocket integration breaks | Thoroughly test all WS events, keep fallback to REST |
| Performance degradation with large message history | Keep virtual scrolling implementation |
| Mobile UX issues | Extensive mobile testing, responsive breakpoints |
| Authentication issues | Keep existing auth context integration |
| Data inconsistency during migration | Parallel run period, feature flags |

---

## Success Criteria

1. ✅ All existing features work in new UI
2. ✅ WebSocket real-time updates function correctly
3. ✅ Message sending/receiving works
4. ✅ File uploads work
5. ✅ Session management (claim, close, transfer) works
6. ✅ Mobile responsive design
7. ✅ Thai language support maintained
8. ✅ Dark theme consistent
9. ✅ New features added (emoji, stickers, quick replies)
10. ✅ Performance equal or better than current

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Setup | 2 hours | 2 hours |
| Phase 2: Core Components | 8 hours | 10 hours |
| Phase 3: Supporting Components | 4 hours | 14 hours |
| Phase 4: State Management | 4 hours | 18 hours |
| Phase 5: Styling | 3 hours | 21 hours |
| Phase 6: Testing & Polish | 5 hours | 26 hours |

**Total Estimated Time**: ~26 hours

---

## Appendix

### A. Current Color Reference

Current dark sidebar:
```css
background: linear-gradient(to bottom, #2B2840, #1E1B33);
```

### B. Message Types Supported

- `text` - Plain text messages
- `image` - Image attachments
- `file` - File attachments
- `sticker` - LINE stickers
- `template` - LINE template messages

### C. Session Status Flow

```
WAITING → (claim) → ACTIVE → (close) → CLOSED
              ↓
         (transfer)
              ↓
           ACTIVE (with new operator)
```

---

*Document Version: 1.0*
*Created: 2026-02-14*
*Author: Kimi Code*
