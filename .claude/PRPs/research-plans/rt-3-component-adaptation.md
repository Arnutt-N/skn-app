## Component Adaptation Guide

### Part A: Classification Summary

| Component | File | Lines | Difficulty | Token Changes | Structural Changes | Risk |
|---|---|---:|---|---|---|---|
| Table/DataTable | `examples/admin-chat-system/components/ui/table.tsx` | 107 | MINOR | 2 | Add standalone `Table` primitive set | LOW |
| Popover | `examples/admin-chat-system/components/ui/popover.tsx` | 25 | MODERATE | 3 | Add Radix popover primitives + motion class adaptation | MEDIUM |
| Form | `examples/admin-chat-system/components/ui/form.tsx` | 153 | MODERATE | 2 | Add RHF context primitives (`FormField`, `FormControl`, etc.) | MEDIUM |
| Sheet | `examples/admin-chat-system/components/ui/sheet.tsx` | 126 | MAJOR | 6 | Add Radix dialog-based side panel primitive + side variants | MEDIUM |
| Pagination | `examples/admin-chat-system/components/ui/pagination.tsx` | 107 | MINOR | 0 | Adapt to current `Button` variant contract | LOW |
| Chart | `examples/admin-chat-system/components/ui/chart.tsx` | 329 | MAJOR | 8+ | Add chart container/legend/tooltip system + runtime CSS vars | MEDIUM |
| Calendar/DatePicker | `examples/admin-chat-system/components/ui/calendar.tsx` | 61 | MODERATE | 7 | Add DayPicker wrapper + map day state classes to current tokens | MEDIUM |
| Accordion | `examples/admin-chat-system/components/ui/accordion.tsx` | 50 | MINOR | 0 | Add Radix accordion + keyframe mapping | LOW |
| Command Palette | `examples/admin-chat-system/components/ui/command.tsx` | 136 | MAJOR | 6 | Add `cmdk` + dialog wrapper compatible with current modal strategy | HIGH |
| Textarea | `examples/admin-chat-system/components/ui/textarea.tsx` | 19 | DROP-IN | 4 | Add standalone `Textarea` primitive | LOW |

Current conventions reviewed:
- `frontend/components/ui/Button.tsx`
- `frontend/components/ui/Card.tsx`
- `frontend/components/ui/Modal.tsx`
- `frontend/app/globals.css`

---

### Per-Component Guide

#### 1. Table/DataTable

- Source: `examples/admin-chat-system/components/ui/table.tsx`
- Radix imports: none
- Key non-local imports: `react`
- Recommended target path: `frontend/components/ui/Table.tsx`
- Difficulty: **MINOR**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `bg-muted/50` | `bg-gray-50` |
| `text-muted-foreground` | `text-text-secondary` |

Structural changes:
- Keep component family (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`) intact.
- Keep semantic HTML and overflow wrapper.

#### 2. Popover

- Source: `examples/admin-chat-system/components/ui/popover.tsx`
- Radix imports: `@radix-ui/react-popover`
- Recommended target path: `frontend/components/ui/Popover.tsx`
- Difficulty: **MODERATE**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `bg-popover` | `bg-surface` |
| `text-popover-foreground` | `text-text-primary` |
| `border` | `border border-border-default` |

Structural changes:
- Keep `Popover`, `PopoverTrigger`, `PopoverContent`.
- Replace shadcn v3 motion utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) with existing classes from `globals.css` (for example `animate-scale-in` + directional slide utility if needed).

#### 3. Form

- Source: `examples/admin-chat-system/components/ui/form.tsx`
- Radix imports: `@radix-ui/react-label`, `@radix-ui/react-slot`
- Non-Radix imports: `react-hook-form`
- Recommended target path: `frontend/components/ui/Form.tsx`
- Difficulty: **MODERATE**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `text-destructive` | `text-danger` |
| `text-muted-foreground` | `text-text-secondary` |

Structural changes:
- Preserve context structure: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`.
- Keep ID/ARIA linkage logic exactly (this is behavior-critical).
- Align import casing to current component naming (`Label` from `@/components/ui/Label` if enforcing current style).

#### 4. Sheet

- Source: `examples/admin-chat-system/components/ui/sheet.tsx`
- Radix imports: `@radix-ui/react-dialog`
- Recommended target path: `frontend/components/ui/Sheet.tsx`
- Difficulty: **MAJOR**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `bg-background` | `bg-surface` |
| `text-foreground` | `text-text-primary` |
| `text-muted-foreground` | `text-text-secondary` |
| `ring-ring` | `ring-brand-500` |
| `ring-offset-background` | `ring-offset-surface` |
| `bg-secondary` | `bg-gray-100` |

Structural changes:
- Keep side variants (`top`, `bottom`, `left`, `right`) via CVA.
- Replace shadcn motion classes (`animate-in`, `slide-in-from-*`, `fade-in-0`) with v4-safe utility mapping.
- Preserve close button semantics and focus behavior.

#### 5. Pagination

- Source: `examples/admin-chat-system/components/ui/pagination.tsx`
- Radix imports: none
- Recommended target path: `frontend/components/ui/Pagination.tsx`
- Difficulty: **MINOR**

Token substitutions:
- None required directly in this file.

Structural changes:
- Keep shadcn component structure.
- Adapt `buttonVariants` calls to current button variants/sizes:
  - Example uses `outline`/`ghost`; current supports both but sizing names differ (`md`, `icon`, etc.).

#### 6. Chart

- Source: `examples/admin-chat-system/components/ui/chart.tsx`
- Radix imports: none
- External imports: `recharts`
- Recommended target path: `frontend/components/ui/Chart.tsx`
- Difficulty: **MAJOR**

Token substitutions (core set):

| Example | Current Equivalent |
|---|---|
| `text-muted-foreground` | `text-text-secondary` |
| `text-foreground` | `text-text-primary` |
| `bg-background` | `bg-surface` |
| `border-border/50` | `border-border-default/50` |
| `stroke-border` | `stroke-border-default` |
| `fill-muted` | `fill-gray-100` |
| `bg-muted` | `bg-gray-100` |
| chart CSS vars (`--chart-*`) | add in `globals.css` `@theme` |

Structural changes:
- Keep architecture (`ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`, `ChartStyle`).
- Add/align chart tokens in current token system before adopting this file.
- Ensure arbitrary selector classes work under Tailwind v4 (they do, but token names must map).

#### 7. Calendar/DatePicker

- Source: `examples/admin-chat-system/components/ui/calendar.tsx`
- Radix imports: none
- External imports: `react-day-picker`
- Recommended target path: `frontend/components/ui/Calendar.tsx`
- Difficulty: **MODERATE**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `text-muted-foreground` | `text-text-secondary` |
| `bg-accent` | `bg-brand-50` or `bg-gray-100` |
| `text-accent-foreground` | `text-brand-900` or `text-gray-900` |
| `bg-primary` | `bg-brand-500` |
| `text-primary-foreground` | `text-white` |
| `bg-background` | `bg-surface` |
| `border-input` | `border-border-default` |

Structural changes:
- Keep DayPicker wrapper and class map.
- Adapt button variant calls to current `Button` API.
- Validate date-fns compatibility at install time.

#### 8. Accordion

- Source: `examples/admin-chat-system/components/ui/accordion.tsx`
- Radix imports: `@radix-ui/react-accordion`
- Recommended target path: `frontend/components/ui/Accordion.tsx`
- Difficulty: **MINOR**

Token substitutions:
- None mandatory (uses structural classes mostly).

Structural changes:
- Keep `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
- Add `accordion-up/down` keyframes in current CSS tokens/utilities or replace with existing transitions.

#### 9. Command Palette

- Source: `examples/admin-chat-system/components/ui/command.tsx`
- Radix imports: `@radix-ui/react-dialog` (type + dialog composition via shadcn dialog)
- External imports: `cmdk`
- Recommended target path: `frontend/components/ui/Command.tsx`
- Difficulty: **MAJOR**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `bg-popover` | `bg-surface` |
| `text-popover-foreground` | `text-text-primary` |
| `text-muted-foreground` | `text-text-secondary` |
| `bg-border` | `bg-border-default` |
| `bg-accent` | `bg-brand-50` / `bg-gray-100` |
| `text-accent-foreground` | `text-brand-900` / `text-gray-900` |

Structural changes:
- Decide one of:
  - Introduce Radix-based `Dialog` primitive compatible with shadcn command pattern.
  - Or rewrap `cmdk` inside current `Modal` API (larger adaptation).
- Keep keyboard interaction and selection semantics from `cmdk`.

#### 10. Textarea

- Source: `examples/admin-chat-system/components/ui/textarea.tsx`
- Radix imports: none
- Recommended target path: `frontend/components/ui/Textarea.tsx`
- Difficulty: **DROP-IN**

Token substitutions:

| Example | Current Equivalent |
|---|---|
| `border-input` | `border-border-default` |
| `bg-background` | `bg-surface` |
| `placeholder:text-muted-foreground` | `placeholder:text-text-tertiary` |
| `focus-visible:ring-ring` | `focus-visible:ring-brand-500` |

Structural changes:
- Keep forwardRef API identical.
- Match current shape (`rounded-xl`/`rounded-lg`) to design token conventions.

---

## Live Chat UX Micro-Pattern Changes

### 1. Message Bubble Corner-Cut
**File**: `frontend/app/admin/live-chat/_components/MessageBubble.tsx`  
**Status**: Already implemented (corner-cut exists for incoming/outgoing states).  
**Old -> New (no-op, evidence-preserving):**

```tsx
className={`relative px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm ${incoming
    ? 'rounded-tl-sm bg-gray-100 text-text-primary'
    : isBot
      ? 'rounded-tr-sm bg-gray-200 text-text-primary'
      : 'rounded-tr-sm bg-brand-600 text-white'
  }`}
```

```tsx
className={`relative px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm ${incoming
    ? 'rounded-tl-sm bg-gray-100 text-text-primary'
    : isBot
      ? 'rounded-tr-sm bg-gray-200 text-text-primary'
      : 'rounded-tr-sm bg-brand-600 text-white'
  }`}
```

**Risk**: LOW

### 2. Status Dot Border Ring
**File**: `frontend/app/admin/live-chat/_components/ConversationItem.tsx`  
**Status**: Already implemented (`absolute`, `border-2`, ring via background border token).  
**Old -> New (no-op):**

```tsx
className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-bg ${
  isActive ? 'bg-online' : isWaiting ? 'bg-away' : 'bg-offline'
}`}
```

```tsx
className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-bg ${
  isActive ? 'bg-online' : isWaiting ? 'bg-away' : 'bg-offline'
}`}
```

**Risk**: LOW

### 3. Read Receipt Icons
**File**: `frontend/app/admin/live-chat/_components/MessageBubble.tsx`  
**Status**: Already implemented (`CheckCheck`/`Check` + pending/failed states).  
**Old -> New (no-op):**

```tsx
{!isPending && !isFailed && (
  <span className={message.id ? "text-brand-600" : "text-text-tertiary"}>
    {message.id ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
  </span>
)}
```

```tsx
{!isPending && !isFailed && (
  <span className={message.id ? "text-brand-600" : "text-text-tertiary"}>
    {message.id ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
  </span>
)}
```

**Risk**: LOW

### 4. Toast Slide Animation
**File**: `frontend/app/admin/live-chat/_components/NotificationToast.tsx`  
**Status**: Already implemented (`toast-slide` present).  
**Old -> New (no-op):**

```tsx
className="toast-slide relative flex w-80 items-start gap-3 rounded-xl border border-border-default bg-surface p-4 shadow-xl"
```

```tsx
className="toast-slide relative flex w-80 items-start gap-3 rounded-xl border border-border-default bg-surface p-4 shadow-xl"
```

**Risk**: LOW

### 5. Vibration API
**File**: `frontend/hooks/useNotificationSound.ts`  
**Old -> New:**

```ts
oscillator.stop(ctx.currentTime + 0.3);
```

```ts
oscillator.stop(ctx.currentTime + 0.3);
if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
  navigator.vibrate(200);
}
```

**Risk**: LOW

### 6. Status Dot Size Standardization (`h-3 w-3`)
**Files**:
- `frontend/app/admin/live-chat/_components/CustomerPanel.tsx`
- `frontend/app/admin/live-chat/_components/ConversationList.tsx`

**Old -> New (CustomerPanel):**

```tsx
<div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface ${isActive ? 'bg-online' : isWaiting ? 'bg-away' : 'bg-offline'}`} />
```

```tsx
<div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${isActive ? 'bg-online' : isWaiting ? 'bg-away' : 'bg-offline'}`} />
```

**Old -> New (ConversationList summary bar):**

```tsx
<span className="w-2 h-2 rounded-full bg-online" />
<span className="w-2 h-2 rounded-full bg-away" />
<span className="w-2 h-2 rounded-full bg-offline" />
```

```tsx
<span className="h-3 w-3 rounded-full bg-online" />
<span className="h-3 w-3 rounded-full bg-away" />
<span className="h-3 w-3 rounded-full bg-offline" />
```

**Risk**: LOW

