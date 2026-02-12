# 10/10 Quality Assurance Checklist

## Complete Verification Guide for Premium Design

Use this checklist to verify every aspect of the design before release.

---

## 1. Visual Design Checklist

### Color System ✅

- [ ] **All colors use HSL format** (no hex, no RGB)
- [ ] **Brand colors** defined with 10-step scale (50-900)
- [ ] **Semantic colors** (success, warning, danger, info) defined
- [ ] **Gray scale** has 11 steps (0-950) with cool tone
- [ ] **No hardcoded colors** in component files
- [ ] **CSS custom properties** used for all colors
- [ ] **Alpha values** use HSL syntax: `hsl(var(--hue) s% l% / 0.5)`

**Verification Command:**
```bash
# Check for non-HSL colors
grep -r "#[0-9a-fA-F]\{3,6\}" frontend/components --include="*.tsx" --include="*.css"
grep -r "rgb(" frontend/components --include="*.tsx" --include="*.css"
```

### Spacing System ✅

- [ ] **4px base grid** used consistently
- [ ] **No arbitrary values** (no `p-[17px]`)
- [ ] **Spacing scale** defined: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40
- [ ] **Consistent padding** within component types
- [ ] **Consistent gaps** in layouts

**Verification:**
```bash
# Check for arbitrary values
grep -r "\[.*px\]" frontend/components --include="*.tsx" | grep -v "custom"
```

### Typography ✅

- [ ] **Type scale** uses Major Third (1.25) ratio
- [ ] **Font sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl defined
- [ ] **Line heights**: tight (1.25), normal (1.5), relaxed (1.625)
- [ ] **Font weights**: 400, 500, 600, 700 used
- [ ] **Letter spacing**: tight (-0.025em), normal, wide (0.025em)
- [ ] **Thai font** (Noto Sans Thai) properly loaded
- [ ] **System font stack** as fallback

### Border Radius ✅

- [ ] **Radius scale**: none, xs, sm, md, lg, xl, 2xl, 3xl, full
- [ ] **Buttons**: rounded-xl (16px)
- [ ] **Inputs**: rounded-xl (16px)
- [ ] **Cards**: rounded-2xl (20px)
- [ ] **Avatars**: rounded-full or rounded-xl
- [ ] **Badges**: rounded-full

### Shadows ✅

- [ ] **8-layer system** implemented:
  - Layer 0: None
  - Layer 1: XS - 0 1px 2px
  - Layer 2: SM - 0 1px 3px
  - Layer 3: MD - 0 4px 6px
  - Layer 4: LG - 0 10px 15px
  - Layer 5: XL - 0 20px 25px
  - Layer 6: 2XL - 0 25px 50px
  - Layer 7: Premium - 0 32px 64px
- [ ] **Glow shadows** defined for brand color
- [ ] **Colored shadows** for buttons (e.g., `shadow-brand-500/20`)
- [ ] **Consistent usage** per component type

---

## 2. Component Quality Checklist

### Button Component ✅

| State | Requirement | Verified |
|-------|-------------|----------|
| Rest | Correct background, text color | ☐ |
| Hover | Lift -1px, shadow increase, color shift | ☐ |
| Active | Scale 0.98, darker color | ☐ |
| Focus | Ring with offset, visible | ☐ |
| Disabled | Opacity 0.5, no-pointer-events | ☐ |
| Loading | Spinner, text hidden | ☐ |

**Interactions:**
- [ ] Click feedback immediate
- [ ] Hover transition 200ms ease-out
- [ ] Active transition 100ms
- [ ] Loading spinner rotates smoothly

### Card Component ✅

| Variant | Hover Effect | Verified |
|---------|--------------|----------|
| Default | Shadow elevate, border darken | ☐ |
| Elevated | Shadow increase significantly | ☐ |
| Glass | Background opacity increase | ☐ |
| Interactive | Lift + shadow + optional glow | ☐ |

### Input Component ✅

| State | Visual | Verified |
|-------|--------|----------|
| Rest | Border gray-300 | ☐ |
| Hover | Border gray-400 | ☐ |
| Focus | Border brand-500, ring brand-500/20 | ☐ |
| Error | Border red-500, shake animation | ☐ |
| Success | Border green-500 | ☐ |
| Disabled | Opacity 0.5, bg gray-50 | ☐ |

### Modal Component ✅

- [ ] **Backdrop**: Blur + fade in
- [ ] **Content**: Scale from 0.96 + fade in
- [ ] **Close**: Click backdrop, press Escape
- [ ] **Focus trap**: Tab cycles within modal
- [ ] **Body scroll**: Locked when open
- [ ] **Scrollbar**: Padding compensation

### Avatar Component ✅

- [ ] **Image loading**: Fallback on error
- [ ] **Fallback**: Initials with gradient
- [ ] **Status indicator**: Positioned correctly
- [ ] **Sizes**: xs, sm, md, lg, xl, 2xl all work

---

## 3. Animation Quality Checklist

### Performance ✅

- [ ] **60fps** on all animations
- [ ] **GPU accelerated** (transform, opacity only)
- [ ] **No layout thrashing**
- [ ] **will-change** used sparingly
- [ ] **Reduced motion** supported

**Test:**
```javascript
// In DevTools console
// Check for performance issues
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 16.67) {
      console.warn('Slow frame:', entry.duration);
    }
  }
});
observer.observe({ entryTypes: ['measure'] });
```

### Animation Presence ✅

| Element | Hover | Active | Enter | Exit |
|---------|-------|--------|-------|------|
| Button | Lift + shadow | Scale 0.98 | - | - |
| Card | Lift + shadow | Scale 0.995 | Fade in up | - |
| Input | - | - | - | - |
| Modal | - | - | Scale + fade | Scale + fade |
| Tooltip | - | - | Fade + scale | Fade |
| Toast | - | - | Slide in | Fade |
| Page content | - | - | Fade in up | - |

### Timing ✅

- [ ] **Fast (150ms)**: Micro-interactions, hovers
- [ ] **Normal (200-250ms)**: State changes, focus
- [ ] **Slow (300-350ms)**: Page transitions, modals
- [ ] **Slower (500ms)**: Complex animations

### Easing ✅

- [ ] **Linear**: Continuous animations (spinners)
- [ ] **Ease-out**: Enter animations
- [ ] **Ease-in**: Exit animations
- [ ] **Spring (cubic-bezier)**: Modals, toasts
- [ ] **Bounce**: Playful elements (badges)

---

## 4. Accessibility Checklist

### Keyboard Navigation ✅

- [ ] **Tab order** is logical
- [ ] **Focus visible** on all interactive elements
- [ ] **Enter/Space** activates buttons
- [ ] **Escape** closes modals, dropdowns
- [ ] **Arrow keys** navigate within components (tabs, dropdowns)
- [ ] **Home/End** works in lists
- [ ] **Skip to content** link present

**Test:**
```bash
# Navigate entire app using only keyboard
# Should be able to:
# - Access all pages
# - Use all features
# - See focus indicators
```

### Screen Readers ✅

- [ ] **Alt text** on all images
- [ ] **ARIA labels** on icon-only buttons
- [ ] **ARIA expanded** on dropdowns
- [ ] **ARIA selected** on tabs
- [ ] **ARIA hidden** on decorative elements
- [ ] **Live regions** for dynamic content
- [ ] **Landmarks** (main, nav, aside)

**Test with:**
- NVDA (Windows)
- VoiceOver (Mac)
- ChromeVox (Chrome extension)

### Color Contrast ✅

| Element | Minimum Ratio | Verified |
|---------|--------------|----------|
| Body text | 4.5:1 | ☐ |
| Large text (18px+) | 3:1 | ☐ |
| UI components | 3:1 | ☐ |
| Focus indicators | 3:1 | ☐ |

**Tool:** Use WebAIM Contrast Checker

### Reduced Motion ✅

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

- [ ] **Implemented** in globals.css
- [ ] **Tested** with OS reduced motion setting
- [ ] **Content still accessible** without animations

---

## 5. Responsive Design Checklist

### Breakpoints ✅

| Breakpoint | Width | Verified |
|------------|-------|----------|
| sm | 640px | ☐ |
| md | 768px | ☐ |
| lg | 1024px | ☐ |
| xl | 1280px | ☐ |
| 2xl | 1536px | ☐ |

### Mobile Experience ✅

- [ ] **Touch targets** minimum 44x44px
- [ ] **Font sizes** readable on small screens
- [ ] **No horizontal scroll**
- [ ] **Navigation** accessible via hamburger menu
- [ ] **Modals** full-screen on mobile
- [ ] **Tables** horizontally scrollable
- [ ] **Images** scale appropriately

### Testing Devices ✅

- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1440px+)
- [ ] Large desktop (1920px+)

---

## 6. Performance Checklist

### Loading Performance ✅

| Metric | Target | Verified |
|--------|--------|----------|
| First Contentful Paint (FCP) | < 1.8s | ☐ |
| Largest Contentful Paint (LCP) | < 2.5s | ☐ |
| Time to Interactive (TTI) | < 3.8s | ☐ |
| Cumulative Layout Shift (CLS) | < 0.1 | ☐ |

### Bundle Size ✅

- [ ] **CSS**: < 50KB gzipped
- [ ] **JS Components**: Tree-shakeable
- [ ] **Images**: WebP format where possible
- [ ] **Fonts**: Subsetted, woff2 format

### Runtime Performance ✅

- [ ] **No memory leaks**
- [ ] **Event listeners** cleaned up
- [ ] **Intersection Observer** for lazy loading
- [ ] **RequestAnimationFrame** for animations
- [ ] **Debounced** resize/scroll handlers

---

## 7. Cross-Browser Checklist

### Browser Support ✅

| Browser | Version | Verified |
|---------|---------|----------|
| Chrome | Latest + 2 versions | ☐ |
| Firefox | Latest + 2 versions | ☐ |
| Safari | Latest + 2 versions | ☐ |
| Edge | Latest + 2 versions | ☐ |

### Feature Detection ✅

- [ ] **CSS Grid** with flexbox fallback
- [ ] **Backdrop filter** with solid fallback
- [ ] **Custom properties** with static fallback
- [ ] **Intersection Observer** polyfilled if needed

---

## 8. Code Quality Checklist

### TypeScript ✅

- [ ] **No `any` types**
- [ ] **All props typed**
- [ ] **Return types** on functions
- [ ] **Strict mode** enabled
- [ ] **No errors** on build

### Component Structure ✅

```typescript
// Correct pattern:
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    // Implementation
    return <button ref={ref} {...props}>{children}</button>;
  }
);
Button.displayName = 'Button';
```

- [ ] **Forward ref** on all interactive components
- [ ] **Display name** set
- [ ] **Props spread** at end
- [ ] **HTML attributes** extended properly
- [ ] **ClassName** merged with cn()

### CSS Organization ✅

- [ ] **No inline styles**
- [ ] **Tailwind classes** preferred
- [ ] **Custom CSS** in globals.css only
- [ ] **No !important** (except overrides)
- [ ] **Logical properties** used (padding-inline)

---

## 9. Final Polish Checklist

### Visual Polish ✅

- [ ] **No broken images**
- [ ] **No layout shifts** on load
- [ ] **Loading states** on all async operations
- [ ] **Error states** on all forms
- [ ] **Empty states** for lists
- [ ] **Success feedback** on actions

### Content ✅

- [ ] **No lorem ipsum**
- [ ] **Consistent terminology**
- [ ] **Proper capitalization**
- [ ] **No typos**
- [ ] **Thai text** renders correctly

### Edge Cases ✅

- [ ] **Very long text** handled
- [ ] **Very short text** handled
- [ ] **No data** states
- [ ] **Error data** handled gracefully
- [ ] **Slow network** loading states
- [ ] **Offline** state handled

---

## 10. Sign-Off

### Developer Sign-Off

- [ ] All checklist items verified
- [ ] Code reviewed by peer
- [ ] No console errors
- [ ] Build passes
- [ ] Tests pass

### Designer Sign-Off

- [ ] Matches Figma/design specs
- [ ] Animations approved
- [ ] Colors match brand
- [ ] Typography approved

### QA Sign-Off

- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Accessibility audited
- [ ] Performance audited

---

## Quick Verification Commands

```bash
# Check for hardcoded colors
grep -r "#\|rgb(" frontend --include="*.tsx" --include="*.css" | grep -v node_modules

# Check for arbitrary values
grep -r "\[.*px\]" frontend/components --include="*.tsx" | grep -v custom

# TypeScript check
npx tsc --noEmit

# ESLint check
npx eslint frontend --ext .tsx,.ts

# Build check
npm run build

# Lighthouse CI
npx lighthouse-ci
```

---

## Scoring

### 10/10 Requirements

| Category | Minimum Score |
|----------|--------------|
| Visual Design | 100% |
| Interactions | 100% |
| Animations | 95%+ |
| Accessibility | 95%+ (Lighthouse) |
| Performance | 90+ (Lighthouse) |
| Code Quality | 100% |

### 9/10 Acceptable

- Minor color inconsistencies (< 5)
- Some animations missing on edge cases
- Accessibility score 90-94%
- Performance score 85-89

### 8/10 or Below - Needs Work

- Multiple hardcoded values
- Missing states on components
- Accessibility issues
- Performance problems

---

**Remember:** A 10/10 design is pixel-perfect, accessible to all, and delightful to use. Don't compromise on quality.
