---
name: skn-chatbot-frontend
description: >
  Extends, modifies, or debugs the admin chatbot frontend in SKN App — the pages
  for managing intent categories, keywords, responses, and reply objects. Use when
  asked to "add intent category", "edit keyword in chatbot", "add response type",
  "fix reply object form", "modify auto-replies page", "เพิ่ม category ของ chatbot",
  "แก้ไข keyword ใน intent", "เพิ่ม response type", "แก้ reply object",
  "หน้า auto-replies admin". Do NOT use for backend intent matching or webhook
  pipeline (skn-intent-manager, skn-webhook-handler), or reply object backend
  (skn-reply-auto).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React, TypeScript, Tailwind CSS v4, Lucide icons.
  Admin pages at /admin/auto-replies, /admin/auto-replies/[id], /admin/reply-objects.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [admin, chatbot, intent, reply-objects, frontend]
  related-skills:
    - skn-intent-manager
    - skn-reply-auto
    - skn-admin-component
    - skn-webhook-handler
  documentation: ./references/chatbot_frontend_reference.md
---

# skn-chatbot-frontend

The admin chatbot frontend covers three pages: the intent categories list, the category
detail page (with keywords and responses), and the reply objects management page. These
pages form the admin UI for configuring the SKN App chatbot behavior.

---

## CRITICAL: Project-Specific Rules

1. **`/admin/auto-replies/*` manages Intent Categories — NOT auto-reply rules** —
   The URL path `/admin/auto-replies` is misleading. These pages manage `IntentCategory`
   objects (categories of keywords that trigger bot responses). The backend auto-reply
   rules (`skn-reply-auto`) are separate. Never confuse the two.
   ```
   /admin/auto-replies       → IntentCategory list (GET /admin/intents/categories)
   /admin/auto-replies/[id]  → IntentCategory detail (keywords + responses)
   /admin/reply-objects      → ReplyObject CRUD (GET/POST/PUT/DELETE /admin/reply-objects)
   ```

2. **`?mode=edit` URL param controls `isEditing` state on detail page** — The category
   detail page reads `searchParams.get('mode') === 'edit'` to initialize `isEditing`.
   The list page links with `?mode=edit` to open the detail page directly in edit mode:
   ```ts
   // Detail page init:
   const [isEditing, setIsEditing] = useState(searchParams.get('mode') === 'edit')
   // List page navigation (edit icon):
   router.push(`/admin/auto-replies/${cat.id}?mode=edit`)
   // List page navigation (view icon):
   router.push(`/admin/auto-replies/${cat.id}`)
   ```

3. **Response payload is only JSON-parsed for `flex` and `template` types** — Other
   reply types (`text`, `image`, `sticker`, `video`) use `payload: null`. Parsing
   always happens at submit time, never on textarea change:
   ```ts
   const payload = (formData.reply_type === 'flex' || formData.reply_type === 'template')
     ? JSON.parse(formData.payload)
     : null
   ```
   If `JSON.parse` fails, set `payloadError` and abort submit. Clear `payloadError`
   on every textarea change — never leave a stale error.

4. **`payloadError` state pattern** — Track JSON validation failures for the payload
   textarea in the response form. Always clear on input change:
   ```ts
   const [payloadError, setPayloadError] = useState('')
   // On payload textarea change:
   onChange={(e) => {
     setResponseForm(prev => ({...prev, payload: e.target.value}))
     setPayloadError('')   // clear on every change
   }}
   // On submit:
   try {
     payload = JSON.parse(formData.payload)
   } catch {
     setPayloadError('Invalid JSON format')
     return   // abort submit
   }
   ```

5. **Reply objects use `object_id` (string) as the API path key — not integer `id`** —
   The `PUT` and `DELETE` endpoints use the string `object_id` field as the path
   parameter. The numeric `id` is never used in API calls:
   ```ts
   // editingId stores object_id (string), NOT numeric id:
   const [editingId, setEditingId] = useState<string | null>(null)
   // On edit click:
   setEditingId(obj.object_id)   // 'welcome_flex', 'service_menu', etc.
   // API calls:
   PUT    /admin/reply-objects/${editingId}     // NOT /admin/reply-objects/${obj.id}
   DELETE /admin/reply-objects/${obj.object_id} // NOT /admin/reply-objects/${obj.id}
   ```

6. **`object_id` field is disabled during edit** — The `object_id` field in the reply
   object form is disabled (read-only) when editing an existing record. It can only be
   set during creation:
   ```tsx
   <input
     disabled={!!editingId}
     value={formData.object_id}
   />
   ```

7. **Keyword form includes `category_id` from URL params — not a visible field** —
   When submitting a new keyword, `category_id` comes from `params.id` (the route
   parameter), not from a form input. Always include it in POST/PUT bodies:
   ```ts
   // Keyword POST body:
   { keyword: formData.keyword, match_type: formData.match_type, category_id: params.id }
   ```

8. **Keywords use radio buttons for `match_type` — not a `<select>`** — The keyword
   form renders `MATCH_TYPES` as a horizontal row of radio button labels, not a
   dropdown. The constant is:
   ```ts
   const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex']
   ```

9. **Reply object payload stored as JSON string in form state** — The form state holds
   `payload` as a raw string (user types JSON). It is only `JSON.parse()`d on submit.
   When loading an edit, use `JSON.stringify(obj.payload, null, 2)` to populate the
   textarea:
   ```ts
   setFormData({
     ...obj,
     payload: obj.payload ? JSON.stringify(obj.payload, null, 2) : ''
   })
   ```

10. **`keywords_preview` is display-only — not a full keyword list** — The list page
    `IntentCategory` includes `keywords_preview: string[]` (first 3 keywords). To get
    the full keyword list, navigate to the detail page. Never try to edit keywords from
    the list page preview.

---

## File Structure

```
frontend/app/admin/
├── auto-replies/
│   ├── page.tsx        — Intent categories list (248 lines): CRUD + is_active toggle
│   └── [id]/
│       └── page.tsx    — Category detail (582 lines): keywords + responses management
└── reply-objects/
    └── page.tsx        — Reply objects CRUD (290 lines): card grid, object_id as key
```

---

## Step 1 — Add a New `match_type` for Keywords

All match types are in the `MATCH_TYPES` constant at the top of `auto-replies/[id]/page.tsx`:

**1a — Add to constant:**
```ts
const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex', 'fuzzy']
```

**1b — No UI change needed** — the radio buttons render from `MATCH_TYPES.map()`.

**1c — Update `IntentKeyword` interface if the value is new:**
```ts
interface IntentKeyword {
  id: number;
  keyword: string;
  match_type: 'exact' | 'contains' | 'starts_with' | 'regex' | 'fuzzy';
}
```

**1d — Backend** — Add to the `MatchType` enum in `backend/app/models/intent.py`
and run an Alembic `ALTER TYPE` migration (see `skn-migration-helper`).

---

## Step 2 — Add a New `reply_type` for Responses

Reply types control which form fields are shown and whether payload is JSON-parsed.

**2a — Add to constant:**
```ts
const REPLY_TYPES = ['text', 'flex', 'image', 'sticker', 'video', 'audio']
```

**2b — Determine if the new type needs a JSON payload** — If yes, add to the
condition that enables `JSON.parse`:
```ts
const needsPayload = ['flex', 'template', 'audio'].includes(formData.reply_type)
const payload = needsPayload ? JSON.parse(formData.payload) : null
```

**2c — Add conditional UI in the response form:**
```tsx
{formData.reply_type === 'audio' && (
  <div>
    <label>Audio URL</label>
    <input value={formData.audio_url || ''} onChange={...} />
  </div>
)}
```

**2d — Add to `IntentResponse` interface if adding new fields.**

---

## Step 3 — Add a New `object_type` for Reply Objects

**3a — Add to constant in `reply-objects/page.tsx`:**
```ts
const OBJECT_TYPES = ['text', 'flex', 'image', 'sticker', 'video', 'audio', 'location', 'carousel']
```

**3b — No UI change needed** — `<select>` renders from `OBJECT_TYPES.map()`.

**3c — Add to `ReplyObject` interface if needed.**

---

## Step 4 — Add a Column or Field to the Categories List

**4a — Add to `IntentCategory` interface:**
```ts
interface IntentCategory {
  // ...existing
  new_field?: string;
}
```

**4b — Add to the table row in `auto-replies/page.tsx`:**
```tsx
<td className="px-6 py-4 text-sm text-gray-600">
  {cat.new_field || '-'}
</td>
```

**4c — Add column header** — follow the existing `<th>` pattern.

---

## Common Issues

### Category keywords show empty in list page
**Cause:** `keywords_preview` is only the first 3 keywords from the API response.
**Fix:** Navigate to the detail page (`/admin/auto-replies/{id}`) to see all keywords.
The list page only shows a preview badge, not the full list.

### Response form clears on type change
**Behavior:** Changing `reply_type` resets `text_content` and `payload` fields in the
form — this is intentional to prevent leftover data from a previous type.
**Fix:** This is by design. No fix needed.

### Reply object PUT returns 404
**Cause:** Using the numeric `obj.id` instead of the string `obj.object_id` in the
API path.
**Fix:** Verify `editingId = obj.object_id` (e.g. `'welcome_flex'`), not `obj.id`
(numeric). The endpoint is `PUT /admin/reply-objects/{object_id}`.

### JSON payload shows validation error but looks correct
**Cause:** The `payloadError` from a previous failed submit is still displayed even
though the user has fixed the JSON.
**Fix:** Ensure `setPayloadError('')` is called on every payload textarea `onChange`.
The state is NOT automatically cleared when the form re-renders.

### Category saved but keywords are not persisted
**Cause:** Keyword create/update endpoints are separate from the category update.
Saving the category (PUT `/admin/intents/categories/{id}`) does NOT save the keywords.
**Fix:** Keywords are saved individually: POST for new, PUT for edit, DELETE for remove.
Each keyword action triggers its own API call immediately (no bulk save).

---

## Quality Checklist

Before finishing, verify:
- [ ] URL `/admin/auto-replies/` refers to Intent Categories (not auto-reply rules)
- [ ] `?mode=edit` param initializes `isEditing` state on detail page load
- [ ] Response payload only JSON.parsed for `flex`/`template` types (null for others)
- [ ] `payloadError` cleared on every payload textarea change
- [ ] Reply object API calls use `obj.object_id` (string), not `obj.id` (integer)
- [ ] `object_id` field disabled in reply object edit form
- [ ] Keyword POST/PUT includes `category_id: params.id` from URL
- [ ] New `match_type` values added to `MATCH_TYPES` constant AND backend enum
- [ ] `keywords_preview` on list page is display-only (first 3 items)

## Additional Resources

For full TypeScript interfaces, API endpoint table, and `MATCH_TYPES`/`REPLY_TYPES`/`OBJECT_TYPES`
constants — see `references/chatbot_frontend_reference.md`.
