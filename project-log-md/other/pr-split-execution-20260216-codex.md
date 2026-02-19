# PR Split Execution Notes (Step 4)

Date: 2026-02-16  
Branch: `fix/live-chat-redesign-issues`

## 1) Primary PR (live-chat blocker fix + merge-readiness doc)

### Target files
- `frontend/app/admin/live-chat/_components/LiveChatShell.tsx`
- `project-log-md/other/prp-v2-v3-diff-merge-readiness-20260216-codex.md`

### Recommended commit
```bash
git add frontend/app/admin/live-chat/_components/LiveChatShell.tsx project-log-md/other/prp-v2-v3-diff-merge-readiness-20260216-codex.md
git commit -m "fix(live-chat): remove duplicate mobile conversation list render"
```

### Recommended PR title
`fix: resolve live-chat mobile duplicate list render + refresh merge-readiness audit`

### Recommended PR description (copy/paste)
```md
## Summary
- Removed duplicate mobile/no-selection `ConversationList` render in `LiveChatShell`.
- Updated PRP v2->v3 merge-readiness checklist to reflect resolved blocker.

## Why
- Mobile layout was rendering conversation list twice due overlapping conditions.
- Audit status was stale (`FAIL`) after code fix and needed sync.

## Validation
- `npm run lint` (frontend): pass
- `npx tsc --noEmit` (frontend): pass
- `npm run build` (frontend): pass

## Remaining Non-Blocking WARNs
- Scope discipline: non-live-chat route changes are split to a follow-up PR.
- Inline SVG backlog remains in rich-menus/auto-replies edit pages.
```

## 2) Follow-up PR (non-live-chat route changes)

### Candidate files
- `frontend/app/admin/analytics/page.tsx`
- `frontend/app/admin/audit/page.tsx`
- `frontend/app/admin/auto-replies/page.tsx`
- `frontend/app/admin/requests/page.tsx`

### Recommended flow
```bash
# after primary PR commit
git switch -c chore/design-system-non-live-chat-followup
git add frontend/app/admin/analytics/page.tsx frontend/app/admin/audit/page.tsx frontend/app/admin/auto-replies/page.tsx frontend/app/admin/requests/page.tsx
git commit -m "refactor(admin): move non-live-chat design-system updates to follow-up scope"
```

## 3) Step 3 Smoke Check Note

Interactive browser QA was not executed from CLI.  
Render logic matrix (from `LiveChatShell` conditions) is now:

- desktop + no selection -> list `true`, chat `true`
- desktop + selected -> list `true`, chat `true`
- mobile + no selection -> list `true`, chat `false`
- mobile + selected -> list `false`, chat `true`

This confirms the duplicate mobile list render path has been removed at logic level.
