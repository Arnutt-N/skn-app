# Design System Comparison

> **Example**: `examples/admin-chat-system/docs/ui-design-system.md`  
> **Current**: `frontend/docs/design-system-unified.md`  
> **Created**: 2026-02-14

---

## Executive Summary

| Aspect | Example (admin-chat-system) | Current (JSK/SknApp) | Gap Status |
|--------|----------------------------|----------------------|------------|
| **Tailwind** | v3.4.17 + tailwindcss-animate | v4.x (CSS-first) | โ… Current is newer |
| **Colors** | HSL via CSS vars (16 tokens) | HSL via CSS vars (40+ tokens) | โ… Current is more comprehensive |
| **Animations** | 9 keyframe animations | 15+ keyframe animations | โ… Current has more |
| **Components** | 64 documented patterns | ~30 documented patterns | โ ๏ธ Gap: 34 patterns |
| **Status Colors** | 4 (online/away/busy/offline) | 8+ (includes status/chat tokens) | โ… Current is richer |
| **Thai Support** | Noto Sans Thai font | Thai-specific utilities | โ… Current is better |
| **Dark Mode** | Full support | Token-based ready | โ… Comparable |

---

## 1. Color System Comparison

### Example Design System (admin-chat-system)

```css
/* Core Tokens (16) */
--background: 220 20% 97%
--foreground: 220 20% 10%
--card: 0 0% 100%
--primary: 217 91% 60%      /* Blue */
--secondary: 220 14% 92%
--muted: 220 14% 94%
--accent: 162 72% 45%       /* Teal */
--destructive: 0 84% 60%

/* Sidebar Tokens (6) */
--sidebar-background: 222 47% 11%
--sidebar-foreground: 213 31% 91%
--sidebar-primary: 217 91% 60%

/* Status Tokens (4) */
--online: 142 71% 45%
--away: 38 92% 50%
--busy: 0 84% 60%
--offline: 220 10% 46%
```

### Current Design System (JSK/SknApp)

```css
/* Brand Colors (10 shades: 50-900) */
--color-brand-500: hsl(262 83% 66%)  /* Purple (different from example's blue) */
--color-brand-700: hsl(263 70% 50%)

/* Semantic Colors with WCAG AA text variants */
--color-success / --color-success-text
--color-warning / --color-warning-text
--color-danger / --color-danger-text
--color-info / --color-info-text

/* Chat-specific Colors */
--color-chat-user: hsl(210 100% 97%)
--color-chat-admin: hsl(262 100% 97%)
--color-chat-bot: hsl(173 100% 97%)
--color-chat-system: hsl(0 0% 97%)

/* Live Chat Status (8 tokens) */
--color-online: hsl(142 76% 36%)
--color-away: hsl(38 92% 50%)
--color-busy: hsl(0 84% 60%)
--color-offline: hsl(220 9% 46%)
--color-status-waiting: hsl(38 92% 50%)
--color-status-active: hsl(142 76% 36%)
--color-status-closed: hsl(220 9% 46%)
--color-status-bot: hsl(192 91% 37%)

/* Sidebar Tokens */
--color-sidebar-bg: hsl(222 47% 11%)
--color-sidebar-fg: hsl(210 20% 98%)
--color-sidebar-muted: hsl(215 20% 65%)
--color-sidebar-accent: hsl(215 28% 17%)
```

### Color Gap Analysis

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Primary brand color | Blue (217 91% 60%) | Purple (262 83% 66%) | โ ๏ธ Different brand - keep current |
| Accent color | Teal (162 72% 45%) | Info (224 76% 48%) | โ ๏ธ Different - current uses info |
| Status colors | 4 tokens | 8+ tokens | โ… Current is richer |
| WCAG text colors | None | Yes (5 tokens) | โ… Current is better |
| Chat colors | None | Yes (4 tokens) | โ… Current has them |
| Sidebar colors | 6 tokens | 4 tokens | โ ๏ธ Example has more sidebar tokens |

### Recommendation

**Keep current color system** - it's more comprehensive. Only add from example:

```css
/* Add to current system if missing */
--color-sidebar-primary: hsl(262 83% 66%)     /* Active nav item */
--color-sidebar-primary-fg: hsl(0 0% 100%)    /* Text on active nav */
```

---

## 2. Typography Comparison

### Example Typography

| Element | Classes |
|---------|---------|
| Font | Noto Sans Thai (weights: 300-700) |
| H1 | `text-4xl font-bold tracking-tight` |
| Body | `text-sm leading-relaxed` |
| Caption | `text-[10px] font-medium` |
| Micro | `text-[9px] font-semibold` |

### Current Typography

| Feature | Implementation |
|---------|---------------|
| Font | Fluid typography with clamp() |
| Sizes | `--text-xs` to `--text-3xl` (6 fluid sizes) |
| Thai Support | `.thai-text`, `.thai-no-break` utilities |
| Line Height | 1.6 for Thai text |

### Typography Gap Analysis

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Fluid sizing | No | Yes (clamp-based) | โ… Current is better |
| Thai utilities | Font only | Dedicated classes | โ… Current is better |
| Type scale | Tailwind defaults | Custom tokens | โ… Current is better |

### Recommendation

**Keep current typography system** - superior with fluid sizing and Thai support.

---

## 3. Animation System Comparison

### Example Animations (9 keyframes)

```css
/* From globals.css */
typing-bounce      /* Typing indicator dots */
pulse-ring         /* Video call connecting */
slide-in-left      /* Message incoming */
slide-in-right     /* Message outgoing */
blink-badge        /* Notification badge */
fade-in            /* Element appearing */
scale-in           /* Popups/dropdowns */
shimmer            /* Loading skeleton */
toast-slide        /* Toast notification */
```

### Current Animations (15+ keyframes)

```css
/* From globals.css */
fade-in, fade-in-up, fade-in-down
scale-in
slide-in-right, slide-in-left
shine, shimmer
pulse-glow
float
spin
bounce-subtle
shake
ping
typing-bounce
blink-badge
pulse-ring
toast-slide
msg-in, msg-out  /* Chat message animations */
```

### Animation Gap Analysis

| Animation | Example | Current | Action |
|-----------|---------|---------|--------|
| typing-bounce | โ… | โ… | Match |
| pulse-ring | โ… | โ… | Match |
| msg-in/msg-out | slide-in-* | msg-in/msg-out | โ… Comparable |
| blink-badge | โ… | โ… | Match |
| scale-in | โ… | โ… | Match |
| shimmer | โ… | โ… | Match |
| toast-slide | โ… | โ… | Match |
| Additional | - | shine, float, shake, ping, etc. | โ… Current has more |

### Recommendation

**Keep current animation system** - it already includes all example animations plus more.

---

## 4. Component Gap Analysis

### Components in Example (64 documented)

| # | Component | Example | Current | Gap |
|---|-----------|---------|---------|-----|
| 1 | Design Tokens | โ… | โ… | - |
| 2 | Typography | โ… | โ… | - |
| 3 | Colors/Status | โ… | โ… | - |
| 4 | Animations | โ… | โ… | - |
| 5 | Layout System | โ… | โ… | - |
| 6 | Navigation/Sidebar | โ… | โ… | - |
| 7 | Buttons | โ… | โ… | - |
| 8 | Badges | โ… | โ… | - |
| 9 | Cards | โ… | โ… | - |
| 10 | Alerts | โ… | โ… | - |
| 11 | Avatar | โ… | โ… | - |
| 12 | Accordion | โ… | โ | **ADD** |
| 13 | Dropdown Menu | โ… | โ… | - |
| 14 | Dialog/Modal | โ… | โ… | - |
| 15 | Sheet/Offcanvas | โ… | โ | **ADD** |
| 16 | Drawer | โ… | โ | **ADD** |
| 17 | Tabs | โ… | โ… | - |
| 18 | Breadcrumbs | โ… | โ | **ADD** |
| 19 | Pagination | โ… | โ | **ADD** |
| 20 | Progress Bar | โ… | โ… | - |
| 21 | Spinner/Loading | โ… | โ… | - |
| 22 | Skeleton | โ… | โ… | - |
| 23 | Toasts | โ… | โ… | - |
| 24 | Tooltips | โ… | โ… | - |
| 25 | Hover Card | โ… | โ | **ADD** |
| 26 | Input | โ… | โ… | - |
| 27 | Textarea | โ… | โ… | - |
| 28 | Select | โ… | โ… | - |
| 29 | Checkbox | โ… | โ… | - |
| 30 | Radio Group | โ… | โ… | - |
| 31 | Switch | โ… | โ… | - |
| 32 | Slider | โ… | โ | **ADD** |
| 33 | Input OTP | โ… | โ | **ADD** |
| 34 | Label | โ… | โ… | - |
| 35 | Form Validation | โ… | โ | **ADD** |
| 36 | Form Layouts | โ… | Partial | Enhance |
| 37 | Table | โ… | Partial | Enhance |
| 38 | Carousel | โ… | โ | **ADD** |
| 39 | Calendar/DatePicker | โ… | โ | **ADD** |
| 40 | Chart | โ… | โ | **ADD** |
| 41 | Command Palette | โ… | โ | **ADD** |
| 42 | Context Menu | โ… | โ | **ADD** |
| 43 | Menubar | โ… | โ | **ADD** |
| 44 | Navigation Menu | โ… | โ | **ADD** |
| 45 | Scroll Area | โ… | โ… | - |
| 46 | Separator | โ… | โ… | - |
| 47 | Resizable Panels | โ… | โ | **ADD** |
| 48 | Aspect Ratio | โ… | โ | **ADD** |
| 49 | Toggle/Toggle Group | โ… | โ | **ADD** |
| 50 | Collapsible | โ… | โ | **ADD** |
| 51 | Sidebar (shadcn) | โ… | Custom | Different |
| 52 | Landing Page | โ… | โ | **ADD** |
| 53 | Navbar | โ… | โ… | - |
| 54 | Footer | โ… | โ | **ADD** |
| 55 | Dashboard Layout | โ… | โ… | - |
| 56 | Checklist | โ… | โ | **ADD** |
| 57 | Star Rating | โ… | โ | **ADD** |
| 58 | Timeline | โ… | โ | **ADD** |
| 59 | Tour/Onboarding | โ… | โ | **ADD** |
| 60 | Treeview | โ… | โ | **ADD** |
| 61 | Drag and Drop | โ… | โ | **ADD** |
| 62 | Media Player | โ… | โ | **ADD** |
| 63 | Block UI/Overlay | โ… | โ | **ADD** |
| 64 | Miscellaneous | โ… | Partial | Enhance |

### Summary

| Status | Count | Percentage |
|--------|-------|------------|
| โ… Present | 30 | 47% |
| โ Missing | 34 | 53% |
| โ ๏ธ Partial | 4 | 6% |

### Priority Components to Add

For Live Chat migration, prioritize these:

| Priority | Component | Use Case |
|----------|-----------|----------|
| **P0** | Resizable Panels | 3-panel chat layout |
| **P0** | Sheet/Offcanvas | Mobile customer panel |
| **P1** | Hover Card | User profile preview |
| **P1** | Context Menu | Message right-click actions |
| **P1** | Command Palette | Quick actions (Ctrl+K) |
| **P2** | Accordion | Settings sections |
| **P2** | Collapsible | Message groups |
| **P2** | Pagination | Conversation history |
| **P3** | DatePicker | Analytics date range |
| **P3** | Chart | Analytics dashboard |
| **P3** | Timeline | Conversation history |

---

## 5. Pattern Comparison

### 5.1 Chat-Specific Patterns

#### Example: Message Bubble

```tsx
<div className={cn(
  "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
  isAdmin
    ? "rounded-tr-sm bg-primary text-primary-foreground"
    : "rounded-tl-sm bg-muted text-foreground"
)}>
  {/* Content */}
</div>
```

#### Current: Message Bubble

```tsx
// From MessageBubble.tsx
<div className={cn(
  "max-w-[80%] rounded-2xl px-4 py-2",
  isAdmin
    ? "ml-auto bg-brand-500 text-white"
    : "bg-slate-100 text-slate-900"
)}>
  {/* Content */}
</div>
```

#### Gap

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Corner cut | `rounded-tr-sm` / `rounded-tl-sm` | None | **Add** |
| Max width | 65% | 80% | Adjust preference |
| Read receipts | CheckCheck icon | Text status | **Add** |
| Reactions | Display below | None | **Add** |
| Slide animation | `msg-in` / `msg-out` | Present | โ… Match |

### 5.2 Status Indicator

#### Example: Status Dot

```tsx
<span className={cn(
  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
  status === "online" && "bg-online",
  status === "away" && "bg-away",
  status === "busy" && "bg-busy",
  status === "offline" && "bg-offline"
)} />
```

#### Current: Status Dot

```tsx
// Similar pattern exists
<span className={cn(
  "h-2.5 w-2.5 rounded-full",
  status === 'waiting' && "bg-warning-500",
  status === 'active' && "bg-success-500",
  status === 'closed' && "bg-slate-400"
)} />
```

#### Gap

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Border ring | `border-2 border-card` | None | **Add** |
| Position offset | `-bottom-0.5 -right-0.5` | None | **Add** |
| Colors | online/away/busy/offline | waiting/active/closed | Map tokens |

### 5.3 Typing Indicator

#### Example

```tsx
<div className="flex items-center gap-1">
  <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
  <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
  <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
</div>
```

#### Current

```tsx
// From TypingIndicator.tsx
<div className="flex items-center gap-1">
  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
</div>
```

#### Gap

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Animation | Custom `typing-bounce` | Tailwind `animate-bounce` | Either works |
| Delay | CSS nth-child | Inline style | Either works |

### 5.4 Notification Toast

#### Example Features

- Web Audio API for sound
- Vibration API support
- Blinking indicator
- Auto-dismiss 5s
- Slide-in animation

#### Current Features

- Toast provider pattern
- Auto-dismiss
- Variants (success/error/warning/info)

#### Gap

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Sound | Web Audio API | None | **Add** |
| Vibration | navigator.vibrate | None | **Add** |
| Blink animation | `blink-badge` | None | **Add** |
| Slide animation | `toast-slide` | Fade | Update |

---

## 6. Sidebar Comparison

### Example: AdminSidebar

```tsx
// Collapsible: 220px โ’ 68px
// Features:
// - Tooltip on collapsed
// - Active state with glow
// - Badge notifications
// - Admin profile footer
// - Status indicator
```

### Current: Admin Layout Sidebar

```tsx
// From layout.tsx
// Features:
// - Collapsible groups
// - Active state
// - Icon support
// - Nested items
```

#### Gap

| Feature | Example | Current | Action |
|---------|---------|---------|--------|
| Full collapse | Yes (68px) | No | **Add** |
| Tooltip on collapse | Yes | No | **Add** |
| Badge on items | Yes | No | **Add** |
| Admin profile | Footer | Header | Different |

---

## 7. Action Items for Migration

### Phase 1: Essential UI Enhancements

| Task | Effort | Impact |
|------|--------|--------|
| Add corner-cut to message bubbles | Low | High |
| Add read receipts (CheckCheck) | Low | High |
| Add message reactions display | Medium | Medium |
| Add status dot border ring | Low | Medium |
| Update toast with sound/vibration | Medium | High |

### Phase 2: Component Library Expansion

| Component | Effort | Priority |
|-----------|--------|----------|
| Sheet/Offcanvas | Medium | P0 |
| Resizable Panels | Medium | P0 |
| Hover Card | Low | P1 |
| Context Menu | Low | P1 |
| Command Palette | High | P1 |
| Accordion | Low | P2 |
| Collapsible | Low | P2 |
| Pagination | Low | P2 |

### Phase 3: Advanced Components

| Component | Effort | Priority |
|-----------|--------|----------|
| DatePicker | High | P3 |
| Chart (Recharts) | Medium | P3 |
| Timeline | Medium | P3 |
| Carousel | Low | P3 |

---

## 8. Code Examples to Adopt

### Message Bubble with Corner Cut

```tsx
// Add to MessageBubble.tsx
<div className={cn(
  "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
  isAdmin
    ? "rounded-tr-sm bg-brand-500 text-white"
    : "rounded-tl-sm bg-slate-100 text-slate-900"
)}>
  {content}
  
  {/* Read receipt */}
  {isAdmin && (
    <div className="flex items-center gap-1 mt-1 justify-end">
      <span className="text-[10px] opacity-70">{timestamp}</span>
      {isRead ? (
        <CheckCheck className="h-3 w-3 text-brand-400" />
      ) : (
        <Check className="h-3 w-3 opacity-50" />
      )}
    </div>
  )}
</div>
```

### Status Dot with Ring

```tsx
// Add to user avatars
<span className={cn(
  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
  status === 'active' && "bg-online",
  status === 'waiting' && "bg-away",
  status === 'closed' && "bg-offline"
)} />
```

### Notification Toast with Sound

```tsx
// Add to toast provider
const playNotificationSound = () => {
  if (!soundEnabled) return
  try {
    const audioCtx = new AudioContext()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.3)
  } catch {}
  
  if (navigator.vibrate) navigator.vibrate(200)
}
```

---

## 9. Summary

### Strengths of Current System

1. **More comprehensive color tokens** - WCAG AA compliant text colors
2. **Fluid typography** - clamp-based responsive sizing
3. **Thai language support** - Dedicated utilities
4. **More animations** - 15+ vs 9
5. **Chat-specific colors** - Already defined

### Gaps to Fill from Example

1. **34 missing components** - Many are advanced but some are essential
2. **Message UI polish** - Corner cuts, read receipts, reactions
3. **Notification enhancements** - Sound, vibration, blink
4. **Sidebar collapse** - Full collapse with tooltips
5. **Composite patterns** - DataTable, DatePicker, Command Palette

### Recommended Approach

1. **Don't replace** - Current system is solid
2. **Enhance selectively** - Add missing polish patterns
3. **Component library** - Add high-priority missing components
4. **Document patterns** - Create component documentation like example

---

*Comparison completed: 2026-02-14*
