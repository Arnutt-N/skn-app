# Rich Menu Builder — Reference

Extracted from `backend/app/services/rich_menu_service.py`,
`backend/app/api/v1/endpoints/rich_menus.py`,
`backend/app/models/rich_menu.py`, `backend/app/schemas/rich_menu.py`,
and `backend/app/services/settings_service.py`.

---

## RichMenu Model

```python
# backend/app/models/rich_menu.py

class RichMenuStatus(str, enum.Enum):
    DRAFT     = "DRAFT"
    PUBLISHED = "PUBLISHED"
    INACTIVE  = "INACTIVE"

class RichMenu(Base):
    __tablename__ = "rich_menus"
    id: int                      # PK
    name: str                    # display name (also embedded in config.name)
    chat_bar_text: str           # chat bar label (also embedded in config.chatBarText)
    line_rich_menu_id: str       # nullable — assigned by LINE after sync
    config: dict (JSON)          # full LINE config dict (see shape below)
    image_path: str              # nullable — local path: uploads/rich_menus/{id}_{filename}
    status: RichMenuStatus       # DRAFT | PUBLISHED | INACTIVE
    sync_status: str             # "PENDING" | "SYNCED" | "FAILED" (plain String, not Enum!)
    last_synced_at: datetime     # nullable — set by update_sync_status()
    last_sync_error: str         # nullable — set by update_sync_status() on failure
    created_at, updated_at: datetime
```

---

## LINE Config Dict Shape

Required structure for `rich_menu.config` (sent verbatim to LINE API):

```python
{
    "size": {
        "width": 2500,    # Fixed: full = 2500, half = 2500
        "height": 1686    # Full = 1686, half = 843
    },
    "selected": False,    # True = show on open; False = collapsed
    "name": "Main Menu",  # Internal name (not shown to users)
    "chatBarText": "เมนูหลัก",  # Text shown on the chat bar pull tab
    "areas": [
        {
            "bounds": {
                "x": 0, "y": 0,        # Top-left corner (pixels)
                "width": 833,           # Area width
                "height": 1686          # Area height (full height for full menu)
            },
            "action": {
                "type": "message",      # See action types below
                "label": "สอบถาม",     # Button label
                "text": "สอบถาม"       # Text sent when tapped
            }
        }
    ]
}
```

**Area action types:**

| Type | Required fields | Description |
|---|---|---|
| `"message"` | `text` | Sends text message from user |
| `"uri"` | `uri` | Opens a URL |
| `"postback"` | `data` | Sends postback event (no visible message) |
| `"postback"` | `data`, `displayText` | Sends postback + shows text in chat |
| `"datetimepicker"` | `data`, `mode` | Opens date picker (mode: date/time/datetime) |

**Common layout templates (total width = 2500px, full height = 1686px):**

| Template | Areas | Width per area |
|---|---|---|
| 1-button | 1 | 2500 |
| 2-buttons | 2 | 1250 each |
| 3-buttons | 3 | 833 / 834 / 833 |
| 6-buttons (2 rows) | 6 | 833px × 843px each |

---

## Pydantic Schemas

```python
# backend/app/schemas/rich_menu.py

class RichMenuAreaBounds(BaseModel):
    x: int; y: int; width: int; height: int

class RichMenuAreaAction(BaseModel):
    type: str
    label: Optional[str] = None
    uri: Optional[str] = None
    text: Optional[str] = None
    data: Optional[str] = None
    displayText: Optional[str] = None

class RichMenuArea(BaseModel):
    bounds: RichMenuAreaBounds
    action: RichMenuAreaAction

class RichMenuCreate(BaseModel):
    name: str
    chat_bar_text: str
    template_type: str          # e.g. "3-buttons", "6-buttons" (stored, not used by backend)
    areas: List[RichMenuArea]   # Final pre-calculated pixel bounds

class RichMenuResponse(BaseModel):
    id: int
    name: str
    chat_bar_text: str
    line_rich_menu_id: Optional[str]
    config: Dict[str, Any]
    image_path: Optional[str]
    status: RichMenuStatus
    sync_status: str
    last_synced_at: Optional[datetime]
    last_sync_error: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True
```

---

## API Endpoints

All under prefix `/api/v1/admin/rich-menus` (registered in `api.py`).
**No auth currently** — all use only `get_db`, no `get_current_admin`.

### `GET /admin/rich-menus`
Returns all rich menus ordered by `created_at DESC`.

### `GET /admin/rich-menus/{id}`
Returns single rich menu or 404.

### `POST /admin/rich-menus`
Creates DRAFT rich menu.

**Request:** `RichMenuCreate` JSON
**Process:** Builds `line_config` dict → saves as `RichMenu(status=DRAFT, sync_status="PENDING")`
**Response:** `RichMenuResponse`

### `PUT /admin/rich-menus/{id}`
Updates `name`, `chat_bar_text`, and `config` (rebuilds from areas). Does NOT re-sync to LINE.

### `POST /admin/rich-menus/{id}/upload`
Uploads image for the rich menu.

**Request:** `multipart/form-data` with `file` field
**Behavior:**
- Saves to `uploads/rich_menus/{id}_{file.filename}`
- Sets `rich_menu.image_path`
- If `line_rich_menu_id` already set → calls `upload_image_to_line()` immediately
- Returns: `{"message": "Image saved", "path": "uploads/rich_menus/..."}`

### `POST /admin/rich-menus/{id}/sync`
Idempotent sync to LINE. After successful sync, also uploads image if local file exists.

**Behavior matrix:**

| State | Action |
|---|---|
| `line_rich_menu_id=null` | Call `create_on_line()` → set ID + SYNCED |
| ID set + menu exists on LINE | No-op → return SYNCED |
| ID set + menu deleted on LINE | Return FAILED (manual clear required) |
| API error during create | Return FAILED + store error in `last_sync_error` |

**Response:**
```json
{
    "success": true,
    "message": "Created on LINE successfully",
    "line_rich_menu_id": "richmenu-abc123",
    "sync_status": "SYNCED"
}
```

### `GET /admin/rich-menus/{id}/sync-status`
Returns sync metadata only (no full config).

```json
{
    "sync_status": "SYNCED",
    "last_synced_at": "2026-02-23T10:30:00+00:00",
    "last_sync_error": null,
    "line_rich_menu_id": "richmenu-abc123"
}
```

### `POST /admin/rich-menus/{id}/publish`
Sets rich menu as default for all LINE OA users.

**Calls:** `POST https://api.line.me/v2/bot/user/all/richmenu/{line_rich_menu_id}`
**Sets:** `rich_menu.status = RichMenuStatus.PUBLISHED`
**Warning:** Fails with `NoneType` if `line_rich_menu_id` is not set — sync first.

### `DELETE /admin/rich-menus/{id}`
Full cleanup: LINE → local file → DB.

1. `delete_from_line(db, line_rich_menu_id)` — 404 silently accepted
2. `os.remove(image_path)` if file exists
3. `await db.delete(rich_menu)` + `await db.commit()`

---

## RichMenuService Static Methods

```python
from app.services.rich_menu_service import RichMenuService

# TOKEN IS READ FROM DB VIA SettingsService — not from env directly
# SettingsService.get_setting(db, "LINE_CHANNEL_ACCESS_TOKEN") → DB first → env fallback

# Create rich menu on LINE, return LINE-assigned richMenuId
line_id: str = await RichMenuService.create_on_line(db, rich_menu_config: dict)

# Upload image — NOTE: uses api-data.line.me, NOT api.line.me
await RichMenuService.upload_image_to_line(
    db, line_rich_menu_id: str, image_bytes: bytes, content_type: str
)

# Set as default for ALL OA users
await RichMenuService.set_default_on_line(db, line_rich_menu_id: str)

# Delete (404 silently accepted)
await RichMenuService.delete_from_line(db, line_rich_menu_id: str)

# List from LINE
menus: List[dict] = await RichMenuService.list_from_line(db)

# Get single from LINE (None if 404)
menu: Optional[dict] = await RichMenuService.get_from_line(db, line_rich_menu_id: str)

# Idempotent sync — PREFER over create_on_line() directly
result: dict = await RichMenuService.sync_with_idempotency(db, rich_menu_id: int)

# Get sync status only
status: dict = await RichMenuService.get_sync_status(db, rich_menu_id: int)

# Update sync status (also sets last_synced_at and commits)
await RichMenuService.update_sync_status(db, rich_menu: RichMenu, status: str, error: str = None)
```

---

## SettingsService Reference

```python
from app.services.settings_service import SettingsService

# Read: DB first → env fallback → default
value: str = await SettingsService.get_setting(db, key: str, default: str = "")

# Write (upsert)
setting: SystemSetting = await SettingsService.set_setting(
    db, key: str, value: str, description: str = None
)
```

**Keys used by RichMenuService:**

| Key | Purpose |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Bearer token for all LINE API calls |

**Where to set:** `POST /api/v1/admin/settings` or `backend/.env`

---

## Full Lifecycle Diagram

```
User/Admin                   Backend                            LINE API
    │                           │                                  │
    │  POST /admin/rich-menus   │                                  │
    │──────────────────────────►│  Create RichMenu(DRAFT)          │
    │  RichMenuResponse         │  sync_status="PENDING"           │
    │◄──────────────────────────│                                  │
    │                           │                                  │
    │  POST /{id}/upload        │                                  │
    │──────────────────────────►│  Save to uploads/rich_menus/     │
    │  {"message": "saved"}     │  (no LINE call yet — not synced) │
    │◄──────────────────────────│                                  │
    │                           │                                  │
    │  POST /{id}/sync          │                                  │
    │──────────────────────────►│  create_on_line(config)         │
    │                           │─────────────────────────────────►│
    │                           │  richMenuId                      │
    │                           │◄─────────────────────────────────│
    │                           │  upload_image_to_line()          │
    │                           │─────────────────────────────────►│
    │  sync result (SYNCED)     │  200 OK                          │
    │◄──────────────────────────│◄─────────────────────────────────│
    │                           │                                  │
    │  POST /{id}/publish       │                                  │
    │──────────────────────────►│  set_default_on_line()           │
    │                           │─────────────────────────────────►│
    │  {"message": "default"}   │  All users see new menu          │
    │◄──────────────────────────│◄─────────────────────────────────│
```

---

## File Storage

```
backend/
└── uploads/
    └── rich_menus/
        ├── 1_menu_image.png        ← {id}_{original_filename}
        ├── 2_menu_bg.jpg
        └── ...
```

**Content-type detection (extension-based):**
```python
ext = os.path.splitext(rich_menu.image_path)[1].lower()
content_type = "image/png" if ext == ".png" else "image/jpeg"
```

---

## Key Imports

```python
# Service
from app.services.rich_menu_service import RichMenuService
from app.services.settings_service import SettingsService

# Model + Status
from app.models.rich_menu import RichMenu, RichMenuStatus

# Schemas
from app.schemas.rich_menu import RichMenuResponse, RichMenuCreate, RichMenuArea

# FastAPI (for image upload endpoint)
from fastapi import UploadFile, File, Form

# httpx (used internally by RichMenuService)
import httpx
```
