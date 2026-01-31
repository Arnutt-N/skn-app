---
description: ส่งมอบงานจาก Platform ใดก็ได้ไปยัง Platform อื่น (Claude Code ↔ Antigravity ↔ Open Code)
---

# Workflow: Universal Handoff (Any Platform → Any Platform)

## 🤖 Automated Handoff Available

**For automated handoff, use the `/agent_handoff` skill**

This workflow provides the detailed steps that the skill automates. Use the skill for one-command handoff, or reference this workflow for manual execution.

---

## Purpose

ส่งมอบงานและบริบทระหว่าง **ทุก AI coding platforms** ไม่จำกัด

### Known Platforms (ตัวอย่าง)
- **Claude Code** (Anthropic)
- **Antigravity** (Cursor)
- **Open Code** (OpenAI/Other)
- **Aider**, **GitHub Copilot**, **Tabby**, **Continue**, **Codeium**, **Codium**, **Sweep**
- **Kilo Code**, **Gemini CLI**, **CodeX**
- **หรือ Platform ใดก็ได้** - ใช้ platform code ของคุณเอง

---

## Prerequisites

1. ตรวจสอบให้แน่ใจว่าได้ติดตั้ง Cross-Platform Collaboration Standard แล้ว
2. มีไฟล์ `.agent/state/current-session.json` และ `task.md` อยู่แล้ว

---

## Step 1: Review Current Work

ก่อนส่งมอบงาน ให้ตรวจสอบสิ่งที่ทำไปแล้ว:

```bash
# ดูสถานะไฟล์ที่เปลี่ยนแปลง
git status

# ดู branch ปัจจุบัน
git branch --show-current

# ดู commits ล่าสุด
git log -5 --oneline
```

---

## Step 2: Update State Files

### 2.1 Update current-session.json

แก้ไข `.agent/state/current-session.json`:

```json
{
  "version": "1.0",
  "last_updated": "2026-01-26T10:30:00Z",
  "platform": "claude-code",
  "agent_id": "claude-opus-4-5",
  "session_id": "sess-20260126-103000",

  "project": {
    "name": "SknApp",
    "root": "D:/genAI/skn-app",
    "branch": "fix/feature-name"
  },

  "current_task": {
    "id": "task-001",
    "title": "ชื่องานที่กำลังทำ",
    "status": "in_progress",
    "priority": "high"
  },

  "context": {
    "recent_files": [
      "path/to/file1.ts",
      "path/to/file2.ts"
    ],
    "active_branch": "fix/feature-name",
    "modified_files": ["path/to/file1.ts"]
  },

  "blockers": [
    {
      "issue": "ระบุปัญหาที่ขวางอยู่ (ถ้ามี)",
      "severity": "high"
    }
  ],

  "next_steps": [
    "ขั้นตอนถัดไปที่ต้องทำ",
    "ขั้นตอนถัดไป"
  ]
}
```

### 2.2 Update task.md

แก้ไข `.agent/state/task.md`:

```markdown
# Current Task

**Status:** In Progress
**Assigned:** Claude Code
**Started:** 2026-01-26 10:30

---

## Objective
_สรุปวัตถุประสงค์ของงาน_

---

## Subtasks

- [x] งานที่เสร็จแล้ว
- [ ] งานที่กำลังทำ
- [ ] งานที่ต้องทำต่อ

---

## Progress Notes
_บันทึกสิ่งที่ค้นพบ การตัดสินใจ หรือข้อมูลสำคัญ_

---

## Blockers
_ระบุปัญหาหรืออุปสรรค (ถ้ามี)_

---

## Next Steps
1. ขั้นตอนแรกที่ต้องทำ
2. ขั้นตอนถัดไป
```

---

## Step 3: Create Handoff Checkpoint

สร้างไฟล์ checkpoint ใหม่ที่ `.agent/state/checkpoints/handover-[FROM]-[TO]-[TIMESTAMP].json`:

```json
{
  "from_platform": "claude-code",
  "to_platform": "antigravity",
  "timestamp": "2026-01-26T10:30:00Z",
  "session_id": "sess-20260126-103000",
  "duration_minutes": 45,

  "handover": {
    "summary": "สรุปสิ่งที่ทำใน session นี้",
    "completed": [
      "งานที่เสร็จแล้ว 1",
      "งานที่เสร็จแล้ว 2"
    ],
    "in_progress": [
      "งานที่กำลังทำอยู่ (ระบุ % ความคืบหน้า)"
    ]
  },

  "context": {
    "files_modified": [
      "path/to/file1.ts",
      "path/to/file2.ts"
    ],
    "files_to_review": [],
    "commits_made": [
      "commit-hash-1",
      "commit-hash-2"
    ]
  },

  "next_actions": [
    {
      "action": "สิ่งที่ต้องทำต่อ",
      "priority": "high",
      "estimated_effort": "30 minutes"
    }
  ],

  "blockers": [
    {
      "issue": "ปัญหาที่ขวางอยู่",
      "suggestion": "วิธีแก้ปัญหาที่เสนอ"
    }
  ],

  "notes": "ข้อมูลเพิ่มเติมหรือคำแนะนำ"
}
```

---

## Step 4: Create Session Summary (Markdown)

สร้างไฟล์ summary ที่ `.agent/state/checkpoints/session-summary-[TIMESTAMP].md`:

```markdown
# Session Summary: [ชื่องาน]

**From Platform:** Claude Code
**To Platform:** Antigravity
**Date:** 2026-01-26 10:30
**Duration:** 45 minutes

---

## วัตถุประสงค์ (Objective)
_สรุปเป้าหมายของงานที่ทำใน session นี้_

---

## ✅ สิ่งที่เสร็จแล้ว (Completed)

- [x] งานที่เสร็จแล้ว 1
- [x] งานที่เสร็จแล้ว 2

---

## 🚧 สิ่งที่อยู่ระหว่างดำเนินการ (In Progress)

- [ ] งานที่กำลังทำ (50%)
- [ ] งานที่เหลือ

---

## 📁 ไฟล์ที่แก้ไข (Modified Files)

| File | Change |
|------|--------|
| `path/to/file1.ts` | Fixed navigation bug |
| `path/to/file2.ts` | Added new component |

---

## 🛑 ปัญหา/อุปสรรค (Blockers)

_ระบุปัญหาที่พบ (ถ้ามี)_

---

## 📝 บันทึกทางเทคนิค (Technical Notes)

_บันทึกการตัดสินใจ หรือข้อมูลเทคนิคที่สำคัญ_

---

## ⏭️ ขั้นตอนถัดไปสำหรับ Agent คนถัดไป (Next Steps)

1. **สิ่งแรกที่ต้องทำ:**
   - รายละเอียด...

2. **สิ่งถัดไป:**
   - รายละเอียด...

---

## 🔗 ข้อมูลเพิ่มเติม

- Branch: `fix/feature-name`
- Latest Commit: `abc123def`
- Test Status: _ระบุสถานะการทดสอบ_
```

---

## Step 5: Verify Files

ตรวจสอบให้แน่ใจว่าไฟล์ทั้งหมดถูกสร้างและอัปเดตเรียบร้อย:

```bash
# ตรวจสอบ state files
cat .agent/state/current-session.json
cat .agent/state/task.md

# ตรวจสอบ checkpoints
ls -la .agent/state/checkpoints/

# ตรวจสอบไฟล์ล่าสุด
ls -lt .agent/state/checkpoints/ | head -5
```

---

## Step 6: Commit State (Optional แต่แนะนำ)

หากต้องการบันทึก checkpoint ไว้ใน git:

```bash
git add .agent/state/
git commit -m "chore(handoff): checkpoint [FROM]->[TO] - [TASK_NAME]"
```

---

## Step 7: Notify Next Agent

แจ้ง Agent คนถัดไปว่างานพร้อมรับ:

```
🤝 HANDOFF COMPLETE

From: [Your Platform]
To: [Next Platform]
Task: [Task Name]

Files updated:
- .agent/state/current-session.json
- .agent/state/task.md
- .agent/state/checkpoints/handover-[TIMESTAMP].json
- .agent/state/checkpoints/session-summary-[TIMESTAMP].md

Ready for pickup!
```

---

## Checkpoint File Naming Convention

```
handover-[FROM]-[TO]-[YYYYMMDD]-[HHMM].json
session-summary-[YYYYMMDD]-[HHMM].md
```

ตัวอย่าง:
```
handover-claude-code-antigravity-20260126-103000.json
session-summary-20260126-103000.md
```

---

## Platform-Specific Notes

### Claude Code (`claude-code`)
- ใช้ Read/Edit/Write tools
- อัปเดต state files ด้วย Edit tool

### Antigravity/Cursor (`antigravity`)
- ใช้ artifacts สำหรับ context
- export task state ก่อน handoff

### Open Code/OpenAI (`open-code`)
- ใช้ markdown format
- อัปเดตไฟล์ด้วย text editor

### Aider (`aider`)
- Commit current work ก่อน
- อัปเดต state files ด้วย editor
- ใช้ `/add` command เพื่อ track files

### GitHub Copilot (`copilot`)
- Save current files
- อัปเดต state files manually
- Document context ให้ชัดเจน

### Tabby (`tabby`)
- Export session context
- อัปเดต JSON/MD files
- Create checkpoint

### Continue (`continue`)
- Save conversation history
- อัปเดต state files
- Document decisions

### Codeium (`codeium`)
- Save current state
- อัปเดต manually
- Create checkpoint

### CodeX (`codex`)
- Export session context
- อัปเดต state files
- Create checkpoint
- Document decisions

### Qwen (`qwen`)
- Save conversation history
- อัปเดต state files
- Create checkpoint
- Document context (中文/English)

### Gemini (`gemini`)
- Export session context
- อัปเดต state files
- Create checkpoint
- Document decisions

### Kilo Code (`kilo_code`)
- Export internal state
- อัปเดต state files (JSON/MD)
- Create handover checkpoint
- Document context

### Any Custom Platform (`[your-code]`)
**Universal steps:**
1. Review work completed
2. Update `current-session.json`
3. Update `task.md`
4. Create checkpoint JSON
5. Create session summary MD

**ไม่ว่าจะใช้ platform ไหน ไฟล์ output ต้องเป็น:**
- JSON format สำหรับ machine-readable data
- Markdown format สำหรับ human-readable summary

---

## Troubleshooting

**ปัญหา:** JSON file invalid
**แก้ไข:** ใช้ JSON validator ตรวจสอบ format

**ปัญหา:** File not found
**แก้ไข:** ตรวจสอบว่าสร้าง directory `.agent/state/checkpoints/` แล้ว

**ปัญหา:** Next agent ไม่เห็น state
**แก้ไข:** ตรวจสอบว่าไฟล์ถูก commit หรือ sync แล้ว
