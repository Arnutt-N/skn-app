---
name: skn-auth-security
description: >
  Implements, debugs, or extends authentication and security in the SKN App —
  JWT tokens, password hashing, role-based access control, dev-mode bypass,
  audit logging, and encrypted credential storage.
  Use when asked to "add auth to endpoint", "create admin user", "protect route",
  "add role check", "JWT error", "dev mode bypass", "audit log", "encrypt credential",
  "เพิ่ม auth", "สร้าง admin", "เพิ่ม role check", "JWT หมดอายุ",
  "บันทึก audit log", "เก็บ credential".
  Do NOT use for LINE webhook signature validation (use skn-webhook-handler),
  or LINE credential management UI (use skn-fastapi-endpoint for the CRUD).
license: MIT
compatibility: >
  SKN App (JskApp) backend + frontend. FastAPI, python-jose (JWT), passlib (bcrypt),
  cryptography (Fernet). Next.js AuthContext for frontend.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [auth, jwt, security, rbac, audit, credentials, fernet]
---

# skn-auth-security

Covers the full auth and security surface of the SKN App: JWT creation/verification,
bcrypt password hashing, FastAPI dependency guards, dev-mode bypass, role-based
access control, audit logging, and Fernet-encrypted credential storage.

---

## CRITICAL: Project-Specific Rules

1. **Two independent dev-mode flags** — the backend uses `settings.ENVIRONMENT == "development"` (from `.env`) to bypass JWT checks in `deps.py`. The frontend uses `NEXT_PUBLIC_DEV_MODE=true` (from `.env.local`) to skip the real login UI. These are completely separate flags. Changing one does not affect the other.

2. **Backend dev bypass creates a real DB user** — when the backend is in dev mode and receives a request with no token, `get_current_user()` queries for `User.id == 1` and creates a mock ADMIN user if not found. This is a real DB write, not a mock object.

3. **Login is restricted to ADMIN/SUPER_ADMIN/AGENT** — `POST /auth/login` filters on `User.role.in_([ADMIN, SUPER_ADMIN, AGENT])`. Regular LINE users (`role=USER`) cannot log in to the admin panel.

4. **`verify_token()` returns `None`, never raises** — use this in dependency functions. `verify_jwt_token()` raises `JWTError` on failure — use when you want the caller to handle the exception explicitly.

5. **Token type claim required** — access tokens have `"type": "access"`, refresh tokens have `"type": "refresh"`. `get_current_user()` rejects tokens where `type != "access"`. The refresh endpoint rejects tokens where `type != "refresh"`.

6. **`get_current_admin` vs `get_current_user`** — `get_current_user` allows any admin/agent role. `get_current_admin` adds an extra check for `ADMIN` or `SUPER_ADMIN` only. There is no `get_current_agent()` — use `get_current_user` for AGENT-accessible endpoints.

7. **Audit decorator does NOT commit** — `@audit_action()` calls `db.add(log)` but NOT `await db.commit()`. The calling function must commit. Using `create_audit_log()` directly calls `db.flush()` (not commit) to get the ID.

8. **Fernet encryption key** — `CredentialService` reads `settings.ENCRYPTION_KEY`. In dev, if the key is invalid/missing, it falls back to a hardcoded 32-byte base64 key. **Never use the dev fallback in production.** Generate a proper key with `Fernet.generate_key()`.

9. **Frontend token in `localStorage`** — tokens are stored in `localStorage` under keys `auth_token`, `auth_refresh_token`, `auth_user`. The code has a `TODO(security)` comment noting this should move to httpOnly cookies. Do not add new direct `localStorage` access outside `AuthContext`.

10. **User model serves two roles** — `line_user_id` is set for LINE users (role=USER), `username`+`hashed_password` for admins. A user can potentially have both (LINE + admin account), but in practice admin accounts have no `line_user_id`.

---

## Context7 Docs

Context7 MCP is active. Use before writing JWT or FastAPI security patterns.

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | HTTPBearer, Depends, HTTPException, security |
| Pydantic | `"pydantic"` | BaseModel, BaseSettings, field validators |
| SQLAlchemy | `"sqlalchemy"` | async select, where clauses |

Usage: `mcp__context7__resolve-library-id libraryName="fastapi"` →
`mcp__context7__get-library-docs context7CompatibleLibraryID="..." topic="HTTPBearer security dependencies" tokens=5000`

---

## Architecture Overview

```
backend/app/core/security.py        ← pure functions (JWT, bcrypt)
backend/app/api/deps.py             ← FastAPI dependencies (get_db, get_current_user, get_current_admin)
backend/app/api/v1/endpoints/auth.py ← REST endpoints (login, refresh, me)
backend/app/core/config.py          ← Settings: SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, ENVIRONMENT
backend/app/models/user.py          ← User model: UserRole + ChatMode enums
backend/app/core/audit.py           ← @audit_action decorator + create_audit_log()
backend/app/services/credential_service.py ← Fernet-encrypted third-party credentials
backend/app/models/credential.py    ← Credential model + Provider enum

frontend/contexts/AuthContext.tsx   ← React context: login(), logout(), refreshToken(), useAuth()
```

### Auth Flow

```
Admin login:
POST /auth/login {username, password}
    │
    ├── Filter: role IN (ADMIN, SUPER_ADMIN, AGENT)
    ├── verify_password(plain, hashed)
    └── Return: {access_token (30min), refresh_token (7 days), user{id,username,role}}

Token refresh:
POST /auth/refresh (Authorization: Bearer {refresh_token})
    │
    ├── verify_token(refresh_token)
    ├── Check payload["type"] == "refresh"
    └── Return: {access_token (new)}

Protected endpoint:
Depends(get_current_user) or Depends(get_current_admin)
    │
    ├── HTTPBearer extracts token from Authorization header
    ├── No token + ENVIRONMENT=="development" → mock User(id=1, role=ADMIN)
    ├── verify_token(token) → payload
    ├── Check payload["type"] == "access"
    ├── Load User by payload["sub"] from DB
    └── get_current_admin: additionally require role IN (ADMIN, SUPER_ADMIN)
```

---

## Step 1: Protect an Endpoint with Authentication

```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, get_current_admin, get_db
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

# Any logged-in admin/agent can access
@router.get("/my-endpoint")
async def my_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return {"message": f"Hello {current_user.display_name}"}

# Only ADMIN or SUPER_ADMIN
@router.delete("/admin-only-endpoint")
async def admin_endpoint(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    return {"deleted": True}
```

**Dependency chain:**
- `get_current_user` → verifies JWT, loads User, dev-bypass if no token in dev mode
- `get_current_admin` → calls `get_current_user`, then checks `role in [ADMIN, SUPER_ADMIN]`
- Both inject `current_user: User` into the endpoint function

---

## Step 2: Add a Role Check (RBAC)

Use `get_current_admin` for ADMIN/SUPER_ADMIN only. For finer-grained checks, inspect `current_user.role` inside the endpoint:

```python
from app.models.user import UserRole

@router.post("/sensitive-action")
async def sensitive_action(current_user: User = Depends(get_current_user)):
    # SUPER_ADMIN only — more restrictive than get_current_admin
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can perform this action"
        )
    # ... proceed

# Allow ADMIN + AGENT (standard get_current_admin would exclude AGENT)
@router.get("/agent-or-admin")
async def agent_or_admin(current_user: User = Depends(get_current_user)):
    allowed = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT]
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
```

**Role hierarchy in this project:**

| Role | Login | `get_current_user` | `get_current_admin` | Notes |
|---|---|---|---|---|
| `SUPER_ADMIN` | ✅ | ✅ | ✅ | Full access |
| `ADMIN` | ✅ | ✅ | ✅ | Standard admin |
| `AGENT` | ✅ | ✅ | ❌ | Live chat operators |
| `USER` | ❌ | ❌ | ❌ | LINE users only |

---

## Step 3: Create JWT Tokens

```python
from app.core.security import create_access_token, create_refresh_token
from datetime import timedelta
from app.core.config import settings

# Standard access token (30 min default)
token = create_access_token(subject=user.id)

# Custom expiry
token = create_access_token(
    subject=user.id,
    expires_delta=timedelta(minutes=60)
)

# With extra claims (e.g., role embedded for frontend convenience)
token = create_access_token(
    subject=user.id,
    additional_claims={"role": user.role.value, "username": user.username}
)

# Refresh token (7 days, hardcoded)
refresh = create_refresh_token(subject=user.id)

# Token claims structure:
# {
#   "sub": "1",           ← str(user.id)
#   "exp": datetime,
#   "iat": datetime,
#   "type": "access"      ← "refresh" for refresh tokens
# }
```

---

## Step 4: Verify Tokens

```python
from app.core.security import verify_token, verify_jwt_token, get_token_subject

# Safe verify — returns None on any failure (used in deps.py)
payload = verify_token(token)
if payload is None:
    raise HTTPException(401, "Invalid token")
user_id = payload["sub"]

# Strict verify — raises JWTError on failure (use when you handle the exception)
from jose import JWTError
try:
    payload = verify_jwt_token(token)
except JWTError as e:
    raise HTTPException(401, f"Token error: {e}")

# Just get the user ID
user_id = get_token_subject(token)   # Returns None if invalid
```

---

## Step 5: Hash and Verify Passwords

```python
from app.core.security import get_password_hash, verify_password

# Hash on user creation / password change
hashed = get_password_hash("myplainpassword")
user.hashed_password = hashed
await db.commit()

# Verify on login
if not verify_password(payload.password, user.hashed_password):
    raise HTTPException(401, "Invalid username or password")

# Important: Always use the same error message for both
# "user not found" AND "wrong password" to prevent user enumeration
```

**Password storage:** `passlib` with `bcrypt`, `deprecated="auto"`. Never store plain-text passwords. Minimum recommended length: 8 characters.

---

## Step 6: Add Audit Logging

Use the `@audit_action` decorator on service methods, or call `create_audit_log` directly.

### Decorator pattern (preferred for service methods)

```python
from app.core.audit import audit_action

class MyService:
    @audit_action("delete_record", "my_resource")
    async def delete_record(
        self,
        record_id: int,
        operator_id: int,   # ← decorator extracts this automatically
        db: AsyncSession    # ← decorator extracts this automatically
    ):
        # ... delete logic ...
        return deleted_record   # result.id becomes resource_id in audit log

# Audit log is added to session automatically.
# The calling code must commit the session for the log to persist.
```

**How the decorator extracts fields:**
- `operator_id` / `admin_id` / `closed_by` from `kwargs` → `audit_log.admin_id`
- `result.id` from return value → `audit_log.resource_id`
- `kwargs["line_user_id"]` → `audit_log.resource_id` (if no result.id)
- Does NOT commit — caller must `await db.commit()`

### Manual audit log (for endpoint-level logging)

```python
from app.core.audit import create_audit_log

log = await create_audit_log(
    db=db,
    admin_id=current_user.id,
    action="export_data",
    resource_type="service_request",
    resource_id=str(request_id),
    details={"format": "csv", "count": 500},
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)
# create_audit_log calls db.flush() (not commit) to get ID
# Commit separately or let the endpoint transaction commit it
```

---

## Step 7: Store Encrypted Credentials

Third-party credentials (LINE token, Telegram bot token) are stored in the
`credentials` table using Fernet symmetric encryption.

```python
from app.services.credential_service import credential_service
from app.schemas.credential import CredentialCreate
from app.models.credential import Provider

# Create a new credential
new_cred = await credential_service.create_credential(
    obj_in=CredentialCreate(
        name="Production LINE OA",
        provider=Provider.LINE,
        credentials={
            "channel_access_token": "YOUR_LINE_TOKEN",
            "channel_secret": "YOUR_LINE_SECRET"
        },
        metadata={"note": "Main production channel"},
        is_active=True,
        is_default=True   # Unsets other defaults for this provider
    ),
    db=db
)

# Read a credential (already encrypted in DB)
credential = await credential_service.get_default_credential(Provider.LINE, db)
if credential:
    decrypted = credential_service.decrypt_credentials(credential.credentials)
    token = decrypted["channel_access_token"]

# Verify a credential (makes real API call to LINE/Telegram)
result = await credential_service.verify_credential(credential.id, db)
# {"success": True, "message": "LINE connection verified", "data": {...}}
```

**ENCRYPTION_KEY setup:**
```bash
# Generate in Python:
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
# → Add to backend/.env: ENCRYPTION_KEY=<generated_key>
```

---

## Step 8: Frontend Auth Usage

```typescript
// In any component wrapped by AuthProvider
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
    const { user, token, isAuthenticated, login, logout, refreshToken } = useAuth();

    // Login
    const handleLogin = async () => {
        await login('admin', 'password123');
        // On success: token/user set in state + localStorage
    };

    // Add auth header to API calls
    const fetchData = async () => {
        const response = await fetch('/api/v1/some-endpoint', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        // ...
    };

    // Role check in UI
    if (user?.role === 'SUPER_ADMIN') {
        return <AdminOnlyPanel />;
    }
}
```

**Dev mode (no real login):**
```bash
# frontend/.env.local
NEXT_PUBLIC_DEV_MODE=true
# → AuthContext auto-login as mock admin, uses a static fake JWT
# → This fake JWT IS sent in API calls but the backend (in dev mode) ignores it
```

**Token storage keys in localStorage:**
| Key | Contents |
|---|---|
| `auth_token` | JWT access token |
| `auth_refresh_token` | JWT refresh token |
| `auth_user` | JSON-serialized User object |

---

## Common Issues

### "Not authenticated" in production but works in dev

**Cause:** Backend `ENVIRONMENT` is set to `"development"` in dev, allowing bypass. In production it's `"production"`, so the real JWT check runs.
**Fix:** Ensure the frontend sends `Authorization: Bearer {token}` on every request. Check `AuthContext.tsx` is used and not bypassed.

### "Invalid token type" — 401

**Cause:** Passing a refresh token to an endpoint that expects an access token (or vice versa).
**Fix:** Use access token for API calls. Use refresh token only for `POST /auth/refresh`.

### Token expires in 30 minutes — users get logged out

**Cause:** `ACCESS_TOKEN_EXPIRE_MINUTES = 30` (hardcoded default).
**Fix:** Implement token refresh in frontend. `AuthContext.refreshToken()` is already wired up.
```typescript
// Call refreshToken() before expiry — schedule a setInterval
useEffect(() => {
    const interval = window.setInterval(() => { void refreshToken(); }, 25 * 60 * 1000);
    return () => window.clearInterval(interval);
}, [refreshToken]);
```

### "User not found" after correct login

**Cause:** `get_current_user` loads `User.id == int(payload["sub"])`. If the user was deleted from DB after token was issued, this returns 404.
**Fix:** Expected behavior — tokens do not survive user deletion. Issue a new token.

### `@audit_action` logs but data is missing

**Cause:** The decorated function uses positional args instead of keyword args. The decorator extracts `operator_id`/`admin_id` from `kwargs` only.
**Fix:** Always call the decorated function with keyword arguments:
```python
await service.my_method(line_user_id=uid, operator_id=admin_id, db=db)  # ✅
await service.my_method(uid, admin_id, db)  # ❌ decorator can't extract fields
```

### "Fernet key must be 32 url-safe base64-encoded bytes" error

**Cause:** `ENCRYPTION_KEY` in `.env` is malformed or missing.
**Fix:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copy output to backend/.env: ENCRYPTION_KEY=<output>
```

### Frontend `DEV_MODE=true` but API returns 401

**Cause:** `NEXT_PUBLIC_DEV_MODE=true` only affects the frontend (auto-login with mock user). The backend is not in dev mode, so it requires a real JWT. The fake MOCK_TOKEN in `AuthContext.tsx` is never valid against a real backend.
**Fix:** Either:
- A) Set `ENVIRONMENT=development` in `backend/.env` to enable backend bypass, OR
- B) Set `NEXT_PUBLIC_DEV_MODE=false` and log in with real credentials

---

## Quality Checklist

Before finishing, verify:

- [ ] New endpoint uses `Depends(get_current_user)` or `Depends(get_current_admin)`
- [ ] Role checks use `UserRole` enum values, not raw strings
- [ ] Passwords hashed with `get_password_hash()`, never stored plain
- [ ] Login error messages are identical for wrong user / wrong password (prevent enumeration)
- [ ] Token type claim verified (`payload.get("type") == "access"`) for protected endpoints
- [ ] `@audit_action` functions called with keyword args (`operator_id=...`, `db=db`)
- [ ] Audit decorator: caller commits after the decorated call
- [ ] `ENCRYPTION_KEY` set in production `.env` (not using dev fallback)
- [ ] `ENVIRONMENT=production` set in production to disable auth bypass
- [ ] Frontend: `Authorization: Bearer {token}` header on all admin API calls

---

*See `references/security_reference.md` for full function signatures, settings reference, and token structure.*
