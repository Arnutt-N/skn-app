# JSK Unified Design System (Merged Standard)

This document merges:
- `frontend/docs/design-system-reference.md` (implemented project baseline)
- `research/kimi_code/ui_design_system.md` (comprehensive Vuexy-derived system)

It is now the single source of truth for new frontend work.

## 1) Core Direction
- Visual model: Vuexy-like enterprise UI (dark sidebar, light content, card-based surfaces)
- Implementation model: token-first Tailwind + reusable React primitives
- Language model: Thai-first readability, English secondary

## 2) Foundation Tokens
- Primary token source: `frontend/app/globals.css`
- Use semantic tokens (`brand`, `success`, `warning`, `danger`, `info`) over hardcoded colors
- Use surface/text/border/shadow tokens over ad-hoc utility mixtures
- Z-index scale:
  - `--z-base: 0`
  - `--z-dropdown: 100`
  - `--z-sticky: 200`
  - `--z-modal: 1000`
  - `--z-tooltip: 1100`
  - `--z-toast: 1200`
  - `--z-loading: 1300`

## 3) Thai Typography Rules (Mandatory)
- Minimum body readability baseline: 16px equivalent (`--text-base` starts at `1rem`)
- Body line-height target: `1.6`
- Avoid uppercase transformations for Thai content
- Use `.thai-text` or `.thai-no-break` for long Thai text blocks and labels

## 4) Component Standards
- Base primitives from `frontend/components/ui`
- Primary action hierarchy:
  - `Button variant="primary"` for key CTA
  - `secondary/outline/ghost` for lower emphasis
- Status language:
  - Waiting = `warning`
  - Active = `success`
  - Closed = `gray`
  - Bot/Info = `info`
  - Critical = `danger`
- Badges must not force uppercase globally

## 5) Layout Patterns
- Admin shell:
  - Dark sidebar navigation
  - Glass-like top header
  - Main content as rounded card panels
- Panel rhythm:
  - 16-24px spacing between major blocks
  - Rounded corners (`xl`/`2xl`) for cards and containers
- KPI first:
  - Summary cards before dense table/chart sections

## 6) Reference Mapping
Visual references come from `examples/templates`:
- Dashboards (5)
- Apps (17)
- Pages (27)
- Forms (22)
- Components (16)
- Wizard (6)
- Front (5)
- Tables (2)
- Charts (2)
- Extensions (1)

## 7) Live Preview and Usage
- Live preview route: `/admin/design-system`
- Implement new admin pages by composing existing `components/ui` first
- Add new variants only when an existing primitive cannot represent the required state

## 8) Merge Decisions (What Changed)
- Kept project token architecture and existing component library
- Adopted Thai readability requirements from research spec
- Removed forced uppercase in badge primitive
- Added z-index scale + Thai text utility classes

## 9) Next Expansion Targets
- Table pattern package (header, row actions, compact/comfortable density)
- Search/filter bar pattern with chips
- File upload pattern primitives
- Timeline pattern primitives
- Per-component dark-mode QA checklist

## 10) New List Page Recipe
Use this baseline for new admin list/table pages:

1. Page wrapper
- Add `thai-text` on the page container.
- Use `thai-no-break` for important Thai titles/subtitles and compact labels.

2. Header block
- Title style: `text-2xl font-bold tracking-tight`.
- Subtitle style: `text-sm text-slate-400`.
- Primary action button should include `focus-ring`.

3. Search and filters
- Use `AdminSearchFilterBar` from `frontend/components/admin`.
- Pass typed options (`SelectOption[]`) for filter inputs.
- Use `showCategory={false}` when only one filter dimension is needed.

4. Table header
- Use `AdminTableHead` with typed `AdminTableHeadColumn[]`.
- Avoid forced uppercase in table labels.
- Set explicit alignments (`left`, `center`, `right`) per column.

5. Row actions and controls
- Add `focus-ring` to icon buttons and primary row actions.
- Keep status colors semantic (`success`, `warning`, `danger`, `info`, `gray`).

6. Empty and loading states
- Provide clear loading skeletons/spinners.
- Empty-state text should be short and readable in Thai/English contexts.
