# Design System Compliance Checklist (Unified)

Standard references:
- `frontend/docs/design-system-unified.md`
- `frontend/app/globals.css`

Last updated: 2026-02-14

## Pages reviewed

### `/admin` (`frontend/app/admin/page.tsx`)
- [x] Uses unified Thai readability baseline (`thai-text`)
- [x] Header container aligned to shared panel style (`ds-panel`, `ds-panel-body`)
- [x] Title marked with `thai-no-break`
- [ ] Full component/token audit for all nested dashboard widgets

### `/admin` shell sidebar (`frontend/app/admin/layout.tsx`)
- [x] Active menu background uses full-row width (not text-content width)
- [x] Hover state uses full-row width consistently across all menu labels
- [x] Tooltip is applied only in collapsed mode to avoid expanded-layout width shrink
- [x] Sidebar scroll area uses `scrollbar-sidebar` (dark minimal style, no arrow buttons)

### `/admin/requests` (`frontend/app/admin/requests/page.tsx`)
- [x] Root wrapper uses `thai-text`
- [x] Header title/subtitle use `thai-no-break`
- [x] Removed forced uppercase in table header row styles
- [x] Removed forced uppercase in subcategory and assign label
- [x] Migrated filter/search controls to shared `Input`/`Select` primitives

### `/admin/live-chat` (`frontend/app/admin/live-chat/page.tsx`)
- [x] Loading state wrapper uses `thai-text`
- [x] Loading label uses `thai-no-break`
- [x] Applied Thai readability and uppercase policy updates in shell internals:
  - `ConversationList`
  - `ChatArea`
  - `CustomerPanel`
- [x] Continued normalization in:
  - `MessageInput`
  - `ConversationItem`
- [x] Continued normalization in:
  - `SessionActions`
  - `TransferDialog`
  - `TypingIndicator`
- [x] Additional polish completed:
  - `LiveChatShell` connection banner focus/readability
  - `ChatHeader` focus/readability
  - `ConversationList` search/filter focus/readability
  - `TransferDialog` input focus normalization
- [ ] Continue with shared pattern extraction and cross-page token consistency cleanup

## Global primitives
- [x] Badge no longer forces uppercase (`frontend/components/ui/Badge.tsx`)
- [x] Thai utility classes available (`.thai-text`, `.thai-no-break`)
- [x] Z-index token scale defined in globals
- [x] Base body typography aligned to Thai readability baseline
- [x] Scrollbar utility standards defined in globals:
  - `scrollbar-sidebar`, `dark-scrollbar`, `chat-scrollbar`, `scrollbar-thin`, `no-scrollbar`
- [x] Global scrollbar arrow buttons removed in base layer (`::-webkit-scrollbar-button` and related variants)

## Next enforcement targets
1. Live chat shell internals (`frontend/app/admin/live-chat/_components/*`)
2. Requests filters refactor to shared form primitives
3. Tables and search/filter reusable pattern extraction into `components/admin` or `components/ui`

## Reuse Progress
- [x] Extracted reusable search/filter block: `frontend/components/admin/AdminSearchFilterBar.tsx`
- [x] Adopted in requests page: `frontend/app/admin/requests/page.tsx`
- [x] Adopted in friends page: `frontend/app/admin/friends/page.tsx`
- [ ] Adopt the same component/pattern in additional admin list pages
- [x] Extracted reusable table head: `frontend/components/admin/AdminTableHead.tsx`
- [x] Adopted table head in friends page: `frontend/app/admin/friends/page.tsx`
- [x] Adopted table head in auto-replies page: `frontend/app/admin/auto-replies/page.tsx`
- [x] Adopted table head in rich-menus page: `frontend/app/admin/rich-menus/page.tsx`
- [x] Adopted table head in requests page: `frontend/app/admin/requests/page.tsx`

## Additional Page Alignment
- [x] `frontend/app/admin/rich-menus/page.tsx`
  - Added Thai readability wrappers (`thai-text`, `thai-no-break`)
  - Removed forced uppercase style usage in key UI labels
  - Added `focus-ring` to primary action controls
- [x] `frontend/app/admin/auto-replies/page.tsx`
  - Added Thai readability wrappers (`thai-text`, `thai-no-break`)
  - Removed forced uppercase usage in table header styles
  - Added `focus-ring` to form and row action controls
- [x] Scrollbar alignment updates
  - `frontend/app/admin/live-chat/analytics/page.tsx` uses `scrollbar-thin`
  - `frontend/components/admin/CannedResponsePicker.tsx` uses `scrollbar-thin`
  - `frontend/app/admin/rich-menus/new/page.tsx` uses `scrollbar-thin`
