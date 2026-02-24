# Auth & Security — Reference

Extracted from `backend/app/core/security.py`, `backend/app/api/deps.py`,
`backend/app/api/v1/endpoints/auth.py`, `backend/app/core/audit.py`,
`backend/app/services/credential_service.py`, and `frontend/contexts/AuthContext.tsx`.

---

## `security.py` Function Signatures

```python
# Password hashing (bcrypt via passlib)
verify_password(plain_password: str, hashed_password: str) -> bool
get_password_hash(password: str) -> str

# JWT creation (python-jose HS256)
create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,    # default: ACCESS_TOKEN_EXPIRE_MINUTES
    additional_claims: Optional[dict] = None
) -> str

create_refresh_token(
    subject: Union[str, int]
) -> str    # 7-day expiry, hardcoded

# JWT verification
verify_token(token: str) -> Optional[dict]    # Returns None on failure — SAFE
verify_jwt_token(token: str) -> dict          # Raises JWTError on failure — STRICT
get_token_subject(token: str) -> Optional[str]  # Returns payload["sub"] or None
is_token_expired(token: str) -> bool            # True if expired or invalid
```

---

## Token Payload Structure

### Access Token
```json
{
  "sub": "1",
  "exp": 1709000000,
  "iat": 1708998200,
  "type": "access"
}
```

### Refresh Token
```json
{
  "sub": "1",
  "exp": 1709604000,
  "iat": 1708999000,
  "type": "refresh"
}
```

### With `additional_claims`
```json
{
  "sub": "1",
  "exp": 1709000000,
  "iat": 1708998200,
  "type": "access",
  "role": "ADMIN",
  "username": "admin"
}
```

---

## `deps.py` Dependency Functions

```python
# DB session — use in all endpoints
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# Any authenticated admin/agent
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> User:
    # Dev bypass: ENVIRONMENT=="development" + no credentials → User(id=1, role=ADMIN)
    # Production: Bearer JWT → verify_token → check type=="access" → load User by sub

# ADMIN or SUPER_ADMIN only
async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    # Raises 403 if role not in [ADMIN, SUPER_ADMIN]
```

**Dependency errors returned:**

| Condition | HTTP Status | Detail |
|---|---|---|
| No token in production | 401 | "Not authenticated" |
| Invalid token | 401 | "Invalid authentication credentials" |
| Token type != "access" | 401 | "Invalid token type" |
| `payload["sub"]` missing | 401 | "Invalid authentication credentials" |
| User not found in DB | 401 | "User not found" |
| Role check fails | 403 | "Insufficient permissions" |

---

## Auth Endpoints

All under prefix `/api/v1/auth` (registered in `api.py`).

### `POST /auth/login`

**Request:**
```json
{ "username": "admin", "password": "plaintext" }
```

**Constraints:**
- `User.role` must be `ADMIN`, `SUPER_ADMIN`, or `AGENT`
- `User.hashed_password` must not be null
- Invalid credentials → same 401 message (prevents enumeration)

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN",
    "display_name": "Administrator"
  }
}
```

### `POST /auth/refresh`

**Request header:** `Authorization: Bearer {refresh_token}`

**Constraints:**
- Token `type` must be `"refresh"`
- User must exist in DB with role ADMIN/SUPER_ADMIN/AGENT

**Response:**
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```

### `GET /auth/me`

**Request header:** `Authorization: Bearer {access_token}`

**Response:**
```json
{ "id": 1, "username": "admin", "role": "ADMIN", "display_name": "Administrator" }
```

---

## User Model

```python
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN       = "ADMIN"
    AGENT       = "AGENT"
    USER        = "USER"

class ChatMode(str, enum.Enum):
    BOT   = "BOT"
    HUMAN = "HUMAN"

class User(Base):
    __tablename__ = "users"
    id: int             # PK
    line_user_id: str   # Unique — set for LINE users
    username: str       # Unique — set for admin/agent accounts
    email: str          # Unique, optional
    hashed_password: str  # bcrypt hash — set for admin/agent accounts
    display_name: str
    picture_url: str
    role: UserRole      # Default: USER
    is_active: bool     # Default: True
    organization_id: int  # FK → organizations
    chat_mode: ChatMode   # Default: BOT (BOT/HUMAN for live chat routing)
    friend_status: str    # "ACTIVE" | "UNFOLLOWED" — LINE friend status
    friend_since: datetime
    last_message_at: datetime
    profile_updated_at: datetime
    created_at, updated_at: datetime
```

**Two types of users sharing one table:**

| Type | `line_user_id` | `username` | `hashed_password` | Role |
|---|---|---|---|---|
| LINE user | ✅ set | null | null | USER |
| Admin/Agent | null | ✅ set | ✅ set | ADMIN/SUPER_ADMIN/AGENT |

---

## Audit Log Model

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: int
    admin_id: int          # FK → users.id, nullable
    action: str            # e.g., "claim_session", "close_session", "export_data"
    resource_type: str     # e.g., "chat_session", "service_request", "user"
    resource_id: str       # str representation of the resource PK
    details: dict (JSONB)  # {"function": "...", "kwargs_keys": [...]} via decorator
    ip_address: str
    user_agent: str
    created_at: datetime
```

**Common `action` values used in this project:**
`claim_session`, `close_session`, `transfer_session`, `send_message`,
`update_user`, `delete_credential`, `export_data`

---

## `@audit_action` Decorator Internals

```python
from app.core.audit import audit_action

@audit_action("my_action", "my_resource")
async def my_method(self, target_id: str, operator_id: int, db: AsyncSession):
    result = ...
    return result  # result.id → audit_log.resource_id (if result has .id)
```

**Field extraction logic:**
1. `admin_id` → from `kwargs.get("operator_id") or kwargs.get("admin_id") or kwargs.get("closed_by")`
2. `db` → from `kwargs.get("db")` or last positional arg if it's `AsyncSession`
3. `resource_id` → from `result.id` (if result has .id), else `kwargs["line_user_id"]`, else `str(args[1])`
4. `details` → `{"function": func.__name__, "kwargs_keys": list(kwargs.keys())}`
5. **Does NOT commit** — caller must `await db.commit()`

---

## Credential Service

```python
from app.services.credential_service import credential_service
from app.models.credential import Provider

# Provider enum values
Provider.LINE           # LINE Messaging API
Provider.TELEGRAM       # Telegram bot
Provider.N8N            # n8n automation
Provider.GOOGLE_SHEETS  # Google Sheets
Provider.CUSTOM         # Custom integrations

# Key operations
credential_service.encrypt_credentials(data: dict) -> str   # Fernet encrypt
credential_service.decrypt_credentials(encrypted: str) -> dict  # Fernet decrypt
credential_service.mask_credentials(encrypted: str) -> str   # "****{last4}"

await credential_service.get_default_credential(provider, db) -> Optional[Credential]
await credential_service.list_credentials(provider_str_or_None, db) -> List[Credential]
await credential_service.create_credential(CredentialCreate, db) -> Credential
await credential_service.update_credential(id, CredentialUpdate, db) -> Optional[Credential]
await credential_service.delete_credential(id, db) -> bool
await credential_service.set_default(id, db) -> Optional[Credential]
await credential_service.verify_credential(id, db) -> {"success": bool, "message": str, "data"?: dict}
```

**`ENCRYPTION_KEY` in `.env`:**
```bash
# Generate valid Fernet key:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Example output: V2l0aF9mZXJuZXRfa2V5X2Zvcl9kZXY=  (32 url-safe base64 bytes)
ENCRYPTION_KEY=<paste generated key here>
```

Dev fallback (if key invalid): uses `base64.urlsafe_b64encode(b"dev_encryption_key_32_bytes_long")` — **do not use in production**.

---

## Settings Reference (`config.py`)

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `SECRET_KEY` | `str` | — | JWT signing key (required, no default) |
| `ALGORITHM` | `str` | `"HS256"` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `30` | Access token lifetime |
| `ENVIRONMENT` | `str` | `"development"` | `"development"` enables auth bypass in `deps.py` |
| `ENCRYPTION_KEY` | `str` | — | Fernet key for credential encryption |

**`backend/.env` template:**
```bash
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production          # Remove auth bypass
ENCRYPTION_KEY=<fernet_key>
```

---

## Frontend Auth Context

```typescript
// Interface
interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;    // !!user && !!token
    isLoading: boolean;
    login(username: string, password: string): Promise<void>;
    logout(): void;
    refreshToken(): Promise<void>;
}

interface User {
    id: string;
    username: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'USER';
    display_name?: string;
}

// Usage
const { user, token, isAuthenticated, login, logout, refreshToken } = useAuth();

// Send token in API calls
headers: { 'Authorization': `Bearer ${token}` }
```

**Dev mode flags (independent of each other):**

| Flag | Location | Effect |
|---|---|---|
| `NEXT_PUBLIC_DEV_MODE=true` | `frontend/.env.local` | Auto-login as mock admin, skip login page |
| `ENVIRONMENT=development` | `backend/.env` | Backend accepts no-token requests (creates mock User id=1) |

---

## Key Import Summary

```python
# Backend — security functions
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    verify_token, verify_jwt_token, get_token_subject
)

# Backend — dependencies
from app.api.deps import get_current_user, get_current_admin, get_db

# Backend — user model + roles
from app.models.user import User, UserRole, ChatMode

# Backend — audit logging
from app.core.audit import audit_action, create_audit_log

# Backend — credential storage
from app.services.credential_service import credential_service
from app.models.credential import Credential, Provider

# Frontend
import { useAuth } from '@/contexts/AuthContext';
```
