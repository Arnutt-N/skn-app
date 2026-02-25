# Data Models — Reference

Sources: `backend/app/models/*.py`, `backend/app/utils/url_utils.py`

---

## `models/__init__.py` — Complete Export List (18 models)

```python
from .user import User
from .organization import Organization
from .service_request import ServiceRequest
from .booking import Booking
from .message import Message
from .media_file import MediaFile
from .auto_reply import AutoReply
from .reply_object import ReplyObject
from .geography import Province, District, SubDistrict
from .intent import IntentCategory, IntentKeyword, IntentResponse
from .chat_session import ChatSession
from .audit_log import AuditLog
from .business_hours import BusinessHours
from .csat_response import CsatResponse
from .canned_response import CannedResponse
from .tag import Tag, UserTag
from .request_comment import RequestComment
# NOTE: SystemSetting is NOT in __init__.py — created inline in startup_event
```

---

## Enum Values Summary

| Enum | Values | Location |
|---|---|---|
| `UserRole` | SUPER_ADMIN, ADMIN, AGENT, USER | `user.py` |
| `ChatMode` | BOT, HUMAN | `user.py` |
| `SessionStatus` | WAITING, ACTIVE, CLOSED | `chat_session.py` (⚠️ Column is String, not Enum) |
| `ClosedBy` | OPERATOR, SYSTEM, USER, SYSTEM_TIMEOUT | `chat_session.py` (⚠️ Column is String) |
| `MessageDirection` | INCOMING, OUTGOING | `message.py` |
| `SenderRole` | USER, BOT, ADMIN | `message.py` |
| `RequestStatus` | PENDING, IN_PROGRESS, AWAITING_APPROVAL, COMPLETED, REJECTED | `service_request.py` |
| `RequestPriority` | LOW, MEDIUM, HIGH, URGENT | `service_request.py` |
| `BookingStatus` | CONFIRMED, CANCELLED, COMPLETED, NOSHOW | `booking.py` |
| `friend_status` | "ACTIVE", "BLOCKED", "UNFOLLOWED", "DELETED" | `user.py` (String, no enum!) |

---

## Model Field Tables

### `User` (`users` table)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | Integer | PK, index | |
| `line_user_id` | String | unique, index, nullable | LINE users only |
| `username` | String | unique, index, nullable | Admin/Agent login |
| `email` | String | unique, index, nullable | |
| `hashed_password` | String | nullable | bcrypt hash |
| `display_name` | String | nullable | |
| `picture_url` | String | nullable | |
| `role` | Enum(UserRole) | default=USER | |
| `is_active` | Boolean | default=True | |
| `organization_id` | Integer | FK→organizations.id, nullable | Admins/Agents |
| `chat_mode` | Enum(ChatMode) | default=BOT | |
| `friend_status` | String | nullable, default="ACTIVE" | No DB enum |
| `friend_since` | DateTime(tz) | nullable | |
| `last_message_at` | DateTime(tz) | nullable | |
| `profile_updated_at` | DateTime(tz) | nullable | |
| `created_at` | DateTime(tz) | server_default=now() | |
| `updated_at` | DateTime(tz) | onupdate=now() | |

**Relationships (7):**
- `organization` → Organization (FK: organization_id)
- `requests` → [ServiceRequest] (FK: requester_id)
- `assigned_requests` → [ServiceRequest] (FK: assigned_agent_id)
- `bookings` → [Booking]
- `chat_sessions` → [ChatSession]
- `audit_logs` → [AuditLog]
- `tags` → [Tag] (via user_tags junction, secondary)
- `tag_links` → [UserTag] (cascade delete)

### `Organization` (`organizations` table) ⚠️ No endpoints yet

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `name` | String, index | |
| `ministry` | String, nullable | กระทรวง |
| `department` | String, nullable | กรม |
| `division` | String, nullable | สำนัก/กอง |
| `sector_type` | String, nullable | central, provincial, etc. |
| `province` | String, nullable | |
| `district` | String, nullable | |
| `subdistrict` | String, nullable | |

**Relationships:** `users` → [User]

### `ServiceRequest` (`service_requests` table)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `requester_id` | FK→users.id, nullable | |
| `line_user_id` | String, index, nullable | |
| `requester_name` | String, nullable | Full name (backward compat) |
| `phone_number` | String, nullable | |
| `email` | String, nullable | |
| `agency` | String, nullable | หน่วยงาน |
| `province` | String, nullable | |
| `district` | String, nullable | |
| `sub_district` | String, nullable | |
| `prefix` | String, nullable | คำนำหน้า |
| `firstname` | String, nullable | |
| `lastname` | String, nullable | |
| `topic_category` | String, nullable | เรื่องขอรับความช่วยเหลือ |
| `topic_subcategory` | String, nullable | |
| `attachments` | JSONB, nullable | `[{id, url, name}]` |
| `description` | Text, nullable | |
| `category` | String, index, nullable | Legacy |
| `subcategory` | String, nullable | Legacy |
| `location` | JSONB | default={} |
| `details` | JSONB | default={} |
| `status` | Enum(RequestStatus) | default=PENDING, index |
| `priority` | Enum(RequestPriority) | default=MEDIUM, index |
| `due_date` | DateTime(tz), nullable | |
| `completed_at` | DateTime(tz), nullable | |
| `assigned_by_id` | FK→users.id, nullable | |
| `assigned_agent_id` | FK→users.id, nullable | |
| `created_at` | DateTime(tz) | server_default |
| `updated_at` | DateTime(tz) | onupdate |

**Relationships:** `requester`, `assignee`, `assignor` → User (all need `foreign_keys=`)

### `Booking` (`bookings` table) ⚠️ No endpoints yet

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `user_id` | FK→users.id | NOT nullable |
| `service_type` | String | |
| `booking_date` | Date | |
| `booking_time` | Time | |
| `queue_number` | String, index | e.g. "A001" |
| `status` | Enum(BookingStatus) | default=CONFIRMED |
| `created_at` | DateTime(tz) | server_default |

**Relationships:** `user` → User

### `Message` (`messages` table)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `line_user_id` | String, index, nullable | null for broadcast |
| `direction` | Enum(MessageDirection) | NOT nullable |
| `message_type` | String | text, image, sticker, location, flex |
| `content` | Text, nullable | Text or JSON string |
| `payload` | JSONB, nullable | Complex message data |
| `sender_role` | Enum(SenderRole), nullable | USER, BOT, ADMIN |
| `operator_name` | String, nullable | Display name of admin |
| `created_at` | DateTime(tz) | server_default |

### `ChatSession` (`chat_sessions` table)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `line_user_id` | String(50), index | NOT nullable |
| `operator_id` | FK→users.id, nullable | |
| `status` | **String(20)** | "WAITING"/"ACTIVE"/"CLOSED" (NOT DB Enum!) |
| `started_at` | DateTime(tz) | server_default |
| `claimed_at` | DateTime(tz), nullable | When operator claimed |
| `closed_at` | DateTime(tz), nullable | |
| `first_response_at` | DateTime(tz), nullable | SLA FRT tracking |
| `last_activity_at` | DateTime(tz), nullable | Inactivity timeout |
| `message_count` | Integer | default=0 |
| `closed_by` | **String(20)**, nullable | "OPERATOR"/"SYSTEM"/"USER"/"SYSTEM_TIMEOUT" |
| `transfer_count` | Integer | default=0 |
| `transfer_reason` | String(255), nullable | |

**Relationships:** `operator` → User; `csat_responses` → [CsatResponse]

### `Geography` (3 tables: provinces, districts, sub_districts)

```
Province:
  id, name_th, name_en
  districts → [District]

District:
  id, province_id FK→provinces.id, name_th, name_en, code
  province → Province; sub_districts → [SubDistrict]

SubDistrict:
  id, district_id FK→districts.id, name_th, name_en, postal_code, latitude, longitude
  district → District
```

⚠️ **Must be seeded** — tables are created by Alembic but left empty. Geographic data
must be loaded via a seed script or data dump.

### `ReplyObject` (`reply_objects` table)

| Column | Type | Notes |
|---|---|---|
| `object_id` | String | **Primary Key** (not integer!) |
| `name` | String | Display name |
| `reply_type` | Enum(ReplyType) | text, image, flex, etc. |
| `content` | Text, nullable | |
| `payload` | JSONB, nullable | Flex/complex content |
| `is_active` | Boolean | default=True |
| `created_at` | DateTime(tz) | server_default |

**Key:** `object_id` is a string PK (e.g. "welcome_flex") — NOT an integer.

---

## Relationship Map

```
Organization ──────────────── User (organization_id FK)
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ServiceRequest  Booking  ChatSession
              (3 FK to User:  (user FK)  (operator FK)
               requester,
               assigned_by,
               assigned_agent)
                    │
              RequestComment

User ── UserTag (junction) ── Tag
User ── AuditLog (admin FK, nullable)
ChatSession ── CsatResponse (session FK)
IntentCategory ── IntentKeyword
IntentCategory ── IntentResponse
```

---

## `url_utils.py` — Function Reference

```python
from app.utils.url_utils import get_base_url, resolve_media_url, resolve_payload_urls, strip_flex_body

# Get base URL (from settings.SERVER_BASE_URL):
base = get_base_url()
# → "https://your-domain.com" (prod) or "http://localhost:8000" (fallback)

# Resolve single URL:
url = resolve_media_url("/api/v1/media/abc-123")
# → "https://your-domain.com/api/v1/media/abc-123"
# Passthrough if already absolute:
url = resolve_media_url("https://cdn.example.com/image.jpg")  # → unchanged

# Resolve all "url" keys in a Flex payload dict:
resolved_payload = resolve_payload_urls(flex_dict)
# Uses regex: r'"url"\s*:\s*"(/api/[^"]+)"' → prepends base_url
# Only matches relative /api/ paths — absolute URLs are untouched

# Strip text from bubble, keep only hero (image):
image_only = strip_flex_body(flex_dict)
# Works for type="bubble" and type="carousel"
# Keeps: hero, size, styles — removes: body, header, footer
```

---

## JSONB Query Patterns

```python
from sqlalchemy.dialects.postgresql import JSONB

# Containment check (has key=value pair):
stmt = select(ServiceRequest).where(
    ServiceRequest.details.contains({"category": "legal"})
)

# Access nested key as string:
stmt = select(ServiceRequest).where(
    ServiceRequest.details["status"].as_string() == "urgent"
)

# Check if key exists:
stmt = select(ServiceRequest).where(
    ServiceRequest.attachments.isnot(None)
)

# Update a single JSONB key (avoid full replace):
await db.execute(
    update(ServiceRequest)
    .where(ServiceRequest.id == request_id)
    .values(details=ServiceRequest.details.op("||")({"note": "updated"}))
)
```

---

## Known Gaps

| ID | Gap | Location | Severity |
|---|---|---|---|
| GAP-1 | `Booking` model has no router, service, schema, or admin page | `booking.py` | High |
| GAP-2 | `Organization` model has no router, service, schema, or admin page | `organization.py` | High |
| GAP-3 | `SystemSetting` table created via raw SQL in startup — no model in `__init__.py` | `main.py` | Medium |
| GAP-4 | Geography tables empty after migration — no seed script exists | `geography.py` | High |
| GAP-5 | `ChatSession.status` is String not DB Enum — no DB-level constraint on values | `chat_session.py` | Low |
| GAP-6 | `MediaFile` model stores binary in DB (LargeBinary) — no file system or CDN | `media_file.py` | Medium |
| GAP-7 | `Message.payload` JSONB has no documented schema — varies by message_type | `message.py` | Low |
