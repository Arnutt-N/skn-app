# 👋 Welcome, AI Agent!

> You are about to work on **SknApp** - a LINE Official Account system with LIFF integration

---

## 🚀 START HERE

### Step 1: Follow the Entry Workflow (RECOMMENDED)
👉 **`.agent/workflows/start-here.md`** ← **FOLLOW THIS STEP-BY-STEP**

This workflow guides you through everything you need to start working.

### Alternative: Manual Path

**Step 1: Read the Universal Prompt**
👉 **`AGENT_PROMPT_TEMPLATE.md`** ← **READ THIS FIRST**

**Step 2: Keep the Quick Card Handy**
👉 `.agent/QUICK_START_CARD.md` ← **REFERENCE WHILE WORKING**

---

## ⚡ TL;DR - Immediate Actions

**If you're STARTING work:**
```
1. Read: .agent/PROJECT_STATUS.md
2. Read: .agent/workflows/pickup-from-any.md
3. Update: .agent/state/current-session.json with your platform
4. Begin work
```

**If you're ENDING work:**
```
1. Read: .agent/workflows/handoff-to-any.md
2. Update: .agent/PROJECT_STATUS.md
3. Update: .agent/state/current-session.json
4. Update: .agent/state/task.md
5. Create: .agent/state/checkpoints/handover-[PLATFORM]-[TIME].json
6. Create: project-log-md/[PLATFORM]/session-summary-[TIME].md
7. Report: "Handoff complete"
```

---

## 📂 Project Structure

```
sk-app/
├── AGENT_PROMPT_TEMPLATE.md    ← START HERE
├── START_HERE.md               ← You are here
├── backend/                    ← FastAPI backend
│   └── app/
├── frontend/                   ← Next.js 16 frontend
│   └── app/
├── .agent/                     ← Agent collaboration hub
│   ├── QUICK_START_CARD.md     ← Quick reference
│   ├── PROJECT_STATUS.md       ← Project dashboard
│   ├── workflows/              ← Step-by-step procedures
│   ├── skills/                 ← Knowledge & standards
│   └── state/                  ← Session & task tracking
└── project-log-md/             ← Agent session logs
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16.1 + React 19.2 + Tailwind CSS v4 |
| **Backend** | FastAPI 0.109 + Python 3.13 + SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 + Redis 7 |
| **LINE** | line-bot-sdk 3.0 + LIFF 2.27 |
| **Auth** | NextAuth.js v5 + JWT |
| **Testing** | pytest + Vitest + Playwright |

---

## 🌐 Supported Agent Platforms

This project supports collaboration between ANY AI coding platforms:

- ✅ Claude Code (Anthropic)
- ✅ Kimi Code (Moonshot AI) ← That's me!
- ✅ CodeX (OpenAI)
- ✅ Antigravity/Cursor
- ✅ Gemini CLI (Google)
- ✅ Qwen (Alibaba)
- ✅ Open Code (OpenAI)
- ✅ Kilo Code
- ✅ And any future platforms...

**All agents use the SAME files and protocols.**

---

## 📞 Need Help?

| Problem | Solution |
|---------|----------|
| First time here? | Read `AGENT_PROMPT_TEMPLATE.md` |
| Quick reference? | Read `.agent/QUICK_START_CARD.md` |
| Picking up work? | Read `.agent/workflows/pickup-from-any.md` |
| Handing off? | Read `.agent/workflows/handoff-to-any.md` |
| Collaboration? | Read `.agent/skills/cross_platform_collaboration/SKILL.md` |
| Available skills? | Read `.agent/INDEX.md` |

---

## ✅ Before You Start

- [ ] I've read `AGENT_PROMPT_TEMPLATE.md`
- [ ] I've checked `.agent/PROJECT_STATUS.md`
- [ ] I've updated `.agent/state/current-session.json` with my platform
- [ ] I understand the task I'm working on
- [ ] I know how to handoff when done

---

*Welcome to the team! Let's build something great together.* 🤖✨
