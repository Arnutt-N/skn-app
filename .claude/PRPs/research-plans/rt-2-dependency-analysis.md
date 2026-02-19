## Dependency Analysis Report

### Scope
Target components (10): Table/DataTable, Popover, Form, Sheet, Pagination, Chart, Calendar/DatePicker, Accordion, Command Palette, Textarea.

Evidence sources used:
- `examples/admin-chat-system/package.json`
- `frontend/package.json`
- `examples/admin-chat-system/components/ui/{table,popover,form,sheet,pagination,chart,calendar,accordion,command,textarea}.tsx`
- `examples/admin-chat-system/tailwind.config.ts`
- `examples/admin-chat-system/components.json`

---

### Example vs Current Package Comparison

| Package | Example Version | Current Version | Status |
|---|---:|---:|---|
| `@radix-ui/react-accordion` | `1.2.2` | - | Missing in current |
| `@radix-ui/react-popover` | `1.1.4` | - | Missing in current |
| `@radix-ui/react-dialog` | `1.1.4` | - | Missing in current |
| `@radix-ui/react-label` | `2.1.1` | - | Missing in current |
| `@radix-ui/react-slot` | `1.1.1` | - | Missing in current |
| `react-hook-form` | `^7.54.1` | - | Missing in current |
| `@hookform/resolvers` | `^3.9.1` | - | Missing in current |
| `zod` | `^3.24.1` | - | Missing in current |
| `cmdk` | `1.1.1` | - | Missing in current |
| `react-day-picker` | `8.10.1` | - | Missing in current |
| `date-fns` | `4.1.0` | - | Missing in current |
| `recharts` | `2.15.0` | `^2.15.0` | Already installed (compatible range) |
| `class-variance-authority` | `^0.7.1` | `^0.7.1` | Match |
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version differs, API used here is available |
| `tailwindcss-animate` | `^1.0.7` | - | Missing (and tied to v3 patterns) |

Notes:
- Example uses Tailwind v3 config-driven approach (`tailwind.config.ts` + `tailwindcss-animate` plugin).
- Current frontend is Tailwind v4 CSS-first (`@theme` in `frontend/app/globals.css`), so shadcn v3 utility classes like `animate-in`, `fade-in-0`, `slide-in-from-*` must be adapted.

---

### Per-Component Analysis

#### 1. Table/DataTable

Component source: `examples/admin-chat-system/components/ui/table.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `react` | `19.2.3` | `19.2.3` | OK | Core only |
| `@/lib/utils` (`cn`) | internal | internal | OK | Existing utility |

- Tailwind v4 compatibility: **yes**
- Risk level: **LOW**
- Component source file analysis: no Radix; basic semantic table wrappers.

#### 2. Popover

Component source: `examples/admin-chat-system/components/ui/popover.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `@radix-ui/react-popover` | `1.1.4` | - | Missing | Required for primitives |
| `react` | `19.2.3` | `19.2.3` | OK | Core |

- Tailwind v4 compatibility: **needs-adaptation**
- Risk level: **MEDIUM**
- Component source file analysis: class list uses shadcn v3 animation utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) not present by default in current setup.

#### 3. Form (react-hook-form + zod)

Component source: `examples/admin-chat-system/components/ui/form.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `react-hook-form` | `^7.54.1` | - | Missing | Core dependency |
| `@radix-ui/react-label` | `2.1.1` | - | Missing | Used for typed refs |
| `@radix-ui/react-slot` | `1.1.1` | - | Missing | Used by `FormControl` |
| `zod` | `^3.24.1` | - | Missing | Needed for schema-validation workflow |
| `@hookform/resolvers` | `^3.9.1` | - | Missing | Needed for zod resolver pattern |

- Tailwind v4 compatibility: **yes** (token/class mapping required)
- Risk level: **MEDIUM**
- Component source file analysis: no motion/plugin coupling; mostly context/ID wiring and `aria-*` behavior.

#### 4. Sheet

Component source: `examples/admin-chat-system/components/ui/sheet.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `@radix-ui/react-dialog` | `1.1.4` | - | Missing | Required |
| `class-variance-authority` | `^0.7.1` | `^0.7.1` | OK | Already installed |
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version diff | Icons used are available |

- Tailwind v4 compatibility: **needs-adaptation**
- Risk level: **MEDIUM**
- Component source file analysis: relies on v3 animation utilities and tokens (`bg-background`, `ring-ring`, `bg-secondary`) that need mapping to current tokens.

#### 5. Pagination

Component source: `examples/admin-chat-system/components/ui/pagination.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version diff | Icons used are available |
| `@/components/ui/button` | internal | internal | Partial | Depends on button variant names; adaptation needed |

- Tailwind v4 compatibility: **yes**
- Risk level: **LOW**
- Component source file analysis: no Radix; mostly wrapper around existing button variant system.

#### 6. Chart (Recharts)

Component source: `examples/admin-chat-system/components/ui/chart.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `recharts` | `2.15.0` | `^2.15.0` | OK | Already installed |
| `react` | `19.2.3` | `19.2.3` | OK | Core |

- Tailwind v4 compatibility: **yes** (token mapping + chart vars needed)
- Risk level: **MEDIUM**
- Component source file analysis: heavy token usage (`muted`, `border`, `foreground`, `background`) and runtime CSS variable injection for series colors.

#### 7. Calendar/DatePicker

Component source: `examples/admin-chat-system/components/ui/calendar.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `react-day-picker` | `8.10.1` | - | Missing | Required |
| `date-fns` | `4.1.0` | - | Missing | Include for DayPicker ecosystem safety |
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version diff | Icons used are available |

- Tailwind v4 compatibility: **needs-adaptation**
- Risk level: **MEDIUM**
- Component source file analysis: token-dense classNames map (`primary`, `accent`, `muted`, etc.) and relies on current Button variant semantics.

#### 8. Accordion

Component source: `examples/admin-chat-system/components/ui/accordion.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `@radix-ui/react-accordion` | `1.2.2` | - | Missing | Required |
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version diff | Icon available |

- Tailwind v4 compatibility: **needs-adaptation**
- Risk level: **LOW**
- Component source file analysis: uses `animate-accordion-up/down`; keyframes must be defined in current CSS token system.

#### 9. Command Palette (cmdk)

Component source: `examples/admin-chat-system/components/ui/command.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `cmdk` | `1.1.1` | - | Missing | Required |
| `@radix-ui/react-dialog` | `1.1.4` | - | Missing | Used via `DialogProps` + dialog composition |
| `lucide-react` | `^0.544.0` | `^0.473.0` | Version diff | Icon available |

- Tailwind v4 compatibility: **needs-adaptation**
- Risk level: **HIGH**
- Component source file analysis: depends on dialog primitive contract that differs from current `Modal` API (`Modal` is not Radix-compatible).

#### 10. Textarea

Component source: `examples/admin-chat-system/components/ui/textarea.tsx`

| Package | Example Version | Current Version | Status | Notes |
|---|---:|---:|---|---|
| `react` | `19.2.3` | `19.2.3` | OK | Core only |
| `@/lib/utils` (`cn`) | internal | internal | OK | Existing utility |

- Tailwind v4 compatibility: **yes**
- Risk level: **LOW**
- Component source file analysis: standalone wrapper; no external package needs.

---

### Summary

| Component | New Packages Needed | Risk | Tailwind v4 Safe |
|---|---|---|---|
| Table/DataTable | none | LOW | yes |
| Popover | `@radix-ui/react-popover` | MEDIUM | needs-adaptation |
| Form | `react-hook-form`, `@hookform/resolvers`, `zod`, `@radix-ui/react-label`, `@radix-ui/react-slot` | MEDIUM | yes |
| Sheet | `@radix-ui/react-dialog` | MEDIUM | needs-adaptation |
| Pagination | none | LOW | yes |
| Chart | none (already has `recharts`) | MEDIUM | yes |
| Calendar/DatePicker | `react-day-picker`, `date-fns` | MEDIUM | needs-adaptation |
| Accordion | `@radix-ui/react-accordion` | LOW | needs-adaptation |
| Command Palette | `cmdk`, `@radix-ui/react-dialog` | HIGH | needs-adaptation |
| Textarea | none | LOW | yes |

---

### Recommended Install Command

Single command for safe additions required by the 10 components:

```bash
npm i @radix-ui/react-popover@1.1.4 @radix-ui/react-dialog@1.1.4 @radix-ui/react-accordion@1.2.2 @radix-ui/react-label@2.1.1 @radix-ui/react-slot@1.1.1 react-hook-form@^7.54.1 @hookform/resolvers@^3.9.1 zod@^3.24.1 react-day-picker@8.10.1 date-fns@4.1.0 cmdk@1.1.1
```

No install needed for `recharts`, `class-variance-authority`, `clsx`, `lucide-react` (already present).

---

### Packages to Avoid or Defer

1. `tailwindcss-animate` (defer)
   - Example relies on this via Tailwind v3 config plugin.
   - Current project uses Tailwind v4 CSS-first; safer to map motion to existing `globals.css` animations than reintroduce v3 plugin conventions.

2. Full shadcn generator workflow (defer)
   - `components.json` expects config-driven setup (`tailwind.config.ts`) and broad primitive generation.
   - Migration scope is only the 10 targeted additions + micro-pattern consistency; keep selective adoption.

