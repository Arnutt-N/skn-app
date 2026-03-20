# PR #4 Critical & Important Fixes

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical security issues and Important bugs found in the code review of PR #4 before merge.

**Architecture:** Surgical fixes to existing files — no new files. Backend: add auth guards and input validation. Frontend: add `useAuth()` + `authHeaders` pattern to 7 pages. Service: improve error handling in broadcast.

**Tech Stack:** FastAPI, async SQLAlchemy 2.0, Next.js 16 (React 19), TypeScript

---

## Chunk 1: Backend Critical — Media Auth & Input Validation

### Task 1: Add auth to legacy `POST /media` and `GET /media/{media_id}`

**Files:**
- Modify: `backend/app/api/v1/endpoints/media.py:70-79` (GET endpoint)
- Modify: `backend/app/api/v1/endpoints/media.py:354-372` (POST endpoint)

- [ ] **Step 1: Add auth + size limit to `POST /media`**

In `backend/app/api/v1/endpoints/media.py`, replace lines 354-372:

```python
# Legacy upload — requires auth, 10MB limit
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("/media")
async def upload_media_legacy(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    mime = file.content_type or "application/octet-stream"

    media = MediaFile(
        filename=file.filename or "untitled",
        mime_type=mime,
        data=content,
        size_bytes=len(content),
        category=detect_category(mime),
    )

    db.add(media)
    await db.commit()
    await db.refresh(media)

    return {"id": str(media.id), "filename": media.filename}
```

Note: You'll need to import `User` at the top if not already imported:
```python
from app.models.user import User
```

- [ ] **Step 2: Add auth to `GET /media/{media_id}`**

Replace lines 70-79:

```python
@router.get("/media/{media_id}")
async def get_media(
    media_id: uuid.UUID,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MediaFile).filter(MediaFile.id == media_id))
    media = result.scalar_one_or_none()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return Response(content=media.data, media_type=media.mime_type)
```

Note: This removes the `AsyncSessionLocal()` context manager and uses the standard `get_db` dependency instead, which is the project pattern.

- [ ] **Step 3: Verify**

Run: `cd backend && python -c "import ast; ast.parse(open('app/api/v1/endpoints/media.py').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/endpoints/media.py
git commit -m "fix(security): add auth guards to legacy media endpoints"
```

---

### Task 2: Fix date parsing in `admin_reports.py`

**Files:**
- Modify: `backend/app/api/v1/endpoints/admin_reports.py:92-106`

- [ ] **Step 1: Wrap fromisoformat in try/except**

Replace the `_parse_dates` function (lines 92-106):

```python
def _parse_dates(
    start_date: Optional[str],
    end_date: Optional[str],
    default_days: int = 30,
) -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    try:
        end = datetime.fromisoformat(end_date) if end_date else now
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid end_date format: {end_date}")
    try:
        start = datetime.fromisoformat(start_date) if start_date else end - timedelta(days=default_days)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid start_date format: {start_date}")
    return start, end
```

Ensure `HTTPException` is imported at the top of the file (check — it should be already).

- [ ] **Step 2: Commit**

```bash
git add backend/app/api/v1/endpoints/admin_reports.py
git commit -m "fix(reports): return 422 on invalid date params instead of 500"
```

---

### Task 3: Fix broadcast partial failure handling and schedule validation

**Files:**
- Modify: `backend/app/services/broadcast_service.py:163-219`

- [ ] **Step 1: Add past-date guard to `schedule_broadcast`**

Replace `schedule_broadcast` (lines 209-219):

```python
async def schedule_broadcast(
    self, db: AsyncSession, broadcast: Broadcast, scheduled_at: datetime
) -> Broadcast:
    if broadcast.status != BroadcastStatus.DRAFT:
        raise ValueError(f"Cannot schedule broadcast in status {broadcast.status}")

    now = datetime.now(timezone.utc)
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    if scheduled_at <= now:
        raise ValueError("scheduled_at must be in the future")

    broadcast.status = BroadcastStatus.SCHEDULED
    broadcast.scheduled_at = scheduled_at
    await db.commit()
    await db.refresh(broadcast)
    return broadcast
```

- [ ] **Step 2: Improve multicast error handling in `send_broadcast`**

Replace the try/except block in `send_broadcast` (lines 175-206):

```python
        try:
            if broadcast.target_audience == "all":
                await self.api.broadcast(
                    BroadcastRequest(messages=messages)
                )
                broadcast.status = BroadcastStatus.COMPLETED
                broadcast.sent_at = datetime.now(timezone.utc)
            else:
                user_ids = broadcast.target_filter.get("user_ids", [])
                if user_ids:
                    sent = 0
                    failed = 0
                    for i in range(0, len(user_ids), 500):
                        chunk = user_ids[i : i + 500]
                        try:
                            await self.api.multicast(
                                MulticastRequest(to=chunk, messages=messages)
                            )
                            sent += len(chunk)
                        except Exception as chunk_exc:
                            failed += len(chunk)
                            logger.error("Broadcast %s chunk %d failed: %s", broadcast.id, i // 500, chunk_exc)

                    broadcast.total_recipients = len(user_ids)
                    broadcast.success_count = sent
                    broadcast.failure_count = failed
                    broadcast.sent_at = datetime.now(timezone.utc)
                    broadcast.status = BroadcastStatus.COMPLETED if failed == 0 else BroadcastStatus.FAILED

            logger.info("Broadcast %s finished: success=%s, failed=%s", broadcast.id, broadcast.success_count, broadcast.failure_count)

        except Exception as exc:
            broadcast.status = BroadcastStatus.FAILED
            broadcast.failure_count = (broadcast.failure_count or 0) + 1
            logger.error("Broadcast %s failed: %s", broadcast.id, exc)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/broadcast_service.py
git commit -m "fix(broadcast): validate schedule date, track per-chunk multicast failures"
```

---

### Task 4: Fix friends pagination total and N+1

**Files:**
- Modify: `backend/app/api/v1/endpoints/admin_friends.py:20-38`
- Modify: `backend/app/services/friend_service.py` (get_user_refollow_counts)

- [ ] **Step 1: Fix total count in list_friends**

Replace the `list_friends` endpoint (lines 20-38):

```python
@router.get("")
async def list_friends(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """List all friends with status"""
    friends = await friend_service.list_friends(status, db, skip, limit)

    # Get total count for pagination
    from sqlalchemy import func as sa_func
    from app.models.user import User as UserModel
    count_query = select(sa_func.count(UserModel.id)).where(UserModel.line_user_id.isnot(None))
    if status:
        count_query = count_query.where(UserModel.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Scope refollow counts to current page only
    line_user_ids = [f.line_user_id for f in friends if f.line_user_id]
    refollow_counts = await friend_service.get_user_refollow_counts(db, line_user_ids=line_user_ids)

    friend_list = []
    for friend in friends:
        data = FriendResponse.model_validate(friend).model_dump()
        data["refollow_count"] = refollow_counts.get(friend.line_user_id, 0)
        friend_list.append(data)
    return {
        "friends": friend_list,
        "total": total,
    }
```

- [ ] **Step 2: Scope `get_user_refollow_counts` to specific IDs**

In `backend/app/services/friend_service.py`, find `get_user_refollow_counts` and update its signature to accept an optional list of line_user_ids:

```python
async def get_user_refollow_counts(self, db: AsyncSession, line_user_ids: list[str] | None = None) -> dict[str, int]:
    """Get max refollow count per user, optionally scoped to specific IDs."""
    query = select(
        FriendEvent.line_user_id,
        func.max(FriendEvent.refollow_count).label("max_refollow"),
    ).where(
        FriendEvent.event_type == FriendEventType.REFOLLOW
    ).group_by(FriendEvent.line_user_id)

    if line_user_ids:
        query = query.where(FriendEvent.line_user_id.in_(line_user_ids))

    result = await db.execute(query)
    return {row.line_user_id: row.max_refollow for row in result.all()}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/v1/endpoints/admin_friends.py backend/app/services/friend_service.py
git commit -m "fix(friends): correct pagination total, scope refollow query to current page"
```

---

### Task 5: Fix N+1 in user workload endpoint

**Files:**
- Modify: `backend/app/api/v1/endpoints/admin_users.py:228-257`

- [ ] **Step 1: Replace N+1 loop with single GROUP BY query**

Replace lines 228-257 with:

```python
    result = await db.execute(query)
    users = result.scalars().all()

    # Single GROUP BY query for all users' workload stats
    user_ids = [u.id for u in users]
    if user_ids:
        from sqlalchemy import case
        stats_query = (
            select(
                ServiceRequest.assigned_agent_id,
                func.count(case((ServiceRequest.status == RequestStatus.PENDING, 1))).label("pending"),
                func.count(case((ServiceRequest.status == RequestStatus.IN_PROGRESS, 1))).label("in_progress"),
            )
            .where(ServiceRequest.assigned_agent_id.in_(user_ids))
            .group_by(ServiceRequest.assigned_agent_id)
        )
        stats_result = await db.execute(stats_query)
        stats_map = {row.assigned_agent_id: (row.pending, row.in_progress) for row in stats_result.all()}
    else:
        stats_map = {}

    user_workloads = []
    for user in users:
        pending, in_progress = stats_map.get(user.id, (0, 0))
        user_workloads.append(
            UserWorkload(
                id=user.id,
                display_name=user.display_name or user.username,
                role=user.role,
                active_tasks=pending + in_progress,
                pending_tasks=pending,
                in_progress_tasks=in_progress,
            )
        )

    user_workloads.sort(key=lambda x: x.active_tasks)
    return user_workloads
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/api/v1/endpoints/admin_users.py
git commit -m "perf(users): replace N+1 workload queries with single GROUP BY"
```

---

## Chunk 2: Frontend Critical — Auth Headers for All Admin Pages

### Task 6: Add auth headers to Broadcast pages (3 files)

**Files:**
- Modify: `frontend/app/admin/chatbot/broadcast/page.tsx`
- Modify: `frontend/app/admin/chatbot/broadcast/new/page.tsx`
- Modify: `frontend/app/admin/chatbot/broadcast/[id]/page.tsx`

The pattern to follow (from `frontend/app/admin/users/page.tsx`):

```tsx
// At top of component:
import { useAuth } from '@/contexts/AuthContext';

// Inside component:
const { token } = useAuth();
const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}, [token]);

// In every fetch call, add:
const res = await fetch(url, { headers: authHeaders });
// For POST/PUT/DELETE:
const res = await fetch(url, { method: 'POST', headers: authHeaders, body: JSON.stringify(data) });
```

- [ ] **Step 1: Fix `broadcast/page.tsx`**

Add `import { useAuth } from '@/contexts/AuthContext';` and `import { useMemo } from 'react';` at the top.

Inside the component, add:
```tsx
const { token } = useAuth();
const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
}, [token]);
```

Update the 3 fetch calls at lines 85, 105, 121 to include `headers: authHeaders`:
- Line 85: `fetch(url)` → `fetch(url, { headers: authHeaders })`
- Line 105: `fetch(url, { method: 'DELETE' })` → `fetch(url, { method: 'DELETE', headers: authHeaders })`
- Line 121: `fetch(url, { method: 'POST' })` → `fetch(url, { method: 'POST', headers: authHeaders })`

- [ ] **Step 2: Fix `broadcast/new/page.tsx`**

Same imports. Add `useAuth` + `authHeaders` pattern.

Update all 5 fetch calls (lines 106, 131, 139, 163, 171). For POST calls with body, merge headers:
```tsx
headers: { ...authHeaders, 'Content-Type': 'application/json' },
```

- [ ] **Step 3: Fix `broadcast/[id]/page.tsx`**

Same imports. Add `useAuth` + `authHeaders` pattern.

Update all 4 fetch calls (lines 74, 92, 106, 120):
- GET: `{ headers: authHeaders }`
- POST/DELETE: `{ method: 'POST', headers: authHeaders }`

- [ ] **Step 4: Commit**

```bash
git add frontend/app/admin/chatbot/broadcast/
git commit -m "fix(broadcast): add auth headers to all fetch calls"
```

---

### Task 7: Add auth headers to Settings pages (4 files) + fix delete handler

**Files:**
- Modify: `frontend/app/admin/settings/page.tsx`
- Modify: `frontend/app/admin/settings/telegram/page.tsx`
- Modify: `frontend/app/admin/settings/n8n/page.tsx`
- Modify: `frontend/app/admin/settings/custom/page.tsx`

- [ ] **Step 1: Fix `settings/page.tsx`**

Add `import { useAuth } from '@/contexts/AuthContext';` and `useMemo`.
Add `const { token } = useAuth();` and `authHeaders` pattern.
Update fetch at line 58: `{ headers: authHeaders }`

- [ ] **Step 2: Fix `settings/telegram/page.tsx`**

Add imports. Add `useAuth` + `authHeaders`.
Update 3 fetch calls (lines 49, 69, 94):
- GET: `{ headers: authHeaders }`
- PUT: `{ method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body }`
- POST: `{ method: 'POST', headers: authHeaders }`

- [ ] **Step 3: Fix `settings/n8n/page.tsx`**

Same pattern as telegram. Update 3 fetch calls (lines 49, 72, 97).

- [ ] **Step 4: Fix `settings/custom/page.tsx` — auth headers + delete check**

Add imports. Add `useAuth` + `authHeaders`.
Update 4 fetch calls (lines 64, 122, 146, 163).

**Additionally**, fix the delete handler (lines 142-157) to check response:

```tsx
const handleDelete = async () => {
    if (deleteId === null) return;
    setProcessing('DELETE');
    try {
        const res = await fetch(`${API_BASE}/admin/settings/integrations/${deleteId}`, {
            method: 'DELETE',
            headers: authHeaders,
        });
        if (!res.ok) throw new Error('Delete failed');
        await fetchIntegrations();
    } catch {
        alert('เกิดข้อผิดพลาดในการลบ');
    } finally {
        setProcessing(null);
        setShowDeleteModal(false);
        setDeleteId(null);
    }
};
```

- [ ] **Step 5: Commit**

```bash
git add frontend/app/admin/settings/
git commit -m "fix(settings): add auth headers to all fetch calls, check delete response"
```

---

### Task 8: Fix `perPage` re-render loop in friends/history

**Files:**
- Modify: `frontend/app/admin/friends/history/page.tsx`

- [ ] **Step 1: Move perPage to module scope**

Move the `const perPage = 20;` declaration from inside the component (line 102) to **outside** the component at the module level (above `export default function`).

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/friends/history/page.tsx
git commit -m "fix(friends): move perPage to module scope to prevent re-render loop"
```

---

## Chunk 3: Verification

### Task 9: Run full verification suite

- [ ] **Step 1: TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit 0

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build`
Expected: Exit 0, all 37 routes compile

- [ ] **Step 3: Python syntax check on all modified backend files**

Run: `cd backend && python -c "import ast; [ast.parse(open(f).read()) for f in ['app/api/v1/endpoints/media.py', 'app/api/v1/endpoints/admin_reports.py', 'app/api/v1/endpoints/admin_friends.py', 'app/api/v1/endpoints/admin_users.py', 'app/services/broadcast_service.py']]; print('All OK')"`
Expected: `All OK`

- [ ] **Step 4: Push**

```bash
git push origin feat/ui-workflow-audit
```
