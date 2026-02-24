---
name: skn-admin-component
description: >
  Creates admin UI components and pages for the SKN App (JskApp) frontend following
  the project's exact React 19, Next.js 16, TypeScript, Tailwind CSS v4, and CVA
  patterns. Use when asked to "create admin component", "add admin page", "build UI",
  "create form", "add modal", "สร้าง component", "เพิ่มหน้า admin", "สร้าง UI",
  "สร้างฟอร์ม", or any new admin frontend feature.
  Do NOT use for backend endpoints, WebSocket logic, or LINE webhook handlers.
license: MIT
compatibility: >
  SKN App (JskApp) frontend. Next.js 16.1.1, React 19.2.3, TypeScript,
  Tailwind CSS v4, CVA, Lucide React, Zustand. Run via: cd frontend && npm run dev
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: frontend
  tags: [react, nextjs, typescript, tailwind, cva, zustand, admin]
---

# skn-admin-component

Creates complete admin components and pages for the SKN App frontend, following all
project-specific patterns extracted from the live codebase.

---

## CRITICAL: Project-Specific Rules

These rules are non-negotiable and must be followed every time:

1. **Always `'use client'`** — every admin component must declare this at the top
2. **CVA for variants** — never use ternary operators for styling variants; use `cva()` from `class-variance-authority`
3. **`cn()` for class merging** — always use `cn(...inputs)` from `@/lib/utils` (clsx + tailwind-merge)
4. **Semantic tokens** — use `bg-surface`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `border-border-default`, `brand-*` — never hardcode colors
5. **`forwardRef` for UI primitives** — all reusable components must expose a ref
6. **`useCallback` for event handlers and fetch** — prevent unnecessary re-renders
7. **Debounce search at 500ms** — always debounce text search with `setTimeout(fn, 500)`
8. **`API_BASE` from env** — always `const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'`
9. **Lucide React icons** — the only icon library in this project
10. **No SWR/React Query** — all data fetching is manual `fetch()` with `useState` + `useEffect`

---

## Component Categories

| Type | Where to Create | When to Use |
|---|---|---|
| UI Primitive | `frontend/components/ui/[Component].tsx` | Reusable across the entire app |
| Admin Component | `frontend/components/admin/[Component].tsx` | Admin-section specific, non-page |
| Admin Page | `frontend/app/admin/[resource]/page.tsx` | Full admin page with data fetching |
| Admin Modal | `frontend/components/admin/[Resource]Modal.tsx` | Standalone dialog for CRUD actions |
| Custom Hook | `frontend/hooks/use[Name].ts` | Shared stateful logic |

---

## Context7 Docs

Context7 MCP is active in this project. Use it to verify Tailwind v4, Next.js 16,
and React 19 APIs — all have recent breaking or additive changes.

**Relevant libraries:**

| Library | Resolve Name | Key Topics |
|---|---|---|
| Next.js | `"nextjs"` | app router, server components, route handlers |
| React | `"react"` | hooks, forwardRef, use() API |
| Tailwind CSS | `"tailwindcss"` | v4 config, utility changes, @layer |
| class-variance-authority | `"class-variance-authority"` | cva(), VariantProps |
| Zustand | `"zustand"` | create, subscribeWithSelector, getState |

**Usage:**
```
# 1. Resolve to Context7 library ID
mcp__context7__resolve-library-id  libraryName="nextjs"
→ { context7CompatibleLibraryID: "/vercel/next.js" }

# 2. Fetch targeted docs
mcp__context7__get-library-docs
    context7CompatibleLibraryID="/vercel/next.js"
    topic="server components data fetching"
    tokens=5000
```

When to use: Tailwind v4 utility changes, Next.js 16 app router patterns,
React 19 `use()` API, or CVA variant composition.

---

## Step 1: Understand the Requirement

Before writing any code, answer:

- **What type?** UI primitive / admin component / admin page / modal / hook
- **What data does it need?** Static props / fetched from API / Zustand store
- **What interactions?** Read-only / form / table with actions / modal triggers
- **Does it need variants?** (size, state, visual style) — if yes, use CVA
- **Reusable or page-specific?** — reusable goes in `components/`, page-specific stays in `app/admin/`

Check existing components before creating new ones:
```
frontend/
├── components/ui/          ← Button, Card, Input, Modal, Badge, Tooltip, etc.
├── components/admin/       ← SidebarItem, ChatModeToggle, NotificationToast, etc.
├── app/admin/              ← Admin pages (requests, live-chat, chatbot, settings)
└── hooks/                  ← useTheme, useLiveChatSocket, useWebSocket
```

---

## Step 2: Create a UI Primitive Component (if needed)

Create `frontend/components/ui/[Component].tsx`:

```typescript
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Variant Definition ───────────────────────────────────────────────────────

const [component]Variants = cva(
  // Base classes applied to every variant
  [
    'inline-flex items-center justify-center',
    'font-medium',
    'rounded-xl',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: ['bg-surface border border-border-default', 'text-text-primary'],
        primary: ['bg-gradient-to-br from-brand-500 to-brand-600', 'text-white shadow-md shadow-brand-500/20'],
        danger:  ['bg-gradient-to-br from-danger to-danger-dark', 'text-white'],
        ghost:   ['bg-transparent text-brand-500', 'hover:bg-brand-50'],
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-5 text-base gap-2.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

// ─── Props Interface ──────────────────────────────────────────────────────────

interface [Component]Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof [component]Variants> {
  // Add component-specific props here
}

// ─── Component ────────────────────────────────────────────────────────────────

const [Component] = React.forwardRef<HTMLDivElement, [Component]Props>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn([component]Variants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

[Component].displayName = '[Component]';

export { [Component], [component]Variants };
export type { [Component]Props };
```

---

## Step 3: Create an Admin Page Component

Create `frontend/app/admin/[resource]/page.tsx`:

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface [Resource] {
  id: number;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function [Resource]Page() {
  // ── State ──
  const [items, setItems] = useState<[Resource][]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [selectedItem, setSelectedItem] = useState<[Resource] | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  // ── Data Fetching ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.append('status', statusFilter);
      if (debouncedSearch) query.append('search', debouncedSearch);

      const res = await fetch(`${API_BASE}/admin/[resources]?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch [resources]');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, debouncedSearch, statusFilter]);

  // Debounce search input — 500ms is the project standard
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // ── Handlers ──
  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${API_BASE}/admin/[resources]/${selectedItem.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(i => i.id !== selectedItem.id));
      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  // ── Render ──
  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">[Resources]</h1>
          <p className="text-sm text-text-secondary mt-1">Manage [resources]</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add [Resource]
        </Button>
      </div>

      {/* Filters Bar */}
      <Card variant="default" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              variant="outline"
              leftIcon={<Search className="w-4 h-4" />}
              placeholder="Search [resources]..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-4 rounded-xl border border-border-default bg-surface text-text-primary text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Data Table */}
      <Card variant="default" padding="none">
        <CardHeader divider className="px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>[Resource] List</CardTitle>
            <span className="text-sm text-text-tertiary">{items.length} items</span>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <p className="text-sm">No [resources] found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-bg">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-bg transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{item.title}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(item.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setCreateModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: Add Create/Edit Modal here */}
      {/* TODO: Add Delete Confirmation Modal here */}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      status === 'ACTIVE'   && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      status === 'INACTIVE' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    )}>
      {status}
    </span>
  );
}
```

---

## Step 4: Create a Form / Create-Edit Modal

Create `frontend/components/admin/[Resource]FormModal.tsx`:

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface [Resource]FormData {
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface [Resource]FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;           // Refresh parent list after save
  editingItem?: { id: number } & [Resource]FormData;  // null = create mode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function [Resource]FormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
}: [Resource]FormModalProps) {
  const isEditing = !!editingItem;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  const [formData, setFormData] = useState<[Resource]FormData>({
    title: '',
    description: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<[Resource]FormData>>({});

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        status: editingItem.status,
      });
    } else {
      setFormData({ title: '', description: '', status: 'ACTIVE' });
    }
    setErrors({});
  }, [editingItem, isOpen]);

  // ── Validation ──
  const validate = (): boolean => {
    const newErrors: Partial<[Resource]FormData> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const url = isEditing
        ? `${API_BASE}/admin/[resources]/${editingItem!.id}`
        : `${API_BASE}/admin/[resources]`;

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit [Resource]' : 'Create [Resource]'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          state={errors.title ? 'error' : 'default'}
          errorMessage={errors.title}
          placeholder="Enter title..."
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary
                       placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/30
                       resize-none transition-colors"
            placeholder="Enter description..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            className="w-full h-10 px-4 rounded-xl border border-border-default bg-surface text-sm text-text-primary
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## Step 5: Create a Custom Hook (if needed)

Create `frontend/hooks/use[Resource].ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface [Resource] {
  id: number;
  title: string;
  status: string;
}

interface Use[Resource]Options {
  autoFetch?: boolean;
}

export function use[Resource]({ autoFetch = true }: Use[Resource]Options = {}) {
  const [items, setItems] = useState<[Resource][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  const fetch[Resources] = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/[resources]`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (autoFetch) {
      void fetch[Resources]();
    }
  }, [autoFetch, fetch[Resources]]);

  return {
    items,
    loading,
    error,
    refetch: fetch[Resources],
  };
}
```

---

## Step 6: Register the Page in Navigation

If the new page needs a navigation entry, open `frontend/app/admin/layout.tsx` and add a `SidebarItem`:

```typescript
// In the navItems array or sidebar section:
import { [IconName] } from 'lucide-react';
import { SidebarItem } from '@/components/admin/SidebarItem';

// Add to sidebar items:
<SidebarItem
  icon={[IconName]}
  label="[Resource]"
  href="/admin/[resource]"
  isActive={pathname === '/admin/[resource]'}
  isCollapsed={isSidebarCollapsed}
/>
```

---

## Step 7: Verify

```bash
cd frontend
npm run lint       # No ESLint errors
npx tsc --noEmit   # No TypeScript errors
npm run build      # Production build passes
```

Open: `http://localhost:3000/admin/[resource]`

---

## Examples

### Example 1: Add a Tags Management Page

**User says:** "สร้างหน้า admin จัดการ Tags"

**Actions:**
1. Check if `TagPage` already exists in `frontend/app/admin/`
2. Create `frontend/app/admin/tags/page.tsx` — client component with list + search + status filter
3. Create `frontend/components/admin/TagFormModal.tsx` — create/edit modal
4. Add `SidebarItem` for Tags in `app/admin/layout.tsx`

**Result:** `/admin/tags` is live with full CRUD UI

### Example 2: Add a KPI Card Component

**User says:** "สร้าง KPI card component"

**Actions:**
1. Check `frontend/components/ui/` for existing card components
2. Create `frontend/components/ui/KpiCard.tsx` — CVA variants (success/warning/danger/info), icon support, trend indicator
3. Use `Card` as base, extend with metric-specific layout

```typescript
// KpiCard usage:
<KpiCard
  label="Total Requests"
  value={142}
  trend={{ direction: 'up', percent: 12 }}
  icon={<FileText className="w-5 h-5" />}
  variant="info"
/>
```

---

## Common Issues

### Component has stale data after CRUD action
**Cause:** `fetchItems` dependency array missing filter state.
**Fix:** Ensure all filter state variables are in `useCallback` dependency array.

### Tailwind classes not merging correctly
**Cause:** Using string concatenation instead of `cn()`.
**Fix:** Always use `cn(baseClasses, conditionalClasses, className)` — it handles conflicts via tailwind-merge.

### Variant styling inconsistency
**Cause:** Inline ternaries for styling instead of CVA.
**Fix:** Define `const xVariants = cva(base, { variants: {...} })` and call `xVariants({ variant })`.

### `document is not defined` error
**Cause:** Missing `'use client'` or server-side DOM access.
**Fix:** Add `'use client'` at the top. Guard with `if (typeof window === 'undefined') return`.

### Modal not closing after submit
**Cause:** `onClose()` called before async operation resolves.
**Fix:** Call `onClose()` inside the `try` block after `onSuccess()`, never in `finally`.

### Search re-fetches on every keystroke
**Cause:** Missing debounce or using `search` directly in `useCallback` deps.
**Fix:** Use the two-state pattern — `search` (raw input) debounced into `debouncedSearch` (API dep).

---

## Quality Checklist

Before finishing, verify:
- [ ] `'use client'` declared at the top
- [ ] All variant logic uses `cva()` — no inline style ternaries
- [ ] All class merging uses `cn()` from `@/lib/utils`
- [ ] Semantic tokens used: `bg-surface`, `text-text-primary`, `border-border-default`
- [ ] `API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'`
- [ ] Search is debounced at 500ms (two-state pattern)
- [ ] `forwardRef` used for any reusable UI primitive
- [ ] `useCallback` used for fetch functions and event handlers
- [ ] Loading state shown with spinner or skeleton
- [ ] Empty state shown when no data
- [ ] Error caught and handled (console.error + user-facing alert/toast)
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes

---

*See `references/patterns.md` for additional snippets: Zustand selectors, Zustand actions,
delete confirmation modal, status badge variants, table skeleton, toast notifications,
form validation helpers, Thai date formatting, animation utilities.*
