# Recommended Prompt Template: Session Summary & Handoff

**Version**: 2.0 - Cross-Platform Collaboration Standard  
**Date**: 2026-02-07  
**For**: All AI Agents (Claude, Kimi, Gemini, Open Code, etc.)

---

## 🎯 SHORT VERSION (Copy & Paste)

```
Summarize this session and prepare handoff:

1. Update .agent/PROJECT_STATUS.md:
   - Update "Last Updated" timestamp
   - Update Thai Summary section
   - Add to Recent Completions
   - Update relevant Phase status

2. Create handoff checkpoint:
   - Path: .agent/state/checkpoints/handover-[platform]-[YYYYMMDD-HHMM].json
   - Include: work_summary, key_findings, deliverables, priority_actions

3. Create session summary:
   - Path: project-log-md/[platform]/session-summary-[YYYYMMDD-HHMM].md
   - Include: objectives, completed tasks, technical state, next steps

4. DO NOT create duplicate notifications in other agent directories

Deliverables created:
- [List files with paths and sizes]
```

---

## 📋 DETAILED VERSION (For Complex Sessions)

```
End session and prepare for next agent using cross-platform collaboration standard:

## 1. PROJECT STATUS UPDATE
Update .agent/PROJECT_STATUS.md:
- [ ] Update header: "Last Updated: [TIMESTAMP] by [AGENT_NAME]"
- [ ] Update Thai Summary with current status
- [ ] Add entry to "Recent Completions" (prepend, don't delete others)
- [ ] Update relevant Phase/Milestone status
- [ ] Add any new blockers or dependencies

## 2. HANDOFF CHECKPOINT
Create: .agent/state/checkpoints/handover-[platform]-[YYYYMMDD-HHMM].json

Required fields:
{
  "handoff_version": "2.0",
  "platform": "[your_platform]",
  "agent": "[agent_name]",
  "timestamp": "[ISO8601]",
  "session_type": "[analysis|implementation|bugfix|refactor]",
  "status": "completed|in_progress|blocked",
  "work_summary": {
    "title": "Brief title",
    "description": "What was done",
    "files_analyzed": [list],
    "files_modified": [list],
    "reports_generated": [list]
  },
  "key_findings": {
    "area": {
      "score": "X/10",
      "status": "good|needs_work|critical",
      "highlights": [],
      "issues": []
    }
  },
  "deliverables": [
    {"path": "...", "size_bytes": N, "description": "..."}
  ],
  "priority_actions": {
    "immediate": [],
    "short_term": [],
    "medium_term": []
  },
  "context_for_next_agent": {
    "current_phase": "...",
    "next_phase": "...",
    "focus_areas": [],
    "blockers": [],
    "reference_docs": []
  },
  "environment": {
    "os": "...",
    "dependencies": "...",
    "notes": "..."
  }
}

## 3. SESSION SUMMARY (Markdown)
Create: project-log-md/[platform]/session-summary-[YYYYMMDD-HHMM].md

Template:
# Session Summary: [Title]

**Agent**: [Name]  
**Date**: [YYYY-MM-DD]  
**Time**: [HH:MM]  
**Status**: [COMPLETED|IN_PROGRESS|BLOCKED]  

---

## 🎯 Objectives
[What was planned]

## ✅ Completed Tasks
- [x] Task 1
- [x] Task 2

## 📊 Key Findings
| Area | Score | Status |
|------|-------|--------|
| Backend | X/10 | Good |
| Frontend | X/10 | Needs Work |

## 📁 Deliverables
| File | Path | Size |
|------|------|------|
| Report 1 | path/to/file.md | X KB |

## ⚠️ Issues Found
1. [Issue description]
2. [Issue description]

## 🔄 Next Steps
### Immediate (This Week)
- [ ] Action 1
- [ ] Action 2

### Short-term (Next 2 Weeks)
- [ ] Action 3

## 🔗 Cross-Reference
- Related to: [other agent's work]
- Depends on: [blockers]

## 📝 Technical Notes
[Important decisions, discoveries]

## ✅ Checklist
- [ ] PROJECT_STATUS.md updated
- [ ] Handoff checkpoint created
- [ ] Session summary created
- [ ] No duplicate files in other directories

---

## 4. WHAT NOT TO DO
❌ DO NOT create files in other agent directories
❌ DO NOT create duplicate notifications
❌ DO NOT modify other agents' session logs
❌ DO NOT delete other agents' entries in PROJECT_STATUS.md

## 5. SINGLE SOURCE OF TRUTH
✅ All agents read: .agent/PROJECT_STATUS.md
✅ All agents read: .agent/state/current-session.json (if exists)
✅ All agents read: Latest checkpoint in .agent/state/checkpoints/
```

---

## 🆚 WHY THIS IS BETTER

### ❌ OLD WAY (What I Did Wrong)
```
"tell every agent know this session and stage"
→ Created duplicate files:
   - project-log-md/claude_code/AGENT_NOTIFICATION_FROM_KIMI.md
   - project-log-md/gemini_cli/AGENT_NOTIFICATION_FROM_KIMI.md
   - project-log-md/open_code/AGENT_NOTIFICATION_FROM_KIMI.md
   
→ Problems:
   - Wasted storage space
   - Hard to maintain (stale copies)
   - Agents might miss updates
   - Violates single source of truth principle
```

### ✅ NEW WAY (Correct)
```
"Update .agent/PROJECT_STATUS.md and create handoff checkpoint"
→ Creates/Updates:
   - .agent/PROJECT_STATUS.md (single source of truth)
   - .agent/state/checkpoints/handover-[TIMESTAMP].json (machine-readable)
   - project-log-md/[platform]/session-summary-[TIMESTAMP].md (human-readable)
   
→ Benefits:
   - One file to check (.agent/PROJECT_STATUS.md)
   - Machine-readable checkpoint for automation
   - No duplication
   - Follows cross-platform collaboration standard
```

---

## 🎨 PLATFORM-SPECIFIC CODES

Use these in filenames and JSON:

| Platform | Code | Example Filename |
|----------|------|------------------|
| Claude Code | `claude_code` | handover-claude_code-20260207-2130.json |
| Kimi Code | `kimi_code` | handover-kimi_code-20260207-2130.json |
| Gemini CLI | `gemini_cli` | handover-gemini_cli-20260207-2130.json |
| Open Code | `open_code` | handover-open_code-20260207-2130.json |
| Antigravity (Google) | `antigravity` | handover-antigravity-20260207-2130.json |
| Qwen (Alibaba) | `qwen` | handover-qwen-20260207-2130.json |
| CodeX | `codeX` | handover-codeX-20260207-2130.json |
| Kilo Code | `kilo_code` | handover-kilo_code-20260207-2130.json |

---

## 📚 REFERENCE DOCUMENTS

All agents should know these files exist:

| Document | Path | Purpose |
|----------|------|---------|
| Cross-Platform Skill | `.agent/skills/cross_platform_collaboration/SKILL.md` | **Main standard** |
| Universal Handoff | `.agent/workflows/handoff-to-any.md` | Handoff workflow |
| Universal Pickup | `.agent/workflows/pickup-from-any.md` | Pickup workflow |
| Session Summary | `.agent/workflows/session-summary.md` | Basic summary workflow |
| Project Status | `.agent/PROJECT_STATUS.md` | **Single source of truth** |
| Skills Index | `.agent/INDEX.md` | Quick navigation |

---

## ✅ VERIFICATION CHECKLIST

After running the prompt, verify:

```bash
# Check PROJECT_STATUS.md updated
cat .agent/PROJECT_STATUS.md | head -5

# Check handoff checkpoint created
ls -la .agent/state/checkpoints/handover-* | tail -3

# Check session summary created
ls -la project-log-md/[platform]/session-summary-* | tail -3

# Verify NO duplicate files in other directories
# (Should NOT see: project-log-md/claude_code/NOTIFICATION_FROM_KIMI.md)
```

---

## 🎯 ONE-LINE PROMPT (Ultra Short)

For quick sessions:

```
Summarize and handoff: Update .agent/PROJECT_STATUS.md, create checkpoint in .agent/state/checkpoints/, and log to project-log-md/[platform]/session-summary-[DATE].md
```

---

## 💡 PRO TIPS

1. **Always update PROJECT_STATUS.md first** - This is what other agents check
2. **Use ISO8601 timestamps** - `"2026-02-07T21:30:00+07:00"`
3. **Include file sizes** - Helps verify files were created correctly
4. **Link related work** - Reference other agents' reports when relevant
5. **Be specific in next steps** - "Implement pagination" is better than "Fix issues"

---

*Template version 2.0 - Following Cross-Platform Collaboration Standard*
