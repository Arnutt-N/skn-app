# Live Chat UI Migration — Merged Best Plan (All Agents + Zustand)

> **Created:** 2026-02-15
> **Author:** Claude Code (merged from Cline, CodeX, Kimi Code, Open Code, Kilo Code, Claude Code plans)
> **Source Design:** `examples/admin-chat-system/`
> **Target:** `frontend/app/admin/live-chat/`
> **Strategy:** Safe incremental migration — Zustand + UI restyle per-component

---

## Executive Summary

Migrate the live chat UI to match the premium design from `examples/admin-chat-system` while simultaneously migrating state management from React Context+useReducer to Zustand. The migration uses a **safe incremental approach**: Zustand store is created alongside the existing Context (coexistence period), then components are migrated one-by-one with both state + visual changes per component. Live chat remains a standalone page at `/admin/live-chat`.

### Key Decisions (Best of All Plans)

| Decision | Choice | Source Agent | Rationale |
|----------|--------|-------------|-----------|
| State management | **Zustand (incremental)** | Kimi + Open Code (approach) + Claude Code (incremental safety) | Better performance, cleaner code, but done safely per-component |
| Route | **Keep `/admin/live-chat`** | Claude Code + Cline + Kilo Code | No reason to create new route — existing route already standalone |
| VideoCallModal | **Exclude from MVP** | CodeX + Claude Code | No backend video call support, pure UI placeholder adds complexity |
| AdminSidebar | **Exclude** | CodeX + Kimi + Open Code | Live chat is full-screen standalone — sidebar navigation is unneeded |
| shadcn/ui packages | **Don't add** | Claude Code | Adapt visual patterns without importing 40+ Radix packages |
| Rollback safety | **Phase 0 baseline + compatibility layer** | CodeX | Capture baseline, keep Context working during migration |
| Tailwind version | **Stay on Tailwind 4 `@theme`** | Claude Code | Project uses Tailwind 4 — convert example's Tailwind 3 patterns |
| PR delivery | **One PR per phase** | CodeX | Low risk, easy rollback per phase |

---

## Current State

### Architecture

```
frontend/app/admin/live-chat/
├── page.tsx                    → Suspense + LiveChatProvider + LiveChatShell
├── layout.tsx                  → Standalone (bypasses admin sidebar)
├── _types.ts                   → Conversation, Session, CurrentChat types
├── _components/
│   ├── LiveChatShell.tsx       → 3-panel layout (List | Chat | Customer)
│   ├── ConversationList.tsx    → Dark purple gradient, search, 3 filter tabs
│   ├── ConversationItem.tsx    → Basic card, memo-optimized
│   ├── ChatArea.tsx            → Virtual scrolling, IntersectionObserver
│   ├── ChatHeader.tsx          → Avatar, mode text, SessionActions
│   ├── MessageBubble.tsx       → Basic bubbles, memo-optimized
│   ├── MessageInput.tsx        → Single-line input, canned picker, file attach
│   ├── CustomerPanel.tsx       → Basic info (w-64), export CSV/PDF
│   ├── QueueBadge.tsx          → Status badge
│   ├── SessionActions.tsx      → Claim/Close/Transfer
│   ├── TransferDialog.tsx      → Transfer modal
│   └── TypingIndicator.tsx     → 3-dot animation
├── _context/
│   └── LiveChatContext.tsx     → 566 lines: Context + all API/WS wiring
└── _hooks/
    ├── useChatReducer.ts       → 17 state props, 18 action types, switch/case
    ├── useConversations.ts     → Conversation filtering
    └── useMessages.ts          → Message handling
```

### State: 17 Properties, 18 Action Types

```typescript
// useChatReducer.ts — CURRENT (to be replaced by Zustand)
interface ChatState {
  conversations: Conversation[];
  selectedId: string | null;
  currentChat: CurrentChat | null;
  messages: Message[];
  loading: boolean;
  backendOnline: boolean;
  filterStatus: string | null;
  searchQuery: string;
  inputText: string;
  sending: boolean;
  claiming: boolean;
  showCustomerPanel: boolean;
  activeActionMenu: string | null;
  showTransferDialog: boolean;
  showCannedPicker: boolean;
  soundEnabled: boolean;
  pendingMessages: Set<string>;
  failedMessages: Map<string, string>;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
}
```

### Dependencies (package.json)

```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "tailwindcss": "^4",
  "lucide-react": "^0.473.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0"
}
// NOTE: No Zustand yet — must be installed
```

---

## UX Design

### Before State

```
┌─────────────────────────────────────────────────────────────────┐
│ Live Chat (standalone fullscreen)                               │
├──────────────┬──────────────────────────────┬───────────────────┤
│ Conversation │         Chat Area            │  Customer Panel   │
│ List (w-72)  │       (flex-1)               │    (w-64)         │
│              │                              │                   │
│ Dark purple  │  White header (h-14)         │  Basic info       │
│ gradient     │  bg-white/80 backdrop-blur   │  Avatar + name    │
│ #2B2840 →    │                              │  LINE ID          │
│ #1E1B33      │  Messages (bg-slate-100)     │  Session status   │
│              │  - User: white bg            │  Export buttons   │
│ Home button  │  - Bot: gray bg              │  Delete button    │
│ Search bar   │  - Admin: green bg           │                   │
│ Filter tabs  │                              │                   │
│ Conv items   │  Input: single-line          │                   │
│ Status bar   │  - Canned/Attach/Text/Send   │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

### After State

```
┌──────────────────────────────────────────────────────────────────┐
│ Live Chat (standalone fullscreen — NEW DESIGN)                   │
├──────────────┬───────────────────────────────┬───────────────────┤
│ Conversation │          Chat Room            │  User Profile     │
│ List (w-80)  │        (flex-1)               │  Panel (w-72)     │
│              │                               │                   │
│ Card header  │  Header (h-16)                │  Avatar (w-20)    │
│ w/ counters  │  - Avatar + status dot        │  + status ring    │
│              │  - Bot/Manual toggle pill      │  Name + tags      │
│ Search input │  - Profile toggle button      │  Quick actions     │
│ Status pills │  - More options dropdown      │  Stats cards 3col  │
│ (all/online/ │                               │  Contact info      │
│  away/busy/  │  Messages area                │  - Email, Phone    │
│  offline)    │  - Date separator             │  - Location        │
│              │  - Animated bubbles (slide)   │  Activity info     │
│ User cards   │  - Read receipts (✓/✓✓)       │  Internal notes    │
│ - Avatar     │  - Reactions (future)         │  Admin actions     │
│ - Status dot │  - Image/File/Sticker render  │                   │
│ - VIP star   │  - Typing indicator           │                   │
│ - Mode badge │                               │                   │
│ - Unread     │  Quick replies bar            │                   │
│ - Menu       │                               │                   │
│              │  Input area                   │                   │
│ Summary bar  │  - Toolbar (emoji/sticker/    │                   │
│              │    image/file/quick/expand)   │                   │
│              │  - Emoji grid picker          │                   │
│              │  - Sticker grid picker        │                   │
│              │  - Textarea + Send button     │                   │
├──────────────┴───────────────────────────────┴───────────────────┤
│ Toast Notifications (top-right)  │  Sound Toggle (bottom-right)  │
└──────────────────────────────────┴────────────────────────────────┘
```

---

## NOT Building (Explicit Scope Limits)

Prevent scope creep — these are explicitly excluded:

- **VideoCallModal** — No backend video call support. UI-only placeholder adds complexity for zero value.
- **AdminSidebar** — Live chat is already standalone full-screen. Adding sidebar navigation contradicts the standalone design.
- **New route `/live-chat`** — Current `/admin/live-chat` already bypasses admin sidebar via `layout.tsx`. Creating new route adds redirect complexity for no benefit.
- **shadcn/ui library** — Example uses full shadcn/ui (40+ Radix packages). We adapt visual styling without adding dependencies.
- **Dark/Light theme toggle** — Not requested. Keep current theme.
- **Backend changes** — Zero backend modifications. All changes are frontend UI only.
- **Zustand `persist` middleware** — Don't persist chat state to localStorage. Chat data should always be fresh from API.
- **Analytics page** — Already exists, not part of this migration.

---

## Mandatory Reading

**Implementation agent MUST read these files before starting any task:**

| Priority | File | Why Read This |
|----------|------|---------------|
| P0 | `examples/admin-chat-system/components/chat-room.tsx` | Chat room UI patterns to ADAPT |
| P0 | `examples/admin-chat-system/components/user-list-panel.tsx` | Conversation list design to MIRROR |
| P0 | `examples/admin-chat-system/components/user-profile-panel.tsx` | Customer panel design to MIRROR |
| P0 | `examples/admin-chat-system/components/notification-toast.tsx` | Toast system to ADAPT |
| P0 | `examples/admin-chat-system/app/globals.css` | CSS variables and animations |
| P0 | `examples/admin-chat-system/lib/mock-data.ts` | Data types and emoji/sticker lists |
| P1 | `frontend/app/admin/live-chat/_context/LiveChatContext.tsx` | ALL backend wiring — understand before migrating |
| P1 | `frontend/app/admin/live-chat/_hooks/useChatReducer.ts` | State shape to migrate to Zustand |
| P1 | `frontend/app/admin/live-chat/_types.ts` | Current data types |
| P1 | `frontend/hooks/useLiveChatSocket.ts` | WebSocket hook — will wire to Zustand |
| P1 | `frontend/hooks/useNotificationSound.ts` | Sound hook — reuse in toast |
| P2 | `frontend/app/globals.css` | Current CSS — uses Tailwind 4 `@theme` syntax |
| P2 | `frontend/components/admin/CannedResponsePicker.tsx` | Keep existing — restyle only |

---

## Safe Migration Strategy

### Why Incremental (Not Big-Bang)

From CodeX's plan: *"Keep data hooks untouched first; style-only commits before behavior changes."*

```
DANGEROUS (Open Code approach):
  Phase 0: Rewrite ALL state to Zustand → Phase 1: Restyle ALL components
  Risk: If Zustand breaks WebSocket, you can't test anything

SAFE (This plan's approach):
  Phase 1: Create Zustand store alongside Context (coexistence)
  Phase 2: CSS foundation (zero risk)
  Phase 3-7: Per-component: migrate state + restyle together
  Phase 8: Remove old Context/Reducer after all components migrated

  At every phase, the app WORKS. You can stop at any phase and ship.
```

### Coexistence Pattern

During migration, BOTH Context and Zustand exist:

```tsx
// LiveChatContext.tsx — BRIDGE PATTERN (temporary)
// 1. Context still provides API methods (sendMessage, claimSession, etc.)
// 2. Context writes state to BOTH dispatch AND Zustand store
// 3. Components gradually switch from useLiveChatContext() to useStore()
// 4. Once all components migrated, Context simplifies to API-only wrapper

export function LiveChatProvider({ children }) {
  const [state, dispatch] = useChatReducer();  // OLD — still works
  const store = useLiveChatStore;               // NEW — parallel writes

  // Bridge: sync Context state → Zustand store
  useEffect(() => {
    store.getState().setConversations(state.conversations);
  }, [state.conversations]);

  // ... API methods stay here (sendMessage, claimSession, etc.)
}
```

---

## Phased Implementation

### Phase 0: Baseline & Safety (from CodeX)

**Objective:** Capture current state before any changes

**Tasks:**
1. Install Zustand: `cd frontend && npm install zustand`
2. Verify build passes: `npm run build`
3. Take screenshots of current UI for visual regression comparison
4. Create feature branch if not already on one

**Exit criteria:**
- `npm run build` passes
- `npx tsc --noEmit` passes
- Zustand in package.json
- Screenshots captured

**Validate:**
```bash
cd frontend && npm install zustand && npx tsc --noEmit && npm run build
```

---

### Phase 1: Zustand Store Creation (Coexistence)

**Objective:** Create Zustand store that mirrors current state shape exactly. Context continues to work.

**New file:** `frontend/app/admin/live-chat/_store/liveChatStore.ts`

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Message } from '@/lib/websocket/types'
import type { Conversation, CurrentChat } from '../_types'

// ──────────────────────────────────────────────
// UI state for new features (not in current reducer)
// ──────────────────────────────────────────────
interface UIExtensions {
  showEmojiPicker: boolean
  showStickerPicker: boolean
  showQuickReplies: boolean
  inputExpanded: boolean
  notifications: ToastNotification[]
}

export interface ToastNotification {
  id: string
  title: string
  message: string
  avatar?: string
  type: 'message' | 'system'
  timestamp: number
}

// ──────────────────────────────────────────────
// Full store: mirrors ChatState + UI extensions
// ──────────────────────────────────────────────
interface LiveChatState {
  // Core data (mirrors useChatReducer exactly)
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

  // UI extensions (new features)
  showEmojiPicker: boolean
  showStickerPicker: boolean
  showQuickReplies: boolean
  inputExpanded: boolean
  notifications: ToastNotification[]
}

interface LiveChatActions {
  // Data actions
  setConversations: (conversations: Conversation[]) => void
  selectChat: (id: string | null) => void
  setCurrentChat: (chat: CurrentChat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  prependMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setBackendOnline: (online: boolean) => void
  setFilterStatus: (status: string | null) => void
  setSearchQuery: (query: string) => void
  setInputText: (text: string) => void
  setSending: (sending: boolean) => void
  setClaiming: (claiming: boolean) => void
  setShowCustomerPanel: (show: boolean) => void
  toggleCustomerPanel: () => void
  setActiveActionMenu: (id: string | null) => void
  setShowTransferDialog: (show: boolean) => void
  setShowCannedPicker: (show: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  addPending: (tempId: string) => void
  removePending: (tempId: string) => void
  setFailed: (tempId: string, error: string) => void
  clearFailed: (tempId: string) => void
  setHasMoreHistory: (hasMore: boolean) => void
  setIsLoadingHistory: (loading: boolean) => void

  // UI extension actions
  toggleEmojiPicker: () => void
  toggleStickerPicker: () => void
  toggleQuickReplies: () => void
  toggleInputExpanded: () => void
  closeAllPickers: () => void
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
}

type LiveChatStore = LiveChatState & LiveChatActions

const initialState: LiveChatState = {
  conversations: [],
  selectedId: null,
  currentChat: null,
  messages: [],
  loading: true,
  backendOnline: true,
  filterStatus: null,
  searchQuery: '',
  inputText: '',
  sending: false,
  claiming: false,
  showCustomerPanel: true,
  activeActionMenu: null,
  showTransferDialog: false,
  showCannedPicker: false,
  soundEnabled: true,
  pendingMessages: new Set(),
  failedMessages: new Map(),
  hasMoreHistory: true,
  isLoadingHistory: false,
  showEmojiPicker: false,
  showStickerPicker: false,
  showQuickReplies: false,
  inputExpanded: false,
  notifications: [],
}

export const useLiveChatStore = create<LiveChatStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Data actions (1:1 with reducer cases)
      setConversations: (conversations) => set({ conversations }),
      selectChat: (id) => set({ selectedId: id }),
      setCurrentChat: (chat) => set({ currentChat: chat }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
      prependMessages: (messages) => set((s) => ({ messages: [...messages, ...s.messages] })),
      setLoading: (loading) => set({ loading }),
      setBackendOnline: (online) => set({ backendOnline: online }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setInputText: (text) => set((s) => ({
        inputText: text,
        // Auto-trigger canned picker on "/" (preserves current behavior)
        showCannedPicker: text === '/' ? true : text.startsWith('/') ? s.showCannedPicker : false,
      })),
      setSending: (sending) => set({ sending }),
      setClaiming: (claiming) => set({ claiming }),
      setShowCustomerPanel: (show) => set({ showCustomerPanel: show }),
      toggleCustomerPanel: () => set((s) => ({ showCustomerPanel: !s.showCustomerPanel })),
      setActiveActionMenu: (id) => set({ activeActionMenu: id }),
      setShowTransferDialog: (show) => set({ showTransferDialog: show }),
      setShowCannedPicker: (show) => set({ showCannedPicker: show }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      addPending: (tempId) => set((s) => {
        const next = new Set(s.pendingMessages)
        next.add(tempId)
        return { pendingMessages: next }
      }),
      removePending: (tempId) => set((s) => {
        const next = new Set(s.pendingMessages)
        next.delete(tempId)
        return { pendingMessages: next }
      }),
      setFailed: (tempId, error) => set((s) => {
        const next = new Map(s.failedMessages)
        next.set(tempId, error)
        return { failedMessages: next }
      }),
      clearFailed: (tempId) => set((s) => {
        const next = new Map(s.failedMessages)
        next.delete(tempId)
        return { failedMessages: next }
      }),
      setHasMoreHistory: (hasMore) => set({ hasMoreHistory: hasMore }),
      setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),

      // UI extension actions
      toggleEmojiPicker: () => set((s) => ({
        showEmojiPicker: !s.showEmojiPicker,
        showStickerPicker: false,
        showQuickReplies: false,
      })),
      toggleStickerPicker: () => set((s) => ({
        showStickerPicker: !s.showStickerPicker,
        showEmojiPicker: false,
        showQuickReplies: false,
      })),
      toggleQuickReplies: () => set((s) => ({
        showQuickReplies: !s.showQuickReplies,
        showEmojiPicker: false,
        showStickerPicker: false,
      })),
      toggleInputExpanded: () => set((s) => ({ inputExpanded: !s.inputExpanded })),
      closeAllPickers: () => set({
        showEmojiPicker: false,
        showStickerPicker: false,
        showQuickReplies: false,
      }),
      addNotification: (notification) => set((s) => ({
        notifications: [...s.notifications, {
          ...notification,
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
        }],
      })),
      removeNotification: (id) => set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
      })),
    }),
    { name: 'LiveChatStore' }
  )
)
```

**Bridge in LiveChatContext.tsx:**

Add a bridge hook that syncs Context state to the Zustand store. This allows both systems to coexist:

```typescript
// Add to LiveChatContext.tsx — TEMPORARY BRIDGE
import { useLiveChatStore } from '../_store/liveChatStore'

// Inside LiveChatProvider, add sync effects:
useEffect(() => {
  useLiveChatStore.getState().setConversations(state.conversations)
}, [state.conversations])

useEffect(() => {
  useLiveChatStore.getState().setMessages(state.messages)
}, [state.messages])

useEffect(() => {
  useLiveChatStore.getState().setCurrentChat(state.currentChat)
}, [state.currentChat])

// ... sync other critical state slices
```

**Exit criteria:**
- Store file compiles: `npx tsc --noEmit`
- No runtime errors — app still works via Context
- Zustand DevTools shows state in browser

**Validate:**
```bash
cd frontend && npx tsc --noEmit
```

---

### Phase 2: CSS Foundation (Zero Risk)

**Objective:** Add design tokens and animations. No component changes.

**File:** `frontend/app/globals.css`

Add INSIDE existing `@theme { }` block:

```css
/* Live Chat Status Colors (from example admin-chat-system) */
--color-online: hsl(142 71% 45%);
--color-away: hsl(38 92% 50%);
--color-busy: hsl(0 84% 60%);
--color-offline: hsl(220 10% 46%);

/* Live Chat Sidebar (dark slate from example) */
--color-sidebar-bg: hsl(222 47% 11%);
--color-sidebar-fg: hsl(210 20% 98%);
--color-sidebar-muted: hsl(215 14% 34%);
--color-sidebar-accent: hsl(217 33% 17%);
--color-sidebar-border: hsl(215 28% 17%);
```

Add to `@layer utilities` block (after existing animations):

```css
/* Live Chat Animations (from example admin-chat-system) */
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes blink-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes toast-slide {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

/* Chat message animations */
.msg-in { animation: slide-in-left 0.3s ease-out; }
.msg-out { animation: slide-in-right 0.3s ease-out; }

/* Typing dots */
.typing-dot {
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Badge blink */
.blink-badge { animation: blink-badge 1s ease-in-out infinite; }

/* Toast slide-in */
.toast-slide { animation: toast-slide 0.4s ease-out; }

/* Custom scrollbar for chat */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(218 11% 65% / 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(218 11% 65% / 0.5);
}
```

**GOTCHA:** `@keyframes slide-in-right` already exists in current globals.css (line 488). Don't duplicate — only add `slide-in-left`, `typing-bounce`, `blink-badge`, `pulse-ring`, `toast-slide`. Reuse existing `scale-in` (line 477).

**Exit criteria:**
- `npm run build` passes
- No visual changes (animations not yet used by components)

**Validate:**
```bash
cd frontend && npm run build
```

---

### Phase 3: Create New UI Components (No Existing Code Changed)

**Objective:** Create new components that will be used later. Zero risk — nothing references them yet.

#### 3.1 EmojiPicker

**New file:** `frontend/app/admin/live-chat/_components/EmojiPicker.tsx`

```tsx
'use client'

const emojiList = [
  "😀","😂","😍","🥰","😎","🤔","👍","👎","❤️","🔥",
  "🎉","✨","💯","🙏","👏","🤝","💪","😊","😢","😮",
  "🚀","⭐","💡","📌","✅","❌","⏰","📎","🎯","💬",
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="animate-scale-in mx-3 mt-2 grid max-h-36 grid-cols-10 gap-1 overflow-y-auto rounded-lg border border-border-default bg-surface p-2">
      {emojiList.map((emoji, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
```

#### 3.2 StickerPicker

**New file:** `frontend/app/admin/live-chat/_components/StickerPicker.tsx`

```tsx
'use client'

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
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  return (
    <div className="animate-scale-in mx-3 mt-2 grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border-default bg-surface p-3">
      {stickers.map((sticker, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(sticker)}
          className="flex items-center justify-center rounded-lg p-2 transition-all hover:scale-110 hover:bg-gray-100"
        >
          <img src={sticker} alt="Sticker" className="h-12 w-12" loading="lazy" />
        </button>
      ))}
    </div>
  )
}
```

#### 3.3 QuickReplies

**New file:** `frontend/app/admin/live-chat/_components/QuickReplies.tsx`

```tsx
'use client'

const quickReplies = [
  { id: 1, label: "สวัสดี", message: "สวัสดีค่ะ/ครับ ยินดีให้บริการค่ะ" },
  { id: 2, label: "รอสักครู่", message: "กรุณารอสักครู่นะคะ/ครับ" },
  { id: 3, label: "ขอบคุณ", message: "ขอบคุณค่ะ/ครับ" },
  { id: 4, label: "โอนสาย", message: "ขออนุญาตโอนสายไปยังเจ้าหน้าที่ที่เกี่ยวข้องนะคะ/ครับ" },
  { id: 5, label: "แก้ไขแล้ว", message: "ปัญหาได้รับการแก้ไขแล้วค่ะ/ครับ" },
  { id: 6, label: "ติดตาม", message: "จะติดตามเรื่องนี้ให้นะคะ/ครับ" },
]

interface QuickRepliesProps {
  onSelect: (message: string) => void
}

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <div className="animate-scale-in flex gap-2 overflow-x-auto border-t border-border-default px-3 py-2 no-scrollbar">
      {quickReplies.map((reply) => (
        <button
          key={reply.id}
          type="button"
          onClick={() => onSelect(reply.message)}
          className="shrink-0 rounded-full border border-border-default bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-500 hover:text-brand-600"
        >
          {reply.label}
        </button>
      ))}
    </div>
  )
}
```

#### 3.4 NotificationToast

**New file:** `frontend/app/admin/live-chat/_components/NotificationToast.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { X, MessageSquare, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLiveChatStore } from '../_store/liveChatStore'

export function NotificationToast() {
  const notifications = useLiveChatStore((s) => s.notifications)
  const removeNotification = useLiveChatStore((s) => s.removeNotification)

  // Auto-dismiss oldest after 5s
  useEffect(() => {
    if (notifications.length === 0) return
    const timer = setTimeout(() => {
      removeNotification(notifications[0].id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notifications, removeNotification])

  if (notifications.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-[var(--z-toast)] flex flex-col gap-2" aria-live="polite">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className="toast-slide relative flex w-80 items-start gap-3 rounded-xl border border-border-default bg-surface p-4 shadow-xl"
        >
          {toast.avatar ? (
            <img src={toast.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />
          ) : (
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              toast.type === 'system' ? "bg-warning/15 text-warning" : "bg-brand-500/15 text-brand-500"
            )}>
              {toast.type === 'system' ? <Bell className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
              <button onClick={() => removeNotification(toast.id)} className="shrink-0 rounded-md p-0.5 text-text-tertiary hover:text-text-primary">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Exit criteria:**
- All 4 files compile: `npx tsc --noEmit`
- No component is imported anywhere yet — zero risk

**Validate:**
```bash
cd frontend && npx tsc --noEmit
```

---

### Phase 4: Migrate LiveChatContext to Zustand (Core)

**Objective:** Replace dispatch calls with Zustand store calls. This is the critical phase.

**SAFETY RULE:** Keep `useLiveChatContext()` export working throughout. Components that haven't been migrated yet still use it.

**Strategy:** Rewrite `LiveChatContext.tsx` to use Zustand store internally but still expose the same `LiveChatContextValue` interface.

**File:** `frontend/app/admin/live-chat/_context/LiveChatContext.tsx`

Key changes:
1. Remove `useChatReducer()` import — use `useLiveChatStore` directly
2. All `dispatch({ type: 'X', payload: y })` becomes `store.setX(y)`
3. Context value reads from Zustand: `state: useLiveChatStore.getState()`
4. All callback functions call store actions instead of dispatch
5. WebSocket handlers call store actions
6. **Keep the Provider wrapper** — it still initializes WebSocket, auth, and side effects

**What NOT to change:**
- API fetch logic (fetchConversations, fetchChatDetail, etc.)
- WebSocket setup and event routing
- useAuth() integration
- useNotificationSound() integration
- useSearchParams() for deep linking
- Mobile viewport detection

**Gotchas:**
- `pendingMessages` is a `Set` and `failedMessages` is a `Map` — Zustand handles these fine but DevTools won't serialize them. Accept this limitation.
- The `/` canned picker trigger in `setInputText` must be preserved (line 107-111 of current Context)
- `selectedIdRef` and `messagesRef` patterns are still needed for closure-safety in WebSocket handlers

**Exit criteria:**
- All existing functionality works identically
- `npm run build` passes
- WebSocket connects and receives messages
- Send message works (WS and REST fallback)
- Claim/Close/Transfer session works
- Sound notification works

**Validate:**
```bash
cd frontend && npx tsc --noEmit && npm run build
```

---

### Phase 5: Component Migration — Conversation List + Item

**Objective:** Restyle ConversationList and ConversationItem, switching from `useLiveChatContext()` to `useLiveChatStore()`.

#### 5.1 ConversationList.tsx

**State migration:**
```tsx
// BEFORE
const { state, setSearchQuery, setFilterStatus, selectConversation } = useLiveChatContext()

// AFTER
const conversations = useLiveChatStore((s) => s.conversations)
const selectedId = useLiveChatStore((s) => s.selectedId)
const filterStatus = useLiveChatStore((s) => s.filterStatus)
const searchQuery = useLiveChatStore((s) => s.searchQuery)
const setSearchQuery = useLiveChatStore((s) => s.setSearchQuery)
const setFilterStatus = useLiveChatStore((s) => s.setFilterStatus)
// NOTE: selectConversation still needs API calls — keep from Context for now
```

**Visual changes (from example `user-list-panel.tsx`):**
- Header: "Conversations" title + online count + mode counter + filter button
- Search: Rounded-lg, border, focus ring
- Status filter pills: All / Online / Away / Busy / Offline (map to session statuses)
- Summary bar at bottom with colored dots and counts
- Keep existing keyboard navigation logic
- Use `custom-scrollbar` class on scroll container

#### 5.2 ConversationItem.tsx

**Visual changes (from example UserCard):**
- Avatar `w-10 h-10 rounded-full` with status dot (`-bottom-0.5 -right-0.5 h-3 w-3`)
- Status dot colors: `bg-online` (ACTIVE), `bg-away` (WAITING), `bg-offline` (no session)
- Name row: Name + VIP star (if tagged "VIP") + NEW badge
- Message preview with typing indicator dots when typing
- Right column: Time ago + unread badge (`blink-badge`) + Bot/Manual mode indicator
- Action menu: Three-dot on hover (`opacity-0 group-hover:opacity-100`)
- Selected state: `bg-brand-500/10 ring-1 ring-brand-500/20`
- Keep existing `React.memo` optimization

**MIRROR:** `examples/admin-chat-system/components/user-list-panel.tsx:56-181`

**Validate:**
```bash
cd frontend && npx tsc --noEmit && npm run build
```

---

### Phase 6: Component Migration — Chat Area + Messages

#### 6.1 ChatHeader.tsx

**State migration:** Switch to `useLiveChatStore()` selectors.

**Visual changes (from example `chat-room.tsx:251-348`):**
- Height: `h-14` → `h-16`
- Left: Avatar with status dot + name + mode label
- Bot/Manual toggle: Inline pill button with icon circle (colored accent for bot, primary for manual)
- VIP badge if conversation has VIP tag
- Right: Profile toggle button + More options dropdown
- Session actions: Keep Claim/Transfer/Done from SessionActions, restyle buttons

#### 6.2 MessageBubble.tsx

**State migration:** Switch to `useLiveChatStore()` selectors.

**Visual changes (from example `chat-room.tsx:54-146`):**
- Animation: `msg-in` for incoming, `msg-out` for outgoing
- Bubble: `rounded-2xl px-4 py-2.5 text-sm leading-relaxed`
  - Incoming: `rounded-tl-sm bg-gray-100 text-text-primary`
  - Outgoing: `rounded-tr-sm bg-brand-600 text-white`
- Avatar: Show for incoming (h-7 w-7 rounded-full)
- Sender label: `text-[10px] text-text-tertiary` above bubble
- Read receipts: `Check` (sent) / `CheckCheck` (read) from lucide — visual-only based on `direction === 'OUTGOING'`
- Timestamp: `text-[10px] text-text-tertiary`
- Image: `max-h-48 rounded-lg object-cover`
- File: File icon + name in `bg-gray-100 p-3 rounded-lg`
- Max width: `max-w-[65%]`
- Keep: memo, pending/failed states, retry button

#### 6.3 ChatArea.tsx

**State migration:** Switch to `useLiveChatStore()` selectors.

**Visual changes:**
- Empty state: Welcome icon in rounded-2xl bg, title, subtitle
- Date separator: Horizontal lines with date text centered
- Background: `bg-bg`
- Add `custom-scrollbar` class
- Connection status: Colored pill badge
- Keep: ALL virtual scrolling, IntersectionObserver, history loading, viewport resize

#### 6.4 MessageInput.tsx

**State migration:** Switch to `useLiveChatStore()` selectors and new actions.

**Visual changes (from example `chat-room.tsx:390-512`):**
- Layout: Two-row footer — toolbar on top, textarea + send on bottom
- Toolbar: Emoji, Sticker, Image, File, Quick Replies, Expand toggle buttons
- Textarea: Replace `<input>` with `<textarea>` — auto-resize, expandable mode
- Emoji picker: Toggle `EmojiPicker`, append to input
- Sticker picker: Toggle `StickerPicker`, send as message
- Quick replies: Toggle `QuickReplies`, fill textarea
- Send button: Rounded-xl, brand gradient when active
- Keep: CannedResponsePicker, file upload, disabled states, onTyping

**Validate:**
```bash
cd frontend && npx tsc --noEmit && npm run build
```

---

### Phase 7: Component Migration — Customer Panel + Shell

#### 7.1 CustomerPanel.tsx

**State migration:** Switch to `useLiveChatStore()` selectors.

**Visual changes (from example `user-profile-panel.tsx:80-235`):**
- Width: `w-64` → `w-72`
- Header: "User Profile" title + close button
- Avatar: `w-20 h-20 rounded-full ring-4 ring-surface` + status dot
- Tags: Display conversation tags
- Stats cards: 3-column grid (Chats, Rating, Joined) — show "N/A" for unavailable data
- Contact info: Email, Phone, Location with copy buttons — show "N/A"
- Activity: Joined date, Last Active, Assigned Agent
- Internal notes: Textarea placeholder (visual only, no backend)
- Keep: Export CSV/PDF, refresh profile, delete button

#### 7.2 LiveChatShell.tsx

**State migration:** Switch to `useLiveChatStore()` selectors.

**Changes:**
- Add `NotificationToast` component
- Layout: `ConversationList | ChatArea | CustomerPanel` (no AdminSidebar)
- Keep: Connection-lost banner, mobile responsive, TransferDialog

#### 7.3 Wire Toast Notifications

In LiveChatContext (or the store initialization), fire toasts on:
- New incoming message (when not in the same conversation)
- Session claimed/transferred events
- Connection state changes

```tsx
// In handleNewMessage callback
if (message.direction === 'INCOMING' && message.line_user_id !== selectedIdRef.current) {
  useLiveChatStore.getState().addNotification({
    title: message.operator_name || 'New Message',
    message: message.content?.substring(0, 100) || 'New message received',
    avatar: undefined,
    type: 'message',
  })
}
```

**Validate:**
```bash
cd frontend && npx tsc --noEmit && npm run build
```

---

### Phase 8: Cleanup & Final Migration

**Objective:** Remove old code, verify everything works via Zustand only.

#### 8.1 Remove Old Files

- **DELETE** `frontend/app/admin/live-chat/_hooks/useChatReducer.ts` — replaced by Zustand store
- **SIMPLIFY** `LiveChatContext.tsx`:
  - Remove `useChatReducer` import
  - Context becomes thin wrapper: only provides API methods that need auth/WebSocket
  - Components read state from `useLiveChatStore()` directly
  - Context provides: `sendMessage`, `sendMedia`, `claimSession`, `closeSession`, `transferSession`, `toggleMode`, `loadOlderMessages`, `reconnect`, `retryMessage`, `startTyping`, `formatTime`, `wsStatus`, `isMobileView`

#### 8.2 Verify All Functionality

Run through complete checklist:

**Functional:**
- [ ] WebSocket connects and authenticates
- [ ] Selecting conversation loads messages
- [ ] Sending message via WebSocket works
- [ ] Sending message via REST fallback works
- [ ] Claim/Close/Transfer session works
- [ ] Bot/Manual mode toggle works
- [ ] Canned responses picker works
- [ ] File upload works
- [ ] Sound notification toggle works
- [ ] Older message loading (infinite scroll) works
- [ ] Message search works
- [ ] Keyboard navigation in conversation list works
- [ ] Emoji picker appends emoji to input
- [ ] Sticker picker sends sticker
- [ ] Quick replies fill textarea
- [ ] Toast notifications appear and auto-dismiss
- [ ] Deep link `?chat=Uxxxx` works

**Visual:**
- [ ] Status dots: green (ACTIVE), orange (WAITING), gray (no session)
- [ ] Message slide-in animations
- [ ] Typing dot animation
- [ ] Unread badge blink animation
- [ ] Toast slide-in animation
- [ ] Mobile responsive (conversation list / chat toggle)

**Edge Cases:**
- [ ] Empty conversation list
- [ ] No selected conversation (welcome screen)
- [ ] Very long display names (truncation)
- [ ] Very long messages (word wrap)
- [ ] Image messages render correctly
- [ ] Pending/failed message states
- [ ] Connection lost/reconnecting states
- [ ] Mobile viewport (<768px)

**Validate:**
```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

---

## Files to Change — Complete Summary

### New Files (5)

| File | Purpose |
|------|---------|
| `_store/liveChatStore.ts` | Zustand store (replaces useChatReducer) |
| `_components/EmojiPicker.tsx` | Emoji grid picker |
| `_components/StickerPicker.tsx` | Sticker grid picker |
| `_components/QuickReplies.tsx` | Quick reply pills |
| `_components/NotificationToast.tsx` | Toast notification system |

### Updated Files (10)

| File | Scope |
|------|-------|
| `globals.css` | Add CSS variables + animations |
| `_context/LiveChatContext.tsx` | Migrate from dispatch to Zustand, simplify to API wrapper |
| `_components/LiveChatShell.tsx` | Add NotificationToast, switch to Zustand |
| `_components/ConversationList.tsx` | Restyle + switch to Zustand |
| `_components/ConversationItem.tsx` | Restyle (status dots, badges, mode) |
| `_components/ChatArea.tsx` | Restyle + switch to Zustand |
| `_components/ChatHeader.tsx` | Restyle (toggle pill, actions) + switch to Zustand |
| `_components/MessageBubble.tsx` | Restyle (animations, receipts) |
| `_components/MessageInput.tsx` | Restyle (toolbar, pickers) + switch to Zustand |
| `_components/CustomerPanel.tsx` | Full redesign + switch to Zustand |

### Deleted Files (1)

| File | Reason |
|------|--------|
| `_hooks/useChatReducer.ts` | Replaced by Zustand store (Phase 8) |

---

## Delivery Sequence (One PR Per Phase)

| PR | Phase | Risk | Description |
|----|-------|------|-------------|
| PR 1 | Phase 0 + 1 | LOW | Install Zustand, create store, add bridge |
| PR 2 | Phase 2 + 3 | ZERO | CSS variables, animations, new components (unused) |
| PR 3 | Phase 4 | MEDIUM | Core Context → Zustand migration |
| PR 4 | Phase 5 | LOW | Conversation list/item restyle |
| PR 5 | Phase 6 | MEDIUM | Chat area, messages, input restyle |
| PR 6 | Phase 7 | LOW | Customer panel, shell, toast wiring |
| PR 7 | Phase 8 | LOW | Cleanup old files, final verification |

Each PR is independently shippable. If any PR causes issues, revert only that PR.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebSocket breaks during Zustand migration | MED | HIGH | Phase 4 changes only Context internals. WebSocket hook is NOT modified — it receives the same callback signatures. |
| CSS conflicts with existing theme | LOW | MED | New vars use `--color-online/away/busy/offline` prefix — no collision with existing `--color-status-*` vars. |
| Component restyle breaks data flow | MED | MED | Each component migration changes state access + visuals together. Verify after each component. |
| Mobile layout breaks | MED | MED | Keep existing mobile responsive logic in LiveChatShell. Test at 768px breakpoint. |
| Tailwind 3 → 4 class mismatch | MED | LOW | Example uses `bg-primary`. Our project uses `bg-brand-500`. Map colors during implementation. |
| Performance regression from animations | LOW | LOW | CSS animations are GPU-accelerated. Keep existing memo/virtual-scroll. |
| Zustand DevTools can't serialize Set/Map | LOW | LOW | `pendingMessages` (Set) and `failedMessages` (Map) won't show in DevTools. Accept this — these are debug-only concerns. |

---

## Patterns Reference

### Tailwind Class Mapping (Example → Project)

| Example (Tailwind 3) | Project (Tailwind 4) |
|----------------------|---------------------|
| `bg-primary` | `bg-brand-600` |
| `text-primary-foreground` | `text-white` |
| `bg-muted` | `bg-gray-100` |
| `text-muted-foreground` | `text-text-tertiary` |
| `bg-card` | `bg-surface` |
| `bg-background` | `bg-bg` |
| `text-foreground` | `text-text-primary` |
| `border-border` | `border-border-default` |
| `bg-popover` | `bg-surface` |
| `bg-destructive` | `bg-danger` |
| `bg-accent` | `bg-info` |
| `bg-sidebar` | `bg-sidebar-bg` |
| `text-sidebar-foreground` | `text-sidebar-fg` |
| `hsl(var(--online))` | `bg-online` (via `@theme`) |

### Zustand Selector Pattern

```tsx
// GOOD — selective re-render (only when messages change)
const messages = useLiveChatStore((s) => s.messages)
const addMessage = useLiveChatStore((s) => s.addMessage)

// BAD — re-renders on ANY state change
const store = useLiveChatStore()
```

### Component Structure Pattern

```tsx
'use client'

import { useLiveChatStore } from '../_store/liveChatStore'
import { useLiveChatContext } from '../_context/LiveChatContext'

export function ComponentName() {
  // Read STATE from Zustand (selective re-render)
  const data = useLiveChatStore((s) => s.data)

  // Read API METHODS from Context (sendMessage, claimSession, etc.)
  const { sendMessage } = useLiveChatContext()

  return (/* ... */)
}
```

---

## Validation Commands

### Per-Task Validation
```bash
cd frontend && npx tsc --noEmit
```

### Per-Phase Validation
```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

### Final Validation
```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
# Then: npm run dev → open http://localhost:3000/admin/live-chat
# Manual test: all checklist items in Phase 8
```

---

## Acceptance Criteria

- [ ] Zustand store replaces useChatReducer for all state management
- [ ] LiveChatContext simplified to API/WebSocket wrapper only
- [ ] Conversation cards show avatar with status dot, VIP indicator, Bot/Manual badge
- [ ] Message bubbles have slide-in animations and read receipt indicators
- [ ] Emoji picker and sticker picker functional
- [ ] Quick replies bar fills textarea on click
- [ ] Customer panel shows stats cards, contact info sections, internal notes
- [ ] Toast notifications appear for incoming messages
- [ ] ALL existing WebSocket + REST API functionality preserved
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

---

## Notes

### What Was Taken From Each Agent

| Agent | Contributions to This Plan |
|-------|---------------------------|
| **Cline** | Feature gap analysis table format, component mapping structure |
| **CodeX** | Phase 0 baseline concept, PR-per-phase delivery, redirect safety, risk mitigation approach, "keep data hooks untouched first" principle |
| **Kimi Code** | Zustand store design structure, component renaming rationale (informed our decision NOT to rename), comprehensive WebSocket event list |
| **Open Code** | Full Zustand store implementation (adapted), component code snippets (MessageBubble, ConversationItem, CustomerPanel, NotificationToast, EmojiPicker, StickerPicker), CSS animation definitions |
| **Kilo Code** | Gap analysis table, ReadStatus concept (simplified to inline Check/CheckCheck) |
| **Claude Code** | Mandatory reading list, explicit "NOT Building" scope limits, Tailwind 3→4 mapping table, per-task validation commands, atomic task structure, incremental Zustand migration strategy, coexistence bridge pattern |

### Key Difference from Individual Plans

1. **No Big-Bang Zustand rewrite** — Context and Zustand coexist during migration
2. **No route change** — Stays at `/admin/live-chat`
3. **No AdminSidebar** — Contradicts standalone design
4. **No VideoCallModal** — No backend support
5. **No shadcn/ui dependency** — Adapt visuals without 40+ packages
6. **Components read from Zustand, API calls come from Context** — Clean separation during and after migration
