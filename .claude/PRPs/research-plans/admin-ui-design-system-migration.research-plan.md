# Research Plan: Safe Migration of Admin UI Design System from Example Reference

## Metadata

| Field | Value |
|-------|-------|
| Date | 2026-02-15 |
| Topic | Admin UI Design System Migration |
| Domain | MIXED: CODEBASE + ARCHITECTURE |
| Complexity | HIGH |
| Team Size | 4 researchers |
| Sub-questions | 7 |
| Tasks | 7 (RT-1 through RT-7) |
| Pre-existing analysis | `research/common/ui-design-system-comparison-merged.md` (531 lines, 6-agent consensus) |

---

## Research Question

How can we safely and carefully migrate the current SknApp admin UI design system to incorporate patterns, components, and tokens from `./examples/admin-chat-system/*` — without breaking existing functionality, losing current strengths (fluid typography, Thai utilities, WCAG AA tokens, dark mode, CVA variants), or introducing regressions?

**Orchestration**: Prioritize safety (non-breaking changes), incremental adoption, and thorough impact analysis before any code changes. Each researcher should produce actionable findings with explicit risk assessments.

---

## Pre-Existing Analysis (Already Completed)

The merged comparison report (`research/common/ui-design-system-comparison-merged.md`) already provides verified findings from 6 independent agents. **These findings are treated as ground truth** and should not be re-derived:

| Already Answered | Report Section | Implication |
|-----------------|----------------|-------------|
| Token classification (match/diff/gap) | Sections 1, 13 | RT-1 reduced to writing CSS patch only |
| Component classification (KEEP/ADD) | Section 4 | RT-4 reduced to import-count grep only |
| Architecture decision (no wholesale migration) | Section 11 | RT-5 direction is pre-determined |
| 4-phase action plan skeleton | Section 12 | RT-5 builds on existing phases |
| Color mapping table (16 rows) | Section 13 | RT-3 token map is pre-built |
| Never-touch components (Button, Card, Badge, 13 domain-specific) | Sections 4, 11 | Never-touch list is known |
| Live chat UX micro-patterns (6 items) | Section 6 | New RT-7 needed for implementation |
| Typography recipes (6 contexts) | Section 2 | Feeds into documentation phase |
| Documentation deliverables (4 named docs) | Section 10 | Phase 5 has specific targets |

---

## Research Question Decomposition

| ID | Sub-question | Domain | Parallel | Dependencies | Assigned To |
|----|-------------|--------|----------|--------------|-------------|
| SQ-1 | What are the exact CSS additions needed in globals.css? (Write the patch, not the analysis) | CODEBASE | yes | NONE | Migration Architect |
| SQ-2 | For each of the 10 missing components, what npm packages are needed and are they Tailwind v4 compatible? | CODEBASE | yes | NONE | Dependency Analyst |
| SQ-3 | For each of the 10 missing components, what token substitutions and structural changes are needed to port them? | CODEBASE | yes | NONE | Component Adapter |
| SQ-4 | What is the exact import count for every current component across the codebase? | CODEBASE | yes | NONE | Impact Analyst |
| SQ-5 | What is the safe, phased migration plan with rollback per phase? | ARCHITECTURE | no | SQ-2, SQ-3, SQ-4 | Migration Architect |
| SQ-6 | What validation strategy ensures zero regressions? | ARCHITECTURE | no | SQ-4, SQ-5 | Migration Architect |
| SQ-7 | What are the exact code changes for the 6 live chat UX micro-patterns? | CODEBASE | yes | NONE | Component Adapter |

### Dependency Graph

```
SQ-2 (Dependency Analyst)  ──┐
SQ-3 (Component Adapter)  ──┼──► SQ-5 (Migration Architect) ──► SQ-6 (Validation)
SQ-4 (Impact Analyst)     ──┘

SQ-1 (Token Patch)           ──► Merged into Phase 0 of SQ-5
SQ-7 (UX Micro-patterns)    ──► Merged into Phase 3 of SQ-5
```

- **Wave 1**: SQ-1, SQ-2, SQ-3, SQ-4, SQ-7 run in parallel (3 agents)
- **Wave 2**: SQ-5 + SQ-6 synthesized by Migration Architect (1 agent, opus)

---

## Team Composition

### Dependency Analyst

- **Focus**: For each missing high-priority component, analyze npm packages required, check version compatibility with current `package.json`, and identify Tailwind v4 incompatibilities.
- **Sub-questions**: SQ-2
- **Model**: sonnet
- **Output format**: Per-component dependency table with package name, required version, current installed version (if any), compatibility status, and Tailwind v4 notes. Plus a combined `npm install` command for all safe additions.
- **Completion criteria**: All 10 high-priority missing components analyzed. Every required npm package checked against current `frontend/package.json`. Tailwind v4 compatibility confirmed or flagged.

**Spawn prompt**:
> You are a **Dependency Analyst** researching npm package compatibility for design system migration.
>
> **Your task**: For each of these 10 missing components, determine what npm packages are needed and whether they're compatible with the current SknApp setup.
>
> **Components to analyze**:
> 1. Table/DataTable
> 2. Popover
> 3. Form (react-hook-form + zod)
> 4. Sheet
> 5. Pagination
> 6. Chart (Recharts)
> 7. Calendar/DatePicker
> 8. Accordion
> 9. Command Palette (cmdk)
> 10. Textarea
>
> **Methodology**:
> 1. Read `examples/admin-chat-system/package.json` — extract all dependencies and their versions
> 2. Read `frontend/package.json` — extract all dependencies and their versions
> 3. For each component, read the actual source file in `examples/admin-chat-system/components/ui/` to identify exact imports (Radix packages, other deps)
> 4. Check if current project already has any of these packages installed
> 5. Identify version conflicts (e.g., different major versions)
> 6. CRITICAL: The current project uses Tailwind v4 CSS-first config (`@theme` blocks in globals.css), NOT the config-file approach the example uses. Check `examples/admin-chat-system/tailwind.config.ts` to understand what it extends.
> 7. Also read `examples/admin-chat-system/components.json` for shadcn/ui configuration details
>
> Also reference `research/common/ui-design-system-comparison-merged.md` sections 9 (Technology Stack) and 12 (Action Plan) for context.
>
> **Output format** (markdown):
> ```
> ## Dependency Analysis Report
>
> ### Example vs Current Package Comparison
> | Package | Example Version | Current Version | Status |
>
> ### Per-Component Analysis
>
> #### 1. Table/DataTable
> | Package | Example Version | Current Version | Status | Notes |
> - Tailwind v4 compatibility: {yes/no/needs-adaptation}
> - Risk level: {LOW/MEDIUM/HIGH}
> - Component source file analysis: (key imports found)
>
> (repeat for each of the 10 components)
>
> ### Summary
> | Component | New Packages Needed | Risk | Tailwind v4 Safe |
>
> ### Recommended Install Command
> (Single npm install command for all safe additions)
>
> ### Packages to Avoid or Defer
> (Any packages with compatibility concerns, with explanation)
> ```
>
> **Quality bar**: Every Radix UI package import in the 10 component files must be traced to a package.json entry and verified. No assumptions.
>
> Write your complete report to `.claude/PRPs/research-plans/rt-2-dependency-analysis.md`

---

### Component Adapter

- **Focus**: For each example shadcn/ui component to adopt, identify exact code modifications needed. Also produce the live chat UX micro-pattern code changes.
- **Sub-questions**: SQ-3 + SQ-7
- **Model**: sonnet
- **Output format**: Per-component adaptation guide showing: original className patterns, required token substitutions, Tailwind v4 syntax changes, risk rating. Plus a section for the 6 UX micro-pattern changes with exact code diffs.
- **Completion criteria**: All 10 missing components have adaptation guides. All 6 UX micro-patterns have exact code changes. Every shadcn token in example code is mapped to SknApp equivalent.

**Spawn prompt**:
> You are a **Component Adapter** researching how to port shadcn/ui components and UX patterns from the example into the current SknApp design system.
>
> **You have TWO tasks:**
>
> ## Task A: Component Adaptation (SQ-3)
>
> For each of the 10 high-priority missing components, analyze the example source code and document exactly what needs to change.
>
> **Components to analyze** (read each file from `examples/admin-chat-system/components/ui/`):
> 1. `table.tsx`
> 2. `popover.tsx`
> 3. `form.tsx`
> 4. `sheet.tsx`
> 5. `pagination.tsx`
> 6. `chart.tsx`
> 7. `calendar.tsx`
> 8. `accordion.tsx`
> 9. `command.tsx`
> 10. `textarea.tsx`
>
> **Context — Current SknApp conventions** (read these for patterns):
> - `frontend/components/ui/Button.tsx` — shows CVA variant pattern, className conventions
> - `frontend/components/ui/Card.tsx` — shows variant system
> - `frontend/components/ui/Modal.tsx` — shows dialog pattern
> - `frontend/app/globals.css` — shows token naming
>
> **Token mapping** (from `research/common/ui-design-system-comparison-merged.md` Section 13):
> | Example class | Current SknApp equivalent |
> |---|---|
> | `bg-primary` | `bg-brand-500` |
> | `text-primary-foreground` | `text-white` |
> | `bg-accent` | `bg-brand-50` or `bg-gray-100` |
> | `text-accent-foreground` | `text-brand-900` or `text-gray-900` |
> | `bg-muted` | `bg-gray-50` |
> | `text-muted-foreground` | `text-text-secondary` |
> | `bg-destructive` | `bg-danger` |
> | `text-destructive-foreground` | `text-white` |
> | `border-input` | `border-gray-200` |
> | `ring-ring` | `ring-brand-500` |
> | `bg-popover` | `bg-white` or `bg-surface` |
> | `text-popover-foreground` | `text-text-primary` |
> | `bg-card` | `bg-surface` |
> | `text-card-foreground` | `text-text-primary` |
> | `border-border` | `border-gray-200` |
> | `bg-secondary` | `bg-gray-100` |
> | `text-secondary-foreground` | `text-gray-900` |
>
> **Per-component output**:
> - Lines of code, Radix imports, token substitutions table, structural changes, difficulty (DROP-IN/MINOR/MODERATE/MAJOR), recommended file path
>
> ## Task B: Live Chat UX Micro-Patterns (SQ-7)
>
> Read the merged report Section 6 ("Live Chat UX Pattern Consistency") and for each of the 6 identified changes, produce the **exact code diff** by reading the current source files:
>
> 1. **Message bubble corner-cut**: Read `frontend/app/admin/live-chat/_components/MessageBubble.tsx`, find the `rounded-2xl` class, produce the exact `rounded-tr-sm`/`rounded-tl-sm` change
> 2. **Status dot border ring**: Find status dot rendering, add `border-2 border-white` and absolute positioning
> 3. **Read receipt icons**: Find timestamp/status rendering in MessageBubble, add `CheckCheck`/`Check` icon pattern
> 4. **Toast slide animation**: Read `frontend/app/admin/live-chat/_components/NotificationToast.tsx`, change fade to `.toast-slide`
> 5. **Vibration API**: Add `navigator.vibrate(200)` to notification sound handler
> 6. **Status dot size**: Standardize all status dots to `h-3 w-3`
>
> For each: provide the exact `old_string -> new_string` replacement.
>
> **Output format** (markdown):
> ```
> ## Component Adaptation Guide
>
> ### Part A: Classification Summary
> | Component | File | Lines | Difficulty | Token Changes | Structural Changes | Risk |
>
> ### Per-Component Guide
> (details for each of the 10 components)
>
> ---
>
> ## Live Chat UX Micro-Pattern Changes
>
> ### 1. Message Bubble Corner-Cut
> **File**: `frontend/app/admin/live-chat/_components/MessageBubble.tsx`
> **Old**: (exact string)
> **New**: (exact string)
> **Risk**: LOW
>
> (repeat for all 6 patterns)
> ```
>
> Write your complete report to `.claude/PRPs/research-plans/rt-3-component-adaptation.md`

---

### Impact Analyst

- **Focus**: Count exact imports for every current component. Use pre-existing classifications from the merged report — only add grep-verified import counts and page mappings.
- **Sub-questions**: SQ-4
- **Model**: sonnet
- **Output format**: Import count matrix with component name, file path, import count (from grep), importing pages, and pre-assigned classification (from merged report).
- **Completion criteria**: Every component in `components/ui/`, `components/admin/`, and `live-chat/_components/` has an exact import count from grep. No estimated counts.

**Spawn prompt**:
> You are an **Impact Analyst** verifying component usage across the SknApp codebase.
>
> **Your task**: For every current SknApp UI component, count exact imports using grep and map which pages use each component.
>
> **IMPORTANT**: The component classifications (KEEP/ENHANCE/ADD) are ALREADY DETERMINED by the merged comparison report at `research/common/ui-design-system-comparison-merged.md` Section 4. You do NOT need to re-derive these. Your job is to add the **import counts** and **page mappings** that the merged report is missing.
>
> **Pre-determined classifications** (from merged report, treat as ground truth):
>
> **KEEP (Do Not Replace)** — current is stronger or unique:
> - Button (9 variants, 7 sizes), Card (6 variants), Badge (7 variants, 3 appearances)
> - Toast (custom Zustand-based), Modal, ModalAlert, Sidebar (inline in layout)
> - All 13 domain-specific components (CannedResponsePicker, SessionActions, TransferDialog, QuickReplies, EmojiPicker, StickerPicker, BotStatusIndicator, SessionTimeoutWarning, NotificationToast, AdminSearchFilterBar, AssignModal, ActionIconButton, LoadingSpinner)
>
> **MATCH (No Change Needed)** — equivalent implementations:
> - Alert, Avatar, Checkbox, DropdownMenu, Input, Label, Progress, RadioGroup, Select, Separator, Skeleton, Switch, Tabs, Tooltip
>
> **ADD (Net-New, Zero Risk)** — 10 missing components:
> - Table, Popover, Form, Sheet, Pagination, Chart, Calendar, Accordion, Command, Textarea
>
> **Methodology**:
> 1. For each component in `frontend/components/ui/` — grep the entire `frontend/` directory for imports of that component. Count distinct files.
> 2. For each component in `frontend/components/admin/` — same grep.
> 3. For each component in `frontend/app/admin/live-chat/_components/` — same grep.
> 4. For each, list which admin pages (`/admin/*`) import it.
> 5. Flag any component with 10+ imports as "high-usage" (extra caution during migration).
>
> **Output format** (markdown):
> ```
> ## Impact Analysis Report (Import Counts)
>
> ### Base UI Components (`components/ui/`)
> | Component | File | Imports | Importing Pages | Classification | High-Usage |
>
> ### Admin Components (`components/admin/`)
> | Component | File | Imports | Importing Pages | Classification | High-Usage |
>
> ### Live Chat Components (`live-chat/_components/`)
> | Component | File | Imports | Importing Pages | Classification | High-Usage |
>
> ### High-Usage Components (10+ imports)
> | Component | Import Count | Risk Note |
>
> ### Zero-Import Components (potentially dead code)
> | Component | File | Notes |
> ```
>
> **Quality bar**: Import counts must be from actual grep results, not estimates. Show the grep pattern used.
>
> Write your complete report to `.claude/PRPs/research-plans/rt-4-impact-analysis.md`

---

### Migration Architect

- **Focus**: Synthesize all findings into a phased migration plan with rollback strategies. Also produces the token CSS patch (SQ-1) and validation playbook (SQ-6) directly — no separate researcher needed.
- **Sub-questions**: SQ-1 + SQ-5 + SQ-6
- **Model**: opus
- **Output format**: Complete migration plan with: never-touch list, 6 phases (prerequisites, zero-risk additions, low-risk enhancements, UX polish, documentation, cleanup), rollback per phase, risk matrix, and validation playbook.
- **Completion criteria**: Every component from Wave 1 reports is placed into a phase or never-touch list. Each phase has rollback instructions. Validation playbook covers every admin page.

**Spawn prompt**:
> You are a **Migration Architect** synthesizing research into a safe, phased migration plan.
>
> **Your task**: Using the findings from the Dependency Analyst, Component Adapter, and Impact Analyst, plus the pre-existing merged comparison report, create a comprehensive migration plan.
>
> **Input — Read these files**:
> 1. `.claude/PRPs/research-plans/rt-2-dependency-analysis.md` (Dependency Analyst output)
> 2. `.claude/PRPs/research-plans/rt-3-component-adaptation.md` (Component Adapter output — includes UX micro-patterns)
> 3. `.claude/PRPs/research-plans/rt-4-impact-analysis.md` (Impact Analyst output)
> 4. `research/common/ui-design-system-comparison-merged.md` (Pre-existing 6-agent consensus)
>
> **Also read for validation planning**:
> - `frontend/package.json` for available scripts
> - `frontend/tsconfig.json` for TypeScript config
>
> **Pre-determined constraints** (from merged report, non-negotiable):
> - Do NOT migrate wholesale to shadcn/ui (Section 11)
> - Never replace: Button, Card, Badge, Toast, Modal, ModalAlert, Sidebar, all 13 domain-specific components
> - Token additions already identified: `--chart-1..5`, accent color, `--sidebar-primary-fg` (Section 1)
> - Action plan skeleton already exists as 4 phases (Section 12) — build on this, don't start from scratch
> - Typography recipes ready (Section 2) — include in documentation phase
> - Documentation deliverables named (Section 10): cookbook appendix, parity matrix, live chat pattern appendix, scope boundaries doc
>
> **You are responsible for THREE deliverables**:
>
> ### Deliverable 1: Token CSS Patch (SQ-1)
>
> Using the merged report Sections 1 and 13, write the **exact CSS** to add to `frontend/app/globals.css` within the `@theme` block. This is NOT an analysis — it's the actual code patch. Include:
> - `--chart-1` through `--chart-5` (pick harmonious HSL values matching the purple brand)
> - Accent color token (teal/green from example: `162 72% 45%`)
> - `--sidebar-primary-fg` token
> - Any other tokens identified as safe-to-add in the dependency/adapter reports
>
> ### Deliverable 2: Phased Migration Plan (SQ-5)
>
> **Safety principles**:
> 1. **Net-new first**: Add components that don't exist yet (zero blast radius)
> 2. **Tokens before components**: CSS variable additions before any component changes
> 3. **One phase at a time**: Each phase independently deployable and rollback-able
> 4. **Never replace stronger**: If current has more variants, enhance don't replace
> 5. **Test between phases**: Type-check, lint, build must pass before proceeding
> 6. **Preserve all existing imports**: No breaking changes to component APIs
>
> **Required phases** (build on merged report Section 12):
> - Phase 0: Prerequisites (npm install, token patch)
> - Phase 1: Zero-risk component additions (net-new only)
> - Phase 2: Low-risk component additions (components with dependencies on Phase 1)
> - Phase 3: Live chat UX micro-pattern polish (from RT-3 Task B output)
> - Phase 4: Documentation (4 named deliverables from Section 10 + typography recipes from Section 2)
> - Phase 5: Cleanup and audit
>
> Each phase needs: component list, exact steps, rollback procedure, success criteria.
>
> ### Deliverable 3: Validation Playbook (SQ-6)
>
> Check what tools are available in `frontend/package.json` and `frontend/tsconfig.json`, then define:
> - Automated checks to run after every phase (exact commands)
> - Visual QA checklist per phase (which pages to open, what to verify)
> - Rollback triggers (what failures mean "stop and revert")
> - Final acceptance criteria
>
> **Admin pages to cover in visual QA**:
> `/admin` (dashboard), `/admin/live-chat`, `/admin/live-chat/analytics`, `/admin/requests`, `/admin/friends`, `/admin/chatbot`, `/admin/auto-replies`, `/admin/rich-menus`, `/admin/settings`, `/admin/analytics`, `/admin/audit`, `/admin/users`, `/admin/files`, `/admin/reports`, `/admin/logs`, `/admin/design-system`
>
> **Output format** (single markdown file):
> ```
> ## Migration Plan: Admin UI Design System
>
> ### Part 1: Token CSS Patch
> (Exact CSS code to add)
>
> ### Part 2: Never-Touch List
> | Component | Reason |
>
> ### Part 3: Phased Migration Plan
>
> #### Phase 0: Prerequisites
> - npm install command
> - Token patch (reference Part 1)
> - Go/no-go criteria
> - Rollback: ...
>
> #### Phase 1: Zero-Risk Component Additions
> | Component | Source | Target | Steps | Validation |
> - Rollback: ...
> - Success criteria: ...
>
> (repeat for Phases 2-5)
>
> ### Part 4: Risk Matrix
> | Risk | Likelihood | Impact | Mitigation |
>
> ### Part 5: Validation Playbook
>
> #### Automated Checks (Every Phase)
> | Check | Command | Expected Result | Blocks Next Phase |
>
> #### Visual QA Checklist
> | Page | URL | What to Check | Priority |
>
> #### Rollback Triggers
> | Trigger | Action |
>
> #### Final Acceptance Criteria
> - [ ] ...
>
> ### Part 6: Migration Checklist
> - [ ] Phase 0 complete
> - [ ] Phase 1 complete + validated
> - [ ] ...
> ```
>
> **Quality bar**: Every component from the Wave 1 reports must appear somewhere — in a phase or on the never-touch list. Every admin page must appear in the visual QA checklist.
>
> Write your complete report to `.claude/PRPs/research-plans/rt-5-migration-plan.md`

---

## Research Tasks

### Wave 1: Foundation (Parallel — 3 agents)

| ID | Title | Assignee | Type | Dependencies | Acceptance Criteria | Effort |
|----|-------|----------|------|-------------|-------------------|--------|
| RT-2 | Audit npm dependency compatibility for 10 missing components | Dependency Analyst | RESEARCH | NONE | All 10 components analyzed, all Radix packages verified, install command ready | MEDIUM |
| RT-3 | Create adaptation guide for 10 components + 6 UX micro-patterns | Component Adapter | ANALYSIS | NONE | All 10 components have token maps + all 6 UX patterns have exact code diffs | HIGH |
| RT-4 | Grep import counts for every current component | Impact Analyst | RESEARCH | NONE | All 47 components have exact import counts from grep | MEDIUM |

### Wave 2: Synthesis (1 agent, opus)

| ID | Title | Assignee | Type | Dependencies | Acceptance Criteria | Effort |
|----|-------|----------|------|-------------|-------------------|--------|
| RT-5 | Create token patch + phased migration plan + validation playbook | Migration Architect | SYNTHESIS | RT-2, RT-3, RT-4 | Token CSS ready, 6-phase plan with rollback, validation covers all 16 admin pages | HIGH |

### Removed Tasks (Pre-Answered by Merged Report)

| Original ID | Reason for Removal |
|-------------|-------------------|
| RT-1 (Token Analysis) | Merged into RT-5 Part 1 — analysis done in merged report Sections 1+13, only CSS patch needed |
| RT-6 (Validation Playbook) | Merged into RT-5 Part 5 — single architect produces plan + validation together for consistency |

### Added Tasks (Missing from Original Plan)

| New ID | What Was Missing | Source |
|--------|-----------------|--------|
| SQ-7 / RT-3 Task B | Live chat UX micro-pattern code changes | Merged report Section 6 — 6 concrete changes not in original plan |

### Cross-Cutting Concerns

- **Citations**: Reference exact file paths with line numbers (e.g., `frontend/components/ui/Button.tsx:42`)
- **Confidence levels**: Tag all findings as HIGH / MEDIUM / LOW with rationale
- **Contradictions**: When example and current patterns conflict, document both approaches with trade-offs
- **Scope boundaries**: Do NOT recommend changes to backend code, WebSocket logic, or Zustand store architecture. This migration is CSS/component-level only.
- **Pre-existing findings**: Always check `research/common/ui-design-system-comparison-merged.md` before re-deriving any classification or mapping.

---

## Team Orchestration Guide

### Prerequisites

1. Ensure the merged comparison report exists: `research/common/ui-design-system-comparison-merged.md`
2. Review the team composition (4 researchers, down from 5)
3. Confirm scope: CSS/component-level migration only, no backend changes

### Execution Steps

**Wave 1** (launch 3 parallel Task agents):
```
Task(subagent_type="general-purpose", model="sonnet", prompt=<Dependency Analyst spawn prompt>)
Task(subagent_type="general-purpose", model="sonnet", prompt=<Component Adapter spawn prompt>)
Task(subagent_type="general-purpose", model="sonnet", prompt=<Impact Analyst spawn prompt>)
```

**Wave 2** (after all Wave 1 complete):
```
Task(subagent_type="general-purpose", model="opus", prompt=<Migration Architect spawn prompt>)
```

### Communication Patterns

- **Handoff**: Wave 1 agents write to `.claude/PRPs/research-plans/rt-{N}-*.md`. Migration Architect reads all three.
- **Pre-existing context**: All agents reference `research/common/ui-design-system-comparison-merged.md` as ground truth.
- **Contradiction**: If a Wave 1 agent finds something that contradicts the merged report, they flag it explicitly. The Migration Architect resolves during synthesis.

### Output Files

| Task | Output File |
|------|------------|
| RT-2 | `.claude/PRPs/research-plans/rt-2-dependency-analysis.md` |
| RT-3 | `.claude/PRPs/research-plans/rt-3-component-adaptation.md` |
| RT-4 | `.claude/PRPs/research-plans/rt-4-impact-analysis.md` |
| RT-5 | `.claude/PRPs/research-plans/rt-5-migration-plan.md` |

---

## Acceptance Criteria

Research is complete when ALL of the following are met:

- [ ] All 10 missing component dependencies verified compatible (RT-2)
- [ ] All 10 missing components have adaptation guides with token maps (RT-3 Part A)
- [ ] All 6 live chat UX micro-patterns have exact code diffs (RT-3 Part B)
- [ ] All 47 current components have grep-verified import counts (RT-4)
- [ ] Token CSS patch is ready to apply (RT-5 Part 1)
- [ ] 6-phase migration plan exists with rollback per phase (RT-5 Part 3)
- [ ] Never-touch list explicitly documented (RT-5 Part 2)
- [ ] Validation playbook covers all 16 admin pages (RT-5 Part 5)
- [ ] Every finding has a confidence level (HIGH/MEDIUM/LOW)
- [ ] The plan is executable by a developer without additional research

---

## Output Format: Final Report Structure

The final research report (assembled from task outputs) should follow:

1. **Executive Summary** — Migration feasibility assessment (2-3 paragraphs)
2. **Key Findings** — Bulleted list of major discoveries
3. **Token CSS Patch** — Exact code to add to globals.css (from RT-5 Part 1)
4. **Dependency Audit** — Package compatibility matrix (from RT-2)
5. **Component Adaptation** — Per-component porting guides (from RT-3 Part A)
6. **Live Chat UX Changes** — 6 micro-pattern code diffs (from RT-3 Part B)
7. **Impact Analysis** — Import count matrix (from RT-4)
8. **Migration Plan** — 6-phase plan with rollback (from RT-5 Part 3)
9. **Validation Playbook** — Testing strategy per phase (from RT-5 Part 5)
10. **Risk Matrix** — All identified risks with mitigations (from RT-5 Part 4)
11. **Never-Touch List** — Components that must not be modified (from RT-5 Part 2)
12. **Documentation Deliverables** — 4 named docs + typography recipes to create in Phase 4
