---
name: skn-user-management
description: >
  Manages users, authentication, and workload statistics in the SKN App (JskApp).
  Covers the dual-purpose User model (LINE users + admin users), JWT login/refresh/me
  endpoints, operator workload API, and creating/updating admin accounts.
  Use when asked to "create admin user", "add agent account", "login endpoint",
  "JWT login", "refresh token", "GET /auth/me", "user workload", "operator list",
  "assign task workload", "user management", "สร้าง admin user", "เพิ่ม agent",
  "login ไม่ได้", "token หมดอายุ", "รายชื่อ operator", "ดู workload".
  Do NOT use for LINE webhook, live chat sessions, or service request assignment logic.
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend, PostgreSQL, python-jose, passlib[bcrypt].
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [users, auth, jwt, roles, workload]
  related-skills:
    - skn-fastapi-endpoint
    - skn-auth-security
    - skn-service-request
  documentation: ./references/user_reference.md
---

# skn-user-management

Covers the User model (LINE users and admin users share one table), the JWT auth
endpoints (`/auth/login`, `/auth/refresh`, `/auth/me`), and the operator workload
API (`GET /admin/users`). Use this skill when building or debugging anything
related to user accounts, login, token refresh, or operator workload statistics.

---

## CRITICAL: Project-Specific Rules

1. **One User table, two kinds of users** — LINE users (`line_user_id` set, no password)
   and admin/agent users (`username` + `hashed_password`, no `line_user_id`). Both rows
   live in the same `users` table. Never assume every User has a `username` or `line_user_id`.

2. **Only three roles can log in** — `auth.py` login query filters:
   `User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT])`.
   A `USER` role (LINE citizen) can never log in via `/auth/login`.

3. **Token type claims are enforced** — `create_access_token()` sets `"type": "access"`;
   `create_refresh_token()` sets `"type": "refresh"`. The `/auth/refresh` endpoint
   checks `payload.get("type") != "refresh"` and rejects access tokens. Always check
   the `type` claim when verifying tokens.

4. **`display_name or username` fallback** — `UserWorkload` uses
   `user.display_name or user.username`. Never use one field alone; either can be `None`.

5. **`UserWorkload` is computed with a Python loop (N+1)** — `admin_users.py` runs one
   `SELECT` per user to count service requests. For small operator lists this is
   acceptable. If the user list grows, replace with a single SQL join + aggregation.
   See `skn-performance-audit` for the SQL RANK pattern.

6. **No `user_service.py` exists** — all user logic is inline in endpoint files or in
   `deps.py` (`get_current_user`). Do not create a separate service unless the feature
   genuinely requires it.

7. **`chat_mode` is on the User model** — `ChatMode.BOT` / `ChatMode.HUMAN` is set
   by `live_chat_service`, not by user management endpoints. Do not touch `chat_mode`
   from user CRUD operations.

8. **No user CRUD endpoints exist yet** — there is no `POST /admin/users`,
   `PUT /admin/users/{id}`, or `DELETE /admin/users/{id}`. Creating an admin user
   currently requires a direct DB insert or a migration seed. See GAP-1.

9. **Password hashing always uses `get_password_hash()`** — from `app.core.security`.
   Never store plain-text passwords. Never use `hashlib` or other schemes.

10. **Frontend users page is ComingSoon** — `frontend/app/admin/users/page.tsx` renders
    `<ComingSoon />`. Building the real page follows the `skn-admin-component` patterns.

---

## Context7 Docs

Context7 MCP is active. Use before writing python-jose JWT or Pydantic v2 code.

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | dependencies, HTTPException, Header param |
| SQLAlchemy | `"sqlalchemy"` | async select, scalar_one_or_none, func.count |
| Pydantic | `"pydantic"` | BaseModel, Optional, Field |
| python-jose | `"python-jose"` | jwt.encode/decode, JWTError, ExpiredSignatureError |

---

## Step 1 — Auth Flow (`/auth/login`, `/auth/refresh`, `/auth/me`)

**File:** `backend/app/api/v1/endpoints/auth.py`
**Registered at:** `api.py` → `api_router.include_router(auth.router, prefix="/auth", tags=["auth"])`

### POST `/auth/login`

```python
# Body: { "username": "admin", "password": "secret" }
# Response: LoginResponse

# Query: only ADMIN, SUPER_ADMIN, AGENT roles
result = await db.execute(
    select(User).where(
        User.username == payload.username,
        User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT]),
    )
)
user = result.scalar_one_or_none()
if not user or not user.hashed_password:
    raise HTTPException(401, "Invalid username or password")
if not verify_password(payload.password, user.hashed_password):
    raise HTTPException(401, "Invalid username or password")

access_token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
refresh_token = create_refresh_token(subject=user.id)

return LoginResponse(
    access_token=access_token,
    refresh_token=refresh_token,
    token_type="bearer",
    user=AuthUserResponse(id=user.id, username=user.username, role=user.role, display_name=user.display_name)
)
```

### POST `/auth/refresh`

```python
# Header: Authorization: Bearer <refresh_token>
# Response: TokenResponse (new access_token only)

refresh_token = authorization.removeprefix("Bearer ").strip()
payload = verify_token(refresh_token)

# CRITICAL: check token type
if not payload or payload.get("type") != "refresh":
    raise HTTPException(401, "Invalid refresh token")

user_id = int(payload.get("sub"))
# re-verify user still exists and is still an admin/agent role
access_token = create_access_token(subject=user_id, ...)
return TokenResponse(access_token=access_token, token_type="bearer")
```

### GET `/auth/me`

```python
# Header: Authorization: Bearer <access_token>
# Uses get_current_user dependency from app/api/deps.py
# Response: AuthUserResponse (id, username, role, display_name)

@router.get("/me", response_model=AuthUserResponse)
async def me(current_user: User = Depends(get_current_user)) -> AuthUserResponse:
    return AuthUserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        display_name=current_user.display_name,
    )
```

---

## Step 2 — Operator Workload API (`GET /admin/users`)

**File:** `backend/app/api/v1/endpoints/admin_users.py`
**Registered at:** `api.py` → `prefix="/admin/users", tags=["admin"]`

```python
# Query params: role (optional), search (optional)
# Response: List[UserWorkload] — sorted by active_tasks ASC (least busy first)

class UserWorkload(BaseModel):
    id: int
    display_name: Optional[str] = None
    role: UserRole
    active_tasks: int       # pending + in_progress
    pending_tasks: int
    in_progress_tasks: int

@router.get("", response_model=List[UserWorkload])
async def list_users(role: Optional[UserRole] = None, search: Optional[str] = None, db: ...):
    # 1. Fetch users (optional role/search filter)
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(or_(
            User.display_name.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%")
        ))
    users = (await db.execute(query)).scalars().all()

    # 2. Compute workload per user (N+1 — one query per user)
    user_workloads = []
    for user in users:
        stats = (await db.execute(
            select(
                func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.PENDING).label("pending"),
                func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress"),
            ).where(ServiceRequest.assigned_agent_id == user.id)
        )).one()
        user_workloads.append(UserWorkload(
            id=user.id,
            display_name=user.display_name or user.username,  # fallback
            role=user.role,
            active_tasks=stats.pending + stats.in_progress,
            pending_tasks=stats.pending,
            in_progress_tasks=stats.in_progress,
        ))

    user_workloads.sort(key=lambda x: x.active_tasks)  # least busy first
    return user_workloads
```

**Used by:** Service request `AssignModal` in frontend — calls `GET /admin/users`
to populate the operator dropdown, pre-sorted by workload.

---

## Step 3 — User Model Reference

**File:** `backend/app/models/user.py`

```python
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN       = "ADMIN"
    AGENT       = "AGENT"
    USER        = "USER"          # LINE citizens — cannot log in

class ChatMode(str, enum.Enum):
    BOT   = "BOT"
    HUMAN = "HUMAN"

class User(Base):
    __tablename__ = "users"

    # Identity — at least one of these is set per user type
    line_user_id = Column(String, unique=True, nullable=True)  # LINE users only
    username     = Column(String, unique=True, nullable=True)  # Admin/Agent only
    email        = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=True)            # Admin/Agent only

    display_name = Column(String, nullable=True)
    picture_url  = Column(String, nullable=True)

    role      = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)

    # Admin/Agent only
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # LINE user only
    chat_mode   = Column(Enum(ChatMode), default=ChatMode.BOT)
    friend_status = Column(String, nullable=True, default="ACTIVE")
    friend_since  = Column(DateTime(timezone=True), nullable=True)
    last_message_at   = Column(DateTime(timezone=True), nullable=True)
    profile_updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    requests          = relationship("ServiceRequest", ..., foreign_keys="ServiceRequest.requester_id")
    assigned_requests = relationship("ServiceRequest", ..., foreign_keys="ServiceRequest.assigned_agent_id")
    chat_sessions     = relationship("ChatSession", back_populates="operator")
    audit_logs        = relationship("AuditLog", back_populates="admin")
    tags              = relationship("Tag", secondary="user_tags", ...)
```

---

## Step 4 — Security Utilities

**File:** `backend/app/core/security.py`

```python
from jose import jwt, JWTError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password
verify_password(plain, hashed) → bool
get_password_hash(password)    → str   # always use this, never store plain

# Token creation
create_access_token(subject: int|str, expires_delta=None, additional_claims=None) → str
    # claims: {sub, exp, iat, type="access"}
    # default expiry: settings.ACCESS_TOKEN_EXPIRE_MINUTES

create_refresh_token(subject: int|str) → str
    # claims: {sub, exp, iat, type="refresh"}
    # expiry: 7 days (hardcoded)

# Token verification
verify_token(token: str) → Optional[dict]      # returns payload or None (no exception)
verify_jwt_token(token: str) → dict            # raises JWTError on failure
get_token_subject(token: str) → Optional[str]  # returns "sub" claim or None
is_token_expired(token: str) → bool
```

---

## Step 5 — Create an Admin/Agent User (no endpoint yet)

Since there is no `POST /admin/users` endpoint (GAP-1), use one of these methods:

### Option A: Direct DB insert via Python script
```python
# backend/scripts/create_admin.py  (run from backend/ dir)
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def main():
    async with AsyncSessionLocal() as db:
        user = User(
            username="admin",
            hashed_password=get_password_hash("yourpassword"),
            display_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        await db.commit()

asyncio.run(main())
```

### Option B: Alembic seed migration
```python
# In a data migration
from app.core.security import get_password_hash
def upgrade():
    op.execute(f"""
        INSERT INTO users (username, hashed_password, display_name, role, is_active)
        VALUES ('admin', '{get_password_hash("changeme")}', 'Admin', 'ADMIN', true)
        ON CONFLICT (username) DO NOTHING
    """)
```

---

## Step 6 — Build Frontend Users Page (GAP-2)

**File:** `frontend/app/admin/users/page.tsx` (currently `<ComingSoon />`)

Follow `skn-admin-component` patterns. Key data source: `GET /admin/users`.

```typescript
// Minimal fetch shape
interface UserWorkload {
  id: number
  display_name: string | null
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER'
  active_tasks: number
  pending_tasks: number
  in_progress_tasks: number
}

// Fetch
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`)
const users: UserWorkload[] = await res.json()
```

Optional filters via query params: `?role=AGENT`, `?search=somename`

---

## Step 7 — Optimize Workload Query (if needed)

The current N+1 pattern in `admin_users.py` runs one query per user. Replace with:

```python
from sqlalchemy import case

# Single query with conditional aggregation
stats_subq = (
    select(
        ServiceRequest.assigned_agent_id,
        func.count(case((ServiceRequest.status == RequestStatus.PENDING, 1))).label("pending"),
        func.count(case((ServiceRequest.status == RequestStatus.IN_PROGRESS, 1))).label("in_progress"),
    )
    .where(ServiceRequest.assigned_agent_id.isnot(None))
    .group_by(ServiceRequest.assigned_agent_id)
    .subquery()
)

result = await db.execute(
    select(User, stats_subq.c.pending, stats_subq.c.in_progress)
    .outerjoin(stats_subq, User.id == stats_subq.c.assigned_agent_id)
    .where(...)
)
```

---

## Known Gaps

### GAP-1: No user CRUD endpoints
No `POST/PUT/DELETE /admin/users`. Admin users are created via script or migration.
**Fix:** Add `POST /admin/users` endpoint following `skn-fastapi-endpoint` pattern.
Required fields: `username`, `password`, `role`, `display_name`.
Hash password with `get_password_hash()` before saving.

### GAP-2: Frontend users page is ComingSoon
`frontend/app/admin/users/page.tsx` renders `<ComingSoon />`.
**Fix:** Build the page following `skn-admin-component` + Step 6 above.

### GAP-3: No password reset flow
No `POST /auth/forgot-password` or `POST /auth/reset-password` endpoint.
**Fix:** Add token-based reset flow (email or admin-forced) as a new endpoint.

### GAP-4: Workload query is N+1
`admin_users.py` loops over users and runs one query per user.
**Fix:** Replace with single JOIN + aggregation (Step 7).

### GAP-5: No role promotion endpoint
Changing a user's role requires a direct DB update — no `PATCH /admin/users/{id}/role`.
**Fix:** Add a restricted endpoint (`SUPER_ADMIN` only) for role changes.

### GAP-6: Frontend auth still uses DEV_MODE mock
`frontend/lib/auth/AuthContext.tsx` has `NEXT_PUBLIC_DEV_MODE=true` — auto-login
as admin ID 1 with mock JWT. Real login flow (`POST /auth/login`) is fully
implemented on the backend but the frontend never calls it.
**Fix:** Set `NEXT_PUBLIC_DEV_MODE=false` and wire `POST /auth/login` in the frontend.

---

## Common Issues

### `POST /auth/login` returns 401 for a known user
**Cause 1:** User exists but has `role = "USER"` — not in the allowed role list.
**Fix:** Check `user.role`; update to ADMIN/AGENT if intended.

**Cause 2:** User has no `hashed_password` (LINE user, or created without password).
**Fix:** Run `get_password_hash()` and update the DB row.

### `POST /auth/refresh` returns 401 "Invalid refresh token"
**Cause:** Sent the access token instead of the refresh token, or token expired.
**Fix:** Check `payload.get("type")` — refresh token has `"type": "refresh"`.
Refresh tokens expire in 7 days.

### `GET /admin/users` returns empty list
**Cause:** No users with `role in (ADMIN, SUPER_ADMIN, AGENT)` in DB, or `search`
filter has no matches.
**Fix:** Check DB directly: `SELECT * FROM users WHERE role != 'USER'`.

### `display_name` shows `null` in workload response
**Cause:** User has neither `display_name` nor `username` set.
**Fix:** `UserWorkload` uses `user.display_name or user.username` — both are `None`.
Set `display_name` when creating the user.

---

## Quality Checklist

Before finishing, verify:
- [ ] Password stored via `get_password_hash()`, never plain text
- [ ] Login endpoint only allows ADMIN, SUPER_ADMIN, AGENT roles
- [ ] Token `type` claim checked in refresh endpoint
- [ ] `display_name or username` fallback used — never assume one is set
- [ ] New admin user creation uses DB script or Alembic seed (no plain-text password in migration)
- [ ] `chat_mode` not touched from user management endpoints
- [ ] Workload sort is `active_tasks ASC` (least busy first)
- [ ] N+1 workload query replaced if > ~20 operators expected
