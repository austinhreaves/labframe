# Overleaf-lite: Mixed Text and Math Mode for the Equation Editor

**Status:** Draft
**Created:** 2026-06-25
**Prereq:** Equation editor polish pass (keyboard toggle, button renames, newline fix) -- landed on `claude/lucid-hugle-0ab3bf`.

---

## Overview

The equation editor currently has two input modes:

| Mode                              | How you input                                                        | What is stored in `value.text`           |
| --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| **math** ("Use equation builder") | MathLive WYSIWYG -- click symbols or type LaTeX, see rendered output | Raw LaTeX, no delimiters (`\frac{a}{b}`) |
| **latex** ("Type with LaTeX")     | Plain `<textarea>` -- type raw LaTeX, see per-line KaTeX preview     | Same raw LaTeX, no delimiters            |

Neither mode lets students mix prose with equations. A student writing "Using Snell's Law: n1 sin(theta1) = n2 sin(theta2), we find..." has no way to produce that sentence with rendered inline math short of building it all in the WYSIWYG builder.

This spec converts **latex mode** into a **mixed text-and-math mode**: prose renders as text, `$...$` marks inline math, and `$$...$$` marks display equations. The preview already uses `MarkdownBlock` for lab instructions and renders exactly this syntax -- this spec wires student answers to the same pipeline, and carries the result through to the PDF.

---

## Goals

1. Students can type a mix of prose and math in the textarea using standard `$...$` / `$$...$$` delimiters.
2. The live preview renders the mixed content the same way lab instructions render (remark-math + rehype-katex).
3. The PDF report renders the same mixed content via the existing `renderMarkdownToPdf` pipeline.
4. Students who switch from the WYSIWYG builder still see the stored LaTeX in the textarea unchanged; the migration hint tells them to add `$$...$$` if they want it to render as math.

## Non-goals

- Changes to **math mode** (the WYSIWYG MathLive builder). It is unaffected.
- Improving block-math PDF rendering beyond the existing unicode fallback. That requires server-side KaTeX and belongs in a separate spec.
- Syntax highlighting or autocomplete in the textarea.
- Phone-width layout; tablet/desktop only.

---

## What changes

### 1. `src/ui/primitives/EquationEditor.tsx`

**Button label.** The toggle button that switches into latex/mixed mode currently reads `Type with LaTeX` (set in the polish pass). Change it to `Type text and equations`. The back-label `Use equation builder` stays.

**Preview.** Replace the `latexPreviewLines` useMemo and the per-line KaTeX render with `<MarkdownBlock markdown={effective.text} />`. This renders via the same remark-math + rehype-katex + rehype-sanitize pipeline used for lab instructions.

Remove the `import katex from 'katex'` import -- it is no longer used in this component after the preview swap. (`MarkdownBlock` calls rehype-katex internally.)

**Textarea placeholder.** Add a `placeholder` prop to the `<textarea>`:

```
Type text normally. Use $...$ for inline math (e.g. $F = ma$) and $$...$$ for display equations.
```

**Migration hint.** When `mode === 'latex'` and `effective.text` contains `\` but no `$` (i.e. the stored value looks like bare LaTeX without delimiters), render a dismissible info callout above the textarea:

```
Your equation was entered in raw LaTeX mode. To render it as math here, wrap it in $$...$$.
```

Detection: `effective.text.includes('\\') && !effective.text.includes('$')`.

The hint is stateless -- it disappears as soon as the student adds a `$`. No new state, no persistent dismissal flag.

**CSS impact in `src/main.css`.** Remove the 3a spacing rule that added gap between per-line preview divs:

```css
/* REMOVE -- 3a artifact, no longer needed after preview swaps to MarkdownBlock */
.equation-editor-katex > div + div {
  margin-top: var(--space-1);
}
```

The `.equation-editor-katex` class can stay as a scoping container; its only remaining rule is `overflow-x: auto`.

If the migration hint needs a new style, reuse the existing `.markdown-callout-note` / `.markdown-callout` styles (already defined in `src/main.css` for lab instructions) via a wrapping `aside`. No new CSS class needed.

---

### 2. `src/services/pdf/Document.tsx`

In the `calculation` section branch, the `mode === 'text'` path (around line 305) currently calls `fieldView(answers.fields[section.fieldId])`. For `equationEditor: true` sections, route through `renderMarkdownToPdf` instead.

Precise change -- replace the final return in the `calculation` block (the plain-text / `fieldView` fallback) with:

```tsx
const answer = answers.fields[section.fieldId];
if (section.equationEditor) {
  const text = answer?.text?.trim() ?? '';
  return (
    <View key={`section-${index}`} style={styles.section}>
      {header}
      {text ? <View>{renderMarkdownToPdf(text)}</View> : <Text style={styles.row}>-</Text>}
    </View>
  );
}
return (
  <View key={`section-${index}`} style={styles.section}>
    {header}
    {fieldView(answer)}
  </View>
);
```

Both `renderMarkdownToPdf` and `renderMarkdownToPdf` are already imported. The empty-answer case must still render `-` to match existing snapshot tests.

**Paste attribution trade-off.** `fieldView` uses `attributePastes` to color-code pasted spans (italic for clipboard, blue for autocomplete). `renderMarkdownToPdf` has no concept of paste attribution. For `equationEditor: true` sections, this coloring is deliberately dropped in favour of readable rendered output. This is a known and intentional trade-off -- note it in the code comment at the branch.

---

## Known limitations

- **Block math in the PDF** (`$$...$$`) uses `latexToUnicode` as a unicode fallback, not rendered KaTeX. This is the existing limitation of `renderMarkdownToPdf` (it logs a dev warning: "Block math fallback active"). Improving this requires server-side KaTeX rendering and is out of scope.
- **Math mode (WYSIWYG) is unaffected.** The value it stores is raw LaTeX without `$` delimiters. The LaTeX source preview panel below the math-field still shows the raw string. Students who use only the WYSIWYG builder never see the mixed mode.
- **Students who had raw LaTeX in the textarea** (typed in the old "Type with LaTeX" mode) will see the migration hint until they add `$$...$$` delimiters. Their stored `value.text` is unchanged; no data migration is needed.

---

## Test plan

### Unit -- `tests/unit/equationEditor.test.tsx`

- **Update** `it('renders katex preview in latex mode', ...)`: the preview is now a MarkdownBlock. Check that `.equation-editor-preview` contains KaTeX-rendered output (presence of a `.katex` class element, or that `textContent` contains the rendered symbol). Remove the old `.equation-editor-katex` child-count assertion from the 3a "newline" test (that test no longer applies once MarkdownBlock owns the preview -- MarkdownBlock renders multi-line content as multiple paragraphs naturally).
- **Add** `it('shows migration hint when stored text has backslashes but no $ delimiters', ...)`: switch to latex mode, fire an input event that sets text to `\frac{mc^2}{2}`, assert a hint element is present. Add another assertion that the hint disappears when text is changed to `$$\frac{mc^2}{2}$$`.
- **Update** button-label assertions from `'Type with LaTeX'` to `'Type text and equations'`.

### Unit -- `tests/unit/renderPdf.test.tsx`

- **Add** a test that a `calculation` section with `equationEditor: true` and answer text `'n_2 = $\\frac{n_1 \\sin\\theta_1}{\\sin\\theta_2}$'` renders to PDF text containing `n₂` or `sinθ` (via `latexToUnicode` through `renderMarkdownToPdf`). Use the `LabReportDocument` fixture pattern already in the file.
- **Verify** the existing Snell's Law inline snapshot still passes. The Snell's Law calculation sections all have `equationEditor: true` and the fixture answers are empty, so they hit the `!text` branch and render `-` -- the snapshot is unaffected.

### E2E

No new E2E test required. The existing `equationKeyboard.spec.ts` (from the polish pass) already covers the equation editor loading on the Snell's Law lab. The MarkdownBlock preview change is covered by unit tests.

---

## Files to read before starting

In order:

1. `src/ui/primitives/EquationEditor.tsx` -- the full component; understand the `mode` state, `latexPreviewLines`, the toolbar JSX, and the keyboard toggle added in the polish pass.
2. `src/ui/primitives/MarkdownBlock.tsx` -- the existing markdown+math renderer you are wiring into the preview.
3. `src/services/pdf/Document.tsx` -- specifically `fieldView()` (~line 137) and the `calculation` section branch (~line 257). Read carefully; `renderMarkdownToPdf` is already imported.
4. `src/services/pdf/markdown/renderMarkdownToPdf.ts` -- understand the `math` and `inlineMath` node types and the unicode fallback.
5. `tests/unit/equationEditor.test.tsx` -- all existing tests; you will update several.
6. `tests/unit/renderPdf.test.tsx` -- the existing inline snapshots; understand what will and will not change.
7. `src/main.css` lines ~2095-2214 -- the equation editor CSS; find and remove the 3a spacing rule.

---

## Agent handoff

```
You are implementing the Overleaf-lite mixed text-and-math mode for LabFrame's equation editor.
The spec is at docs/specs/OVERLEAF_LITE_SPEC.md. Read it in full before writing any code.

Context from the previous session:
- The equation editor polish pass just landed on branch claude/lucid-hugle-0ab3bf. It:
  - Renamed buttons to "Type with LaTeX" / "Use equation builder"
  - Added a manual virtual-keyboard toggle
  - Made the latex-mode preview render each newline as a separate KaTeX block (the 3a fix)
- This task (3b) goes further: replace the per-line KaTeX preview with MarkdownBlock, and update
  the PDF renderer to use renderMarkdownToPdf for equationEditor sections.

What you must do:
1. Read the seven files listed in the spec before touching anything.
2. Make the changes described in the spec exactly -- no extra refactoring.
3. Update tests as described. Run `npm run ci` (typecheck + lint + format + unit tests) and fix
   any failures before considering the task done.
4. The renderPdf.test.tsx inline snapshot for the Snell's Law lab must still pass unchanged.
   If it fails, investigate before overwriting it -- it probably means the empty-answer
   branch is wrong.

Rules:
- No em dashes anywhere -- prose, comments, commit messages. Hyphen or rewrite.
- No changes to CalculationSection schema.
- Math mode (MathLive WYSIWYG) must remain fully functional and unchanged.
- Use `npm run typecheck` (not `npx tsc --noEmit`) -- exactOptionalPropertyTypes is in
  tsconfig.app.json only and a flat tsc invocation will miss type errors.
- The PowerShell tool is broken in this harness -- run shell commands via the Bash tool,
  calling pwsh -NoProfile -Command '...' for any PowerShell-specific syntax.
```
