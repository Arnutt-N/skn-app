# Rich Menu Frontend — Reference

Sources: `frontend/app/admin/rich-menus/page.tsx`,
`frontend/app/admin/rich-menus/new/page.tsx`,
`frontend/app/admin/rich-menus/[id]/edit/page.tsx`

---

## File Locations

| File | Purpose |
|---|---|
| `frontend/app/admin/rich-menus/page.tsx` | List view (214 lines) |
| `frontend/app/admin/rich-menus/new/page.tsx` | Create wizard (662 lines) |
| `frontend/app/admin/rich-menus/[id]/edit/page.tsx` | Edit page (246 lines) |

---

## TypeScript Interfaces

### List Page

```ts
interface RichMenu {
  id: number;
  name: string;
  chat_bar_text: string;
  line_rich_menu_id: string | null;  // null = local draft only
  status: string;                    // 'PUBLISHED' | 'SYNCED' | 'PENDING' (plain String)
  image_path: string | null;         // relative: 'uploads/rich_menus/abc.jpg'
  created_at: string;
}
```

### Create Page (`new/page.tsx`)

```ts
interface TemplateBounds {
  x: number;
  y: number;
  width: number;    // NOTE: 'width' not 'w'
  height: number;   // NOTE: 'height' not 'h'
}

interface TemplateArea {
  id: number;
  name: string;     // display label, e.g. 'Area 1', 'Top Left'
  bounds: TemplateBounds;
}

interface TemplateItem {
  id: string;       // kebab-case: '6-buttons', '4-buttons', etc.
  name: string;
  areas: TemplateArea[];
}

interface TemplateGroup {
  category: string;   // 'Large' | 'Compact'
  description: string;
  width: number;      // 2500
  height: number;     // 1686 (Large) | 843 (Compact)
  items: TemplateItem[];
}

interface TemplateSelection {
  category: TemplateGroup;
  item: TemplateItem;
}

interface MenuAction {
  type: 'uri' | 'message';
  uri: string;
  label: string;
  text: string;
}

interface ReplyObjectLite {
  id: number;
  object_id: string;   // e.g. 'welcome_flex'
  name: string;
}

interface AutoReplyLite {
  id: number;
  name: string;        // e.g. 'กองทุนยุติธรรม'
}
```

### Edit Page (`[id]/edit/page.tsx`)

```ts
interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    w: number;    // NOTE: 'w' not 'width' — from LINE API format
    h: number;    // NOTE: 'h' not 'height'
  };
  action: {
    type: string;
    label: string;
    uri?: string;
    text?: string;
    data?: string;
    displayText?: string;
  };
}

interface RichMenu {
  id: number;
  name: string;
  chat_bar_text: string;
  line_rich_menu_id: string | null;
  status: string;
  image_path: string | null;
  config: {
    size: { width: number; height: number };
    areas: RichMenuArea[];
  };
}
```

---

## API Endpoints

| Method | Path | Purpose | Page |
|---|---|---|---|
| `GET` | `/admin/rich-menus` | List all menus | List |
| `POST` | `/admin/rich-menus` | Create local draft | Create |
| `POST` | `/admin/rich-menus/{id}/upload` | Upload menu image (multipart) | Create + Edit |
| `POST` | `/admin/rich-menus/{id}/sync` | Create in LINE API + store line_rich_menu_id | List + Create |
| `POST` | `/admin/rich-menus/{id}/publish` | Set as default rich menu in LINE | List |
| `DELETE` | `/admin/rich-menus/{id}` | Delete menu | List |
| `GET` | `/admin/rich-menus/{id}` | Get single menu | Edit |
| `PUT` | `/admin/rich-menus/{id}` | Update name/chat_bar_text/areas | Edit |
| `GET` | `/admin/reply-objects` | System objects for area actions | Create |
| `GET` | `/admin/intents/categories` | Intent categories for area actions | Create |

---

## Status Display Logic (List Page)

```ts
// Derived from two fields:
const getDisplayStatus = (menu: RichMenu) => {
  if (!menu.line_rich_menu_id)          return 'DRAFT'    // amber
  if (menu.status !== 'PUBLISHED')      return 'SYNCED'   // blue
  return 'ACTIVE'                                          // emerald, "Live Now"
}

// Status badge classes:
const statusBadgeClasses = {
  'PUBLISHED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'SYNCED':    'bg-blue-50 text-blue-600 border-blue-100',
  'DRAFT':     'bg-amber-50 text-amber-600 border-amber-100',
}

// Action button logic:
if (!menu.line_rich_menu_id) → show "Sync to LINE" button (POST /sync)
else if (menu.status !== 'PUBLISHED') → show "Set Active" button (POST /publish)
else → show "Live Now" label (no button)
```

---

## Image URL Construction

```ts
// image_path is relative, e.g. 'uploads/rich_menus/abc.jpg'
// API_BASE is e.g. 'http://localhost:8000/api/v1'

const getImageUrl = (path: string | null): string | null => {
  if (!path) return null
  const baseHost = API_BASE.split('/api/')[0]  // 'http://localhost:8000'
  return `${baseHost}/${path}`                 // 'http://localhost:8000/uploads/rich_menus/abc.jpg'
}
```

---

## Create Page — Save Flow

```ts
const handleSave = async (syncToLine: boolean) => {
  // Validation (required before any API calls):
  if (!form.name || !file || !selectedTemplate) return

  // Step 1: Create local record
  const createRes = await fetch(`${API_BASE}/admin/rich-menus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.name,
      chat_bar_text: form.chat_bar_text,
      template_type: selectedTemplate.item.id,   // e.g. '6-buttons'
      areas: selectedTemplate.item.areas.map((area, i) => ({
        bounds: area.bounds,   // {x, y, width, height}
        action: actions[i]     // {type, uri, label, text}
      }))
    })
  })
  const menu = await createRes.json()   // { id: number, ... }

  // Step 2: Upload image
  const formData = new FormData()
  formData.append('file', file)
  await fetch(`${API_BASE}/admin/rich-menus/${menu.id}/upload`, {
    method: 'POST',
    body: formData
  })

  // Step 3 (optional): Sync to LINE
  if (syncToLine) {
    const syncRes = await fetch(`${API_BASE}/admin/rich-menus/${menu.id}/sync`, {
      method: 'POST'
    })
    if (!syncRes.ok) {
      // Alert but still redirect — draft is saved
      alert(`Saved locally, but Sync to LINE failed: ${errorData.detail}`)
      router.push('/admin/rich-menus')
      return
    }
  }

  router.push('/admin/rich-menus')
}
```

---

## Create Page — Action Change Handler

```ts
const handleActionChange = (index: number, field: string, value: string) => {
  const newActions = [...actions]
  newActions[index] = { ...newActions[index], [field]: value }

  // Special cases — set derived fields:
  if (field === 'object_id') {
    const obj = replyObjects.find(o => o.object_id === value)
    if (obj) {
      newActions[index].type = 'message'
      newActions[index].text = `get_obj:${value}`  // backend resolves reply object
      newActions[index].label = obj.name
    }
  } else if (field === 'intent_name') {
    newActions[index].type = 'message'
    newActions[index].text = value      // intent category name as trigger text
    newActions[index].label = value
  }

  setActions(newActions)
}

// System objects select onChange:
onChange={(e) => {
  const val = e.target.value
  if (val.startsWith('intent:')) handleActionChange(i, 'intent_name', val.split(':')[1])
  else if (val.startsWith('obj:')) handleActionChange(i, 'object_id', val.split(':')[1])
}}
```

---

## PRESET_TEMPLATES Structure

```ts
// Two groups: 'Large' (7 layouts, 2500x1686) and 'Compact' (4 layouts, 2500x843)
// Large layouts:
'6-buttons'           — 3×2 grid (6 equal cells)
'4-buttons'           — 2×2 grid
'3-buttons-top'       — 1 wide top + 2 bottom
'3-buttons-left'      — 1 tall left + 2 right stacked
'2-buttons-rows'      — 2 full-width rows
'2-buttons-cols'      — 2 full-height columns
'1-button-full'       — 1 full area

// Compact layouts:
'3-buttons-compact'        — 3 columns
'2-buttons-compact-cols'   — 2 equal columns
'2-buttons-compact-asym'   — asymmetric (small left: 833px, wide right: 1667px)
'1-button-compact-full'    — 1 full area

// Default selection on page load:
selectedTemplate = { category: PRESET_TEMPLATES[0], item: PRESET_TEMPLATES[0].items[0] }
// = Large / 6 Buttons (3x2)
```

---

## Edit Page — Save Flow

```ts
const handleSave = async () => {
  // Step 1: Update menu record
  await fetch(`${API_BASE}/admin/rich-menus/${menuId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      chat_bar_text: chatBarText,
      areas    // RichMenuArea[] with {x, y, w, h} bounds
    })
  })

  // Step 2: Upload new image (only if changed)
  if (imageFile) {
    const formData = new FormData()
    formData.append('file', imageFile)
    await fetch(`${API_BASE}/admin/rich-menus/${menuId}/upload`, {
      method: 'POST',
      body: formData
    })
  }

  router.push('/admin/rich-menus')
}
```

---

## Known Gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | Bounds key inconsistency: create uses `width`/`height`, edit uses `w`/`h` | Medium | Normalize to one format in both pages and backend |
| GAP-2 | `TemplateIcon` uses hardcoded `aspect-[250/168.6]` for all templates incl. Compact | Low | Pass height prop and compute aspect ratio dynamically |
| GAP-3 | No image dimension validation on upload — any image is accepted | Medium | Validate width/height against selected template dimensions client-side |
| GAP-4 | Edit page cannot change template layout — only name/bar text/image | Medium | Add template re-selection to edit page (would need areas reset) |
| GAP-5 | `PRESET_TEMPLATES` is hardcoded — admin cannot add custom templates without code | Low | Move to DB or admin-configurable YAML |
| GAP-6 | Sync/Publish errors show `alert()` — no toast notifications | Low | Replace with `addNotification()` from live chat Zustand store or a shared notification system |
