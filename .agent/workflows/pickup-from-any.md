---
description: Universal pickup workflow for any AI coding platform
---

# Workflow: Universal Pickup (Any Platform -> Any Platform)

## Purpose
Start work from the latest valid state and detect stale or contradictory handoff data early.

## Step 1: Locate Latest Handoff Artifacts
Run:
```bash
ls -lt .agent/state/checkpoints/handover-*.json | head -5
ls -lt project-log-md/*/session-summary-*.md | head -10
```

Read latest:
1. Latest handover checkpoint JSON
2. Matching session summary markdown (same timestamp preferred)
3. `.agent/state/current-session.json`
4. `.agent/state/task.md`
5. `.agent/PROJECT_STATUS.md`

## Step 2: Validate Consistency
Confirm:
- branch in `current-session.json` equals `git branch --show-current`
- phase counters in `task.md` match `PROJECT_STATUS.md`
- `last_updated` in `current-session.json` is not older than latest handoff timestamp
- validator passes: `python .agent/scripts/validate_handoff_state.py` (or `pwsh .agent/scripts/validate-handoff.ps1`)

If mismatch exists:
- treat state as stale
- reconcile all three files before coding
- add a "State Sync Reconciliation" entry to `PROJECT_STATUS.md`

## Step 3: Verify Environment
Run:
```bash
git branch --show-current
git status --short
git diff --name-only
```

## Step 4: Update Session Ownership
Update `.agent/state/current-session.json` with:
- your `platform`
- your `agent_id`
- new `session_id`
- new `last_updated`
- refreshed `next_steps`

## Step 5: Confirm Starting Point
Before coding, confirm in one short note:
- current branch
- current top priority task
- unresolved blockers

## Pickup Checklist
- [ ] latest handover JSON read
- [ ] latest session summary read
- [ ] `PROJECT_STATUS.md` read
- [ ] `current-session.json` updated for current agent
- [ ] `task.md` counters confirmed/reconciled
- [ ] git branch validated

## Rule
Do not start implementation until the state is coherent across:
- `.agent/PROJECT_STATUS.md`
- `.agent/state/current-session.json`
- `.agent/state/task.md`
