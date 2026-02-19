# Design Implementation Guide

## Quick Reference for Applying Premium Design

This guide provides practical examples for implementing the premium design system across SknApp.

---

## 1. Page Layout Patterns

### Admin Dashboard Layout

```tsx
// app/admin/page.tsx - Enhanced Version
export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-resting border border-border-subtle hover:shadow-elevated transition-shadow duration-300">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Service Requests
          </h1>
          <p className="text-text-tertiary text-sm mt-0.5">
            Citizen service management and analytics
          </p>
        </div>
        <div className="text-sm text-text-tertiary font-medium">
          {new Date().toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stats cards with hover lift effect */}
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl p-6 shadow-resting border border-border-subtle">
        {/* Content */}
      </div>
    </div>
  );
}
```

### Login Page - Premium Version

```tsx
// app/login/page.tsx - Enhanced
<div className="min-h-screen bg-gradient-to-br from-[hsl(240,20%,99%)] via-bg to-[hsl(252,82%,67%)]/5 flex items-center justify-center p-4 relative overflow-hidden">
  {/* Animated Background Elements */}
  <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[hsl(252,82%,67%)]/5 rounded-full blur-3xl animate-float" />
  <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[hsl(195,100%,45%)]/5 rounded-full blur-3xl animate-float delay-500" />
  
  {/* Login Card with Glass Effect */}
  <div className="w-full max-w-md relative animate-scale-in">
    <Card glass className="shadow-premium">
      <CardContent className="pt-14 pb-14">
        {/* Logo with glow effect */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-bold text-xl shadow-glow-primary">
            JS
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary text-center tracking-tight">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-text-tertiary text-center">
          LINE Live Chat Administration
        </p>

        <form className="mt-8 space-y-5">
          {/* Enhanced Input with floating label */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username"
              placeholder="Enter your username"
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            shine
          >
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
```

---

## 2. Component Usage Examples

### Button Variations

```tsx
// Primary Actions
<Button variant="primary" size="lg" shine>
  Create New Request
</Button>

// Secondary Actions
<Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
  Filter Results
</Button>

// Danger Actions
<Button variant="danger" leftIcon={<Trash className="w-4 h-4" />}>
  Delete Item
</Button>

// Ghost Actions (for subtle actions)
<Button variant="ghost" size="sm">
  View Details
</Button>

// Loading State
<Button isLoading loadingText="Saving...">
  Save Changes
</Button>

// With Icons
<Button 
  variant="primary" 
  leftIcon={<Plus className="w-4 h-4" />}
  rightIcon={<ArrowRight className="w-4 h-4" />}
>
  Add New
</Button>
```

### Card Patterns

```tsx
// Stats Card
<Card hover="lift" padding="lg">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
      <Users className="w-6 h-6" />
    </div>
    <div>
      <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wider">
        Total Users
      </p>
      <p className="text-2xl font-bold text-text-primary">1,234</p>
    </div>
  </div>
</Card>

// Feature Card with Glow Hover
<Card hover="glow" variant="elevated">
  <CardHeader>
    <CardTitle>Live Chat</CardTitle>
    <CardDescription>Manage real-time conversations</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button variant="primary">Open Chat</Button>
  </CardFooter>
</Card>

// Glass Card (for overlays/modals)
<Card variant="glass" padding="xl">
  <h3 className="text-lg font-semibold text-text-primary">Notification</h3>
  <p className="text-text-secondary mt-2">
    This is a glass morphism card for premium overlays.
  </p>
</Card>
```

### Form Elements

```tsx
// Standard Input
<Input 
  placeholder="Enter your name"
  leftIcon={<User className="w-4 h-4" />}
/>

// Input with Error State
<Input 
  state="error"
  errorMessage="This field is required"
  leftIcon={<AlertCircle className="w-4 h-4" />}
/>

// Input with Success State
<Input 
  state="success"
  rightIcon={<CheckCircle className="w-4 h-4 text-success" />}
/>

// Select with custom styling
<div className="space-y-1.5">
  <Label htmlFor="category">Category</Label>
  <select 
    id="category"
    className="w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
  >
    <option value="">Select a category</option>
    <option value="general">General</option>
  </select>
</div>

// Textarea
<textarea 
  className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[100px] resize-y"
  placeholder="Enter your message..."
/>
```

### Badge Usage

```tsx
// Status Badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Blocked</Badge>
<Badge variant="info">New</Badge>

// Outline Style
<Badge variant="primary" style="outline">Premium</Badge>

// Sizes
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="md">Medium</Badge>
<Badge variant="primary" size="lg">Large</Badge>

// With Dot
<Badge variant="success" className="gap-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-current" />
  Online
</Badge>
```

---

## 3. Animation Patterns

### Page Load Animation

```tsx
// Staggered children animation
<div className="space-y-4">
  {items.map((item, index) => (
    <div 
      key={item.id}
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {item.content}
    </div>
  ))}
</div>
```

### Hover Effects

```tsx
// Lift effect on cards
<div className="group cursor-pointer">
  <div className="bg-white rounded-2xl p-6 shadow-resting transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-text-secondary mt-2">Card description</p>
  </div>
</div>

// Scale effect on icons
<button className="p-2 rounded-xl hover:bg-surface-hover transition-all duration-200 group">
  <Settings className="w-5 h-5 text-text-tertiary group-hover:text-brand-primary group-hover:scale-110 transition-all duration-200" />
</button>

// Shine effect on buttons
<button className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white px-6 py-3 rounded-xl group">
  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  <span className="relative">Hover Me</span>
</button>
```

### Loading States

```tsx
// Skeleton Loading
<div className="space-y-4">
  <Skeleton variant="text" width="60%" height={24} />
  <Skeleton variant="text" width="100%" height={16} />
  <Skeleton variant="text" width="80%" height={16} />
</div>

// Spinner with text
<div className="flex items-center gap-3 text-text-secondary">
  <Loader2 className="w-5 h-5 animate-spin" />
  <span>Loading...</span>
</div>

// Pulse animation for live indicators
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
</span>
```

---

## 4. Color Usage Guide

### Background Colors

```tsx
// Page background
<div className="bg-bg min-h-screen">

// Card/Surface background
<div className="bg-surface">

// Elevated surface (modals, dropdowns)
<div className="bg-surface-elevated shadow-floating">

// Hover states
<div className="hover:bg-surface-hover">

// Active/pressed states
<button className="active:bg-surface-pressed">
```

### Text Colors

```tsx
// Primary text (headings, important content)
<h1 className="text-text-primary">

// Secondary text (body content)
<p className="text-text-secondary">

// Tertiary text (captions, hints)
<span className="text-text-tertiary">

// Inverse text (on dark backgrounds)
<div className="bg-gray-900 text-text-inverse">
```

### Border Colors

```tsx
// Default borders
<div className="border border-border-default">

// Subtle borders (dividers)
<div className="border-t border-border-subtle">

// Hover borders
<div className="border-border-default hover:border-border-hover">

// Focus borders
<input className="focus:border-brand-primary">
```

---

## 5. Spacing Patterns

### Common Layout Spacing

```tsx
// Page padding
<div className="px-6 py-6">

// Section spacing
<section className="space-y-6">

// Card internal spacing
<Card padding="lg">  // 32px
<Card padding="md">  // 24px
<Card padding="sm">  // 16px

// Form field spacing
<div className="space-y-5">
  <div className="space-y-1.5">  // Label + input
    <Label>Field Name</Label>
    <Input />
  </div>
</div>

// Grid gaps
<div className="grid grid-cols-4 gap-5">
```

---

## 6. Shadow Usage

### By Context

```tsx
// Cards at rest
<Card className="shadow-resting">

// Elevated cards (on hover or featured)
<Card className="shadow-elevated">

// Dropdowns, popovers
<div className="shadow-floating">

// Modals, overlays
<Modal className="shadow-premium">

// No shadow (flat design)
<div className="shadow-none border border-border-default">
```

---

## 7. Responsive Patterns

### Breakpoint Usage

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// Responsive text
<h1 className="text-xl md:text-2xl lg:text-3xl">

// Responsive sidebar
<aside className="fixed inset-y-0 left-0 w-64 transform -translate-x-full lg:translate-x-0 lg:static transition-transform">

// Mobile menu overlay
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden">
```

---

## 8. Dark Mode Support

```tsx
// Toggle button
<button 
  onClick={toggleDarkMode}
  className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
>
  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
</button>

// Dark mode classes
<html className="dark">
  <body className="bg-bg text-text-primary">
    <Card className="bg-surface border-border-default">
      {/* Content automatically adapts */}
    </Card>
  </body>
</html>
```

---

## 9. Accessibility Patterns

### Focus Management

```tsx
// Visible focus rings
<button className="focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2">

// Skip to content
<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg">
  Skip to main content
</a>

// ARIA labels
<button aria-label="Close dialog" aria-describedby="dialog-desc">
  <X className="w-5 h-5" />
</button>

// Screen reader only text
<span className="sr-only">Loading...</span>
```

### Reduced Motion

```tsx
// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in {
    animation: none;
    opacity: 1;
  }
}

// Or using Tailwind
<div className="motion-safe:animate-fade-in motion-reduce:opacity-100">
```

---

## 10. Common Mistakes to Avoid

### ❌ Don't

```tsx
// Don't use arbitrary values
<div className="p-[17px]">

// Don't mix color formats
<div className="bg-[#7367F0] text-hsl(252,82%,67%)">

// Don't skip hover states
<button className="bg-brand-primary">

// Don't forget focus states
<input className="border border-gray-300">

// Don't use inconsistent spacing
<div className="space-y-4">
  <div className="mb-5">
```

### ✅ Do

```tsx
// Use design system values
<div className="p-4">

// Use HSL consistently
<div className="bg-brand-primary text-brand-primary">

// Always include hover states
<button className="bg-brand-primary hover:bg-brand-primary-dark transition-colors">

// Include focus states
<input className="border border-border-default focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20">

// Use consistent spacing
<div className="space-y-4">
  <div className="pb-4">
```

---

## Migration Checklist

When updating existing pages:

- [ ] Replace hardcoded colors with design tokens
- [ ] Update spacing to use 4px grid system
- [ ] Add hover/focus/active states to interactive elements
- [ ] Implement loading states with skeletons
- [ ] Add enter animations for page content
- [ ] Update shadows to use elevation system
- [ ] Ensure consistent border radius
- [ ] Add proper focus rings
- [ ] Test keyboard navigation
- [ ] Verify color contrast ratios
