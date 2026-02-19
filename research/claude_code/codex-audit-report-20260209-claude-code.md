# CodeX Agent — Comprehensive Audit Report

> **Agent**: Claude Code (claude-opus-4.6)
> **Date**: 2026-02-09 10:30 +07:00
> **Scope**: All files modified/created by CodeX across sessions Feb 8-9, 2026
> **Branch**: `fix/live-chat-redesign-issues`

---

## Executive Summary

Audited **24+ files** modified by CodeX across backend and frontend. Found **22 issues total**: 3 Critical, 6 High, 8 Medium, 5 Low. The most severe problems are **non-functional tests** (wrong pytest API), **non-idempotent migrations**, and **missing auth headers** on all admin API calls. CodeX delivered working features but missed critical production-readiness requirements.

### Scoreboard

| Category | Score | Issues |
|----------|-------|--------|
| Backend Logic | 7/10 | Redis fallback good, but type coercion & error handling gaps |
| Backend Tests | 3/10 | Tests use wrong API, FakeRedis stubs test nothing |
| Database Migrations | 6/10 | Functional but not idempotent |
| Frontend Security | 4/10 | No auth headers, XSS risks, token exposure |
| Frontend UX | 7/10 | Functional but missing loading/error states |
| Frontend Types | 6/10 | Some type safety issues |
| Accessibility | 6/10 | A11y work done but incomplete keyboard nav |

---

## CRITICAL Issues (Must Fix Before Production)

### C1. Pytest MonkeyPatch API Misuse — Tests Cannot Run
- **File**: `backend/tests/test_websocket_manager_redis.py:65,81`
- **Severity**: CRITICAL | **Confidence**: 100%
- **Description**: `pytest.MonkeyPatch.context()` does not exist. Both test functions crash immediately with `AttributeError`.
- **Impact**: Entire test file is non-functional. Zero test coverage for Redis WebSocket features.
- **Fix**: Replace with monkeypatch fixture injection:
  ```python
  @pytest.mark.asyncio
  async def test_example(monkeypatch):
      monkeypatch.setattr(redis_client, "_redis", fake)
  ```

### C2. Missing Authentication Headers on All Admin API Calls
- **Files**: 6 frontend files
  - `frontend/app/admin/settings/line/page.tsx:43`
  - `frontend/components/admin/CredentialForm.tsx:46`
  - `frontend/app/admin/rich-menus/page.tsx:23`
  - `frontend/app/admin/rich-menus/new/page.tsx`
  - `frontend/app/admin/rich-menus/[id]/edit/page.tsx`
  - `frontend/app/admin/friends/page.tsx`
- **Severity**: CRITICAL | **Confidence**: 100%
- **Description**: All `fetch()` calls to `/admin/*` endpoints lack `Authorization: Bearer <token>` headers.
- **Impact**: All admin API calls will fail 401 in production. Works only in DEV_MODE.
- **Fix**: Import `useAuth` and add headers:
  ```typescript
  const { token } = useAuth();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  ```

### C3. Database Migration Not Idempotent — Fails on Re-run
- **File**: `backend/alembic/versions/c3d4e5f6g7h8_add_performance_indexes.py:48-52`
- **Severity**: CRITICAL | **Confidence**: 85%
- **Description**: Composite index `idx_messages_user_created` created via raw SQL without existence check, unlike other indexes in the same migration that use `_index_exists()`.
- **Impact**: Migration crashes on second run: `relation 'idx_messages_user_created' already exists`.
- **Fix**: Wrap in existence check:
  ```python
  if not _index_exists(connection, "idx_messages_user_created"):
      op.execute(sa.text("CREATE INDEX idx_messages_user_created ON messages (line_user_id, created_at DESC)"))
  ```

---

## HIGH Severity Issues

### H1. FakeRedis Stubs Provide Zero Test Coverage
- **File**: `backend/tests/test_websocket_manager_redis.py:41-56`
- **Severity**: HIGH | **Confidence**: 85%
- **Description**: `FakeRedis` class stubs all operations to return `None`/empty. Tests assert nothing meaningful about Redis behavior.
- **Untested features**: Operator presence tracking, availability analytics, heartbeat expiration, room membership persistence, multi-day time-splitting logic.
- **Fix**: Use real Redis (via testcontainers or docker) or a proper fake that tracks state.

### H2. SQLAlchemy Relationship Conflicts Suppressed with `overlaps`
- **Files**: `backend/app/models/tag.py:16,21,32,33`, `backend/app/models/user.py:53,58`
- **Severity**: HIGH | **Confidence**: 80%
- **Description**: Both `secondary` relationship and association object relationships exist on Tag/User models. `overlaps` parameter silences SQLAlchemy warnings rather than fixing the root cause.
- **Impact**: Potential N+1 queries, unexpected lazy/eager loading behavior, hard-to-debug ORM issues.
- **Fix**: Choose one pattern — either secondary relationship OR association object, not both.

### H3. Migration Downgrade Not Idempotent
- **File**: `backend/alembic/versions/c3d4e5f6g7h8_add_performance_indexes.py:55-58`
- **Severity**: HIGH | **Confidence**: 80%
- **Description**: `downgrade()` drops indexes without checking existence.
- **Impact**: `alembic downgrade` twice will fail with "index does not exist".
- **Fix**: Add `IF EXISTS` or use `try/except`.

### H4. Missing Error Boundaries (Frontend)
- **Files**: All client components
- **Severity**: HIGH | **Confidence**: 90%
- **Description**: No React error boundaries. Unhandled errors crash the entire app tree showing blank screen.
- **Fix**: Wrap major route components with `ErrorBoundary`.

### H5. XSS Risk — Native `<img>` Tags Instead of Next.js Image
- **Files**: `frontend/app/admin/rich-menus/page.tsx:135`, `frontend/app/admin/friends/page.tsx:109`, and others
- **Severity**: HIGH | **Confidence**: 85%
- **Description**: Using `<img>` with ESLint warnings disabled. Bypasses Next.js security/optimization.
- **Impact**: Missing lazy loading, image optimization, and potential XSS if image URLs are user-controlled (LINE profile pictures).
- **Fix**: Replace with Next.js `Image` component.

### H6. Type Safety Issue — External Type Imports
- **Files**: `frontend/app/liff/service-request/page.tsx:6`, `frontend/app/liff/service-request-single/page.tsx:6`
- **Severity**: HIGH | **Confidence**: 85%
- **Description**: `import { Province, District, SubDistrict } from '../../../types/location'` — fragile path, types may not match backend schema.
- **Fix**: Move types to `@/types/` alias or generate from API schema.

---

## MEDIUM Severity Issues

### M1. Missing Error Handling in Redis Operations
- **File**: `backend/app/core/websocket_manager.py:310-330,398-403,513-520`
- **Severity**: MEDIUM | **Confidence**: 80%
- **Description**: Redis operations don't handle partial failures or log errors. Transient Redis failures make operators appear offline silently.
- **Fix**: Add try/except with logging around Redis calls.

### M2. Inconsistent admin_id Type Handling
- **File**: `backend/app/core/websocket_manager.py:310,398,429,513`
- **Severity**: MEDIUM | **Confidence**: 80%
- **Description**: `admin_id` sometimes cast to `str()`, sometimes used raw. Risk of key mismatches.
- **Fix**: Normalize to string at entry point, use consistently.

### M3. Missing Tag Name Length Validation
- **File**: `backend/app/services/tag_service.py:19-26`
- **Severity**: MEDIUM | **Confidence**: 75%
- **Description**: DB schema is `String(50)` but service doesn't validate length before INSERT. Will get cryptic SQLAlchemy error.
- **Fix**: Add `if len(normalized_name) > 50: raise ValueError(...)`.

### M4. Race Condition in LIFF Async Initialization
- **Files**: `frontend/app/liff/service-request/page.tsx:169-170`, `frontend/app/liff/service-request-single/page.tsx:129-130`
- **Severity**: MEDIUM | **Confidence**: 90%
- **Description**: `initLiff()` and `fetchProvinces()` fire in parallel without coordination. If LIFF fails, user still sees the form without profile.
- **Fix**: Use `Promise.allSettled()` and show error state on failure.

### M5. Missing Input Sanitization (Frontend)
- **Files**: All form inputs in service-request, rich-menus, settings pages
- **Severity**: MEDIUM | **Confidence**: 85%
- **Description**: User inputs sent directly to backend without client-side sanitization.
- **Fix**: Sanitize inputs at form level (defense-in-depth).

### M6. Missing Keyboard Navigation
- **Files**: `frontend/app/admin/live-chat/_components/ConversationItem.tsx:28`, `frontend/app/admin/layout.tsx:247`
- **Severity**: MEDIUM | **Confidence**: 82%
- **Description**: Click-only interactions without `onKeyDown` handlers. WCAG 2.1 violation.
- **Fix**: Add `onKeyDown` for Enter/Space keys.

### M7. Missing Loading States in Rich Menu Editor
- **File**: `frontend/app/admin/rich-menus/[id]/edit/page.tsx`
- **Severity**: MEDIUM | **Confidence**: 85%
- **Description**: No loading indicators during save/upload. Users may double-click.
- **Fix**: Add loading spinner and disable button during async ops.

### M8. Unused State Variable
- **File**: `frontend/app/liff/service-request/page.tsx:63`
- **Severity**: MEDIUM | **Confidence**: 95%
- **Description**: `loading` state set but never rendered (line 428 commented out). Causes unnecessary re-renders.
- **Fix**: Remove or use the state variable.

---

## LOW Severity Issues

### L1. Hardcoded Magic Numbers for TTL Values
- **File**: `backend/app/core/websocket_manager.py:377,428,576,587`
- **Severity**: LOW | **Confidence**: 75%
- **Description**: TTL values like `60 * 60 * 24 * 30` scattered throughout. Hard to maintain.
- **Fix**: Extract to named constants (`PRESENCE_TTL_DAYS = 30`).

### L2. Incomplete Tag Service Test Coverage
- **File**: `backend/tests/test_tag_service.py`
- **Severity**: LOW | **Confidence**: 75%
- **Description**: Only error cases tested. No happy-path tests for `list_tags()`, `get_tag()`, successful `create_tag()`, etc.
- **Fix**: Add happy-path test coverage.

### L3. Generic Error Messages (Thai)
- **File**: `frontend/app/admin/settings/line/page.tsx:145`
- **Severity**: LOW | **Confidence**: 80%
- **Description**: `alert('เกิดข้อผิดพลาดในการบันทึก')` — no actionable error details.
- **Fix**: Show specific error from backend response.

### L4. Stale Closure Risk in useEffect
- **File**: `frontend/app/liff/service-request/page.tsx:414-425`
- **Severity**: LOW | **Confidence**: 80%
- **Description**: `isInLineApp` in dependency array may cause stale closure on `handleClose`.
- **Fix**: Wrap `handleClose` in `useCallback`.

### L5. Pytest Config Without Documentation
- **File**: `backend/pytest.ini`
- **Severity**: LOW | **Confidence**: 70%
- **Description**: New file added without explaining purpose.
- **Fix**: Add comment explaining test discovery scoping.

---

## Positive Findings (Good Work by CodeX)

| Area | Details |
|------|---------|
| Redis Fallback | Good defensive programming — local fallback when Redis unavailable |
| Server-Scoped Architecture | Correctly implements multi-server WebSocket with `server_id` |
| Media Webhook Handling | Proper error handling with fallback to None in webhook media processing |
| Cascade Deletes | Tag migration properly defines `ON DELETE CASCADE` |
| Media Test Coverage | Good unit tests for media upload/download |
| Frontend Lint | 0 errors, 0 warnings — clean codebase |
| Production Build | Next.js 16.1.1 build passes successfully |
| Component Decomposition | Live chat split into manageable components (ChatHeader, ConversationItem, etc.) |

---

## Priority Fix Order

### Immediate (Blocks Production)
1. **C2**: Add auth headers to all admin API calls (6 files)
2. **C1**: Fix pytest MonkeyPatch API usage (1 file)
3. **C3**: Add idempotency check to performance indexes migration

### Before Next Release
4. **H1**: Write real Redis integration tests
5. **H4**: Add React error boundaries
6. **H2**: Resolve SQLAlchemy relationship pattern conflicts
7. **H3**: Fix migration downgrade idempotency
8. **H5**: Replace `<img>` with Next.js `Image`

### Short-Term Improvements
9. **M1**: Add Redis error handling + logging
10. **M4**: Fix LIFF race condition
11. **M6**: Add keyboard navigation
12. **M3**: Add tag name length validation

### Nice to Have
13. **L1**: Extract TTL magic numbers
14. **L2**: Add tag service happy-path tests
15. **L3**: Improve error messages

---

## Files Reviewed

### Backend (7 files)
| File | Issues | Status |
|------|--------|--------|
| `backend/app/core/websocket_manager.py` | M1, M2, L1 | Functional, needs hardening |
| `backend/tests/test_websocket_manager_redis.py` | C1, H1 | Non-functional |
| `backend/alembic/versions/c3d4e5f6g7h8_add_performance_indexes.py` | C3, H3 | Partially broken |
| `backend/app/models/tag.py` | H2 | Works but design concern |
| `backend/app/models/user.py` | H2 | Works but design concern |
| `backend/app/services/tag_service.py` | M3 | Missing validation |
| `backend/pytest.ini` | L5 | OK |

### Frontend (17 files)
| File | Issues | Status |
|------|--------|--------|
| `frontend/app/admin/settings/line/page.tsx` | C2, L3 | No auth |
| `frontend/components/admin/CredentialForm.tsx` | C2 | No auth |
| `frontend/app/admin/rich-menus/page.tsx` | C2, H5 | No auth, XSS risk |
| `frontend/app/admin/rich-menus/new/page.tsx` | C2 | No auth |
| `frontend/app/admin/rich-menus/[id]/edit/page.tsx` | C2, M7 | No auth, no loading |
| `frontend/app/admin/friends/page.tsx` | C2, H5 | No auth, XSS risk |
| `frontend/app/admin/layout.tsx` | M6 | Keyboard nav |
| `frontend/app/admin/live-chat/_components/ChatHeader.tsx` | — | Clean |
| `frontend/app/admin/live-chat/_components/ConversationItem.tsx` | M6 | Keyboard nav |
| `frontend/app/admin/live-chat/_components/CustomerPanel.tsx` | — | Clean |
| `frontend/app/admin/live-chat/_components/MessageBubble.tsx` | — | Clean |
| `frontend/components/admin/AssignModal.tsx` | — | Clean |
| `frontend/components/admin/ChatModeToggle.tsx` | — | Clean |
| `frontend/app/liff/service-request/page.tsx` | H6, M4, M8, L4 | Multiple issues |
| `frontend/app/liff/service-request-single/page.tsx` | H6, M4 | Race condition |
| `frontend/app/page.tsx` | — | Clean |
| `frontend/eslint.config.mjs` | — | Clean |

---

## Summary Statistics

| Severity | Count | Production Blocking? |
|----------|-------|---------------------|
| Critical | 3 | Yes |
| High | 6 | Yes (some) |
| Medium | 8 | No |
| Low | 5 | No |
| **Total** | **22** | **3 blockers** |

---

*Report generated by Claude Code (claude-opus-4.6) on 2026-02-09 10:30 +07:00*
*Source handoff: `handover-codeX-20260209-0027.json`*
