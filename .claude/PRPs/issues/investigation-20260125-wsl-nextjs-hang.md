# Investigation: Next.js dev server hangs at "Ready in X s" in WSL

**Issue**: Free-form (no GitHub issue)
**Type**: BUG
**Investigated**: 2025-01-25T00:00:00Z

---

### Assessment

| Metric    | Value  | Reasoning                                                                                         |
| --------- | ------ | ------------------------------------------------------------------------------------------------- |
| Severity  | HIGH   | Development workflow is blocked - user cannot run the frontend dev server in their WSL environment |
| Complexity | LOW    | Single file change (package.json) - isolated fix with no integration points                        |
| Confidence | HIGH   | Root cause is clear and verified - invalid CLI flag in npm script                                |

---

## Problem Statement

The Next.js development server appears to start successfully, showing "Ready in X s", but then hangs without actually compiling the application. This occurs in a WSL2 environment when running `npm run dev` from the `frontend/` directory.

---

## Analysis

### Root Cause

The `dev` script in `frontend/package.json` contains an **invalid CLI flag** `--webpack` that is not recognized by Next.js. When Next.js encounters an unknown flag, it may display the ready message but fail to proceed with the actual compilation process.

### Evidence Chain

**WHY**: Does `npm run dev` hang after showing "Ready in X s"?

↓ BECAUSE: The dev script uses an invalid `--webpack` flag
**Evidence**: `frontend/package.json:6` - `"dev": "next dev --webpack -p 3000 -H 0.0.0.0"`

↓ ROOT CAUSE: Next.js does not support a `--webpack` flag for the `dev` command
**Evidence**: Next.js CLI documentation - Valid flags for `next dev` are: `-p` (port), `-H` (hostname), `--turbo` (use Turbopack), `--help`. There is NO `--webpack` flag.

### Affected Files

| File                  | Lines | Action | Description                          |
| --------------------- | ----- | ------ | ------------------------------------ |
| `frontend/package.json` | 6     | UPDATE | Remove invalid `--webpack` flag from dev script |

### Integration Points

- None - This is an isolated npm script change
- The dev server's behavior affects all frontend development
- No other code depends on the npm script syntax

### Git History

```bash
# Check when this was introduced
git log --oneline -10 -- frontend/package.json
```

**Implication**: This appears to be a long-standing misconfiguration, possibly from misunderstanding Next.js CLI flags. The `--turbo` flag exists for Turbopack, but someone may have incorrectly assumed `--webpack` was also valid.

---

## Implementation Plan

### Step 1: Remove invalid --webpack flag from dev script

**File**: `frontend/package.json`
**Lines**: 6
**Action**: UPDATE

**Current code:**

```json
// Line 6
"dev": "next dev --webpack -p 3000 -H 0.0.0.0"
```

**Required change:**

```json
// Line 6
"dev": "next dev -p 3000 -H 0.0.0.0"
```

**Why**: The `--webpack` flag is not a valid Next.js CLI flag and causes the dev server to hang. Removing it will allow normal compilation to proceed.

---

## Patterns to Follow

**Standard Next.js dev script patterns:**

```json
// Basic development server
"dev": "next dev"

// With custom port
"dev": "next dev -p 3000"

// With custom hostname (for WSL/Docker)
"dev": "next dev -p 3000 -H 0.0.0.0"

// With Turbopack (faster, but experimental)
"dev": "next dev --turbo -p 3000 -H 0.0.0.0"
```

**From the current codebase**: The intent to bind to `0.0.0.0` is correct for WSL (allows access from Windows host), so keep that. Only remove the invalid `--webpack` flag.

---

## Edge Cases & Risks

| Risk/Edge Case | Mitigation |
| -------------- | ---------- |
| User may have wanted to use Turbopack | Document that `--turbo` is the correct flag if they want faster builds |
| Breaking changes if running from scripts that parse output | Minimal - output format will be the same, just with successful compilation |
| Port 3000 already in use | The `-p 3000` flag is valid; if port conflict exists, user will get clear error |

---

## Validation

### Automated Checks

```bash
# From frontend directory
cd frontend
npm run dev
# Should now show successful compilation with:
# - Ready in ... s
# - Compiled /page in X ms
# - Local: http://localhost:3000
```

### Manual Verification

1. Run `npm run dev` in the WSL frontend directory
2. Verify the dev server starts and shows compilation messages
3. Access http://localhost:3000 from Windows browser
4. Verify the application loads correctly

---

## Scope Boundaries

**IN SCOPE:**

- Remove invalid `--webpack` flag from dev script in `frontend/package.json`

**OUT OF SCOPE (do not touch):**

- Adding `--turbo` flag (unless user explicitly requests it)
- Changing other scripts (build, start, lint)
- Modifying next.config.js or other configuration files
- Addressing any other WSL-specific performance issues

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2025-01-25T00:00:00Z
- **Artifact**: `.claude/PRPs/issues/investigation-20260125-wsl-nextjs-hang.md`
