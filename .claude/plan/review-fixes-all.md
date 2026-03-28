# Implementation Plan: Review Fixes (All 3 Reviews) — v2

> Generated: 2026-03-28 | Updated: 2026-03-28 (v2 — incorporates Codex plan review feedback)
> Status: PENDING REVIEW
> Sources: Codex/GPT-5 Backend Review, Codex/GPT-5 Frontend Review, Antigravity/Gemini Frontend Review, Codex Plan Review
> User Constraint: Development mode login bypass MUST remain functional

## Task Type
- [x] Frontend
- [x] Backend
- [x] Fullstack (Parallel)

---

## v2 Changes (from Codex Plan Review)

| # | Plan Review Finding | Adjustment |
|---|---------------------|------------|
| 1 | Auth bypass still fail-open with ENVIRONMENT default | Changed to explicit `DEV_AUTH_BYPASS: bool = False` flag |
| 2 | Credential encryption fallback not addressed | Added Fix 1b: fail-fast `ENCRYPTION_KEY` in non-dev mode |
| 3 | Phone binding fix is shallow | Added OTP as future phase, current fix = guard + note |
| 4 | Status enum uses wrong case | Changed to UPPERCASE to align with backend |
| 5 | Login error leaks account state | Moved `is_active` check AFTER password verify, generic error |

---

## Fixes Summary (Priority Order)

| # | Finding | Source | Severity | Effort | Phase |
|---|---------|--------|----------|--------|-------|
| 1a | Dev mode auth — explicit `DEV_AUTH_BYPASS` flag | Codex BE #1 + Plan Review #1 | CRITICAL | Medium | 1 |
| 1b | Credential encryption fallback — fail-fast | Plan Review #2 | CRITICAL | Low | 1 |
| 2 | Archive POST → PATCH (our bug) | Codex FE #6 | HIGH | 1 line | 1 |
| 3 | AGENT sees unreachable Chat Histories (our bug) | Codex FE #1 | HIGH | 1 line | 1 |
| 4 | Path traversal in LINE file upload | Codex BE #5 | HIGH | Low | 1 |
| 5 | Bot replies during HUMAN mode | Codex BE #3 | HIGH | Low | 2 |
| 6 | Inactive user can still login/access REST | Codex BE #2 + Plan Review #5 | HIGH | Low | 2 |
| 7 | Missing `await` on LINE media download | Codex BE #7 | MEDIUM | Low | 2 |
| 8 | Missing `ADMIN_URL` in Settings | Codex BE #6 | HIGH | Low | 2 |
| 9 | Malformed JWT → 500 instead of 401 | Codex BE #8 | MEDIUM | Low | 2 |
| 10 | Phone binding takeover (guard + future OTP) | Codex BE #4 + Plan Review #3 | HIGH | Medium | 3 |
| 11 | Nested `<Link><Button>` invalid markup | Codex FE #3 | HIGH | Medium | 3 |
| 12 | LIFF forms disable zoom | Codex FE #4 | HIGH | Low | 3 |
| 13 | LIFF labels missing `htmlFor` | Codex FE #5 | HIGH | Low | 3 |
| 14 | Live chat scroll vs pagination conflict | Codex FE #7 | HIGH | Low | 3 |
| 15 | Filter chips cosmetic-only in live chat | Codex FE #8 | MEDIUM | Low | 3 |
| 16 | LIFF confirmation not real dialog | Codex FE #9 | MEDIUM | Medium | 4 |
| 17 | Request status enum fragmented (UPPERCASE) | Codex FE #2 + Plan Review #4 | HIGH | Medium | 4 |
| 18 | `'use client'` overuse on new pages | Gemini #5.1 | MEDIUM | High | 5 (defer) |
| 19 | Form useState → react-hook-form | Gemini #5.4 | MEDIUM | Medium | 5 (defer) |
| 20 | `<img>` → `next/image` for avatars | Gemini #5.5 | LOW | Low | 5 (defer) |

---

## Phase 1: Critical / Quick Fixes (Bugs We Created + Security)

### Fix 1a: Dev Mode Auth — Explicit `DEV_AUTH_BYPASS` Flag

> **v2 change**: Replace `ENVIRONMENT` check with explicit `DEV_AUTH_BYPASS` boolean.
> A missing env var can no longer silently enable auth bypass.

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/core/config.py` | Modify | Add `DEV_AUTH_BYPASS`, `ADMIN_URL`; keep `ENVIRONMENT` |
| `backend/app/api/deps.py` | Modify | Use `DEV_AUTH_BYPASS` flag, add `is_active` + `int()` guard |

```python
# config.py — Add explicit dev bypass flag
class Settings(BaseSettings):
    PROJECT_NAME: str = "JskApp"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Explicit opt-in dev bypass — must set DEV_AUTH_BYPASS=true in .env
    # Default is False: safe by default even if ENVIRONMENT is mis-set
    DEV_AUTH_BYPASS: bool = False

    # Admin URL for Telegram notification links (Fix #8)
    ADMIN_URL: str = "/admin"

    # ... rest unchanged ...
```

```python
# deps.py — Use DEV_AUTH_BYPASS instead of ENVIRONMENT
async def get_current_user(...):
    from app.models.user import User, UserRole

    # Dev mode bypass: ONLY when explicitly opted-in via DEV_AUTH_BYPASS=true
    if not credentials or not credentials.credentials:
        if settings.DEV_AUTH_BYPASS:
            logger.warning("DEV AUTH BYPASS ACTIVE: No token provided, returning mock admin")
            result = await db.execute(select(User).where(User.id == 1))
            user = result.scalar_one_or_none()
            if user:
                return user
            mock_user = User(
                id=1, username="admin",
                display_name="Admin (Dev)", role=UserRole.ADMIN
            )
            db.add(mock_user)
            await db.commit()
            return mock_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(401, "Invalid authentication credentials", ...)

    token_type = payload.get("type")
    if token_type and token_type != "access":
        raise HTTPException(401, "Invalid token type", ...)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(401, "Invalid authentication credentials", ...)

    # FIX #9: Guard int() conversion
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(401, "Invalid authentication credentials", ...)

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(401, "User not found", ...)

    # FIX #6 partial: Check is_active on REST endpoints
    if not user.is_active:
        raise HTTPException(401, "Not authenticated", ...)

    return user
```

**Note**: Add `DEV_AUTH_BYPASS=true` to `backend/.env` (local dev) so existing dev workflow is unbroken.

### Fix 1b: Credential Encryption — Fail-Fast in Non-Dev Mode

> **v2 addition**: Address the deterministic Fernet key fallback from Codex BE #1.

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/services/credential_service.py` | Modify | Fail-fast if `ENCRYPTION_KEY` missing when `DEV_AUTH_BYPASS=False` |

```python
# credential_service.py — Harden encryption key fallback
class CredentialService:
    def __init__(self):
        key = settings.ENCRYPTION_KEY
        if not key:
            if settings.DEV_AUTH_BYPASS:
                # Dev mode: allow deterministic key with warning
                logger.warning("ENCRYPTION_KEY not set — using insecure dev fallback key")
                key = base64.urlsafe_b64encode(b"dev-only-insecure-key!!" .ljust(32, b"\0"))
            else:
                # Production: refuse to start with insecure encryption
                raise RuntimeError(
                    "ENCRYPTION_KEY is required when DEV_AUTH_BYPASS is disabled. "
                    "Set ENCRYPTION_KEY in .env or environment variables."
                )
        self.fernet = Fernet(key)
```

### Fix 2: Archive POST → PATCH (1 line)

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/live-chat/_components/ConversationList.tsx:57` | Modify | Change `method: 'POST'` → `method: 'PATCH'` |

```typescript
// Line 57: was 'POST', backend expects PATCH
method: 'PATCH',
```

### Fix 3: Remove AGENT from Chat Histories menu (1 line)

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/layout.tsx` | Modify | Remove `'AGENT'` from Chat Histories allowedRoles |

```typescript
// was: allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENT']
allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
```

### Fix 4: Path Traversal Sanitization

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/services/line_service.py:~277` | Modify | Sanitize filename to basename only + resolve check |

```python
raw_name = file_name or f"{media_type}_{uuid4().hex}{ext}"
# Sanitize: basename only, strip traversal patterns
safe_name = Path(raw_name).name.replace("..", "").strip()
if not safe_name:
    safe_name = f"{media_type}_{uuid4().hex}{ext}"
# Verify resolved path stays within uploads_root
full_path = (uploads_root / safe_name).resolve()
if not str(full_path).startswith(str(uploads_root.resolve())):
    safe_name = f"{media_type}_{uuid4().hex}{ext}"
    full_path = uploads_root / safe_name
```

---

## Phase 2: Backend Security & Bug Fixes

### Fix 5: Guard Bot Replies During HUMAN Mode

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/webhook.py:~231` | Modify | Add chat_mode guard before loading animation |

```python
# After WebSocket conversation update (line ~231), BEFORE loading animation:

# Skip all bot processing if user is in HUMAN mode (operator handling)
if user.chat_mode and user.chat_mode.value == "HUMAN":
    logger.info(f"User {line_user_id} in HUMAN mode — skipping bot reply")
    return

# 2. Show Loading Animation (only reaches here in BOT mode)
await line_service.show_loading_animation(line_user_id)
```

### Fix 6: Inactive User Login Rejection (Generic Error)

> **v2 change**: Check `is_active` AFTER password verification, use same generic error to prevent account-state enumeration.

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/auth.py` | Modify | Add `is_active` check after password verify + in refresh |

```python
# Login endpoint — check is_active AFTER password verify with generic error
if not user or not user.hashed_password:
    raise HTTPException(401, "Invalid username or password")

if not verify_password(payload.password, user.hashed_password):
    raise HTTPException(401, "Invalid username or password")

# is_active check — SAME generic message (no state leak)
if not user.is_active:
    raise HTTPException(401, "Invalid username or password")

# ... generate tokens ...
```

```python
# Refresh endpoint — also check is_active with generic error
if not user:
    raise HTTPException(401, "Invalid refresh token")
if not user.is_active:
    raise HTTPException(401, "Invalid refresh token")
```

### Fix 7: Missing `await` on LINE Media Download

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/services/line_service.py:236-238` | Modify | Add `await` IF methods are async coroutines |

**MUST verify first:**
```python
import inspect
print(inspect.iscoroutinefunction(blob_api.get_message_content_with_http_info))
```

If `True` → add `await`. If `False` → skip this fix (SDK is synchronous).

### Fix 8: Add `ADMIN_URL` to Settings

(Already included in Fix 1a — `ADMIN_URL: str = "/admin"`)

### Fix 9: Malformed JWT → 401

(Already included in Fix 1a — `try: int(user_id)` guard with generic error)

---

## Phase 3: Frontend Fixes (Accessibility + UX)

### Fix 10: Phone Binding — Guard + Future OTP

> **v2 change**: Current fix = prevent rebinding already-bound requests.
> Full OTP verification flow noted as future requirement.

| File | Operation | Description |
|------|-----------|-------------|
| `backend/app/api/v1/endpoints/webhook.py:~608-628` | Modify | Guard against cross-user rebinding |

```python
async def handle_bind_phone(phone_number, line_user_id, reply_token, db):
    stmt = select(ServiceRequest).where(ServiceRequest.phone_number == phone_number)
    result = await db.execute(stmt)
    requests = result.scalars().all()

    if not requests:
        await line_service.reply_text(reply_token, f"ไม่พบข้อมูลคำร้องของเบอร์ {phone_number}")
        return

    # Guard: Only bind requests that are unbound OR already bound to this user
    bindable = [r for r in requests if not r.line_user_id or r.line_user_id == line_user_id]
    already_bound_to_others = len(requests) - len(bindable)

    if not bindable:
        await line_service.reply_text(
            reply_token,
            f"คำร้องเบอร์ {phone_number} ถูกผูกกับบัญชี LINE อื่นแล้วครับ "
            "กรุณาติดต่อเจ้าหน้าที่เพื่อดำเนินการ"
        )
        return

    # Bind only eligible requests
    for req in bindable:
        req.line_user_id = line_user_id
    await db.flush()

    if already_bound_to_others > 0:
        logger.warning(
            f"Phone bind: {already_bound_to_others} requests for {phone_number} "
            f"already bound to other LINE users, skipped"
        )

    # ... continue with status display ...
```

**Future Phase (not in this plan):** Implement OTP/staff-assisted verification for phone binding.
This requires SMS gateway, OTP storage, and a verification UI flow.

### Fix 11: Button `asChild` Pattern for Link CTAs

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/components/ui/Button.tsx` | Modify | Add `asChild` prop using Radix Slot |
| `frontend/app/admin/requests/page.tsx` | Modify | Use `<Button asChild>` instead of `<Link><Button>` |

```typescript
// Button.tsx — Add asChild support (non-breaking, opt-in)
import { Slot } from '@radix-ui/react-slot';

// Add asChild to props:
asChild?: boolean;

// In render:
const Comp = asChild ? Slot : 'button';
return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;

// Usage:
<Button asChild variant="primary" size="sm">
  <Link href="/admin/requests/create">
    <Plus className="w-4 h-4 mr-1" /> สร้างคำร้อง
  </Link>
</Button>
```

### Fix 12: Remove LIFF Zoom Lock

| Files | Operation | Description |
|-------|-----------|-------------|
| `frontend/app/liff/service-request/page.tsx` | Modify | Remove `maximum-scale=1, user-scalable=0` |
| `frontend/app/liff/service-request-single/page.tsx` | Modify | Same |
| `frontend/app/liff/request-v2/page.tsx` | Modify | Same |

### Fix 13: LIFF Labels — Add `htmlFor` + `id`

| Files | Operation | Description |
|-------|-----------|-------------|
| `frontend/app/liff/request-v2/page.tsx` | Modify | Add `id` to inputs, `htmlFor` to labels |
| `frontend/app/liff/service-request-single/page.tsx` | Modify | Same |

### Fix 14: Smart Auto-Scroll (Only When Near Bottom)

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/live-chat/_components/ChatArea.tsx` | Modify | Scroll only when user is near bottom |

```typescript
const isNearBottom = useCallback(() => {
  if (!scrollRef.current) return true;
  const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
  return scrollHeight - scrollTop - clientHeight < 100;
}, []);

useEffect(() => {
  if (isNearBottom()) {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }
}, [messages.length]);
```

### Fix 15: Wire Filter Chips to Conversation List

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/admin/live-chat/_components/ConversationList.tsx` | Modify | Apply `filterStatus` before rendering |

```typescript
const filteredConversations = useMemo(() => {
  if (filterStatus === 'ALL') return displayedConversations;
  return displayedConversations.filter(c => {
    const status = c.session?.status || 'NONE';
    return status === filterStatus;
  });
}, [displayedConversations, filterStatus]);
```

---

## Phase 4: Structural Improvements

### Fix 16: LIFF Confirmation → Real Dialog

| Files | Operation | Description |
|-------|-----------|-------------|
| `frontend/app/liff/service-request-single/page.tsx` | Modify | Use Modal component or add dialog semantics |
| `frontend/app/liff/service-request/page.tsx` | Modify | Same |

### Fix 17: Centralize Request Status Enum (UPPERCASE)

> **v2 change**: Use UPPERCASE values to align with backend `RequestStatus` enum.

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/lib/constants/request-status.ts` | Create | Shared UPPERCASE status enum + badge config |
| Multiple admin pages | Modify | Import from shared constant + hydrate filters from URL params |

```typescript
// lib/constants/request-status.ts — UPPERCASE to match backend
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const STATUS_CONFIG: Record<RequestStatus, {
  label: string;
  variant: 'warning' | 'info' | 'success' | 'danger';
  icon: string;
}> = {
  PENDING: { label: 'รอรับเรื่อง', variant: 'warning', icon: 'Clock' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', variant: 'info', icon: 'Eye' },
  COMPLETED: { label: 'ดำเนินการแล้ว', variant: 'success', icon: 'CheckCircle2' },
  REJECTED: { label: 'ปฏิเสธ', variant: 'danger', icon: 'AlertCircle' },
};

// Helper: normalize any case to backend enum
export function normalizeStatus(status: string): RequestStatus | undefined {
  const upper = status.toUpperCase() as RequestStatus;
  return upper in REQUEST_STATUS ? upper : undefined;
}
```

**Also**: Hydrate list page filters from URL search params:
```typescript
// requests/page.tsx — read ?status= from URL
const searchParams = useSearchParams();
const initialStatus = normalizeStatus(searchParams.get('status') || '') || 'ALL';
```

---

## Phase 5: Deferred (Lower Priority / High Effort)

| # | Fix | Reason to Defer |
|---|-----|----------------|
| 18 | RSC refactor (`'use client'` removal) | Requires auth pattern change (server-side token forwarding) |
| 19 | Form useState → react-hook-form | Current form works, optimization not blocking |
| 20 | `<img>` → `next/image` | Requires `next.config` remote patterns config, low impact |
| Future | Phone binding OTP verification | Requires SMS gateway + OTP storage infrastructure |

---

## Key Files Summary (v2)

| File | Operation | Fixes |
|------|-----------|-------|
| `backend/app/core/config.py` | Modify | #1a, #8 |
| `backend/app/api/deps.py` | Modify | #1a, #6, #9 |
| `backend/app/services/credential_service.py` | Modify | #1b |
| `backend/app/api/v1/endpoints/auth.py` | Modify | #6 |
| `backend/app/api/v1/endpoints/webhook.py` | Modify | #5, #10 |
| `backend/app/services/line_service.py` | Modify | #4, #7 |
| `frontend/app/admin/layout.tsx` | Modify | #3 |
| `frontend/app/admin/live-chat/_components/ConversationList.tsx` | Modify | #2, #15 |
| `frontend/app/admin/live-chat/_components/ChatArea.tsx` | Modify | #14 |
| `frontend/components/ui/Button.tsx` | Modify | #11 |
| `frontend/app/admin/requests/page.tsx` | Modify | #11, #17 |
| `frontend/app/liff/service-request/page.tsx` | Modify | #12, #13, #16 |
| `frontend/app/liff/service-request-single/page.tsx` | Modify | #12, #13, #16 |
| `frontend/app/liff/request-v2/page.tsx` | Modify | #12, #13 |
| `frontend/lib/constants/request-status.ts` | Create | #17 |

## Risks and Mitigation (v2)

| Risk | Mitigation |
|------|------------|
| `DEV_AUTH_BYPASS` breaks local dev | Add `DEV_AUTH_BYPASS=true` to `backend/.env` (local only) |
| `ENCRYPTION_KEY` fail-fast blocks startup | Only when `DEV_AUTH_BYPASS=false`; dev mode uses fallback key |
| `is_active` check logs out active admins | Uses generic 401; only affects new login/refresh, not existing JWTs |
| Login generic error hurts debugging | Log actual reason server-side; generic message is client-facing only |
| `await` fix changes LINE media behavior | Verify `iscoroutinefunction()` before applying |
| Phone rebind guard blocks legitimate use | Only blocks cross-user rebinding; same-user/unbound still works |
| `asChild` Button breaks existing usage | Non-breaking — `asChild` is opt-in, default behavior unchanged |
| UPPERCASE status breaks existing pages | `normalizeStatus()` helper handles both cases during transition |

## SESSION_ID (for /ccg:execute use)

- CODEX_SESSION: N/A (codeagent-wrapper not available)
- GEMINI_SESSION: N/A (codeagent-wrapper not available)
