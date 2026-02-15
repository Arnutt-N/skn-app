# Live Chat Pattern Appendix

Updated: 2026-02-15  
Applies to: `frontend/app/admin/live-chat/*`

## 1. Message Bubble Standard

- Outgoing bubble: `rounded-tr-sm bg-brand-600 text-white`
- Incoming user bubble: `rounded-tl-sm bg-gray-100 text-text-primary`
- Bot bubble: `rounded-tr-sm bg-gray-200 text-text-primary`
- Base bubble shape: `rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm`
- Motion: incoming `msg-in`, outgoing `msg-out`

Reference: `frontend/app/admin/live-chat/_components/MessageBubble.tsx`

## 2. Timestamp + Read Receipt

- Timestamp style: `text-[10px] text-text-tertiary`
- Pending state: spinner icon (`RefreshCw`, `animate-spin`)
- Failed state: retry action with `AlertCircle`
- Delivered/read state: icon pair `Check` / `CheckCheck`

Reference: `frontend/app/admin/live-chat/_components/MessageBubble.tsx`

## 3. Status Dot Standard

- Dot size: `h-3 w-3` (single standard)
- Position: `absolute -bottom-0.5 -right-0.5`
- Ring: `border-2` with surface-matched border (`border-surface` or sidebar equivalent)
- State colors:
  - online/active: `bg-online`
  - waiting/away: `bg-away`
  - offline/closed: `bg-offline`

References:
- `frontend/app/admin/live-chat/_components/ConversationItem.tsx`
- `frontend/app/admin/live-chat/_components/CustomerPanel.tsx`
- `frontend/app/admin/live-chat/_components/ConversationList.tsx`

## 4. Notification Toast Standard

- Container live region: `aria-live="polite"`
- Animation: `toast-slide` (not fade-only)
- Surface: `rounded-xl border border-border-default bg-surface shadow-xl`
- Auto-dismiss: 5 seconds
- Sound + vibration:
  - Web Audio beep
  - `navigator.vibrate(200)` when supported

References:
- `frontend/app/admin/live-chat/_components/NotificationToast.tsx`
- `frontend/hooks/useNotificationSound.ts`

## 5. Picker Interaction Rules

- Only one picker open at a time (emoji, sticker, canned response).
- Picker opens above message input and uses scale-in entrance.
- Escape closes picker.
- Selection inserts content and returns focus to input.

References:
- `frontend/app/admin/live-chat/_components/EmojiPicker.tsx`
- `frontend/app/admin/live-chat/_components/StickerPicker.tsx`
- `frontend/components/admin/CannedResponsePicker.tsx`

## 6. Review Checklist

- All status dots are `h-3 w-3`.
- Bubble corners follow incoming/outgoing direction.
- Read receipt icons render for outgoing messages.
- Toast uses `toast-slide` and remains dismissible.
- Notification vibration is guarded and does not throw in unsupported environments.
