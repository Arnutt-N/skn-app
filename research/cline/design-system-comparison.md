# Design System Comparison

## Example Admin Chat System vs Current Frontend (skn-app)

---

## Overview

| Aspect | Example Design System | Current Frontend (skn-app) |
|--------|----------------------|---------------------------|
| **Source** | `examples/admin-chat-system/docs/ui-design-system.md` | `frontend/app/globals.css` + `components/ui/` |
| **Components** | 64 sections (shadcn/ui based) | 25 custom components |
| **Framework** | Radix UI + shadcn/ui | Custom components |
| **Tailwind** | v4 CSS variables | v4 CSS variables (disabled config) |
| **Font** | Noto Sans Thai | Noto Sans Thai |

---

## Design Tokens Comparison

### Status Colors (Identical โ…)

Both systems use the same HSL values for live chat status:

| Status | HSL Value | Token Name |
|--------|-----------|------------|
| Online | `hsl(142 71% 45%)` | `--color-online` |
| Away | `hsl(38 92% 50%)` | `--color-away` |
| Busy | `hsl(0 84% 60%)` | `--color-busy` |
| Offline | `hsl(220 10% 46%)` | `--color-offline` |

### Brand Colors (Different ๐จ)

| Color | Example | Current |
|-------|---------|---------|
| Primary | `217 91% 60%` (blue) | `262 83% 66%` (purple) |
| Accent | `162 72% 45%` (teal/green) | N/A |

### Sidebar Theme

- **Example**: Semi-dark sidebar with `--sidebar-*` tokens
- **Current**: Has `--sidebar-bg`, `--sidebar-fg`, `--sidebar-muted`, `--sidebar-accent`, `--sidebar-border` โ…

### Shadows

- **Example**: Standard Tailwind shadows
- **Current**: Extended with glow effects (`--shadow-glow`, `--shadow-glow-sm`, `--shadow-glow-lg`) โจ

---

## Component Comparison

| Component | Example | Current |
|-----------|---------|---------|
| Accordion | โ… Radix-based | โ Missing |
| Alert | โ… | โ… |
| Alert Dialog | โ… | โ… (ModalAlert) |
| Avatar | โ… | โ… |
| Badge | โ… | โ… |
| Button | โ… | โ… |
| Calendar | โ… | โ Missing |
| Card | โ… | โ… |
| Carousel | โ… | โ Missing |
| Chart | โ… (Recharts) | โ Missing |
| Checkbox | โ… | โ… |
| Command Palette | โ… | โ Missing |
| Context Menu | โ… | โ Missing |
| Dialog | โ… | โ… (Modal) |
| Drawer | โ… | โ Missing |
| Dropdown Menu | โ… | โ… |
| Form | โ… (react-hook-form + zod) | โ… (basic) |
| Hover Card | โ… | โ Missing |
| Input | โ… | โ… |
| Label | โ… | โ… |
| Loading/Spinner | โ… | โ… |
| Menubar | โ… | โ Missing |
| Navigation Menu | โ… | โ Missing |
| Pagination | โ… | โ Missing |
| Popover | โ… | โ Missing |
| Progress | โ… | โ… |
| Radio Group | โ… | โ… |
| Resizable Panels | โ… | โ Missing |
| Scroll Area | โ… | โ Missing |
| Select | โ… | โ… |
| Separator | โ… | โ… |
| Sheet | โ… | โ Missing |
| Sidebar | โ… | โ Missing |
| Skeleton | โ… | โ… |
| Slider | โ… | โ Missing |
| Switch | โ… | โ… |
| Table | โ… | โ Missing |
| Tabs | โ… | โ… |
| Textarea | โ… | โ Missing |
| Toast | โ… (sonner + shadcn) | โ… (custom) |
| Toggle | โ… | โ Missing |
| Tooltip | โ… | โ… |

**Current has 25 custom components** vs **Example has 60+ shadcn components**

---

## Animation Comparison

Both systems include similar animations:

| Animation | Example | Current |
|-----------|---------|---------|
| fade-in | โ… | โ… |
| fade-in-up | โ… | โ… |
| scale-in | โ… | โ… |
| slide-in-right | โ… | โ… |
| typing-dot / typing-bounce | โ… | โ… |
| blink-badge | โ… | โ… |
| shimmer | โ… | โ… |
| toast-slide | โ… | โ… |
| custom-scrollbar | โ… | โ… |
| pulse-glow | โ | โ… |
| float | โ | โ… |
| bounce-subtle | โ | โ… |
| shake | โ | โ… |
| ping | โ | โ… |

---

## Layout Patterns

### Example (3-Column + 4th)

```tsx
<div className="flex h-screen w-screen overflow-hidden">
  <AdminSidebar />      // Col 1: 68px-220px collapsible
  <UserListPanel />    // Col 2: w-80 (320px) fixed
  <ChatRoom />         // Col 3: flex-1 remaining
  {isProfileOpen && <UserProfilePanel />}  // Col 4: w-80
</div>
```

### Current (Custom)

- Has design system classes: `ds-page`, `ds-panel`, `ds-panel-header`, `ds-panel-body`, `ds-hero`, `ds-kpi`, `ds-section-title`
- No predefined chat layout in design tokens

---

## Typography

Both use **Noto Sans Thai** with similar type scale:

- **Example**: H1-H6, Body, Caption, Micro
- **Current**: Fluid typography with `clamp()` functions

---

## Key Differences Summary

| Area | Example Strengths | Current Strengths |
|------|------------------|-------------------|
| **Components** | 60+ ready components | 25 custom, lighter bundle |
| **3rd Party** | Radix UI, shadcn/ui | Custom implementation |
| **Layout** | Pre-built chat layout | Flexible design tokens |
| **Theme** | Standard shadcn | Extended shadows/glows |
| **Forms** | Full react-hook-form + zod | Basic form support |
| **Specialized** | Video call, emoji picker | Thai text handling |

---

## Recommendations for Alignment

1. **Import missing shadcn components**: Accordion, Calendar, Carousel, Chart, Command, Context Menu, Drawer, Navigation Menu, Resizable
2. **Adopt Example's layout pattern** for live chat admin interface
3. **Align status color tokens** - already aligned โ…
4. **Consider form validation** with react-hook-form + zod from example
5. **Add sidebar tokens** to globals.css if building admin dashboard
6. **Use example's specialized components**: Video call modal, Emoji picker, Sticker grid

---

## Files Reference

### Example Design System
- `examples/admin-chat-system/docs/ui-design-system.md`
- Components located in similar pattern to shadcn/ui

### Current Frontend
- Design tokens: `frontend/app/globals.css`
- Tailwind config: `frontend/tailwind.config.js` (disabled for v4)
- Components: `frontend/components/ui/`
- Admin components: `frontend/components/admin/`

---

*Last compared: February 15, 2026*
