# Vuexy Admin Template - UI Design System

> A comprehensive design system based on Vuexy Vue.js Admin Template v3  
> **Thai Adaptation** with Noto Sans Thai font + Lucide Icons

---

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| **Font** | Noto Sans Thai (Google Fonts) |
| **Icons** | Lucide React (SVG-based) |
| **Framework** | React / Next.js |
| **Styling** | Tailwind CSS or CSS Modules |

### Installation
```bash
# Thai Font (via Google Fonts in HTML/Next.js)
# Add to _document.tsx or layout.tsx:
# <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">

# Lucide Icons
npm install lucide-react

# For vanilla JS projects
npm install lucide
```

---

## Thai Language Considerations

This design system has been specifically adapted for Thai language content:

| Aspect | Adaptation |
|--------|------------|
| **Font** | Noto Sans Thai (Google Fonts) |
| **Minimum Body Size** | 16px (increased from 14px for Thai readability) |
| **Line Height** | 1.5-1.7 (increased for Thai ascenders/descenders) |
| **Text Transform** | Avoid `text-transform: uppercase` (Thai has no case) |
| **Word Breaking** | Use `word-break: keep-all` for better Thai word wrapping |
| **Font Weights** | 300, 400, 500, 600, 700 supported |

### Google Font Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    fontFamily: {
      sans: ['Noto Sans Thai', 'system-ui', 'sans-serif'],
    },
  },
}
```

---

## 1. Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#7367F0` | Primary brand color, buttons, links, active states |
| `--color-primary-light` | `#E9E7FD` | Light backgrounds, hover states |
| `--color-primary-dark` | `#5E50EE` | Hover/active states |

### Secondary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-secondary` | `#82868B` | Secondary elements, muted text |
| `--color-success` | `#28C76F` | Success states, positive indicators |
| `--color-danger` | `#EA5455` | Errors, deletions, warnings |
| `--color-warning` | `#FF9F43` | Warnings, caution indicators |
| `--color-info` | `#00CFE8` | Information, neutral highlights |

### Neutral Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-body` | `#F8F7FA` | Main background |
| `--color-bg-card` | `#FFFFFF` | Card backgrounds |
| `--color-bg-sidebar` | `#2F3349` | Sidebar background |
| `--color-text-primary` | `#5E5873` | Primary text |
| `--color-text-secondary` | `#6E6B7B` | Secondary/muted text |
| `--color-border` | `#EBE9F1` | Borders, dividers |
| `--color-border-light` | `#F5F5F5` | Subtle borders |

### Semantic Color States
```css
/* Status Badges */
--status-active-bg: #E5F8ED;
--status-active-text: #28C76F;
--status-pending-bg: #FFF3E8;
--status-pending-text: #FF9F43;
--status-inactive-bg: #F3F2F7;
--status-inactive-text: #82868B;

/* Variation Indicators */
--variation-positive: #28C76F;
--variation-negative: #EA5455;
```

---

## 2. Typography

### Font Stack
```css
--font-family-base: 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-heading: 'Noto Sans Thai', sans-serif;
--font-family-monospace: 'Fira Code', 'Monaco', monospace;
```

> **Note**: This project uses Thai language. Import Google Font:
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
> ```

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 32px | 600 | 1.4 | Page titles (Thai needs more line height) |
| H2 | 26px | 600 | 1.4 | Section headers |
| H3 | 22px | 600 | 1.5 | Card titles |
| H4 | 20px | 500 | 1.5 | Subsection headers |
| H5 | 18px | 500 | 1.6 | Widget titles |
| H6 | 16px | 500 | 1.6 | Small headers |
| Body | 16px | 400 | 1.7 | Main content (16px minimum for Thai readability) |
| Small | 14px | 400 | 1.6 | Captions, metadata |
| Tiny | 12px | 400 | 1.5 | Labels, timestamps |

> **Thai Typography Notes**:
> - Thai script requires slightly larger sizes for readability
> - Line height should be 1.5-1.7 to accommodate ascenders/descenders
> - Minimum body text: 16px for comfortable reading

### Typography Patterns
```css
/* Card Title Pattern */
.card-title {
  font-size: 20px;
  font-weight: 500;
  color: #5E5873;
  margin-bottom: 8px;
  line-height: 1.5;
}

/* Subtitle Pattern */
.card-subtitle {
  font-size: 14px;
  color: #6E6B7B;
  font-weight: 400;
  line-height: 1.6;
}

/* Statistic Value */
.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #5E5873;
  line-height: 1.3;
}

/* Statistic Label */
.stat-label {
  font-size: 14px;
  color: #6E6B7B;
  /* Note: Thai doesn't use text-transform */
}

/* Thai Text Optimization */
.thai-text {
  font-feature-settings: "locl" 1;
  line-height: 1.7;
}

/* Prevent line breaking in Thai */
.thai-no-break {
  word-break: keep-all;
  overflow-wrap: break-word;
}
```

---

## 3. Spacing System

### Base Unit
- **Base**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Spacing Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icons |
| `--space-2` | 8px | Inline spacing, compact padding |
| `--space-3` | 12px | Default component padding |
| `--space-4` | 16px | Card padding, standard gaps |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Large gaps, section margins |
| `--space-8` | 32px | Major section dividers |

### Layout Spacing
```css
/* Card Spacing */
.card-padding: 20px;
.card-gap: 24px;

/* Page Layout */
.page-padding: 24px;
.content-gap: 24px;

/* Form Spacing */
.form-group-gap: 20px;
.label-input-gap: 6px;
```

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Tables, inputs |
| `--radius-sm` | 4px | Small buttons, tags |
| `--radius-md` | 6px | Cards, modals, buttons |
| `--radius-lg` | 8px | Large cards, panels |
| `--radius-xl` | 12px | Feature cards, images |
| `--radius-full` | 9999px | Avatars, pills, badges |

---

## 5. Shadows & Elevation

### Shadow Tokens
```css
--shadow-xs: 0 1px 3px rgba(34, 41, 47, 0.05);
--shadow-sm: 0 2px 4px rgba(34, 41, 47, 0.08);
--shadow-md: 0 4px 8px rgba(34, 41, 47, 0.1);
--shadow-lg: 0 8px 16px rgba(34, 41, 47, 0.12);
--shadow-xl: 0 12px 24px rgba(34, 41, 47, 0.15);
```

### Usage Patterns
- **Cards**: `shadow-sm` or `shadow-md` on hover
- **Modals/Dialogs**: `shadow-lg`
- **Dropdowns**: `shadow-md`
- **Buttons (hover)**: `shadow-sm` with primary color

---

## 6. Component Library

### 6.1 Buttons

#### Variants (with Lucide Icons)
```css
/* Primary Button */
.btn-primary {
  background: #7367F0;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Secondary Button */
.btn-secondary {
  background: #F1F1F2;
  color: #6E6B7B;
}

/* Outline Button */
.btn-outline {
  background: transparent;
  border: 1px solid #7367F0;
  color: #7367F0;
}

/* Text Button */
.btn-text {
  background: transparent;
  color: #7367F0;
}
```

```tsx
// Button with Lucide Icons
import { Plus, Save, Download, Trash2, ArrowRight } from 'lucide-react';

// Button with left icon
<button className="btn btn-primary">
  <Plus size={18} strokeWidth={2} />
  <span>สร้างใหม่</span>
</button>

// Button with right icon
<button className="btn btn-primary">
  <span>ถัดไป</span>
  <ArrowRight size={18} strokeWidth={2} />
</button>

// Icon only button
<button className="btn btn-icon">
  <Trash2 size={18} strokeWidth={2} />
</button>

// Loading button with spinner
<button className="btn btn-primary" disabled>
  <Loader2 size={18} className="animate-spin" />
  <span>กำลังโหลด...</span>
</button>
```

#### Sizes
| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| xs | 6px 12px | 13px | 30px |
| sm | 8px 16px | 14px | 34px |
| md | 10px 20px | 16px | 40px |
| lg | 12px 24px | 18px | 48px |

> **Thai Note**: Slightly increased heights to accommodate Thai characters

#### States
- **Hover**: Darken background by 5%, add subtle shadow
- **Active**: Darken background by 10%
- **Disabled**: Opacity 0.6, cursor not-allowed
- **Loading**: Show spinner, reduce opacity

### 6.2 Cards

#### Standard Card
```css
.card {
  background: white;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(34, 41, 47, 0.08);
  border: 1px solid #EBE9F1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #5E5873;
}

.card-subtitle {
  font-size: 13px;
  color: #6E6B7B;
}
```

#### Card with Actions
```css
.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions .btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6E6B7B;
  transition: all 0.2s;
}

.card-actions .btn-icon:hover {
  background: #F3F2F7;
  color: #7367F0;
}
```

### 6.3 Forms

#### Text Input (with Lucide Icons)
```tsx
import { Search, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

// Input with left icon
<div className="input-with-icon">
  <Mail size={18} className="input-icon" strokeWidth={1.5} />
  <input type="email" className="form-input" placeholder="อีเมล" />
</div>

// Input with right icon (password toggle)
<div className="input-with-icon right">
  <input type={showPassword ? "text" : "password"} className="form-input" placeholder="รหัสผ่าน" />
  <button onClick={() => setShowPassword(!showPassword)} className="input-icon-btn">
    {showPassword ? <Eye size={18} strokeWidth={1.5} /> : <EyeOff size={18} strokeWidth={1.5} />}
  </button>
</div>

// Search input
<div className="input-with-icon">
  <Search size={18} className="input-icon" strokeWidth={1.5} />
  <input type="text" className="form-input" placeholder="ค้นหา..." />
</div>
```

```css
.form-input {
  width: 100%;
  height: 44px;
  padding: 10px 16px;
  border: 1px solid #D8D6DE;
  border-radius: 6px;
  font-size: 16px;
  color: #5E5873;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.5;
}

.form-input:focus {
  border-color: #7367F0;
  box-shadow: 0 0 0 3px rgba(115, 103, 240, 0.1);
  outline: none;
}

.form-input::placeholder {
  color: #B9B9C3;
}

/* Input with Icon */
.input-with-icon {
  position: relative;
}

.input-with-icon .form-input {
  padding-left: 44px;
}

.input-with-icon.right .form-input {
  padding-left: 16px;
  padding-right: 44px;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #B9B9C3;
  pointer-events: none;
}

.input-icon-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #6E6B7B;
  cursor: pointer;
  border-radius: 4px;
}

.input-icon-btn:hover {
  background: #F3F2F7;
  color: #7367F0;
}
```

#### Form Label
```css
.form-label {
  display: block;
  font-size: 15px; /* Increased for Thai */
  font-weight: 500;
  color: #5E5873;
  margin-bottom: 8px;
  line-height: 1.5;
}

.form-label-required::after {
  content: ' *'; /* Thai uses space before asterisk */
  color: #EA5455;
}

/* Thai placeholder styling */
.form-input::placeholder {
  color: #B9B9C3;
  font-size: 15px;
}
```

#### Select Dropdown (with Lucide Chevron)
```tsx
import { ChevronDown } from 'lucide-react';

<div className="select-wrapper">
  <select className="form-input form-select">
    <option>เลือกตัวเลือก</option>
  </select>
  <ChevronDown size={18} className="select-icon" strokeWidth={2} />
</div>
```

```css
.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  padding-right: 40px;
  cursor: pointer;
}

.select-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #6E6B7B;
  pointer-events: none;
}
```

#### Checkbox & Radio
```css
.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-check-input {
  width: 18px;
  height: 18px;
  border: 2px solid #D8D6DE;
  border-radius: 4px;
  transition: all 0.2s;
}

.form-check-input:checked {
  background: #7367F0;
  border-color: #7367F0;
}
```

### 6.4 Tables

#### Standard Table
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  padding: 14px 18px; /* Slightly increased */
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  /* Note: Removed text-transform: uppercase - Thai has no case */
  letter-spacing: 0;
  color: #6E6B7B;
  background: #F8F7FA;
  border-bottom: 1px solid #EBE9F1;
  line-height: 1.5;
}

.table tbody td {
  padding: 16px 18px;
  font-size: 15px; /* Increased for Thai */
  color: #6E6B7B;
  border-bottom: 1px solid #EBE9F1;
  line-height: 1.6;
}

.table tbody tr:hover {
  background: #FAFAFA;
}
```

#### Data Table Features
- Sortable headers with chevron icons
- Row selection with checkboxes
- Avatar + name column pattern
- Status badges
- Action buttons (edit, delete, view)
- Pagination at bottom

### 6.5 Badges & Chips

#### Status Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-active {
  background: #E5F8ED;
  color: #28C76F;
}

.badge-pending {
  background: #FFF3E8;
  color: #FF9F43;
}

.badge-inactive {
  background: #F3F2F7;
  color: #82868B;
}
```

#### Chips/Tags
```css
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  background: #E9E7FD;
  color: #7367F0;
}
```

### 6.6 Avatars

#### Sizes
| Size | Dimensions | Usage |
|------|------------|-------|
| xs | 24px | Lists, compact views |
| sm | 32px | Tables, cards |
| md | 40px | Headers, profiles |
| lg | 64px | Profile pages |
| xl | 96px | Large profiles |

```css
.avatar {
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.avatar-group {
  display: flex;
}

.avatar-group .avatar {
  margin-left: -8px;
}

.avatar-group .avatar:first-child {
  margin-left: 0;
}
```

### 6.7 Alerts (with Lucide Icons)

```tsx
import { 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  X 
} from 'lucide-react';

// Alert Component
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ variant, title, children, onClose }) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle
  };
  
  const Icon = icons[variant];
  
  return (
    <div className={`alert alert-${variant}`}>
      <Icon size={20} strokeWidth={2} className="alert-icon" />
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="alert-close">
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};

// Usage
<Alert variant="success" title="สำเร็จ">
  บันทึกข้อมูลเรียบร้อยแล้ว
</Alert>

<Alert variant="error" onClose={() => {}}>
  เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
</Alert>
```

```css
.alert {
  display: flex;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 6px;
  gap: 12px;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.alert-message {
  line-height: 1.6;
}

.alert-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  border-radius: 4px;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

.alert-info {
  background: #E0F7FA;
  color: #00838F;
  border-left: 4px solid #00CFE8;
}

.alert-success {
  background: #E5F8ED;
  color: #1B5E20;
  border-left: 4px solid #28C76F;
}

.alert-warning {
  background: #FFF3E8;
  color: #E65100;
  border-left: 4px solid #FF9F43;
}

.alert-error {
  background: #FCE5E6;
  color: #C62828;
  border-left: 4px solid #EA5455;
}

### 6.8 Tabs (with Lucide Icons)

```tsx
import { User, Lock, Bell, Link2 } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const tabs: Tab[] = [
  { id: 'account', label: 'บัญชี', icon: User },
  { id: 'security', label: 'ความปลอดภัย', icon: Lock },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
  { id: 'connections', label: 'เชื่อมต่อ', icon: Link2 },
];

// Usage
<div className="tabs">
  {tabs.map((tab) => {
    const Icon = tab.icon;
    return (
      <button
        key={tab.id}
        className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
      >
        <Icon size={18} strokeWidth={1.5} />
        <span>{tab.label}</span>
      </button>
    );
  })}
</div>
```

```css
.tabs {
  display: flex;
  border-bottom: 1px solid #EBE9F1;
  gap: 4px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #6E6B7B;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
}

.tab:hover {
  color: #7367F0;
  background: #F8F7FA;
}

.tab-active {
  color: #7367F0;
  border-bottom-color: #7367F0;
  background: transparent;
}

/* Icon-only tabs */
.tabs-icon-only .tab {
  padding: 12px;
}

.tabs-icon-only .tab span {
  display: none;
}

### 6.9 Pagination

```css
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #6E6B7B;
  background: transparent;
  border: 1px solid #EBE9F1;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #F8F7FA;
}

.page-btn-active {
  background: #7367F0;
  color: white;
  border-color: #7367F0;
}
```

### 6.10 Modal/Dialog

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(34, 41, 47, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(34, 41, 47, 0.2);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #EBE9F1;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #EBE9F1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## 7. Layout Patterns

### 7.1 Dashboard Grid
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  padding: 24px;
}

/* Common Card Sizes */
.card-full { grid-column: span 12; }
.card-half { grid-column: span 6; }
.card-third { grid-column: span 4; }
.card-quarter { grid-column: span 3; }
.card-two-thirds { grid-column: span 8; }
```

### 7.2 Page Layout Structure
```
┌─────────────────────────────────────────────┐
│  Sidebar (260px)  │  Header (64px)          │
│                   ├─────────────────────────┤
│                   │                         │
│                   │  Content Area           │
│                   │  (grid/flex layout)     │
│                   │                         │
│                   │                         │
└─────────────────────────────────────────────┘
```

### 7.3 Sidebar Navigation (with Lucide Icons)
```tsx
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// Navigation Item Component
interface NavItemProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
  expanded?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label, 
  active, 
  hasSubmenu,
  expanded 
}) => (
  <div className={`nav-item ${active ? 'nav-item-active' : ''}`}>
    <Icon size={20} strokeWidth={1.5} />
    <span className="nav-label">{label}</span>
    {hasSubmenu && (
      expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
    )}
  </div>
);

// Usage
<nav className="sidebar-nav">
  <NavItem icon={LayoutDashboard} label="แดชบอร์ด" active />
  <NavItem icon={Users} label="ผู้ใช้งาน" />
  <NavItem icon={FileText} label="รายงาน" hasSubmenu expanded />
  <NavItem icon={MessageSquare} label="ข้อความ" />
  <NavItem icon={Calendar} label="ปฏิทิน" />
  <NavItem icon={Settings} label="ตั้งค่า" />
</nav>
```

```css
.sidebar {
  width: 260px;
  background: #2F3349;
  color: #B5B5BE;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.5;
}

.nav-item svg {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-item:hover {
  color: white;
  background: rgba(255,255,255,0.05);
}

.nav-item-active {
  color: white;
  background: linear-gradient(90deg, #7367F0 0%, rgba(115, 103, 240, 0) 100%);
  border-left: 3px solid #7367F0;
}

/* Collapsed sidebar: show icons only */
.sidebar-collapsed .nav-label,
.sidebar-collapsed .nav-item svg:last-child {
  display: none;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 14px;
}

### 7.4 Header
```css
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #EBE9F1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-search {
  width: 320px;
  position: relative;
}

.header-search input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #EBE9F1;
  border-radius: 6px;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

---

## 8. Chart & Data Visualization

### Chart Colors
```css
--chart-primary: #7367F0;
--chart-secondary: #00CFE8;
--chart-success: #28C76F;
--chart-warning: #FF9F43;
--chart-danger: #EA5455;
--chart-info: #B5B5BE;
```

### Chart Card Pattern
```css
.chart-card {
  background: white;
  border-radius: 6px;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.chart-value {
  font-size: 28px;
  font-weight: 600;
  color: #5E5873;
}

.chart-variation {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
}

.chart-variation.positive {
  background: #E5F8ED;
  color: #28C76F;
}

.chart-variation.negative {
  background: #FCE5E6;
  color: #EA5455;
}
```

---

## 9. Authentication Pages

### Login/Register Card
```css
.auth-card {
  background: white;
  border-radius: 8px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(34, 41, 47, 0.1);
}

.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}

.auth-title {
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #6E6B7B;
  text-align: center;
  margin-bottom: 24px;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: #B9B9C3;
  font-size: 13px;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #EBE9F1;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid #EBE9F1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6E6B7B;
  transition: all 0.2s;
}

.social-btn:hover {
  border-color: #7367F0;
  color: #7367F0;
}
```

---

## 10. Error Pages

### 404/401 Page
```css
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #5E5873;
  line-height: 1;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #5E5873;
  margin: 16px 0 8px;
}

.error-message {
  font-size: 14px;
  color: #6E6B7B;
  margin-bottom: 24px;
}
```

---

## 11. Form Wizard Pattern

```css
.wizard-steps {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 32px;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.wizard-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 100%;
  width: 40px;
  height: 2px;
  background: #EBE9F1;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #F3F2F7;
  color: #B9B9C3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-active .step-icon {
  background: #7367F0;
  color: white;
}

.step-completed .step-icon {
  background: #28C76F;
  color: white;
}

.step-label {
  font-size: 13px;
  color: #6E6B7B;
  font-weight: 500;
}

.step-active .step-label {
  color: #7367F0;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #EBE9F1;
}
```

---

## 12. Animations & Transitions

### Default Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Hover Effects
```css
/* Button Hover */
.btn {
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(115, 103, 240, 0.25);
}

/* Card Hover */
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(34, 41, 47, 0.12);
}

/* Link Hover */
a {
  transition: color 0.2s;
}
```

### Modal Transitions
```css
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.2s, transform 0.2s;
}

.modal-exit {
  opacity: 1;
}

.modal-exit-active {
  opacity: 0;
  transition: opacity 0.2s;
}
```

---

## 13. Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| xs | < 576px | Mobile phones |
| sm | >= 576px | Large phones |
| md | >= 768px | Tablets |
| lg | >= 992px | Laptops |
| xl | >= 1200px | Desktops |
| xxl | >= 1400px | Large screens |

### Responsive Patterns
```css
/* Sidebar Collapse */
@media (max-width: 991px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar-open .sidebar {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
}

/* Grid Adjustments */
@media (max-width: 767px) {
  .card-half,
  .card-third,
  .card-quarter {
    grid-column: span 12;
  }
}
```

---

## 14. Icons

### Icon Library
- **Primary**: [Lucide Icons](https://lucide.dev/) (SVG-based, 24px default)
- **Secondary**: Custom SVGs or Lucide Lab for extended icons

### Installation
```bash
# npm
npm install lucide-react

# or for vanilla JS
npm install lucide
```

### React Usage
```tsx
import { Home, User, Settings, Bell, Search } from 'lucide-react';

// Basic usage
<Home size={20} />

// With custom styling
<User size={24} strokeWidth={1.5} className="text-primary" />

// Icon with button
<button className="icon-btn">
  <Settings size={20} />
</button>
```

### Next.js Usage
```tsx
import { icons } from 'lucide-react';

// Dynamic icon rendering
const IconComponent = ({ name, ...props }: { name: string }) => {
  const LucideIcon = icons[name as keyof typeof icons];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};
```

### Icon Sizes (Lucide)
| Size | Dimensions | strokeWidth | Usage |
|------|------------|-------------|-------|
| xs | 14px | 2 | Inline text, badges |
| sm | 16px | 2 | Buttons, compact UI |
| md | 20px | 2 | Standard usage |
| lg | 24px | 1.5 | Navigation, headers |
| xl | 32px | 1.5 | Feature icons, empty states |
| 2xl | 48px | 1 | Hero icons, illustrations |

### Lucide Stroke Width Guidelines
```tsx
// Small icons (14-20px): strokeWidth 2
<Bell size={16} strokeWidth={2} />

// Medium icons (24px): strokeWidth 1.5
<Home size={24} strokeWidth={1.5} />

// Large icons (32px+): strokeWidth 1.5 or 1
<Settings size={48} strokeWidth={1.5} />
```

### Icon Button Pattern (React + Lucide)
```tsx
// IconButton Component
interface IconButtonProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled' | 'outline';
  onClick?: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  size = 'md',
  variant = 'ghost',
  onClick 
}) => {
  const sizeMap = { sm: 16, md: 20, lg: 24 };
  
  return (
    <button className={`icon-btn icon-btn-${variant} icon-btn-${size}`} onClick={onClick}>
      <Icon size={sizeMap[size]} strokeWidth={size === 'sm' ? 2 : 1.5} />
    </button>
  );
};

// Usage
import { Pencil, Trash2, Eye } from 'lucide-react';

<IconButton icon={Pencil} size="sm" />
<IconButton icon={Trash2} size="md" variant="outline" />
<IconButton icon={Eye} size="lg" variant="filled" />
```

```css
/* Icon Button Styles */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6E6B7B;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #F3F2F7;
  color: #7367F0;
}

.icon-btn-sm { width: 32px; height: 32px; }
.icon-btn-md { width: 36px; height: 36px; }
.icon-btn-lg { width: 44px; height: 44px; }

.icon-btn-filled {
  background: #7367F0;
  color: white;
}

.icon-btn-filled:hover {
  background: #5E50EE;
  color: white;
}

.icon-btn-outline {
  border: 1px solid #D8D6DE;
  background: white;
}
```

---

## 15. Accessibility Guidelines

### Focus States
```css
/* Visible focus for keyboard navigation */
:focus-visible {
  outline: 2px solid #7367F0;
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #7367F0;
  color: white;
  padding: 8px;
  z-index: 10000;
}

.skip-link:focus {
  top: 0;
}
```

### Color Contrast
- Text on light backgrounds: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Clear focus indicators

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 16. Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | 0 | Default content |
| Dropdown | 100 | Dropdown menus |
| Sticky | 200 | Sticky headers |
| Modal | 1000 | Modal overlays |
| Tooltip | 1100 | Tooltips |
| Toast | 1200 | Toast notifications |
| Loading | 1300 | Full-screen loaders |

---

## 17. File Upload Pattern (with Lucide)

```tsx
import { Upload, File, X, Image as ImageIcon, FileText } from 'lucide-react';

const FileUpload = () => {
  return (
    <div className="file-upload">
      <Upload size={48} strokeWidth={1} className="file-upload-icon" />
      <p className="file-upload-text">
        <strong>คลิกเพื่ออัปโหลด</strong> หรือลากไฟล์มาวาง
      </p>
      <p className="file-upload-hint">
        รองรับไฟล์ PDF, JPG, PNG (สูงสุด 10MB)
      </p>
    </div>
  );
};

// File preview with icons
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf') return FileText;
  return File;
};

const FilePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const Icon = getFileIcon(file.type);
  
  return (
    <div className="file-preview">
      <Icon size={40} strokeWidth={1.5} className="file-preview-icon" />
      <div className="file-preview-info">
        <div className="file-preview-name">{file.name}</div>
        <div className="file-preview-size">{(file.size / 1024).toFixed(0)} KB</div>
      </div>
      <button onClick={onRemove} className="file-preview-remove">
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  );
};
```

```css
.file-upload {
  border: 2px dashed #D8D6DE;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.file-upload:hover,
.file-upload.dragover {
  border-color: #7367F0;
  background: #F8F7FA;
}

.file-upload-icon {
  margin: 0 auto 16px;
  color: #B9B9C3;
}

.file-upload-text {
  font-size: 15px;
  color: #6E6B7B;
  margin-bottom: 8px;
}

.file-upload-text strong {
  color: #7367F0;
}

.file-upload-hint {
  font-size: 13px;
  color: #B9B9C3;
}

/* File Preview */
.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #EBE9F1;
  border-radius: 6px;
  margin-top: 12px;
}

.file-preview-icon {
  color: #7367F0;
  flex-shrink: 0;
}

.file-preview-info {
  flex: 1;
  min-width: 0;
}

.file-preview-name {
  font-size: 14px;
  color: #5E5873;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-preview-size {
  font-size: 12px;
  color: #B9B9C3;
}

.file-preview-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #B9B9C3;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.file-preview-remove:hover {
  background: #FCE5E6;
  color: #EA5455;
}
```

---

## 18. Timeline Pattern (with Lucide)

```tsx
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare, 
  AlertCircle 
} from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  variant: 'primary' | 'success' | 'warning' | 'info';
}

const timelineItems: TimelineItem[] = [
  {
    id: '1',
    title: 'ใบเสร็จรับเงิน 12 ใบ',
    description: 'ชำระเงินเรียบร้อย',
    time: '12 นาทีที่แล้ว',
    icon: CheckCircle2,
    variant: 'success'
  },
  {
    id: '2',
    title: 'ประชุมลูกค้า',
    description: 'ประชุมกับคุณสมชาย @10:15น.',
    time: '45 นาทีที่แล้ว',
    icon: MessageSquare,
    variant: 'primary'
  },
  {
    id: '3',
    title: 'สร้างโปรเจกต์ใหม่',
    description: 'เพิ่มสมาชิก 6 คน',
    time: '2 วันที่แล้ว',
    icon: FileText,
    variant: 'info'
  }
];

// Usage
<div className="timeline">
  {timelineItems.map((item) => {
    const Icon = item.icon;
    return (
      <div key={item.id} className={`timeline-item timeline-${item.variant}`}>
        <div className="timeline-icon">
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="timeline-content">
          <div className="timeline-title">{item.title}</div>
          <div className="timeline-description">{item.description}</div>
          <div className="timeline-time">{item.time}</div>
        </div>
      </div>
    );
  })}
</div>
```

```css
.timeline {
  position: relative;
  padding-left: 28px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 0;
  width: 2px;
  background: #EBE9F1;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-icon {
  position: absolute;
  left: -24px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 2px solid #7367F0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7367F0;
}

.timeline-success .timeline-icon {
  border-color: #28C76F;
  color: #28C76F;
}

.timeline-warning .timeline-icon {
  border-color: #FF9F43;
  color: #FF9F43;
}

.timeline-info .timeline-icon {
  border-color: #00CFE8;
  color: #00CFE8;
}

.timeline-content {
  background: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.timeline-title {
  font-weight: 500;
  color: #5E5873;
  margin-bottom: 4px;
}

.timeline-description {
  font-size: 14px;
  color: #6E6B7B;
  margin-bottom: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #B9B9C3;
}
```

---

## 19. Search & Filter Patterns

### Global Search (with Lucide)
```tsx
import { Search, Command, X } from 'lucide-react';

// Search Component
const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  
  return (
    <div className="global-search">
      <Search size={18} className="global-search-icon" strokeWidth={1.5} />
      <input
        type="text"
        placeholder="ค้นหา..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query ? (
        <button className="global-search-clear" onClick={() => setQuery('')}>
          <X size={16} strokeWidth={2} />
        </button>
      ) : (
        <kbd className="global-search-shortcut">
          <Command size={12} strokeWidth={2} />
          <span>K</span>
        </kbd>
      )}
    </div>
  );
};
```

```css
.global-search {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.global-search input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #EBE9F1;
  border-radius: 6px;
  font-size: 15px;
  background: #F8F7FA;
  transition: all 0.2s;
}

.global-search input:focus {
  background: white;
  border-color: #7367F0;
  box-shadow: 0 0 0 3px rgba(115, 103, 240, 0.1);
  outline: none;
}

.global-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #B9B9C3;
}

.global-search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #EBE9F1;
  color: #6E6B7B;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.global-search-clear:hover {
  background: #D8D6DE;
  color: #5E5873;
}

.global-search-shortcut {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: white;
  border: 1px solid #EBE9F1;
  border-radius: 4px;
  font-size: 11px;
  color: #B9B9C3;
}

.global-search-shortcut svg {
  margin-top: 1px;
}

### Filter Chips
```css
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 0;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #F3F2F7;
  border-radius: 6px;
  font-size: 13px;
  color: #5E5873;
}

.filter-chip-remove {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip-remove:hover {
  background: rgba(234, 84, 85, 0.1);
  color: #EA5455;
}
```

---

## 20. Dark Mode Considerations

### Color Inversions
```css
[data-theme="dark"] {
  --color-bg-body: #161D31;
  --color-bg-card: #283046;
  --color-text-primary: #D0D2D6;
  --color-text-secondary: #B4B7BD;
  --color-border: #3B4253;
  
  /* Adjust primary for dark background */
  --color-primary: #8E85F5;
  --color-primary-light: rgba(115, 103, 240, 0.15);
}
```

---

---

## Appendix A: Lucide Icon Reference

### Common Icons by Category

#### Navigation
| Icon | Import | Usage |
|------|--------|-------|
| 🏠 | `Home` | Dashboard, home page |
| 📊 | `LayoutDashboard` | Dashboard |
| 📋 | `ClipboardList` | Lists, reports |
| 📁 | `Folder` | Folders, categories |
| ⚙️ | `Settings` | Settings |
| 🔙 | `ArrowLeft` | Back navigation |
| 🔜 | `ArrowRight` | Next, forward |
| ⬆️ | `ChevronUp` | Expand up |
| ⬇️ | `ChevronDown` | Dropdown, expand |
| ➡️ | `ChevronRight` | Submenu indicator |

#### Actions
| Icon | Import | Usage |
|------|--------|-------|
| ➕ | `Plus` | Add, create |
| ✏️ | `Pencil` | Edit |
| 🗑️ | `Trash2` | Delete |
| 👁️ | `Eye` | View |
| 👁️‍🗨️ | `EyeOff` | Hide password |
| 💾 | `Save` | Save |
| 📥 | `Download` | Download |
| 📤 | `Upload` | Upload |
| 🔄 | `RefreshCw` | Refresh |
| ♻️ | `RotateCcw` | Undo |
| 🔍 | `Search` | Search |
| ✕ | `X` | Close, remove |
| ✓ | `Check` | Check, confirm |
| ☑️ | `CheckCircle2` | Success, completed |

#### Communication
| Icon | Import | Usage |
|------|--------|-------|
| 🔔 | `Bell` | Notifications |
| 💬 | `MessageSquare` | Messages, chat |
| ✉️ | `Mail` | Email |
| 📞 | `Phone` | Phone |
| 👤 | `User` | User profile |
| 👥 | `Users` | Multiple users |

#### Status & Feedback
| Icon | Import | Usage |
|------|--------|-------|
| ℹ️ | `Info` | Information |
| ⚠️ | `AlertTriangle` | Warning |
| 🚫 | `XCircle` | Error, blocked |
| ⏳ | `Clock` | Pending, time |
| 🔄 | `Loader2` | Loading spinner |
| ❓ | `HelpCircle` | Help |

#### Files & Media
| Icon | Import | Usage |
|------|--------|-------|
| 📄 | `File` | Generic file |
| 📝 | `FileText` | Text document |
| 🖼️ | `Image` | Image |
| 📎 | `Paperclip` | Attachment |
| 📁 | `FolderOpen` | Open folder |
| 📥 | `Download` | Download |
| 📤 | `Upload` | Upload |

### Icon Component Patterns

```tsx
// Dynamic icon by name
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<LucideIcons.LucideProps>;
  return Icon ? <Icon {...props} /> : null;
};

// Usage
<DynamicIcon name="Home" size={24} />
<DynamicIcon name="Settings" size={20} strokeWidth={1.5} />
```

### Lucide Props Reference
```tsx
interface LucideProps {
  size?: number;        // Icon size (default: 24)
  strokeWidth?: number; // Stroke width (default: 2)
  color?: string;       // Stroke color
  className?: string;   // CSS classes
  absoluteStrokeWidth?: boolean; // Consistent stroke width at all sizes
}
```

---

## Appendix B: Thai-Specific Component Notes

### Button Labels
Thai button labels are often shorter than English equivalents:

| English | Thai (Suggestion) |
|---------|-------------------|
| Submit | บันทึก / ส่ง |
| Cancel | ยกเลิก |
| Save | บันทึก |
| Edit | แก้ไข |
| Delete | ลบ |
| Create | สร้าง |
| Search | ค้นหา |
| Filter | กรอง |

### Date/Number Formatting
```css
/* Thai date format: DD/MM/YYYY */
.thai-date {
  font-feature-settings: "tnum" 1;
}

/* Thai number can use either Arabic or Thai numerals */
.thai-numerals {
  font-variant-numeric: tabular-nums;
}
```

### Text Alignment
```css
/* Thai works well with left alignment */
.thai-content {
  text-align: left;
  line-height: 1.7;
  word-break: keep-all;
  overflow-wrap: break-word;
  hyphens: none; /* Thai doesn't use hyphenation */
}
```

### Layout Adjustments for Thai
```css
/* Increase min-width for Thai menu items */
.thai-menu-item {
  min-width: 160px; /* Wider than English */
  white-space: nowrap;
}

/* Badge adjustments */
.thai-badge {
  font-size: 12px;
  padding: 4px 10px;
  /* Thai badges need more horizontal padding */
}
```

---

*This design system is derived from the Vuexy Vue.js Admin Template v3 by Pixinvent.*

**Adaptations made:**
- 🇹🇭 Thai language support with Noto Sans Thai font
- 📐 Adjusted typography scale (16px body, increased line heights)
- 🔣 Lucide SVG icons throughout all components
- 🎨 Thai-appropriate text patterns (no text-transform, proper word breaking)
