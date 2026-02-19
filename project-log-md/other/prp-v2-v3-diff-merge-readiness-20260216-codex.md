# PRP v2 -> v3 Diff and Merge-Readiness Checklist

Date: 2026-02-16 20:23:30 +07:00  
Branch: `fix/live-chat-redesign-issues`  
Prepared by: Codex

## 1) Scope and Source of Truth

This artifact compares PRP v2 intent to v3 streamlining using the best available repository evidence:

- `project-log-md/open_code/session-summary-20260216-0830.md` (explicit v2 -> v3 change log)
- `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md` (current plan + revision history)

Note: A standalone committed v2 snapshot is not present in the repo; v2 is reconstructed from Open Code's v2-review log.

## 2) Structured Diff: v2 vs v3

| Area | v2 (before streamline) | v3 (streamlined) | Evidence |
|------|-------------------------|------------------|----------|
| Overall strategy | `Document, Standardize, Fill Gaps` | `Verify, Extend, Document` | `project-log-md/open_code/session-summary-20260216-0830.md:69` |
| Phase 1.5 (shared components) | Planned implementation/centralization | Deferred (inline implementations acceptable) | `project-log-md/open_code/session-summary-20260216-0830.md:70` |
| Phase 2 (component adoption) | Broad migration across many routes (9 routes) | Reduced to audit-first, max 3-4 routes | `project-log-md/open_code/session-summary-20260216-0830.md:71` |
| Phase 2.5 (icons) | Implement standardization work | Verify-only | `project-log-md/open_code/session-summary-20260216-0830.md:72` |
| Phase 3 (live chat patterns) | Implement missing patterns | Verify alignment of existing implementations | `project-log-md/open_code/session-summary-20260216-0830.md:73` |
| Phase 4 | Required phase | Made optional | `project-log-md/open_code/session-summary-20260216-0830.md:74` |
| Phase 6 (ESLint automation) | More aggressive enforcement | Simplified to warning-level posture | `project-log-md/open_code/session-summary-20260216-0830.md:75` |
| Estimate | 18-24 hours | 7-10 hours | `project-log-md/open_code/session-summary-20260216-0830.md:76` |

## 3) Current PRP Consistency Snapshot

- Current PRP strategy text is verification-first: `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:59`.
- Current PRP marks Phase 2 deferred to separate branch: `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:165`.
- Revision history confirms v3 streamline record: `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:369`.
- PRP has since progressed to v4 (further scope tightening): `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:370`.

## 4) Merge-Readiness Checklist (Pass/Fail)

Legend: `PASS`, `WARN`, `FAIL`

| Gate | Status | Result | Evidence |
|------|--------|--------|----------|
| Scope gate (live-chat branch discipline) | `WARN` | Non-live-chat admin pages are modified in current working tree (`analytics`, `audit`, `auto-replies`, `requests`) while PRP later defers broad route adoption. | `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:165`, `git status --short` |
| v2 -> v3 rationale documented | `PASS` | Streamline deltas are explicitly captured (strategy, phases, estimate). | `project-log-md/open_code/session-summary-20260216-0830.md:67-76` |
| Phase wording consistency | `PASS` | Verification posture appears in strategy and phase statuses. | `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:59`, `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:151`, `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:182` |
| Deferred-work governance | `PASS` | Deferred items are explicitly tracked for follow-up branch. | `PRPs/codeX/admin-ui-design-system-direct-implementation-v2.md:353-359` |
| Lint gate | `PASS` | `npm run lint` completed successfully in `frontend`. | Command run: `npm run lint` |
| Type-check gate | `PASS` | `npx tsc --noEmit` completed successfully in `frontend`. | Command run: `npx tsc --noEmit` |
| Build gate | `PASS` | `npm run build` completed successfully; routes compiled. | Command run: `npm run build` |
| Icon-library policy | `PASS` | No Heroicons/MUI/Radix icon imports found under admin/components scan. | Command run: `rg -n "@heroicons|@mui/icons|@radix-ui/react-icons|radix-icons" frontend/app/admin frontend/components` |
| Inline SVG cleanup backlog | `WARN` | 3 admin files still contain inline `<svg>`; consistent with deferred cleanup direction. | `frontend/app/admin/auto-replies/[id]/page.tsx`, `frontend/app/admin/rich-menus/[id]/edit/page.tsx`, `frontend/app/admin/rich-menus/new/page.tsx` |
| High-risk UI regression check | `PASS` | Duplicate mobile/no-selection `ConversationList` render was removed from `LiveChatShell`; single conditional render remains for list and chat split logic. | `frontend/app/admin/live-chat/_components/LiveChatShell.tsx:52`, `frontend/app/admin/live-chat/_components/LiveChatShell.tsx:55` |

## 5) Merge Recommendation

Current status: **Ready with WARN items acknowledged**.

Minimum required before merge:
1. Confirm `lint`, `tsc`, `build` gates are green on the latest commit.
2. Decide whether non-live-chat page changes are intentionally in-scope for this branch (if yes, document explicitly in PR description; if no, split/defer them).

## 6) Suggested PR Notes Template

- This branch adopted verification-first PRP direction (v2 -> v3 streamline).
- Core gates pass (`lint`, `tsc`, `build`) as of 2026-02-16.
- Deferred work remains tracked for follow-up branch (component adoption/shared extraction/panel-header standardization).
- Live-chat duplicate mobile list render issue is resolved; scope WARN and inline SVG backlog remain tracked.
