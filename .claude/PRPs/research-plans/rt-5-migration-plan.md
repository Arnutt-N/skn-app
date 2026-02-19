## RT-5: Migration Plan + Token Patch + Validation Playbook

Date: 2026-02-15  
Scope: Synthesize Wave 1 outputs (`rt-2`, `rt-3`, `rt-4`) + merged comparison ground truth into an execution-ready migration plan.

---

## Deliverable 1: Token CSS Patch (Exact)

Target file: `frontend/app/globals.css` inside existing `@theme { ... }` block.

```css
  /* --- Migration Tokens: chart, accent, sidebar active text, shadcn aliases --- */

  /* Accent token family (example parity: 162 72% 45%) */
  --color-accent: hsl(162 72% 45%);
  --color-accent-light: hsl(162 66% 58%);
  --color-accent-dark: hsl(162 76% 32%);
  --color-accent-text: hsl(162 80% 24%);

  /* Chart tokens (purple-led palette, analytics-safe contrast) */
  --color-chart-1: hsl(262 83% 66%); /* brand-500 */
  --color-chart-2: hsl(263 70% 50%); /* brand-text */
  --color-chart-3: hsl(162 72% 45%); /* accent */
  --color-chart-4: hsl(38 92% 50%);  /* warning */
  --color-chart-5: hsl(217 91% 60%); /* info */

  /* Sidebar active item tokens */
  --color-sidebar-primary: hsl(262 83% 58%);
  --color-sidebar-primary-fg: hsl(0 0% 100%);
  --sidebar-primary-fg: hsl(0 0% 100%); /* alias requested by plan */

  /* Migration alias tokens for imported shadcn-style classes */
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(221 39% 11%);
  --color-muted: hsl(220 14% 96%);
  --color-muted-foreground: hsl(215 14% 34%);
  --color-input: hsl(220 13% 91%);
  --color-ring: hsl(262 83% 66%);
```

Notes:
- This patch adds required tokens from the research plan:
  - `--chart-1` .. `--chart-5` (as `--color-chart-*` tokens)
  - accent token family
  - sidebar active text token (`--sidebar-primary-fg` and color-prefixed form)
- Aliases reduce adaptation effort for shadcn-style classnames (`bg-popover`, `text-muted-foreground`, `border-input`, `ring-ring`).

---

## Deliverable 2: 6-Phase Migration Plan

### Non-Negotiable Guardrails

1. Do not replace high-usage custom components:
   - `Button`, `Card`, `Badge`, `Toast`, `Modal`, `ModalAlert`, inline admin sidebar.
2. Only ADD net-new primitives (10 target components), no breaking API changes.
3. Keep Tailwind v4 CSS-first model (`@theme`, existing animation utilities).
4. No backend, WebSocket protocol, or Zustand architecture changes.

### Never-Touch List (from merged consensus)

- `frontend/components/ui/Button.tsx`
- `frontend/components/ui/Card.tsx`
- `frontend/components/ui/Badge.tsx`
- `frontend/components/ui/Toast.tsx`
- `frontend/components/ui/Modal.tsx`
- `frontend/components/ui/ModalAlert.tsx`
- `frontend/app/admin/layout.tsx` (sidebar architecture)
- Domain-specific live chat/admin components unless explicitly listed in Phase 3.

---

### Phase 0: Prerequisites

Components in scope: none (foundation only)

Exact steps:
1. Install required packages (from `rt-2`):
   - `@radix-ui/react-popover`
   - `@radix-ui/react-dialog`
   - `@radix-ui/react-accordion`
   - `@radix-ui/react-label`
   - `@radix-ui/react-slot`
   - `react-hook-form`
   - `@hookform/resolvers`
   - `zod`
   - `react-day-picker`
   - `date-fns`
   - `cmdk`
2. Apply token patch from Deliverable 1 to `frontend/app/globals.css`.
3. Create checkpoint commit: `phase-0-prerequisites`.

Rollback procedure:
1. Revert checkpoint commit: `git revert <phase-0-commit>`
2. If needed, uninstall new deps from `frontend/package.json` and lockfile by reverting commit only (no manual reset).

Success criteria:
1. `frontend` installs cleanly.
2. Build and lint pass.
3. New tokens are present in `globals.css`.

---

### Phase 1: Zero-Risk Component Additions (Net-New Only)

Components:
- `Table`
- `Pagination`
- `Textarea`

Exact steps:
1. Add files:
   - `frontend/components/ui/Table.tsx`
   - `frontend/components/ui/Pagination.tsx`
   - `frontend/components/ui/Textarea.tsx`
2. Export from:
   - `frontend/components/ui/index.ts`
3. Use current token mapping (`muted -> gray/text-secondary`, `input -> border-default`, `ring -> brand-500`).
4. No page-level adoption yet; keep this phase additive.
5. Create checkpoint commit: `phase-1-zero-risk-components`.

Rollback procedure:
1. Revert `phase-1` commit.
2. Confirm `index.ts` exports restored.

Success criteria:
1. New files compile with no TS errors.
2. Existing admin pages unchanged visually/functionally.
3. No import count increase on high-usage components (`Button`, `Card`) caused by breaking changes.

---

### Phase 2: Low-Risk Component Additions (Gated)

Components:
- Low-risk tranche: `Popover`, `Form`, `Accordion`, `Calendar`
- Gated tranche (after low-risk pass): `Sheet`, `Chart`, `Command`

Exact steps:
1. Implement low-risk tranche first:
   - `frontend/components/ui/Popover.tsx`
   - `frontend/components/ui/Form.tsx`
   - `frontend/components/ui/Accordion.tsx`
   - `frontend/components/ui/Calendar.tsx`
2. Adapt classnames to Tailwind v4-safe utilities and current token names.
3. Add gated tranche:
   - `frontend/components/ui/Sheet.tsx`
   - `frontend/components/ui/Chart.tsx`
   - `frontend/components/ui/Command.tsx`
4. For `Command`, choose and document one integration path:
   - Radix dialog primitive path (preferred), or
   - wrapper around existing modal contract.
5. Update `frontend/components/ui/index.ts` exports.
6. Create checkpoint commit: `phase-2-low-risk-and-gated-components`.

Rollback procedure:
1. If low-risk tranche fails: revert low-risk commit only.
2. If gated tranche fails: revert gated commit and keep low-risk tranche.
3. Never rollback by deleting unrelated files; revert commits only.

Success criteria:
1. All seven components compile.
2. No regressions in existing pages (lint/build clean).
3. `Chart` renders with new chart tokens.
4. `Command` opens/closes without breaking focus behavior.

---

### Phase 3: Live Chat UX Micro-Patterns

Changes (from `rt-3`):
1. Message bubble corner-cut: already implemented (verify-only).
2. Status dot border ring: already implemented in key locations (verify-only).
3. Read receipt icons: already implemented (verify-only).
4. Toast slide animation: already implemented (verify-only).
5. Add vibration API in `frontend/hooks/useNotificationSound.ts`.
6. Standardize status-dot sizes to `h-3 w-3` where still divergent:
   - `frontend/app/admin/live-chat/_components/CustomerPanel.tsx` (`w-4 h-4` -> `h-3 w-3`)
   - `frontend/app/admin/live-chat/_components/ConversationList.tsx` summary dots (`w-2 h-2` -> `h-3 w-3`)

Exact steps:
1. Apply only pending diffs (items 5 and 6) plus verification pass for items 1-4.
2. Validate no accessibility regression for toast/live regions.
3. Create checkpoint commit: `phase-3-live-chat-micro-patterns`.

Rollback procedure:
1. Revert `phase-3` commit if any chat behavior regresses.
2. Re-test WebSocket chat send/receive and notification behavior after rollback.

Success criteria:
1. New message sound includes optional vibration on supported devices.
2. Status dot size is consistent in live chat surfaces.
3. No chat flow regression in `/admin/live-chat`.

---

### Phase 4: Documentation Deliverables

Required docs deliverables (4 named + typography recipes):
1. `frontend/docs/design-system-cookbook.md`
2. `frontend/docs/live-chat-pattern-appendix.md`
3. `frontend/docs/design-system-parity-matrix.md`
4. `frontend/docs/design-system-scope-boundaries.md`
5. Update typography recipes section in `frontend/docs/design-system-unified.md`

Exact steps:
1. Add component usage recipes for new and existing UI primitives.
2. Add live chat micro-pattern standard with exact class patterns.
3. Add parity matrix:
   - Example section -> current component/path -> status (adopted/deferred/out-of-scope).
4. Add scope boundaries document to protect never-touch areas.
5. Create checkpoint commit: `phase-4-docs`.

Rollback procedure:
1. Revert doc-only commit if inconsistencies found.
2. Reapply corrected docs in a new commit.

Success criteria:
1. All four documents exist and are internally consistent.
2. Typography recipe table exists and matches implemented tokens/utilities.
3. Onboarding clarity improves (new contributors can map components quickly).

---

### Phase 5: Cleanup and Audit

Components in scope:
- Audit all newly added primitives and integrations.
- Verify zero-impact on KEEP and MATCH classes.

Exact steps:
1. Run full lint/build/type checks.
2. Re-run import impact scan for new components.
3. Review zero-import list from `rt-4` and explicitly mark:
   - intentional placeholders vs dead code candidates.
4. Prepare release note for migration scope + deferred items.
5. Create checkpoint commit: `phase-5-cleanup-audit`.

Rollback procedure:
1. Revert latest failing phase commit.
2. Keep prior phase checkpoints intact.

Success criteria:
1. All automated checks pass.
2. Visual QA passes all required admin pages.
3. Deferred items are documented with reasons.

---

## Deliverable 3: Validation Playbook

### A. Automated Checks Per Phase (Exact Commands)

Run in WSL, from `frontend/` unless noted.

Phase 0:
```bash
npm install
rg -n -- '--color-chart-1|--color-chart-5|--color-accent|--sidebar-primary-fg|--color-sidebar-primary-fg' app/globals.css
npm run lint
npx tsc -p tsconfig.json --noEmit
npm run build
```

Phase 1:
```bash
npm run lint -- components/ui/Table.tsx components/ui/Pagination.tsx components/ui/Textarea.tsx components/ui/index.ts
npx tsc -p tsconfig.json --noEmit
npm run build
```

Phase 2:
```bash
npm run lint -- components/ui/Popover.tsx components/ui/Form.tsx components/ui/Accordion.tsx components/ui/Calendar.tsx components/ui/Sheet.tsx components/ui/Chart.tsx components/ui/Command.tsx components/ui/index.ts
npx tsc -p tsconfig.json --noEmit
npm run build
```

Phase 3:
```bash
npm run lint -- app/admin/live-chat/_components/CustomerPanel.tsx app/admin/live-chat/_components/ConversationList.tsx hooks/useNotificationSound.ts
npx tsc -p tsconfig.json --noEmit
npm run build
```

Phase 4:
```bash
npm run lint
npx tsc -p tsconfig.json --noEmit
```

Phase 5 (full gate):
```bash
npm run lint
npx tsc -p tsconfig.json --noEmit
npm run build
```

### B. Visual QA Checklist (16 Admin Pages)

Validate each page for:
- no runtime error
- no hydration warning
- no console error
- no token/class fallback artifacts
- status colors, spacing, typography intact

Routes:
1. `/admin`
2. `/admin/live-chat`
3. `/admin/live-chat/analytics`
4. `/admin/requests`
5. `/admin/friends`
6. `/admin/chatbot`
7. `/admin/auto-replies`
8. `/admin/rich-menus`
9. `/admin/settings`
10. `/admin/analytics`
11. `/admin/audit`
12. `/admin/users`
13. `/admin/files`
14. `/admin/reports`
15. `/admin/logs`
16. `/admin/design-system`

Live-chat-specific checks (`/admin/live-chat`):
1. Conversation list status dots are consistent (`h-3 w-3` where standardized).
2. Message bubbles retain corner-cut/read receipt behavior.
3. Toast uses slide animation.
4. Notification sound still works; vibration triggers on supported devices.

### C. Rollback Triggers

Trigger immediate rollback for current phase if any occurs:
1. `npm run build` fails.
2. Type check fails with new errors from touched files.
3. Any KEEP component behavior regresses (`Button`, `Card`, `Badge`, `Modal`, `Toast`).
4. Live chat send/receive flow breaks.
5. Visual QA finds blocking layout break on any of 16 routes.

### D. Final Acceptance Criteria

1. All 10 target components are either implemented or explicitly deferred in docs with reasons.
2. Token patch is present and consumed by at least one chart implementation.
3. No regressions in high-usage components (`Button`, `Card`).
4. `lint`, `tsc --noEmit`, and `build` all pass.
5. Visual QA passes on all 16 admin pages.
6. Documentation deliverables exist and match shipped behavior.

---

## Deferred / Out-of-Scope for This Migration

1. Full shadcn generator adoption.
2. Tailwind v3 plugin conventions (`tailwindcss-animate`).
3. Backend or WebSocket protocol changes.
4. Replacing stronger existing CVA components.

