# LabFrame — Polish Spec A: Form Primitives

**Audience:** Austin (ASU IPL) + downstream coding agents
**Status:** Builds on POLISH_PASS_SPEC.md (Path 1, tokens). First spec in the Path 2 lineage.
**Working name:** Phase 5.8 — Form Primitives
**Prereq:** Path 1 token system landed (`src/ui/tokens.css`, `src/ui/base.css`, Lucide icons).

---

## 0. TL;DR

Native form chrome is the single loudest "old web" signal left in the app. Three `<select>` elements pull the OS dropdown, one `<input type="file">` renders the gray "Choose File / No file selected" string, two checkboxes inherit the default checkmark, and the progress bar is the browser's `<progress>` element. None of these are styled — they all show whatever Chrome/Safari/Firefox decides on the user's OS.

This phase ships four token-driven form primitives and applies them at every existing usage:

1. `Select` — restyled native `<select>` with custom chevron, token border, focus ring, hover.
2. `Checkbox` — custom-rendered checkbox using a hidden native input + visible square with a Lucide Check icon.
3. `Progress` — styled `<div role="progressbar">` replacing native `<progress>`.
4. `FileDropzone` — drag-and-drop area with thumbnail preview, remove button, and an accessible file input underneath.

Done well, this closes the largest remaining gap between "looks like a 2009 utility" and "looks like a 2026 product" — because users see native form chrome on every single lab page (theme picker, fit picker, image upload, progress bar) and every single integrity submission (checkboxes). Each primitive is small, but the visible-surface coverage is enormous.

**Honest scope estimate:** one day for the four primitives, half a day to swap call sites and verify. Call it two focused days.

---

## 1. Why this matters now

Path 1 made the app *coherent* — every neutral, spacing, and shadow comes from the token system. But the eye is still drawn to the four places where the token system *can't reach*: form controls that the browser renders directly.

Concretely, every PHY 132 lab page renders:
- A `<select>` for the theme picker ([LabPage.tsx:427](src/ui/LabPage.tsx:427))
- A `<select>` for the simulation picker if there's more than one ([LabPage.tsx:366](src/ui/LabPage.tsx:366))
- A native `<progress>` bar ([ProgressBar.tsx:81](src/ui/ProgressBar.tsx:81))
- At least one `<select>` for fit choice on plot sections ([PlotSectionView.tsx:25](src/ui/sections/PlotSectionView.tsx:25))
- An `<input type="file">` on any image-upload section ([ImageUploader.tsx:26](src/ui/primitives/ImageUploader.tsx:26))
- Two native checkboxes on the integrity gate at the bottom of every lab ([IntegrityAgreement.tsx:39](src/ui/IntegrityAgreement.tsx:39))

That's six native-chrome moments on a typical lab page, including the very last action (Export PDF gate). Each one is a small "this isn't a designed product" tax. Together they read as MySpace.

---

## 2. Goals & non-goals

### 2.1 Goals

1. Ship four primitives in `src/ui/primitives/` that consume only tokens and match the design system's focus/hover/transition conventions.
2. Replace every existing call site with the primitive — six sites total, listed in §6.
3. Preserve accessibility: native `<select>` and `<input>` remain the underlying element; keyboard, screen reader, and form-submission semantics are unchanged.
4. Match dark mode. Verify in both themes per primitive.
5. Add visual regression coverage: Playwright snapshots of each primitive in default/hover/focus/checked/error states.

### 2.2 Non-goals

- **No combobox / typeahead / multiselect.** `Select` stays a native single-select; we restyle the closed state aggressively and accept the native popup. Building a real listbox is a much larger commitment and not required for the visual gap we're closing.
- **No date pickers / number steppers / time inputs.** Out of scope.
- **No form-validation library.** Existing per-component error handling stays as-is.
- **No motion beyond Path 1's transition tokens.** Checkbox check-icon entrance is allowed (it's a state transition, not choreography).
- **No CSS-in-JS, no Tailwind, no Radix Primitives wrappers.** Keep the stack flat: React component + companion class names in `main.css`.

### 2.3 What this *won't* fix

Native popup chrome on `<select>` (the dropdown menu itself, once opened) is still browser-controlled. We're styling the closed trigger to look like our app; the open menu still looks like Chrome's. That's an acceptable tradeoff — students see the closed state 99% of the time and the trigger is what reads as "designed."

If we ever need to ship a true listbox (typeahead, multi-select, rich options), it becomes a separate primitive named `Listbox`. Don't try to fix it inside `Select`.

---

## 3. Primitives

All primitives live in `src/ui/primitives/`. Each one:
- Exports a single React component plus its prop types.
- Has a companion class block in `src/main.css` consuming only tokens.
- Accepts `id`, `aria-label` / `aria-labelledby`, and `disabled` as standard props.
- Forwards refs where it makes sense (form integration, focus management).

### 3.1 `Select`

**Approach:** keep the native `<select>` for a11y, but `appearance: none` + custom chevron + token-driven padding/border/focus.

**Props:**

```ts
type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;           // renders as a disabled first option
  disabled?: boolean;
  size?: 'sm' | 'md';             // 'md' default; 'sm' for inline / table use
  invalid?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};
```

**Markup:**

```tsx
<div className="select" data-size={size} data-invalid={invalid || undefined}>
  <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.currentTarget.value)} aria-label={...}>
    {placeholder ? <option value="" disabled>{placeholder}</option> : null}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
    ))}
  </select>
  <ChevronDown aria-hidden="true" className="select-chevron" />
</div>
```

**CSS skeleton (in `main.css`):**

```css
.select {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
}
.select > select {
  appearance: none;
  -webkit-appearance: none;
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font: inherit;
  padding: var(--space-2) calc(var(--space-7) - var(--space-2)) var(--space-2) var(--space-3);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}
.select > select:hover { border-color: var(--border-strong); }
.select > select:focus-visible {
  outline: none;
  border-color: var(--accent-600);
  box-shadow: 0 0 0 3px var(--accent-100);
}
.select > select:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
  background: var(--surface-sunken);
}
.select[data-size='sm'] > select {
  padding: var(--space-1) calc(var(--space-6) - var(--space-1)) var(--space-1) var(--space-2);
  font-size: var(--text-sm);
}
.select[data-invalid='true'] > select { border-color: var(--danger-border); }

.select-chevron {
  position: absolute;
  right: var(--space-2);
  pointer-events: none;
  color: var(--text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
}
.select > select:hover ~ .select-chevron,
.select > select:focus-visible ~ .select-chevron {
  color: var(--text-primary);
}
```

**Dark mode:** no extra rules required — every value is a token.

**Caveats / known quirks:**
- Firefox respects `appearance: none` differently on `<select>` — the option list still uses native chrome, which is fine.
- Don't set `background-image` for the chevron; use a real SVG component for theming.
- Don't break form submission — keep the `<select>` named when used inside a `<form>` (none of our current call sites do, but the option should remain).

### 3.2 `Checkbox`

**Approach:** visually hidden native `<input type="checkbox">` for keyboard and AT support; visible square rendered next to it using a Lucide `Check` icon. The label wrapper handles click-to-toggle.

**Props:**

```ts
type CheckboxProps = {
  id?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  children: ReactNode;            // the label content (required)
};
```

**Markup:**

```tsx
<label className="checkbox" data-invalid={invalid || undefined}>
  <input
    id={id}
    type="checkbox"
    checked={checked}
    disabled={disabled}
    onChange={(e) => onChange(e.currentTarget.checked)}
  />
  <span className="checkbox-box" aria-hidden="true">
    <Check className="checkbox-check" />
  </span>
  <span className="checkbox-label">{children}</span>
</label>
```

**CSS skeleton:**

```css
.checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  line-height: var(--leading-prose);
}
.checkbox > input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  overflow: hidden;
  white-space: nowrap;
}
.checkbox-box {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  display: grid;
  place-items: center;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}
.checkbox-check {
  width: 14px;
  height: 14px;
  color: var(--accent-text-on);
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}
.checkbox > input:checked ~ .checkbox-box {
  background: var(--accent-bg);
  border-color: var(--accent-bg);
}
.checkbox > input:checked ~ .checkbox-box .checkbox-check {
  opacity: 1;
  transform: scale(1);
}
.checkbox:hover .checkbox-box { border-color: var(--border-strong); }
.checkbox > input:focus-visible ~ .checkbox-box {
  box-shadow: 0 0 0 3px var(--accent-100);
  border-color: var(--accent-600);
}
.checkbox > input:disabled ~ .checkbox-box {
  background: var(--surface-sunken);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}
.checkbox > input:disabled ~ .checkbox-label {
  color: var(--text-disabled);
  cursor: not-allowed;
}
.checkbox[data-invalid='true'] .checkbox-box { border-color: var(--danger-border); }
```

**Notes:**
- The check icon fades in on state change. This is a state transition (allowed by Path 1) — *not* general motion choreography (which is Path 2 motion spec).
- `prefers-reduced-motion` is already handled by `base.css`.

### 3.3 `Progress`

**Approach:** replace native `<progress>` with a token-driven div bar. Gives us a real accent fill, smooth transitions, and consistent appearance across browsers.

**Props:**

```ts
type ProgressProps = {
  value: number;      // 0..max
  max: number;
  label?: string;     // visually rendered above bar; also aria-label fallback
  size?: 'sm' | 'md'; // 'sm' default for header chrome
};
```

**Markup:**

```tsx
<div className="progress" data-size={size}>
  {label ? <span className="progress-label">{label}</span> : null}
  <div
    className="progress-track"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-label={label}
  >
    <div className="progress-fill" style={{ width: `${(value / Math.max(max, 1)) * 100}%` }} />
  </div>
</div>
```

**CSS skeleton:**

```css
.progress {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 144px;
}
.progress-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}
.progress-track {
  flex: 1 1 auto;
  height: 6px;
  background: var(--surface-sunken);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}
.progress[data-size='sm'] .progress-track { height: 4px; }
.progress-fill {
  height: 100%;
  background: var(--accent-bg);
  border-radius: var(--radius-full);
  transition: width var(--duration-medium) var(--ease-out);
}
```

**Notes:**
- This is one of the few places in the app where accent color shows up in the chrome. That's intentional — the progress bar should *feel* like progress.
- The width transition is animated (duration-medium) so completing a section gives subtle satisfying motion.

### 3.4 `FileDropzone`

**Approach:** wrapper around `<input type="file">` that adds:
- A click-or-drop target with dashed border in idle state, accent border on hover/drag, danger border on rejected drops.
- Thumbnail preview (image only) when a file is loaded, with a small "Remove" button (ghost variant, see Spec B).
- Filename + size text under the thumbnail.
- The native input is visually hidden but reachable via keyboard (focusable through the wrapping label).

**Props:**

```ts
type FileDropzoneProps = {
  id?: string;
  value: { fileName: string; objectUrl: string; sizeBytes?: number } | undefined;
  accept?: string;             // 'image/*' for current usage
  maxBytes?: number;           // optional client-side size guard
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  label?: string;              // visible heading; default 'Upload image'
};
```

**Markup:**

```tsx
<div className="file-dropzone" data-dragging={dragging || undefined}>
  <label htmlFor={id} className="file-dropzone-target">
    <input
      id={id}
      type="file"
      accept={accept}
      onChange={(e) => onFileChange(e.currentTarget.files?.[0] ?? null)}
      disabled={disabled}
    />
    {value ? (
      <figure className="file-dropzone-preview">
        <img src={value.objectUrl} alt={value.fileName} />
        <figcaption>
          <span className="file-dropzone-filename">{value.fileName}</span>
          {value.sizeBytes ? <span className="file-dropzone-meta">{formatBytes(value.sizeBytes)}</span> : null}
        </figcaption>
      </figure>
    ) : (
      <div className="file-dropzone-empty">
        <ImagePlus aria-hidden="true" className="file-dropzone-icon" />
        <p className="file-dropzone-primary">Drop an image here or click to choose</p>
        <p className="file-dropzone-secondary">PNG, JPG, or HEIC up to {maxBytes ? formatBytes(maxBytes) : '5 MB'}</p>
      </div>
    )}
  </label>
  {value ? (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFileChange(null)}>
      Remove
    </button>
  ) : null}
</div>
```

**Drag-and-drop:** handle `dragenter` / `dragleave` / `drop` on `.file-dropzone-target`. On drop, call `onFileChange(e.dataTransfer.files?.[0] ?? null)`. Cancel default on dragover so the browser doesn't navigate.

**CSS skeleton:**

```css
.file-dropzone {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}
.file-dropzone-target {
  display: block;
  border: 1.5px dashed var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  padding: var(--space-5);
  cursor: pointer;
  text-align: center;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}
.file-dropzone-target:hover {
  border-color: var(--border-accent);
  background: var(--accent-soft);
}
.file-dropzone[data-dragging='true'] .file-dropzone-target {
  border-color: var(--accent-600);
  background: var(--accent-soft);
}
.file-dropzone-target > input { /* visually hidden; same pattern as Checkbox */ }
.file-dropzone-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
}
.file-dropzone-icon { color: var(--text-tertiary); width: 32px; height: 32px; }
.file-dropzone-primary { color: var(--text-primary); font-weight: var(--weight-medium); }
.file-dropzone-secondary { color: var(--text-tertiary); font-size: var(--text-sm); }
.file-dropzone-preview img {
  max-width: 100%;
  max-height: 240px;
  border-radius: var(--radius-sm);
}
.file-dropzone-preview figcaption {
  margin-top: var(--space-2);
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
```

**Notes:**
- `ImagePlus` is a Lucide icon. For non-image accepts in the future, swap to `FilePlus`.
- The `Remove` button reuses Spec B's ghost variant. If Spec B hasn't shipped yet, use a plain `<button>` with `.file-dropzone-remove` class and a one-off rule consuming tokens.
- The `Choose File` browser button is now invisible. The clickable target is the whole dashed area.
- This component does *not* validate file size or type beyond what the native `accept` attribute does. `maxBytes` is a UI hint only. Server-side / store-side limits remain unchanged.

---

## 4. Call sites

Six existing usages to migrate. Each gets one focused commit.

| # | File | Line | Today | Replace with |
|---|------|------|-------|--------------|
| 1 | [src/ui/LabPage.tsx](src/ui/LabPage.tsx) | ~366 | `<select>` simulation picker | `<Select>` (size `md`) |
| 2 | [src/ui/LabPage.tsx](src/ui/LabPage.tsx) | ~427 | `<select>` theme picker | `<Select>` (size `sm`)¹ |
| 3 | [src/ui/sections/PlotSectionView.tsx](src/ui/sections/PlotSectionView.tsx) | ~25 | `<select>` fit picker | `<Select>` (size `md`)² |
| 4 | [src/ui/ProgressBar.tsx](src/ui/ProgressBar.tsx) | ~81 | `<progress>` | `<Progress>` |
| 5 | [src/ui/IntegrityAgreement.tsx](src/ui/IntegrityAgreement.tsx) | ~39, ~50 | two `<input type="checkbox">` | `<Checkbox>` ×2 |
| 6 | [src/ui/primitives/ImageUploader.tsx](src/ui/primitives/ImageUploader.tsx) | whole file | `<input type="file">` + `<img>` | `<FileDropzone>` |

¹ The theme picker may be superseded by Spec B's icon-segmented control. Land `Select` here anyway — it's the right interim state, and the swap to a segmented control in Spec B will be a clean replacement.

² The plot fit picker could later become a segmented control (No fit / Linear / Quadratic / Custom) when there are ≤3 options. For now `Select` is correct because fit lists vary per lab.

The `ImageUploader` component stays as a component but is rewritten around `FileDropzone`. Its existing `caption` field stays — only the file-input portion changes.

---

## 5. File layout

```
src/ui/primitives/
  Select.tsx              (new)
  Checkbox.tsx            (new)
  Progress.tsx            (new)
  FileDropzone.tsx        (new)
  ImageUploader.tsx       (rewritten to use FileDropzone)
src/main.css              (new class blocks for each primitive)
```

No new top-level files. No new dependencies (Lucide already in the bundle).

---

## 6. Order of operations

Each step leaves the app working. Commit per step so regressions are bisectable.

1. **Ship `Progress`** — smallest primitive, single call site, lowest risk. Convert [ProgressBar.tsx](src/ui/ProgressBar.tsx) to use it. Verify in light + dark.
2. **Ship `Checkbox`** — convert both call sites in [IntegrityAgreement.tsx](src/ui/IntegrityAgreement.tsx). Verify the existing `.integrity-agreement-affirm` and `.integrity-agreement-ai-toggle` class rules don't conflict; remove the per-instance `width: 18px; height: 18px` overrides on the native input (they're now obsolete).
3. **Ship `Select`** — convert the three call sites (simulation, theme, fit). Verify keyboard navigation still works (arrow keys, Enter, Esc).
4. **Ship `FileDropzone`** — convert [ImageUploader.tsx](src/ui/primitives/ImageUploader.tsx). Test drag-and-drop in Chrome, Safari, Firefox. Verify large-image preview doesn't blow up the layout. Verify the existing IndexedDB persistence flow still receives a `File` correctly.
5. **Remove dead CSS** — the old `.image-uploader img` rule and any other rule rendered obsolete.
6. **Visual snapshots** — add Playwright snapshots for each primitive in default / hover / focus / checked / error / disabled states. Snapshots go in `tests/visual/primitives/`.
7. **axe-core sweep** — verify no a11y regressions in light or dark.
8. **`npm run lint && npm run lint:styles && npm run typecheck && npm test`** — all green.

---

## 7. Decisions to make

1. **Should `Select` be a styled native or a real listbox?** Styled native. The visual gap is in the *closed* trigger, not the open menu. Building a real listbox is a separate, larger commit and not needed here. Documented in §2.2.
2. **Should `Checkbox` use `accent-color`?** No. `accent-color` only retints the native checkbox; it doesn't fix sizing, border radius, or the focus ring. Custom rendering is cleaner.
3. **Should `FileDropzone` allow multiple files?** No, not in v1. Every current call site is single-file. If multi-file becomes a need, add a `multiple` prop later.
4. **Should `FileDropzone` show upload progress?** No, not in v1. Uploads in this app are synchronous (`URL.createObjectURL` + IndexedDB write) and complete in <100ms even for large images. If we ever ship server uploads, add a progress indicator then.
5. **Should `Progress` animate the fill on every render?** Yes (`duration-medium`). It's a state transition, and the satisfaction of seeing "5/12 → 6/12" tick forward is a real micro-payoff.
6. **Where do the new CSS class blocks live?** Same place every other component class lives today: `src/main.css`. If `main.css` is split later, the primitive classes move with it. Don't preemptively split.

---

## 8. Definition of done

- Four primitives ship in `src/ui/primitives/`, each consuming only tokens.
- All six call sites converted; no native `<select>`, `<progress>`, `<input type="checkbox">`, or `<input type="file">` outside the primitive implementations.
- Both themes verified by screenshot. Before/after pasted in PR description.
- Playwright snapshots cover default / hover / focus / checked / error / disabled states.
- axe-core: WCAG AA contrast everywhere; keyboard navigation parity with the native control for every primitive.
- `npm run lint && npm run lint:styles && npm run typecheck && npm test && npx playwright test` — all green.
- `DESIGN_SYSTEM.md` updated with a short "Form primitives" section linking each primitive to the canonical example.
- No raw hex, no raw rem, no raw shadow added anywhere (stylelint enforces).

---

## 9. Risks and rollback

- **`appearance: none` on `<select>` in older Safari:** test on Safari 16+. If a regression appears, fall back to native chrome behind a feature query — students using ancient browsers see native, everyone else sees styled.
- **Drag-and-drop on touch devices:** drop is a no-op on most touch devices; tap-to-choose remains the primary path. Verify that the dashed area is a single-tap target.
- **Preview blob URLs:** ensure `URL.revokeObjectURL` is still called when `FileDropzone` unmounts or the file changes (this is currently handled in the store / `ImageUploader` parent; verify the rewrite doesn't drop it).

Each primitive ships in its own commit. If one breaks, revert that commit and the others stand.

---

## 10. Agent prompt

```
Visual primitives migration for LabFrame. Goal: replace every native
form control (select, file input, checkbox, progress) with token-driven
React primitives that consume the Path 1 design system. No new
dependencies. No layout changes. Pure visual layer.

Read POLISH_SPEC_A_FORM_PRIMITIVES.md end-to-end before starting.
Especially §3 (primitive specs), §4 (call site table), §6 (order of
operations).

Constraints:
- Native <select>, <input type="checkbox">, <input type="file"> remain
  the underlying element for accessibility and form integration. We
  restyle the visible chrome — we do NOT reimplement the semantics.
- Native <progress> is replaced by <div role="progressbar"> because the
  native element is impossible to style consistently across browsers.
- No CSS-in-JS, no Tailwind, no Radix Primitives. Plain React
  components + companion class blocks in src/main.css consuming tokens.
- Every primitive must verify in both themes (data-theme="light",
  data-theme="dark").
- Preserve all existing behavior of the parent components. Only the
  rendering layer changes.

Tasks (commit per task):

1. Create src/ui/primitives/Progress.tsx with the props and markup in
   §3.3. Add CSS class block to src/main.css. Convert
   src/ui/ProgressBar.tsx to use it. Verify dark mode.

2. Create src/ui/primitives/Checkbox.tsx with the props and markup in
   §3.2. Add CSS class block. Convert the two call sites in
   src/ui/IntegrityAgreement.tsx (the affirm checkbox and the
   AI-toggle checkbox). Remove obsolete width/height overrides in the
   .integrity-agreement-affirm and .integrity-agreement-ai-toggle
   rules. Verify dark mode.

3. Create src/ui/primitives/Select.tsx with the props and markup in
   §3.1. Add CSS class block. Convert the three call sites:
   - src/ui/LabPage.tsx simulation picker (~line 366), size 'md'
   - src/ui/LabPage.tsx theme picker (~line 427), size 'sm'
   - src/ui/sections/PlotSectionView.tsx fit picker (~line 25),
     size 'md'
   Verify keyboard navigation (arrow keys, Enter, Esc) still works.
   Verify dark mode.

4. Create src/ui/primitives/FileDropzone.tsx with the props and markup
   in §3.4, including drag-and-drop handlers. Add CSS class block.
   Rewrite src/ui/primitives/ImageUploader.tsx to use FileDropzone for
   the file-input portion; keep the caption Field as-is. Verify
   drag-and-drop in Chrome, Safari, Firefox. Verify that the existing
   IndexedDB attachment persistence flow continues to receive the File
   correctly (the parent's onImageChange handler should be unchanged
   in behavior).

5. Sweep src/main.css for now-dead rules (e.g., .image-uploader img if
   no longer applicable). Remove.

6. Add Playwright visual snapshots for each primitive in default /
   hover / focus / checked / error / disabled states. Snapshots in
   tests/visual/primitives/.

7. Run axe-core in both themes. Fix any contrast regressions before
   declaring done.

8. Update DESIGN_SYSTEM.md with a short "Form primitives" subsection
   listing each component and pointing to its file.

9. npm run lint && npm run lint:styles && npm run typecheck &&
   npm test && npx playwright test — all green.

10. Before/after screenshots of: theme picker, simulation picker, plot
    fit picker, image upload (empty + with image), integrity checkbox
    pair, progress bar. Both themes. Paste in PR description.

Deliverable: every native form control on a LabFrame lab page is
replaced with a designed primitive that looks like it belongs to the
2026-era LabFrame brand, with zero behavioral regression and full a11y
preservation.
```
