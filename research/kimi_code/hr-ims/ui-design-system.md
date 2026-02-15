# 🎨 HR-IMS UI Design System

> **Document Type**: Design System Reference  
> **Agent**: Kimi Code CLI  
> **Generated**: 2026-02-13T19:04:00+07:00  
> **Project**: HR-IMS (Human Resource & Inventory Management System)  
> **Repository**: https://github.com/Arnutt-N/hr-ims.git

---

## 📋 Table of Contents

1. [Design Philosophy](#-design-philosophy)
2. [Design Tokens](#-design-tokens)
3. [Color System](#-color-system)
4. [Typography](#-typography)
5. [Layout System](#-layout-system)
6. [Component Library](#-component-library)
7. [Animations & Transitions](#-animations--transitions)
8. [Iconography](#-iconography)
9. [Patterns & Guidelines](#-patterns--guidelines)
10. [Responsive Design](#-responsive-design)

---

## 🎯 Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Modern Enterprise** | Professional, clean aesthetic suitable for government/enterprise use |
| **Thai-First** | Noto Sans Thai as primary font, bilingual support (Thai/English) |
| **Glass Morphism** | Subtle transparency effects with backdrop blur |
| **Gradient Accents** | Blue-to-indigo gradients for primary actions and branding |
| **Dark Theme Foundation** | Deep navy backgrounds (`#0f172a`) with white text |
| **Accessible** | Focus rings, proper contrast, ARIA support |

### Visual Identity

The HR-IMS system follows a **"Dark Luxury"** aesthetic common in modern SaaS dashboards:

- Deep gradient backgrounds (`slate-900` → `#1e1b4b` → `#172554`)
- Glass-morphism cards with `backdrop-blur-xl`
- Blue-500 to Indigo-600 gradient accents
- Subtle texture overlays for depth

---

## 🎨 Design Tokens

### CSS Variables (globals.css)

```css
:root {
  /* Base Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Card & Popover */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  
  /* Primary: Indigo/Blue */
  --primary: 239 84% 67%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary: Slate */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Accent */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  /* Destructive */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Borders & Inputs */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 239 84% 67%;
  
  /* Radius */
  --radius: 0.5rem;
}
```

### Custom Properties

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-lg` | `0.5rem` | Cards, modals |
| `--radius-md` | `calc(var(--radius) - 2px)` | Buttons, inputs |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small elements |

---

## 🌈 Color System

### Primary Palette

| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| Background | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` | Page background |
| Primary | `hsl(239 84% 67%)` | `hsl(217.2 91.2% 59.8%)` | Buttons, links, accents |
| Secondary | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)` | Secondary buttons |
| Muted | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)` | Backgrounds, disabled |
| Destructive | `hsl(0 84.2% 60.2%)` | `hsl(0 62.8% 30.6%)` | Errors, delete actions |

### Extended Palette (Direct Usage)

| Color | Tailwind Class | Hex | Usage |
|-------|----------------|-----|-------|
| Deep Navy | `bg-[#0f172a]` | `#0f172a` | Login background, sidebar |
| Indigo Dark | `bg-[#1e1b4b]` | `#1e1b4b` | Gradient midpoint |
| Blue Deep | `bg-[#172554]` | `#172554` | Gradient end |
| Blue 500 | `bg-blue-500` | `#3b82f6` | Primary actions |
| Blue 600 | `bg-blue-600` | `#2563eb` | Hover states |
| Indigo 600 | `bg-indigo-600` | `#4f46e5` | Gradient partner |
| Slate 50 | `bg-slate-50` | `#f8fafc` | Light backgrounds |
| Slate 200 | `bg-slate-200` | `#e2e8f0` | Borders |
| Slate 400 | `text-slate-400` | `#94a3b8` | Muted text |
| Slate 500 | `text-slate-500` | `#64748b` | Secondary text |
| Slate 700 | `border-slate-700` | `#334155` | Dark borders |
| Slate 900 | `bg-slate-900` | `#0f172a` | Dark backgrounds |

### Semantic Colors (Badge Variants)

```typescript
const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "text-foreground",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-white",
}
```

### Gradient Patterns

| Pattern | CSS | Usage |
|---------|-----|-------|
| Primary Button | `bg-gradient-to-r from-blue-600 to-indigo-600` | CTA buttons |
| Active Sidebar | `bg-gradient-to-r from-blue-600 to-indigo-600` | Active nav items |
| Sub Active | `bg-gradient-to-r from-blue-600 to-indigo-600` | Submenu active |
| Glass Card | `bg-white/5 backdrop-blur-xl border-white/10` | Cards on dark bg |

---

## 🔤 Typography

### Font Family

```javascript
// tailwind.config.js
fontFamily: {
  thai: ['Noto Sans Thai', 'sans-serif'],
  sans: ['Noto Sans Thai', 'system-ui', 'sans-serif'],
}
```

**Primary Font**: Noto Sans Thai (Google Fonts)  
**Fallbacks**: system-ui, sans-serif

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | `text-3xl` | `font-bold` | `tracking-tight` | -0.025em |
| H2 | `text-2xl` | `font-semibold` | `leading-none` | `tracking-tight` |
| H3 | `text-xl` | `font-bold` | - | `tracking-wide` |
| Body | `text-sm` | `font-normal` | - | - |
| Small | `text-xs` | `font-medium` | - | `tracking-widest` |
| Label | `text-sm` | `font-medium` | - | - |
| Button | `text-sm` | `font-medium` | - | - |

### Font Weights Used

| Weight | Value | Usage |
|--------|-------|-------|
| Light | `300` | Subtitles, descriptions |
| Normal | `400` | Body text |
| Medium | `500` | Labels, nav items |
| Semibold | `600` | Card titles, headings |
| Bold | `700` | Page titles, emphasis |

### Text Colors

| Context | Class | Color |
|---------|-------|-------|
| Primary | `text-foreground` | Based on theme |
| Muted | `text-muted-foreground` | Slate-500 |
| White | `text-white` | #ffffff |
| Blue Light | `text-blue-100` | Login labels |
| Blue 300 | `text-blue-300` | Accent text |
| Slate 400 | `text-slate-400` | Secondary text |

---

## 📐 Layout System

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-y-1` | 0.25rem | Tight spacing |
| `space-y-2` | 0.5rem | Form fields |
| `space-y-4` | 1rem | Card content |
| `space-y-6` | 1.5rem | Section spacing |
| `space-y-8` | 2rem | Major sections |
| `p-4` | 1rem | Card padding |
| `p-6` | 1.5rem | Container padding |
| `p-8` | 2rem | Section padding |

### Layout Components

#### Dashboard Layout

```tsx
// (dashboard)/layout.tsx
<div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
  <Sidebar user={session?.user} />
  <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
    <Header />
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto min-h-full flex flex-col">
        {/* Content */}
      </div>
    </main>
  </div>
</div>
```

#### Container

| Property | Value |
|----------|-------|
| Max Width | `max-w-7xl` (1280px) |
| Center | `mx-auto` |
| Padding | `p-4 md:p-8` |

#### Card Component

```tsx
// Card Structure
<Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
  </CardHeader>
  <CardContent className="p-6 pt-0">
  </CardContent>
  <CardFooter className="flex items-center p-6 pt-0">
  </CardFooter>
</Card>
```

### Grid System

| Pattern | Classes | Usage |
|---------|---------|-------|
| Stats Grid | `grid gap-4 md:grid-cols-2 lg:grid-cols-4` | Dashboard stats |
| 2-Column | `grid gap-4 md:grid-cols-2` | Forms, side-by-side |
| 7-Column | `grid gap-4 md:grid-cols-2 lg:grid-cols-7` | Activity + details |
| Auto Fit | `grid grid-cols-2 md:grid-cols-3 gap-2` | Demo buttons |

---

## 🧩 Component Library

### 1. Button Component

**Location**: `components/ui/button.tsx`

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
  }
);
```

### 2. Input Component

**Location**: `components/ui/input.tsx`

```typescript
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
```

**Dark Theme Override**:
```
bg-slate-900/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
```

### 3. Card Component

**Location**: `components/ui/card.tsx`

| Part | Classes |
|------|---------|
| Card | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| Header | `flex flex-col space-y-1.5 p-6` |
| Title | `text-2xl font-semibold leading-none tracking-tight` |
| Description | `text-sm text-muted-foreground` |
| Content | `p-6 pt-0` |
| Footer | `flex items-center p-6 pt-0` |

### 4. Badge Component

**Location**: `components/ui/badge.tsx`

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
  }
);
```

### 5. Sidebar Component

**Location**: `components/layout/sidebar.tsx`

| Element | Classes |
|---------|---------|
| Container | `fixed md:relative inset-y-0 left-0 z-50 h-[100dvh] w-72 bg-[#0f172a] text-white shadow-2xl border-r border-white/5` |
| Background | `bg-gradient-to-b from-slate-900 via-[#1e1b4b] to-[#172554]` |
| Active Item | `bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20` |
| Inactive Item | `text-slate-400 hover:bg-white/5 hover:text-white` |
| Icon Active | `text-white` |
| Icon Inactive | `text-slate-500 group-hover:text-blue-300` |

### 6. Alert Component

**Error Pattern**:
```
flex items-center space-x-2 text-sm text-red-200 bg-red-900/30 border border-red-500/30 p-3 rounded-xl
```

### 7. Checkbox Component

**Custom Checkbox**:
```
w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-900/50 peer-checked:bg-gradient-to-br peer-checked:from-blue-500 peer-checked:to-indigo-600 peer-checked:border-transparent
```

### 8. Navigation Patterns

**Main Nav Items**:
```
flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group mb-1
```

**Sub Nav Items**:
```
flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm pl-11 relative group/sub mb-1
```

---

## ✨ Animations & Transitions

### CSS Keyframes (globals.css)

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scan {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(100px);
    opacity: 1;
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Tailwind Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `animate-fade-in-up` | 0.3s | ease-out | Page load, cards |
| `animate-fade-in` | 0.2s | ease-out | Quick reveals |
| `animate-scan` | 2s | ease-in-out infinite | QR scanner |
| `accordion-down` | 0.2s | ease-out | Expand content |
| `accordion-up` | 0.2s | ease-out | Collapse content |

### Framer Motion Patterns

**Page Entrance**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

**Error Shake**:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
>
```

**Sidebar Mobile**:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
/>
```

**Submenu Expand**:
```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
>
```

### Transition Patterns

| Element | Transition |
|---------|------------|
| Buttons | `transition-colors` |
| Cards | `transition-all duration-200` |
| Sidebar Items | `transition-all duration-200` |
| Backdrop | `transition-transform duration-300 ease-in-out` |

---

## 🎯 Iconography

### Icon Library

**Primary**: [Lucide React](https://lucide.dev)

```typescript
import { 
  LayoutDashboard, Package, FileText, History, Settings, 
  Users, LogOut, Menu, X, ChevronDown, ChevronRight,
  Box, ClipboardList, Layers, ShoppingCart, PackageCheck,
  Wrench, BarChart3, ScanLine, QrCode, MapPin, Activity,
  FolderOpen, Shield, Gauge, Mail, Database, Lock,
  FileCode, HeartPulse, User, Lock, AlertCircle, Eye, EyeOff
} from 'lucide-react';
```

### Icon Sizes

| Context | Size |
|---------|------|
| Sidebar Main | `size={20}` |
| Sidebar Sub | `size={16}` |
| Header | `size={24}` |
| Form Icons | `size={18}` |
| Buttons | `size={20}` |
| Stats | `size={16}` or `className="h-4 w-4"` |

### Icon Colors

| Context | Color |
|---------|-------|
| Active | `text-white` |
| Inactive | `text-slate-500` |
| Hover | `group-hover:text-blue-300` |
| Muted | `text-muted-foreground` |
| Accent | `text-blue-500` |
| Warning | `text-amber-500` |
| Success | `text-green-500` |

---

## 📏 Patterns & Guidelines

### Form Patterns

#### Input with Icon

```tsx
<div className="relative">
  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" size={18} />
  <input
    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
  />
</div>
```

#### Password Toggle

```tsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
>
  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
</button>
```

### Button Patterns

#### Primary CTA

```tsx
<button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
  <Shield size={20} />
  <span>Sign In</span>
</button>
```

#### Demo Role Buttons

```tsx
<button className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-md">
  Role Name
</button>
```

### Glass Morphism Pattern

```tsx
<div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
  {/* Content */}
</div>
```

### Logo/Brand Pattern

```tsx
<div className="flex items-center gap-4">
  <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
    <Package size={24} className="text-white" />
  </div>
  <div>
    <h1 className="text-xl font-bold tracking-wide text-white">IMS.Pro</h1>
    <p className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold">Inventory System</p>
  </div>
</div>
```

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Min Width | Tailwind |
|------------|-----------|----------|
| Mobile | 0px | Default |
| Tablet | 768px | `md:` |
| Desktop | 1024px | `lg:` |
| Wide | 1280px | `xl:` |
| Ultra-wide | 1536px | `2xl:` |

### Container Responsive

```
container: {
  center: true,
  padding: "2rem",
  screens: {
    "2xl": "1400px",
  },
}
```

### Common Responsive Patterns

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Sidebar | Fixed, off-canvas | Fixed, off-canvas | Relative, always visible |
| Main Padding | `p-4` | `p-6` | `p-8` |
| Stats Grid | 1 col | 2 cols | 4 cols |
| Card Padding | `p-4` | `p-6` | `p-6` |
| Font Size | Base | Base | Base |

### Mobile-First Examples

```tsx
// Grid adapts from 1 → 2 → 4 columns
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Padding adapts
<main className="p-4 md:p-8">

// Text size adapts
<h1 className="text-2xl md:text-3xl">

// Show/hide
<div className="md:hidden"> {/* Mobile only */}
<div className="hidden md:block"> {/* Desktop only */}
```

---

## 🔧 Utility Classes

### Custom Scrollbars

```css
/* Sidebar Scrollbar */
.sidebar-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.sidebar-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
}

/* Main Scrollbar */
.main-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.main-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
```

### Glass Effect

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Print Optimization

```css
@media print {
  aside, header { display: none !important; }
  main { margin: 0; padding: 0; width: 100%; height: 100%; }
  .no-print { display: none !important; }
}
```

---

## 📦 Shadcn/ui Integration

### Components Used

| Component | Location | Customization |
|-----------|----------|---------------|
| Button | `ui/button.tsx` | Added cursor-pointer |
| Card | `ui/card.tsx` | Standard |
| Input | `ui/input.tsx` | Standard |
| Badge | `ui/badge.tsx` | Added success/warning variants |
| Dialog | `ui/dialog.tsx` | Standard |
| Dropdown | `ui/dropdown-menu.tsx` | Standard |
| Select | `ui/select.tsx` | Standard |
| Tabs | `ui/tabs.tsx` | Standard |
| Toast | `ui/toast.tsx` | Standard |
| Alert | `ui/alert.tsx` | Standard |
| Avatar | `ui/avatar.tsx` | Standard |
| Checkbox | `ui/checkbox.tsx` | Standard |
| Label | `ui/label.tsx` | Standard |
| ScrollArea | `ui/scroll-area.tsx` | Standard |
| Skeleton | `ui/skeleton.tsx` | Standard |
| Switch | `ui/switch.tsx` | Standard |
| Table | `ui/table.tsx` | Standard |
| Textarea | `ui/textarea.tsx` | Standard |

### Style Configuration

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## 🎨 Design Assets

### Background Texture

```
https://www.transparenttextures.com/patterns/cubes.png
```

Usage:
```css
background: bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay
```

### Font Import

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
```

---

## 📝 Summary

The HR-IMS UI Design System follows a **modern dark-themed dashboard aesthetic** with:

1. **Deep navy gradients** (`#0f172a` → `#1e1b4b` → `#172554`)
2. **Blue-to-indigo gradient accents** for CTAs and active states
3. **Glass morphism effects** with backdrop blur
4. **Noto Sans Thai** for bilingual support
5. **shadcn/ui components** with custom variants
6. **Framer Motion** for smooth animations
7. **Mobile-first responsive design**
8. **High contrast accessibility** with focus rings

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dark Theme | Reduces eye strain for long dashboard usage |
| Gradient Buttons | Modern, premium feel |
| Glass Cards | Depth and layering |
| Lucide Icons | Consistent, lightweight |
| Tailwind CSS v4 | Latest features, Oxide engine |
| shadcn/ui | Accessible, customizable primitives |

---

*Document generated by Kimi Code CLI for HR-IMS Project*  
*Timestamp: 2026-02-13T19:04:00+07:00*
