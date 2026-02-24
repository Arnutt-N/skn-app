# LINE Service Ops — API Reference

Extracted from `backend/app/services/line_service.py`,
`backend/app/services/rich_menu_service.py`, and
`backend/app/services/telegram_service.py`.

---

## LineService Method Signatures

All methods are on the singleton `line_service` (import from `app.services.line_service`).

### Reply Methods (require `reply_token` from webhook)

```python
await line_service.reply_text(
    reply_token: str,
    text: str
) -> None

await line_service.reply_flex(
    reply_token: str,
    alt_text: str,
    contents: dict          # ← raw Flex contents dict, NOT FlexMessage SDK object
) -> None                   # FlexContainer.from_dict() called internally

await line_service.reply_messages(
    reply_token: str,
    messages: list          # ← list of SDK message objects (TextMessage, FlexMessage, etc.)
) -> None                   # Silently slices to messages[:5]
```

### Push Methods (no reply token needed)

```python
await line_service.push_messages(
    line_user_id: str,
    messages: list          # ← list of SDK message objects, max 5
) -> None

await line_service.push_image_message(
    line_user_id: str,
    image_url: str,         # Must be HTTPS in production
    preview_url: Optional[str] = None   # Defaults to image_url if None
) -> None
```

### UX Helpers

```python
await line_service.show_loading_animation(
    chat_id: str,           # LINE user ID (same as line_user_id)
    loading_seconds: int = 20   # 1-60, auto-clears when reply sent
) -> None                   # Never raises — exceptions logged as WARNING
```

### DB Persistence

```python
saved: Message = await line_service.save_message(
    db: AsyncSession,
    line_user_id: str,
    direction: MessageDirection,   # MessageDirection.INCOMING or .OUTGOING
    message_type: str,             # "text"|"image"|"sticker"|"file"|"video"|"audio"|"multi"|"flex"
    content: str,
    payload: dict = None,          # JSONB — full payload for non-text messages
    sender_role: str = None,       # "USER"|"BOT"|"ADMIN"
    operator_name: str = None      # Display name for live chat operator messages
) -> Message                       # Returns refreshed Message ORM instance
```

### Media Operations

```python
data: bytes, content_type: Optional[str] = await line_service.download_message_content(
    message_id: str,        # LINE message ID (from event.message.id)
    preview: bool = False   # True = download thumbnail (images only)
) -> Tuple[bytes, Optional[str]]   # (b"", None) on failure — never raises

result: dict = await line_service.persist_line_media(
    message_id: str,        # LINE message ID
    media_type: str,        # "image"|"video"|"audio"|"file"
    file_name: Optional[str] = None   # Optional override for saved filename
) -> {
    "url": str,             # Absolute URL (relative if SERVER_BASE_URL not set)
    "preview_url": str,     # Only populated for images (from LINE preview endpoint)
    "content_type": str,
    "size": int,            # bytes
    "file_name": str        # Final saved filename (auto-generated if not provided)
}

result: dict = await line_service.persist_operator_upload(
    data: bytes,
    media_type: str,        # "image"|"file"|"video"|"audio"
    file_name: Optional[str] = None,
    content_type: Optional[str] = None
) -> {
    "url": str,             # Absolute URL
    "preview_url": str,     # Same as url for images, None for others
    "content_type": str,
    "size": int,
    "file_name": str        # uuid4().hex + "_" + original name (for uniqueness)
}
```

---

## Circuit Breaker State Machine

```
             ┌─────────────┐
             │   CLOSED    │ ← normal operation
             │ failures=0  │
             └──────┬──────┘
                    │ API call fails
                    ▼
             ┌─────────────┐
             │  COUNTING   │ failures < 5
             │ failures=N  │
             └──────┬──────┘
                    │ failures reaches 5
                    ▼
             ┌─────────────┐
             │    OPEN     │ all calls → RuntimeError("LINE API circuit is open")
             │ open_until  │ open for 30 seconds
             └──────┬──────┘
                    │ 30s elapsed + next call succeeds
                    ▼
             ┌─────────────┐
             │   CLOSED    │ failures reset to 0
             └─────────────┘
```

**State attributes on `line_service` singleton:**

| Attribute | Type | Description |
|---|---|---|
| `_cb_failures` | `int` | Consecutive failure count (reset on success) |
| `_cb_open_until` | `datetime \| None` | Circuit open expiry. `None` = closed |
| `_cb_failure_threshold` | `int` = 5 | Failures needed to open |
| `_cb_recovery_timeout_seconds` | `int` = 30 | Seconds before auto-close attempt |

**Operations protected by circuit:**
`reply_text`, `reply_flex`, `reply_messages`, `push_messages`, `push_image_message`, `show_loading_animation` (caught internally)

---

## Message Model Fields

```python
# backend/app/models/message.py
class Message(Base):
    __tablename__ = "messages"
    id: int                          # PK
    line_user_id: str                # nullable (system broadcast)
    direction: MessageDirection      # INCOMING | OUTGOING
    message_type: str                # text | image | sticker | file | video | audio | multi | flex
    content: str                     # text content or human-readable summary
    payload: dict (JSONB)            # full JSON for complex messages
    sender_role: SenderRole          # USER | BOT | ADMIN
    operator_name: str               # operator display name for ADMIN messages
    created_at: datetime
```

**`sender_role` conventions used in this project:**

| Role | When set |
|---|---|
| `"USER"` | Incoming messages from LINE users |
| `"BOT"` | Bot auto-replies (intent matching) |
| `"ADMIN"` | Operator messages via live chat |
| `None` | Older messages (before sender_role was added) |

---

## Media Storage Paths

```
backend/
└── uploads/
    ├── line_media/          ← LINE-originating user media (persist_line_media)
    │   ├── image_abc123.jpg
    │   ├── preview_xyz789.jpg  ← image previews
    │   └── video_def456.mp4
    └── operator_media/      ← Admin-uploaded media (persist_operator_upload)
        └── a1b2c3_filename.jpg   ← uuid4 prefix prevents collisions
```

**URL format:**
- Relative (no `SERVER_BASE_URL`): `/uploads/line_media/filename.jpg`
- Absolute (with `SERVER_BASE_URL`): `https://domain.com/uploads/line_media/filename.jpg`

**Served via:** FastAPI static files mount or the `GET /api/v1/media/{media_id}` endpoint (for DB-stored media — uses `media_files` table, separate from `uploads/` filesystem storage).

---

## RichMenuService Static Methods

All methods are `@staticmethod` — no instantiation needed.

```python
# Create rich menu JSON on LINE, return LINE-assigned richMenuId
line_id: str = await RichMenuService.create_on_line(db, rich_menu_config: dict)

# Upload image for a rich menu
await RichMenuService.upload_image_to_line(db, line_rich_menu_id, image_bytes, content_type)

# Set as default for all OA users
await RichMenuService.set_default_on_line(db, line_rich_menu_id)

# Delete from LINE (404 is silently accepted)
await RichMenuService.delete_from_line(db, line_rich_menu_id)

# List all rich menus from LINE
menus: List[dict] = await RichMenuService.list_from_line(db)

# Get specific rich menu from LINE (None if not found)
menu: Optional[dict] = await RichMenuService.get_from_line(db, line_rich_menu_id)

# Idempotent sync: create on LINE only if not already synced
result: dict = await RichMenuService.sync_with_idempotency(db, rich_menu_id: int)
# result keys: success, message, line_rich_menu_id, sync_status

# Get sync status for a DB rich menu
status: dict = await RichMenuService.get_sync_status(db, rich_menu_id: int)
# keys: sync_status, last_synced_at, last_sync_error, line_rich_menu_id
```

**API bases used by RichMenuService:**
- `https://api.line.me/v2/bot` — rich menu CRUD, set default
- `https://api-data.line.me/v2/bot` — image upload

---

## TelegramService Methods

Singleton `telegram_service` (import from `app.services.telegram_service`).

```python
# Handoff notification — formats Thai-language message with recent chat history
success: bool = await telegram_service.send_handoff_notification(
    user_display_name: str,
    user_picture_url: Optional[str],
    recent_messages: List[Message],   # up to 3 messages used (.content field)
    admin_panel_url: str,             # link to admin live-chat page
    db: AsyncSession
)

# Generic text alert
success: bool = await telegram_service.send_alert_message(
    text: str,
    db: AsyncSession
)
```

**Message format sent by `send_handoff_notification`:**
```
🔔 ผู้ใช้ขอคุยกับเจ้าหน้าที่

👤 ชื่อ: {display_name}
💬 ข้อความล่าสุด:
• "last message 1"
• "last message 2"

🔗 เปิดห้องแชทในระบบ Admin (hyperlink)
```

---

## Key Imports

```python
# LineService + message types
from app.services.line_service import line_service
from app.models.message import MessageDirection, SenderRole

# SDK message constructors (for reply_messages / push_messages)
from linebot.v3.messaging import (
    TextMessage,
    ImageMessage,
    FlexMessage,
    FlexContainer,
    StickerMessage,
)

# Rich menu
from app.services.rich_menu_service import RichMenuService

# Telegram
from app.services.telegram_service import telegram_service
```
