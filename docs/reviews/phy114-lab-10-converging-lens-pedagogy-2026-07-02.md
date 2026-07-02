# Pedagogy review: PHY 114 Lab 10 - Converging (Convex) Lens

- **Lab id:** `convergingLens` (PHY-114-owned,
  `src/content/labs/phy114/convergingLens.draft.lab.ts`)
- **Course / lab number:** phy114 / 10 (`enabled: true`, `group: 'coming-soon'`)
- **Date / reviewer:** 2026-07-02 / claude-fable-5
- **Rubric:** `docs/specs/VERIFY_LAB_TWO_TRACK_SPEC.md` (elaborated 2026-07-02, this branch)
- **Track 1 result:** clean (0 errors, 0 warnings)
- **Theory reference used:** none - flagged under A1
- **Verdict:** needs-work

## Findings

### A1. Theory accuracy

- **[concern]** No `docs/theory/lab-10-*.md` reference exists, and unlike Labs 01-09 this
  lab also has **no in-lab Background block at all**: focal point, focal length, real vs
  virtual, the thin-lens equation, and magnification are all used but never taught. The
  file header records this as the deliberate "structure first, enrich later" split
  decision, so it is known - but it means the theory-accuracy category has almost nothing
  to check, and students meet $1/f = 1/d_0 + 1/d_i$ for the first time inside a graded
  calculation prompt. What little physics appears is correct (thin-lens equation, both
  magnification forms with the sign convention, the negative-height reminder). Write a
  short Background (focal point, real/virtual, thin lens, magnification, sign
  conventions) as the enrichment pass; the questions themselves already carry the right
  concepts to anchor it.

### A2. Units

- **[concern]** Sections 3 and 12: RoC, D, $d_0$, $d_i$, $h_0$, $h_i$ all lack units
  (the sim works in cm); only $n$ is correctly unitless. The focal-length prompt says
  "show work and units," which is good, but the recorded fields should carry `unit: 'cm'`
  themselves. Magnification is correctly dimensionless.

### A3. PER alignment

- **[concern]** Two gaps. First, no committed predictions: the strongest moment is right
  before observation 3 - "predict: when the object moves inside the focal point, where
  will the image go?" (the vanishing-then-virtual transition is the most surprising event
  in the lab). Second, no discrepancy loop: the experimental focal length is computed but
  never compared to anything, even though the sim labels the focal points and the student
  recorded RoC and $n$. Add "compare your experimental $f$ to the sim's focal-length
  value and compute a percent error," and the discussion prompt's "compare with your
  expectations" will finally have an expectation to point at.

### B4. Scaffolding

No findings beyond the theory-delivery gap already covered under A1. The qualitative-
then-quantitative split is right, the observation questions sweep the object through the
three canonical regimes in a sensible order, and the double-magnification cross-check
("if these do not agree, reach out for help") is a nice self-diagnostic.

### B5. Clarity and cognitive load

- **[suggestion]** Parameter references point to "(see Canvas)," which at least names a
  real destination (better than Labs 04-08's dangling "Set of Parameters"), but confirm
  the Canvas page exists before enabling for students, and adopt this phrasing in the
  other labs as the interim standard.
- **[suggestion]** Formatting polish: `d<sub>₀</sub>` wraps an already-subscripted
  Unicode character in `<sub>`, producing a double subscript; the section heading
  "DISCUSSION & CONCLUSION" is all-caps unlike every other lab; and the image section
  reuses one id for both `imageId` and `captionFieldId` (`part1B_screenshot`), which is
  functionally benign today (images and fields live in separate stores) but breaks the
  id-uniqueness convention every other lab follows - rename the caption id.

### B6. Course register

No findings. No uncertainty or calculus content; "sources of error" in the discussion
prompt is qualitative and 114-appropriate.

## Solid

- The three-regime object sweep (outside $f$, approaching $f$, inside $f$) with
  rays-off-first observation is good discovery design - students see the image behavior
  before the ray-diagram machinery explains it.
- The real-vs-virtual concept check explicitly bans "because it's labeled that way" and
  demands the ray-intersection criterion - exactly the right anti-shortcut.
- Computing magnification two independent ways with a stop-and-ask-for-help mismatch
  check builds self-verification habits.
