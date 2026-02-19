# UI Design System Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the admin UI design system with the admin-chat-system example (HSL tokens, animations, glass effects) and match the sidebar, active menu, and navbar styling from HR-IMS.

**Architecture:** Update CSS design tokens in `globals.css` to add glass-navbar and align sidebar-primary to blue/indigo. Modify `admin/layout.tsx` to match HR-IMS navbar (full-width sticky bar, not floating card), logo (blue gradient with ring), and active menu shadow intensity. All changes use HSL color format.

**Tech Stack:** Tailwind CSS v4 (CSS-first config), HSL custom properties, Next.js 16 layout

---

### Task 1: Add glass-navbar utility and update sidebar-primary token in globals.css

**Files:**
- Modify: `frontend/app/globals.css:101-108` (sidebar tokens), add glass-navbar utility

**Step 1: Update sidebar-primary token from purple to blue**

In `frontend/app/globals.css`, change the sidebar-primary token:

```css
/* Before */
--color-sidebar-primary: hsl(262 83% 58%);
--color-sidebar-primary-fg: hsl(0 0% 100%);
--sidebar-primary-fg: hsl(0 0% 100%);

/* After */
--color-sidebar-primary: hsl(217 91% 60%);
--color-sidebar-primary-fg: hsl(0 0% 100%);
--sidebar-primary-fg: hsl(0 0% 100%);
```

**Step 2: Add glass-navbar utility class**

Add this inside the first `@layer utilities` block (after `.glass-dark`):

```css
/* Glass Navbar (from admin-chat-system) */
.glass-navbar {
  background: hsl(0 0% 100% / 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid hsl(226 33% 91% / 0.8);
}

.dark .glass-navbar {
  background: hsl(217 33% 17% / 0.8);
  border-bottom: 1px solid hsl(215 28% 17% / 0.8);
}
```

**Step 3: Verify build**

Run: `cd frontend && npx next build 2>&1 | head -20`
Expected: No CSS parse errors

**Step 4: Commit**

```bash
git add frontend/app/globals.css
git commit -m "style(tokens): align sidebar-primary to blue, add glass-navbar utility"
```

---

### Task 2: Update sidebar logo to match HR-IMS blue/indigo style

**Files:**
- Modify: `frontend/app/admin/layout.tsx:166-195` (sidebar logo section)

**Step 1: Update collapsed logo icon**

Change the collapsed logo button (line ~170):

```tsx
/* Before */
<button
  onClick={toggleSidebar}
  className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm hover:shadow-glow transition-shadow cursor-pointer"
  aria-label="Expand sidebar"
>

/* After */
<button
  onClick={toggleSidebar}
  className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 hover:shadow-blue-500/30 transition-shadow cursor-pointer"
  aria-label="Expand sidebar"
>
```

**Step 2: Update expanded logo icon**

Change the expanded logo icon (line ~178):

```tsx
/* Before */
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm flex-shrink-0">

/* After */
<div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 flex-shrink-0">
```

**Step 3: Update logo title text color to match HR-IMS**

The subtitle "Admin" should use `text-blue-300` (already correct). Verify the title area matches:

```tsx
<span className="text-white font-bold text-lg tracking-wide">JSK</span>
<span className="text-blue-300 text-sm ml-1 font-semibold">Admin</span>
```

(Add `tracking-wide` to title, `font-semibold` to subtitle to match HR-IMS)

**Step 4: Verify the sidebar renders correctly**

Run: `cd frontend && npm run dev`
Check: Navigate to http://localhost:3000/admin, verify logo shows blue icon with ring effect

**Step 5: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "style(sidebar): update logo to blue-600 with ring, match HR-IMS"
```

---

### Task 3: Update active menu shadow and inactive icon hover colors

**Files:**
- Modify: `frontend/app/admin/layout.tsx:213-227` (nav link classes)

**Step 1: Update active menu shadow intensity**

Change the nav link className (line ~217):

```tsx
/* Before */
isActive
  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20'
  : 'text-slate-300 hover:bg-white/5 hover:text-white'

/* After */
isActive
  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 font-semibold'
  : 'text-slate-400 hover:bg-white/5 hover:text-white'
```

Changes:
- Active shadow: `/20` → `/30` (match HR-IMS)
- Active: add `font-semibold` (match HR-IMS)
- Inactive text: `text-slate-300` → `text-slate-400` (match HR-IMS)

**Step 2: Update inactive icon color**

Confirm the icon classes already have `text-slate-400 group-hover:text-blue-300` for inactive state. Current code at line ~226:

```tsx
isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
```

This already matches HR-IMS. No change needed here.

**Step 3: Verify active menu renders with stronger shadow**

Run dev server and click between menu items. Active item should show a more prominent blue shadow.

**Step 4: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "style(sidebar): match HR-IMS active menu shadow and text weights"
```

---

### Task 4: Restyle navbar to match HR-IMS full-width sticky header

**Files:**
- Modify: `frontend/app/admin/layout.tsx:276-326` (header section)

**Step 1: Replace the floating card navbar with HR-IMS full-width sticky header**

Replace the entire header block:

```tsx
/* Before */
<header className="sticky top-0 z-40 px-4 sm:px-6 py-4">
  <div className={cn(
    'flex items-center justify-between',
    'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',
    'rounded-2xl shadow-sm',
    'px-4 sm:px-6 py-3',
    'border border-gray-100 dark:border-gray-700'
  )}>
    ...
  </div>
</header>

/* After */
<header className={cn(
  'sticky top-0 z-40 h-16',
  'flex items-center justify-between',
  'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md',
  'border-b border-slate-200/60 dark:border-gray-700/60',
  'px-6 md:px-8'
)}>
  ...content directly inside header, no wrapper div...
</header>
```

Key changes:
- Remove outer padding wrapper (`px-4 sm:px-6 py-4`)
- Remove inner card div with `rounded-2xl shadow-sm border`
- Apply styles directly to `<header>`: `h-16`, `backdrop-blur-md`, `border-b border-slate-200/60`
- Match HR-IMS padding: `px-6 md:px-8`

**Step 2: Update search bar styling to match HR-IMS**

```tsx
/* Before */
<div className="hidden md:flex items-center relative">
  <Search className="absolute left-3 w-4 h-4 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className={cn(
      'pl-9 pr-4 py-2 w-64 rounded-xl text-sm',
      'bg-gray-50 dark:bg-gray-700 border-transparent',
      'focus:bg-white dark:focus:bg-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
      'transition-all duration-200'
    )}
  />
</div>

/* After */
<div className="hidden md:flex items-center bg-slate-100/50 dark:bg-gray-700/50 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all w-64">
  <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
  <input
    type="text"
    placeholder="Search..."
    className="bg-transparent text-sm text-slate-800 dark:text-gray-200 placeholder:text-slate-400 focus:outline-none w-full"
  />
</div>
```

**Step 3: Update header action buttons to match HR-IMS style**

Update the notification bell and theme toggle hover to use blue instead of brand (purple):

In the ThemeToggle component:
```tsx
/* Before */
'text-gray-500 hover:text-brand-500 hover:bg-brand-50',
'dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-gray-800',

/* After */
'text-slate-400 hover:text-indigo-600 hover:bg-slate-50',
'dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800',
```

Update the notification bell button:
```tsx
/* Before */
className="p-2 rounded-xl text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-700 transition-all relative"

/* After */
className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all relative"
```

**Step 4: Update notification badge to match HR-IMS**

```tsx
/* Before */
<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />

/* After */
<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse" />
```

**Step 5: Update header avatar with HR-IMS gradient ring**

```tsx
/* Before */
<Avatar size="sm" fallback="AD" status="online" />

/* After */
<div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px] rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow">
  <div className="bg-white dark:bg-gray-800 rounded-[10px]">
    <Avatar size="sm" fallback="AD" status="online" />
  </div>
</div>
```

**Step 6: Verify navbar renders correctly**

Run dev server and check:
- Header is full-width sticky (not floating card)
- Search bar has container styling
- Bell/theme buttons use blue/indigo hover
- Avatar has gradient ring

**Step 7: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "style(navbar): restyle to HR-IMS full-width sticky header with blue accents"
```

---

### Task 5: Update mobile menu button to match HR-IMS

**Files:**
- Modify: `frontend/app/admin/layout.tsx:285-290` (mobile menu button in header)

**Step 1: Update mobile menu button**

```tsx
/* Before */
<button
  onClick={() => setIsMobileMenuOpen(true)}
  className="lg:hidden p-2 text-gray-500 hover:text-brand-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  aria-label="Open menu"
>
  <Menu className="w-5 h-5" />
</button>

/* After */
<button
  onClick={() => setIsMobileMenuOpen(true)}
  className="lg:hidden p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
  aria-label="Open menu"
>
  <Menu className="w-5 h-5" />
</button>
```

**Step 2: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "style(navbar): update mobile menu button to HR-IMS style"
```

---

### Task 6: Verify full design system alignment

**Files:**
- Read: `frontend/app/admin/layout.tsx` (verify all changes)
- Read: `frontend/app/globals.css` (verify token updates)

**Step 1: Run the build to check for errors**

Run: `cd frontend && npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors

**Step 2: Visual verification checklist**

Run dev server and verify each element:

- [ ] Sidebar background: dark navy gradient (unchanged, already matches)
- [ ] Sidebar logo: blue-600 icon with ring-4 ring-blue-500/10
- [ ] Active menu: blue-to-indigo gradient with shadow-blue-900/30, font-semibold
- [ ] Inactive menu: text-slate-400, hover shows bg-white/5 and text-white
- [ ] Inactive icons: text-slate-400, hover shows text-blue-300
- [ ] Navbar: full-width sticky, bg-white/80 backdrop-blur, border-b
- [ ] Search: contained in slate-100/50 box with border
- [ ] Theme/Bell buttons: hover shows indigo-600
- [ ] Notification dot: rose-500 with white ring
- [ ] Header avatar: gradient ring from-blue-500 to-indigo-600
- [ ] Mobile menu button: white bg with shadow and border
- [ ] Sidebar user footer: unchanged (already matches)
- [ ] Glass-navbar class: available for other components

**Step 3: Final commit (if any tweaks needed)**

```bash
git add -A
git commit -m "style: complete UI design system alignment with admin-chat-system and HR-IMS"
```

---

## Summary of Changes

| Element | Before | After (HR-IMS/Admin-Chat) |
|---------|--------|--------------------------|
| Sidebar primary token | `hsl(262 83% 58%)` (purple) | `hsl(217 91% 60%)` (blue) |
| Logo icon | purple gradient, shadow-glow | `bg-blue-600`, ring-4, shadow-blue |
| Active menu shadow | `shadow-blue-900/20` | `shadow-blue-900/30` |
| Active menu font | `font-medium` | `font-semibold` |
| Inactive text | `text-slate-300` | `text-slate-400` |
| Navbar | floating card, rounded-2xl | full-width sticky, border-b |
| Search bar | bare input in relative div | contained in slate-100/50 box |
| Action buttons hover | `hover:text-brand-500` (purple) | `hover:text-indigo-600` |
| Notification dot | `bg-red-500` | `bg-rose-500 ring-2 ring-white` |
| Header avatar | plain | gradient ring from-blue-500 to-indigo-600 |
| Mobile menu btn | simple gray | white bg, shadow, border, rounded-xl |
| Glass navbar utility | (missing) | Added `.glass-navbar` class |
