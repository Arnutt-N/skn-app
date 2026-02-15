# Design System Parity Matrix

Updated: 2026-02-15  
Source baseline: `research/common/ui-design-system-comparison-merged.md`

## 1. Component Parity

| Example Primitive / Pattern | Current JSK Path | Status | Notes |
|---|---|---|---|
| Button | `frontend/components/ui/Button.tsx` | Adopted (existing) | Keep current 9-variant implementation |
| Card | `frontend/components/ui/Card.tsx` | Adopted (existing) | Keep current 6-variant implementation |
| Badge | `frontend/components/ui/Badge.tsx` | Adopted (existing) | Keep current 7-variant implementation |
| Toast | `frontend/components/ui/Toast.tsx` | Adopted (existing) | Custom Zustand architecture retained |
| Dialog / AlertDialog | `frontend/components/ui/Modal.tsx`, `frontend/components/ui/ModalAlert.tsx` | Adopted (equivalent) | Keep current API |
| Table | `frontend/components/ui/Table.tsx` | Adopted (new) | Wave migration add |
| Pagination | `frontend/components/ui/Pagination.tsx` | Adopted (new) | Wave migration add |
| Textarea | `frontend/components/ui/Textarea.tsx` | Adopted (new) | Wave migration add |
| Popover | `frontend/components/ui/Popover.tsx` | Adopted (new) | Wave migration add |
| Form (RHF helpers) | `frontend/components/ui/Form.tsx` | Adopted (new) | Wave migration add |
| Accordion | `frontend/components/ui/Accordion.tsx` | Adopted (new) | Wave migration add |
| Calendar | `frontend/components/ui/Calendar.tsx` | Adopted (new) | Wave migration add |
| Sheet | `frontend/components/ui/Sheet.tsx` | Adopted (new) | Wave migration add |
| Chart wrappers | `frontend/components/ui/Chart.tsx` | Adopted (new) | Wave migration add |
| Command palette | `frontend/components/ui/Command.tsx` | Adopted (new) | Wave migration add |
| Sidebar pattern | `frontend/app/admin/layout.tsx` | Adopted (custom) | Inline architecture retained |

## 2. Token Parity

| Example Token Family | JSK Token | Status |
|---|---|---|
| `primary` / `primary-foreground` | `brand-500` / `white` | Adopted (mapped) |
| `muted` / `muted-foreground` | `gray-100` / `text-text-secondary` | Adopted (mapped) |
| `popover` / `popover-foreground` | `surface` / `text-text-primary` | Adopted (mapped) |
| `input` | `border-border-default` | Adopted (mapped) |
| `ring` | `brand-500` | Adopted (mapped) |
| `chart-1..5` | `--chart-1..5`, `--color-chart-1..5` | Adopted (new) |
| `accent` | `--color-accent` family | Adopted (new) |
| `sidebar-primary-fg` | `--sidebar-primary-fg`, `--color-sidebar-primary-fg` | Adopted (new) |

## 3. Live Chat Pattern Parity

| Example Pattern | JSK Path | Status | Notes |
|---|---|---|---|
| Bubble corner-cut | `frontend/app/admin/live-chat/_components/MessageBubble.tsx` | Adopted | Directional corner cut retained |
| Read receipts (`Check` / `CheckCheck`) | `frontend/app/admin/live-chat/_components/MessageBubble.tsx` | Adopted | Icon-based |
| Toast slide animation | `frontend/app/admin/live-chat/_components/NotificationToast.tsx` | Adopted | `toast-slide` |
| Notification vibration | `frontend/hooks/useNotificationSound.ts` | Adopted | `navigator.vibrate(200)` guarded |
| Status dot ring/position | `frontend/app/admin/live-chat/_components/ConversationItem.tsx`, `frontend/app/admin/live-chat/_components/CustomerPanel.tsx` | Adopted | Absolute + border ring |
| Dot size consistency (`h-3 w-3`) | `frontend/app/admin/live-chat/_components/ConversationList.tsx`, `frontend/app/admin/live-chat/_components/CustomerPanel.tsx` | Adopted | Standardized |

## 4. Deferred / Out-of-Scope

| Item | Status | Rationale |
|---|---|---|
| Full shadcn generator workflow | Deferred | Current custom CVA system is richer and already integrated |
| Tailwind v3 plugin conventions (`tailwindcss-animate`) | Out-of-scope | Project runs Tailwind v4 CSS-first model |
| Replacing existing `Button` / `Card` / `Badge` | Out-of-scope | Higher current feature richness |
| Backend/WebSocket protocol migration | Out-of-scope | UI-only migration boundary |
