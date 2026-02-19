# UI Design System Comparison

**Example Reference** (`examples/admin-chat-system/docs/ui-design-system.md`)
vs **Current Implementation** (`frontend/`)

Date: 2026-02-15

---

## Executive Summary

The example design system is a comprehensive 64-section component library reference built on **shadcn/ui + Radix UI** primitives. Our current implementation uses a **custom component library** with `class-variance-authority` (CVA) variants instead of shadcn/ui. Both target the same stack (Next.js 16, React 19, Tailwind 4, Lucide icons, Zustand), but differ significantly in component coverage and architecture.

### Key Differences at a Glance

| Aspect | Example (Reference) | Current (SKN-App) |
|--------|--------------------|--------------------|
| Component architecture | shadcn/ui + Radix primitives | Custom CVA components |
| UI components count | 35+ shadcn components | 22 base + 9 admin + 15 live-chat |
| Color system | HSL tokens (simpler, flat) | HSL tokens (semantic layers + chat-specific) |
| Typography | Noto Sans Thai, simple scale | Noto Sans Thai, fluid `clamp()` scale |
| Dark mode | Not documented | Full dark mode with `.dark` overrides |
| Thai language support | Not addressed | Dedicated `.thai-text`, `.thai-no-break` utilities |
| Accessibility | Basic | WCAG AA colors, reduced motion, skip links |
| Animations | 10 named keyframes | 18 keyframes + delay/interactive utilities |
| Scrollbar system | Single `custom-scrollbar` class | 5 context-specific scrollbar utilities |

---

## 1. Design Tokens

### Colors

| Token Category | Example | Current | Gap? |
|----------------|---------|---------|------|
| Primary (brand) | `--primary: 217 91% 60%` (blue) | `--color-brand-50..900` (purple, 10 shades) | Current is richer |
| Secondary | `--secondary: 220 14% 92%` | Via `--color-gray-*` scale | Equivalent |
| Accent | `--accent: 162 72% 45%` (teal) | No direct accent token | **GAP**: No accent color |
| Destructive | `--destructive: 0 84% 60%` | `--color-danger` + light/dark/text | Current is richer |
| Muted | `--muted`, `--muted-foreground` | `--color-text-secondary/tertiary` | Equivalent |
| Status: online/away/busy/offline | 4 tokens | 4 tokens (`--color-online/away/busy/offline`) | Match |
| Chat colors | Not specific | `--color-chat-user/admin/bot/system` | Current is richer |
| Chart colors | `--chart-1` through `--chart-5` | Not defined | **GAP**: No chart tokens |
| Sidebar tokens | 6 dedicated tokens | 5 dedicated tokens | Close match |
| Card/Popover surfaces | `--card`, `--popover` | `--color-surface`, `--color-surface-dark` | Different naming |

### Shadows

| Shadow | Example | Current | Notes |
|--------|---------|---------|-------|
| Scale | Not documented | `--shadow-xs` to `--shadow-2xl` + glow variants | Current is richer |

### Spacing

| Spacing | Example | Current | Notes |
|---------|---------|---------|-------|
| Scale | Not documented (uses Tailwind defaults) | `--spacing-px` to `--spacing-40` (31 levels) | Current is richer |

### Z-Index

| Z-Index | Example | Current | Notes |
|---------|---------|---------|-------|
| Scale | Not documented | 7-level scale (base to loading) | Current has it |

### Border Radius

| Radius | Example | Current | Notes |
|--------|---------|---------|-------|
| Default | `--radius: 0.75rem` | `--radius-none` to `--radius-full` (9 levels) | Current is richer |

**Token Verdict**: Current system has deeper token architecture. Example has simpler shadcn-standard tokens but includes `accent` and `chart` tokens we lack.

---

## 2. Typography

| Feature | Example | Current | Gap? |
|---------|---------|---------|------|
| Font family | Noto Sans Thai (300-700) | Noto Sans Thai (same) | Match |
| Type scale | Static Tailwind classes (`text-4xl` etc.) | Fluid `clamp()` scale (`--text-xs` to `--text-3xl`) | Current is better |
| Thai text rules | Not mentioned | `.thai-text` (line-height 1.6), `.thai-no-break` | Current is better |
| Micro text | `text-[9px]`, `text-[10px]` used heavily | Same usage in components | Match |

**Typography Verdict**: Current system is superior with fluid typography and Thai-specific utilities.

---

## 3. CSS Animations

| Animation | Example | Current | Notes |
|-----------|---------|---------|-------|
| `fade-in` | Yes | Yes (`fade-in`, `fade-in-up`, `fade-in-down`) | Current richer |
| `scale-in` | Yes | Yes | Match |
| `msg-in` / `msg-out` | Yes (slide left/right) | Yes (`slide-in-left` for msg-in) | Match |
| `typing-dot` | Yes | Yes (`typing-bounce`) | Match |
| `blink-badge` | Yes | Yes | Match |
| `shimmer` | Yes | Yes | Match |
| `pulse-ring` | Yes | Yes | Match |
| `toast-slide` | Yes | Yes | Match |
| `shine` | Not mentioned | Yes (button shine effect) | Current extra |
| `pulse-glow` | Not mentioned | Yes | Current extra |
| `float` | Not mentioned | Yes | Current extra |
| `bounce-subtle` | Not mentioned | Yes | Current extra |
| `shake` | Not mentioned | Yes | Current extra |
| `ping` | Not mentioned | Yes | Current extra |
| `.hover-lift` | Not mentioned | Yes | Current extra |
| `.press-down` | Not mentioned | Yes | Current extra |
| `.focus-ring` | Not mentioned | Yes | Current extra |
| Animation delays | Not mentioned | `.delay-0` to `.delay-500` (9 levels) | Current extra |

**Animation Verdict**: Current system is a superset. All example animations exist, plus 8+ additional.

---

## 4. Component Library Comparison

### Base UI Components

| Component | Example (shadcn) | Current | Gap? |
|-----------|-----------------|---------|------|
| Accordion | `accordion.tsx` | -- | **MISSING** |
| Alert | `alert.tsx` | `Alert.tsx` | Have it |
| Alert Dialog | `alert-dialog.tsx` | `ModalAlert.tsx` (custom) | Equivalent |
| Aspect Ratio | `aspect-ratio.tsx` | -- | **MISSING** (minor) |
| Avatar | `avatar.tsx` | `Avatar.tsx` | Have it |
| Badge | `badge.tsx` | `Badge.tsx` | Have it |
| Breadcrumb | `breadcrumb.tsx` | -- | **MISSING** |
| Button | `button.tsx` | `Button.tsx` (9 variants, 7 sizes) | Current richer |
| Calendar | `calendar.tsx` | -- | **MISSING** |
| Card | `card.tsx` | `Card.tsx` (6 variants, 4 hover effects) | Current richer |
| Carousel | `carousel.tsx` | -- | **MISSING** (minor) |
| Chart | `chart.tsx` | -- | **MISSING** |
| Checkbox | `checkbox.tsx` | `Checkbox.tsx` | Have it |
| Collapsible | `collapsible.tsx` | -- | **MISSING** (minor) |
| Command | `command.tsx` | -- | **MISSING** |
| Context Menu | `context-menu.tsx` | -- | **MISSING** (minor) |
| Dialog | `dialog.tsx` | `Modal.tsx` (custom) | Equivalent |
| Drawer | `drawer.tsx` | -- | **MISSING** |
| Dropdown Menu | `dropdown-menu.tsx` | `DropdownMenu.tsx` | Have it |
| Form (react-hook-form) | `form.tsx` | -- | **MISSING** |
| Hover Card | `hover-card.tsx` | -- | **MISSING** (minor) |
| Input | `input.tsx` | `Input.tsx` | Have it |
| Input OTP | `input-otp.tsx` | -- | **MISSING** (minor) |
| Label | `label.tsx` | `Label.tsx` | Have it |
| Menubar | `menubar.tsx` | -- | **MISSING** (minor) |
| Navigation Menu | `navigation-menu.tsx` | -- | **MISSING** (minor) |
| Pagination | `pagination.tsx` | -- | **MISSING** |
| Popover | `popover.tsx` | -- | **MISSING** |
| Progress | `progress.tsx` | `Progress.tsx` | Have it |
| Radio Group | `radio-group.tsx` | `RadioGroup.tsx` | Have it |
| Resizable | `resizable.tsx` | -- | **MISSING** (minor) |
| Scroll Area | `scroll-area.tsx` | -- (CSS-based scrollbar utils) | Partial |
| Select | `select.tsx` | `Select.tsx` | Have it |
| Separator | `separator.tsx` | `Separator.tsx` | Have it |
| Sheet | `sheet.tsx` | -- | **MISSING** |
| Sidebar (shadcn) | `sidebar.tsx` | Custom in `layout.tsx` | Equivalent |
| Skeleton | `skeleton.tsx` | `Skeleton.tsx` | Have it |
| Slider | `slider.tsx` | -- | **MISSING** |
| Sonner | `sonner.tsx` | -- | **MISSING** |
| Switch | `switch.tsx` | `Switch.tsx` | Have it |
| Table | `table.tsx` | `AdminTableHead.tsx` (partial) | **PARTIAL** |
| Tabs | `tabs.tsx` | `Tabs.tsx` | Have it |
| Textarea | `textarea.tsx` | -- (inline in MessageInput) | **MISSING** standalone |
| Toast | `toast.tsx` + `toaster.tsx` | `Toast.tsx` + Zustand-based | Have it |
| Toggle | `toggle.tsx` | -- | **MISSING** (minor) |
| Toggle Group | `toggle-group.tsx` | -- | **MISSING** (minor) |
| Tooltip | `tooltip.tsx` | `Tooltip.tsx` | Have it |

### Summary Count

| Status | Count | Components |
|--------|-------|------------|
| **Have it** | 18 | Alert, Avatar, Badge, Button, Card, Checkbox, DropdownMenu, Input, Label, Progress, RadioGroup, Select, Separator, Skeleton, Switch, Tabs, Toast, Tooltip |
| **Equivalent** (different impl) | 3 | AlertDialog/ModalAlert, Dialog/Modal, Sidebar/layout |
| **Partial** | 2 | Table (AdminTableHead only), ScrollArea (CSS utils) |
| **MISSING (important)** | 10 | Accordion, Breadcrumb, Calendar, Chart, Command, Form, Pagination, Popover, Sheet, Slider |
| **MISSING (minor)** | 12 | AspectRatio, Carousel, Collapsible, ContextMenu, Drawer, HoverCard, InputOTP, Menubar, NavMenu, Resizable, Toggle, ToggleGroup |

---

## 5. Admin-Specific Components

| Component | Example | Current | Notes |
|-----------|---------|---------|-------|
| Admin Sidebar | `admin-sidebar.tsx` | Built into `layout.tsx` | Current is inline |
| User List Panel | `user-list-panel.tsx` | `ConversationList.tsx` | Equivalent |
| Chat Room | `chat-room.tsx` | `ChatArea.tsx` + `MessageBubble.tsx` | Split into parts |
| User Profile Panel | `user-profile-panel.tsx` | `CustomerPanel.tsx` | Equivalent |
| Video Call Modal | `video-call-modal.tsx` | -- | **MISSING** |
| Notification Toast | `notification-toast.tsx` | `NotificationToast.tsx` | Have it |
| Canned Responses | Not mentioned | `CannedResponsePicker.tsx` | Current extra |
| Session Actions | Not mentioned | `SessionActions.tsx` | Current extra |
| Transfer Dialog | Not mentioned | `TransferDialog.tsx` | Current extra |
| Quick Replies | Not mentioned | `QuickReplies.tsx` | Current extra |
| Bot Status | Not mentioned | `BotStatusIndicator.tsx` | Current extra |
| Session Timeout | Not mentioned | `SessionTimeoutWarning.tsx` | Current extra |
| Search/Filter Bar | Not mentioned | `AdminSearchFilterBar.tsx` | Current extra |
| Assign Modal | Not mentioned | `AssignModal.tsx` | Current extra |

**Admin Verdict**: Current has 8 more domain-specific components. Example has Video Call Modal we lack.

---

## 6. Layout Patterns

| Pattern | Example | Current | Gap? |
|---------|---------|---------|------|
| 3-column + optional 4th | Described | Implemented (Shell + ConversationList + ChatArea + CustomerPanel) | Match |
| `h-16` panel headers | Standardized | Used in components | Match |
| Responsive grid patterns | Documented | Used but not formally documented | Match |
| Collapsible sidebar | 68px-220px | 64px-expanded | Close match |
| Mobile overlay sidebar | Not mentioned | Implemented with backdrop blur | Current better |
| Glass-morphic header | Not mentioned | Implemented | Current extra |
| Full-screen live chat exception | Not mentioned | Implemented (bypasses standard layout) | Current extra |

---

## 7. Patterns the Example Has That We Don't

### High Priority (Would Add Value)

1. **Chart Component** (`chart.tsx` with Recharts + ChartContainer/ChartTooltip)
   - Our analytics page likely needs this
   - Chart color tokens (`--chart-1` to `--chart-5`) also missing

2. **Form Component** (react-hook-form + zod integration wrapper)
   - Would standardize form validation across admin pages
   - `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

3. **Popover** (Radix `@radix-ui/react-popover`)
   - Used for date pickers, color pickers, inline editors

4. **Command Palette** (`Ctrl+K` command dialog)
   - Power user feature for quick navigation

5. **Pagination** component
   - Needed for any list/table page with many records

6. **Breadcrumbs** component
   - Navigation aid for nested admin pages

7. **Sheet/Offcanvas** (slide-in panels)
   - Alternative to modals for settings/details panels

8. **Table** full primitive (shadcn `Table` with `TableHead/TableBody/TableRow/TableCell/TableFooter`)
   - Currently only have `AdminTableHead`; full table primitive missing

### Medium Priority

9. **Calendar / Date Picker** - Useful for report date filtering
10. **Accordion** - Useful for FAQ, settings sections
11. **Slider** - For range inputs (e.g., timeout settings)
12. **Textarea** standalone - Currently inline only

### Low Priority (Nice to Have)

13. Drawer (mobile-friendly bottom sheet)
14. Carousel (image/card sliding)
15. Collapsible, Toggle, Toggle Group
16. Context Menu, Menubar, Navigation Menu
17. Hover Card, Aspect Ratio, Resizable Panels, Input OTP

---

## 8. Patterns We Have That the Example Doesn't

### Token/System Level
1. **Fluid typography** - `clamp()`-based responsive text sizes
2. **Full dark mode** - `.dark` class with complete overrides
3. **Thai language utilities** - `.thai-text`, `.thai-no-break`
4. **WCAG AA accessibility** - Accessible text color variants (`*-text`)
5. **Reduced motion support** - `@media (prefers-reduced-motion)`
6. **9-level shadow scale** with glow variants
7. **31-level spacing scale**
8. **9-level border radius scale**
9. **Z-index token scale**
10. **5 scrollbar variants** (context-specific)
11. **Glass effect utilities** (`.glass`, `.glass-dark`)
12. **Gradient text utilities**
13. **Design system page classes** (`.ds-page`, `.ds-panel`, `.ds-hero`, `.ds-kpi`)

### Component Level
1. **CVA variant system** - Button (9 variants, 7 sizes), Card (6 variants, 4 hover effects)
2. **ActionIconButton** - Dedicated icon button component
3. **LoadingSpinner** - Dedicated spinner component
4. **CannedResponsePicker** - Quick responses for operators
5. **SessionActions** - Claim/close/transfer session controls
6. **TransferDialog** - Session transfer between operators
7. **QuickReplies** - Predefined reply chips
8. **BotStatusIndicator** - Bot/human mode display
9. **SessionTimeoutWarning** - Auto-timeout alert
10. **AdminSearchFilterBar** - Reusable search/filter
11. **ConversationActionMenu** - Context actions for conversations

### Animation Level
1. `shine`, `pulse-glow`, `float`, `bounce-subtle`, `shake`, `ping`
2. `.hover-lift`, `.press-down`, `.hover-scale`
3. `.focus-ring` utility
4. 9-level animation delay classes

---

## 9. Recommendations

### Adopt from Example (Priority Order)

| Priority | Component | Reason | Effort |
|----------|-----------|--------|--------|
| 1 | **Chart tokens** (`--chart-1..5`) | Analytics page needs consistent chart colors | Low |
| 2 | **Accent color token** | Missing teal/green accent for variety | Low |
| 3 | **Table primitive** | Full `Table/TableHead/TableBody/TableRow/TableCell` | Medium |
| 4 | **Pagination** | Needed for list pages with many records | Medium |
| 5 | **Popover** | Foundation for date picker, color picker, etc. | Medium |
| 6 | **Form wrapper** (react-hook-form + zod) | Standardize form validation | Medium |
| 7 | **Breadcrumbs** | Navigation aid for nested pages | Low |
| 8 | **Sheet** | Slide-in panel alternative to modals | Medium |
| 9 | **Calendar/DatePicker** | Report filtering, scheduling | Medium |
| 10 | **Command Palette** | Power user quick navigation | High |

### Keep as-is (Our Strengths)

- Custom CVA component variants (richer than shadcn defaults)
- Fluid typography system
- Thai language utilities
- Dark mode support
- Accessibility infrastructure
- Domain-specific live chat components
- Context-specific scrollbar system
- Animation utility library

### Architecture Decision

The example uses **shadcn/ui** (copy-paste component model with Radix primitives). Our current system uses **custom CVA components**. Migrating to shadcn/ui wholesale is not recommended because:

1. Our Button (9 variants) and Card (6 variants) are richer than shadcn defaults
2. Our token system is deeper (semantic layers, dark mode, Thai support)
3. Migration cost would be high with 46 existing components

**Recommended approach**: Selectively install individual shadcn/ui components for gaps (Table, Pagination, Popover, etc.) while keeping our custom components where they're stronger.

---

## 10. File Reference

| Category | Example Path | Current Path |
|----------|-------------|--------------|
| Design tokens | (inline in doc) | `frontend/app/globals.css` |
| Design system docs | `examples/admin-chat-system/docs/ui-design-system.md` | `frontend/docs/design-system-unified.md` |
| Compliance checklist | -- | `frontend/docs/design-system-compliance-checklist.md` |
| Base components | `components/ui/*.tsx` (35+) | `frontend/components/ui/*.tsx` (22) |
| Admin components | 6 custom components | `frontend/components/admin/*.tsx` (9) |
| Live chat components | Referenced in chat-room.tsx | `frontend/app/admin/live-chat/_components/*.tsx` (15) |
| Layout | `components/admin-sidebar.tsx` | `frontend/app/admin/layout.tsx` |