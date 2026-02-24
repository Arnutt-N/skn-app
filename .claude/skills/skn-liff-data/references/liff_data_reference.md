# LIFF Data Endpoints — Reference

Sources: `endpoints/liff.py`, `endpoints/locations.py`, `endpoints/media.py`,
`models/geography.py`, `models/media_file.py`, `schemas/service_request_liff.py`

---

## Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/liff/service-requests` | ❌ None | Submit LIFF form → create ServiceRequest |
| `GET` | `/locations/provinces` | ❌ None | List all Thai provinces |
| `GET` | `/locations/provinces/{id}/districts` | ❌ None | Districts for a province |
| `GET` | `/locations/districts/{id}/sub-districts` | ❌ None | Sub-districts for a district |
| `POST` | `/media` | ❌ None | Upload file (multipart) → UUID |
| `GET` | `/media/{uuid}` | ❌ None | Serve file by UUID |

All endpoints are public (no JWT required) — consumed directly by LIFF mini-apps.

---

## LIFF Service Request — Field Mapping

**Pydantic schema:** `backend/app/schemas/service_request_liff.py`
**Endpoint:** `backend/app/api/v1/endpoints/liff.py`

| Pydantic input | DB column | Mapping logic |
|---|---|---|
| `line_user_id` | `line_user_id` | Direct |
| `prefix` | `prefix` | Direct |
| `firstname` | `firstname` | Direct |
| `lastname` | `lastname` | Direct |
| `prefix` + `firstname` + `lastname` | `requester_name` | `f"{prefix or ''}{firstname} {lastname}".strip()` |
| `phone_number` | `phone_number` | Direct |
| `email` | `email` | Direct |
| `agency` | `agency` | Direct |
| `province` | `province` | String name (not ID) |
| `district` | `district` | String name (not ID) |
| `sub_district` | `sub_district` | String name (not ID) |
| `topic_category` | `topic_category` | Direct |
| `topic_subcategory` | `topic_subcategory` | Direct |
| `topic_category` or `service_type` | `category` | `topic_category or service_type` |
| `description` | `description` | Direct |
| `attachments` | `attachments` | List of UUID strings |
| _(not in schema)_ | `status` | Always `None` |
| _(not in schema)_ | `priority` | Always `None` |
| _(hardcoded)_ | `details` | `{"source": "LIFF v2"}` |

### ServiceRequestResponse Field Renames (Response → DB)

| Response field | DB column |
|---|---|
| `name` | `requester_name` |
| `phone` | `phone_number` |
| `service_type` | `topic_category or category` |

---

## Location Models

**File:** `backend/app/models/geography.py`

```python
class Province(Base):
    __tablename__ = "provinces"
    id        = Column(Integer, primary_key=True)
    name_th   = Column(String, index=True)
    name_en   = Column(String, nullable=True)

class District(Base):
    __tablename__ = "districts"
    id          = Column(Integer, primary_key=True)
    province_id = Column(Integer, ForeignKey("provinces.id"), index=True)
    name_th     = Column(String, index=True)
    name_en     = Column(String, nullable=True)
    code        = Column(String, nullable=True)

class SubDistrict(Base):
    __tablename__ = "sub_districts"
    id          = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey("districts.id"), index=True)
    name_th     = Column(String, index=True)
    name_en     = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude    = Column(Float, nullable=True)
    longitude   = Column(Float, nullable=True)
```

---

## Location API Response Schemas

**Key: model columns map to UPPERCASE API keys**

```python
class ProvinceOut(BaseModel):
    PROVINCE_ID:      int
    PROVINCE_THAI:    str   # ← name_th
    PROVINCE_ENGLISH: str   # ← name_en

class DistrictOut(BaseModel):
    DISTRICT_ID:      int
    PROVINCE_ID:      int
    DISTRICT_THAI:    str   # ← name_th
    DISTRICT_ENGLISH: str   # ← name_en

class SubDistrictOut(BaseModel):
    SUB_DISTRICT_ID:      int
    DISTRICT_ID:          int
    SUB_DISTRICT_THAI:    str   # ← name_th
    SUB_DISTRICT_ENGLISH: str   # ← name_en
    # postal_code, latitude, longitude NOT returned
```

---

## MediaFile Model

**File:** `backend/app/models/media_file.py` _(inferred)_

```python
class MediaFile(Base):
    __tablename__ = "media_files"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename   = Column(String, nullable=False)
    mime_type  = Column(String, nullable=False)
    data       = Column(LargeBinary, nullable=False)   # raw bytes stored in DB
    size_bytes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## Media Endpoints

### POST `/media` (upload)

```python
# Input: multipart/form-data, field name "file"
# Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440000",  # UUID as string
    "filename": "photo.jpg"
}
```

### GET `/media/{media_id}` (serve)

```python
# Path param: UUID (FastAPI validates format)
# Response: binary Response with media_type set to stored mime_type
# Uses AsyncSessionLocal directly (not Depends(get_db))
```

---

## LIFF Attachment Flow (End-to-End)

```
Step 1 — Upload:
  LIFF frontend  POST /media  multipart file
  Backend        → stores in media_files.data
  Response       → {"id": "uuid-str", "filename": "..."}

Step 2 — Submit form:
  LIFF frontend  POST /liff/service-requests
  Body includes  attachments: ["uuid1", "uuid2"]
  Backend        → ServiceRequest.attachments = ["uuid1", "uuid2"]

Step 3 — Admin views:
  Admin panel    fetches request detail
  Renders images via  GET /media/{uuid}
```

---

## Location Cascade Flow (LIFF Frontend)

```
1. Component mounts → GET /locations/provinces
   → populate Province <select>

2. User picks province (PROVINCE_ID = 1) →
   GET /locations/provinces/1/districts
   → populate District <select>

3. User picks district (DISTRICT_ID = 101) →
   GET /locations/districts/101/sub-districts
   → populate Sub-District <select>

4. On form submit:
   province    = "กรุงเทพมหานคร"   (PROVINCE_THAI string, not PROVINCE_ID)
   district    = "เขตพระนคร"       (DISTRICT_THAI string)
   sub_district = "พระบรมมหาราชวัง" (SUB_DISTRICT_THAI string)
```

---

## Known Gaps Summary

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | Media stored as LargeBinary in PostgreSQL | Medium | Migrate to object storage (S3/R2) |
| GAP-2 | No file type/size validation on upload | Medium | Add allowlist + max size check |
| GAP-3 | Geography tables require manual seeding | High (setup) | Add seed migration or script |
| GAP-4 | Province/district stored as name string, not ID | Low | Add FK columns long-term |
| GAP-5 | Media endpoints have no auth | Low–Medium | Add auth or signed URL if sensitive |

---

## Key Files

| File | Purpose |
|---|---|
| `backend/app/api/v1/endpoints/liff.py` | LIFF service request submission |
| `backend/app/api/v1/endpoints/locations.py` | Province/district/sub-district cascade |
| `backend/app/api/v1/endpoints/media.py` | Binary file upload and serve |
| `backend/app/schemas/service_request_liff.py` | Pydantic input + response schemas |
| `backend/app/models/geography.py` | Province, District, SubDistrict models |
| `backend/app/models/media_file.py` | MediaFile model (UUID PK, LargeBinary data) |
| `frontend/app/liff/service-request/` | LIFF 4-step form frontend |
