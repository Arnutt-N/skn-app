---
description: Universal handoff workflow for any AI coding platform
---

# Workflow: Universal Handoff (Any Platform -> Any Platform)

## Purpose
Guarantee clean cross-platform continuity with no stale state drift.

## Mandatory Handoff Contract
A handoff is **invalid** unless all 5 artifacts are updated/created in the same session:
1. `.agent/PROJECT_STATUS.md`
2. `.agent/state/current-session.json`
3. `.agent/state/task.md`
4. `.agent/state/checkpoints/handover-[platform]-[YYYYMMDD-HHMM].json`
5. `project-log-md/[platform]/session-summary-[YYYYMMDD-HHMM].md`

## Step 1: Capture Current Work
Run:
```bash
git branch --show-current
git status --short
git log -5 --oneline
```

## Step 2: Update Shared State (Required)
- Update `.agent/PROJECT_STATUS.md`:
  - `Last Updated` timestamp
  - Active milestone progress
  - Recent completion entry
- Update `.agent/state/current-session.json`:
  - `last_updated`, `platform`, `current_task`, `plan_status`, `next_steps`
- Update `.agent/state/task.md`:
  - phase counters
  - completed/in-progress/todo items
  - next steps in priority order

## Step 3: Create Handoff Checkpoint JSON
Create:
` .agent/state/checkpoints/handover-[platform]-[YYYYMMDD-HHMM].json `

Minimum required fields:
- `handoff_version`
- `platform`
- `agent`
- `timestamp` (ISO-8601)
- `status`
- `work_summary`
- `priority_actions`
- `context_for_next_agent`

## Step 4: Create Session Summary Markdown
Create:
` project-log-md/[platform]/session-summary-[YYYYMMDD-HHMM].md `

Minimum required sections:
- Objective
- Completed
- In progress
- Blockers
- Next steps

## Step 5: Verification Gate (Do Not Skip)
Run:
```bash
ls .agent/state/checkpoints/handover-[platform]-*
ls project-log-md/[platform]/session-summary-*
cat .agent/state/current-session.json
cat .agent/state/task.md
python .agent/scripts/validate_handoff_state.py --platform [platform]
pwsh .agent/scripts/validate-handoff.ps1 -Platform [platform]
```

If any artifact is missing or outdated, fix before handoff.

## Step 6: Handoff Message
Use:
```text
HANDOFF COMPLETE
From: [platform]
To: [next platform or any]
Branch: [branch]
State: synced (PROJECT_STATUS + current-session + task + checkpoint + summary)
Next priority: [top next step]
```

## File Naming Convention
- `handover-[platform]-[YYYYMMDD-HHMM].json`
- `session-summary-[YYYYMMDD-HHMM].md`

## Notes
- Never rely on chat memory alone; file state is the source of truth.
- Do not claim completion for plan steps without matching code/test evidence.
