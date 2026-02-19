# UI Design System Comparison: Merged Report

> **Sources**: Antigravity, Cline, CodeX, Claude Code, Kilo Code, Kimi Code, Open Code
> **Subject**: Example `admin-chat-system` Design System vs Current SknApp Admin UI
> **Merged**: 2026-02-15
> **Status**: Post-migration (UI migration complete, compliance features done)

---

## Executive Summary

This merged report consolidates findings from **6 independent agent comparisons** of the example `admin-chat-system` design system (2,904 lines, 64 component categories, shadcn/ui + Radix) against the current SknApp admin UI (custom CVA components, Tailwind v4, Zustand).

### Consensus Verdict

| Dimension | Winner | Confidence |
|-----------|--------|------------|
| **Design tokens** | Current SknApp | 6/6 agents agree |
| **Typography** | Current SknApp | 6/6 (fluid clamp + Thai utilities) |
| **Animations** | Current SknApp | 6/6 (superset of example) |
| **Dark mode** | Current SknApp | 5/6 |
| **Accessibility** | Current SknApp | 4/6 (WCAG AA, reduced motion) |
| **Scrollbar system** | Current SknApp | 6/6 (5 variants vs 1) |
| **Shadow system** | Current SknApp | 5/6 (glow variants) |
| **Component breadth** | Example | 6/6 (45+ vs 22 base) |
| **Documentation depth** | Example | 5/6 (full cookbook) |
| **Component richness** | Current SknApp | 4/6 (Button 9 variants, Card 6 variants) |
| **Domain-specific components** | Current SknApp | 6/6 (8+ live chat extras) |
| **Governance/compliance** | Current SknApp | 3/6 (checklist + enforcement) |

**Bottom line**: Current SknApp has a **stronger foundation** (tokens, typography, animations, accessibility, dark mode). The example has **broader component coverage**. The recommended approach is to **keep SknApp as base** and selectively adopt missing components.

### Verification Note

Several source reports were produced at different times and disagree on gap status. All claims in this merged document were cross-checked against the codebase as of 2026-02-15. Items verified:

- Rich input components exist: `EmojiPicker.tsx`, `StickerPicker.tsx`, `QuickReplies.tsx`, `NotificationToast.tsx`
- Chat animation utilities exist in `globals.css`: `typing-bounce`, `slide-in-left`, `blink-badge`, `pulse-ring`, `toast-slide`, `.msg-in`, `.msg-out`
- Component counts: `frontend/components/ui` (22), `frontend/components/admin` (9), `frontend/app/admin/live-chat/_components` (15)
- High-priority primitive gaps confirmed absent from `frontend/components/ui`: `Textarea.tsx`, `Table.tsx`, `Pagination.tsx`, `Popover.tsx`, `Form.tsx`, `Calendar.tsx`, `Sheet.tsx`, `Command.tsx`, `Accordion.tsx`, `Chart.tsx`

---

## Stale Claims (No Longer Gaps)

These were flagged as gaps in older reports but have since been implemented:

1. Emoji picker - `EmojiPicker.tsx` exists
2. Sticker picker - `StickerPicker.tsx` exists
3. Quick replies - `QuickReplies.tsx` exists
4. Notification toast - `NotificationToast.tsx` integrated in shell
5. Core chat animation classes - All present in `globals.css`

---

## 1. Color System

### Matching Tokens (All Agents Agree)

| Token | HSL Value | Status |
|-------|-----------|--------|
| Online | `142 71% 45%` | Identical |
| Away | `38 92% 50%` | Identical |
| Busy | `0 84% 60%` | Identical |
| Offline | `220 10% 46%` | Identical |
| Sidebar BG | `222 47% 11%` | Identical |
| Sidebar Border | `215 28% 17%` | Identical |
| Background | `~220 20% 97%` | Near-match |
| Foreground | `~220 20% 10%` | Near-match |
| Card | `0 0% 100%` | Identical |

### Intentional Differences

| Token | Example | Current SknApp | Decision |
|-------|---------|----------------|----------|
| **Primary** | `217 91% 60%` (Blue) | `262 83% 66%` (Purple) | **Keep purple** - brand identity |
| **Accent** | `162 72% 45%` (Teal) | No direct accent | Consider adding |
| **Ring/Focus** | `217 91% 60%` | `262 83% 66%` | Keep current (matches brand) |

### Current SknApp Advantages

| Feature | Current SknApp | Example |
|---------|---------------|---------|
| Brand scale | 10 shades (50-900) | Single primary |
| WCAG AA text | `*-text` variants for each semantic color | None |
| Chat-specific | `--color-chat-user/admin/bot/system` | None |
| Session status | 4 extra tokens (waiting/active/closed/bot) | None |
| Semantic layers | success/warning/danger/info + light/dark | Flat tokens |

### Confirmed Gaps to Fill

| Token | Purpose | Effort |
|-------|---------|--------|
| `--chart-1` to `--chart-5` | Analytics chart colors | Low |
| Accent color | Teal/green for variety | Low |
| `--sidebar-primary-fg` | Text on active nav item | Low |

---

## 2. Typography

All 6 agents agree: **Current SknApp typography is superior**.

| Feature | Example | Current SknApp |
|---------|---------|----------------|
| Font | Noto Sans Thai (300-700) | Noto Sans Thai (300-700) |
| Sizing | Static Tailwind classes | Fluid `clamp()` responsive scaling |
| Thai support | Font only | `.thai-text` (line-height 1.6), `.thai-no-break` |
| Scale tokens | Tailwind defaults | `--text-xs` to `--text-3xl` (custom) |
| Micro sizes | `text-[9px]`, `text-[10px]` | Same usage in components |

**Recommendation**: Keep current system. Add a compact typography recipe section in docs for repeated UI contexts:

| Context | Recommended Pattern |
|---------|-------------------|
| Table metadata | `text-[10px] font-medium text-text-secondary` |
| Badge labels | `text-[10px] font-semibold uppercase tracking-wide` |
| Chat timestamps | `text-[10px] text-text-tertiary` |
| Panel section titles | `text-xs font-semibold uppercase tracking-wider text-text-secondary` |
| KPI values | `text-2xl font-bold` |
| KPI labels | `text-xs text-text-secondary` |

---

## 3. Animation System

All 6 agents agree: **Current SknApp is a superset** of the example.

### All Example Animations Present in Current

| Animation | Class | Status |
|-----------|-------|--------|
| Typing indicator | `.typing-dot` / `typing-bounce` | Present |
| Message slide-in | `.msg-in` / `slide-in-left` | Present |
| Message slide-out | `.msg-out` / `slide-in-right` | Present |
| Badge blink | `.blink-badge` | Present |
| Fade in | `.fade-in` | Present |
| Scale in | `.scale-in` | Present |
| Shimmer | `.shimmer` | Present |
| Pulse ring | `.pulse-ring` | Present |
| Toast slide | `.toast-slide` | Present |

### Extra Animations (Current SknApp Only)

| Animation | Class | Use Case |
|-----------|-------|----------|
| Fade in up/down | `.fade-in-up`, `.fade-in-down` | Element transitions |
| Shine | `.shine` | Button accent effect |
| Pulse glow | `.pulse-glow` | Attention state |
| Float | `.float` | Decorative motion |
| Bounce subtle | `.bounce-subtle` | Gentle feedback |
| Shake | `.shake` | Error/attention |
| Ping | `.ping` | Notification pulse |
| Hover lift | `.hover-lift` | Card interaction |
| Press down | `.press-down` | Button press |
| Focus ring | `.focus-ring` | Accessibility |
| Animation delays | `.delay-0` to `.delay-500` (9 levels) | Staggered animations |

**Recommendation**: Keep current system. No changes needed.

---

## 4. Component Library Comparison

This is the **main gap area** identified by all agents. Current SknApp has 22 base + 9 admin + 15 live-chat components. Example has 45+ shadcn/ui components.

### Components Present in Both (18 matched + 3 equivalent)

| Component | Current SknApp | Notes |
|-----------|---------------|-------|
| Alert | `Alert.tsx` | Match |
| Avatar | `Avatar.tsx` | Match |
| Badge | `Badge.tsx` | Current richer (7 variants, 3 appearances) |
| Button | `Button.tsx` | Current richer (9 variants, 7 sizes, shine/glow) |
| Card | `Card.tsx` | Current richer (6 variants, 4 hover effects) |
| Checkbox | `Checkbox.tsx` | Match |
| DropdownMenu | `DropdownMenu.tsx` | Match |
| Input | `Input.tsx` | Match |
| Label | `Label.tsx` | Match |
| Progress | `Progress.tsx` | Match |
| RadioGroup | `RadioGroup.tsx` | Match |
| Select | `Select.tsx` | Match |
| Separator | `Separator.tsx` | Match |
| Skeleton | `Skeleton.tsx` | Match |
| Switch | `Switch.tsx` | Match |
| Tabs | `Tabs.tsx` | Match |
| Toast | `Toast.tsx` | Custom Zustand-based (vs sonner) |
| Tooltip | `Tooltip.tsx` | Match |
| AlertDialog / ModalAlert | `ModalAlert.tsx` | Equivalent (custom) |
| Dialog / Modal | `Modal.tsx` | Equivalent (custom) |
| Sidebar | `layout.tsx` | Equivalent (inline implementation) |

### Domain-Specific Components (Current SknApp Only)

| Component | File | Purpose |
|-----------|------|---------|
| CannedResponsePicker | `CannedResponsePicker.tsx` | Quick operator responses |
| SessionActions | `SessionActions.tsx` | Claim/close/transfer |
| TransferDialog | `TransferDialog.tsx` | Session transfer |
| QuickReplies | `QuickReplies.tsx` | Predefined reply chips |
| EmojiPicker | `EmojiPicker.tsx` | Chat emoji input |
| StickerPicker | `StickerPicker.tsx` | LINE sticker input |
| BotStatusIndicator | `BotStatusIndicator.tsx` | Bot/human mode display |
| SessionTimeoutWarning | `SessionTimeoutWarning.tsx` | Auto-timeout alert |
| NotificationToast | `NotificationToast.tsx` | Sound + visual notification |
| AdminSearchFilterBar | `AdminSearchFilterBar.tsx` | Reusable search/filter |
| AssignModal | `AssignModal.tsx` | Operator assignment |
| ActionIconButton | `ActionIconButton.tsx` | Dedicated icon button |
| LoadingSpinner | `LoadingSpinner.tsx` | Spinner component |

### Missing Components (Prioritized by Agent Consensus)

#### High Priority (4+ agents flagged, clear use case)

| Component | Use Case | Effort | Agents |
|-----------|----------|--------|--------|
| **Table/DataTable** | List pages, admin data grids | Medium | 5/6 |
| **Popover** | Date pickers, color pickers, inline editors | Medium | 5/6 |
| **Form** (react-hook-form + zod) | Standardized validation | Medium | 5/6 |
| **Sheet/Offcanvas** | Side panels, mobile details | Medium | 5/6 |
| **Pagination** | List pages with many records | Medium | 5/6 |
| **Chart** (Recharts) | Analytics dashboard | Medium | 5/6 |
| **Calendar/DatePicker** | Report filtering, scheduling | Medium | 4/6 |

#### Medium Priority (3+ agents)

| Component | Use Case | Effort | Agents |
|-----------|----------|--------|--------|
| **Accordion** | Settings sections, FAQ | Low | 4/6 |
| **Breadcrumbs** | Nested page navigation | Low | 4/6 |
| **Command Palette** | Power user Ctrl+K navigation | High | 4/6 |
| **Slider** | Range inputs (timeout settings) | Low | 3/6 |
| **Textarea** (standalone) | Currently inline in MessageInput | Low | 3/6 |
| **Hover Card** | User profile preview on hover | Low | 3/6 |
| **Drawer** | Mobile-friendly bottom sheet | Medium | 3/6 |

#### Low Priority (1-2 agents, minor use case)

| Component | Agents |
|-----------|--------|
| Carousel | 3/6 |
| Context Menu | 3/6 |
| Resizable Panels | 3/6 |
| Toggle / Toggle Group | 3/6 |
| Collapsible | 2/6 |
| Menubar | 2/6 |
| Navigation Menu | 2/6 |
| Aspect Ratio | 2/6 |
| Input OTP | 2/6 |
| Scroll Area (component) | 1/6 |

---

## 5. Layout System

### 3-Column Chat Layout

Both systems implement the same core pattern:

```
[Sidebar 64-80px] [ConversationList 320px] [ChatArea flex-1] [CustomerPanel 320px?]
```

| Feature | Example | Current SknApp |
|---------|---------|----------------|
| Sidebar collapse | 68px-220px | 64px-expanded |
| Panel headers | Standardized `h-16` | Used but not formalized |
| Mobile overlay | Not mentioned | Implemented with backdrop blur |
| Glass-morphic header | Not mentioned | Implemented |
| Full-screen live chat | Not mentioned | Implemented (bypasses standard layout) |

### Design System Layout Classes (Current SknApp Only)

| Class | Purpose |
|-------|---------|
| `.ds-page` | Page container (space-y-6) |
| `.ds-panel` | Card panel (rounded-2xl, shadow-sm) |
| `.ds-panel-header` | Panel header section |
| `.ds-panel-body` | Panel body content |
| `.ds-hero` | Hero section with gradient |
| `.ds-kpi` | KPI card with hover-lift |
| `.ds-section-title` | Section title styling |

**Recommendation**: Keep current layout. Standardize `h-16` panel headers formally. Add explicit layout blueprints in docs for 3-column live chat, optional profile panel, and mobile sheet/off-canvas fallback.

---

## 6. Live Chat UX Pattern Consistency

Major interaction pieces are implemented. The remaining gap is consistency and polish across micro-patterns. These should be standardized into a single documented pattern set.

### Message Bubble

| Pattern | Example Spec | Current SknApp | Action |
|---------|-------------|----------------|--------|
| Corner cut | `rounded-tr-sm` (admin), `rounded-tl-sm` (user) | Full `rounded-2xl` | Standardize corner-cut direction |
| Max width | 65% | 80% | Decide on one value |
| Read receipts | `CheckCheck` icon below bubble | Text status | Adopt icon-based read receipts |
| Reactions | Emoji display below bubble | Not implemented | Optional (P3) |
| Slide animation | `.msg-in` / `.msg-out` | Present | Match |
| Time/status position | Below bubble, right-aligned | Above bubble | Align to example spec |

### Status Indicator

| Pattern | Example Spec | Current SknApp | Action |
|---------|-------------|----------------|--------|
| Dot size | `h-3 w-3` | `h-2.5 w-2.5` | Standardize to one size |
| Border ring | `border-2 border-card` | None | Add ring for contrast |
| Position | `absolute -bottom-0.5 -right-0.5` | Inline | Adopt absolute positioning on avatar |
| Colors | `online/away/busy/offline` tokens | `waiting/active/closed` tokens | Map: waiting=away, active=online, closed=offline |

Define a **single status-indicator pattern** to use consistently across conversation list items, chat headers, and profile panels.

### Notification Toast

| Pattern | Example Spec | Current SknApp | Action |
|---------|-------------|----------------|--------|
| Sound | Web Audio API (800Hz, 300ms) | Implemented | Match |
| Vibration | `navigator.vibrate(200)` | Not implemented | Add (low effort) |
| Blink animation | `.blink-badge` | Available but not used on toast | Wire up |
| Slide animation | `.toast-slide` | Fade | Switch to slide |
| Auto-dismiss | 5s | Configurable | Match |

### Quick Reply / Emoji / Sticker Behavior

These components exist but should be documented as a formal pattern set:

1. **Toggle behavior**: Only one picker open at a time (emoji, sticker, canned response)
2. **Positioning**: Popover above input area, aligned to trigger button
3. **Animation**: `.scale-in` on open, fade on close
4. **Keyboard**: Escape to close, Tab to navigate grid
5. **Selection**: Insert at cursor position, auto-close after selection (configurable)

**Recommendation**: Create a "Live Chat Pattern Appendix" in `frontend/docs/` documenting these micro-patterns as the single source of truth.

---

## 7. Shadow & Scrollbar Systems (Current SknApp Wins Both)

### Shadows (Current SknApp Wins)

| Feature | Example | Current SknApp |
|---------|---------|----------------|
| Scale | Tailwind defaults | `--shadow-xs` to `--shadow-2xl` (6 levels) |
| Glow effects | None | `--shadow-glow`, `--shadow-glow-sm`, `--shadow-glow-lg` |
| Color modifiers | `shadow-primary/20` | Brand-colored glows |

### Scrollbars (Current SknApp Wins)

| Utility | Context |
|---------|---------|
| `.scrollbar-thin` | Light/default scroll areas |
| `.scrollbar-sidebar` | Dark sidebar navigation |
| `.dark-scrollbar` | Dark containers and panels |
| `.chat-scrollbar` | Live chat message surfaces |
| `.no-scrollbar` | Hidden scrollbars |

Example only has `.custom-scrollbar` (4px thin, single variant).

---

## 8. Accessibility & Utilities (Current SknApp Advantages)

| Feature | Current SknApp | Example |
|---------|---------------|---------|
| WCAG AA text colors | Yes (5 semantic text tokens) | No |
| Reduced motion | `@media (prefers-reduced-motion)` | No |
| Skip links | Implemented | No |
| Focus ring utility | `.focus-ring` | No |
| Glass effect | `.glass`, `.glass-dark` | No |
| Gradient text | `.text-gradient`, `.text-gradient-premium` | No |
| Interactive states | `.hover-lift`, `.press-down`, `.hover-scale` | No |
| Thai text | `.thai-text`, `.thai-no-break` | Font only |
| Z-index scale | 7-level token scale (base to loading) | Not documented |
| Spacing scale | 31 levels (`--spacing-px` to `--spacing-40`) | Tailwind defaults |
| Border radius | 9 levels (`--radius-none` to `--radius-full`) | Single `--radius: 0.75rem` |

---

## 9. Technology Stack

| Technology | Example | Current SknApp |
|------------|---------|----------------|
| Next.js | 16+ | 16.1.1 |
| React | 19+ | 19.2.3 |
| Tailwind CSS | v3.4 (config-based) | **v4** (CSS-first `@theme`) |
| Component lib | shadcn/ui + Radix UI | Custom CVA |
| Icons | Lucide | Lucide |
| State mgmt | Zustand 5 | Zustand |
| Charts | Recharts | Not integrated |
| Forms | react-hook-form + zod | Not in UI lib |
| Toast | sonner + shadcn | Custom Zustand-based |
| Carousel | embla-carousel | Not integrated |

---

## 10. Documentation & Governance

### Consensus

| Dimension | Current SknApp | Example |
|-----------|---------------|---------|
| Compliance tracking | Explicit checklist + enforcement targets | Implicit |
| Component cookbook | Standards-focused, less exhaustive | Full cookbook with code examples per component |
| Layout documentation | Governance rules | Pattern blueprints with code |
| Source of truth | `design-system-unified.md` + `design-system-reference.md` + `design-system-compliance-checklist.md` | Single large `ui-design-system.md` (2,904 lines) |

**Best merged state is governance + cookbook**, not one or the other.

### Recommendation

1. Keep `frontend/docs/design-system-unified.md` as the source of truth for rules and standards
2. Add a **companion cookbook appendix** with:
   - Component recipes and usage examples for each `components/ui/*` file
   - Layout blueprints with code (3-column chat, dashboard grid, mobile sheet)
   - Live chat pattern appendix (message bubbles, typing, status, notifications)
3. Add a **parity matrix**: Example section -> Current component/path -> Status (adopted/deferred/out-of-scope)
4. Document **intentional scope boundaries** - which example sections are not adopted and why

---

## 11. Architecture Decision (All Agents Agree)

All agents agree: **Do NOT migrate wholesale to shadcn/ui**. Reasons:

1. **Current CVA components are richer** - Button (9 variants vs 6), Card (6 variants), Badge (7 variants x 3 appearances)
2. **Token system is deeper** - Semantic layers, WCAG AA, Thai support, dark mode
3. **Migration cost too high** - 46 existing components would need rework
4. **Tailwind v4 advantage** - Current uses modern CSS-first config; example uses older v3

**Recommended approach**: Selectively install individual shadcn/ui components for gaps (Table, Pagination, Popover, Form, Sheet, Calendar, Chart) while keeping custom components where they're stronger.

---

## 12. Consolidated Action Plan

### Phase 1: Token Gaps (Low effort, high value)

| Action | Effort | Impact |
|--------|--------|--------|
| Add `--chart-1` to `--chart-5` color tokens | Low | Analytics page |
| Add accent color token (teal/green) | Low | Visual variety |
| Add `--sidebar-primary-fg` token | Low | Active nav text |
| Standardize `h-16` panel headers in docs | Low | Consistency |

### Phase 2: High-Priority Missing Components

| Component | Install Method | Notes |
|-----------|---------------|-------|
| Table/DataTable | shadcn/ui + custom | Full sort/select/paginate |
| Popover | shadcn/ui (Radix) | Foundation for pickers |
| Form | react-hook-form + zod wrapper | Standardize validation |
| Sheet | shadcn/ui (Radix) | Side panels |
| Pagination | shadcn/ui | List pages |
| Chart | Recharts + ChartContainer | Analytics dashboard |
| Calendar/DatePicker | shadcn/ui | Date filtering |

### Phase 3: Medium-Priority Components

| Component | Install Method |
|-----------|---------------|
| Accordion | shadcn/ui |
| Breadcrumbs | shadcn/ui |
| Command Palette | shadcn/ui (cmdk) |
| Slider | shadcn/ui |
| Textarea (standalone) | Custom or shadcn/ui |
| Hover Card | shadcn/ui |

### Phase 4: Documentation

| Action | Notes |
|--------|-------|
| Add component recipes for existing `components/ui/*` | Usage examples |
| Create "Live Chat Pattern Appendix" | Message bubbles, typing, notifications |
| Add parity mapping table | Example section -> current path -> status |
| Document intentional scope boundaries | Which example sections are adopted/deferred |

---

## 13. Color Mapping Reference

For any code referencing the example design system:

| Example Token | Current SknApp Equivalent |
|---------------|---------------------------|
| `--primary` | `brand-500` |
| `--primary-foreground` | `white` |
| `--accent` | `success` / `info` |
| `--destructive` | `danger` |
| `--secondary` | `gray-100` |
| `--muted` | `gray-50` / `text-secondary` |
| `--online` | `--color-online` / `success` |
| `--away` | `--color-away` / `warning` |
| `--busy` | `--color-busy` / `danger` |
| `--offline` | `--color-offline` / `gray-500` |
| `--sidebar-background` | `gray-900` / `--color-sidebar-bg` |
| `--sidebar-foreground` | `gray-50` / `--color-sidebar-fg` |
| `--sidebar-muted` | `gray-400` / `--color-sidebar-muted` |
| `--sidebar-accent` | `--color-sidebar-accent` |
| `--card` | `--color-surface` |
| `--border` | `gray-200` / `--color-border` |

---

## 14. File Reference

### Example Design System
- Spec: `examples/admin-chat-system/docs/ui-design-system.md`

### Current Implementation
- Design tokens: `frontend/app/globals.css`
- Design system docs: `frontend/docs/design-system-unified.md`
- Reference guide: `frontend/docs/design-system-reference.md`
- Compliance checklist: `frontend/docs/design-system-compliance-checklist.md`
- Base components: `frontend/components/ui/*.tsx` (22 files)
- Admin components: `frontend/components/admin/*.tsx` (9 files)
- Live chat components: `frontend/app/admin/live-chat/_components/*.tsx` (15 files)
- Layout: `frontend/app/admin/layout.tsx`

### Source Reports
- `research/antigravity/ui-comparison-report.md`
- `research/cline/design-system-comparison.md`
- `research/codeX/admin-chat-system-vs-current-admin-ui-design-system-comparison.md`
- `research/claude_code/ui-design-system-comparison.md`
- `research/kilo_code/ui-design-system-comparison.md`
- `research/kimi_code/ui-design-system-comparison.md`
- `research/open_code/design-system-comparison.md`

---

*Merged from 6 agent comparison reports on 2026-02-15*
