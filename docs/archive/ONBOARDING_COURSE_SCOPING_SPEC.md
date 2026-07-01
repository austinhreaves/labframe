# Onboarding Tour, Course Scoping, and Carried-Forward Polish Spec

**Status:** Not started. Supersedes the onboarding-relevant parts of
`docs/specs/archive/TABLET_RICHCALC_PHETIO_SPEC.md` (now archived).
**Created:** 2026-06-25
**Tracks:** Five tracks. S / O / D are a single new feature (onboarding) split for
review; T-B and P are carried-forward backlog from the archived spec and are
independent of each other and of S / O / D.

---

## Overview

This spec covers a first-run experience for LabFrame plus two pieces of polish
that were left open when the previous spec was archived.

| Track                   | Goal                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| S: Onboarding Tour      | A driver.js spotlight tour that teaches the LabFrame workflow on first visit, staged on a demo showcase lab       |
| O: Course Scoping       | A student in one course never sees another course's materials (obfuscation, not security)                         |
| D: Demo Showcase Lab    | A purpose-built lab with "one of everything" that stages the tour and guarantees every spotlight anchor exists    |
| T-B: Finish Touch Audit | Complete the touch-interaction audit begun in the archived spec (the `?forceTextCalc` fallback already shipped)   |
| P: PDF Compaction       | Finish Track P from the archived spec: P-C (drop theory + compact unanswered), P-D (Process Record), P-E (layout) |

S, O, and D are one feature: the tour (S) is staged on the demo lab (D), and the
course pin that scoping (O) depends on is set during the tour's first phase. They
share the `/` first-run check.

**Non-goals:**

- Any server-side state, accounts, or login. The no-backend constraint (ADR-0002) is absolute.
- Real access control between courses. Typing another course's URL still resolves; that is acceptable (see O).
- PhET-iO native capture or engagement metrics (S-B / S-C in the archived spec). License-blocked, back burner.
- Phone-sized (< 600px) layout. Unchanged from the archived spec.

**Conventions reminder (from CLAUDE.md):** no em dashes anywhere; verify types
with `npm run typecheck` (tsc -b), not `npx tsc --noEmit`; run `npm run ci`
before a PR and `npm run test:e2e` for any UI / routing / layout change.

---

## Architecture: two drivers, coordinated by a flag

A spotlight tour that spans a route change is fragile, because driver.js destroys
itself on unmount. The tour is therefore **two independent driver instances**
coordinated by a `?tour=1` URL flag and a pinned course, not one cross-route step
array:

- **Phase A** runs on the splash at `/`. It ends by navigating to the demo lab with `?tour=1`.
- **Phase B** runs on the demo lab route (`/welcome`) whenever `?tour=1` is present. On finish it sets the onboarded flag, strips `?tour=1`, and deposits the student.

Phase B is independently launchable (the "Take the tour" refresher and the
deep-link toast both start it) because it does not depend on Phase A having run;
the only state passed between phases is the URL flag and the pinned course in
localStorage.

**New localStorage keys** (all read/written through the existing `safeStorageGet`
/ `safeStorageSet` helpers in `Catalog.tsx` / `LabPage.tsx`, which swallow
quota/private-mode errors):

- `labframe:course` -- the pinned course id (`'phy132'` etc.). Set by Track O.
- `labframe:onboarded` -- `'1'` once the student has completed, skipped, or dismissed the tour at least once. Set by Track S.

Existing key `labframe:student-name` is reused for the name captured in Phase A.

**Library:** `driver.js` (~5kb, MIT, no network). Add as a dependency. It supports
both element-anchored steps and centered anchor-less steps, which the sequences
below rely on.

---

## Track D: Demo Showcase Lab

### D-1: Author the demo lab

**Goal:** a single, stable lab that stages the tour, contains one of every section
type the tour points at, and is never reachable from any course catalog.

**Lab definition (`src/content/labs/_tour/welcome.lab.ts`):**

A normal `Lab` object that passes the Zod schema in `src/domain/schema/lab.ts`
and `npm run verify:lab`. It must contain, in an order that reads as a short demo:

- one `simulation` (a sim pane and a real screenshot target for tour step B4). Reuse an already-embedded openly-licensed sim URL (e.g. the Bending Light sim used by Snell's Law) so no new asset is introduced.
- one `instructions` block (orientation copy).
- one `calculation` with the equation editor (`equationEditor: true`, default text mode).
- one `calculation` with `responseMode: 'image'` -- this is the **guaranteed upload slot** the screenshot step (B4) spotlights.
- one `calculation` with `responseMode: 'draw'` and prompt "Draw a force diagram (free-body diagram) for an object on the surface below." -- anchors tour step B3's "sketch" mode and shows the canvas.
- one `dataTable` and one `plot` (shows the data-to-graph flow).
- the `IntegrityAgreement` + Export PDF gate is rendered by `LabPage` automatically; no section needed.

Keep the content short and obviously a demo ("Welcome lab", "This is an example
prompt"). It is not graded and not real physics; do not spend effort on pedagogy.
Follow the lab content style conventions in CLAUDE.md anyway (no em dashes,
`**Step N.**` prefixes, givens as callouts) so it models good content.

**Wiring:** the demo lab belongs to a **real "Getting Started" course**, not a
hidden synthetic one. It resolves like any other course and is a natural home for
future tutorial / resource labs.

- Add `role: z.enum(['academic', 'resources']).optional()` (default `'academic'`) to `CourseSchema` in `src/domain/schema/course.ts`. This one flag drives the Track O behavior below.
- Create `src/content/courses/welcome.course.ts`: a real `Course` with id `welcome`, title `"Getting Started"`, `role: 'resources'`, `storagePrefix: 'welcome'`, empty `parentOriginAllowList`, and a single lab ref to the demo lab. Export it from `src/content/courses/index.ts`.
- Export `welcomeIntroLab` from `src/content/labs/index.ts` and register it in `labsByCourse['welcome']` in `src/app/Routes.tsx`, so `/c/welcome` and `/c/welcome/intro` resolve normally.
- Add `welcomeCourse` to the `courses` array in `Routes.tsx`. It is a real course; Track O (not exclusion from the array) is what keeps it from being pinnable or from breaking scoping.
- Add a friendly `'/welcome'` route as an alias that renders the intro lab in tour mode (equivalent to `/c/welcome/intro?tour=1`). The tour navigations (S-2 / S-3 / S-4) use `/welcome?tour=1`.

**A `role: 'resources'` course is treated specially by Track O:** it is exempt
from scoping (always visible, even when a student is pinned to an academic course)
and excluded from the "pick your course" picker (you never pin to it). See O-1.

**Persistence isolation:** the demo lab has its own `labId`, so its autosave is
already isolated from real labs. The tour does not type into inputs (it only
spotlights them), so no demo data is created in practice. No persistence
suppression is required, but do not pre-fill any answers.

**Files to read before starting:**

- `src/content/labs/index.ts` -- export pattern
- `src/content/labs/phy132/snellsLaw.lab.ts` (or nearest) -- a real lab with a simulation, to copy structure
- `src/domain/schema/lab.ts` -- section kinds: `instructions`, `objective`, `measurement`, `multiMeasurement`, `dataTable`, `plot`, `image`, `calculation` (has `responseMode` / `responseModes`), `concept`
- `src/app/Routes.tsx` -- route table and `labsByCourse` shape

**Acceptance:** visiting `/welcome` (or `/c/welcome/intro`) renders a working lab
page with a sim pane, an image-upload calculation, a data table, a plot, and the
Export PDF gate. The "Getting Started" course tile appears on the catalog and at
`/c/welcome`, but it is never offered in the course picker and is never the pinned
course (Track O). `npm run verify:lab -- <welcomeLabId>` passes.

---

## Track O: Course Scoping

### O-1: Pin and enforce a single course

**Goal:** once a student is associated with a course, the UI shows only that
course. A PHY 132 student never sees PHY 114 and vice versa. This is obfuscation:
a student who types `/c/phy114` still reaches it, which is harmless.

**Academic vs resources courses:** scoping applies only to `role: 'academic'`
courses (the default). A `role: 'resources'` course (the "Getting Started" course
from Track D) is never pinned and is always visible. Concretely: only academic
courses can be written to `labframe:course`, only academic courses appear in any
"pick your course" UI, and the scoped catalog always appends every resources
course regardless of the pin.

**Pin the course (`labframe:course`)** whenever the student enters through an
academic course-scoped path, in priority order:

- the wizard / tour course pick (Track S Phase A) sets it explicitly (academic courses only);
- visiting `/c/:courseId` or `/c/:courseId/:labId` with an **academic** manifest course id sets it (a `/c/welcome` visit never pins);
- a `?course=` param naming an academic course, if present, sets it.

**Enforce the pin:**

- `Catalog.tsx`: when `labframe:course` is set and an academic course with that id exists, the root `/` and `/labs` render only that course **plus any resources courses** (filter the incoming `courses` prop to `[pinnedAcademicCourse, ...resourcesCourses]`, or redirect `/` to `/c/:courseId` while keeping the Getting Started tile reachable). The multi-course hero chip list and the wizard's **course** step collapse to the pinned academic course; the wizard becomes name -> lab. When no course is pinned (true first visit, no deep link), behavior is unchanged (all courses shown) so the tour or wizard can pick one.
- The course picker (tour A2 and the wizard course step) lists `role: 'academic'` courses only.
- The `AboutAndPrivacy` copy is currently hardcoded to "PHY 132". Make it course-aware (use the pinned course title) or neutral, so a scoped PHY 114 student does not read PHY 132 marketing.
- `/labs` stays the full, unlinked index for staff/graders. Do not link it from any student-facing UI. (Today the lab header wordmark links to `/labs`; repoint that to `/c/:courseId` when a course is pinned.)

**Escape hatch:** none beyond direct URL. There is intentionally no "switch course"
button in student UI. A student who genuinely changed sections can clear browser
data or be handed a fresh `/c/:courseId` link.

**Files to read before starting:**

- `src/domain/schema/course.ts` -- `CourseSchema`, where the `role` flag is added (Track D)
- `src/ui/Catalog.tsx` -- `courses` prop, `standaloneCourse` logic (single-course rendering already exists), the hero chip list, the wizard course step, `AboutAndPrivacy`
- `src/app/Routes.tsx` -- `CoursePage` (already renders `courses={[course]}`), root and `/labs` routes, the `courses` array
- `src/ui/LabPage.tsx` -- the `/labs` wordmark link (line ~418)

**Acceptance:** after visiting `/c/phy132` once, returning to `/` shows only PHY
132 **and the Getting Started tile**; the PHY 114 and PHY 112 chips, cards, and
wizard course step are gone; the course picker never lists Getting Started;
`/c/phy114` typed directly still loads (obfuscation only); `/c/welcome` never pins;
`/labs` still lists all courses. The pin survives reload (localStorage).

---

**Agent handoff -- Pass 1 (D + O):**

```
You are implementing Pass 1 of the LabFrame onboarding spec
(docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md): Track D (demo showcase lab) and
Track O (course scoping). These are combined because O's `role` filter is
introduced by D's schema change.

Read first (in this order):
1. src/domain/schema/course.ts -- CourseSchema; you will add `role` here
2. src/content/courses/phy132.course.ts -- pattern for welcome.course.ts
3. src/content/labs/index.ts -- export pattern
4. src/content/labs/phy132/snellsLaw.lab.ts -- copy its sim URL and structure
5. src/domain/schema/lab.ts -- section kinds available
6. src/app/Routes.tsx -- full route table and labsByCourse shape
7. src/ui/Catalog.tsx -- full file; courses prop, standaloneCourse logic, wizard
   steps, AboutAndPrivacy, hero chip list
8. src/ui/LabPage.tsx -- line ~418; the wordmark link

Track D tasks:
1. Add `role: z.enum(['academic', 'resources']).optional()` to CourseSchema in
   src/domain/schema/course.ts. Default is 'academic'. This is the only schema
   change in this pass.
2. Create src/content/labs/_tour/welcome.lab.ts with id 'welcome-intro', title
   'Getting Started', and these sections in order:
   - simulation: reuse the Bending Light sim URL from snellsLaw.lab.ts
   - instructions: 2-3 sentences of orientation copy (no em dashes)
   - calculation: equationEditor: true, fieldId: 'eq-demo', prompt: 'Enter the
     formula for kinetic energy.'
   - calculation: responseMode: 'image', fieldId: 'screenshot-demo', prompt:
     'Capture a screenshot of the simulation and upload it here.'
   - calculation: responseMode: 'draw', fieldId: 'draw-demo', prompt: 'Draw a
     force diagram (free-body diagram) for an object on the surface below.'
   - dataTable: one input column, one derived column
   - plot: referencing the dataTable columns
3. Create src/content/courses/welcome.course.ts: id 'welcome', title 'Getting
   Started', role: 'resources', storagePrefix: 'welcome',
   parentOriginAllowList: [], labs: [{ ref: 'intro', enabled: true }].
4. Export welcomeIntroLab from src/content/labs/index.ts and welcomeCourse from
   src/content/courses/index.ts.
5. In src/app/Routes.tsx:
   - Add welcomeCourse to the courses array.
   - Register labsByCourse['welcome'] = { intro: welcomeIntroLab }.
   - Add route '/welcome' rendering <LabPage course={welcomeCourse}
     lab={welcomeIntroLab} /> (the tour alias; Pass 2 adds ?tour=1 behavior).
6. Run `npm run verify:lab -- welcome-intro` and fix any issues.

Track O tasks:
7. In Catalog.tsx, read labframe:course from localStorage on mount (use the
   existing safeStorageGet helper). Derive:
   - pinnedCourse: the Course whose id matches, only if role !== 'resources'
   - resourcesCourses: all courses where role === 'resources'
   - academicCourses: all courses where role !== 'resources'
8. When pinnedCourse exists:
   - Render only [pinnedCourse, ...resourcesCourses] instead of all courses.
   - Skip the wizard's course step entirely; wizard becomes name -> lab using
     pinnedCourse's labs.
   - Hide the hero chip list (or render only the pinned course chip).
9. Course picker (wizard course step, shown only when no course is pinned):
   list academicCourses only. Never list role:'resources' courses.
10. When a student picks a course in the wizard, or visits /c/:courseId with an
    academic course id, write it to labframe:course via safeStorageSet. A visit
    to /c/welcome must never set labframe:course.
11. AboutAndPrivacy: replace the hardcoded "PHY 132" text with the pinned course
    title, or "your course" if unpinned.
12. In LabPage.tsx: when labframe:course is set, repoint the "LabFrame" wordmark
    link from /labs to /c/:pinnedCourseId.

Rules:
- No em dashes in prose, comments, or content strings.
- role: 'academic' is the default; existing courses without role are unchanged.
- /c/phy114 typed directly still works (obfuscation only, not security).
- /labs is never linked from student-facing UI.
- Verify with `npm run typecheck` (tsc -b) and `npm run ci`.
- Run `npm run test:e2e` -- scoping changes affect routing and catalog layout.
```

---

## Track S: Onboarding Tour

### S-1: First-run splash and the onboarded flag

**Goal:** the root `/` greets a genuinely new student with a minimal two-primitive
splash, and never nags a returning one.

**First-run check:** `labframe:onboarded !== '1'`.

- When **not onboarded**, `/` renders a minimal splash: a one-line intro and exactly two controls, **Get Started** and **Skip tutorial**. (This replaces the hero + wizard + full catalog only while not onboarded.)
- **Skip tutorial** sets `labframe:onboarded = '1'` and drops the student into the normal (course-scoped, per Track O) catalog.
- When **onboarded**, `/` is the normal scoped catalog. No splash, no toast.

**Set `labframe:onboarded = '1'`** on any of: tour completion, **Skip tutorial**,
or dismissing the deep-link toast (S-3). Any "I have seen this once" counts.

**Caveat to document in code comments:** localStorage is per-browser, so a new
device or incognito window resurfaces the splash. This is consistent with the
app's existing per-browser storage model (the FERPA copy already states work
lives in one browser) and is accepted, not a bug.

### S-2: The tour (Phase A + Phase B)

**Phase A (splash driver, on `/`):** starts when **Get Started** is clicked.

| Step | Anchor               | Teaches                                                                                          |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------ |
| A1   | centered, no element | Welcome; "about a minute, skip anytime"                                                          |
| A2   | course chooser       | "Pick your course." Selecting pins `labframe:course` (Track O) and advances                      |
| A3   | name field           | "Your name, as it appears on your report. Stays in this browser." Writes `labframe:student-name` |
| A4   | centered, no element | Handoff; on finish navigate to `/welcome?tour=1`                                                 |

**Phase B (lab driver, on `/welcome` when `?tour=1`):** all anchors are real DOM
in `LabPage.tsx` and are guaranteed present because the demo lab (Track D)
contains them.

| Step | Anchor (CSS / element)                        | Teaches                                                                                                                                                                                                             |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1   | `.lab-shell`                                  | "Everything is on one page: the simulation and your worksheet."                                                                                                                                                     |
| B2   | `.simulation-pane`                            | "Run the simulation here. Drag sliders, take measurements."                                                                                                                                                         |
| B3   | `.worksheet-pane` (or `#section-0`)           | "Answer the prompts. Type, sketch, or attach a photo depending on the question."                                                                                                                                    |
| B4   | `.simulation-pane` + the image-upload section | "When a question asks for a screenshot of the sim, capture it and upload it below." Platform hints: Windows `Win + Shift + S`, Mac `Cmd + Shift + 4`, iPad side button + volume up. **(This is the absorbed S-A.)** |
| B5   | `.lab-save-status`                            | "Your work saves automatically in this browser. No account. Use Save draft for a backup PDF."                                                                                                                       |
| B6   | the Export PDF button (`IntegrityAgreement`)  | "When you are done, accept the integrity agreement and Export PDF."                                                                                                                                                 |
| B7   | centered, no element                          | "Last step: upload that PDF to the matching Canvas assignment. LabFrame does not submit for you."                                                                                                                   |

All 11 steps (4 Phase A + 7 Phase B) are included; no trimming. B4 (screenshot)
and B7 (Canvas submission) are the non-negotiable payload; all other steps are
confirmed. The tablet layout controls (`LayoutToggle` / Swap-sides) and
`ProgressBar` / `TableOfContents` are not separate tour steps -- they are visible
during the tour and the student discovers them naturally.

**Platform detection for B4:** detect via `navigator.platform` / `navigator.userAgent`
(Windows vs Mac vs iPad). Same logic the archived S-A handoff described.

**On Phase B finish (or skip mid-tour):** set `labframe:onboarded = '1'`, remove
`?tour=1`, and **deposit** the student per S-4.

**Accessibility:** driver.js manages focus and `Esc` to dismiss; verify the
spotlight is keyboard-navigable (Next/Back reachable), the "Take the tour" button
meets the 44px coarse-pointer target from the archived Track T, and dismissing the
tour returns focus to a sensible element.

### S-3: Deep-link toast and the refresher

**Deep-link first-timer** (cold-hits `/c/:courseId/:labId`, `labframe:onboarded`
unset): Track O still auto-pins the course from the URL. Do **not** hijack them
into the tour. Show a dismissible toast: "New here? Take the tour." Accepting
navigates to `/welcome?tour=1`; dismissing sets `labframe:onboarded = '1'` so it
does not reappear.

**Refresher (always available):** a low-key **"Take the tour"** button in the lab
header near the existing About button. It is shown regardless of the onboarded
flag. Clicking it stashes the current URL as a return target and navigates to
`/welcome?tour=1`.

### S-4: Where the tour deposits the student

- **First-run / deep-link-toast path:** on finish, navigate to `/c/:course` (the now-scoped course page from Track O) so the student picks their own lab. Per the brainstorm decision, do not presume a specific lab.
- **Refresher path:** on finish, return to the stashed origin URL (the lab they were on), so the refresher does not cost them their place.

The two paths are distinguished by a stashed return target (set only by the
refresher); absence of one means the first-run deposit.

**Files to read before starting:**

- `src/ui/Catalog.tsx` -- splash vs catalog rendering, the wizard's name/course steps to reuse for A2/A3
- `src/ui/LabPage.tsx` -- header (About button area for the refresher), `.simulation-pane`, `.worksheet-pane`, `.lab-save-status`, the `IntegrityAgreement` Export button, and `?tour=1` handling on mount
- `src/app/Routes.tsx` -- `/welcome` route from Track D, the root `/` route
- Track D demo lab and Track O course pin (this track depends on both)

**Acceptance:** a fresh browser at `/` shows only Get Started / Skip tutorial;
Get Started runs Phase A (course pinned, name saved) then Phase B on `/welcome`
with every spotlight anchor present; finishing deposits the student on their
scoped course page and sets `labframe:onboarded`; a second visit to `/` shows the
normal scoped catalog with no splash and no toast; the lab-header "Take the tour"
button re-runs the tour and returns the student to where they were; a cold
deep-link shows the toast once.

---

**Agent handoff -- Pass 2 (S):**

```
You are implementing Pass 2 of the LabFrame onboarding spec
(docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md): Track S (onboarding tour).
Pass 1 (D + O) is complete: the /welcome route exists, the Getting Started
course is wired, and the labframe:course pin works.

Install driver.js first:
  npm install driver.js
MIT, ~5kb, no network calls. Supports element-anchored and centered steps.

Read first:
1. src/ui/Catalog.tsx -- full file; the splash replaces the hero + wizard for
   not-onboarded users; the wizard name/course steps are reused for A2/A3
2. src/ui/LabPage.tsx -- full file; header layout for the refresher button,
   .simulation-pane, .worksheet-pane, .lab-save-status, the IntegrityAgreement
   export button, and the storage-note-banner pattern (model for the toast)
3. src/app/Routes.tsx -- the /welcome route from Pass 1
4. src/ui/tokens.css -- use var(--space-*) for the 44px touch target on the
   refresher button

localStorage keys (use the existing safeStorageGet/safeStorageSet helpers):
- labframe:onboarded -- '1' once seen; gate the splash and toast on this
- labframe:course -- written by Pass 1 (O); Phase A also writes it
- labframe:student-name -- reused from existing code; Phase A writes it
- labframe:tour-return -- stash return URL for the refresher; clear on deposit

S-1: First-run splash (Catalog.tsx):
- When labframe:onboarded !== '1', render a minimal splash instead of the hero
  + wizard + courses: a one-line intro ("Run your physics lab, fill the
  worksheet, export a signed report."), a primary "Get Started" button, and a
  ghost "Skip tutorial" link.
- "Skip tutorial" sets labframe:onboarded = '1' and re-renders the normal
  catalog (no navigation needed).
- "Get Started" starts the Phase A driver (below).
- When labframe:onboarded === '1', the catalog renders normally; no changes.

S-2 Phase A driver (Catalog.tsx, starts on "Get Started"):
Steps:
  A1: no element -- title "Welcome to LabFrame", description "This takes about
    a minute. You can skip any step."
  A2: anchor the course picker cards (role:'academic' courses only) -- title
    "Pick your course", description "Select the course you are enrolled in."
    On the user clicking a course card (or onNextClick): write labframe:course
    and advance. Render the course cards visibly on the splash so driver.js
    has a real DOM anchor.
  A3: anchor the name input -- title "Your name", description "Enter your name
    as it should appear on your lab report. It stays in this browser." On
    Next: write labframe:student-name.
  A4: no element -- title "Ready?", description "Let's take a look at a lab."
    Next navigates to /welcome?tour=1.

S-2 Phase B driver (LabPage.tsx, starts when ?tour=1 on /welcome):
On mount: if location.search includes 'tour=1' AND the lab id is 'welcome-intro',
start the driver after a 100ms delay (let the DOM settle). Strip ?tour=1 from
the URL via history.replaceState before starting.

Steps:
  B1: .lab-shell -- "Everything is on one page: the simulation and your
    worksheet side by side."
  B2: .simulation-pane -- "Run the simulation. Drag sliders, adjust
    parameters, take measurements."
  B3: .worksheet-pane (or #section-0) -- "Answer the prompts here. Depending
    on the question, you can type, sketch a diagram, or upload a photo."
  B4: the image-upload calculation section (use a data-tour="screenshot-demo"
    attribute or [data-section-id="screenshot-demo"] selector on the
    section wrapper) -- "When asked for a screenshot, capture the sim and
    upload it here." Append platform hints from navigator.platform /
    navigator.userAgent: Windows = Win + Shift + S, Mac = Cmd + Shift + 4,
    iPad = Side button + Volume Up.
  B5: .lab-save-status -- "Your answers save automatically in this browser. No
    account needed. Use Save draft to download a backup."
  B6: the Export PDF button inside IntegrityAgreement (add data-tour="export-pdf"
    if needed for a stable selector) -- "Accept the integrity agreement and
    export your signed PDF when you are done."
  B7: no element -- "Last step: submit that PDF to the matching Canvas
    assignment. LabFrame does not submit for you."

On Phase B finish or driver destroy: call setOnboarded() then deposit().

S-3: Deep-link toast and the refresher:
- Toast (LabPage.tsx): on mount, if labframe:onboarded !== '1' AND lab.id !==
  'welcome-intro', render a dismissible toast using the storage-note-banner
  pattern (a <section role="status"> with message and buttons). Message: "New
  here? Take the tour." Actions: "Take the tour" (navigate to /welcome?tour=1)
  and "Dismiss" (set labframe:onboarded = '1', hide toast). Toast must not
  reappear after dismiss.
- Refresher (LabPage.tsx header): add a "Take the tour" button near the
  existing "About" button. Always visible. On click: write location.pathname +
  location.search to labframe:tour-return, then navigate to /welcome?tour=1.
  Button height must meet the 44px touch target (use var(--space-11) or the
  same token the other header buttons use).

S-4: Deposit (called after Phase B finishes or driver is destroyed):
- If labframe:tour-return is set: navigate there and clear labframe:tour-return.
- Otherwise: navigate to /c/:pinnedCourse (read labframe:course; fall back to /
  if unset).

Rules:
- No em dashes in any string, comment, or UI copy.
- Driver destroy (Esc mid-tour) must set labframe:onboarded and call deposit,
  same as a normal finish.
- Do not auto-start the Phase B driver on any real lab page, only on /welcome
  when ?tour=1 is present.
- Refresher button meets 44px touch target.
- Verify with `npm run typecheck` (tsc -b) and `npm run ci`.
- Run `npm run test:e2e` -- routing and catalog layout are affected.
```

---

## Track T-B: Finish the Touch Audit (carried forward)

The archived spec's T-B shipped only the `?forceTextCalc=true` fallback
(`src/ui/sections/CalculationSectionView.tsx`). The rest of the audit is open.

**Remaining scope:**

- **Phantom hover states on touch:** there are currently **zero** `@media (hover: hover)` guards in `src/`. Audit hover-only styles (buttons, cards, lab cards, wizard cards, chips) and wrap them so a tap does not leave a stuck hover state. Use the existing token vocabulary; no numeric literals.
- **Table drag-to-reorder:** no such interaction exists in the codebase (confirmed). This item is dropped from scope.
- **MathLive `virtualKeyboardMode`:** confirm the equation editor is configured for `'onfocus'` (or the current best practice) so the native and virtual keyboards do not fight on iOS. The `?forceTextCalc` fallback already exists as the escape hatch; this is the primary-path fix.

**Files to read before starting:**

- `src/ui/sections/CalculationSectionView.tsx` -- existing `forceTextCalc`, equation editor branch
- `src/ui/primitives/mathlive.css` and the EquationEditor component (`grep -r "EquationEditor" src/`)
- `src/main.css` and `src/ui/tokens.css` -- where hover styles and the `@media (hover: hover)` guard pattern belong

**Acceptance:** hover-only styles are guarded so no phantom hover persists after a
tap; the equation editor uses an iOS-safe virtual keyboard mode with the
`?forceTextCalc` fallback intact on desktop; any table-drag interaction has a
touch guard (or is documented as nonexistent). Add or extend a Playwright check at
a tablet viewport.

---

**Agent handoff -- Pass 3 (T-B):**

```
You are implementing Pass 3 of the LabFrame onboarding spec
(docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md): Track T-B (finish the touch
interaction audit). This pass is independent of all other passes.

Context: the archived spec's T-B shipped the ?forceTextCalc=true URL fallback
(src/ui/sections/CalculationSectionView.tsx lines 20-25, commit a18737d). The
remaining items are the hover audit and MathLive virtual keyboard config.
Table drag-to-reorder was confirmed not to exist; that item is dropped.

Read first:
1. src/main.css -- find all :hover rules
2. src/ui/tokens.css -- use only var(--space-*) / var(--text-*) etc.; no
   numeric literals in new CSS
3. src/ui/sections/CalculationSectionView.tsx lines 1-50 -- forceTextCalc and
   the equationEditor branch
4. Find the EquationEditor component and MathLive config:
   grep -r "EquationEditor\|MathLive\|mathfield\|virtualKeyboard" src/
5. src/ui/primitives/mathlive.css -- existing MathLive overrides

Task 1 -- Phantom hover guards:
There are currently zero @media (hover: hover) guards in src/. Audit every
:hover rule in src/main.css and component CSS files. For each :hover that
applies a visible style change (color, background, border, shadow, transform,
or opacity), wrap it:
  @media (hover: hover) {
    .selector:hover { ... }
  }
This prevents stuck hover highlights after a tap on iOS/Android.
Scope: buttons, .lab-card, .catalog-wizard-card, .catalog-hero-course-chip,
and any other interactive element with hover styles. Use only token values;
no numeric literals.

Task 2 -- MathLive virtual keyboard:
Find where MathLive is initialized (likely the EquationEditor component). Set
virtualKeyboardMode to 'onfocus' (or the equivalent in the installed version --
check the installed MathLive version in package.json and its API). This prevents
the native iOS keyboard and the MathLive virtual keyboard from fighting on iPad.
The ?forceTextCalc fallback must remain intact. Do not remove the equation editor
on desktop. If the installed MathLive version does not support 'onfocus', document
the limitation in a short comment with the correct API for the version that does.

Task 3 -- Playwright tablet check:
Add or extend a Playwright test at 768x1024 viewport that confirms interactive
elements with hover styles are guarded (e.g. assert that the relevant CSS
contains @media (hover: hover), or use page.evaluate to check computed styles
after a touch event if Playwright supports it). Name the test to include the
viewport size.

Rules:
- No em dashes in prose or comments.
- Do not change any layout, component logic, or the equation editor behavior on
  desktop.
- Verify with `npm run typecheck` (tsc -b) and `npm run ci`.
- Run `npm run test:e2e` after adding the Playwright check.
```

---

## Track P: Finish PDF Compaction (carried forward)

P-A (font embedding) and P-B (titles/prompts) shipped. P-C / P-D / P-E are
**not started** (no `pdfHidden`, no `formatDuration`, no "Unanswered sections" /
"No recorded activity" / "no data plotted" anywhere in `src/`). They are reproduced
here unchanged from the archived spec.

**HARD CONSTRAINT (presentation only):** do **not** change the signed envelope.
Do not touch `src/services/integrity/buildAnswers.ts`, `canonicalize.ts`, or
`sign.ts`, and do not change what enters the canonical payload. All changes are in
the PDF renderer and the lab content flags.

### P-C: Drop background theory and compact unanswered responses

- Add `pdfHidden: z.boolean().optional()` to `SectionMetadataSchema` in `src/domain/schema/lab.ts`. A `pdfHidden: true` section is omitted from the PDF body and the Process Record; it still renders on screen and does not affect the envelope.
- In the labs (`src/content/labs/**`), set `pdfHidden: true` on instructions blocks that are purely background/theory/reference (headings like "Background ...", "A note on ...", standalone derivations, reference-only tables). **Keep** the integrity agreement, `**Step N.**` procedural instructions, and concept-check framing.
- Classify field-owning sections (`objective`, `measurement`, `multiMeasurement`, `calculation`, `concept`, `image`, `dataTable`) as **answered** (non-empty field text, an uploaded image, a non-empty drawing page, or any filled table cell) vs **unanswered**. Render answered sections fully; collapse all unanswered field-owning sections into one prominent block: "Unanswered sections (N): <human titles>". Instructions and plots never appear in that list.

### P-D: Process Record densification

- Replace the per-section blocks with a dense table: one row per field-owning section **with recorded activity** (active time, keystrokes, or any paste > 0). Columns: Section | Active time | Keystrokes | Deletes | Pastes (clipboard / autocomplete / IME). Add a totals row.
- Collapse zero-activity field-owning sections into one line: "No recorded activity: <human titles>". Omit field-less (instructions, plot) and `pdfHidden` sections entirely.
- Format active time as H/M/S via a new `formatDuration(ms)` helper with unit tests: `45s`, `2m 05s`, `1h 03m 12s` (omit higher zero units, zero-pad lower ones). Place it alongside `src/domain/pointsFormatting.ts` or in `src/services/pdf/`.
- Reuse the human section titles from P-B (factor the title map / `sectionTitle(section)` helper so the body and the record share it).

### P-E: Layout and length

- Empty plot (no data points): render a one-line placeholder ("<plot title>: no data plotted") instead of the empty SVG axes box.
- Drawings: add a `drawImage` style capped near half a page; keep each drawing page block whole (`wrap={false}`) with its "Page N of M" label and SHA caption grouped with the image, so about two drawing pages fit per PDF page. Photos may keep a larger cap.
- Verify the combined P-C / P-D / P-E effect meaningfully cuts page count on the Coulomb draft (the review sample was 15-16 mostly-empty pages).

**Files to read before starting:**

- `src/services/pdf/Document.tsx` -- section renderer, calc/draw/image branches, Process Record page
- `src/domain/schema/lab.ts` -- `SectionMetadataSchema` and section variants
- `src/domain/pointsFormatting.ts` -- pattern for a small unit-tested formatting helper

**Acceptance:** a draft where two of ten calculations are answered shows those two
in full plus one "Unanswered sections" block; `pdfHidden` background blocks are
absent from the PDF; the Process Record is a single dense table plus a totals row
and a "No recorded activity" line with `1h 03m 12s`-style times; empty plots are
one line; two drawing pages share a PDF page; the on-screen worksheet and the
signed envelope are unchanged. `npm run typecheck`, `npm run lint`, and `npm test`
are green (update the `renderPdf` text-form snapshots as needed).

---

**Agent handoff -- Pass 4 (P):**

```
You are implementing Pass 4 of the LabFrame onboarding spec
(docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md): Track P (PDF compaction,
phases P-C / P-D / P-E). This pass is independent of all other passes.

Context: P-A (font embedding, commit 9239533) and P-B (section titles +
prompts, commit c0facf6) are done. P-C / P-D / P-E are NOT started -- confirmed:
no pdfHidden, no formatDuration, no "Unanswered sections" / "No recorded
activity" / "no data plotted" anywhere in src/. Problem: an all-empty draft ran
15-16 pages mostly blank.

HARD CONSTRAINT: presentation only. Do NOT change the signed envelope.
Do not touch src/services/integrity/buildAnswers.ts, canonicalize.ts, or sign.ts.
All changes are in the PDF renderer and lab content flags.

Read first (in this order):
1. src/services/pdf/Document.tsx -- full file; section renderer, calc/draw/image
   branches, and the existing Process Record page
2. src/domain/schema/lab.ts -- SectionMetadataSchema and each section variant
3. src/domain/pointsFormatting.ts -- pattern for a small helper with unit tests;
   follow this for formatDuration
4. src/content/labs/ -- scan 2-3 enabled labs (e.g. phy132/coulombsLaw.lab.ts,
   phy114/coulombsLaw.lab.ts) to understand instructions block content before
   marking pdfHidden

P-C -- Drop theory + compact unanswered:

Step 1: Schema
Add pdfHidden?: z.boolean().optional() to SectionMetadataSchema in
src/domain/schema/lab.ts. A pdfHidden: true section is skipped in the PDF body
and the Process Record; it still renders on-screen and is untouched by the
envelope.

Step 2: Mark labs
In src/content/labs/** (enabled labs only), add pdfHidden: true to instructions
sections that are purely background/theory/reference. Signals: headings like
"Background", "A note on", "Theory", standalone derivations, reference-only
tables. KEEP: integrity agreement, "Step N." procedural instructions,
concept-check framing that gives context to an adjacent response. This is a
judgement call; the author will re-tune.

Step 3: Compact unanswered
In Document.tsx, for each field-owning section rendered (objective, measurement,
multiMeasurement, calculation, concept, image, dataTable), classify as:
- answered: non-empty field text, an uploaded image blob, a non-empty draw stroke
  list, or at least one filled table cell
- unanswered: none of the above
Render answered sections fully. Collect all unanswered field-owning sections and
render ONE block: "Unanswered sections (N): Title 1, Title 2, ..." where titles
come from the sectionTitle() helper (see P-D). Instructions and plots are never
in this list. pdfHidden sections are never in this list.

P-D -- Process Record densification:

1. Create a formatDuration(ms: number): string helper (new file alongside
   src/domain/pointsFormatting.ts or in src/services/pdf/). Format: omit higher
   zero-units, zero-pad lower ones.
   Examples: 45000 -> "45s", 125000 -> "2m 05s", 3792000 -> "1h 03m 12s".
   Write unit tests following the pointsFormatting test pattern.

2. Create or factor out a sectionTitle(section: Section): string helper that
   returns the human title for both the PDF body (P-B already uses some form of
   this) and the Process Record, so both share one implementation.

3. In Document.tsx, replace the Process Record page with:
   - A dense table, one row per field-owning section with recorded activity
     (activeMs > 0 OR keystrokes > 0 OR any paste count > 0). Columns: Section
     (sectionTitle) | Active time (formatDuration) | Keystrokes | Deletes |
     Pastes (clipboard / autocomplete / IME formatted as "2 / 0 / 1"). Add a
     totals row.
   - One line below the table: "No recorded activity: Title 1, Title 2, ..."
     listing field-owning sections with zero activity. Omit field-less sections
     (instructions, plot) and pdfHidden sections entirely.

P-E -- Layout and length:

1. Empty plot: when a plot section has no data points (all column arrays empty),
   render a single Text element "<plot title>: no data plotted" instead of the
   full SVG axes box. A plot with any data renders normally.

2. Drawings: add a drawImage style with maxHeight capped near half a page
   (~380px at A4). Set wrap={false} on each drawing-page block (image + "Page N
   of M" label + SHA caption) so they stay together and two drawing pages fit on
   one PDF page. Uploaded photos may keep a larger cap.

Verify:
- `npm run typecheck` (tsc -b), `npm run lint`, `npm test` all green. Update
  any renderPdf text-form snapshot tests that change due to the new Process
  Record format or section compaction.
- Confirm the combined effect reduces page count on an all-empty draft.

Rules:
- No em dashes in any string, comment, or lab content.
- Do not change buildAnswers.ts, canonicalize.ts, or sign.ts.
- pdfHidden sections must still render on-screen (no change to SectionRenderer).
- Keep formatDuration and sectionTitle as small, unit-tested helpers.
```

---

## Phase dependency map

```
D-1 (demo lab) ----+
                   |
O-1 (course pin) --+--> S-1 / S-2 / S-3 / S-4 (tour: needs the demo lab to stage on
                   |                            and the course pin to scope + deposit)
                   |
(O-1 also stands alone: scoping works without the tour, driven by /c/:courseId visits)

T-B (touch audit)   -- independent
P-C / P-D / P-E     -- independent of each other's ordering; all build on shipped P-A / P-B
```

S depends on D (stage) and O (pin + deposit target). O is usable on its own. T-B
and P are independent backlog and can be picked up any time.

---

## Open decisions

| #   | Decision                          | Notes                                                                                                                                                                                      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Tour length                       | RESOLVED: all 11 steps (4 Phase A + 7 Phase B). No trimming. Layout/progress controls are visible during the tour but not dedicated steps.                                                 |
| 2   | Demo lab route name               | RESOLVED: `/welcome` (a friendly alias for `/c/welcome/intro?tour=1`).                                                                                                                     |
| 3   | The "Getting Started" course      | RESOLVED: a real `role: 'resources'` course (id `welcome`), one lab card today, room for more tutorials/resources later. Exempt from scoping and never pinnable (Track O).                 |
| 4   | Course switch escape hatch        | RESOLVED: no student-facing switch. Instructors hand a fresh `/c/:courseId` link (or student clears storage) for section changes.                                                          |
| 5   | Per-browser onboarded flag        | RESOLVED: per-browser is accepted, consistent with the existing per-browser storage model. A new device or incognito resurfaces the splash; that is a feature, not a bug.                  |
| 6   | Demo lab draw step                | RESOLVED: include the `responseMode: 'draw'` section with prompt "Draw a force diagram (free-body diagram) for an object on the surface below." Tour step B3 spotlights it under "sketch." |
| 7   | T-B table drag                    | RESOLVED: no data-table drag-to-reorder exists in the codebase. Item dropped from T-B scope.                                                                                               |
| 8   | P-C "background theory" judgement | RESOLVED: per-lab judgement call confirmed. Agent marks an initial pass; author re-tunes flags afterward.                                                                                  |
