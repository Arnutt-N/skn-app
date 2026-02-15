# Universal Agent Prompt Template (Session End / Handoff)

Use this at the end of every agent session.

## Required Outputs (All Must Exist)
1. `.agent/PROJECT_STATUS.md` updated
2. `.agent/state/current-session.json` updated
3. `.agent/state/task.md` updated
4. `.agent/state/checkpoints/handover-[platform]-[YYYYMMDD-HHMM].json` created
5. `project-log-md/[platform]/session-summary-[YYYYMMDD-HHMM].md` created

If any one is missing, the handoff is invalid.

## Platform Codes
- `antigravity`
- `claude_code`
- `codeX`
- `gemini_cli`
- `kilo_code`
- `kimi_code`
- `open_code`
- `qwen`

## End-of-Session Prompt
```text
Summarize this session and prepare handoff.

Do all of the following:
1) Update .agent/PROJECT_STATUS.md
2) Update .agent/state/current-session.json
3) Update .agent/state/task.md
4) Create .agent/state/checkpoints/handover-[PLATFORM]-[YYYYMMDD-HHMM].json
5) Create project-log-md/[PLATFORM]/session-summary-[YYYYMMDD-HHMM].md

Validation:
- Confirm branch and modified files.
- Confirm the three state files are coherent.
- If mismatched, reconcile before finalizing.
- Run: python .agent/scripts/validate_handoff_state.py --platform [PLATFORM]
- Or: pwsh .agent/scripts/validate-handoff.ps1 -Platform [PLATFORM]
```

## Verification Commands
```bash
git branch --show-current
git status --short
ls .agent/state/checkpoints/handover-[PLATFORM]-*
ls project-log-md/[PLATFORM]/session-summary-*
cat .agent/state/current-session.json
cat .agent/state/task.md
python .agent/scripts/validate_handoff_state.py --platform [PLATFORM]
pwsh .agent/scripts/validate-handoff.ps1 -Platform [PLATFORM]
```

## What Not To Do
- Do not update only `PROJECT_STATUS.md` and skip state files.
- Do not create duplicate "notification" files across other platform folders.
- Do not mark plan steps done without evidence in code/tests or checkpoint notes.
