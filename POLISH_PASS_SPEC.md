# LabFrame — Path 1 Polish Pass Spec

**Audience:** Austin (ASU IPL) + downstream coding agents
**Status:** Design-system foundations. Slots in after Phase 5.5.
**Date:** 2026-05-03
**Working name:** Phase 5.7 — Visual Foundations

---

## 0. TL;DR

Phase 5.5 shipped a working dark mode and a coherent feature set, but the surface still reads as a 2009 utility page. Reason: there is no design system. There is a vocabulary of three surfaces, two text levels, one border color, one shadow, an ad-hoc rem ladder spanning eleven distinct values, and four to five hand-picked grays peppered through component CSS. The fix is not a framework swap and not a redesign. It is three things, in order:

1. Define real tokens (type, spacing, color, elevation, radius, motion).
2. Migrate every component file to use only those tokens.
3. Replace homegrown unicode/emoji with a real icon set and lock down focus + transition behavior.

Done well, this closes ~70% of the "looks dated" gap without touching a single component's logic. It is the prerequisite for any further visual work (motion, micro-interactions, shadcn-style primitives) — without it, those layers compound onto an unstable base.

**Honest scope estimate:** half a day to define and document tokens, two-to-three full days to migrate every existing CSS file in `src/` and verify nothing regresses in dark mode. Call it a focused week.

---

## 1. Why this matters now

Phase 5.5's dark-mode token list (surface / text / accent / border / shadow / focus) was an *outline* of a token system. It got us a working dark mode but did not get us a real design system, because:

- Surfaces are 0/1/2 with no defined semantics. Components reach for whichever surface "looks right" and the visual hierarchy is accidental.
- Text is `--text-0` and `--text-1`. The numbering gives no intuition (is 0 darker or lighter?), and there is no third tier for captions/disabled/help text — so `#374151`, `#555`, `#6b7280` keep showing up inline.
- `--border-color` is a single value. Cards, inputs, popovers, and dividers all use it, so nothing has visual weight relative to anything else.
- `--shadow-color` is one alpha. Cards (`0 1px 2px`), wizard (`0 6px 16px`), popovers (`0 4px 12px`), modals (`0 14px 36px`) all picked a depth out of the air.
- `--accent` is a single shade. There is no `accent-soft` for backgrounds, no `accent-muted` for hover states, no semantic `success/warn/danger/info` (the callout system has its own per-variant variables — those should be the *application* of a real semantic ramp, not the source of truth).
- Spacing is a personal-taste exercise. Grepping `main.css` finds `0.1rem`, `0.15rem`, `0.2rem`, `0.25rem`, `0.3rem`, `0.35rem`, `0.4rem`, `0.45rem`, `0.5rem`, `0.55rem`, `0.6rem`, `0.65rem`, `0.7rem`, `0.75rem`, `0.8rem`, `0.85rem`, `0.9rem`, `1rem`, `1.1rem`, `1.2rem`, `1.5rem`, `2rem`. That is not a scale.
- Radii: `3px`, `6px`, `8px`, `10px`, `999px`. Five values, no naming.
- Type: `system-ui` stack. There is no scale; font-size is set per-component as `0.75rem`, `0.83rem`, `0.85rem`, `0.88rem`, `0.9rem`, `1rem`, `1.06rem` — eight different values just in `main.css`.
- Icons: a mix of unicode characters, emoji, and `<details>` triangles standing in for affordances.
- Focus: defined on `button` only. Inputs, links, summaries, dialogs each handle (or don't) their own focus styling.

This is not a criticism of the engineering — these patterns are inevitable when there is no token system. The fix is the token system.

---

## 2. Goals & non-goals

### 2.1 Goals

1. Replace the current improvised vocabulary with a documented design-token system covering type, color, spacing, radius, elevation, motion, and focus.
2. Migrate **every** application CSS file in `src/` to use only those tokens. No raw hex, no raw rem values, no raw shadows after this lands.
3. Adopt a real icon set (Lucide) and replace homegrown unicode/emoji affordances throughout the UI surface.
4. Lock in consistent focus, hover, and transition behavior across every interactive element.
5. Document the system in a single `src/ui/tokens.css` (or `tokens.ts` if we want compile-time access) and a short `DESIGN_SYSTEM.md` next to `REBUILD_SPEC.md`.

### 2.2 Non-goals (this phase)

- **No framework swap.** No Tailwind, no Radix Themes, no shadcn-style component library. We're laying the foundation that makes any future move trivial.
- **No motion system beyond transitions.** Animated route transitions, page-load orchestration, scroll-driven effects are Path 2.
- **No component-library API redesign.** Existing components keep their props and behavior; only their CSS changes.
- **No new layouts.** No catalog re-grid, no header re-architecture. Pure visual layer.
- **No logo or brand identity.** Wordmark stays text. (Per Phase 5.5.)
- **No print stylesheet.** PDF is the print artifact; browser-print is best-effort.
- **No "dark mode v2" theming concepts** (e.g., per-course themes, instructor mode). Tokens are designed to make these trivial later, but they are not in scope.

### 2.3 What this *won't* fix on its own

A token system gets you to "professional and considered." It does not get you to "feels expensive." That last gap comes from things in Path 2: real micro-interactions, considered empty states, loading patterns that aren't shimmer rectangles, and motion that has personality. Don't expect this phase alone to make the app feel like Linear. Expect it to make the app feel like a product instead of a tool a TA wrote in 2009.

---

## 3. Token system

Tokens live in `src/ui/tokens.css`, imported once from `src/main.css` before any other rule. Component CSS files reference *only* tokens — no raw color, spacing, shadow, or font-size values after this phase lands. Lint enforces this (see §6).

### 3.1 Type

**Font families.** Self-host via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono` (npm packages — no Google Fonts CDN, keeps the FERPA story clean). Variable fonts mean one file per family.

```css
--font-sans: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace;
--font-serif: ui-serif, Georgia, serif; /* reserved; not used in v1 */
```

**Why Inter, not Geist:** Geist reads as "Vercel app." Inter is the neutral modern default and pairs cleanly with measurement-heavy academic content. If we want personality later, we can swap one variable file. The mono choice (JetBrains Mono) is higher-leverage than the sans choice for this app — measurement tables and the equation editor are a non-trivial fraction of the visible surface, and a real mono with proper italics for variables (not just slanted upright letters) immediately reads as scientific software.

**Type scale.** Modular but pragmatic — not strictly geometric.

```css
--text-xs:   0.75rem;  /* 12px — captions, table column meta */
--text-sm:   0.875rem; /* 14px — UI body, labels, secondary */
--text-base: 1rem;     /* 16px — body text, primary UI */
--text-md:   1.125rem; /* 18px — emphasized UI, section subtitles */
--text-lg:   1.375rem; /* 22px — h3, dialog titles */
--text-xl:   1.75rem;  /* 28px — h2, page titles */
--text-2xl:  2.25rem;  /* 36px — h1, hero (rare in this app) */
```

**Line heights.** Two values, used consistently.

```css
--leading-ui:    1.4;  /* compact UI: buttons, labels, table cells */
--leading-prose: 1.65; /* instructions, explanations, conclusions */
```

**Weights.** Use the variable axis. Reserve five points.

```css
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;
--weight-display:  720; /* for the wordmark; tightens with letter-spacing -0.02em */
```

**Tracking.** One global default; tighten only on display sizes.

```css
--tracking-tight:  -0.015em; /* applied to --text-lg and up */
--tracking-normal:  0;
--tracking-wide:    0.04em;  /* small caps, eyebrow labels */
```

### 3.2 Spacing

4px base. Linear at the bottom, looser at the top (because we never need 28px or 36px but we frequently need 24 → 32 → 48 jumps).

```css
--space-0-5: 2px;
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   24px;
--space-6:   32px;
--space-7:   48px;
--space-8:   64px;
--space-9:   96px; /* hero sections only */
```

**Rule:** Components use only these. If a layout needs something between, the layout is wrong, not the scale.

### 3.3 Color — neutrals

A real neutral ramp. Tinted slightly cool (matches the existing slate-ish accent). Source: Radix Colors `slate` is a defensible starting point, but inline the values so we own them.

**Light mode neutrals:**

```css
--neutral-0:   #ffffff;
--neutral-50:  #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;
--neutral-1000: #020617;
```

**Dark mode neutrals (data-theme="dark"):**

```css
--neutral-0:   #020617;
--neutral-50:  #0b1220;
--neutral-100: #111a2c;
--neutral-200: #172235;
--neutral-300: #243049;
--neutral-400: #334155;
--neutral-500: #64748b;
--neutral-600: #94a3b8;
--neutral-700: #cbd5e1;
--neutral-800: #e2e8f0;
--neutral-900: #f1f5f9;
--neutral-1000: #ffffff;
```

The dark ramp is intentionally not a strict mirror — neutrals 50–200 are the dark surfaces, 700–900 are the dark text. Lower-numbered = darker in *both* modes. (This means token consumers can use the same numeric reference and it still makes physical sense.)

### 3.4 Color — accent

Single accent ramp, hue derived from the existing `#1558d6`. Use Radix `blue` or generate with Leonardo for proper contrast at every step.

```css
--accent-50:  #eff6ff;
--accent-100: #dbeafe;
--accent-200: #bfdbfe;
--accent-300: #93c5fd;
--accent-400: #60a5fa;
--accent-500: #3b82f6;
--accent-600: #2563eb;
--accent-700: #1d4ed8;
--accent-800: #1e40af;
--accent-900: #1e3a8a;
```

In dark mode, the *same* numeric ramp is used but the *semantic* aliases (below) point to lighter steps. Don't mirror the ramp itself.

### 3.5 Color — semantic aliases

The aliases are what components actually consume. Light mode shown; dark mode overrides each.

```css
/* Surfaces — increasing visual prominence */
--surface-base:    var(--neutral-50);  /* page background */
--surface-raised:  var(--neutral-0);   /* cards, sections */
--surface-overlay: var(--neutral-0);   /* popovers, dialogs (with shadow) */
--surface-sunken:  var(--neutral-100); /* code blocks, table headers */

/* Text */
--text-primary:   var(--neutral-900);
--text-secondary: var(--neutral-600);
--text-tertiary:  var(--neutral-500);
--text-disabled:  var(--neutral-400);
--text-inverse:   var(--neutral-0);   /* on accent backgrounds */
--text-accent:    var(--accent-700);

/* Borders — three weights */
--border-subtle:  var(--neutral-200); /* internal dividers, table cells */
--border-default: var(--neutral-300); /* card borders, input borders */
--border-strong:  var(--neutral-400); /* emphasized borders, active states */
--border-accent:  var(--accent-600);  /* focus rings, selected */

/* Accent semantic */
--accent-bg:       var(--accent-600);
--accent-bg-hover: var(--accent-700);
--accent-soft:     var(--accent-50);  /* tinted backgrounds */
--accent-text:     var(--accent-700);
--accent-text-on:  var(--neutral-0);

/* Status colors — each gets bg/text/border at minimum */
--success-bg:     #dcfce7; --success-text: #166534; --success-border: #86efac;
--warning-bg:     #fef3c7; --warning-text: #92400e; --warning-border: #fcd34d;
--danger-bg:      #fee2e2; --danger-text:  #991b1b; --danger-border:  #fca5a5;
--info-bg:        #dbeafe; --info-text:    #1e40af; --info-border:    #93c5fd;
```

**Dark-mode overrides for aliases** live in the `:root[data-theme='dark']` block and substitute different neutral/accent steps. The status colors get tuned darker backgrounds and lighter text — copy the values from a known-good system (Radix dark variants are fine). Run axe-core after; `WCAG AA` 4.5:1 for body text, 3:1 for large text and UI.

**Migration of existing `--callout-*` variables:** they become aliases of the status semantics. `--callout-note-*` → `--info-*`, `--callout-tip-*` → `--success-*`, etc. Component CSS keeps the callout class names but consumes the semantic tokens.

### 3.6 Elevation

Four shadow tiers. Light mode below; dark mode uses higher alpha and slightly bluer tone.

```css
/* Light */
--shadow-1: 0 1px 2px rgb(15 23 42 / 0.06), 0 1px 3px rgb(15 23 42 / 0.08);
--shadow-2: 0 2px 4px rgb(15 23 42 / 0.06), 0 4px 8px rgb(15 23 42 / 0.08);
--shadow-3: 0 4px 8px rgb(15 23 42 / 0.08), 0 8px 16px rgb(15 23 42 / 0.10);
--shadow-4: 0 8px 16px rgb(15 23 42 / 0.10), 0 16px 32px rgb(15 23 42 / 0.14);

/* Dark — same structure, tuned alpha */
--shadow-1: 0 1px 2px rgb(0 0 0 / 0.4), 0 1px 3px rgb(0 0 0 / 0.5);
--shadow-2: 0 2px 4px rgb(0 0 0 / 0.4), 0 4px 8px rgb(0 0 0 / 0.5);
--shadow-3: 0 4px 8px rgb(0 0 0 / 0.5), 0 8px 16px rgb(0 0 0 / 0.6);
--shadow-4: 0 8px 16px rgb(0 0 0 / 0.6), 0 16px 32px rgb(0 0 0 / 0.7);
```

**Usage convention:**
- `--shadow-1`: cards, sections, inline elements that need to feel slightly raised.
- `--shadow-2`: hover states for interactive cards, default for popovers.
- `--shadow-3`: dropdowns, tooltips, table-of-contents popovers.
- `--shadow-4`: modals, dialogs, command palettes.

In dark mode, surfaces lean on the surface tier system more than on shadows for hierarchy (shadows are less visible against dark backgrounds). That's correct, not a bug.

### 3.7 Radius

```css
--radius-sm:   4px;  /* inputs, small buttons, table cells, code */
--radius-md:   8px;  /* cards, sections, dialogs, popovers */
--radius-lg:   12px; /* hero cards, major surfaces */
--radius-full: 9999px; /* pills, avatars, the split-handle indicator */
```

Three nominal sizes plus full. Stop using `3px`, `6px`, `10px`. Replace `999px` with `--radius-full`.

### 3.8 Motion

```css
--duration-instant: 80ms;   /* state changes that should feel "yes, now" */
--duration-fast:    150ms;  /* hover, focus, small UI transitions */
--duration-medium:  250ms;  /* popovers, dropdowns, larger elements */
--duration-slow:    400ms;  /* modal enter/exit, page transitions */

--ease-out:   cubic-bezier(0.16, 1, 0.3, 1);    /* default for most things */
--ease-in:    cubic-bezier(0.7, 0, 0.84, 0);    /* exits */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* loops, reversals */
```

**Defaults:**
- Hover/focus state changes: `transition: all var(--duration-fast) var(--ease-out)`
- Popover/dropdown enter: `var(--duration-medium) var(--ease-out)`
- Modal enter: `var(--duration-slow) var(--ease-out)`
- All motion respects `@media (prefers-reduced-motion: reduce)` — set duration to `0.01ms` (not `0`, to avoid breaking transitionend handlers).

### 3.9 Focus

One canonical focus ring, applied via a utility class and a `:focus-visible` selector on every interactive primitive.

```css
--focus-ring:        0 0 0 2px var(--surface-base), 0 0 0 4px var(--accent-600);
--focus-ring-offset: 2px;
--focus-ring-width:  2px;
```

Applied as `box-shadow` (cleaner than `outline` for non-rectangular elements like rounded inputs). Always pair with `outline: none` to suppress the browser default. Default applies to `button, a, input, textarea, select, [tabindex], summary` via a base reset.

### 3.10 Icon sizing

Lucide ships at 24×24 with 2px stroke. For dense UI we use:

```css
--icon-sm: 14px;  /* inline with --text-sm */
--icon-md: 18px;  /* default UI */
--icon-lg: 24px;  /* hero buttons, empty states */
```

Stroke width is 1.5 at all sizes (Lucide allows this via the `strokeWidth` prop). Set as a default in the `<Icon>` wrapper component — see §4.

---

## 4. Component-level changes

The token system is the foundation; these are the first applications. They are deliberately *not* a component library — they are CSS conventions that fall out of consistent token use.

### 4.1 Icons — adopt Lucide

- Add `lucide-react` as a dependency (~2KB per icon, tree-shakes cleanly).
- Create `src/ui/primitives/Icon.tsx` — a thin wrapper that defaults `size={18}` and `strokeWidth={1.5}` and accepts `aria-label` for standalone icons.
- Audit every component for unicode/emoji affordances (`▾`, `✓`, `›`, `…`, `ⓘ`, `📋`, etc.) and replace with named Lucide imports (`ChevronDown`, `Check`, `ChevronRight`, `MoreHorizontal`, `Info`, `Clipboard`).
- The `<details>` element gets a real chevron icon as its summary marker, not the browser's triangle.
- Status banners get matching icons (`AlertCircle` for warnings, `Info` for notes, `CheckCircle2` for success, `AlertTriangle` for caution).

### 4.2 Buttons

A single canonical `.btn` class + variants `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, plus sizes `.btn-sm`, `.btn-md` (default), `.btn-lg`. All consume tokens. Existing `<button>` elements that don't carry these classes still inherit a sensible base style.

```css
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font: var(--weight-medium) var(--text-sm)/var(--leading-ui) var(--font-sans);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.btn:hover { background: var(--neutral-100); }
.btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.btn:disabled { color: var(--text-disabled); cursor: not-allowed; background: transparent; }
```

### 4.3 Inputs / textareas / `math-field`

Consistent border, padding, focus, and invalid styling. Sizing uses tokens. Label–field gap is `var(--space-2)`.

```css
.input, input, textarea, math-field, select {
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font: var(--weight-regular) var(--text-sm)/var(--leading-ui) var(--font-sans);
  color: var(--text-primary);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}
.input:hover, input:hover, textarea:hover { border-color: var(--border-strong); }
.input:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: none;
  border-color: var(--accent-600);
  box-shadow: 0 0 0 3px var(--accent-100);
}
.input[aria-invalid="true"] { border-color: var(--danger-border); }
```

### 4.4 Cards / sections

The existing `.section` becomes the canonical card. Drop the ad-hoc `box-shadow: 0 1px 2px var(--shadow-color)` for `--shadow-1`. Padding standardized to `var(--space-4)` (was `0.75rem`).

### 4.5 Tables — the highest-leverage component

This isn't on the original Path 1 list but it should be. Measurement tables are a substantial fraction of the visible surface in any lab worksheet, and right now they look like a 1998 Excel screenshot: hard `#ccc` borders on every cell, gray `#f3f4f6` headers, no zebra-striping, no hover, no row affordances.

A polished table style (subtle horizontal-only borders, sticky headers when the table scrolls, mono font for numeric cells, right-align numbers, proper visual weight on the header row) is one of those "do this once, every lab feels better" wins. Specifics:

```css
table {
  width: 100%;
  border-collapse: collapse;
  font: var(--weight-regular) var(--text-sm)/var(--leading-ui) var(--font-sans);
}
th {
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-default);
  text-align: left;
  padding: var(--space-2) var(--space-3);
}
td {
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-2) var(--space-3);
  color: var(--text-primary);
}
td input { font-family: var(--font-mono); text-align: right; }
tr:hover td { background: var(--surface-sunken); }
```

The `td input { font-mono, right-align }` rule alone makes every measurement table feel like scientific software instead of a spreadsheet.

### 4.6 Popovers, dialogs, dropdowns

All overlay surfaces share:
- `background: var(--surface-overlay)`
- `border: 1px solid var(--border-default)`
- `border-radius: var(--radius-md)`
- `box-shadow: var(--shadow-3)` for popovers/dropdowns, `var(--shadow-4)` for modals
- Padding: `var(--space-4)`
- Backdrop for modals: `rgb(2 6 23 / 0.55)` light, `rgb(0 0 0 / 0.7)` dark — both go behind a token.

The current `.preflight-dialog` and `.table-of-contents-popover-panel` are essentially the same component with different ad-hoc shadows and borders. After this phase, they share a class.

### 4.7 Headings / prose

Headings use `--leading-ui` and `--tracking-tight`. Prose blocks (instructions, conclusions) use `--leading-prose` and `--text-base`. The `.section :is(h2, h3)` rule gets a real `font-weight: var(--weight-semibold)` and `letter-spacing: var(--tracking-tight)` instead of inheriting whatever the browser does.

---

## 5. File layout

```
src/ui/
  tokens.css           # all design tokens (this is the single source of truth)
  base.css             # reset + global element defaults consuming tokens
  primitives/
    Icon.tsx           # Lucide wrapper with our defaults
    Button.tsx         # optional — wrap <button> with class composition helper
    (other primitives stay as-is for now; their CSS is migrated)
DESIGN_SYSTEM.md       # next to REBUILD_SPEC.md — short docs + token reference
```

`src/main.css` becomes a slim file that imports `tokens.css`, `base.css`, and the existing component CSS. Component CSS files (worksheet, lab-header, equation-editor, etc.) get rewritten in-place to reference only tokens.

---

## 6. Order of operations

Doing this in the wrong order causes pain. Recommended sequence:

1. **Land `tokens.css`** with all values defined. No component touches it yet. Diff is purely additive.
2. **Land `base.css`** (resets + element defaults). The site looks slightly different but not broken. Verify dark mode still works.
3. **Add Lucide and the `<Icon>` primitive.** Replace the most-visible unicode icons first (header chevron, callout markers, dialog close button). Don't try to do all in one pass.
4. **Migrate `main.css`** file-section by file-section. Replace raw values with tokens. Visual diff per section. Dark-mode verify per section.
5. **Migrate component CSS files** one at a time. Suggested priority by visible impact:
   - `lab-header` (sticky, always visible)
   - `worksheet-pane` + `.section` styles (the bulk of the screen)
   - Tables (highest leverage, see §4.5)
   - Equation editor (the second-most-stared-at component)
   - Buttons (every page)
   - Inputs (every page)
   - Popovers / dialogs (collapse all overlay variants to one canonical pattern)
   - Catalog / wizard (least frequent surface, do last)
6. **Add a stylelint rule** that forbids raw color hex, raw `rem` outside the token file, and raw `box-shadow` outside `tokens.css`. Configure as warnings first, errors after migration.
7. **Run axe-core in both themes.** Fix any contrast regressions.
8. **Take before/after screenshots of every screen.** Paste in PR description.

This sequence means every step leaves the app working. A failed step rolls back to a working state.

---

## 7. Push-back / decisions to make

A few things other things to consider:

1. **Inter vs Geist** — Inter for the reasons in §3.1. 
2. **Self-hosted fonts vs CDN** — self-host (`@fontsource-variable/*`) for FERPA cleanliness and zero render-blocking. Cost is a one-time ~80KB to the bundle.
3. **Token format: CSS variables vs CSS-in-JS vs a tokens.ts** — pure CSS variables. They're runtime-themable for free (already needed for dark mode), they're framework-agnostic, and they don't need a build step. If a future agent wants type-safe access, generating a `tokens.ts` from the CSS file is a 20-line script.
4. **Stylelint enforcement** — use it. Without it, the next agent will reach for a raw hex within a week. If you'd rather not add another linter, document the rule in `DESIGN_SYSTEM.md` and rely on review.
5. **Status colors — Radix vs hand-pick** — For better contrast guaranteed out of the box, copy from Radix Colors `green/amber/red/blue` (light + dark). It's one of the few cases where someone else has thought about it more carefully than we will.
6. **Should this absorb the dark-mode tokens that Phase 5.5 already shipped?** Yes — this spec supersedes the token list in Phase 5.5 deliverable 4. The migration path is: write the new tokens, rename the existing ones to match, delete the old. Document the mapping in the PR.
7. **What about the legacy CSS in `physics-labs.up.railway.app/`?** Ignore — that's the decompressed source of the old app. Not in scope.

---

## 8. Definition of done

- `src/ui/tokens.css` exists with all sections in §3 populated, both light and dark.
- `src/ui/base.css` exists, applies element defaults, and is the only file that touches bare element selectors at the global level.
- Every CSS file in `src/` outside `tokens.css` references *only* tokens for color, spacing, shadow, radius, font-size, font-family, line-height, transition duration, and easing. No raw hex. No raw rem. No raw `cubic-bezier`. Stylelint enforces.
- Lucide is integrated; `Icon` primitive exists; every visible unicode/emoji affordance has been replaced (or the ones that haven't are listed in a follow-up issue).
- Every interactive element has a visible focus ring matching `--focus-ring`.
- Every hover and focus transition uses `--duration-fast` + `--ease-out`. Reduced-motion respected.
- axe-core green in both light and dark. WCAG AA contrast everywhere.
- Tables use the new style (mono numbers, right-aligned, sticky headers where the table scrolls).
- `DESIGN_SYSTEM.md` written. It includes the full token list and a one-screen "if you're a future agent, here's how to add a component without breaking the system" section.
- Before/after screenshots of: catalog, landing wizard, lab page (light + dark), equation editor, a measurement table, the AI-disclosure block, the About modal.
- Bundle size delta documented. Target: ≤ 100KB gzip added (most of which is the variable font files; Lucide tree-shakes).
- All existing tests still pass. `npm run lint && npm run typecheck && npm test && npx playwright test` green.

---

## 9. What changes after this lands

Any future visual or component work pays a much smaller tax. Specifically:

- Adding a new component means picking from the token vocabulary, not inventing values. The "what color should this be" question stops happening.
- A future shadcn/ui or Radix Themes adoption becomes mostly a wrapping exercise — their tokens map onto ours.
- Custom theming (per-course color, per-instructor preferences) becomes a `:root[data-course="phy114"]` override of the accent ramp. Trivial.
- Path 2 (motion, micro-interactions, considered loading states) has stable ground to stand on. Animations don't have to fight inconsistent component layouts.
- Onboarding a future agent on visual conventions becomes "read `DESIGN_SYSTEM.md`," not "read these 12 component files and infer."

---

## 10. Phase 5.7 — Agent prompt

```
Visual design-system foundations for LabFrame. Goal: replace the
current improvised CSS vocabulary (three surfaces, one shadow, one
border, one accent, ~20 ad-hoc rem values, ~5 hand-picked grays) with
a real token system, and migrate every component CSS file to consume
only tokens.

Read POLISH_PASS_SPEC.md end-to-end before starting. Especially §3
(tokens), §4 (component conventions), §6 (order of operations).

Key constraint: every step must leave the app working. Land the token
file first. Then base.css. Then migrate component CSS file-by-file.
Verify dark mode after every step. Commit per migrated file so
regressions can be bisected.

Tasks:

1. Add @fontsource-variable/inter and @fontsource-variable/jetbrains-mono.
   Import once from main.css. Verify FOUT/FOIT acceptable.

2. Create src/ui/tokens.css with every section in §3:
   - Type families, scale, line-heights, weights, tracking
   - Spacing scale (4/8/12/16/24/32/48/64/96 + 2 for fine cases)
   - Neutral ramp (light + dark)
   - Accent ramp (light + dark)
   - Semantic aliases (surface, text, border, accent, status — all
     four status colors with bg/text/border)
   - Elevation (4 shadow tiers, light + dark)
   - Radius (sm/md/lg/full)
   - Motion (4 durations + 3 easings)
   - Focus ring
   - Icon sizes

3. Create src/ui/base.css with element defaults consuming tokens.
   Reset margin/padding sanely. Set body font, color, background.
   Default focus rings on button/a/input/textarea/select/[tabindex]/
   summary. Respect prefers-reduced-motion.

4. Add lucide-react. Create src/ui/primitives/Icon.tsx wrapping
   lucide icons with size=18, strokeWidth=1.5, accepts aria-label.

5. Replace unicode/emoji affordances with Lucide. Sweep every
   component file. List anything ambiguous in a follow-up issue
   rather than guessing.

6. Migrate main.css and every component CSS file to consume only
   tokens. Order per §6:
   - main.css globals → lab-header → worksheet/sections → tables
     → equation-editor → buttons → inputs → popovers/dialogs
     → catalog/wizard
   - Per file: replace raw values, screenshot diff, dark-mode check,
     commit.

7. Apply the table styling rules from §4.5 — mono right-aligned
   numbers, sticky headers, hover row, subtle borders.

8. Migrate the existing --callout-* variables to be aliases of the
   new --info/--success/--warning/--danger semantics. Keep callout
   class names; only the underlying tokens change.

9. Add stylelint rules forbidding raw hex, raw rem (outside
   tokens.css), and raw box-shadow (outside tokens.css). Errors,
   not warnings, after migration.

10. Write DESIGN_SYSTEM.md in the repo root next to REBUILD_SPEC.md.
    Token reference + "how to add a component without breaking the
    system" section.

11. axe-core both themes. WCAG AA. Fix regressions before declaring
    done.

12. Before/after screenshots in PR description per §8.

13. npm run lint && npm run typecheck && npm test &&
    npx playwright test. All green.

Constraints:
- No framework swap. No Tailwind. No Radix Themes. No shadcn.
- No new components. No layout changes. Visual layer only.
- No motion beyond the transition tokens. Path 2 will handle motion.
- Inter Variable + JetBrains Mono Variable, self-hosted via
  @fontsource. No Google Fonts CDN.
- CSS variables for all tokens. No CSS-in-JS, no Tailwind config.
- Bundle delta target ≤ 100KB gzip including fonts.
- Preserve every existing component's behavior and props. Only CSS
  changes.
- Phase 5.5's dark-mode token list is superseded by §3.5 of this
  spec. Document the mapping in the PR.

Deliverable: a token system that makes the app feel like a 2026
product instead of a 2009 utility, and a documented vocabulary that
prevents the next agent from inventing one-off values.
```

---

## 11. After this — what's next

Path 2 (separate spec, separate phase) handles the things tokens *can't* fix on their own:

- Motion choreography: route transitions, modal enter/exit, list reordering.
- Considered loading states (skeletons that mimic the actual content shape, progressive reveal).
- Empty states with personality and a clear next action.
- Micro-interactions on the worksheet: focus-following indicator on the active section, smarter scroll-spy for the TOC, animated checkmarks on completed sections.
- A Command-K palette for instructor preview/lab switching.
- Optional: shadcn-style primitive components (Dialog, Popover, Toast, Tooltip) sitting on top of our tokens.

None of those are worth doing before Path 1 lands. They compound on the foundation.
