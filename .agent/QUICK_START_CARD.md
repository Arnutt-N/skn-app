# 🎴 Agent Quick Start Card

> **Print this out or keep it visible when working on SknApp**

---

## 🚀 STARTING WORK

```
READ → CHECK → UPDATE → WORK
```

**1. READ (Always)**
```
.agent/PROJECT_STATUS.md
```

**2. CHECK (If continuing work)**
```
ls project-log-md/*/
cat .agent/state/current-session.json
```

**3. UPDATE (Your session)**
```
Update .agent/state/current-session.json:
- platform: YOUR_PLATFORM
- agent_id: YOUR_NAME
- session_id: NEW_ID
- last_updated: NOW
```

**4. READ TASK HISTORY**
```
cat .agent/state/TASK_LOG.md  ← Read last 3-5 entries
```

**5. WORK**
```
Follow .agent/INDEX.md for skills
Update .agent/state/task.md regularly
```

---

## 🛑 ENDING WORK

```
UPDATE → CREATE → VERIFY → DONE
```

**1. UPDATE (5 files)**
- [ ] `.agent/PROJECT_STATUS.md`
- [ ] `.agent/state/current-session.json`
- [ ] `.agent/state/TASK_LOG.md` ← **APPEND your task entry**
- [ ] `.agent/state/task.md` (scratchpad)

**2. CREATE (2 files)**
- [ ] `.agent/state/checkpoints/handover-[PLATFORM]-[TIME].json`
- [ ] `project-log-md/[PLATFORM]/session-summary-[TIME].md`

**3. VERIFY**
```
ls .agent/state/checkpoints/
cat .agent/state/current-session.json
```

**4. DONE**
Report: "Handoff complete"

---

## 📁 KEY LOCATIONS

| What | Where |
|------|-------|
| Project status | `.agent/PROJECT_STATUS.md` |
| Session state | `.agent/state/current-session.json` |
| **Task history** | `.agent/state/TASK_LOG.md` ← **APPEND-ONLY** |
| Current task | `.agent/state/task.md` |
| Collaboration guide | `.agent/skills/cross_platform_collaboration/SKILL.md` |
| Pickup workflow | `.agent/workflows/pickup-from-any.md` |
| Handoff workflow | `.agent/workflows/handoff-to-any.md` |
| All skills | `.agent/INDEX.md` |
| Output logs | `project-log-md/[PLATFORM]/` |

---

## 🔑 PLATFORM CODES

| Platform | Code |
|----------|------|
| Claude Code | `claude-code` |
| Kimi Code | `kimi_code` |
| CodeX | `codex` |
| Antigravity | `antigravity` |
| Gemini | `gemini` |
| Qwen | `qwen` |
| Open Code | `open-code` |
| Kilo Code | `kilo_code` |
| Other | `other` |

---

## ⚡ COMMON COMMANDS

**Find latest handoff:**
```bash
ls -t .agent/state/checkpoints/handover-* | head -1
```

**Read current state:**
```bash
cat .agent/state/current-session.json
cat .agent/state/task.md
cat .agent/state/TASK_LOG.md | head -80      ← Last ~3 tasks
cat .agent/state/SESSION_INDEX.md | head -60 ← Cross-platform index
```

**Find latest summaries from ALL platforms:**
```bash
ls -lt project-log-md/*/*.md | head -10
```

**List recent activity:**
```bash
ls -lt project-log-md/*/
```

**Git status:**
```bash
git status
git log --oneline -5
```

---

## 🚨 REMEMBER

- ✅ **Always read PROJECT_STATUS.md first**
- ✅ **Always read TASK_LOG.md for context**
- ✅ **Always APPEND to TASK_LOG.md (never overwrite)**
- ✅ **Always validate state on pickup**
- ❌ **Never modify locked files**
- ❌ **Never skip the handoff protocol**

---

## 🆘 NEED HELP?

**Full guide:** `AGENT_PROMPT_TEMPLATE.md`
**Collaboration:** `.agent/skills/cross_platform_collaboration/SKILL.md`
**Index:** `.agent/INDEX.md`

---

*Keep this card handy!*
