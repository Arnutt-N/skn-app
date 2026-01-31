---
description: รับงานจาก Platform ใดก็ได้ (Claude Code ↔ Antigravity ↔ Open Code)
---

# Workflow: Universal Pickup (Any Platform ← Any Platform)

## 🤖 Automated Pickup Available

**For automated pickup, use the `/agent_pickup` skill**

This workflow provides the detailed steps that the skill automates. Use the skill for one-command pickup, or reference this workflow for manual execution.

---

## Purpose

รับงานและบริบทจาก **ทุก AI coding platforms** เพื่อทำงานต่ออย่างต่อเนื่อง

### Supported From/To
- **Claude Code** ↔ **Antigravity** ↔ **Open Code**
- **Aider** ↔ **GitHub Copilot** ↔ **Tabby** ↔ **Continue**
- **Codeium** ↔ **Codium** ↔ **Sweep**
- **หรือ Platform ใดก็ได้** ที่ใช้รูปแบบเดียวกัน

---

## Prerequisites

1. อยู่ใน project directory ที่ถูกต้อง
2. ไฟล์ `.agent/state/` มีอยู่แล้ว

---

## Step 1: Locate Latest Handoff

หา checkpoint ล่าสุดที่ถูกสร้างขึ้น:

```bash
# ดูไฟล์ล่าสุดใน checkpoints
ls -lt .agent/state/checkpoints/ | head -10

# หรือดูเฉพาะ handoff files
ls -lt .agent/state/checkpoints/handover-*.json | head -5
```

**ไฟล์ที่ต้องอ่าน:**
1. `handover-[FROM]-[TO]-[TIMESTAMP].json` (ล่าสุด)
2. `session-summary-[TIMESTAMP].md` (ล่าสุด)
3. `.agent/state/current-session.json`
4. `.agent/state/task.md`

---

## Step 2: Read State Files

### 2.1 Read Handoff Checkpoint

อ่านไฟล์ `handover-*.json` ล่าสุด:

```bash
cat .agent/state/checkpoints/handover-[LATEST].json
```

**สิ่งที่ต้องรู้:**
| Field | Description |
|-------|-------------|
| `from_platform` | Platform ที่ส่งมอบงาน |
| `to_platform` | Platform ที่ควรรับงาน (ตัวคุณ) |
| `summary` | สรุปสิ่งที่ทำไป |
| `completed` | รายการที่เสร็จแล้ว |
| `in_progress` | รายการที่กำลังทำ |
| `next_actions` | ขั้นตอนถัดไป |
| `blockers` | ปัญหาที่ต้องแก้ |

### 2.2 Read Session Summary

อ่านไฟล์ `session-summary-*.md` ล่าสุด:

```bash
cat .agent/state/checkpoints/session-summary-[LATEST].md
```

**ให้ความสำคัญกับ:**
- ✅ สิ่งที่เสร็จแล้ว
- 🚧 สิ่งที่อยู่ระหว่างดำเนินการ
- 🛑 ปัญหา/อุปสรรค
- ⏭️ ขั้นตอนถัดไป

### 2.3 Read Current Session

```bash
cat .agent/state/current-session.json
```

### 2.4 Read Task File

```bash
cat .agent/state/task.md
```

---

## Step 3: Verify Environment

ตรวจสอบสภาพแวดล้อมปัจจุบัน:

```bash
# ตรวจสอบ Git status
git status

# ตรวจสอบ branch ปัจจุบัน
git branch --show-current

# ตรวจสอบว่าอยู่ branch ที่ถูกต้องหรือไม่
# (เทียบกับ current-session.json)

# ตรวจสอบไฟล์ที่ถูกแก้ไข
git diff --name-only
```

**หาก branch ไม่ตรง:**
```bash
git checkout [BRANCH-NAME-จาก-STATE]
```

---

## Step 4: Update Your Session

อัปเดต `current-session.json` ด้วยข้อมูลของคุณ:

```json
{
  "version": "1.0",
  "last_updated": "2026-01-26T11:00:00Z",
  "platform": "antigravity",
  "agent_id": "cursor-agent-001",
  "session_id": "sess-20260126-110000",

  "project": {
    "name": "SknApp",
    "root": "D:/genAI/skn-app",
    "branch": "fix/feature-name"
  },

  "current_task": {
    "id": "task-001",
    "title": "ชื่องานเดิมจาก-handoff",
    "status": "in_progress",
    "priority": "high"
  },

  "context": {
    "recent_files": [
      "ไฟล์ที่คุณจะทำงานด้วย"
    ],
    "active_branch": "fix/feature-name",
    "modified_files": []
  },

  "blockers": [
    {
      "issue": "ปัญหาที่คุณพบ (ถ้ามีใหม่)",
      "severity": "medium"
    }
  ],

  "next_steps": [
    "ขั้นตอนแรกที่คุณจะทำ",
    "ขั้นตอนถัดไป"
  ]
}
```

---

## Step 5: Understand the Context

### Checklist ก่อนเริ่มทำงาน:

- [ ] อ่านและเข้าใจ **Session Summary** แล้ว
- [ ] รู้ว่าอะไร **เสร็จแล้ว** และอะไร **ยังไม่เสร็จ**
- [ ] เข้าใจ **Blockers** ที่ระบุไว้
- [ ] รู้ **Next Steps** ที่ต้องทำ
- [ ] ตรวจสอบว่าอยู่ใน **branch** ที่ถูกต้อง
- [ ] ทราบ **ไฟล์ไหน** ที่ถูกแก้ไขแล้ว

---

## Step 6: Begin Work

เริ่มทำงานตาม **Next Steps** ที่ระบุไว้ใน handoff:

```bash
# ตัวอย่าง: เปิดไฟล์ที่ต้องแก้ไข
# หรือเริ่ม command ที่จำเป็น
```

---

## Step 7: Update Task Progress

ขณะทำงาน ให้อัปเดต `task.md` ตลอด:

```markdown
# Current Task

**Status:** In Progress
**Assigned:** Antigravity
**Started:** 2026-01-26 11:00

---

## Objective
_วัตถุประสงค์เดิมจาก handoff_

---

## Subtasks

- [x] งานที่เสร็จแล้ว (จาก handoff)
- [x] งานที่คุณเพิ่งทำเสร็จ
- [ ] งานที่คุณกำลังทำ
- [ ] งานที่เหลือ

---

## Progress Notes

### Session 2026-01-26 11:00 (Antigravity)
- เริ่มรับงานจาก Claude Code
- ทำงานต่อจากจุดที่กำลังดำเนินการ
- พบปัญหาใหม่... (ถ้ามี)

---

## Blockers

_ปัญหาที่พบ (ถ้ามีใหม่)_

---

## Next Steps

1. ขั้นตอนถัดไปที่ต้องทำ
2. ขั้นตอนถัดไป
```

---

## Platform-Specific Pickup

### For Claude Code (`claude-code`)
```bash
# 1. Read state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# 2. Read latest checkpoint
LATEST=$(ls -t .agent/state/checkpoints/handover-*.json | head -1)
cat $LATEST

# 3. Update session for Claude Code (ใช้ Edit tool)
# 4. Begin work
```

### For Antigravity/Cursor (`antigravity`)
```bash
# 1. Import task state
# 2. Read artifacts from previous session
# 3. Update task boundary
# 4. Begin work
```

### For Open Code/OpenAI (`open-code`)
```bash
# 1. Read markdown files
cat .agent/state/task.md
cat .agent/state/checkpoints/session-summary-*.md | tail -100

# 2. Understand context
# 3. Update files manually
# 4. Begin work
```

### For Aider (`aider`)
```bash
# 1. Pull latest changes
git pull

# 2. Read state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# 3. Add files to context
aider .agent/state/current-session.json .agent/state/task.md

# 4. Update and begin work
```

### For GitHub Copilot (`copilot`)
```bash
# 1. Open state files in IDE
# 2. Read context
# 3. Update manually
# 4. Begin work with Copilot Chat
```

### For Tabby (`tabby`)
```bash
# 1. Import session context
# 2. Read state files
# 3. Update session
# 4. Begin work
```

### For Continue (`continue`)
```bash
# 1. Load previous conversation
# 2. Read state files
# 3. Update context
# 4. Begin work
```

### For CodeX (`codex`)
```bash
# 1. Load session context
# 2. Read state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# 3. Update state
# 4. Begin work with CodeX
```

### For Qwen (`qwen`)
```bash
# 1. 加载会话上下文
# 2. 读取状态文件
cat .agent/state/current-session.json
cat .agent/state/task.md

# 3. 更新状态
# 4. 开始工作 (中文/English)
```

### For Gemini (`gemini`)
```bash
# 1. Load conversation context
# 2. Read state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# 3. Update session
# 4. Begin work with Gemini
```

### For Kilo Code (`kilo_code`)
```bash
# 1. Export internal state
# 2. Read state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# 3. Update state
# 4. Begin work
```

### For Any Custom Platform (`[your-code]`)
**Universal steps:**
```bash
# 1. Read state files (JSON + MD)
cat .agent/state/current-session.json
cat .agent/state/task.md
cat .agent/state/checkpoints/handover-[LATEST].json

# 2. Verify git branch
git checkout [BRANCH-FROM-STATE]

# 3. Update current-session.json with your platform info
# 4. Begin work following next_steps from handoff
```

---

## Quick Pickup Checklist

```
□ หา handoff ล่าสุด
□ อ่านทั้ง 4 ไฟล์ (handoff, summary, session, task)
□ ตรวจสอบ git branch
□ อัปเดต current-session.json
□ เข้าใจ context และ next steps
□ เริ่มทำงาน
```

---

## Emergency Recovery

หากไม่พบไฟล์ state:

```bash
# 1. ตรวจสอบ git history
git log -- .agent/state/

# 2. Restore จาก git
git checkout [COMMIT-HASH] -- .agent/state/

# 3. หรือสร้างใหม่จาก template
cp .agent/state/templates/*.json .agent/state/
```

---

## Handoff Complete Message

เมื่อรับงานเรียบร้อย ส่ง message:

```
✅ PICKUP COMPLETE

Platform: [Your Platform]
Task: [Task Name]
From: [Previous Platform]

Ready to continue work!

Next action: [First thing you'll do]
```
