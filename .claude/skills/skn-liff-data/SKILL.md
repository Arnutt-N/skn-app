---
name: skn-liff-data
description: >
  Manages the LIFF-facing backend data endpoints in SKN App — service request submission,
  Thai province/district/sub-district location cascade, and media file upload/serve.
  Use when asked to "LIFF endpoint", "LIFF form submission", "service request from LIFF",
  "province list", "district cascade", "sub-district", "upload attachment", "serve media",
  "LIFF ส่งฟอร์ม", "ดึง จังหวัด/อำเภอ/ตำบล", "อัปโหลดไฟล์จาก LIFF",
  "field mapping ไม่ตรง", "liff.py", "locations.py", "media.py".
  Do NOT use for admin service request management (skn-service-request), LIFF token
  verification (skn-auth-security), or LINE webhook processing (skn-webhook-handler).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: FastAPI backend, PostgreSQL (geography tables seeded), no external storage.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: backend
  tags: [liff, locations, media, service-request, geography]
  related-skills:
    - skn-service-request
    - skn-auth-security
    - skn-migration-helper
  documentation: ./references/liff_data_reference.md
---

# skn-liff-data

Three public (no-auth) backend endpoints consumed directly by LIFF mini-apps:

1. **LIFF Service Request** (`liff.py`) — citizens submit the 4-step LIFF form;
   field names differ between Pydantic schema and DB model.
2. **Locations** (`locations.py`) — Thailand province → district → sub-district
   cascade, used to populate dropdowns in the LIFF form.
3. **Media** (`media.py`) — binary file upload and serve; data is stored in
   PostgreSQL (not a file system), identified by UUID.

---

## CRITICAL: Project-Specific Rules

1. **All three endpoints have NO authentication** — `liff.py`, `locations.py`, and
   `media.py` use only `Depends(get_db)` or `AsyncSessionLocal()`. There is no
   `get_current_user` or `get_current_admin` dependency. This is intentional —
   LIFF mini-apps call these endpoints without an admin JWT.

2. **LIFF endpoint field names differ from the DB model** — the Pydantic schema
   (`ServiceRequestCreate` in `schemas/service_request_liff.py`) uses `name`,
   `phone`, `service_type` as legacy aliases, while the `ServiceRequest` DB model
   uses `requester_name`, `phone_number`, `category`. The endpoint does the mapping
   manually. Never assume field names match.

3. **Full name is constructed from prefix + firstname + lastname** — the endpoint
   builds `requester_name` as:
   ```python
   full_name = f"{request.prefix or ''}{request.firstname} {request.lastname}".strip()
   ```
   `request.name` is only used as a fallback if `full_name` is empty.

4. **`status=None` and `priority=None` on LIFF create** — citizens never set a
   status or priority. The admin assigns these later. Stats queries must guard with
   `(status == PENDING) | status.is_(None)`. See `skn-service-request` for details.

5. **Location API returns UPPERCASE key names** — response keys are
   `PROVINCE_ID`, `PROVINCE_THAI`, `PROVINCE_ENGLISH` (not `id`, `name_th`, `name_en`).
   This is the format the LIFF frontend expects. Do not change these key names.

6. **Media data is stored in PostgreSQL as LargeBinary** — `MediaFile.data` is a
   `LargeBinary` column. There is no S3, filesystem, or CDN. Max practical size is
   limited by PostgreSQL row size. For large files this is a performance concern.

7. **Media UUID is returned as a string** — `GET /media/{media_id}` takes a
   `uuid.UUID` path param; `POST /media` returns `{"id": str(media.id), ...}`.
   The frontend must store the UUID string and use it to build the media URL.

8. **`GET /media/{media_id}` uses `AsyncSessionLocal` directly** — not the
   `Depends(get_db)` pattern. This is an existing inconsistency. Do not add
   `Depends(get_db)` here without also removing the `AsyncSessionLocal` block.

9. **Geography models use `name_th`/`name_en` internally but the API response
   remaps to UPPERCASE keys** — the `Province`, `District`, `SubDistrict` models
   have columns `id`, `name_th`, `name_en`. The endpoint constructs dicts manually
   to produce the `PROVINCE_ID`/`PROVINCE_THAI`/`PROVINCE_ENGLISH` format.

10. **Geography tables must be seeded** — `provinces`, `districts`, `sub_districts`
    tables are empty after a fresh migration. They require a data seed (CSV import
    or SQL dump). Without seeding, all location endpoints return empty lists.

---

## Context7 Docs

| Library | Resolve Name | Key Topics |
|---|---|---|
| FastAPI | `"fastapi"` | UploadFile, File, Response, StreamingResponse |
| SQLAlchemy | `"sqlalchemy"` | UUID type, LargeBinary, async session |
| Pydantic | `"pydantic"` | field aliases, model_dump, from_attributes |

---

## Step 1 — LIFF Service Request Endpoint

**File:** `backend/app/api/v1/endpoints/liff.py`
**Registered at:** `api.py` → `prefix="/liff", tags=["liff"]`

### Endpoint

```
POST /liff/service-requests
Body: ServiceRequestCreate (from schemas/service_request_liff.py)
Response: ServiceRequestResponse (201 Created)
Auth: None
```

### Field Mapping (Pydantic → DB Model)

| Pydantic field | DB column | Notes |
|---|---|---|
| `line_user_id` | `line_user_id` | Direct |
| `prefix` + `firstname` + `lastname` | `requester_name` | Concatenated: `f"{prefix or ''}{firstname} {lastname}".strip()` |
| `prefix` | `prefix` | Also stored separately |
| `firstname` | `firstname` | Also stored separately |
| `lastname` | `lastname` | Also stored separately |
| `phone_number` | `phone_number` | Direct |
| `email` | `email` | Direct |
| `agency` | `agency` | Direct |
| `province` | `province` | Direct (string name, not ID) |
| `district` | `district` | Direct (string name, not ID) |
| `sub_district` | `sub_district` | Direct (string name, not ID) |
| `topic_category` | `topic_category` | Direct |
| `topic_subcategory` | `topic_subcategory` | Direct |
| `topic_category` or `service_type` | `category` | Legacy compat: `category = request.topic_category or request.service_type` |
| `description` | `description` | Direct |
| `attachments` | `attachments` | Direct (list of media UUIDs) |
| — | `status` | Always `None` on LIFF create |
| — | `priority` | Always `None` on LIFF create |
| — | `details` | Always `{"source": "LIFF v2"}` |

### Response Schema (`ServiceRequestResponse`)

```python
# Fields returned do NOT all match DB column names
ServiceRequestResponse(
    id=db_obj.id,
    line_user_id=db_obj.line_user_id,
    created_at=db_obj.created_at,
    status=db_obj.status.value if hasattr(db_obj.status, 'value') else db_obj.status,
    priority=db_obj.priority.value if hasattr(db_obj.priority, 'value') else db_obj.priority,
    name=db_obj.requester_name,          # renamed: requester_name → name
    phone=db_obj.phone_number,           # renamed: phone_number → phone
    service_type=db_obj.topic_category or db_obj.category,
    # Direct fields:
    prefix, firstname, lastname, email,
    agency, province, district, sub_district,
    topic_category, topic_subcategory, description,
    attachments=db_obj.attachments or []
)
```

---

## Step 2 — Location Cascade Endpoints

**File:** `backend/app/api/v1/endpoints/locations.py`
**Registered at:** `api.py` → `prefix="/locations", tags=["locations"]`

### Three Endpoints (No Auth)

```python
# 1. GET /locations/provinces
# → List[ProvinceOut]
# → [{PROVINCE_ID, PROVINCE_THAI, PROVINCE_ENGLISH}]
# Ordered by Province.name_th (Thai alphabetical)

# 2. GET /locations/provinces/{province_id}/districts
# → List[DistrictOut]
# → [{DISTRICT_ID, PROVINCE_ID, DISTRICT_THAI, DISTRICT_ENGLISH}]
# Filtered by District.province_id, ordered by name_th

# 3. GET /locations/districts/{district_id}/sub-districts
# → List[SubDistrictOut]
# → [{SUB_DISTRICT_ID, DISTRICT_ID, SUB_DISTRICT_THAI, SUB_DISTRICT_ENGLISH}]
# Filtered by SubDistrict.district_id, ordered by name_th
```

### Key: Response Keys Are UPPERCASE

The endpoint manually builds dicts — DB model column names do NOT match API keys:

```python
# Province model:  id, name_th, name_en
# API response:    PROVINCE_ID, PROVINCE_THAI, PROVINCE_ENGLISH

# District model:  id, province_id, name_th, name_en, code
# API response:    DISTRICT_ID, PROVINCE_ID, DISTRICT_THAI, DISTRICT_ENGLISH

# SubDistrict model: id, district_id, name_th, name_en, postal_code, latitude, longitude
# API response:      SUB_DISTRICT_ID, DISTRICT_ID, SUB_DISTRICT_THAI, SUB_DISTRICT_ENGLISH
# Note: postal_code, latitude, longitude NOT included in API response
```

### LIFF Form Cascade Flow

```
User selects province   → GET /locations/provinces           → populate province dropdown
User selects district   → GET /locations/provinces/{id}/districts  → populate district dropdown
User selects tambon     → GET /locations/districts/{id}/sub-districts → populate sub-district dropdown
```

**Important:** Province, district, and sub-district are stored in `ServiceRequest` as
**string names** (`province="กรุงเทพมหานคร"`), not IDs. The frontend submits the name,
not the ID.

### Geography Models

```python
class Province(Base):
    __tablename__ = "provinces"
    id = Column(Integer, primary_key=True)
    name_th = Column(String, index=True)
    name_en = Column(String, nullable=True)
    districts = relationship("District", back_populates="province")

class District(Base):
    __tablename__ = "districts"
    id = Column(Integer, primary_key=True)
    province_id = Column(Integer, ForeignKey("provinces.id"), index=True)
    name_th = Column(String, index=True)
    name_en = Column(String, nullable=True)
    code = Column(String, nullable=True)

class SubDistrict(Base):
    __tablename__ = "sub_districts"
    id = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    name_th = Column(String, index=True)
    name_en = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
```

### Seeding Geography Data

Tables are empty after migration. Must seed before use:

```bash
# Option A: SQL dump
cd backend
psql $DATABASE_URL < seeds/thailand_geography.sql

# Option B: Python seed script
python scripts/seed_geography.py
```

---

## Step 3 — Media Upload and Serve

**File:** `backend/app/api/v1/endpoints/media.py`
**Registered at:** `api.py` → `prefix="" (no prefix), tags=["media"]`
(Routes are `/media` and `/media/{id}` at root level)

### Upload

```python
# POST /media
# Content-Type: multipart/form-data
# Field: file (UploadFile)
# Response: {"id": "uuid-string", "filename": "photo.jpg"}
# Auth: None

media = MediaFile(
    filename=file.filename,
    mime_type=file.content_type,
    data=content,           # raw bytes stored in DB (LargeBinary)
    size_bytes=len(content)
)
db.add(media)
await db.commit()
await db.refresh(media)
return {"id": str(media.id), "filename": media.filename}
```

### Serve

```python
# GET /media/{media_id}
# media_id: UUID (path param, FastAPI validates format)
# Response: binary file with correct Content-Type
# Auth: None

# NOTE: uses AsyncSessionLocal directly, not Depends(get_db)
async with AsyncSessionLocal() as db:
    result = await db.execute(select(MediaFile).filter(MediaFile.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(404, "Media not found")
    return Response(content=media.data, media_type=media.mime_type)
```

### MediaFile Model

```python
class MediaFile(Base):
    __tablename__ = "media_files"
    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename  = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    data      = Column(LargeBinary, nullable=False)   # raw bytes in DB
    size_bytes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### LIFF Attachment Flow

```
1. User selects photo in LIFF form step 4
2. Frontend: POST /media  →  {"id": "abc-uuid", "filename": "photo.jpg"}
3. Frontend stores UUID in form state
4. On submit: POST /liff/service-requests with attachments: ["abc-uuid", ...]
5. Admin: GET /media/abc-uuid  →  binary bytes served with correct MIME type
```

---

## Step 4 — Extend LIFF Form with New Field

If adding a new field to the LIFF service request:

**4a — Update Pydantic schema** (`schemas/service_request_liff.py`):
```python
class ServiceRequestCreate(BaseModel):
    # ... existing fields ...
    new_field: Optional[str] = None   # add here
```

**4b — Add to DB model** (`models/service_request.py`):
```python
new_field = Column(String, nullable=True)
```

**4c — Map in endpoint** (`liff.py`):
```python
db_obj = ServiceRequest(
    # ... existing mapping ...
    new_field=request.new_field,   # add here
)
```

**4d — Include in response schema** and endpoint response constructor.

**4e — Run Alembic migration** (see `skn-migration-helper`).

---

## Known Gaps

### GAP-1: Media stored as LargeBinary in PostgreSQL
Storing binary data in the DB is fine for small files but causes bloat and slow
queries for large attachments.
**Fix (long-term):** Migrate to object storage (S3, Cloudflare R2, MinIO). Store
the URL in `MediaFile.url` instead of raw bytes in `MediaFile.data`.

### GAP-2: No file size or type validation on upload
`POST /media` accepts any file of any size and MIME type.
**Fix:** Add file type allowlist and max size check:
```python
MAX_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
if file.content_type not in ALLOWED_TYPES:
    raise HTTPException(400, "File type not allowed")
if len(content) > MAX_SIZE:
    raise HTTPException(413, "File too large")
```

### GAP-3: Geography tables require manual seeding
`provinces`, `districts`, `sub_districts` are empty after migration.
**Fix:** Add a seed migration or seed script. The data is standard Thai admin
divisions available from official sources.

### GAP-4: Province/district stored as name string, not ID
`ServiceRequest.province` stores `"กรุงเทพมหานคร"` not `1`. If province names
change, old records become inconsistent.
**Fix (long-term):** Add `province_id`, `district_id`, `sub_district_id` FK columns.

### GAP-5: `GET /media/{id}` does not verify requester is authenticated
Any user who guesses a UUID can download the file.
**Fix:** Add auth or signed URL expiry if attachments contain sensitive data.

---

## Common Issues

### `GET /locations/provinces` returns empty list
**Cause:** Geography tables not seeded.
**Fix:** Run the geography seed SQL or Python script. Check `SELECT COUNT(*) FROM provinces`.

### LIFF form submits but some fields are null in DB
**Cause:** Field name mismatch — Pydantic field name differs from DB column, and
the endpoint mapping in `liff.py` does not include it.
**Fix:** Check the field mapping table in Step 1. Add the missing field to the
`ServiceRequest(...)` constructor in `liff.py`.

### `POST /media` works but `GET /media/{id}` returns 404
**Cause:** UUID format mismatch — frontend may pass the UUID without hyphens or
with different casing.
**Fix:** Always use the `id` value returned by `POST /media` verbatim (hyphenated
UUID string). FastAPI validates UUID format automatically.

### `ServiceRequestResponse` returns `null` for `status` or `priority`
**Cause:** Both are `None` on LIFF create. This is expected.
**Fix:** Do not add a default status in the LIFF endpoint — admin assigns status
via the admin panel. Handle `null` in the frontend.

---

## Quality Checklist

Before finishing, verify:
- [ ] `status=None` and `priority=None` on all LIFF-created service requests
- [ ] `requester_name` built from `f"{prefix or ''}{firstname} {lastname}".strip()`
- [ ] `category = topic_category or service_type` (legacy compat)
- [ ] Location response keys are UPPERCASE (`PROVINCE_ID`, not `province_id`)
- [ ] Geography tables seeded before testing location endpoints
- [ ] Media UUID returned as string (`str(media.id)`)
- [ ] No auth on LIFF, locations, or media endpoints (public)
- [ ] New LIFF fields added to schema, DB model, endpoint mapping, AND response schema
