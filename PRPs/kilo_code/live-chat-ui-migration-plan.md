# Live Chat UI Migration Plan

> **Target**: Adapt UI design from `examples/admin-chat-system` to current Live Chat implementation
> **Scope**: Live Chat remains standalone, separate from admin dashboard
> **Created**: 2026-02-14

---

## Executive Summary

This plan outlines the migration of the Live Chat UI to adopt the modern, polished design patterns from the example `admin-chat-system` while maintaining the existing WebSocket infrastructure, backend integration, and standalone page architecture.

---

## Current State Analysis

### Example System (`examples/admin-chat-system`)

| Component | File | Key Features |
|-----------|------|--------------|
| Chat Room | [`chat-room.tsx`](examples/admin-chat-system/components/chat-room.tsx) | Message bubbles, typing indicators, emoji/sticker pickers, quick replies |
| User List | [`user-list-panel.tsx`](examples/admin-chat-system/components/user-list-panel.tsx) | Search, status filters, conversation cards, mode indicators |
| User Profile | [`user-profile-panel.tsx`](examples/admin-chat-system/components/user-profile-panel.tsx) | Contact info, stats, tags, internal notes |
| State Management | [`chat-store.ts`](examples/admin-chat-system/lib/chat-store.ts) | Zustand store with mock data |
| Styling | [`globals.css`](examples/admin-chat-system/app/globals.css) | CSS variables, animations, custom scrollbar |

**Design System:**
- Uses shadcn/ui components
- HSL CSS variables for theming
- Light theme with dark sidebar
- Status colors: online (green), away (yellow), busy (red), offline (gray)
- Smooth animations: slide-in, fade-in, scale-in, typing dots

### Current Live Chat (`frontend/app/admin/live-chat/`)

| Component | File | Current State |
|-----------|------|---------------|
| Chat Area | [`ChatArea.tsx`](frontend/app/admin/live-chat/_components/ChatArea.tsx) | Virtualized scrolling, WebSocket status |
| Conversation List | [`ConversationList.tsx`](frontend/app/admin/live-chat/_components/ConversationList.tsx) | Dark theme, search, filters |
| Context | [`LiveChatContext.tsx`](frontend/app/admin/live-chat/_context/LiveChatContext.tsx) | Full WebSocket integration |
| Hooks | [`useLiveChatSocket.ts`](frontend/hooks/useLiveChatSocket.ts) | Real-time messaging |

**Current Design:**
- Dark purple gradient theme
- Custom components (not shadcn/ui)
- WebSocket-first architecture
- LINE-specific features (chat mode toggle, session management)

---

## Gap Analysis

### UI/UX Gaps

| Feature | Example | Current | Priority |
|---------|---------|---------|----------|
| Message Bubbles | Rounded with tail, reactions | Basic styling | High |
| Typing Indicator | Animated dots | Static text | Medium |
| Emoji Picker | Grid popup | None | Low |
| Sticker Picker | Grid popup | None | Low |
| Quick Replies | Horizontal scroll bar | Canned responses picker | Medium |
| User Status Colors | HSL variables | Custom classes | High |
| Animations | Slide-in, fade-in | Minimal | Medium |
| Profile Panel | Collapsible right panel | Customer panel (basic) | High |
| Bot/Manual Toggle | Per-user in header | ChatModeToggle component | Medium |
| Read Status | Check/CheckCheck icons | None | Low |

### Architecture Differences

| Aspect | Example | Current | Migration Approach |
|--------|---------|---------|-------------------|
| State | Zustand (mock) | React Context + useReducer | Keep Context, add Zustand slice |
| Styling | shadcn/ui + Tailwind | Custom Tailwind | Adopt shadcn/ui components |
| Theme | Light + Dark sidebar | Full dark | Adopt light theme option |
| Data | Mock data | Real WebSocket | Preserve WebSocket layer |

---

## Migration Phases

### Phase 1: Design System Foundation (Week 1)

**Objective**: Establish visual consistency with example system

#### 1.1 CSS Variables Migration

Update [`globals.css`](frontend/app/globals.css) to include example's design tokens:

```css
/* Add to existing globals.css */
@layer base {
  :root {
    /* Status Colors */
    --online: 142 71% 45%;
    --away: 38 92% 50%;
    --busy: 0 84% 60%;
    --offline: 220 10% 46%;
    
    /* Live Chat specific */
    --chat-bg: 0 0% 100%;
    --chat-sidebar: 220 20% 97%;
    --chat-primary: 217 91% 60%;
  }
}
```

#### 1.2 Animation Classes

Add animation utilities from example:

```css
/* Typing indicator */
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
.typing-dot {
  animation: typing-bounce 1.4s infinite ease-in-out;
}

/* Message animations */
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.msg-out { animation: slide-in-right 0.3s ease-out; }
```

#### 1.3 Custom Scrollbar

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 20px;
}
```

---

### Phase 2: Component Migration (Week 2-3)

**Objective**: Adopt example's component patterns while preserving functionality

#### 2.1 MessageBubble Component

**Current**: [`MessageBubble.tsx`](frontend/app/admin/live-chat/_components/MessageBubble.tsx)
**Target**: Enhanced with example styling

```tsx
// Target implementation
function MessageBubble({ message }: { message: Message }) {
  const isAdmin = message.direction === 'OUTGOING';
  
  return (
    <div className={cn(
      "flex items-end gap-2 px-4",
      isAdmin ? "msg-out flex-row-reverse" : "msg-in"
    )}>
      {/* Avatar for incoming */}
      {!isAdmin && (
        <img
          src={message.senderAvatar}
          className="h-7 w-7 shrink-0 rounded-full bg-muted"
        />
      )}
      
      <div className={cn(
        "flex max-w-[65%] flex-col gap-0.5",
        isAdmin ? "items-end" : "items-start"
      )}>
        {/* Sender name */}
        {!isAdmin && (
          <span className="px-1 text-[10px] font-medium text-muted-foreground">
            {message.senderName}
          </span>
        )}
        
        {/* Bubble */}
        <div className={cn(
          "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAdmin
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground"
        )}>
          {message.type === 'text' && <p>{message.content}</p>}
          {message.type === 'image' && (
            <img src={message.imageUrl} className="max-h-48 rounded-lg" />
          )}
        </div>
        
        {/* Timestamp + read status */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {isAdmin && (
            message.isRead 
              ? <CheckCheck className="h-3 w-3 text-primary" />
              : <Check className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 ConversationItem Component

**Current**: [`ConversationItem.tsx`](frontend/app/admin/live-chat/_components/ConversationItem.tsx)
**Target**: Match example's UserCard pattern

Key changes:
- Add status indicator dot with color
- Add Bot/Manual mode badge
- Add unread count badge with blink animation
- Add hover action menu

#### 2.3 ChatHeader Component

**Current**: [`ChatHeader.tsx`](frontend/app/admin/live-chat/_components/ChatHeader.tsx)
**Target**: Enhanced with example patterns

Add:
- User avatar with status dot
- VIP badge for priority users
- Bot/Manual toggle button (per-user)
- Video/Voice call buttons (placeholder)
- Profile toggle button

#### 2.4 MessageInput Component

**Current**: [`MessageInput.tsx`](frontend/app/admin/live-chat/_components/MessageInput.tsx)
**Target**: Enhanced with emoji/sticker pickers

Add:
- Emoji picker popup
- Sticker picker popup (LINE stickers)
- Quick replies bar
- Expand/collapse button for textarea

---

### Phase 3: Panel Components (Week 3-4)

#### 3.1 CustomerPanel Enhancement

**Current**: [`CustomerPanel.tsx`](frontend/app/admin/live-chat/_components/CustomerPanel.tsx)
**Target**: Match example's UserProfilePanel

Features to add:
- Contact information section
- Activity stats (conversations, rating, joined date)
- Internal notes textarea
- Admin actions (manage tags, change role)
- Quick action buttons (video call, mute, block)

#### 3.2 ConversationList Enhancement

**Current**: [`ConversationList.tsx`](frontend/app/admin/live-chat/_components/ConversationList.tsx)
**Target**: Match example's UserListPanel

Features to add:
- Online count indicator
- Bot/Manual mode summary
- Status filter buttons (online, away, busy, offline)
- Summary bar at bottom

---

### Phase 4: Theme & Polish (Week 4)

#### 4.1 Light Theme Option

The example uses a light theme for the chat area. Add theme toggle:

```tsx
// In LiveChatContext
const [chatTheme, setChatTheme] = useState<'light' | 'dark'>('light');

// Apply via class
<div className={cn(
  "flex flex-1 flex-col",
  chatTheme === 'light' ? "bg-background text-foreground" : "bg-gray-900 text-white"
)}>
```

#### 4.2 Notification Toast

Port example's [`notification-toast.tsx`](examples/admin-chat-system/components/notification-toast.tsx):

```tsx
// New file: frontend/app/admin/live-chat/_components/NotificationToast.tsx
export function NotificationToast() {
  const { notifications, removeNotification } = useLiveChatContext();
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <div key={n.id} className="toast-slide ...">
          {/* Toast content */}
        </div>
      ))}
    </div>
  );
}
```

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `_components/EmojiPicker.tsx` | Emoji selection popup |
| `_components/StickerPicker.tsx` | LINE sticker picker |
| `_components/QuickRepliesBar.tsx` | Quick reply buttons |
| `_components/NotificationToast.tsx` | Toast notifications |
| `_components/ReadStatus.tsx` | Check/CheckCheck icons |

### Files to Modify

| File | Changes |
|------|---------|
| `globals.css` | Add CSS variables, animations |
| `_components/MessageBubble.tsx` | Adopt example styling |
| `_components/ConversationItem.tsx` | Add status dots, badges |
| `_components/ChatHeader.tsx` | Add avatar, toggle buttons |
| `_components/MessageInput.tsx` | Add pickers, quick replies |
| `_components/CustomerPanel.tsx` | Enhance with profile sections |
| `_components/ConversationList.tsx` | Add filters, summary bar |
| `_context/LiveChatContext.tsx` | Add theme state, notifications |

---

## Preserved Architecture

### Must Not Change

1. **WebSocket Infrastructure**
   - [`useLiveChatSocket.ts`](frontend/hooks/useLiveChatSocket.ts)
   - [`client.ts`](frontend/lib/websocket/client.ts)
   - Backend WebSocket endpoint

2. **State Management Core**
   - [`useChatReducer.ts`](frontend/app/admin/live-chat/_hooks/useChatReducer.ts)
   - WebSocket event handlers

3. **LINE Integration**
   - Chat mode toggle (BOT/HUMAN)
   - Session management (claim, close, transfer)
   - Real-time message sync

4. **Backend Services**
   - All API endpoints
   - Database models
   - LINE webhook processing

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Add CSS variables to globals.css
- [ ] Add animation keyframes
- [ ] Add custom scrollbar styles
- [ ] Test theme switching

### Phase 2: Components
- [ ] Update MessageBubble styling
- [ ] Update ConversationItem with status dots
- [ ] Update ChatHeader with avatar and toggles
- [ ] Add EmojiPicker component
- [ ] Add StickerPicker component
- [ ] Add QuickRepliesBar component

### Phase 3: Panels
- [ ] Enhance CustomerPanel with sections
- [ ] Add ConversationList filters
- [ ] Add summary bar
- [ ] Add NotificationToast

### Phase 4: Polish
- [ ] Implement light theme option
- [ ] Add read status indicators
- [ ] Test all animations
- [ ] Accessibility audit

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking WebSocket sync | High | Preserve all WebSocket hooks and handlers |
| Theme conflicts | Medium | Use CSS variables, test both themes |
| Performance regression | Medium | Keep virtualization, test with large datasets |
| LINE feature compatibility | High | Test all session operations after changes |

---

## Testing Strategy

1. **Visual Regression**: Compare screenshots before/after
2. **WebSocket Tests**: Verify all real-time features work
3. **Session Operations**: Test claim, close, transfer
4. **Theme Toggle**: Test light and dark modes
5. **Mobile Responsive**: Test on various screen sizes

---

## Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | CSS variables, animations |
| 2 | Core Components | MessageBubble, ConversationItem, ChatHeader |
| 3 | Input Components | Emoji, Sticker, Quick Replies |
| 4 | Panels & Polish | CustomerPanel, ConversationList, Theme |

---

## References

- Example System: `examples/admin-chat-system/`
- Current Live Chat: `frontend/app/admin/live-chat/`
- Design Tokens: `examples/admin-chat-system/app/globals.css`
- shadcn/ui Components: `examples/admin-chat-system/components/ui/`