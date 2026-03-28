# Backend Review: Admin Full-Stack Enhancement

> **Status:** Recommended Updates based on the current JskApp backend (FastAPI, SQLAlchemy async, PostgreSQL, existing admin APIs)
> **Reference File:** `.claude/plan/admin-fullstack-enhancement.md`

## Overview

The plan is directionally good, but several backend items assume data structures or missing capabilities that do not match the current codebase. The main risk is not implementation difficulty by itself, but implementing the plan literally and ending up with duplicated APIs, incomplete migrations, or features that appear to work while returning incorrect data.

The most important corrections are:

1. Align new request creation with the current `ServiceRequest.attachments` JSONB design and UUID-based media model.
2. Treat message soft-delete as a cross-cutting change that updates every read path, not just the delete endpoint and model.
3. Do not promise block/unblock timeline analytics until the webhook and friend event pipeline actually capture those events.
4. Extend existing live chat, export, and reporting APIs where possible instead of creating overlapping backend surfaces.

---

## Architectural Recommendations

### 1. Reuse Existing Backend Surfaces Instead of Forking Them

The backend already has substantial coverage for the proposed admin features:

- `admin_live_chat.py` already exposes conversation listing, detail, paginated messages, and message search.
- `admin_export.py` already exposes per-conversation CSV and PDF export.
- `admin_reports.py` already exposes structured report data for overview, service requests, messages, operators, and followers.
- `admin_friends.py` and `friend_service.py` already expose friend history and refollow counts.

**Recommendation:** Prefer extending these existing modules rather than introducing parallel modules such as a new `admin_chat_histories.py` unless the new feature genuinely requires a separate ownership boundary.

**Why this matters:**

- Fewer duplicated authorization rules
- Fewer duplicated query implementations
- Lower maintenance cost
- Lower test surface expansion

---

## Phase-Specific Corrections

### Phase 1.2: File Metadata Update

**Current Plan:** Add `PATCH /admin/media/{media_id}` with `filename`, `category`, and `description`.

**Correction:**

- `media_id` should be a UUID, not an integer.
- `MediaFile` currently has no `description` column, so that field cannot be persisted without a migration and model/schema updates.

**Recommendation:**

- Scope the first version of the endpoint to `filename` and `category` only.
- If `description` is required, explicitly add:
  - model field
  - migration
  - serializer update
  - tests

**Suggested API contract:**

```python
class MediaUpdateRequest(BaseModel):
    filename: str | None = None
    category: FileCategory | None = None
```

This is enough to support the stated UX without inventing unsupported storage.

---

### Phase 2.1: Admin Manual Create Request

**Current Plan:** Add admin POST endpoint with `source` and `attachment_ids: list[int]`.

**Corrections:**

1. `ServiceRequest.attachments` is currently JSONB, not a relational join table.
2. Media IDs are UUIDs, not integers.
3. The only current request creation flow is the LIFF endpoint, and it already stores source-like context inside `details`.

**Recommendation:**

- Add a proper `source` column if reporting/filtering by source is important. That part is reasonable.
- Do not use `attachment_ids: list[int]`.
- Either:
  - accept `attachment_ids: list[UUID]` and resolve them into the existing JSONB attachment format before save, or
  - accept full attachment descriptors directly and store them as JSONB.

**Preferred pragmatic approach:**

- Keep `attachments` as JSONB for now.
- On admin create, resolve media UUIDs into stored attachment objects such as:

```json
[
  {
    "id": "uuid",
    "filename": "document.pdf",
    "mime_type": "application/pdf",
    "url": "/api/v1/media/{uuid}"
  }
]
```

This avoids introducing a larger relational attachment system just for one form flow.

**Additional recommendation:**

- Reuse the current LIFF field mapping logic where possible.
- Add tests for admin creation with:
  - no attachments
  - valid media UUIDs
  - invalid media UUIDs
  - explicit non-LIFF source values

---

### Phase 3.1: Chat Histories and Soft Delete

**Current Plan:** Create a new chat history module, add message soft-delete fields, and add delete/search/export endpoints.

**Corrections:**

- Search already exists in `admin_live_chat.py`.
- Conversation list/detail/messages already exist in `admin_live_chat.py`.
- Per-conversation export already exists in `admin_export.py`.
- Soft delete is not safe as an isolated model change because many existing readers query `Message` directly.

**Recommendation:**

- Extend the current live chat and export modules instead of creating a parallel chat-history backend.
- If soft delete is required, implement it as a coordinated backend change across:
  - unread counts
  - paginated message history
  - search
  - report counts
  - CSV export
  - PDF export

**Minimum required follow-up if soft delete is added:**

```python
Message.is_deleted == False
```

must be applied consistently across all read queries, or the feature will be logically broken.

**Recommended scope split:**

1. Phase 3A:
   - Add admin UI menu and pages
   - Reuse existing conversation list/detail/search/export endpoints
2. Phase 3B:
   - Add optional chat-history stats endpoint
   - Add soft-delete only after every read path is updated and tested

This de-risks the feature considerably.

---

### Phase 4.1: Friend Histories Timeline

**Current Plan:** Show FOLLOW, UNFOLLOW, BLOCK, REFOLLOW with derived durations and risk indicators.

**Correction:**

The current backend does not actually capture BLOCK and UNBLOCK events in the webhook pipeline. It records follow/unfollow and refollow logic, but block duration analytics require real block/unblock event capture first.

**Recommendation:**

- Keep the initial enhancement grounded in the current event model:
  - FOLLOW
  - UNFOLLOW
  - REFOLLOW
  - source
  - refollow_count
- Do not advertise block duration or block/refollow instability scoring until ingestion exists.

**Safer incremental plan:**

1. Enhance `/admin/friends/{line_user_id}/events` to return:
   - `refollow_count`
   - previous/next event timestamps
   - duration since previous event where derivable
2. Add `/timeline` only if the frontend needs an aggregate payload that cannot be assembled client-side
3. Add block-specific analytics later, after the event source is real

This keeps the backend honest and avoids reporting synthetic behavior as fact.

---

### Phase 5.1: Reports PDF Export

**Current Plan:** Add `reportlab` and a new PDF service for admin reports.

**Correction:**

- `reportlab` is already present in `backend/requirements.txt`.
- PDF export already exists for conversation exports in `admin_export.py`.

**Recommendation:**

- Build report PDF generation on top of the existing report data endpoints in `admin_reports.py`.
- Extract shared PDF helpers only if there is repeated logic worth centralizing.
- Do not add `matplotlib` unless charts are truly required in the first version.

**Preferred implementation order:**

1. Add a simple PDF export endpoint for report summaries
2. Reuse data already produced by `admin_reports.py`
3. Add charts later only if the first PDF version proves insufficient

This keeps dependencies and rendering complexity under control.

---

### Phase 6.1: Live Chat Create and Archive

**Current Plan:** Add POST create and DELETE archive with `is_archived`, `archived_at`, `archived_by`.

**Recommendation:**

The feature is reasonable, but it should fit the current live chat ownership and audit rules:

- admin-initiated session creation should set `chat_mode = HUMAN`
- the creating admin should become the session owner immediately if this is intended as an active operator-initiated chat
- optional initial message must go through the same send path used by current operator messages where possible
- archive semantics must be defined clearly against current `status` values: `WAITING`, `ACTIVE`, `CLOSED`

**Important design choice:**

Decide whether archive means:

- a separate lifecycle flag on already closed sessions, or
- a user-facing operation that closes an active session and hides it from default views

Those are not the same behavior. The plan should state which one is intended before migration work starts.

**Recommendation:** Close first, archive second. Avoid combining archival semantics with active-session logic in one opaque step.

---

## Testing Recommendations

Each backend phase should include tests at the same time as implementation:

- Phase 1.2: media PATCH success, invalid UUID, invalid category
- Phase 2.1: admin request creation with source and attachment resolution
- Phase 3: message soft-delete visibility rules across list/detail/search/export
- Phase 4: friend timeline serialization using real stored event shapes
- Phase 5: report PDF response headers and basic payload generation
- Phase 6: session creation ownership, archive authorization, archived session visibility

The repo already has tests around media, friends, live chat, and export endpoints, so the most efficient path is to extend those test files instead of creating isolated new suites for overlapping behavior.

---

## Recommended Plan Updates

### Update Phase 2

- Change `attachment_ids: list[int]` to UUID-aware attachment handling
- Explicitly define how media metadata is embedded into `ServiceRequest.attachments`
- Add tests for attachment resolution and source persistence

### Update Phase 3

- Reuse `admin_live_chat.py` and `admin_export.py`
- Treat soft delete as a full read/write behavior change, not just a model migration
- Add chat-history stats only if the UI genuinely needs new aggregated data

### Update Phase 4

- Limit first release to existing friend event truth: FOLLOW, UNFOLLOW, REFOLLOW
- Defer block-specific analytics until event ingestion exists

### Update Phase 5

- Remove dependency task for `reportlab`
- Start with simple summary PDFs using existing report queries
- Add chart rendering only if there is a real product requirement for it

### Update Phase 6

- Clarify archive semantics before adding migration fields
- Reuse current live chat ownership and audit patterns
- Ensure session creation and archive flows are covered by tests

---

## Conclusion

The plan should stay ambitious on the frontend, but the backend should be tightened around the current data model and existing API surface. The safest strategy is to extend what already exists, avoid parallel modules unless truly necessary, and only introduce migrations when the full read/write impact is accounted for in code and tests.
