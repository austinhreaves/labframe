# LabFrame — Polish Spec B: Buttons & Segmented Controls

**Audience:** Austin (ASU IPL) + downstream coding agents
**Status:** Builds on the shipped token system and form primitives (archived: docs/archive/POLISH_PASS_SPEC.md, docs/archive/POLISH_SPEC_A_FORM_PRIMITIVES.md).
**Working name:** Phase 5.9 — Button Hierarchy & Segmented Controls
**Prereq:** Path 1 tokens landed. Spec A form primitives landed (this spec references `Select` for one supersede case and reuses `btn-ghost` for the file-remove button).

---

## 0. TL;DR

Every `<button>` in LabFrame today renders with the same neutral base style. The user can't tell at a glance which action is primary, which is destructive, which is utility chrome. "Export PDF" (the only action that actually matters on a lab page) looks identical to "About," "Got it," and "Start fresh" (the destructive one).

This phase ships two primitives and applies them across the app:

1. `Button` — variants `primary` / `secondary` / `ghost` / `danger` / `subtle`, sizes `sm` / `md` / `lg`, optional leading/trailing icons.
2. `SegmentedControl` — typed list of options rendered as a connected button group with one active selection.

It also restructures the **lab header** ([src/ui/LabPage.tsx](src/ui/LabPage.tsx) lines ~413–512), which today is a wall of equally-weighted buttons. The restructure:

- Theme picker becomes an icon-only segmented control (Sun / Moon / Monitor).
- Layout (side-by-side / tabs) becomes a segmented control with icons.
- Swap-sides becomes an icon button next to the layout control, not a worded button on its own.
- About + Start fresh tuck into a kebab overflow menu.
- Save draft = secondary button. Export PDF (down on the integrity card) = the only primary button on the page.

Done well, the visual weight of the page tells the student exactly where to look. Today, the visual weight tells them nothing.

**Honest scope estimate:** half a day for the two primitives, one day for the header restructure and call-site sweep, half a day for the overflow menu primitive. Two focused days.

---

## 1. Why this matters now

A modern app uses button weight to communicate hierarchy. LabFrame currently uses _no_ button weight, so:

- A new student lands on a lab page and sees seven buttons in the header, plus more inline. None of them looks more important than the others.
- "Start fresh" (which wipes the lab) sits next to "Save draft" (which exports progress). Visually identical. Mis-click risk.
- "Export PDF" is the only button that fulfills the assignment. It's at the bottom of the page in a card that looks identical to every other card. There is no "this is the action."
- "Side by side / Tabs" is two `<button aria-pressed>` elements with a hard 1px gap between them. It reads as two separate buttons that happen to be next to each other, not as one segmented control.

Path 1 already specs `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger` (see [POLISH_PASS_SPEC.md §4.2](../archive/POLISH_PASS_SPEC.md)). Path 1 did not actually apply them — every `<button>` in the app still renders with the default base style. This spec lands the application layer.

---

## 2. Goals & non-goals

### 2.1 Goals

1. Ship a `Button` React component with variants and sizes, plus a CSS class set (`.btn`, `.btn-primary`, etc.) usable on bare `<button>` elements when needed.
2. Ship a `SegmentedControl` primitive used in at least four sites in the lab header.
3. Restructure the lab header so visual weight matches action importance.
4. Apply button variants across every existing `<button>` in the app (sweep, not redesign).
5. Optional but recommended: ship a small `Menu` primitive (`Menubar`-style overflow) for the kebab menu in the header. If we don't, the kebab falls back to a `<details>` element — fine but uglier.

### 2.2 Non-goals

- **No icon-button library.** We keep using Lucide directly; `Button` exposes `leadingIcon` / `trailingIcon` props that accept any Lucide component (or any React node).
- **No tooltips primitive.** Icon-only buttons get `aria-label`; visible tooltips are out of scope (Path 2 motion spec, if ever).
- **No keyboard-shortcut overlay or Command-K palette.** Listed in [POLISH_PASS_SPEC.md §11](../archive/POLISH_PASS_SPEC.md) but separate spec.
- **No nested menus / submenus.** The kebab menu in this spec is one-level only: a flat list of actions.
- **No <Group> / <ButtonGroup> wrapper component.** SegmentedControl handles the only grouping case we currently need.

### 2.3 What this _won't_ fix

This phase makes hierarchy _visible_. It does not redesign IA — if "Start fresh" being one click away from primary actions is fundamentally the wrong UX, that's a separate decision. (Recommendation: move "Start fresh" behind the kebab menu, which this spec does.)

---

## 3. Primitives

### 3.1 `Button`

**Component:**

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant; // 'secondary' default
  size?: ButtonSize; // 'md' default
  leadingIcon?: ReactNode; // Lucide component or any node
  trailingIcon?: ReactNode;
  loading?: boolean; // shows a spinner, disables click
  fullWidth?: boolean;
  // plus everything React.ButtonHTMLAttributes<HTMLButtonElement> supports
} & ButtonHTMLAttributes<HTMLButtonElement>;
```

`Button` forwards a ref, defaults `type="button"` (saves several "button submitted a form" bugs), and applies the right combination of `.btn`, `.btn-<variant>`, `.btn-<size>` class names.

**Variant semantics:**

| Variant     | When to use                                                                                                                    | Examples in app                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `primary`   | The single highest-importance action on a surface. Filled accent.                                                              | "Export PDF" (lab page), "Continue" (catalog wizard), "Submit" (any submission flow)   |
| `secondary` | Important but not the singular call-to-action. Bordered, neutral fill.                                                         | "Save draft", "Browse all labs", "Got it" on banner                                    |
| `ghost`     | Tertiary / utility. No border, no fill, hover gets a soft surface.                                                             | Header utility buttons, "Back" links rendered as buttons, "Remove" inside FileDropzone |
| `danger`    | Destructive action. Red/danger semantic.                                                                                       | "Start fresh", "Delete" in storage error banner                                        |
| `subtle`    | Toolbar / inline / icon-pill. Small surface tint on hover only. Mostly for equation symbol palette and similar dense toolbars. | Equation symbol buttons, table column header actions                                   |

**Size semantics:**

| Size | Padding                         | Font          | Use                                        |
| ---- | ------------------------------- | ------------- | ------------------------------------------ |
| `sm` | `var(--space-1) var(--space-2)` | `--text-sm`   | Header chrome, table cells, dense toolbars |
| `md` | `var(--space-2) var(--space-4)` | `--text-sm`   | Default. Inline actions, dialog actions.   |
| `lg` | `var(--space-3) var(--space-5)` | `--text-base` | Primary CTAs (Export PDF, Continue)        |

**CSS skeleton (in `main.css`):**

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}
.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.btn:disabled,
.btn[aria-disabled='true'] {
  color: var(--text-disabled);
  cursor: not-allowed;
  background: transparent;
  border-color: transparent;
}
.btn[data-loading='true'] {
  cursor: progress;
  opacity: 0.7;
}

/* Sizes */
.btn-sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  min-height: 28px;
}
.btn-md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  min-height: 36px;
}
.btn-lg {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
  min-height: 44px;
}

/* Variants */
.btn-primary {
  background: var(--accent-bg);
  border-color: var(--accent-bg);
  color: var(--accent-text-on);
}
.btn-primary:hover {
  background: var(--accent-bg-hover);
  border-color: var(--accent-bg-hover);
}
.btn-primary:disabled {
  background: var(--neutral-200);
  border-color: var(--neutral-200);
  color: var(--text-disabled);
}

.btn-secondary {
  background: var(--surface-raised);
  border-color: var(--border-default);
  color: var(--text-primary);
}
.btn-secondary:hover {
  border-color: var(--border-strong);
  background: var(--surface-sunken);
}

.btn-ghost {
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--surface-raised);
  border-color: var(--danger-border);
  color: var(--danger-text);
}
.btn-danger:hover {
  background: var(--danger-bg);
  border-color: var(--danger-text);
}

.btn-subtle {
  color: var(--text-secondary);
  padding-inline: var(--space-2);
}
.btn-subtle:hover {
  background: var(--surface-sunken);
}

/* Modifiers */
.btn-full {
  width: 100%;
}
.btn-icon-only {
  aspect-ratio: 1 / 1;
  padding-inline: 0;
}
```

**The `aria-pressed` rule from main.css (lines 685–693) is removed.** It was a stopgap toggle style for unstyled buttons. SegmentedControl (§3.2) replaces every legitimate aria-pressed use case.

**The base `button { ... }` rule in main.css (lines 668–694) is shrunk.** It currently bakes in border, background, padding, etc., for any bare `<button>` — that bakes in the _secondary_ variant as the default. Instead:

```css
/* Reset only — no visual styling on bare button */
button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

After the sweep, every `<button>` in the app either uses `<Button>` or has explicit `.btn .btn-<variant>` classes. No "I'm a button just because I rendered as one" surprise styling.

### 3.2 `SegmentedControl`

**Component:**

```ts
type SegmentOption<V extends string> = {
  value: V;
  label?: string; // visible text; optional if icon provided
  icon?: ReactNode; // Lucide component or any node
  ariaLabel?: string; // required if icon-only
};

type SegmentedControlProps<V extends string> = {
  value: V;
  onChange: (next: V) => void;
  options: SegmentOption<V>[];
  size?: 'sm' | 'md'; // 'md' default
  fullWidth?: boolean;
  'aria-label': string; // required — the control's purpose
};
```

**Markup:**

```tsx
<div role="radiogroup" aria-label={ariaLabel} className="segmented" data-size={size}>
  {options.map((opt) => {
    const selected = opt.value === value;
    return (
      <button
        key={opt.value}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={opt.ariaLabel ?? opt.label}
        className="segmented-option"
        data-selected={selected || undefined}
        onClick={() => onChange(opt.value)}
      >
        {opt.icon ? <span className="segmented-icon">{opt.icon}</span> : null}
        {opt.label ? <span className="segmented-label">{opt.label}</span> : null}
      </button>
    );
  })}
</div>
```

**CSS skeleton:**

```css
.segmented {
  display: inline-flex;
  background: var(--surface-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}
.segmented-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font: var(--weight-medium) var(--text-sm)/var(--leading-ui) var(--font-sans);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}
.segmented-option:hover {
  color: var(--text-primary);
}
.segmented-option:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.segmented-option[data-selected] {
  background: var(--surface-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-1);
}
.segmented[data-size='sm'] .segmented-option {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  min-height: 22px;
}
```

**Keyboard:** native `<button>` semantics give us Tab to focus, Space/Enter to activate. Per WAI-ARIA Radio group, we should also support arrow keys to move between options:

- ArrowLeft / ArrowUp → previous option (with wrap)
- ArrowRight / ArrowDown → next option (with wrap)
- Selecting via arrow keys also activates the option (radio-group convention)

Implement once in the component.

### 3.3 `Menu` (optional but recommended)

**Component:**

```ts
type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  onSelect: () => void;
  disabled?: boolean;
};

type MenuProps = {
  trigger: ReactNode; // typically <Button variant="ghost" />
  items: MenuItem[];
  align?: 'start' | 'end'; // 'end' default for right-aligned headers
  'aria-label': string;
};
```

**Approach:** use a `<details>` element under the hood for "click to open, click outside to close" without managing focus or outside-click manually. The trigger is the `<summary>`. Items are buttons inside a `<div>` that takes overlay styling.

Yes, `<details>` is a hack for menus — it's not perfect from a strict ARIA standpoint (menus and disclosure widgets are different). For our use case (a tiny kebab with two actions) it's the cheapest workable approach. If we ever need a true menu with nested submenus or keyboard nav across items, swap to a hand-rolled popover.

If the team would rather not ship `Menu` in this spec, fall back to:

- Two more buttons in the lab header → keeps wall-of-buttons problem.
- A `<details>` block inline → ugly but functional. Use this if `Menu` slips.

We strongly recommend shipping `Menu`. The kebab pattern is what closes the "this header is busy" feeling.

**CSS skeleton:**

```css
.menu {
  position: relative;
}
.menu > summary {
  list-style: none;
  cursor: pointer;
  /* trigger inherits .btn classes from the button passed in */
}
.menu > summary::-webkit-details-marker {
  display: none;
}
.menu-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + var(--space-1));
  min-width: 200px;
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-3);
  padding: var(--space-1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.menu[data-align='end'] .menu-panel {
  right: 0;
}
.menu[data-align='start'] .menu-panel {
  left: 0;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--duration-fast) var(--ease-out);
}
.menu-item:hover {
  background: var(--surface-sunken);
}
.menu-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.menu-item[data-variant='danger'] {
  color: var(--danger-text);
}
.menu-item[data-variant='danger']:hover {
  background: var(--danger-bg);
}
```

---

## 4. Lab header restructure

[src/ui/LabPage.tsx](src/ui/LabPage.tsx) lines ~413–512 today render:

**Top row:** wordmark, back-to-course link · theme `<select>`, About button, LayoutToggle (2 buttons), Swap-sides button.
**Bottom row:** Table-of-contents disclosure, ProgressBar, Student input, save status · Start-fresh button, Save-draft button.

**After this spec:**

**Top row (right side):**

- `SegmentedControl` Theme: icon-only `[Sun] [Moon] [Monitor]`, size `sm`, `aria-label="Theme"`
- `SegmentedControl` Layout: `[PanelsTopLeft "Side"] [SquareSplitHorizontal "Tabs"]`, size `sm`, `aria-label="Layout"`
- Icon `Button` Swap sides: `<ArrowLeftRight />`, size `sm`, variant `ghost`, `aria-label="Swap simulation side"` — visible only when layout=side
- `Menu` (kebab): `<MoreHorizontal />` trigger as `ghost sm` icon button, items: "About", "Start fresh" (danger variant). `aria-label="More options"`

**Bottom row (right side):**

- `Button` "Save draft": variant `secondary`, size `md`, leading icon `<Save />`
- (Export PDF stays at the bottom of the page, on the integrity card — it's the _primary_, but it's not in the header. The header's primary visual hook is the Save draft button. This is correct: the header is for utility chrome; the final action lives at the bottom of the worksheet.)

**Bottom row (middle):**

- TableOfContents stays as-is (it's already a `<details>` popover styled per Path 1; out of scope here).
- ProgressBar — already migrated in Spec A.
- Student input — wrap the existing `<input>` in a `.field` style, no other change.
- Save status — replace the inline `<button>` info icon with a ghost icon `Button` (`<Info />`, size `sm`).

**Tabs row (when layout=tabs, lines ~611–637):**

- Replace the two `<button aria-pressed>` with `SegmentedControl` value=`tab` options `[{ value: 'simulation', label: 'Simulation' }, { value: 'worksheet', label: 'Worksheet' }]`, `aria-label="Active pane"`, size `md`.

**Banners:**

- Storage-note banner "Got it" button → `Button` variant `ghost` size `sm`.
- Storage-note banner "Details" button → `Button` variant `subtle` size `sm`.
- Persistence-error-list "Delete" buttons → `Button` variant `danger` size `sm`.

**Integrity card** (the spec for Spec C will cover this in depth; here we just upgrade the buttons):

- "Export PDF" → `Button` variant `primary` size `lg`, leading icon `<FileDown />`.

---

## 5. Supersedes from Spec A

Spec A landed `<Select>` on the theme picker. Spec B replaces it with `SegmentedControl`. Net result: `Select` is no longer used in the header. The `Select` primitive remains — it's still used by the simulation and fit pickers — but the theme call site is now superseded.

Document this in the PR: "Spec A landed `Select` on the theme picker as an interim improvement; Spec B replaces it with a more compact icon segmented control, which is the appropriate long-term shape for a 3-option binary-ish setting."

---

## 6. File layout

```
src/ui/primitives/
  Button.tsx              (new)
  SegmentedControl.tsx    (new)
  Menu.tsx                (new, optional but recommended)
src/main.css              (new class blocks: .btn-*, .segmented-*, .menu-*; shrunk base button rule)
src/ui/LabPage.tsx        (restructured header)
src/ui/layout/LayoutToggle.tsx  (rewritten to use SegmentedControl)
src/ui/layout/TabsView.tsx      (rewritten to use SegmentedControl)
src/ui/IntegrityAgreement.tsx   (Export PDF uses Button primary lg)
```

No new dependencies.

---

## 7. Order of operations

Each step leaves the app working. Commit per step.

1. **Ship `Button`.** Add component + CSS. Don't migrate anything yet. Verify hover/focus/disabled in light + dark.
2. **Shrink the base `button { ... }` rule** to a minimal reset (see §3.1). Verify nothing visually breaks (every existing `<button>` should still look passable — slightly more naked than before, but functional). This is the "everything's a ghost-y button" interim state.
3. **Migrate the lab header**, top to bottom: wordmark / back link, then each header button to its variant. Visual diff per change. Commit per logical group.
4. **Ship `SegmentedControl`.** Add component + CSS. Don't migrate yet. Verify keyboard nav (arrow keys cycle, Space/Enter activate).
5. **Migrate to SegmentedControl** in order of visibility:
   - LayoutToggle (in header)
   - Layout=tabs pane switcher (in LabPage.tsx ~611)
   - TabsView component (if used elsewhere)
6. **Ship `Menu`.** Add component + CSS. Migrate About + Start fresh into the kebab.
7. **Ship the Theme SegmentedControl.** This replaces Spec A's `Select` on the theme picker.
8. **Sweep remaining `<button>` elements** across the app:
   - [IntegrityAgreement.tsx](src/ui/IntegrityAgreement.tsx): Export PDF → primary lg with `<FileDown />` icon
   - LabPage.tsx storage banner buttons → ghost / subtle sm
   - LabPage.tsx persistence-error Delete → danger sm
   - Catalog.tsx wizard buttons → primary md for Continue/Skip, secondary md for Back (full Catalog rework is Spec D, but baseline variants land here)
   - EquationSymbolPalette buttons → subtle sm (these already feel close; just apply the variant class)
9. **Remove the `button[aria-pressed='true']` rule** in main.css. SegmentedControl owns the toggle visual now.
10. **Visual snapshots** — Playwright snapshots of: lab header (light + dark), each Button variant in default/hover/focus/disabled, SegmentedControl, Menu.
11. **axe-core sweep**, both themes. Verify radiogroup keyboard nav. WCAG AA.
12. **`npm run lint && npm run lint:styles && npm run typecheck && npm test && npx playwright test`** — all green.

---

## 8. Decisions to make

1. **Should we ship `Menu`?** Yes (recommended). Closes the wall-of-buttons problem in the header. If we skip, fall back to inline `<details>` blocks; functional but uglier.
2. **Should Save draft be primary or secondary?** Secondary. Export PDF is the singular primary action of a lab session; only one primary per surface. Save draft is important but not the action that fulfills the assignment.
3. **Should we color the Start fresh button danger, or just put it in the kebab?** Both — put it in the kebab _and_ style its menu item as `variant='danger'`. The kebab placement is the IA fix; the danger styling is the visual fix.
4. **Should the swap-sides icon button be visible when layout=tabs?** No, hide it. It does nothing when there's no left/right pane. Visibility is controlled by the existing `layout === 'side'` condition.
5. **Should we keep aria-pressed on toggle buttons elsewhere?** No remaining call sites should use it after the SegmentedControl migration. If a one-off toggle appears later, it should use Button + explicit aria-pressed; SegmentedControl is for ≥2 mutually-exclusive options.
6. **Does the Catalog wizard get the full button treatment in this spec or Spec D?** Buttons get variants here (Continue = primary, Back = secondary). Spec D handles the wizard layout, card grid, and overall catalog redesign. Don't duplicate.

---

## 9. Definition of done

- `Button`, `SegmentedControl`, and `Menu` ship in `src/ui/primitives/`.
- Lab header restructured per §4. Screenshots before/after in both themes.
- Every `<button>` in the app uses `<Button>` or has explicit `.btn .btn-<variant>` classes. No bare `<button>` relying on inherited base styles.
- The Path-1 base `button { ... }` rule is shrunk to a minimal reset.
- The `button[aria-pressed='true']` rule is removed from main.css.
- `LayoutToggle`, `TabsView`, and the layout=tabs pane switcher inside LabPage all use `SegmentedControl`.
- "About" and "Start fresh" live behind a kebab `Menu` in the lab header.
- Playwright visual snapshots cover Button (5 variants × 3 sizes × hover/focus/disabled — practical subset only), SegmentedControl (default + selected), Menu (closed + open), and the full restructured lab header in both themes.
- axe-core: WCAG AA, full keyboard navigation, radiogroup semantics intact.
- `npm run lint && npm run lint:styles && npm run typecheck && npm test && npx playwright test` — all green.
- `DESIGN_SYSTEM.md` updated with sections on Button variants, SegmentedControl, and Menu.

---

## 10. Risks and rollback

- **The shrunk base `button` rule (Step 2)** is the riskiest change — every bare `<button>` momentarily renders naked until step 8 finishes the sweep. Mitigation: do steps 1–2 in one PR, then the migration sweep is incremental commits inside the same PR. Don't merge until the sweep is done.
- **SegmentedControl arrow-key behavior** changes the keyboard model on toggles (was Tab + Space/Enter on each; now Tab once, then arrow keys). Document in PR; verify no integration with existing keyboard shortcuts.
- **Menu using `<details>`** is the least-orthodox choice. If a screen-reader user reports issues, fall back to a real popover with manual outside-click handling.

---

## 11. Agent prompt

```
Button hierarchy and segmented controls for LabFrame. Goal: replace
the wall of equally-weighted buttons with a real hierarchy
(primary/secondary/ghost/danger/subtle), introduce a SegmentedControl
primitive for grouped toggles, and restructure the lab header so
visual weight matches action importance.

Read POLISH_SPEC_B_BUTTONS_SEGMENTED.md end-to-end before starting.
Especially §3 (primitives), §4 (header restructure), §7 (order of
operations).

Prereq: Path 1 tokens (shipped; see docs/archive/POLISH_PASS_SPEC.md) AND
POLISH_SPEC_A_FORM_PRIMITIVES.md primitives are landed. This spec
supersedes Spec A's Select usage on the theme picker (it becomes a
SegmentedControl here).

Constraints:
- No new dependencies. Lucide is already in the bundle.
- No layout changes outside the lab header restructure described in
  §4. Other surfaces just receive variant class applications.
- The base button {...} CSS rule in src/main.css is shrunk to a
  minimal reset. After this spec, every <button> in the app uses
  <Button> or explicit .btn .btn-<variant> classes.
- SegmentedControl uses ARIA radiogroup semantics with arrow-key
  navigation per §3.2.
- Menu uses <details> under the hood — acceptable shortcut for our
  one-level kebab use case. If <details> behavior is unacceptable to
  reviewers, hand-roll a popover with outside-click handling.

Tasks (commit per task):

1. Create src/ui/primitives/Button.tsx with variants/sizes/icons per
   §3.1. Add .btn and .btn-* class blocks to src/main.css.

2. Shrink the base button {...} rule in src/main.css to a minimal
   reset (font/color inherit, focus ring, no border/padding/bg).
   Remove the button[aria-pressed='true'] rule. App is temporarily
   "naked" on bare buttons; subsequent tasks resolve.

3. Restructure the lab header per §4 (top row, bottom row, theme
   picker, layout toggle, swap sides, save draft). Apply Button
   variants throughout. Do NOT introduce SegmentedControl or Menu
   yet — leave those slots as Button variants temporarily.

4. Create src/ui/primitives/SegmentedControl.tsx per §3.2. Add
   .segmented* class blocks. Verify arrow-key navigation.

5. Migrate to SegmentedControl:
   - src/ui/layout/LayoutToggle.tsx
   - The layout=tabs pane switcher inside src/ui/LabPage.tsx (~line 611)
   - src/ui/layout/TabsView.tsx (the .tabs row)

6. Replace the theme <Select> from Spec A with a SegmentedControl
   (icon-only Sun / Moon / Monitor). Add aria-label="Theme". Remove
   the obsolete .lab-theme-select rule from main.css.

7. Create src/ui/primitives/Menu.tsx per §3.3 (using <details>). Add
   .menu* class blocks. Migrate "About" and "Start fresh" out of the
   header top row into a kebab Menu (trigger: ghost sm icon button
   with <MoreHorizontal />). Mark "Start fresh" as variant='danger'.

8. Sweep remaining <button> elements per §7 step 8:
   - IntegrityAgreement Export PDF: primary lg + <FileDown /> icon
   - Storage banner Got it / Details: ghost sm / subtle sm
   - Persistence error Delete: danger sm
   - Catalog wizard buttons: primary md (Continue/Skip), secondary md
     (Back) — full Catalog rework is Spec D
   - EquationSymbolPalette buttons: subtle sm

9. Playwright visual snapshots: lab header (light + dark), each
   Button variant (sample one size each), SegmentedControl
   (default + selected), Menu (closed + open).

10. axe-core both themes. Full keyboard navigation. Radio group
    semantics on SegmentedControl. WCAG AA.

11. Update DESIGN_SYSTEM.md with Button / SegmentedControl / Menu
    sections, including variant semantics and "when to use which"
    guidance.

12. npm run lint && npm run lint:styles && npm run typecheck &&
    npm test && npx playwright test — all green.

13. Before/after screenshots: full lab header (light + dark), the
    storage banner, the integrity card, and the catalog wizard
    buttons. Paste in PR description.

Deliverable: a LabFrame lab page where a student instantly sees that
Export PDF is the action, Save draft is secondary, layout/theme/swap
are utility chrome, and About/Start fresh are tucked-away options.
And every button in the app looks like it was designed by the same
person.
```
