# User Management & Auth — Reference

Sources: `models/user.py`, `core/security.py`, `schemas/auth.py`,
`api/v1/endpoints/auth.py`, `api/v1/endpoints/admin_users.py`,
`api/deps.py`, `frontend/app/admin/users/page.tsx`

---

## User Model

**File:** `backend/app/models/user.py`

| Column | Type | LINE user | Admin/Agent | Notes |
|---|---|---|---|---|
| `id` | Integer PK | ✅ | ✅ | |
| `line_user_id` | String unique | ✅ set | ✅ null | LINE identity |
| `username` | String unique | ✅ null | ✅ set | Login identifier |
| `email` | String unique | optional | optional | |
| `hashed_password` | String | ✅ null | ✅ set | bcrypt hash |
| `display_name` | String | from LINE profile | set on create | can be None |
| `picture_url` | String | from LINE profile | optional | |
| `role` | UserRole enum | USER | ADMIN/SUPER_ADMIN/AGENT | |
| `is_active` | Boolean | true | true | |
| `organization_id` | Integer FK | null | optional | FK to organizations |
| `chat_mode` | ChatMode enum | BOT/HUMAN | N/A | live chat only |
| `friend_status` | String | "ACTIVE" | N/A | LINE friend |
| `friend_since` | DateTime | set on follow | N/A | |
| `last_message_at` | DateTime | updated on msg | N/A | |
| `profile_updated_at` | DateTime | updated on profile change | N/A | |
| `created_at` | DateTime | auto | auto | |
| `updated_at` | DateTime | auto | auto | |

---

## UserRole Enum

```python
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"   # full system access
    ADMIN       = "ADMIN"         # admin access
    AGENT       = "AGENT"         # live chat operator
    USER        = "USER"          # LINE citizen — cannot log in via /auth/login
```

---

## ChatMode Enum

```python
class ChatMode(str, enum.Enum):
    BOT   = "BOT"    # automated chatbot handles messages
    HUMAN = "HUMAN"  # operator handles messages (live chat active)
```

Set only by `live_chat_service` (initiate/close session). Do not set from user management.

---

## Auth Schemas

**File:** `backend/app/schemas/auth.py`

```python
class LoginRequest(BaseModel):
    username: str
    password: str

class AuthUserResponse(BaseModel):
    id:           int
    username:     Optional[str] = None
    role:         UserRole
    display_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: Optional[str] = None
    token_type:    str = "bearer"

class LoginResponse(TokenResponse):
    user: AuthUserResponse
```

---

## UserWorkload Schema

**Defined inline in:** `backend/app/api/v1/endpoints/admin_users.py`

```python
class UserWorkload(BaseModel):
    id:               int
    display_name:     Optional[str] = None
    role:             UserRole
    active_tasks:     int   # pending + in_progress
    pending_tasks:    int
    in_progress_tasks: int
```

Note: `display_name` uses `user.display_name or user.username` — can still be `None`
if both are unset.

---

## Security Functions

**File:** `backend/app/core/security.py`

```python
# Password
verify_password(plain: str, hashed: str) → bool
get_password_hash(password: str) → str

# Token creation
create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None
) → str
# Payload: {sub: str(subject), exp, iat, type="access"}
# Default expiry: settings.ACCESS_TOKEN_EXPIRE_MINUTES minutes

create_refresh_token(subject: Union[str, int]) → str
# Payload: {sub: str(subject), exp, iat, type="refresh"}
# Expiry: 7 days (hardcoded)

# Token verification
verify_token(token: str) → Optional[dict]      # None if invalid, no exception
verify_jwt_token(token: str) → dict            # raises JWTError if invalid
get_token_subject(token: str) → Optional[str]  # payload["sub"] or None
is_token_expired(token: str) → bool
```

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Body / Header | Response |
|---|---|---|---|
| `POST` | `/auth/login` | `{username, password}` | `LoginResponse` (tokens + user) |
| `POST` | `/auth/refresh` | `Authorization: Bearer <refresh_token>` | `TokenResponse` (new access_token) |
| `GET` | `/auth/me` | `Authorization: Bearer <access_token>` | `AuthUserResponse` |

**Login query restriction:**
```python
User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT])
```
`USER` role cannot log in.

**Refresh token type check:**
```python
if payload.get("type") != "refresh":
    raise HTTPException(401, "Invalid refresh token")
```

---

### Users — `/api/v1/admin/users`

| Method | Path | Params | Response |
|---|---|---|---|
| `GET` | `/admin/users` | `role`, `search` (optional) | `List[UserWorkload]` |

Response is sorted by `active_tasks ASC` (least busy first).

**Used by:** `AssignModal` in `frontend/app/admin/requests/` to populate operator dropdown.

---

## Token Structure

```
Access token payload:
{
  "sub": "42",          ← str(user.id)
  "exp": 1234567890,
  "iat": 1234567000,
  "type": "access"      ← MUST be "access"
}

Refresh token payload:
{
  "sub": "42",
  "exp": 1234567890,
  "iat": 1234567000,
  "type": "refresh"     ← MUST be "refresh" — checked in /auth/refresh
}
```

---

## Workload Computation Pattern

Current (N+1 — one query per user):
```python
for user in users:
    stats = (await db.execute(
        select(
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.PENDING).label("pending"),
            func.count(ServiceRequest.id).filter(ServiceRequest.status == RequestStatus.IN_PROGRESS).label("in_progress"),
        ).where(ServiceRequest.assigned_agent_id == user.id)
    )).one()
```

Optimized (single query with conditional aggregation):
```python
from sqlalchemy import case

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
)
```

---

## Frontend Users Page

**File:** `frontend/app/admin/users/page.tsx` — currently `<ComingSoon />`

When building the real page:
```typescript
// API types
interface UserWorkload {
  id: number
  display_name: string | null
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER'
  active_tasks: number
  pending_tasks: number
  in_progress_tasks: number
}

// Fetch with optional filters
const params = new URLSearchParams()
if (role) params.set('role', role)
if (search) params.set('search', search)
const res = await fetch(`${API_URL}/admin/users?${params}`)
const users: UserWorkload[] = await res.json()
```

Follow `skn-admin-component` patterns: semantic tokens, CVA, `cn()`.

---

## Known Gaps Summary

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | No `POST/PUT/DELETE /admin/users` | High | Add user CRUD endpoint |
| GAP-2 | Frontend users page is ComingSoon | Medium | Build with skn-admin-component patterns |
| GAP-3 | No password reset flow | Medium | Add token-based reset endpoint |
| GAP-4 | Workload query is N+1 | Low–Medium | Single JOIN + aggregation subquery |
| GAP-5 | No role promotion endpoint | Medium | `PATCH /admin/users/{id}/role` (SUPER_ADMIN only) |
| GAP-6 | Frontend uses DEV_MODE mock JWT | High | Wire `POST /auth/login` in AuthContext |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/models/user.py` | `User` model + `UserRole` + `ChatMode` enums |
| `backend/app/core/security.py` | JWT create/verify, bcrypt hash/verify |
| `backend/app/schemas/auth.py` | Login/token/me schemas |
| `backend/app/api/v1/endpoints/auth.py` | Login, refresh, me endpoints |
| `backend/app/api/v1/endpoints/admin_users.py` | Workload list endpoint + `UserWorkload` schema |
| `backend/app/api/deps.py` | `get_current_user`, `get_current_admin` dependencies |
| `frontend/app/admin/users/page.tsx` | Users admin page (ComingSoon) |
