# Skills & Workflows Index

> **Last Updated:** 2026-01-26
> **Purpose:** Quick navigation to all available skills and workflows for SknApp development

---

## Skills Directory (`.agent/skills/`)

### Backend Development

| Skill | File | When to Use |
|-------|------|-------------|
| **FastAPI Enterprise** | `fastapi_enterprise/SKILL.md` | Building backend APIs, project structure, async patterns |
| **API Development Standard** | `api_development_standard/SKILL.md` | Designing endpoints, response formats, error handling |
| **Database Standard (PostgreSQL)** | `database_postgresql_standard/SKILL.md` | Schema design, migrations, JSONB usage, indexes |
| **Auth & RBAC Security** | `auth_rbac_security/SKILL.md` | Implementing authentication, role-based access control |
| **Testing Standards** | `testing_standards/SKILL.md` | Writing tests (pytest, jest, playwright) |

### Frontend Development

| Skill | File | When to Use |
|-------|------|-------------|
| **Next.js Enterprise** | `nextjs_enterprise/SKILL.md` | Next.js 16 setup, App Router, React 19 features |
| **Frontend Architecture** | `frontend_architecture/SKILL.md` | Component structure, Server vs Client components, state management |

### LINE Integration

| Skill | File | When to Use |
|-------|------|-------------|
| **LINE Integration Standard** | `line_integration/SKILL.md` | Webhook security, LIFF auth, rate limiting |
| **LINE Messaging Advanced** | `line_messaging_advanced/SKILL.md` | Flex templates, rich menus, broadcasting, deduplication |

### Architecture & Standards

| Skill | File | When to Use |
|-------|------|-------------|
| **Enterprise Architecture Standards** | `enterprise_architecture_standards/SKILL.md` | DDD patterns, UI design system (Glassmorphism), deployment |
| **API Documentation** | `api_documentation/SKILL.md` | OpenAPI/Swagger documentation, versioning |
| **Security Checklist** | `security_checklist/SKILL.md` | OWASP Top 10, input validation, secrets management |
| **Monitoring & Logging** | `monitoring_logging/SKILL.md` | Structured logging, error tracking (Sentry), performance monitoring |
| **Deployment & DevOps** | `deployment_devops/SKILL.md` | Docker, CI/CD, environment configuration |

### Agent Collaboration

| Skill | File | When to Use |
|-------|------|-------------|
| **Agent Collaboration Standard** | `agent_collaboration_standard/SKILL.md` | Handover format, session lifecycle, context persistence |
| **Cross-Platform Collaboration** | `cross_platform_collaboration/SKILL.md` | **NEW:** Handoff between ANY AI platforms (Claude, Antigravity, Open Code, Aider, Copilot, Tabby, Continue, Codeium, Codium, Sweep, CodeX, Qwen, Gemini, +Custom) |

---

## Workflows Directory (`.agent/workflows/`)

### Agent Collaboration Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| **Pick-Up** | `pick-up.md` | Start a session and resume work from previous agent |
| **Handover** | `agent-handover.md` | End session and prepare context for next agent |
| **Session Summary** | `session-summary.md` | Create work summary in Thai for continuity |
| **Universal Handoff** | `handoff-to-any.md` | **NEW:** Handoff from any platform to any platform |
| **Universal Pickup** | `pickup-from-any.md` | **NEW:** Pickup work from any platform |

### Development Operations

| Workflow | File | Purpose |
|----------|------|---------|
| **Run App** | `run-app.md` | Start Backend and Frontend in WSL (Native Mode) |
| **Sync & Run WSL** | `sync-and-run-wsl.md` | Sync code from Windows to WSL and run |
| **Migrate to WSL** | `migrate-to-wsl.md` | One-time setup for WSL development environment |

### Database Operations

| Workflow | File | Purpose |
|----------|------|---------|
| **DB Migration** | `db-migration.md` | Run Alembic migrations (create, upgrade, rollback) |
| **Backup & Restore** | `backup-restore.md` | Backup and restore PostgreSQL database |

### Application Management

| Workflow | File | Purpose |
|----------|------|---------|
| **Deploy Application** | `deploy-application.md` | Deploy Backend and Frontend to production |
| **Media Management** | `media-management.md` | Manage media files in database for Flex Messages |
| **LINE Test** | `line-test.md` | Test LINE webhook and messaging API |

### Git Operations

| Workflow | File | Purpose |
|----------|------|---------|
| **Git Workflow** | `git-workflow.md` | Complete Git commands with security checks and auto-logging |

---

## Quick Topic Lookup

### I want to...

| Goal | Use This Skill/Workflow |
|------|------------------------|
| Add a new API endpoint | `api_development_standard/SKILL.md` |
| Create a database migration | `db-migration.md` |
| Set up LINE webhook | `line_integration/SKILL.md` |
| Create a Flex message | `line_messaging_advanced/SKILL.md` |
| Test LINE webhook | `line-test.md` |
| Deploy to production | `deploy-application.md` |
| Run the app locally | `run-app.md` |
| Hand off work to another agent | `agent-handover.md` |
| Hand off to different platform (Claude/Antigravity/Open) | `handoff-to-any.md` |
| Resume work from previous session | `pick-up.md` |
| Pickup from different platform | `pickup-from-any.md` |
| Fix security vulnerability | `security_checklist/SKILL.md` |
| Add authentication | `auth_rbac_security/SKILL.md` |
| Setup monitoring/logging | `monitoring_logging/SKILL.md` |
| Write tests | `testing_standards/SKILL.md` |
| Create a new Next.js page | `frontend_architecture/SKILL.md` |
| Use Turbopack/React 19 features | `nextjs_enterprise/SKILL.md` |

---

## Tag Cloud

```
#backend
- fastapi_enterprise
- api_development_standard
- database_postgresql_standard
- auth_rbac_security
- testing_standards

#frontend
- nextjs_enterprise
- frontend_architecture

#line
- line_integration
- line_messaging_advanced

#architecture
- enterprise_architecture_standards
- api_documentation

#security
- security_checklist
- auth_rbac_security

#devops
- deployment_devops
- monitoring_logging

#collaboration
- agent_collaboration_standard
- pick-up
- agent-handover
- session-summary

#operations
- run-app
- sync-and-run-wsl
- migrate-to-wsl
- db-migration
- backup-restore
- deploy-application
- media-management
- line-test
- git-workflow
```

---

## File Structure

```
.agent/
├── INDEX.md                 # This file
├── PROJECT_STATUS.md        # Project Continuity Dashboard
├── state/                   # Cross-platform collaboration state
│   ├── README.md            # System documentation
│   ├── current-session.json # Current session state
│   ├── task.md              # Current task
│   └── checkpoints/         # Handoff checkpoints
│       ├── handover-*.json
│       └── session-summary-*.md
├── skills/                  # Knowledge repositories (16 skills)
│   ├── fastapi_enterprise/
│   ├── nextjs_enterprise/
│   ├── line_integration/
│   ├── api_development_standard/
│   ├── database_postgresql_standard/
│   ├── auth_rbac_security/
│   ├── testing_standards/
│   ├── deployment_devops/
│   ├── enterprise_architecture_standards/
│   ├── agent_collaboration_standard/
│   ├── cross_platform_collaboration/  # NEW: Universal handoff
│   ├── project_status_standard/       # NEW: Project Continuity
│   ├── frontend_architecture/
│   ├── api_documentation/
│   ├── line_messaging_advanced/
│   ├── monitoring_logging/
│   └── security_checklist/
└── workflows/               # Step-by-step procedures (14 workflows)
    ├── pick-up.md
    ├── agent-handover.md
    ├── session-summary.md
    ├── handoff-to-any.md    # NEW: Universal handoff
    ├── pickup-from-any.md   # NEW: Universal pickup
    ├── run-app.md
    ├── sync-and-run-wsl.md
    ├── migrate-to-wsl.md
    ├── db-migration.md
    ├── backup-restore.md
    ├── deploy-application.md
    ├── media-management.md
    ├── line-test.md
    └── git-workflow.md
```

---

## Quick Start for New Agents

**New to this project? Start here:**
1. **Read**: `.agent/AGENT_PROMPT_TEMPLATE.md` - Universal template for session summary & handoff
2. **Check**: `.agent/PROJECT_STATUS.md` - Current project status (single source of truth)
3. **Use**: `/agent_pickup` skill or `.agent/workflows/pickup-from-any.md` - Resume from previous agent

---

## How to Use This Index

1. **Search by keyword** - Use Ctrl+F to find relevant skills/workflows
2. **Browse by category** - Navigate through the sections above
3. **Check "When to Use"** - Each entry has guidance on when to apply it
4. **Refer to Quick Topic Lookup** - Find the right resource for common tasks

---

## Notes

- All skills follow the SKILL.md format with YAML frontmatter
- All workflows have `description` field in their frontmatter
- Agent collaboration workflows should be used at the start/end of each session
- Development workflows can be invoked manually or as needed
