# Settings & Credentials — Reference

Sources: `config.py`, `system_setting.py` (model), `credential.py` (model),
`settings_service.py`, `credential_service.py`, `settings.py` (endpoint),
`admin_credentials.py` (endpoint), `schemas/rich_menu.py` (settings schemas),
`schemas/credential.py`, `frontend/app/admin/settings/line/page.tsx`.

---

## Storage System Comparison

| | `SystemSetting` | `Credential` |
|---|---|---|
| Table | `system_settings` | `credentials` |
| Storage | Plain text | Fernet-encrypted |
| Structure | Key-value (string/string) | Typed per-provider JSON dict |
| Multi-account | No (one value per key) | Yes (multiple per provider, one default) |
| Verify connectivity | No | Yes (live HTTP call) |
| Status | ✅ Registered + in use | ❌ Built, NOT registered |
| Use for | Non-sensitive config | API tokens, secrets |

---

## Model: `SystemSetting`

**File:** `backend/app/models/system_setting.py`

```python
class SystemSetting(Base):
    __tablename__ = "system_settings"
    id          = Column(Integer, primary_key=True, index=True)
    key         = Column(String, unique=True, index=True, nullable=False)
    value       = Column(Text, nullable=True)
    description = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## Model: `Credential`

**File:** `backend/app/models/credential.py`

```python
class Provider(str, Enum):
    LINE          = "LINE"
    TELEGRAM      = "TELEGRAM"
    N8N           = "N8N"
    GOOGLE_SHEETS = "GOOGLE_SHEETS"
    CUSTOM        = "CUSTOM"

class Credential(Base):
    __tablename__ = "credentials"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)         # Human label, e.g. "LINE Production"
    provider      = Column(String(50), nullable=False, index=True)  # Provider enum value
    credentials   = Column(Text, nullable=False)                # Fernet-encrypted JSON string
    metadata_json = Column(JSONB, name="metadata", nullable=True) # Free-form metadata
    is_active     = Column(Boolean, default=False)
    is_default    = Column(Boolean, default=False)              # Only one default per provider
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## Schemas

**Settings schema — File:** `backend/app/schemas/rich_menu.py` ⚠️ (oddly placed)
```python
class SystemSettingBase(BaseModel):
    key:         str
    value:       str
    description: Optional[str] = None

class SystemSettingResponse(SystemSettingBase):
    id:         int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config: from_attributes = True
```

**Credential schema — File:** `backend/app/schemas/credential.py`
```python
class CredentialBase(BaseModel):
    name:       str = Field(..., min_length=1, max_length=100)
    provider:   Provider
    metadata:   Optional[Dict[str, Any]] = None
    is_active:  bool = False
    is_default: bool = False

class CredentialCreate(CredentialBase):
    credentials: Dict[str, Any]   # Raw dict — service encrypts before saving

class CredentialUpdate(BaseModel):
    name:        Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None   # Raw dict — service re-encrypts
    metadata:    Optional[Dict[str, Any]] = None
    is_active:   Optional[bool] = None
    is_default:  Optional[bool] = None

class CredentialResponse(CredentialBase):
    id:                  int
    created_at:          datetime
    updated_at:          datetime
    credentials_masked:  str   # "****{last4 of ciphertext}" — NOT plaintext masked
    class Config: from_attributes = True; use_enum_values = True

class CredentialListResponse(BaseModel):
    credentials: List[CredentialResponse]
```

---

## `SettingsService` — Read/Write Pattern

**File:** `backend/app/services/settings_service.py`

```python
# READ — lookup chain: DB → env → default
async def get_setting(db, key, default="") -> str:
    db_value = SELECT value FROM system_settings WHERE key = ?
    if db_value is not None: return db_value
    return getattr(settings, key, default)   # ← pydantic env fallback

# WRITE — upsert
async def set_setting(db, key, value, description=None) -> SystemSetting:
    existing = SELECT WHERE key = ?
    if existing: UPDATE
    else: INSERT
    await db.commit(); await db.refresh(...)
```

**Resolution priority:**
```
DB (system_settings) > .env file > config.py default > ""
```

---

## `CredentialService` — Encrypt/Decrypt/Verify

**File:** `backend/app/services/credential_service.py`

```python
# Encryption (Fernet symmetric)
cipher = Fernet(settings.ENCRYPTION_KEY.encode())
# Fallback if ENCRYPTION_KEY invalid: Fernet(base64.urlsafe_b64encode(b"dev_encryption_key_32_bytes_long"))

encrypt_credentials(data: dict) → str      # json.dumps → cipher.encrypt → .decode()
decrypt_credentials(encrypted: str) → dict # cipher.decrypt → json.loads

# CRUD
create_credential(CredentialCreate, db)
    # if is_default: UPDATE credentials SET is_default=False WHERE provider=? AND id!=new_id
update_credential(id, CredentialUpdate, db)
    # if credentials in update: re-encrypt
    # if is_default: unset others
delete_credential(id, db) → bool
get_default_credential(Provider, db) → Optional[Credential]
    # WHERE provider=? AND is_active=True AND is_default=True LIMIT 1
set_default(id, db)
    # Unset others → set this one is_default=True

# Verify (live HTTP)
verify_credential(id, db) → {"success": bool, "message": str, "data": {}}
    # LINE:     GET api.line.me/v2/bot/info   (creds key: "channel_access_token")
    # TELEGRAM: GET api.telegram.org/bot{token}/getMe  (creds key: "bot_token")
    # Others:   {"success": False, "message": "Verification not implemented"}

mask_credentials(encrypted_str: str) → str
    # Returns f"****{encrypted_str[-4:]}" — last 4 chars of ciphertext
```

---

## Provider Credential Dict Shapes

```python
Provider.LINE:
    {"channel_access_token": "Bearer-format token", "channel_secret": "hex secret"}

Provider.TELEGRAM:
    {"bot_token": "123456:ABC..."}   # format: {bot_id}:{token}

Provider.N8N:
    {"api_key": "...", "base_url": "https://your-n8n.com"}   # verify not implemented

Provider.GOOGLE_SHEETS:
    {"service_account_json": {...}}   # full service account JSON — verify not implemented

Provider.CUSTOM:
    {any structure}   # verify always returns "not implemented"
```

---

## API Endpoints

### System Settings — `/api/v1/admin/settings` ✅ REGISTERED

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/settings` | List all `SystemSetting` rows |
| `POST` | `/admin/settings` | Upsert a setting (body: `{key, value, description}`) |
| `POST` | `/admin/settings/line/validate` | Test LINE token (body: `{channel_access_token}`) |

### Credentials — `/api/v1/admin/credentials` ❌ NOT REGISTERED

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/credentials` | List all (secrets masked) |
| `POST` | `/admin/credentials` | Create new credential (encrypts) |
| `GET` | `/admin/credentials/line/status` | Check default LINE credential live status |
| `GET` | `/admin/credentials/{id}` | Get one (masked) |
| `PUT` | `/admin/credentials/{id}` | Update (re-encrypts if credentials provided) |
| `DELETE` | `/admin/credentials/{id}` | Delete |
| `POST` | `/admin/credentials/{id}/verify` | Test live connection |
| `POST` | `/admin/credentials/{id}/set-default` | Set as provider default |

**To register:** add to `api.py`:
```python
from app.api.v1.endpoints import admin_credentials
api_router.include_router(admin_credentials.router, prefix="/admin/credentials", tags=["admin"])
```

---

## Environment Variables (`config.py`)

**File:** `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "JskApp"
    ENVIRONMENT:  str = "development"   # "development" → bypasses backend auth

    DATABASE_URL:  PostgresDsn          # Required
    SECRET_KEY:    str                  # Required (JWT signing)
    ALGORITHM:     str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # LINE
    LINE_CHANNEL_ACCESS_TOKEN: str = ""
    LINE_CHANNEL_SECRET:       str = ""
    LINE_LOGIN_CHANNEL_ID:     str = ""

    # Server
    SERVER_BASE_URL: str = ""           # Required for LINE media URLs (must be HTTPS)

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # WebSocket
    WS_RATE_LIMIT_MESSAGES: int = 30
    WS_RATE_LIMIT_WINDOW:   int = 60
    WS_MAX_MESSAGE_LENGTH:  int = 5000

    # Webhook dedup
    WEBHOOK_EVENT_TTL: int = 300

    # SLA
    SLA_MAX_FRT_SECONDS:        int = 120
    SLA_MAX_RESOLUTION_SECONDS: int = 1800
    SLA_MAX_QUEUE_WAIT_SECONDS: int = 300
    SLA_ALERT_TELEGRAM_ENABLED: bool = False

    # ⚠️ MISSING — must add:
    # ENCRYPTION_KEY: str = ""    ← for Fernet credential encryption

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
```

**Generate `ENCRYPTION_KEY`:**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

---

## Frontend: LINE Settings Page

**File:** `frontend/app/admin/settings/line/page.tsx`

```
State:
  settings: { LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET }
  isEditing: bool (auto-true if tokens missing)
  canSave: bool (only true after Connect success)
  processing: 'CONNECT' | 'SAVE' | null
  validationResult: { success, botInfo?, error? }

Actions:
  fetchSettings() → GET /admin/settings → map array to {key: value}
  handleConnect() → POST /admin/settings/line/validate { channel_access_token }
    success: setCanSave(true), show status modal with bot displayName + userId
    failure: setCanSave(false), show error modal
  handleSave() → POST /admin/settings (LINE_CHANNEL_ACCESS_TOKEN)
                 POST /admin/settings (LINE_CHANNEL_SECRET)
    → refresh → exit edit mode

Modals:
  showStatusModal      — Connect result (success/failure)
  showSaveSuccessModal — Save confirmation
  showUnsavedModal     — Navigation guard while editing
```

---

## Known Gaps Summary

| ID | Gap | Fix |
|---|---|---|
| GAP-1 | `admin_credentials.py` not registered | Add import + include_router in `api.py` |
| GAP-2 | `ENCRYPTION_KEY` not in `config.py` | Add field + set in `.env` |
| GAP-3 | `SystemSetting` stores tokens in plain text | Migrate sensitive keys to `Credential` system |
| GAP-4 | Settings hub (`/admin/settings/`) is ComingSoon | Build hub page with navigation to sub-pages |
| GAP-5 | `verify_credential()` only handles LINE + Telegram | Add branches for N8N, Google Sheets, etc. |
| GAP-6 | `SystemSettingBase` schema in `rich_menu.py` | Move to `schemas/system_setting.py` |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/models/system_setting.py` | `SystemSetting` model |
| `backend/app/models/credential.py` | `Credential` model + `Provider` enum |
| `backend/app/services/settings_service.py` | `SettingsService` — get/set plain-text settings |
| `backend/app/services/credential_service.py` | `CredentialService` — Fernet encrypt/decrypt/verify |
| `backend/app/api/v1/endpoints/settings.py` | `/admin/settings` endpoints (registered) |
| `backend/app/api/v1/endpoints/admin_credentials.py` | `/admin/credentials` endpoints (NOT registered) |
| `backend/app/schemas/rich_menu.py` | `SystemSettingBase`, `SystemSettingResponse` (odd location) |
| `backend/app/schemas/credential.py` | All credential schemas |
| `backend/app/core/config.py` | `Settings` pydantic model — env vars |
| `backend/app/api/v1/api.py` | Router registration (add credentials here) |
| `frontend/app/admin/settings/line/page.tsx` | LINE settings UI (Connect + Save flow) |
