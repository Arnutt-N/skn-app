# Live Chat UI Migration Plan

> **Project**: Adapt premium UI design from `examples/admin-chat-system` to current Live Chat  
> **Created**: 2026-02-14  
> **Status**: Planning Complete  
> **Priority**: Full Migration with Zustand

---

## Executive Summary

Migrate the Live Chat admin interface from current React Context + useReducer architecture to Zustand state management while adopting the premium UI design patterns from `examples/admin-chat-system`.

### Key Decisions
- ✅ **State Management**: Migrate from React Context to Zustand
- ✅ **Video Call**: Include as placeholder UI for future implementation
- ✅ **Scope**: Full migration (all phases)
- ✅ **Architecture**: Live Chat remains standalone page (separate from admin)

---

## Architecture Comparison

| Aspect | Example (`admin-chat-system`) | Current (`live-chat`) | Migration Decision |
|--------|------------------------------|----------------------|-------------------|
| State | Zustand v5 | React Context + useReducer | **Migrate to Zustand** |
| WebSocket | Mock/simulated | Real implementation | **Keep current** |
| Layout | 3-panel (sidebar, chat, profile) | 3-panel (list, chat, customer) | **Adapt UI design** |
| Styling | Tailwind + CSS variables | Tailwind + CSS variables | **Adapt color scheme** |
| Animation | Custom keyframes | Minimal | **Add animations** |
| Components | 6 core components | 12+ components | **Enhance existing** |

---

## Phase 0: Zustand Migration (Critical)

### 0.1 Current State Analysis

**Location:** `frontend/app/admin/live-chat/_hooks/useChatReducer.ts`

```typescript
// Current: 17 state properties, 18 action types
interface ChatState {
  conversations: Conversation[]
  selectedId: string | null
  currentChat: CurrentChat | null
  messages: Message[]
  loading: boolean
  backendOnline: boolean
  filterStatus: string | null
  searchQuery: string
  inputText: string
  sending: boolean
  claiming: boolean
  showCustomerPanel: boolean
  activeActionMenu: string | null
  showTransferDialog: boolean
  showCannedPicker: boolean
  soundEnabled: boolean
  pendingMessages: Set<string>
  failedMessages: Map<string, string>
  hasMoreHistory: boolean
  isLoadingHistory: boolean
}

// 18 Action Types
type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SELECT_CHAT'; payload: string | null }
  | { type: 'SET_CURRENT_CHAT'; payload: CurrentChat | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'PREPEND_MESSAGES'; payload: Message[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BACKEND_ONLINE'; payload: boolean }
  | { type: 'SET_FILTER'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_CLAIMING'; payload: boolean }
  | type: 'SET_SHOW_CUSTOMER_PANEL'; payload: boolean }
  | { type: 'SET_ACTIVE_ACTION_MENU'; payload: string | null }
  | { type: 'SET_SHOW_TRANSFER_DIALOG'; payload: boolean }
  | { type: 'SET_SHOW_CANNED_PICKER'; payload: boolean }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'ADD_PENDING'; payload: string }
  | { type: 'REMOVE_PENDING'; payload: string }
  | { type: 'SET_FAILED'; payload: { id: string; error: string } }
  | { type: 'CLEAR_FAILED'; payload: string }
  | { type: 'SET_HAS_MORE_HISTORY'; payload: boolean }
  | { type: 'SET_LOADING_HISTORY'; payload: boolean }
```

### 0.2 Target Zustand Store

**New File:** `frontend/stores/live-chat-store.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types from existing _types.ts
import type { Session, Conversation, CurrentChat, Message } from '@/app/admin/live-chat/_types'

// New types for enhanced features
export type UserStatus = 'online' | 'away' | 'busy' | 'offline'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ToastNotification {
  id: string
  title: string
  message: string
  avatar?: string
  type: 'message' | 'system' | 'call'
  timestamp: number
}

export interface PendingMessage {
  tempId: string
  content: string
  timestamp: number
  retries: number
}

export interface VideoCallState {
  isActive: boolean
  user: {
    id: string
    name: string
    avatar: string
  } | null
  isMuted: boolean
  isVideoOff: boolean
  duration: number
  isConnecting: boolean
}

interface LiveChatState {
  // ============================================
  // SESSION DATA
  // ============================================
  sessions: Session[]
  selectedSessionId: string | null
  currentChat: CurrentChat | null
  messages: Message[]
  
  // ============================================
  // FILTERS & SEARCH
  // ============================================
  filterStatus: SessionStatus | 'all'
  searchQuery: string
  inputText: string
  
  // ============================================
  // UI STATE
  // ============================================
  showCustomerPanel: boolean
  showTransferDialog: boolean
  showCannedPicker: boolean
  showEmojiPicker: boolean
  showStickerPicker: boolean
  inputExpanded: boolean
  activeActionMenu: string | null
  
  // ============================================
  // VIDEO CALL (Placeholder)
  // ============================================
  videoCall: VideoCallState
  
  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: ToastNotification[]
  soundEnabled: boolean
  
  // ============================================
  // ASYNC STATE
  // ============================================
  loading: boolean
  sending: boolean
  claiming: boolean
  
  // ============================================
  // WEBSOCKET STATE
  // ============================================
  backendOnline: boolean
  pendingMessages: Map<string, PendingMessage>
  failedMessages: Map<string, string>
  
  // ============================================
  // PAGINATION
  // ============================================
  hasMoreHistory: boolean
  isLoadingHistory: boolean
}

interface LiveChatActions {
  // Session actions
  setSessions: (sessions: Session[]) => void
  selectSession: (id: string | null) => void
  setCurrentChat: (chat: CurrentChat | null) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  
  // Message actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  prependMessages: (messages: Message[]) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  
  // Filter actions
  setFilterStatus: (status: SessionStatus | 'all') => void
  setSearchQuery: (query: string) => void
  setInputText: (text: string) => void
  
  // UI actions
  toggleCustomerPanel: () => void
  toggleTransferDialog: () => void
  toggleCannedPicker: () => void
  toggleEmojiPicker: () => void
  toggleStickerPicker: () => void
  toggleInputExpanded: () => void
  setActiveActionMenu: (id: string | null) => void
  
  // Video call actions
  startVideoCall: (user: VideoCallState['user']) => void
  endVideoCall: () => void
  setVideoMuted: (muted: boolean) => void
  setVideoOff: (off: boolean) => void
  incrementCallDuration: () => void
  setVideoConnecting: (connecting: boolean) => void
  
  // Notification actions
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  toggleSound: () => void
  
  // Async actions
  setLoading: (loading: boolean) => void
  setSending: (sending: boolean) => void
  setClaiming: (claiming: boolean) => void
  
  // WebSocket actions
  setBackendOnline: (online: boolean) => void
  addPendingMessage: (tempId: string, content: string) => void
  removePendingMessage: (tempId: string) => void
  setFailedMessage: (tempId: string, error: string) => void
  clearFailedMessage: (tempId: string) => void
  
  // Pagination actions
  setHasMoreHistory: (hasMore: boolean) => void
  setIsLoadingHistory: (loading: boolean) => void
  
  // Composite actions
  sendMessage: (content: string, type: Message['type']) => Promise<void>
  claimSession: (sessionId: string) => Promise<void>
  closeSession: () => Promise<void>
  transferSession: (toOperatorId: string) => Promise<void>
  loadHistory: () => Promise<void>
  
  // Reset
  reset: () => void
}

type LiveChatStore = LiveChatState & LiveChatActions

// Initial state
const initialState: LiveChatState = {
  sessions: [],
  selectedSessionId: null,
  currentChat: null,
  messages: [],
  filterStatus: 'all',
  searchQuery: '',
  inputText: '',
  showCustomerPanel: true,
  showTransferDialog: false,
  showCannedPicker: false,
  showEmojiPicker: false,
  showStickerPicker: false,
  inputExpanded: false,
  activeActionMenu: null,
  videoCall: {
    isActive: false,
    user: null,
    isMuted: false,
    isVideoOff: false,
    duration: 0,
    isConnecting: false,
  },
  notifications: [],
  soundEnabled: true,
  loading: true,
  sending: false,
  claiming: false,
  backendOnline: true,
  pendingMessages: new Map(),
  failedMessages: new Map(),
  hasMoreHistory: true,
  isLoadingHistory: false,
}

export const useLiveChatStore = create<LiveChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ... implement all actions
      }),
      {
        name: 'live-chat-storage',
        partialize: (state) => ({
          soundEnabled: state.soundEnabled,
          showCustomerPanel: state.showCustomerPanel,
          inputExpanded: state.inputExpanded,
        }),
      }
    ),
    { name: 'LiveChatStore' }
  )
)
```

### 0.3 Migration Steps

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 0.1 | Install Zustand if not present | `package.json` | Low |
| 0.2 | Create store file with state shape | `stores/live-chat-store.ts` | Medium |
| 0.3 | Implement all actions from reducer | `stores/live-chat-store.ts` | Medium |
| 0.4 | Update `LiveChatShell.tsx` to use store | `_components/LiveChatShell.tsx` | Medium |
| 0.5 | Update `ConversationList.tsx` | `_components/ConversationList.tsx` | Medium |
| 0.6 | Update `ChatArea.tsx` | `_components/ChatArea.tsx` | Medium |
| 0.7 | Update `MessageInput.tsx` | `_components/MessageInput.tsx` | Medium |
| 0.8 | Update `CustomerPanel.tsx` | `_components/CustomerPanel.tsx` | Low |
| 0.9 | Update `ChatHeader.tsx` | `_components/ChatHeader.tsx` | Low |
| 0.10 | Update `useLiveChatSocket.ts` | `hooks/useLiveChatSocket.ts` | Medium |
| 0.11 | Remove old context and reducer | Delete 2 files | Low |
| 0.12 | Test all WebSocket events | - | Medium |

### 0.4 Component Migration Pattern

**Before (React Context):**
```tsx
// Component using context
import { useLiveChat } from '../_context/LiveChatContext'

function ConversationList() {
  const { 
    conversations, 
    selectedId, 
    selectConversation,
    filterStatus,
    setFilterStatus 
  } = useLiveChat()
  
  // ...
}
```

**After (Zustand):**
```tsx
// Component using Zustand selectors
import { useLiveChatStore } from '@/stores/live-chat-store'

function ConversationList() {
  // Use selectors for performance
  const sessions = useLiveChatStore((s) => s.sessions)
  const selectedSessionId = useLiveChatStore((s) => s.selectedSessionId)
  const selectSession = useLiveChatStore((s) => s.selectSession)
  const filterStatus = useLiveChatStore((s) => s.filterStatus)
  const setFilterStatus = useLiveChatStore((s) => s.setFilterStatus)
  
  // ...
}
```

---

## Phase 1: Design System Adaptation

### 1.1 Color Scheme Migration

**File:** `frontend/app/globals.css`

Add status colors from example:

```css
@layer base {
  :root {
    /* Existing colors... */
    
    /* Status colors (from admin-chat-system) */
    --online: 142 71% 45%;
    --away: 38 92% 50%;
    --busy: 0 84% 60%;
    --offline: 220 10% 46%;
  }
}
```

**File:** `frontend/tailwind.config.ts`

```typescript
colors: {
  // ... existing
  online: 'hsl(var(--online))',
  away: 'hsl(var(--away))',
  busy: 'hsl(var(--busy))',
  offline: 'hsl(var(--offline))',
}
```

### 1.2 Animation System

**File:** `frontend/app/globals.css`

Add animation keyframes:

```css
/* Typing indicator animation */
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
.typing-dot {
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Pulse ring for video call */
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
.pulse-ring {
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

/* Message slide-in */
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.msg-in { animation: slide-in-left 0.3s ease-out; }
.msg-out { animation: slide-in-right 0.3s ease-out; }

/* Badge blink */
@keyframes blink-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.blink-badge { animation: blink-badge 1s ease-in-out infinite; }

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fade-in 0.3s ease-out; }

/* Scale in for popups */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.scale-in { animation: scale-in 0.2s ease-out; }

/* Toast slide */
@keyframes toast-slide {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
.toast-slide { animation: toast-slide 0.4s ease-out; }

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

---

## Phase 2: Component UI Improvements

### 2.1 ConversationList Panel

**File:** `frontend/app/admin/live-chat/_components/ConversationItem.tsx`

Enhancements:
- Status indicator dots with colors
- Mode badge (Bot/Manual) per conversation
- Improved hover states
- VIP tag with star icon
- Blink animation for unread

```tsx
// Key additions
<span className={cn(
  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
  session.status === 'waiting' ? "bg-away" : 
  session.status === 'active' ? "bg-online" : "bg-offline"
)} />

{session.unreadCount > 0 && (
  <span className="blink-badge flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
    {session.unreadCount}
  </span>
)}

<span className={cn(
  "flex items-center gap-1 text-[9px] font-medium",
  session.mode === 'bot' ? "text-accent" : "text-primary"
)}>
  {session.mode === 'bot' ? <Bot className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
  {session.mode === 'bot' ? 'Bot' : 'Manual'}
</span>
```

### 2.2 ChatArea / MessageBubble

**File:** `frontend/app/admin/live-chat/_components/MessageBubble.tsx`

Enhancements:
- Rounded corners with `rounded-tl-sm` / `rounded-tr-sm`
- Read receipts with checkmarks
- Message reactions display
- Slide-in animations

```tsx
<div className={cn(
  "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
  message.isAdmin
    ? "rounded-tr-sm bg-primary text-primary-foreground"
    : "rounded-tl-sm bg-muted text-foreground"
)}>
  {/* Message content */}
  
  {/* Reactions */}
  {message.reactions?.length > 0 && (
    <div className="absolute -bottom-3 left-2 flex gap-0.5">
      {message.reactions.map((r, i) => (
        <span key={i} className="rounded-full bg-card px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-border">
          {r}
        </span>
      ))}
    </div>
  )}
</div>

{/* Read status */}
<div className="flex items-center gap-1 px-1">
  <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
  {message.isAdmin && (
    message.isRead ? (
      <CheckCheck className="h-3 w-3 text-primary" />
    ) : (
      <Check className="h-3 w-3 text-muted-foreground" />
    )
  )}
</div>
```

### 2.3 MessageInput

**File:** `frontend/app/admin/live-chat/_components/MessageInput.tsx`

Enhancements:
- Emoji picker toggle button
- Sticker picker toggle button
- Expandable textarea
- Quick replies bar

```tsx
{/* Toolbar */}
<div className="flex items-center gap-1 px-3 pt-2">
  <button onClick={() => toggleEmojiPicker()} className={cn("rounded-lg p-2", showEmojiPicker ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
    <Smile className="h-4 w-4" />
  </button>
  <button onClick={() => toggleStickerPicker()}>
    <Sticker className="h-4 w-4" />
  </button>
  <button onClick={() => imageInputRef.current?.click()}>
    <ImageIcon className="h-4 w-4" />
  </button>
  <button onClick={() => fileInputRef.current?.click()}>
    <Paperclip className="h-4 w-4" />
  </button>
  <button onClick={() => toggleCannedPicker()}>
    <Zap className="h-4 w-4" />
  </button>
  <div className="flex-1" />
  <button onClick={toggleInputExpanded}>
    {inputExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
  </button>
</div>

{/* Emoji picker */}
{showEmojiPicker && (
  <EmojiPicker onSelect={(emoji) => setInputText(prev => prev + emoji)} />
)}

{/* Sticker picker */}
{showStickerPicker && (
  <StickerPicker onSelect={(sticker) => sendSticker(sticker)} />
)}

{/* Textarea with auto-resize */}
<textarea
  value={inputText}
  onChange={handleInputChange}
  rows={inputExpanded ? 6 : 1}
  className={cn(
    "flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-2.5",
    inputExpanded ? "min-h-[150px]" : "min-h-[40px] max-h-[120px]"
  )}
/>
```

### 2.4 CustomerPanel

**File:** `frontend/app/admin/live-chat/_components/CustomerPanel.tsx`

Enhancements:
- Centered avatar with status ring
- Stats cards grid
- Copyable contact info
- Internal notes textarea
- Quick action buttons

```tsx
{/* Avatar section */}
<div className="flex flex-col items-center px-4 py-6">
  <div className="relative">
    <img
      src={customer.avatar}
      className="h-20 w-20 rounded-full bg-muted shadow-lg ring-4 ring-card"
    />
    <span className={cn(
      "absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-card",
      statusColors[customer.status]
    )} />
  </div>
  <h4 className="mt-3 text-base font-bold">{customer.name}</h4>
  <div className="mt-1 flex items-center gap-1.5">
    <span className={cn("h-2 w-2 rounded-full", statusColors[customer.status])} />
    <span className="text-xs text-muted-foreground">{statusLabels[customer.status]}</span>
  </div>
</div>

{/* Stats grid */}
<div className="grid grid-cols-3 gap-2 p-4">
  <StatCard label="Chats" value={customer.totalChats} icon={MessageSquare} />
  <StatCard label="Rating" value={customer.satisfaction} icon={Star} />
  <StatCard label="Since" value={customer.joinedDate} icon={Calendar} />
</div>

{/* Contact with copy */}
<InfoRow icon={Mail} label="Email" value={customer.email} copyable />
<InfoRow icon={Phone} label="Phone" value={customer.phone} copyable />

{/* Notes */}
<div className="px-4 py-3">
  <h5 className="mb-2 text-xs font-bold uppercase">Internal Notes</h5>
  <textarea
    placeholder="Add a note..."
    className="w-full rounded-lg border border-border bg-muted/50 p-3 text-xs"
    rows={3}
  />
</div>
```

### 2.5 ChatHeader

**File:** `frontend/app/admin/live-chat/_components/ChatHeader.tsx`

Enhancements:
- Per-conversation Bot/Manual toggle with visual indicator
- Video/Phone call buttons
- More actions dropdown

```tsx
<div className="flex items-center gap-2">
  <h3 className="text-sm font-bold">{session.userName}</h3>
  
  {/* VIP Badge */}
  {session.isVip && (
    <Badge className="h-4 border-0 bg-away/20 px-1.5 text-[9px] font-bold text-away">
      VIP
    </Badge>
  )}
  
  {/* Mode Toggle */}
  <button
    onClick={() => toggleMode(session.id)}
    className={cn(
      "flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold transition-all",
      session.mode === 'bot'
        ? "bg-accent/15 text-accent ring-1 ring-accent/25"
        : "bg-primary/10 text-primary ring-1 ring-primary/20"
    )}
  >
    <span className={cn(
      "flex h-4 w-4 items-center justify-center rounded-full",
      session.mode === 'bot' ? "bg-accent text-white" : "bg-primary text-white"
    )}>
      {session.mode === 'bot' ? <Bot className="h-2.5 w-2.5" /> : <UserCircle className="h-2.5 w-2.5" />}
    </span>
    {session.mode === 'bot' ? 'Bot' : 'Manual'}
  </button>
</div>

{/* Action buttons */}
<div className="flex items-center gap-1">
  <button onClick={() => startVoiceCall()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
    <Phone className="h-4 w-4" />
  </button>
  <button onClick={() => startVideoCall()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
    <Video className="h-4 w-4" />
  </button>
  <button onClick={toggleCustomerPanel} className={cn("rounded-lg p-2", showCustomerPanel ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
    <UserCircle className="h-4 w-4" />
  </button>
  <DropdownMenu>
    {/* More actions */}
  </DropdownMenu>
</div>
```

---

## Phase 3: New Components

### 3.1 NotificationToast System

**New File:** `frontend/components/admin/NotificationToast.tsx`

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { X, MessageSquare, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLiveChatStore } from "@/stores/live-chat-store"

interface ToastNotification {
  id: string
  title: string
  message: string
  avatar?: string
  type: "message" | "system" | "call"
  timestamp: number
}

export function NotificationToast() {
  const notifications = useLiveChatStore((s) => s.notifications)
  const soundEnabled = useLiveChatStore((s) => s.soundEnabled)
  const removeNotification = useLiveChatStore((s) => s.removeNotification)
  const toggleSound = useLiveChatStore((s) => s.toggleSound)

  // Auto-dismiss after 5s
  useEffect(() => {
    if (notifications.length === 0) return
    const timer = setTimeout(() => {
      removeNotification(notifications[0].id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notifications, removeNotification])

  return (
    <>
      {/* Toast container */}
      <div className="fixed right-4 top-4 z-[60] flex flex-col gap-2" aria-live="polite">
        {notifications.map((toast) => (
          <div
            key={toast.id}
            className="toast-slide relative flex w-80 items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xl"
          >
            {toast.avatar ? (
              <img src={toast.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full bg-muted" />
            ) : (
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                toast.type === "system" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
              )}>
                {toast.type === "system" ? <Bell className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{toast.title}</p>
                <button onClick={() => removeNotification(toast.id)} className="shrink-0 rounded-md p-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{toast.message}</p>
            </div>
            <span className="blink-badge absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
          </div>
        ))}
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg",
          soundEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </>
  )
}
```

**Integration in `LiveChatShell.tsx`:**
```tsx
import { NotificationToast } from '@/components/admin/NotificationToast'

export function LiveChatShell() {
  return (
    <>
      {/* ... existing layout ... */}
      <NotificationToast />
    </>
  )
}
```

### 3.2 VideoCallModal (Placeholder)

**New File:** `frontend/components/admin/VideoCallModal.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { PhoneOff, Mic, MicOff, VideoIcon, VideoOff, Monitor, MessageSquare, Maximize2, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLiveChatStore } from "@/stores/live-chat-store"

export function VideoCallModal() {
  const videoCall = useLiveChatStore((s) => s.videoCall)
  const endVideoCall = useLiveChatStore((s) => s.endVideoCall)
  const setVideoMuted = useLiveChatStore((s) => s.setVideoMuted)
  const setVideoOff = useLiveChatStore((s) => s.setVideoOff)
  const incrementCallDuration = useLiveChatStore((s) => s.incrementCallDuration)
  const setVideoConnecting = useLiveChatStore((s) => s.setVideoConnecting)

  useEffect(() => {
    if (!videoCall.isActive) return

    // Simulate connection
    const connectTimer = setTimeout(() => setVideoConnecting(false), 2000)

    // Duration counter
    const interval = setInterval(() => incrementCallDuration(), 1000)

    return () => {
      clearTimeout(connectTimer)
      clearInterval(interval)
    }
  }, [videoCall.isActive])

  if (!videoCall.isActive || !videoCall.user) return null

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
      <div className="scale-in relative flex h-[500px] w-[700px] flex-col overflow-hidden rounded-2xl bg-sidebar shadow-2xl">
        {/* Video area */}
        <div className="relative flex flex-1 items-center justify-center bg-sidebar">
          {videoCall.isConnecting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img src={videoCall.user.avatar} className="h-24 w-24 rounded-full" />
                <div className="pulse-ring absolute inset-0 rounded-full border-2 border-primary" />
              </div>
              <p className="text-lg font-semibold text-sidebar-foreground">{videoCall.user.name}</p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm text-sidebar-muted">Connecting...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img src={videoCall.user.avatar} className="h-32 w-32 rounded-full shadow-xl" />
              <p className="text-lg font-semibold text-sidebar-foreground">{videoCall.user.name}</p>
              <div className="flex items-center gap-2 text-sm text-sidebar-muted">
                <Volume2 className="h-4 w-4 text-online" />
                <span>{formatDuration(videoCall.duration)}</span>
              </div>
            </div>
          )}

          {/* Self video preview */}
          <div className="absolute bottom-4 right-4 flex h-32 w-44 items-center justify-center rounded-xl bg-sidebar-accent shadow-lg">
            {videoCall.isVideoOff ? (
              <div className="flex flex-col items-center gap-1">
                <VideoOff className="h-6 w-6 text-sidebar-muted" />
                <span className="text-[10px] text-sidebar-muted">Camera off</span>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground">
                A
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 bg-sidebar-accent px-6 py-5">
          <button onClick={() => setVideoMuted(!videoCall.isMuted)} className={cn("flex h-12 w-12 items-center justify-center rounded-full", videoCall.isMuted ? "bg-destructive text-destructive-foreground" : "bg-sidebar-border text-sidebar-foreground")}>
            {videoCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button onClick={() => setVideoOff(!videoCall.isVideoOff)} className={cn("flex h-12 w-12 items-center justify-center rounded-full", videoCall.isVideoOff ? "bg-destructive text-destructive-foreground" : "bg-sidebar-border text-sidebar-foreground")}>
            {videoCall.isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-border text-sidebar-foreground">
            <Monitor className="h-5 w-5" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-border text-sidebar-foreground">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar-border text-sidebar-foreground">
            <Maximize2 className="h-5 w-5" />
          </button>
          <button onClick={endVideoCall} className="flex h-12 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg">
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3.3 EmojiPicker Component

**New File:** `frontend/components/admin/EmojiPicker.tsx`

```tsx
"use client"

const emojiList = [
  "😀","😂","😍","🥰","😎","🤔","👍","👎","❤️","🔥",
  "🎉","✨","💯","🙏","👏","🤝","💪","😊","😢","😮",
  "🚀","⭐","💡","📌","✅","❌","⏰","📎","🎯","💬",
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose?: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="scale-in mx-3 mt-2 grid max-h-36 grid-cols-10 gap-1 overflow-y-auto rounded-lg border border-border bg-popover p-2">
      {emojiList.map((emoji, i) => (
        <button
          key={i}
          onClick={() => {
            onSelect(emoji)
            onClose?.()
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-muted"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
```

### 3.4 StickerPicker Component

**New File:** `frontend/components/admin/StickerPicker.tsx`

```tsx
"use client"

const stickers = [
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif",
]

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void
  onClose?: () => void
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <div className="scale-in mx-3 mt-2 grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border bg-popover p-3">
      {stickers.map((sticker, i) => (
        <button
          key={i}
          onClick={() => {
            onSelect(sticker)
            onClose?.()
          }}
          className="flex items-center justify-center rounded-lg p-2 transition-all hover:scale-110 hover:bg-muted"
        >
          <img src={sticker} alt="Sticker" className="h-12 w-12" />
        </button>
      ))}
    </div>
  )
}
```

---

## Phase 4: Layout Improvements

### 4.1 Flexible Panel Widths

**File:** `frontend/app/admin/live-chat/_components/LiveChatShell.tsx`

```tsx
// Current
<div className="flex h-screen">
  <ConversationList className="w-[288px]" />
  <ChatArea className="flex-1" />
  {showCustomerPanel && <CustomerPanel className="w-[256px]" />}
</div>

// Improved
<div className="flex h-screen">
  <ConversationList className="w-[280px] min-w-[260px] max-w-[320px]" />
  <ChatArea className="flex-1 min-w-[400px]" />
  {showCustomerPanel && <CustomerPanel className="w-[280px] min-w-[260px] max-w-[300px]" />}
</div>
```

### 4.2 Mobile Responsive Considerations

```tsx
// Mobile: Stack panels
<div className="flex h-screen flex-col md:flex-row">
  {/* Show list on mobile, hide when chat selected */}
  <ConversationList className={cn(
    "md:w-[280px]",
    selectedSessionId ? "hidden md:block" : "flex-1"
  )} />
  
  {/* Show chat when selected */}
  <ChatArea className={cn(
    "flex-1",
    selectedSessionId ? "" : "hidden md:block"
  )} />
  
  {/* Customer panel: drawer on mobile */}
  <CustomerPanel className="hidden md:block" />
</div>
```

---

## Phase 5: WebSocket Integration Updates

### 5.1 Update useLiveChatSocket

**File:** `frontend/hooks/useLiveChatSocket.ts`

```tsx
import { useLiveChatStore } from '@/stores/live-chat-store'
import { useWebSocket } from './useWebSocket'

export function useLiveChatSocket() {
  const {
    setSessions,
    selectSession,
    setCurrentChat,
    addMessage,
    setBackendOnline,
    // ... other actions
  } = useLiveChatStore()

  const { send, isConnected } = useWebSocket({
    url: WS_URL,
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'new_message':
          addMessage(data.message)
          // Show toast notification
          if (data.message.senderId !== 'admin') {
            addNotification({
              title: data.message.senderName,
              message: data.message.content,
              avatar: data.message.senderAvatar,
              type: 'message',
            })
          }
          break
          
        case 'session_claimed':
          updateSession(data.sessionId, { status: 'active', operatorId: data.operatorId })
          break
          
        case 'typing_indicator':
          // Update typing state
          break
          
        // ... handle other events
      }
    },
    onOpen: () => setBackendOnline(true),
    onClose: () => setBackendOnline(false),
  })

  return { send, isConnected }
}
```

---

## Implementation Order

| Priority | Phase | Task | Effort | Dependencies |
|----------|-------|------|--------|--------------|
| 1 | 0.1 | Install Zustand | Low | - |
| 2 | 0.2-0.3 | Create store with actions | Medium | 0.1 |
| 3 | 0.4 | Update LiveChatShell | Medium | 0.2 |
| 4 | 0.5-0.9 | Update all components | High | 0.3 |
| 5 | 0.10 | Update WebSocket hook | Medium | 0.4 |
| 6 | 0.11-0.12 | Remove old files & test | Low | 0.5 |
| 7 | 1.1 | Color scheme | Low | - |
| 8 | 1.2 | Animations | Low | 1.1 |
| 9 | 3.1 | NotificationToast | Medium | 0.2 |
| 10 | 2.1 | ConversationList UI | Medium | 0.5, 1.1 |
| 11 | 2.2 | ChatArea/MessageBubble | High | 0.5, 1.2 |
| 12 | 3.3 | Emoji/Sticker Pickers | Medium | 0.2, 1.2 |
| 13 | 2.3 | CustomerPanel | Medium | 0.5, 1.1 |
| 14 | 2.4 | ChatHeader | Low | 0.5, 1.1 |
| 15 | 3.2 | VideoCallModal | Low | 0.2, 1.2 |
| 16 | 4.1 | Layout improvements | Low | All |

---

## File Changes Summary

### New Files (6)
| File | Purpose |
|------|---------|
| `frontend/stores/live-chat-store.ts` | Zustand store |
| `frontend/components/admin/NotificationToast.tsx` | Toast system |
| `frontend/components/admin/VideoCallModal.tsx` | Video call placeholder |
| `frontend/components/admin/EmojiPicker.tsx` | Emoji picker |
| `frontend/components/admin/StickerPicker.tsx` | Sticker picker |
| `PRPs/open_code/live-chat-ui-migration-plan.md` | This document |

### Modified Files (16)
| File | Changes |
|------|---------|
| `frontend/app/globals.css` | Add colors, animations |
| `frontend/tailwind.config.ts` | Add status colors |
| `frontend/app/admin/live-chat/page.tsx` | Wrap with providers |
| `frontend/app/admin/live-chat/_components/LiveChatShell.tsx` | Use store |
| `frontend/app/admin/live-chat/_components/ConversationList.tsx` | Use store, UI |
| `frontend/app/admin/live-chat/_components/ConversationItem.tsx` | UI enhancements |
| `frontend/app/admin/live-chat/_components/ChatArea.tsx` | Use store, animations |
| `frontend/app/admin/live-chat/_components/ChatHeader.tsx` | UI enhancements |
| `frontend/app/admin/live-chat/_components/MessageBubble.tsx` | UI enhancements |
| `frontend/app/admin/live-chat/_components/MessageInput.tsx` | Emoji, stickers |
| `frontend/app/admin/live-chat/_components/CustomerPanel.tsx` | UI enhancements |
| `frontend/app/admin/live-chat/_components/SessionActions.tsx` | Use store |
| `frontend/app/admin/live-chat/_components/TransferDialog.tsx` | Use store |
| `frontend/hooks/useLiveChatSocket.ts` | Dispatch to store |
| `frontend/package.json` | Add zustand if needed |
| `frontend/tsconfig.json` | Add store path alias |

### Deleted Files (2)
| File | Reason |
|------|--------|
| `frontend/app/admin/live-chat/_context/LiveChatContext.tsx` | Replaced by Zustand |
| `frontend/app/admin/live-chat/_hooks/useChatReducer.ts` | Replaced by Zustand |

---

## Testing Checklist

### Functional Tests
- [ ] WebSocket connection establishes correctly
- [ ] Message send/receive with optimistic updates
- [ ] Typing indicators display correctly
- [ ] Session claim/transfer/close actions
- [ ] Canned responses work
- [ ] Sound notifications work
- [ ] Emoji picker inserts emoji
- [ ] Sticker picker sends sticker
- [ ] Customer panel shows correct data
- [ ] Video call modal opens/closes

### UI Tests
- [ ] Status colors display correctly
- [ ] Animations play smoothly
- [ ] Message slide-in works
- [ ] Badge blink animation works
- [ ] Toast notifications appear/dismiss
- [ ] Mobile responsive layout

### Performance Tests
- [ ] 200+ messages render smoothly
- [ ] Virtual scrolling still works
- [ ] No memory leaks from animations
- [ ] Zustand selectors prevent unnecessary re-renders

### Accessibility Tests
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus trap in modals
- [ ] Screen reader compatible

---

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Breaking WebSocket | Keep WebSocket layer untouched, only dispatch to store | Dev |
| State sync issues | Use Zustand's devtools for debugging | Dev |
| Performance regression | Test with 200+ messages, use selectors | QA |
| Accessibility loss | Verify ARIA labels remain, run a11y audit | QA |
| Thai text support | Test with `thai-text`, `thai-no-break` classes | QA |
| Animation jank | Use `will-change`, test on low-end devices | Dev |

---

## Estimated Timeline

| Phase | Hours | Days (4h/day) |
|-------|-------|---------------|
| Phase 0: Zustand Migration | 10-14h | 2.5-3.5 days |
| Phase 1: Design System | 2-3h | 0.5-1 day |
| Phase 2: Component UI | 6-8h | 1.5-2 days |
| Phase 3: New Components | 4-6h | 1-1.5 days |
| Phase 4: Layout | 2-3h | 0.5-1 day |
| Testing & Polish | 4-6h | 1-1.5 days |
| **Total** | **28-40h** | **7-10 days** |

---

## Next Steps

1. **Review this plan** with team
2. **Create feature branch**: `feature/live-chat-ui-migration`
3. **Start with Phase 0.1**: Install Zustand
4. **Implement incrementally**: One component at a time
5. **Test after each phase**: Run full test suite
6. **Code review**: Before merging to main

---

## References

- Example implementation: `examples/admin-chat-system/`
- Current live chat: `frontend/app/admin/live-chat/`
- AGENTS.md: Project conventions
- Zustand docs: https://zustand-demo.pmnd.rs/

---

*Last updated: 2026-02-14*
