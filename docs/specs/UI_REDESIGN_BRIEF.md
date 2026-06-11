# LabFrame UI Redesign: Design Brief

**Status:** Phase 0 checkpoint document. Presented for sign-off before mass implementation.
**Author:** Claude (June 2026), for Austin.
**Companion deliverables:** the evolved `src/ui/tokens.css` (token diff summarized in section 6) and a working catalog landing in both themes (the taste test).

---

## 1. Direction: "Ink and Graph"

LabFrame should feel like a well-made lab instrument sitting on a sheet of graph paper. Not a marketing site, not a dashboard. The student spends three hours here; the UI should read as something a careful person built for careful work.

Three pillars:

1. **Ink.** The identity color moves from generic framework blue (`#2563eb`, Tailwind blue-600) to a hand-tuned ultramarine ink ramp. It is the color of ballpoint pen on an engineering pad and of blueprint linework. It is close enough to the old blue that links still read as links, but it is unmistakably _ours_. A tiny warm "spark" amber exists only for illustration accents and quietly nods at ASU gold without doing branding cosplay.
2. **Graph.** The signature texture is a faint graph-paper grid, rendered in CSS from tokens, used on the hero band and (later, sparingly) behind terminal surfaces like the export card. It is the cheapest possible way to say "physics lab" without a single stock image. The hero illustration is hand-authored inline SVG line art of the actual course content: a charge dipole with field lines, a sine trace, circuit glyphs. E&M and optics, because that is what PHY 112/114/132 are.
3. **Instrument motion.** Motion communicates state change and nothing else. Durations 80 to 400ms, strong ease-out, no bounce, no loops (one exception: a slow ambient drift in the hero, disabled under reduced motion). Nothing animates while a student is typing in a worksheet field. `prefers-reduced-motion` already hard-kills all animation globally in `base.css`; that guardrail stays.

What deliberately does not change: the calm density of the worksheet, the content-first reading experience, the no-nonsense privacy posture, semantic HTML under every primitive.

## 2. Typography

- **Display face: Space Grotesk Variable** (self-hosted via `@fontsource-variable/space-grotesk`, latin subset ~17 KB woff2). Used only for the wordmark, hero headline, page titles, and big numerals (lab numbers, section indices). It has the slightly technical, drawn-with-a-compass character this product wants, and it makes the wordmark feel like a logo instead of a bolded span. Fallback chain ends in Inter, so nothing breaks if it fails to load. If you think it does not earn its bytes, every use site reads `var(--font-display)` and we point that at Inter and lose nothing structurally.
- **Inter Variable stays** for all UI and prose. **JetBrains Mono stays** for numeric/table/mono contexts.
- **Scale:** existing steps are kept (no global re-flow risk) and the scale is extended at both ends: `--text-2xs` (11px) for pills and fine print, `--text-3xl` (44px) for the hero headline. New `--leading-tight` (1.1) and `--leading-snug` (1.3) for display settings, new `--tracking-tighter` (-0.03em) for display sizes.
- Worksheet prose moves from 14px to 16px **in Phase 3 only** (it is a lab-page change and belongs with that review).

## 3. Color evolution

- **Accent:** new "ink" ramp, hue ~233, ten steps, hand-tuned (values in section 6). Light-theme `--accent-bg` is `--accent-600`; AA-verified for white text. Dark theme uses 400/300 for text accents, exactly like today's structure. All existing semantic alias names (`--accent-bg`, `--accent-text`, `--border-accent`, ...) keep their names, so component CSS does not churn.
- **Light neutrals:** unchanged (the slate ramp is genuinely good and every surface depends on it).
- **Dark neutrals:** retuned to a graphite-ink ladder, slightly less navy-saturated so the new accent reads as the only blue thing on the page. Same ladder structure, same alias mapping.
- **Status colors:** success/warning/danger unchanged; info retuned into the new accent family so "informational" and "interactive" stop being two competing blues.
- **New tokens:** `--grid-line` (the graph-paper line color, per theme), `--accent-wash` (a 4 to 7% accent tint for band backgrounds), and a 3-step `--spark-*` amber for illustration accents only. Spark is documented as non-interactive: it must never color a control.

## 4. Motion philosophy

- **State, not decoration.** Hover/focus 80-150ms, enters 200-250ms, the hero draw-in 1.2s once on load. New `--ease-pop` (tiny overshoot) is reserved for small overlays (menus, popovers); dialogs use plain ease-out fade+scale (0.98 to 1).
- **The save indicator** (Phase 3) gets a quiet check-draw when a save lands; **section focus** via TOC gets a 600ms accent ring fade on the target card; **dialog enter/exit** animate; **card hover** lifts 1-2px.
- **Hard rules:** every animation respects `prefers-reduced-motion` (global kill switch already in `base.css`), nothing animates on keystroke paths, no `transition: all`, and no animation may run on the iframe or its ancestors' layout properties (iframe stability invariant).

## 5. What changes on each surface

### Catalog (Phase 0/2, the taste test)

- Slim product header: logo mark + wordmark left, theme toggle right. The catalog finally applies the stored theme preference (today it ignores it until you visit a lab; that is a one-line UI bootstrap in `App.tsx`).
- Hero band on graph-paper texture: headline ("Interactive physics labs" stays, verbatim, as the heading for test parity), supporting line, and the hand-drawn dipole/sine SVG illustration, drawn in once on load.
- "Start a lab" wizard card: 3-step pill indicator, one primary Continue (the redundant Skip button is dropped per Spec D), course and lab choices as cards, empty state for courses with no enabled labs. The "Browse all labs" footer link inside the wizard is dropped (the list is directly below).
- Course sections: header row (title, core/enrichment counts, link to the course route) and a responsive lab card grid. Cards show a number pill, title, hover chevron; disabled labs are non-interactive `<div>` cards with a "Coming soon" badge.
- About + Privacy collapse into disclosure cards, copy unchanged, collapsed by default.
- Footer stays, restyled quietly.

### Lab page (Phase 3)

- Header restructure per Spec B's underlying needs: theme and layout become icon segmented controls, swap-sides becomes an icon button, About/Start-fresh tuck into an overflow menu, Save draft is the header's only worded secondary action. Export PDF (on the integrity card) becomes the page's single primary button.
- Section cards get a quieter default border, a numbered index marker tying them to the TOC, and points as a pill instead of a parenthetical caption.
- The integrity/export card becomes the visually terminal "submit station" with the page's lone primary CTA.
- Worksheet prose 14 to 16px; reading measure capped.

### Dialogs, banners, empty states (Phase 4)

- Shared enter/exit motion, `--radius-xl` surfaces, consistent paddings, one visual language for info/warning/danger banners.

## 6. Token diff (proposed, exact)

**Added:**

| Token                 | Light                        | Dark                        | Purpose                          |
| --------------------- | ---------------------------- | --------------------------- | -------------------------------- |
| `--font-display`      | Space Grotesk Variable stack | same                        | wordmark, hero, display numerals |
| `--text-2xs`          | 0.6875rem                    | same                        | pills, fine print                |
| `--text-3xl`          | 2.75rem                      | same                        | hero headline                    |
| `--leading-tight`     | 1.1                          | same                        | display settings                 |
| `--leading-snug`      | 1.3                          | same                        | card titles                      |
| `--tracking-tighter`  | -0.03em                      | same                        | display sizes                    |
| `--radius-xl`         | 16px                         | same                        | hero/dialog/large cards          |
| `--ease-pop`          | cubic-bezier(.2,1.4,.4,1)    | same                        | small overlays only              |
| `--grid-line`         | rgb(73 85 134 / 8%)          | rgb(148 163 216 / 7%)       | graph-paper texture              |
| `--grid-line-strong`  | rgb(73 85 134 / 14%)         | rgb(148 163 216 / 12%)      | grid major lines                 |
| `--accent-wash`       | rgb(70 80 212 / 5%)          | rgb(125 140 238 / 8%)       | band tints                       |
| `--spark-300/500/700` | #ffd76a / #f2b21b / #936708  | #ffd76a / #f7bd2e / #b97e08 | illustration only                |
| `--shadow-accent`     | layered accent glow          | same recipe, deeper         | primary CTA hover                |

**Changed:**

| Token                    | Old                  | New                                                                                                                                                                                            |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--accent-50..900`       | Tailwind blue ramp   | ink ramp: 50 `#eef1fd`, 100 `#e0e6fc`, 200 `#c7d0fa`, 300 `#a3b1f5`, 400 `#7d8cee`, 500 `#5a67e4`, 600 `#4650d4`, 700 `#3a40b0`, 800 `#31368b`, 900 `#2b2f6e`                                  |
| dark `--neutral-0..1000` | navy slate           | graphite ink: 0 `#05070d`, 50 `#0c0f17`, 100 `#131722`, 200 `#1b202d`, 300 `#29303f`, 400 `#3a4252`, 500 `#6a7488`, 600 `#98a2b6`, 700 `#ccd3e0`, 800 `#e3e8f1`, 900 `#f2f5fa`, 1000 `#ffffff` |
| `--info-bg/text/border`  | old blue family      | ink family (light `#e0e6fc` / `#343a9e` / `#a3b1f5`; dark `#1c2150` / `#a3b1f5` / `#3a40b0`)                                                                                                   |
| dark `--accent-soft`     | rgb(37 99 235 / 0.2) | rgb(90 103 228 / 0.22)                                                                                                                                                                         |

Everything else (spacing, light neutrals, success/warning/danger, shadows 1-4, radii sm/md/lg/full, durations, focus rings, icon sizes) is unchanged. All key text/background pairs were contrast-checked at AA or better (script output in the PR).

## 7. Requirements coverage from Specs B and D

Both specs are treated as requirements inventories. Every need is satisfied; divergences and the reasons:

| Requirement                                            | Status                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button hierarchy (5 variants, 3 sizes, icons, loading) | Built in Phase 0 (the wizard needed it); API per Spec B                                                                                                                                                                                                                 |
| SegmentedControl, overflow Menu                        | Phase 1, per Spec B semantics                                                                                                                                                                                                                                           |
| Header restructure, Export PDF as lone primary         | Phase 3                                                                                                                                                                                                                                                                 |
| Catalog hero                                           | **Diverges upward:** Spec D said "no imagery." The redesign mandate supersedes that with a hand-authored SVG illustration and grid texture. Wordmark dot mark is replaced by a drawn logo mark (a charge-in-field glyph) for the same "cheapest accent on the page" job |
| Card grid, status badges, wizard cards, step indicator | Phase 0, per Spec D with restyling                                                                                                                                                                                                                                      |
| Skip button dropped, Browse-all link dropped           | Phase 0, per Spec D                                                                                                                                                                                                                                                     |
| About/Privacy disclosures, copy unchanged              | Phase 0, per Spec D                                                                                                                                                                                                                                                     |
| Course header shows counts                             | Phase 0, plus a "View course page" link Spec D never asked for                                                                                                                                                                                                          |

One content note, not a UI decision: PHY 132 carries four retired draft refs (`chargesFields`, `capacitors`, `dcCircuits`, `magneticFieldFaraday`) kept `enabled: false` for grader access. The catalog has always rendered them as "coming soon"; the redesign keeps that behavior (parity), but they now appear as unnumbered "Coming soon" cards, which reads slightly odd. Worth a content-side decision later (a `hidden` flag or a `retired` group); out of scope here.

## 8. Bundle and verification posture

- Budget: ~60 KB gzip for the whole effort. Space Grotesk latin variable is ~17 KB; new CSS and components are small. Tracked with `npm run analyze` per phase.
- Verification gate per phase: `typecheck`, `lint`, `lint:styles`, `npm test`, Playwright, axe in both themes, manual pass on `/`, `/__visual/primitives`, and a long lab.
- Visual snapshots under `tests/visual/` will be regenerated deliberately per phase with before/after screenshots in the PR. No accessibility assertion gets weakened.
