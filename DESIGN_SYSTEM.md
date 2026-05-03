# LabFrame Design System

This document defines the visual token vocabulary for LabFrame. Use tokens from `src/ui/tokens.css` and defaults from `src/ui/base.css`. Do not add raw hex, raw `rem`, or raw `box-shadow` values in component CSS.

## Token source of truth

- `src/ui/tokens.css`: type, spacing, color ramps, semantic aliases, elevation, radius, motion, focus ring, icon sizes.
- `src/ui/base.css`: global reset + base element behavior.
- `src/main.css`: application and component styles that consume tokens.

## Core token groups

- **Type:** `--font-sans`, `--font-mono`, `--text-*`, `--leading-*`, `--weight-*`, `--tracking-*`.
- **Spacing:** `--space-0-5` through `--space-9`.
- **Neutrals:** `--neutral-*` for light/dark ramps.
- **Accent:** `--accent-50` through `--accent-900`.
- **Semantics:** `--surface-*`, `--text-*`, `--border-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`, `--info-*`.
- **Callout aliases:** `--callout-*` now map to semantic status colors.
- **Elevation:** `--shadow-1` through `--shadow-4`.
- **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
- **Motion:** `--duration-*`, `--ease-*`.
- **Focus:** `--focus-ring`.
- **Icons:** `--icon-sm`, `--icon-md`, `--icon-lg`.

## Component rules

- Use semantic aliases (`--surface-raised`, `--text-secondary`, `--border-default`) instead of ramp values unless you are defining tokens.
- Inputs, buttons, and overlays must use shared border/radius/focus tokens.
- Table cells use subtle borders; header rows use `--surface-sunken`; numeric table inputs use `--font-mono` and right alignment.
- Overlay surfaces (dialogs/popovers) use `--surface-overlay`, `--border-default`, and `--shadow-3` or `--shadow-4`.
- Icon affordances should use Lucide through `src/ui/primitives/Icon.tsx`.

## Add a component without breaking the system

1. Pick semantic tokens first (surface/text/border/accent/status) before writing selectors.
2. Use only spacing tokens for gap/padding/margins.
3. Use only type tokens for font size/line-height/weight/family.
4. Use `--duration-fast` and `--ease-out` for hover/focus transitions.
5. Add `:focus-visible` behavior that relies on `--focus-ring`.
6. Run:
   - `npm run lint:styles`
   - `npm run lint`
   - `npm run typecheck`
7. Verify both themes (`data-theme="light"` and `data-theme="dark"`).

## Guardrails

- `stylelint` forbids raw hex, raw `rem`, and raw `box-shadow` values outside `src/ui/tokens.css`.
- If you need a new primitive value, add it to `src/ui/tokens.css` first, then consume the token in component CSS.
