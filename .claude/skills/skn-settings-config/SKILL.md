# skn-settings-config

Manages all environment configuration, third-party credentials, and system settings in the SKN App. Covers two independent storage systems: a plain-text `SystemSetting` key-value store (currently in use) and a Fernet-encrypted `Credential` store (fully built, not yet wired up). Use this skill when adding, reading, or securing configuration for any platform or service.

Use this skill when asked to:
- "Add LINE config / Telegram config / N8N config"
- "Store API keys / tokens securely"
- "Add a new 3rd-party integration" / "Connect to Google Sheets / N8N"
- "How does the system read the LINE token?" / "ตรวจสอบ token LINE"
- "Register the credential API" / "เปิดใช้ /admin/credentials"
- "Add `ENCRYPTION_KEY` to config"
- "Why is the credential endpoint 404?"
- "Add a setting key" / "Save business hours to DB"
- "Test connection / verify token"
- "Add a new Provider type"

---

## Architecture: Two Storage Systems

```
┌──────────────────────────────────────────────────────────────┐
│  SystemSetting table (system_settings)                       │
│  Plain text key-value                                        │
│  Used by: RichMenuService, TelegramService, LINE settings UI │
│  Endpoint: GET/POST /api/v1/admin/settings  ✅ LIVE          │
│  Frontend: /admin/settings/line  ✅ IMPLEMENTED              │
│  ⚠️  Stores sensitive tokens in PLAIN TEXT                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Credential table (credentials)                              │
│  Fernet-encrypted per-provider credential store              │
│  Supports: LINE, TELEGRAM, N8N, GOOGLE_SHEETS, CUSTOM        │
│  Service: CredentialService (full CRUD + verify + mask)      │
│  Endpoint: /api/v1/admin/credentials  ❌ NOT REGISTERED      │
│  Frontend: not yet built                                     │
│  ✅ Designed for secure multi-provider credential management │
└──────────────────────────────────────────────────────────────┘
```

**When to use which:**
- `SystemSetting` — non-sensitive config: SLA thresholds, business hours, chatbot messages, webhook URL, LIFF ID, feature flags
- `Credential` — sensitive secrets: channel access tokens, bot tokens, API keys for LINE/Telegram/N8N/Google Sheets/custom providers

---

## Critical Rules

1. **`admin_credentials.py` is NOT registered** — The encrypted credential system (`/admin/credentials`) exists and is fully implemented but is never imported or registered in `api.py`. It returns 404 on all routes. To activate: add it to `api.py` imports and register with `api_router.include_router(admin_credentials.router, prefix="/admin/credentials", tags=["admin"])`.

2. **`ENCRYPTION_KEY` is NOT in `config.py`** — `CredentialService` calls `settings.ENCRYPTION_KEY` but this field is absent from the `Settings` pydantic model. It has a try/except fallback to a hardcoded dev key. For production: add `ENCRYPTION_KEY: str = ""` to `config.py` and set a valid 32-byte Fernet key in `.env`.

3. **`SettingsService` DB-then-env chain** — `get_setting(db, key)` checks `system_settings` table first, then falls back to `settings.<key>` (pydantic env). A value in DB overrides the `.env` file — this is intentional for runtime config management without restarts.

4. **`SystemSetting` stores plain text** — `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` stored in DB are **unencrypted**. For production hardening, migrate sensitive keys to the `Credential` system.

5. **`SystemSettingBase` schema is in `rich_menu.py`** — Not in `system_setting.py`. This is a naming quirk; import from `app.schemas.rich_menu` for settings schemas.

6. **`set_default()` unsets other defaults** — When setting a `Credential` as default for a provider, all other credentials for that provider are automatically set `is_default=False`. Only one default per provider is allowed.

7. **`verify_credential()` makes live HTTP calls** — For LINE: `GET https://api.line.me/v2/bot/info`. For Telegram: `GET https://api.telegram.org/bot{token}/getMe`. These are real external calls; always handle network errors.

8. **`mask_credentials()` is not true masking** — It returns `"****{last_4_chars_of_encrypted_string}"` — i.e., last 4 chars of the ciphertext, not the plaintext. It's a display identifier only, not a security mask of the actual token.

9. **LINE settings UI requires "Connect" before "Save"** — `canSave` state is only set to `true` after `POST /admin/settings/line/validate` succeeds. Save button is disabled until connection is verified. Do not remove this guard.

10. **`SettingsService.get_setting()` returns empty string `""` as default** — Services that call `get_setting(db, "SOME_KEY")` get `""` if the key is not in DB and not in `.env`. Always guard against empty string before using tokens.

---

## Step-by-Step Guide

### Step 1 — Read/write plain-text config (`SystemSetting`)

**File:** `backend/app/services/settings_service.py`

```python
from app.services.settings_service import SettingsService

# READ — DB first, env fallback, empty string default
value = await SettingsService.get_setting(db, "LINE_CHANNEL_ACCESS_TOKEN")
# Or with explicit default:
webhook_url = await SettingsService.get_setting(db, "WEBHOOK_URL", default="")

# WRITE — upsert pattern (INSERT or UPDATE)
await SettingsService.set_setting(db, "LINE_CHANNEL_ACCESS_TOKEN", token, description="LINE API Token")
await SettingsService.set_setting(db, "BUSINESS_HOURS_START", "08:00")
```

**Pattern for services that need live tokens (correct approach):**
```python
# In service __init__ or method — always pass db and call SettingsService
# DO NOT cache at startup; token may change at runtime via admin UI
async def send_something(self, db: AsyncSession, ...):
    token = await SettingsService.get_setting(db, "LINE_CHANNEL_ACCESS_TOKEN")
    if not token:
        raise ValueError("LINE_CHANNEL_ACCESS_TOKEN not configured")
    # use token
```

---

### Step 2 — Admin settings API (`/admin/settings`)

**File:** `backend/app/api/v1/endpoints/settings.py`

```python
# GET /admin/settings → List[SystemSettingResponse]
# All keys + values from system_settings table

# POST /admin/settings → SystemSettingResponse (upsert)
# Body: { "key": "KEY_NAME", "value": "value", "description": "optional" }

# POST /admin/settings/line/validate → { "status": "valid", "data": {...} }
# Body: { "channel_access_token": "..." }
# Calls api.line.me/v2/bot/info — live validation
```

**Available system setting keys (current usage):**
| Key | Used by | Notes |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | RichMenuService, TelegramService | Plain text in DB |
| `LINE_CHANNEL_SECRET` | (validation only) | Plain text in DB |
| `TELEGRAM_BOT_TOKEN` | TelegramService | Plain text in DB |
| `TELEGRAM_CHAT_ID` | TelegramService | Notification target |
| Any custom key | SettingsService.get_setting() | Free-form key-value |

---

### Step 3 — LINE settings frontend page

**File:** `frontend/app/admin/settings/line/page.tsx`

```
Flow:
1. Load: GET /admin/settings → find LINE_CHANNEL_ACCESS_TOKEN + LINE_CHANNEL_SECRET
   → if empty, auto-enter edit mode
2. Edit: user types new tokens
3. "Connect": POST /admin/settings/line/validate { channel_access_token }
   → on success: setCanSave(true), show bot info modal
   → on failure: setCanSave(false), show error modal
4. "Save" (enabled only after Connect success):
   → POST /admin/settings { key: LINE_CHANNEL_ACCESS_TOKEN, value: ... }
   → POST /admin/settings { key: LINE_CHANNEL_SECRET, value: ... }
   → refresh + exit edit mode

Guards:
- "Save" disabled until "Connect" succeeds (canSave state)
- Navigation away while editing → "Unsaved Changes" modal
- window.beforeunload listener while editing
```

---

### Step 4 — Encrypted credential system (`Credential`)

**File:** `backend/app/services/credential_service.py`

```python
from app.services.credential_service import credential_service
from app.models.credential import Provider

# Create a new credential (auto-encrypts)
cred = await credential_service.create_credential(CredentialCreate(
    name="LINE Production",
    provider=Provider.LINE,
    credentials={"channel_access_token": "...", "channel_secret": "..."},
    is_active=True,
    is_default=True   # auto-unsets other LINE defaults
), db)

# Get default credential for a provider (decrypt internally as needed)
cred = await credential_service.get_default_credential(Provider.LINE, db)
if cred:
    decrypted = credential_service.decrypt_credentials(cred.credentials)
    token = decrypted["channel_access_token"]

# Verify (live HTTP call)
result = await credential_service.verify_credential(cred.id, db)
# result: {"success": True, "message": "...", "data": {...}}

# Mask for display (NOT true masking — last 4 chars of ciphertext)
display = credential_service.mask_credentials(cred.credentials)  # "****F0A3"
```

**Provider-specific credential dict keys:**
```python
Provider.LINE:          {"channel_access_token": "...", "channel_secret": "..."}
Provider.TELEGRAM:      {"bot_token": "..."}   # Used in verify_credential()
Provider.N8N:           {"api_key": "...", "base_url": "..."}  # (not yet implemented in verify)
Provider.GOOGLE_SHEETS: {"service_account_json": {...}}  # (not yet implemented in verify)
Provider.CUSTOM:        {any dict}              # (verify always returns "not implemented")
```

---

### Step 5 — Register the credential API (currently unregistered)

**File:** `backend/app/api/v1/api.py`

To activate `/admin/credentials`:

```python
# 1. Add import at the top
from app.api.v1.endpoints import (
    ...,
    admin_credentials,   # ← add this
)

# 2. Register router (after other admin routers)
api_router.include_router(admin_credentials.router, prefix="/admin/credentials", tags=["admin"])
```

Note: `GET /admin/credentials/line/status` must stay above `GET /admin/credentials/{id}` in the router file (already done — static routes before dynamic `{id}` routes).

---

### Step 6 — Add `ENCRYPTION_KEY` to config

**File:** `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    ...
    # Credential encryption (Fernet key — 32-byte base64url encoded)
    ENCRYPTION_KEY: str = ""   # ← add this field
    ...
```

**Generate a valid Fernet key:**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())  # Copy to .env as ENCRYPTION_KEY=...
```

**Add to `.env`:**
```
ENCRYPTION_KEY=your_generated_fernet_key_here
```

---

### Step 7 — Add a new Provider type

1. **Add to `Provider` enum** in `backend/app/models/credential.py` AND `backend/app/schemas/credential.py`:
   ```python
   class Provider(str, Enum):
       ...
       SLACK = "SLACK"   # ← new
   ```

2. **Add `verify_credential()` branch** in `backend/app/services/credential_service.py`:
   ```python
   elif db_obj.provider == Provider.SLACK:
       token = creds.get("bot_token")
       async with httpx.AsyncClient() as client:
           response = await client.get(
               "https://slack.com/api/auth.test",
               headers={"Authorization": f"Bearer {token}"}
           )
           if response.status_code == 200 and response.json().get("ok"):
               return {"success": True, "message": "Slack verified", "data": response.json()}
           return {"success": False, "message": f"Slack error: {response.text}"}
   ```

3. **Define credential dict shape** (document what keys to use, e.g. `{"bot_token": "..."}`)
4. **Add frontend page** at `frontend/app/admin/settings/{provider}/page.tsx` following the LINE page pattern

---

### Step 8 — Add a new plain-text setting key

1. Define the key name as a constant or document it (e.g. `"BUSINESS_HOURS_START"`)
2. Write it via admin UI or directly via `POST /admin/settings`
3. Read it in any service via `await SettingsService.get_setting(db, "BUSINESS_HOURS_START", default="09:00")`
4. Optionally add to `config.py` `Settings` as an env var fallback:
   ```python
   BUSINESS_HOURS_START: str = "09:00"
   ```
   Then `SettingsService` will use the env value if DB key is absent.

---

## Known Gaps

### GAP-1: `admin_credentials.py` not registered in `api.py`
Encrypted credential system is fully implemented but unreachable. All `/admin/credentials/*` routes return 404. **Fix:** Register in `api.py` (Step 5).

### GAP-2: `ENCRYPTION_KEY` not in `config.py`
`CredentialService.__init__` will fail silently and fall back to a hardcoded dev key. **Fix:** Add `ENCRYPTION_KEY: str = ""` to `Settings` + generate a real key for production (Step 6).

### GAP-3: `SystemSetting` stores tokens in plain text
`LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `TELEGRAM_BOT_TOKEN` are stored unencrypted in the `system_settings` table. **Mitigation:** Use the `Credential` system (once registered) for sensitive keys. DB-level encryption or column-level encryption can also be added via Alembic.

### GAP-4: Settings hub page is ComingSoon
`/admin/settings/page.tsx` only renders `<ComingSoon />`. The LINE sub-page (`/admin/settings/line`) exists and works when navigated to directly.

### GAP-5: `verify_credential()` only handles LINE and Telegram
N8N, Google Sheets, and CUSTOM providers always return `"Verification not implemented for {provider}"`. Add provider-specific branches as new integrations are built.

### GAP-6: `SystemSettingBase` schema is in `rich_menu.py`
Oddly placed. When adding settings-related schemas, consider moving to a dedicated `system_setting.py` schema file, or be aware of the import path: `from app.schemas.rich_menu import SystemSettingBase, SystemSettingResponse`.

---

## Common Issues

### `/admin/credentials/*` returns 404
**Cause**: GAP-1 — router not registered.
**Fix**: Add import + `include_router` in `api.py`.

### `CredentialService` using dev fallback key
**Cause**: `ENCRYPTION_KEY` missing from `.env` or `config.py`. The try/except silently falls back to a static dev key.
**Fix**: Generate a Fernet key (`Fernet.generate_key()`), set in `.env`, add to `config.py`.

### `SettingsService.get_setting()` returns `""`
**Cause**: Key not in DB AND not in `config.py` Settings / `.env`.
**Fix**: Insert via `POST /admin/settings` or add to `.env` + `config.py`.

### Save button permanently disabled in LINE settings page
**Cause**: `canSave` is only `true` after Connect succeeds. User must click "Connect" first.
**Fix**: This is intentional. Click "Connect" → validate token → Save unlocks.

### `decrypt_credentials()` throws `InvalidToken`
**Cause**: Data was encrypted with a different `ENCRYPTION_KEY`, or `ENCRYPTION_KEY` changed after records were created.
**Fix**: Re-encrypt affected records using the correct key. Never rotate `ENCRYPTION_KEY` without re-encrypting all `credentials` column values.

---

## Quality Checklist

- [ ] New sensitive credential stored via `Credential` system (not `SystemSetting`)
- [ ] `ENCRYPTION_KEY` in `.env` is a valid Fernet key (not the dev fallback)
- [ ] `admin_credentials.py` registered in `api.py` before shipping credential features
- [ ] `ENCRYPTION_KEY` added to `config.py` `Settings` class
- [ ] New `Provider` enum value added to BOTH `models/credential.py` AND `schemas/credential.py`
- [ ] `verify_credential()` branch added for new provider
- [ ] `SettingsService.get_setting()` callers guard against empty-string return
- [ ] Non-sensitive settings use `SystemSetting` (not `Credential`)
- [ ] LINE settings page "Connect before Save" guard preserved
- [ ] Fernet key rotation plan exists if `ENCRYPTION_KEY` needs changing
