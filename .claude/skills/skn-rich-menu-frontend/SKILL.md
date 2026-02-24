---
name: skn-rich-menu-frontend
description: >
  Extends, modifies, or debugs the admin Rich Menu frontend in SKN App — the 3-page
  interface (list, create wizard, edit) for managing LINE Rich Menus. Use when asked
  to "add rich menu template", "modify rich menu create page", "add area action type",
  "fix rich menu image upload", "add template to rich menu wizard",
  "เพิ่ม template rich menu", "แก้ไขหน้าสร้าง rich menu", "เพิ่ม action type ใน rich menu",
  "rich menu อัปโหลดรูปไม่ได้", "เพิ่ม rich menu ใหม่".
  Do NOT use for backend RichMenuService/LINE API calls (skn-rich-menu-builder), or
  general admin components (skn-admin-component).
license: MIT
compatibility: >
  Claude Code with SKN App project.
  Requires: Next.js 16, React, TypeScript, Tailwind CSS v4.
  Rich menu pages at /admin/rich-menus, /admin/rich-menus/new, /admin/rich-menus/[id]/edit.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [rich-menu, admin, line, frontend, wizard]
  related-skills:
    - skn-rich-menu-builder
    - skn-admin-component
    - skn-reply-auto
  documentation: ./references/rich_menu_frontend_reference.md
---

# skn-rich-menu-frontend

The admin rich menu frontend is a 3-page interface for creating and managing LINE Rich
Menus. The create page is a multi-step wizard with template selection, area configuration,
image upload, and LINE sync. The edit page updates existing menus. The list page shows
status and triggers sync/publish/delete operations.

---

## CRITICAL: Project-Specific Rules

1. **Status display is derived — not a simple field** — The list page maps two fields to
   three display states. Never use `menu.status` alone for display:
   ```ts
   // Derived display logic:
   if (!menu.line_rich_menu_id)           → 'DRAFT'   (amber badge)
   else if (menu.status !== 'PUBLISHED')  → 'SYNCED'  (blue badge)
   else                                   → 'ACTIVE'  (emerald badge, "Live Now")
   ```
   This is independent of `menu.status` value — `status` can be anything; the presence
   of `line_rich_menu_id` is the key indicator.

2. **Template selection is two-step** — The create page uses `pendingTemplate` for modal
   selection; `selectedTemplate` only updates when "Apply Design" is clicked. Do NOT
   apply template change directly to `selectedTemplate` on click. Always update
   `pendingTemplate` first, then copy to `selectedTemplate` in `handleApplyTemplate()`.
   ```ts
   // On card click in modal — update PENDING only:
   onClick={() => setPendingTemplate({ category: group, item })}
   // On "Apply Design" click:
   const handleApplyTemplate = () => {
     if (pendingTemplate) setSelectedTemplate(pendingTemplate)
     setIsTemplateModalOpen(false)
   }
   // Modal opens: sync pending to current:
   useEffect(() => {
     if (isTemplateModalOpen) setPendingTemplate(selectedTemplate)
   }, [isTemplateModalOpen, selectedTemplate])
   ```

3. **Bounds key inconsistency between create and edit pages** — The create page uses
   `{width, height}` in `TemplateBounds`; the edit page uses `{w, h}` in `RichMenuArea`.
   This reflects the LINE API format vs the DB storage format:
   ```ts
   // Create page (TemplateBounds) — template constants:
   bounds: { x: 0, y: 0, width: 833, height: 843 }
   // Edit page (RichMenuArea from DB) — from API response:
   bounds: { x: 0, y: 0, w: 833, h: 843 }
   ```
   When adding fields to either, match the existing key names for that page.

4. **Image URL construction** — Image paths are stored as relative paths (e.g.
   `uploads/rich_menus/abc.jpg`). To display, strip `/api/` from `API_BASE`:
   ```ts
   const getImageUrl = (path: string | null) => {
     if (!path) return null
     const baseHost = API_BASE.split('/api/')[0]  // 'http://localhost:8000'
     return `${baseHost}/${path}`
   }
   ```
   Never pass `path` directly to `<img src>` — it won't resolve.

5. **Area action types and system objects selector** — In the create page, `MenuAction`
   has `type: 'uri' | 'message'`. The system objects `<select>` uses prefixed values
   and calls different fields in `handleActionChange`:
   ```ts
   // System objects select value format:
   'intent:{category.name}'  → handleActionChange(i, 'intent_name', name)
   'obj:{object_id}'         → handleActionChange(i, 'object_id', object_id)

   // handleActionChange behavior:
   if (field === 'object_id') {
     action.type = 'message'
     action.text = `get_obj:${value}`   // backend resolves this
     action.label = obj.name
   } else if (field === 'intent_name') {
     action.type = 'message'
     action.text = value                // intent keyword as text
     action.label = value
   }
   ```

6. **Save flow in create page is 3 sequential steps** — All 3 must succeed for a clean
   result. If step 2 (image upload) fails, the menu is already created as a local draft.
   If step 3 (sync) fails, alert and redirect — menu is saved but not synced.
   ```ts
   // Step 1: POST /admin/rich-menus → get menu.id
   // Step 2: POST /admin/rich-menus/{id}/upload (multipart)
   // Step 3 (optional): POST /admin/rich-menus/{id}/sync
   ```

7. **Edit page `PUT` sends `areas` array** — The edit page sends the full areas array
   with the existing bounds format. The backend accepts `PUT /admin/rich-menus/{id}`
   with `{name, chat_bar_text, areas}`. Note: edit page does NOT support template
   re-selection (template is fixed after creation).

8. **Create payload includes `template_type` but edit does NOT** — `template_type` is
   only in the create `POST` payload (used by backend for record-keeping). The `PUT`
   edit payload omits it.
   ```ts
   // Create: { name, chat_bar_text, template_type, areas: [{bounds, action}] }
   // Edit:   { name, chat_bar_text, areas }
   ```

9. **System objects data comes from two separate endpoints** — The create page fetches
   both on mount in parallel:
   ```ts
   GET /admin/reply-objects          → replyObjects: ReplyObjectLite[]
   GET /admin/intents/categories     → autoReplies: AutoReplyLite[]
   ```
   Both are needed for the area action system objects `<select>`.

10. **`PRESET_TEMPLATES` is hardcoded in the create page** — Not fetched from the backend.
    To add a new template, edit the `PRESET_TEMPLATES` constant. Large templates are
    2500×1686px; Compact are 2500×843px. Area bounds must sum to fit the canvas.

---

## File Structure

```
frontend/app/admin/rich-menus/
├── page.tsx            — List (214 lines): shows all menus, sync/publish/delete
├── new/
│   └── page.tsx        — Create wizard (662 lines): template + actions + image + save
└── [id]/
    └── edit/
        └── page.tsx    — Edit (246 lines): update name/bar text/image/areas
```

---

## Step 1 — Add a New Preset Template

All templates are defined in `PRESET_TEMPLATES` at the top of `new/page.tsx`:

**1a — Add to the existing `TemplateGroup`** (or create a new group):
```ts
// Add to the 'Large' group items array:
{
  id: 'new-layout-id',   // unique kebab-case ID
  name: '3 Buttons (Asymmetric)',
  areas: [
    { id: 1, name: 'Main',  bounds: { x: 0,    y: 0, width: 1667, height: 1686 } },
    { id: 2, name: 'Upper', bounds: { x: 1667, y: 0, width: 833,  height: 843  } },
    { id: 3, name: 'Lower', bounds: { x: 1667, y: 843, width: 833, height: 843 } },
  ]
}
```

**1b — Verify bounds add up correctly:**
- All areas should tile within `0..width × 0..height` with no gaps/overlaps
- Large: 2500×1686, Compact: 2500×843
- Use absolute pixel coordinates (not percentages)

**1c — `TemplateIcon` renders automatically** — The SVG thumbnail renders from bounds
using `(area.bounds.x / 2500) * 100%` positioning. No extra code needed.

---

## Step 2 — Add a New Area Action Type

Currently only `'uri'` and `'message'` exist in `MenuAction.type`:

**2a — Add to the `<select>` dropdown per area:**
```tsx
<option value="uri">Open URL</option>
<option value="message">Send Msg</option>
<option value="postback">Postback</option>  {/* Add here */}
```

**2b — Add to `MenuAction` interface:**
```ts
interface MenuAction {
  type: 'uri' | 'message' | 'postback';
  uri: string;
  label: string;
  text: string;
  data?: string;    // For postback
}
```

**2c — Add conditional UI in the area input section:**
```tsx
{actions[i]?.type === 'postback' && (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400">POSTBACK DATA</label>
    <input
      value={actions[i]?.data || ''}
      onChange={(e) => handleActionChange(i, 'data', e.target.value)}
      placeholder="postback_payload"
    />
  </div>
)}
```

**2d — Handle in `handleActionChange` if needed** — Simple fields like `data` are
handled generically. Special fields needing derived updates (like `object_id` and
`intent_name`) need explicit cases.

---

## Step 3 — Add a New Column to the List View

**3a — Add to `tableColumns` array:**
```ts
const tableColumns: AdminTableHeadColumn[] = [
  // ...existing
  { key: 'new_col', label: 'New Column', align: 'center' },
]
```

**3b — Add cell in `<tbody>` map:**
```tsx
<td className="px-5 py-4 text-center">
  {menu.new_field || '-'}
</td>
```

**3c — Add field to `RichMenu` interface if not present:**
```ts
interface RichMenu {
  // ... existing
  new_field?: string;
}
```

---

## Common Issues

### Image not displaying in list or edit preview
**Cause:** `image_path` is stored as a relative path (e.g., `uploads/rich_menus/abc.jpg`),
but `<img src>` needs an absolute URL.
**Fix:** Use `getImageUrl(path)`:
```ts
const baseHost = API_BASE.split('/api/')[0]   // 'http://localhost:8000'
return `${baseHost}/${path}`
```

### Template thumbnail doesn't match the actual layout
**Cause:** `TemplateIcon` uses `aspect-[250/168.6]` for all templates including Compact
(which should be `aspect-[250/84.3]`). This is a known visual inconsistency.
**Fix:** Pass `height` to `TemplateIcon` and compute aspect ratio dynamically
instead of hardcoding `aspect-[250/168.6]`.

### "Please provide a name, upload an image, and select a template" on Save
**Cause:** `handleSave` validates all 3 required fields. Either `form.name === ''`,
`file === null`, or `selectedTemplate === null`.
**Fix:** Ensure the create form has a name, image is uploaded (file input triggers),
and a template is selected (default is `PRESET_TEMPLATES[0].items[0]`).

### System objects select doesn't fill in the action
**Cause:** The value format must use `intent:` or `obj:` prefix. Plain values
are ignored in the onChange handler.
**Fix:** Check that the option values use the correct prefix:
```tsx
value={`intent:${cat.name}`}   // For auto replies
value={`obj:${obj.object_id}`} // For reply objects
```

### Sync fails but menu was saved locally
**Behavior:** This is expected. The create flow saves locally (step 1+2) first, then
syncs (step 3). If LINE credentials are invalid, sync fails but draft is preserved.
**Fix:** Configure LINE channel credentials in `/admin/settings/line`.
After fixing, use "Sync to LINE" button on the list page.

---

## Quality Checklist

Before finishing, verify:
- [ ] Status display uses derived 3-state logic (DRAFT/SYNCED/ACTIVE), not `menu.status` alone
- [ ] Template modal uses two-step selection (`pendingTemplate` → Apply → `selectedTemplate`)
- [ ] New templates have area bounds that fit within their group's canvas size
- [ ] `handleActionChange` handles new action fields correctly (generic vs special cases)
- [ ] Image URL construction uses `API_BASE.split('/api/')[0]` pattern
- [ ] Create page save flow: POST → upload → (optional) sync in correct sequence
- [ ] Edit page `PUT` payload includes `areas` without `template_type`
- [ ] System objects select uses `intent:` / `obj:` value prefixes

## Additional Resources

For full TypeScript interfaces, API endpoint table, and template constant structure —
see `references/rich_menu_frontend_reference.md`.
