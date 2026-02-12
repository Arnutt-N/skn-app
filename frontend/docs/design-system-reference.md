# JSK Frontend Design System Reference

## Source
- Primary visual references: `examples/templates` (105 screenshots)
- Primary categories: dashboards, apps, pages, forms, components, wizard, front, tables, charts, extensions

## Visual Direction
- Dense enterprise layout with soft cards and clear hierarchy
- Brand-first accent for actions and selected navigation
- Light-first design with compatible dark token overrides
- Rounded geometry (`xl` and `2xl`) for surfaces and controls

## Foundation Tokens
- Colors: use semantic tokens in `frontend/app/globals.css`
- Surface model: `--color-bg`, `--color-surface`, `--color-border-*`
- State model: success, warning, danger, info + text-safe variants (`*-text`)
- Shadow model: `--shadow-sm` to `--shadow-xl`, reserve glow shadows for key CTAs

## Layout Patterns
- Sidebar: dark vertical navigation, active item highlighted by brand tone
- Header: glass/blur top bar with search and utility actions
- Content: card grid with 16-24px gap rhythm
- KPI row: compact metrics cards preceding detailed charts/tables

## Component Rules
- Buttons: gradient primary, neutral secondary, text-only ghost
- Inputs: outline as default, clear focus ring, contextual error/success states
- Badges: map to status language (waiting, active, closed, urgent, bot)
- Cards: default surface + elevated variant for high-priority modules

## Usage
- Live preview page: `/admin/design-system`
- Build new admin pages from existing `components/ui` primitives first
- Prefer token usage over hard-coded hex values
