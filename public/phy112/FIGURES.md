# PHY 112 figure manifest

Figures extracted from the recitation solution keys in
`C:\Users\ahreaves\Documents\Instructional Materials\PHY 112 Instructional Materials-20260307T231627Z-1-001\PHY 112 Instructional Materials\`
on 2026-05-22 (Chunk 0 of the Tier A+B buildout; see `docs/PHY112_TIER_AB_SPEC.md`).

Files live in `public/phy112/`. Reference them from `instructions` blocks with a root-relative path,
e.g. `![Part I circuit](/phy112/ex04_part1_single_capacitor.png)`.

## Sanitizer smoke-test result

PASSED. `<img>` with a root-relative `src` survives `rehype-sanitize` with the schema in
`src/ui/primitives/MarkdownBlock.tsx`. Verified by calling `hast-util-sanitize` directly with that
schema on `<p><img alt="Test caption" src="/phy112/ex04_part1_single_capacitor.png" /></p>`; the
`<img>` element and `src` attribute were preserved. (Confirmed analytically against
`node_modules/hast-util-sanitize/lib/schema.js` and `lib/index.js`: `img` is in `tagNames`, `src` is
allowed on `img`, and `safeProtocol` returns true for any URL with no `:` before the first `/`, so
relative paths are not stripped.) No `MarkdownBlock.tsx` change is required.

## Annotation legend

- **clean** — usable as-is in the student worksheet.
- **ANSWER-ANNOTATED** — figure contains solution markings (component polarity, current arrows,
  E-field arrows, the requested-to-be-drawn extra capacitor, etc.). The lab chunk must reference it
  with a `TODO(human)` note flagging the need for a clean replacement before student release.
- **SOLUTION-FIGURE** — figure *is* the answer (Problem 2 of ex07 asks the student to draw a
  circuit; the extracted images are the worked solutions). Do not embed in the student worksheet.
- **FORMAT-CONVERT** — file is an Enhanced Metafile (`.emf`), a Windows vector format browsers
  cannot render. Needs conversion to PNG or SVG before use.

## ex04 — Capacitors in Series and Parallel

| File | Part | Description | Status |
|---|---|---|---|
| `ex04_sim_screenshot.png` | Intro | Screenshot of the CCK: AC Virtual Lab. Reference only; the sim is embedded directly in the lab. | clean |
| `ex04_part1_single_capacitor.png` | Part I | Battery + single capacitor loop. | **ANSWER-ANNOTATED**: +/- plate labels are shown on both the battery and the capacitor. The Part I prompt asks the student to add those labels. |
| `ex04_part2_two_capacitors_series.png` | Part II | Battery + C1 and C2 in series. | **ANSWER-ANNOTATED**: +/- labels on battery and both capacitors. Part II prompt asks the student to add them. |
| `ex04_part3_two_capacitors_parallel.png` | Part III | Battery + C1 and C2 in parallel. | **ANSWER-ANNOTATED**: +/- labels on battery and both capacitors. Part III prompt asks the student to add them. |
| `ex04_part5_three_capacitor_followup.png` | Part V | Three-capacitor follow-up circuit. | **ANSWER-ANNOTATED**: the figure shows a fourth capacitor C4 added in parallel with C1, which is precisely the answer to Part V question 2 ("how would a fourth capacitor be connected so it was in parallel with C1?"). Need a clean three-capacitor (C1, C2, C3 only) version for the student. |

## ex05 — Resistors in Series and Parallel

| File | Part | Description | Status |
|---|---|---|---|
| `ex05_sim_screenshot.png` | Intro | Screenshot of the CCK: AC Virtual Lab. Reference only. | clean |
| `ex05_part1_single_resistor_circuit.png` | Part I.1 | Battery + single 50 ohm resistor loop. | **ANSWER-ANNOTATED**: +/- labels on battery and resistor, plus a current-direction loop arrow labeled I. Part I.1 asks the student to add these. |
| `ex05_part1_resistor_field_arrows.png` | Part I.3 | Standalone resistor symbol asking the student to draw E and v arrows. | **ANSWER-ANNOTATED**: both arrows are already drawn (red E arrow and blue v arrow), and +/- labels are shown. Part I.3 asks the student to add all of these. |
| `ex05_part1_ammeter_placement.png` | Part I.4 | Series circuit with an ammeter and resistor, asking the student to add a second ammeter. | **ANSWER-ANNOTATED**: shows one ammeter and a current arrow already, plus +/- labels. Student is supposed to add the second ammeter. |
| `ex05_part2_two_resistors_series.png` | Part II | Battery + R1 and R2 in series. | **ANSWER-ANNOTATED**: +/- labels on battery and both resistors, plus current loop arrow. Part II asks the student to add them. |
| `ex05_part3_two_resistors_parallel.png` | Part III | Battery + R1 and R2 in parallel. | **ANSWER-ANNOTATED**: +/- labels, node label `n`, and three current arrows (I1, I2, I3). Part III asks the student to add labels and arrows. |

(`image1.emf` in the `_raw/ex05/` extraction was unreferenced in the document and is not preserved here.)

## ex06 — Kirchhoff's Rules

| File | Part | Description | Status |
|---|---|---|---|
| `ex06_sim_screenshot.png` | Intro | Screenshot of the CCK: AC Virtual Lab. Reference only. | clean |
| `ex06_part1_two_resistors_series.png` | Part I | Battery + R1=50 and R2=75 in series. | clean. Has no +/- or current annotations. |
| `ex06_part1_voltmeter_lead_setup.png` | Part I.1 | Photo-style figure showing the voltmeter with red and black leads both placed at the low-potential side (point a), reading 0.00 V. | clean. This is the *starting* configuration the student copies from. |
| `ex06_part1_loop_letter_positions.png` | Part I.1 | The Part I circuit with positions a-f labeled. | clean. Letter labels are part of the problem definition (they name the rows of the voltmeter-walk table). |
| `ex06_part2_parallel_loops_labeled.png` | Part II | Multiloop parallel circuit with positions a-f labeled. | clean. Labels are part of the problem (used to name the three loops abcfa, abcdefa, fcdef). |
| `ex06_part4_multiloop_circuit.png` | Part IV | Multi-loop circuit with two batteries (eps1=5V, eps2=25V) and R1=40, R2=10, R3=80. | clean. No current-direction arrows; the student adds them as part of question 1. |

(`image1.emf` in the `_raw/ex06/` extraction was unreferenced in the document and is not preserved here.)

## ex07 — DC Circuit Analysis

| File | Part | Description | Status |
|---|---|---|---|
| `ex07_problem1_five_resistor_circuit.emf` | Problem 1 | The 5-resistor network. | **FORMAT-CONVERT**: Enhanced Metafile, not viewable in a browser. Needs conversion to PNG or SVG before it can be embedded. The figure itself is not answer-annotated; it is the problem statement. |
| `ex07_problem2_solution_drawing_a.png` | Problem 2 | Two parallel branches: (R1 series R2) parallel (R3 series R4). | **SOLUTION-FIGURE**: this *is* one of the two acceptable answers to Problem 2 ("draw a circuit consistent with the table"). Must NOT be embedded in the student worksheet. |
| `ex07_problem2_solution_drawing_b.png` | Problem 2 | Alternative arrangement: (R1 parallel R2) series (R3 parallel R4). | **SOLUTION-FIGURE**: the alternative worked solution. Must NOT be embedded in the student worksheet. |

## ex10 — Magnetic Flux and Induction

| File | Part | Description | Status |
|---|---|---|---|
| `ex10_problem1_loop_field_into_page.png` | Problem 1 | Rectangular loop in the page plane with a uniform B field into the page (drawn as a grid of x marks). | clean. |
| `ex10_problem2_loop_in_page_plane.png` | Problem 2 | Rectangular loop in the page plane with a uniform B field directed to the right, in the page plane (B-vector arrows). | clean. |
| `ex10_problem3_three_field_cases.png` | Problem 3 | A single loop on a grid of dots (B out of the page). Used as the shared figure for all three sub-parts (B increasing / constant / decreasing). | clean. |

## ex11 — Refraction and Total Internal Reflection

| File | Part | Description | Status |
|---|---|---|---|
| `ex11_glass_block_beam_path_a_b.png` | All parts | Glass block with the incoming beam at 30 degrees, the labeled angles (theta_air, 30, 60, theta_g, theta_1, theta_2, theta_i, theta_r, theta_A, theta_B), and Path A / Path B labels at the bottom face. | clean. The labels are part of the problem definition (the lab questions refer to them); no answer values are shown on the figure. |

## ex12 and ex13

No embedded figures in either solution key.

## Summary

- 12 figures clean and immediately usable (ex06 setup/series/loops/letters/multiloop, ex10 all three, ex11 glass block, and the three sim screenshots).
- 9 figures answer-annotated and need clean replacements before student release (4 in ex04, 5 in ex05).
- 1 figure needs format conversion (ex07 Problem 1 EMF).
- 2 figures are solution drawings and must not be embedded in the student worksheet (ex07 Problem 2 drawings A and B).

Tracked in Section 11.2 of `docs/PHY112_TIER_AB_SPEC.md` as an open question for Austin.
