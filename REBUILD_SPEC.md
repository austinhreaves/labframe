# Interactive Physics Labs — Rebuild Spec

**Audience:** Austin (ASU IPL) + downstream coding agents
**Status:** Adversarial review of the existing IPL-frontend bundle, plus a clean-slate plan
**Date:** 2026-04-29

---

## 0. TL;DR

The current `physics-labs.up.railway.app` codebase is a sourcemap-revealed React 17 SPA that does one job — render a lab worksheet next to a PhET iframe and emit a PDF — but it does it through:

- a 485-line god-hook (`useLabState`) that owns state, security, persistence, PDF orchestration, and side effects,
- a duplicated lab tree (`labs/` and `phy_114/`) where the second tree is mostly `transformLabForCourse(...)` of the first plus a few drifted forks,
- 6–8 essentially identical 500–820 line per-lab `LabReportForm.js` files that are 90% JSX configuration masquerading as components,
- an "anti-tampering" layer that monkey-patches `removeEventListener` and `obliterate`s student data on flag-mismatch heuristics,
- a navigation system that uses raw `<a href>` to force full-page reloads because they couldn't fix data bleeding between labs.

**Verdict:** The instructional content (questions, tables, fit prompts, point values, simulation URLs) is the only durable asset. The rendering, state, persistence, security, and PDF subsystems are all unsalvageable. They should be deleted and rebuilt from a declarative lab schema.

What follows is the case for that, and the phased blueprint to do it.

---

## 1. Intent Summary

### 1.1 What this system actually does

This is a frontend for **fully online lab courses**. There is no in-person component, no printing, and no physical lab artifact — the deliverable lives entirely on a screen. That framing matters because it pushes the artifact design toward something that's both a record *and* a self-contained submission, not a printable handout.

A **per-student, per-lab worksheet** that:

1. Loads a PhET HTML5 simulation in an `<iframe>`.
2. Presents a structured lab report (student info, objective, multiple parts with measurement tables, calculations, concept checks, conclusion) alongside or below the simulation.
3. Persists answers to `localStorage` keyed per lab so a student can close the tab and resume.
4. Optionally `postMessage`s to a parent window (LMS embed) on save and submit.
5. Generates a printable PDF report using `html2canvas` + `jsPDF`, with chart embeds rendered via `chart.js` and curve-fit overlays computed in `fitCalculations.js` (mathjs + Levenberg-Marquardt).
6. Tries to make it expensive for students to paste AI-generated content or copy material out (the academic-integrity layer).
7. Supports two course namespaces: a generic catalog and `PHY 114`, with separate URLs and storage keys.

### 1.2 Core user flows

- **Discover lab:** `/` or `/phy_114` → tile grid → click → full page reload to `/labId` or `/phy_114/labId`.
- **Complete lab:** sign integrity statement → fill measurement tables → graph + fit data → answer concept questions → write conclusion.
- **Save / Submit:** auto-save on every change to localStorage; explicit "Save Progress" button; "Submit" sets a flag and shows a success view.
- **Export:** "Generate PDF Report" button reflows the page to tab-view, captures the lab DOM, builds a PDF, downloads it.
- **Switch view:** tab view (lab or sim) vs. side-by-side (sim left or sim right).

### 1.3 Implied / inconsistent / missing features

- **No backend.** Everything is client-side. There is no grading, no instructor view, no submission record beyond the optional `postMessage` to a parent.
- **No auth.** Identity is "type your name into a textbox." `studentName` is the implicit primary key.
- **No collaborative use.** localStorage is browser-local. A student switching browsers loses everything.
- **`postMessage(... '*')`** suggests this was meant to embed in Canvas/iframe, but the wildcard target origin is a leak — any parent window receives student data.
- **Lab access gating in `phy_114`** has an `enabled` flag and `labNumber` ordering, but the generic `labs/` tree has no such concept. The generic catalog is for "anyone."
- **`magneticFieldFaraday`** exists in `labs/` but not `phy_114/`; `geometricOptics` exists in `phy_114/` but not `labs/`. Drift, not by design.
- **`LabSelector` and `Phy114LabSelector` and `LabSidebar`** all carry the **same 30-line comment block** describing the `<a href>` workaround. The author copy-pasted the workaround three times rather than fix the root cause.
- **No tests.** No `package.json` was even shipped in the sourcemap dump; there is no obvious build pipeline reference.

### 1.4 Design decisions from review

The following decisions were made in design conversation and supersede or refine the original analysis. Phase prompts and architecture sections below reflect these.

1. **Artifact format is PDF carrying signed canonical JSON.** PDF is the visible deliverable students submit through Canvas. The canonical `LabAnswers` JSON is embedded in the PDF as a file attachment (`pdf-lib`), and an HMAC-SHA256 signature is included in the document footer + PDF metadata. Graders never need to see the JSON; auditors and dispute resolution can extract it. JSON-only submission is rejected — students don't intuit it as a "report."
2. **Signing happens server-side.** A single Vercel serverless function `/api/sign` holds the secret in `LAB_SIGNING_SECRET` (env var, never shipped in the bundle). The frontend POSTs the canonical payload, receives `{signature, signedAt}`, embeds them in the PDF. Forging a hash now requires owning the Vercel project, not reading the JS bundle. This is a stateless function, no DB, no auth — not a "real backend" by the colloquial definition.
3. **Process telemetry is captured and disclosed, not blocked.** Anti-paste was theater. Instead, every text field stores the actual paste events (timestamp, content, source, offset) alongside the final text. The integrity statement discloses this. The PDF visually differentiates pasted regions (italic) from typed regions, with a per-paste timestamp note. Edited-then-rewritten paste content is summarized beneath the field. Graders can scan a page and see at a glance how the answer was constructed.
4. **No Canvas auth in v1.** LTI 1.3 + OIDC requires going through ASU IT for a developer key — weeks of process for marginal value if integrity comes from PDF signing. v1 reads `lis_person_name_full` and `custom_canvas_user_id` from LTI launch params (passed through the parent frame's `postMessage`) when embedded; otherwise falls back to "type your name." Real Canvas auth is a Phase 6 if disputes ever justify it.
5. **`postMessage` target origin is allow-listed per course manifest, never `'*'`.**
6. **Online-only.** No print stylesheet specifically required, but the PDF should still be readable when printed by a TA or auditor. No DOM screenshotting.
7. **Schema includes input-source tracking.** `FieldValue` is no longer just a string; it's `{text, pastes, meta}`. This shape propagates through the schema, the store, and the PDF renderer.

These are the binding decisions. If a downstream agent finds a reason to reverse one, escalate before implementing.

---

## 2. System Model

### 2.1 What's actual application code vs. vendor

The folder is dominated by what looks like decompressed sourcemaps from `html2canvas`, `jspdf`, `react-router`, and `mathjs`. These are not application code:

- `src/css/**`, `src/dom/**`, `src/render/**`, `src/core/**` → html2canvas
- `src/jspdf.js`, `src/libs/**`, `src/modules/**` → jsPDF
- `packages/react-router/**`, `packages/react-router-dom/**` → react-router
- `esm/typed-function.mjs` → mathjs
- `react-lab-app.44cadd89.js` (172k LOC), `html2canvas.4eda3235.js`, `react-lab-app.8380973e.css` → built bundles

**The actual app surface is ~24k LOC across:**

```
App.js                              252  routing shell
index.js / index.html                25  bootstrap
LabSelector.js                       76  generic catalog
Phy114LabSelector.js                100  PHY 114 catalog
hooks/useLabState.js                485  god-hook
constants/index.js                  127  units, fit examples, "security"
components/                       ~3.4k  generic UI
  BaseLabWrapper, ConfigurableQuestion, MultiMeasurementField,
  StudentInfoSection, SubmissionSuccessView, LoadingOverlay,
  LabSidebar, GenericImageUploader, Graph (1.5k!), TabComponents,
  TableComponents/{DataTable,RecordTable}, base/{ChartBase,TableBase}
utils/storage.js                    164  localStorage save/load
utils/fitCalculations.js          2,028  curve fitting library
utils/pdfGenerator.js             1,531  html2canvas+jsPDF orchestration
labs/<n>/labConfig.js + Form.js  ~7.5k  6 labs, mostly JSX prose
phy_114/<n>/labConfig.js + Form.js ~3.5k  6 labs, near-duplicates
```

### 2.2 UI structure

```
<BrowserRouter>
  <App>
    <Routes>
      "/"             → LabHome → LabSelector
      "/phy_114"      → Phy114Home → Phy114LabSelector
      "/:labId"       → Lab → LabContent(selectedLab=getLabById(labId))
      "/phy_114/:id"  → Phy114Lab → LabContent(selectedLab=getPhy114LabById(id))
      "*"             → Navigate to "/"
    </Routes>
    <LabSidebar />            // floating drawer with same a-href hack
  </App>
</BrowserRouter>
```

`LabContent` is the heart. It calls `useLabState(selectedLab)` and renders:

```
<LoadingOverlay/>
<div .lab-app>
  <h1>{labPdfConfig.labTitle}</h1>
  <LayoutSelector ... />
  {layout==='tabs' && <TabNavigation/>}
  <div .content-container>
    <SimulationView simulations={...} />     // PhET iframe; positioned -9999px when hidden
    <LabReportForm ... />                    // the per-lab worksheet
  </div>
</div>
```

The per-lab `LabReportForm` is the customization point. Each one is a giant flat JSX file that hand-composes `<StudentInfoSection>`, `<ConfigurableQuestion>`, `<MultiMeasurementField>`, `<DataTable>`, `<Graph>`, `<GenericImageUploader>`, etc., with literal prose between them.

### 2.3 State management

There is no store. `useLabState` is the de-facto state manager:

- 9 `useState` slots (activeTab, layout, answers, submitted, generatingPdf, pdfGenerated, pdfFilename, simulationLoaded, securityTampered).
- 3 `useEffect`s for: security init, lab-switch reset, simulation-load timer, plus one giant tamper-detection effect that monkey-patches `removeEventListener`.
- A custom `updateAnswers(updater)` that calls `setAnswers(...)` and **also fires an async `saveToLocalStorage(...)` on every keystroke**, and conditionally `postMessage`s to `window.parent` with `'*'`.

State is owned by `useLabState`. `LabReportForm` receives prop drillers (`answers`, `handleChange`, `handleNestedDataChange`, plus 6 lifecycle handlers) and passes them to dozens of children.

### 2.4 Data flow

It is *nominally* unidirectional (handler → setAnswers → re-render), but in practice has these complications:

- **Auto-save side effect inside the setter** — `setAnswers(prev => { const next = updater(prev); save(next); return next; })`. Async storage writes are racing every keystroke. There is no debounce.
- **Image storage** writes File objects via FileReader in the same path → multiple inflight FileReaders during typing → unpredictable order of writes.
- **Lab switch effect** explicitly does `setAnswers(initial); loadLabData(...); setAnswers(loaded);` — two sequential setStates, no batching guarantee in older React, briefly shows initial state then replaces it.
- **Layout switching for PDF** reaches into state, mutates `setLayout('tabs'); setActiveTab('lab')`, sleeps 1000ms, captures DOM, then restores. A `setTimeout` is the load-bearing synchronization primitive for a PDF that grades a student.
- **`window.parent.postMessage`** is a side door out of the React tree.
- **`window[sessionTamperKey]`** is a window global used as a flag, read inside React, with no React-tracked subscription.

### 2.5 External dependencies (inferred)

| Dep | Used for | Replaceable? |
|---|---|---|
| `react`, `react-dom`, `react-router-dom` v6 | shell, routing | keep, but upgrade to v18+ and use React Router data APIs |
| `prop-types` | component contracts | replace with TypeScript |
| `chart.js` + `react-chartjs-2` | charts | keep |
| `mathjs` | equation parsing for custom fits | keep, but isolate |
| `ml-levenberg-marquardt` | nonlinear fit | keep |
| `mathlive` | inline equation editor | keep, but lazy-load |
| `html2canvas` + `jspdf` | DOM-to-PDF | **replace** with `@react-pdf/renderer` or `pdfmake` (declarative, no DOM screenshot) |

---

## 3. Critical Failure Points

These are systemic, not nit-picks. Each one will hit students in the field.

### 3.1 Broken state ownership masked by full-page reloads

The three `<a href>` comment blocks confess it: switching labs via `<Link>` caused Lab A's data to leak into Lab B. The "fix" was to nuke client-side routing. The actual root cause is in `useLabState.loadLabData` and the dependency array `[selectedLab?.id]` — when the effect runs, the closed-over `STORAGE_KEY` is stale because it was computed at the top of the hook from the *previous* `selectedLab`. The effect tries to compensate by reading `selectedLab?.config` directly, but the *security* code paths still use the captured constants. Result: race conditions where the wrong tamper key is checked against the right storage blob.

The honest fix is to key the hook on `(courseId, labId)` and let React unmount/remount the lab tree on `labId` change via a `key` prop on the route element. Five lines of code instead of three copies of a 30-line apology comment.

**Impact:** Students lose unsaved work between labs because the page reload nukes any state not yet persisted.

### 3.2 The "anti-tampering" layer is performance theater that destroys student data

Read `useLabState.js` lines 280–360. They:

1. Override `appElement.removeEventListener` to detect listener removal,
2. On detection, set 4 localStorage flags + 1 window global + 1 React state,
3. On next mount, if those flags are mutually inconsistent (e.g., legitimate cleanup ran, or a Chrome extension intervened, or React StrictMode double-mounted), call `obliterateStorage()` which **deletes the student's lab data**.

Bypass: open devtools, type `delete window._tampering_lab_answers; localStorage.clear()`. Cost: zero. Meanwhile, a student who presses Ctrl-A in the PhET iframe to grab text inside the simulation triggers `actualPreventKeyboardShortcuts` → flag set → next reload obliterates their work.

The `onPaste={e => e.preventDefault()}` on every input is worse: students can't paste their own previously-saved equation into a follow-up question, and screen reader / IME / mobile users are quietly broken.

This is a **net liability** in two ways: it doesn't deter cheating, and it actively destroys legitimate student work. Delete the entire layer.

### 3.3 Race conditions in auto-save

`updateAnswers` fires an async save on every keystroke:

```js
setAnswers(prev => {
  const next = updater(prev);
  saveToLocalStorage(next, ...).then(success => { /* postMessage */ });
  return next;
});
```

`saveToLocalStorage` calls `convertImagesToDataURLs` which uses FileReader, which is async. Two keystrokes 50ms apart can resolve out of order; the older write can stomp the newer. The visible bug is rare (most fields don't have images) but the architecture is wrong.

### 3.4 localStorage quota cliff

Images are stored as base64 data URLs inside the JSON blob. Hard cap is ~5MB. The fallback path silently replaces images with `'storage_quota_exceeded'` and saves anyway. Student sees their image in the UI (still in React state) but reload loses it. No warning surface.

### 3.5 Brittle PDF generation

`handleGeneratePDF` does:

```
setLayout('tabs'); setActiveTab('lab');
await sleep(1000);
const filename = await generateComprehensivePDF(answers, config, appRef.current, ...);
restore layout, tab;
```

`generateComprehensivePDF` is 1531 lines that mutate live DOM styles for "light theme PDF mode," screenshot the result with html2canvas, and stitch it into jsPDF. Failure modes:

- 1000ms isn't always enough; the PhET iframe can repaint after the screenshot.
- Mutating live DOM means a user clicking during PDF generation gets unstyled UI.
- html2canvas drops cross-origin iframes — that's fine for the lab content, but anything inside a PhET iframe is a black box, which is OK in principle but fragile in execution.
- Canvas size limits (`PDF_LIMITS.MAX_CANVAS_DIMENSION = 30000`, mobile 16384) are hit by long lab reports.
- No retry on transient `tainted canvas` failures from cross-origin chart fonts.

### 3.6 React.StrictMode double-mount + side-effecting effects

`index.js` wraps in `<React.StrictMode>`. The security init `useEffect` runs twice on mount in dev. The branch that detects "tamperFlagWasExpected but currentSecurityStatus is missing" can fire in development, setting flags that production then tries to interpret. In React 18 StrictMode, this gets worse because effects also run twice in dev. The whole tamper subsystem is incompatible with StrictMode.

### 3.7 PostMessage with `'*'` target origin

```
window.parent.postMessage({ type: 'SUBMIT_ANSWERS', data: ... }, '*');
```

Any parent frame, intentional or not, receives student answers including their typed legal name. If this is ever embedded somewhere unexpected (Canvas LTI inside Tutor.com inside a chrome extension), data exfiltration is silent.

### 3.8 Implicit XSS surface via `dangerouslySetInnerHTML`

`ConfigurableQuestion` and `MultiMeasurementField` parse `mainTitle`/`title` as HTML when the string contains both `<` and `>`. Today, all titles come from static lab configs, so the surface is bounded. But the next person who pulls a title from `answers` or from a `postMessage` payload introduces XSS.

### 3.9 Accessibility is broken by design

- `onPaste` blocked on every input → IME composition, autofill, password managers, accessibility tools fail.
- `getSelection().removeAllRanges()` on mousedown outside inputs → screen reader users can't read the prose.
- No focus management on tab switch.
- No `aria-*` on the tab buttons.
- "Submit" via `<button>` with `type` defaulted — some submit pathways trigger form submit, others don't.
- Fixed-position `LabSidebar` overlays content with no skip link.

This is an ASU course. ADA compliance is non-negotiable.

### 3.10 Bundle size

Conservative estimate: react + react-router + chart.js + mathjs (huge) + ml-levenberg-marquardt + mathlive (very huge with fonts) + html2canvas + jspdf + the app code → 1.5–3 MB minified. Mobile students on bad WiFi will see multi-second load on every full-page reload (which is how lab switching works, see 3.1).

### 3.11 Code duplication

`labs/` and `phy_114/` are almost the same. Every lab config and form is duplicated, with drift. Adding a lab requires editing both `labs/index.js` and `phy_114/index.js` import lists by hand. Per-lab forms are 500–820 LOC of declarative JSX that *should* be a JSON schema.

### 3.12 No error boundaries except inside Graph

A single render error in any lab section blanks the entire page. `Graph.js` has its own error boundary, then nukes localStorage and reloads on reset — nuking student work to recover from a fit error.

---

## 4. Salvageability Assessment

### 4.1 Salvage as content (high value)

These are the durable instructional artifacts. Extract into JSON-like schemas before touching anything else.

| Asset | Where | Restructure into |
|---|---|---|
| Lab metadata (title, category, description, lab number) | `labs/<n>/labConfig.js` `metadata` | `labs/<n>.lab.json` `meta` |
| Initial answer shape per lab | `initialAnswersState` | `lab.dataModel` (declarative — describe field shapes; the runtime computes initial empty state) |
| Image config keys | `imageConfigsForStorage` | `lab.dataModel` (image fields self-declare) |
| PDF report sections (chart + image embeds with axis labels, fit-type keys) | `labPdfConfig.reportSections` | `lab.report` (renderer-agnostic) |
| Student info config | `labPdfConfig.studentInfoConfig` | `lab.studentInfo` (shared across labs by default) |
| PhET simulation URL + title | `simulations` | `lab.simulations` |
| Question prose, instructions, point values, table column configs, fit config keys | per-lab `LabReportForm.js` JSX | `lab.sections[]` (declarative section schema — see §5.4) |

This is the only thing worth weeks of careful migration work.

### 4.2 Salvage as code (medium value, restructure required)

| Asset | Notes |
|---|---|
| `utils/fitCalculations.js` | Keep the algorithms. Refactor into a typed module with a clean function signature `fit(data, model, options) → result`. Audit custom-equation parser for sandbox escapes. Unit tests for each fit type. |
| `constants/index.js` `UNITS`, `FIT_EXAMPLES`, `COIL_CONFIG` | Direct port. Drop `SECURITY` and `LEGACY_KEYS`. |
| `components/base/ChartBase.js` | Concept good; reimplement as thin wrapper that takes `{type, data, options}` and renders chart.js. Remove the `console.error` fallback path. |
| `GenericImageUploader.js` | Object URL handling is correct. Keep the lifecycle pattern; rewrite the component to use IndexedDB-backed blobs instead of base64 in JSON. |
| MathLive integration | Lazy-load. Keep the per-row `value+isMath` schema; it's actually a nice toggle. |
| `LayoutSelector` / tab navigation | Trivial; rebuild fresh in <100 lines. |
| PDF report **layout intent** (sections, embedded charts, student info header) | Reimplement in `@react-pdf/renderer` from the same schema in §4.1. Throw away the html2canvas pipeline. |

### 4.3 Discard outright

| Item | Reason |
|---|---|
| `useLabState.js` | God-hook, racey, security theater. |
| Anti-tamper subsystem | Doesn't work, destroys data. |
| `onPaste`/`oncopy`/`oncontextmenu`/`onmousedown` blockers | A11y violation, useless. |
| `<a href>` reload-based navigation | Symptom; fixing state ownership obviates it. |
| `labs/index.js` + `phy_114/index.js` hand-imports | Replace with filesystem or manifest. |
| Per-lab `LabReportForm.js` files | Replace with a single schema-driven `<LabReport>` renderer. |
| `phy_114/` duplicated tree | Replace with course manifest that selects from a single `labs/` tree. |
| `utils/pdfGenerator.js` (1531 LOC) | Replace with declarative PDF renderer. |
| `prepareAnswersForStorage` localStorage path for images | Replace with IndexedDB blob store. |
| `postMessage(... '*')` | Replace with explicit `parentOrigin` prop, validated. |
| `window[sessionTamperKey]` globals | Delete. |
| `dangerouslySetInnerHTML` HTML-sniff in titles | Replace with explicit MDX or sanitized rich-text section type. |

### 4.4 Net salvageability

Roughly **15–20% of the codebase** is worth keeping (mostly `fitCalculations.js`, `constants/`, `ChartBase`, parts of `GenericImageUploader`, and the `Graph` fitting UI behavior). Roughly **60% is content** that needs to be migrated into a schema. The remaining **20%** is the rendering, state, security, navigation, and PDF infrastructure — all unsalvageable.

---

## 5. Proposed Architecture (Clean Slate)

### 5.1 First-principles requirements

1. Authoring a new lab is a **content task**, not a coding task. It should be a JSON/TS schema file plus optional asset upload, no JSX.
2. State ownership is **explicit and isolated per `(course, lab, student)` triple**. No data can bleed between labs. Reload between labs is forbidden.
3. Persistence handles **multi-megabyte attachments** without quota cliffs. Image files live in IndexedDB; JSON metadata lives in localStorage.
4. PDF generation is **deterministic** — given the same answer state, the same PDF bytes — and never depends on `setTimeout` or live DOM.
5. **Accessibility is a first-class constraint.** WCAG 2.1 AA. No paste blocking. Real focus management.
6. **No security theater.** Academic integrity is a policy and a Canvas/Turnitin problem, not a frontend tampering-detection problem.
7. **One source of truth per lab.** Course flavors are derived (course ID + lab list + per-course overrides), not duplicated.
8. **Observable.** Errors surface to the student with a recovery action; errors surface to the instructor through opt-in telemetry.

### 5.2 Layered modules

```
src/
  app/                      # routing, providers, error boundary
  ui/                       # presentational React components, no state writes
    sections/               # one component per Section schema variant
    primitives/             # Field, Table, Chart, Uploader, PrintFrame
    layout/                 # TabsView, SideBySideView, Sidebar
  domain/                   # pure functions; no React, no DOM, no storage
    schema/                 # zod-typed Lab + Section + DataModel definitions
    fit/                    # ported fitCalculations.js, hardened
    units/                  # constants/UNITS port
  state/                    # zustand stores + persistence adapters
    labStore.ts             # one slice keyed by (courseId, labId, studentId)
    persistence/            # idb-keyval-backed adapter; localStorage for index
  services/                 # side-effects with explicit boundaries
    pdf/                    # @react-pdf/renderer renderer that consumes schema + answers
    embed/                  # validated postMessage to parent (origin allow-list)
    telemetry/              # opt-in error reporting
  content/
    labs/                   # one file per lab, e.g. snellsLaw.lab.ts
    courses/                # phy114.course.ts → list + overrides
  index.tsx
```

### 5.3 Data model (state shape)

```ts
type LabAnswers = {
  schemaVersion: 1;
  meta: { studentName: string; semester: 'Spring'|'Summer'|'Fall'; session: 'A'|'B'|'C'; year: string; taName: string };
  integrity: { signedAs: string };
  fields: Record<FieldId, FieldValue>;     // flat scalar fields by ID
  tables: Record<TableId, TableData>;      // 2D arrays keyed by table ID; cells are FieldValue
  images: Record<ImageId, BlobRef>;        // BlobRef = { idbKey: string; mime: string; bytes: number }
  fits:   Record<PlotId, FitResult>;
  status: { submitted: boolean; lastSavedAt: number };
};

// Every text input — single fields and table cells — carries its construction history.
type FieldValue = {
  text: string;                            // final state (what's in the input now)
  pastes: PasteEvent[];                    // every paste-style insertion, in temporal order
  meta: {
    activeMs: number;                      // total focus time
    keystrokes: number;                    // count of insertText events
    deletes: number;                       // count of deleteContent* events
    firstFocusAt?: number;                 // ms epoch
    lastEditAt?: number;                   // ms epoch
  };
};

type PasteEvent = {
  text: string;                            // exact pasted content
  at: number;                              // ms epoch
  offset: number;                          // best-effort insertion offset at time of paste
  source: 'clipboard' | 'autocomplete' | 'ime';  // from InputEvent.inputType
};

type Store = {
  byKey: Record<`${CourseId}:${LabId}:${StudentId}`, LabAnswers>;
  current: { courseId; labId; studentId } | null;
};
```

Ownership: the store owns `byKey`. UI components read selected slices via Zustand selectors and dispatch `update(courseId, labId, studentId, patch)`. Persistence is a Zustand middleware that debounces (250ms) and writes JSON to localStorage and blobs to IndexedDB.

### 5.4 Lab schema (declarative)

```ts
type Lab = {
  id: LabId;
  title: string;
  description: string;
  category: 'Physics' | string;
  simulations: Record<SimId, { url: string; title: string; allow?: string }>;
  studentInfo?: StudentInfoOverrides;       // optional per-lab override
  sections: Section[];
};

type Section =
  | { kind: 'instructions'; html: string; points?: number }   // markdown/MDX, sanitized
  | { kind: 'objective'; fieldId: FieldId; rows?: number; points?: number }
  | { kind: 'measurement'; fieldId: FieldId; label: string; unit?: string; points?: number }
  | { kind: 'multiMeasurement'; rows: { id: FieldId; label: string; unit?: string }[]; points?: number }
  | { kind: 'dataTable'; tableId: TableId; columns: Column[]; rowCount: number; points?: number }
  | { kind: 'plot'; plotId: PlotId; sourceTableId: TableId; xCol: string; yCol: string; xLabel: string; yLabel: string; fits?: FitOption[]; points?: number }
  | { kind: 'image'; imageId: ImageId; captionFieldId: FieldId; maxMB?: number; points?: number }
  | { kind: 'calculation'; fieldId: FieldId; prompt: string; equationEditor?: boolean; points?: number }
  | { kind: 'concept'; fieldId: FieldId; prompt: string; rows?: number; points?: number };

type Column =
  | { id: string; label: string; kind: 'input'; unit?: string }
  | { id: string; label: string; kind: 'derived'; deps: string[]; formula: (row: Record<string, number>) => number; precision?: number };
```

Notes:
- Every section is data. No JSX in lab files. `instructions` carries sanitized MDX so prose can include `<sub>`, `<sup>`, formatted lists, and inline math (rendered via KaTeX) without a `dangerouslySetInnerHTML` escape hatch.
- `derived` columns describe their dependencies so the table renderer can recompute deterministically and the PDF renderer can reproduce the values without the React tree.
- `points` is uniform; the schema defines total points per section, summed at runtime for the PDF cover sheet.
- Each `fieldId`, `tableId`, `plotId`, `imageId` is namespaced under the lab's ID at runtime. No global key collisions.

### 5.5 Course manifest

```ts
// content/courses/phy114.course.ts
export const phy114: Course = {
  id: 'phy114',
  title: 'PHY 114',
  storagePrefix: 'phy114',
  parentOriginAllowList: ['https://canvas.asu.edu'],
  labs: [
    { ref: 'staticElectricity', labNumber: 1, enabled: true },
    { ref: 'chargesFields',     labNumber: 2, enabled: true },
    { ref: 'capacitors',        labNumber: 3, enabled: true, overrides: { sections: [...] } },  // optional surgical patch
    { ref: 'dcCircuits',        labNumber: 4, enabled: true },
    { ref: 'snellsLaw',         labNumber: 5, enabled: true },
    { ref: 'geometricOptics',   labNumber: 6, enabled: true },
  ],
};
```

Overrides apply structured patches to the canonical lab schema (replace section by ID, hide section, change point value). No content forking.

### 5.6 Component boundaries

```
<App>
  <Providers>          // Zustand, Router, ErrorBoundary
    <Routes>
      "/"                       → <Catalog course={defaultCourse} />
      "/c/:courseId"            → <Catalog course={resolveCourse} />
      "/c/:courseId/:labId"     → <LabPage key={`${courseId}:${labId}`} />
      "*"                       → <NotFound />
```

`<LabPage>` mounts with a `key` prop tied to `(courseId, labId)`. **Switching labs via `<Link>` triggers React unmount/remount of the lab subtree, which is what we wanted all along — no full-page reload, no state bleed.**

```
<LabPage>
  <LabHeader title points />
  <LayoutToggle />              // tabs / left / right; URL-synced
  <LabBody>
    <SimulationPane sims />     // <iframe sandbox="allow-scripts allow-same-origin">; never repositioned with -9999px
    <LabReport sections answers onChange />
  </LabBody>
  <ActionBar onSave onSubmit onPdf />
</LabPage>
```

`<LabReport>` renders sections by kind. Each section component is < 150 LOC and receives `(section, answers, dispatch)`.

### 5.7 Predictable data flow

1. UI event → section component calls `dispatch({type, payload})` from a typed reducer-style action set (or a thin Zustand action).
2. Store applies pure update; persistence middleware debounces and writes.
3. Subscribed selectors recompute; React re-renders only affected sections (memoized by section ID).
4. PDF generation reads a frozen snapshot of `answers` and the lab schema; renders with `@react-pdf/renderer`; download triggered with a `Blob`.
5. `postMessage` is gated by an explicit allow-list of parent origins from the course manifest.

### 5.8 Persistence adapter

```ts
interface PersistenceAdapter {
  saveJSON(key: string, payload: unknown): Promise<void>;     // localStorage
  saveBlob(key: string, blob: Blob): Promise<void>;           // IndexedDB
  loadJSON<T>(key: string): Promise<T | null>;
  loadBlob(key: string): Promise<Blob | null>;
  listKeys(prefix: string): Promise<string[]>;
}
```

JSON keys: `lab:${courseId}:${labId}:${studentId}`. Blob keys: `img:${courseId}:${labId}:${studentId}:${imageId}`. Quota errors surface to the user with a "free up space" action.

### 5.9 PDF service

`@react-pdf/renderer` renders a `<Document>` from the same `Lab` + `LabAnswers` inputs that drive the live UI. Charts are rendered as `<Svg>` primitives using points + fit overlay computed by `domain/fit/`. No html2canvas. No layout-switch hack. No 1000ms sleep. No mutation of live DOM. Deterministic.

**The PDF is a carrier, not just a render.** After react-pdf produces the byte buffer, `pdf-lib` post-processes it to:

1. Embed the canonical `LabAnswers` JSON as a PDF file attachment (`pdfDoc.attach(jsonBytes, 'lab.json', {mimeType: 'application/json'})`). Auditors and dispute resolution extract this with `pdftk` or Acrobat's attachments panel; graders never need it.
2. Embed `{signature, signedAt}` from the signing service (§5.14) as PDF metadata (`pdfDoc.setKeywords([...])` or a custom `\Info` dictionary entry) AND render them in the document footer as a visible "Signed: 2026-04-29 14:32 — abc12345" line.
3. Optionally embed a QR code in the footer that points to a public verification endpoint, so a TA can scan a printed copy and confirm the hash.

**Pasted content rendering.** Each `FieldValue.text` is rendered with inline visual differentiation:

- For each `PasteEvent` in `pastes`, do a substring match against `text` (with light fuzz tolerance for whitespace and punctuation). Hits get italicized inline. Misses (paste was deleted or heavily edited) are summarized in a one-line note beneath the field: *"Pasted then edited (47 chars at 14:32): The capacitance of the parallel plate capacitor is C = ε₀A/d…"*
- Autocomplete-source pastes (Grammarly, iOS predictive) get a different marker than clipboard pastes — a small dotted underline rather than italics — so graders can distinguish "iOS finished my sentence" from "Cmd-V from ChatGPT."
- Process metadata (active time, keystrokes, paste counts) goes into a "Process Record" appendix at the end of the document, plus a one-line summary under each field that had measurable activity. The integrity agreement (§5.13) discloses all of this.

**Determinism.** Same `(Lab, LabAnswers)` inputs → same PDF bytes (modulo a single `signedAt` timestamp injected via dependency injection so tests can fix it). Snapshot tests assert this.

### 5.10 Accessibility & internationalization baseline

- All inputs labeled; tab order matches visual order; focus rings preserved.
- No `onPaste`/`onCopy`/`oncontextmenu` interception.
- Color contrast WCAG AA in both dark and light modes.
- Live regions for save status (`aria-live="polite"`).
- Keyboard support for tabs, sidebar, layout toggle.
- Strings extracted into `i18n/en.json` from day one (no hard-coded English in components) — Spring 2027 PHY students at ASU's Hispanic-Serving-Institution status will thank you.

### 5.11 Stack choices (recommended)

- **Framework:** React 18 + TypeScript strict.
- **Build:** Vite.
- **Routing:** React Router v6.4 data APIs.
- **State:** Zustand + Immer middleware + custom IDB persistence middleware. (No Redux Toolkit overhead unless team prefers; either works.)
- **Schema validation:** Zod for `Lab` and `LabAnswers`.
- **Charts:** chart.js + react-chartjs-2 (keep).
- **Math input:** mathlive, lazy-loaded.
- **PDF:** `@react-pdf/renderer`. Fall back to `pdfmake` if SVG charts are awkward.
- **Tests:** Vitest + @testing-library/react + Playwright for one end-to-end "fill out a lab → generate PDF → snapshot match" test per lab.
- **A11y CI:** axe-core in tests + Lighthouse in CI.

### 5.12 Repo layout (sketch)

```
ipl-frontend/
  src/
    app/
    ui/
    domain/
    state/
    services/
    content/
      labs/
        snellsLaw.lab.ts
        capacitors.lab.ts
        ...
      courses/
        phy114.course.ts
        general.course.ts
    index.tsx
    main.css
  tests/
    unit/
    e2e/
  scripts/
    migrate-from-legacy.ts        # one-shot: pulls content out of legacy LabReportForm.js
  README.md
  package.json
  vite.config.ts
  tsconfig.json
```

### 5.13 Process telemetry & integrity model

The integrity story is **disclosure plus visibility**, not prevention. Concretely:

- The integrity agreement (rendered on the StudentInfo section of every lab) reads, in part: *"Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF."*
- Every `FieldValue` (single fields and individual table cells) records the construction history defined in §5.4: paste events with full content, keystroke counts, active time, focus timing.
- Capture is implemented at the `<TextInput>` primitive layer using `InputEvent.inputType`:
  - `insertText` → keystroke
  - `insertFromPaste` → `PasteEvent {source: 'clipboard'}`
  - `insertReplacementText` → `PasteEvent {source: 'autocomplete'}` (Grammarly, iOS predictive, browser smart compose)
  - `insertCompositionText` (between `compositionstart` and `compositionend`) → `PasteEvent {source: 'ime'}`, only counted at composition end so Chinese/Japanese typing isn't logged per character
  - `deleteContent*` → delete count
- The capture layer is a controlled component wrapper. It maintains an internal `FieldValue` and emits patches via `onChange(value, event)` to the store.
- All telemetry is local-only by default. No external endpoints. The signing function (§5.14) only sees the canonical JSON bytes; it doesn't store anything.

**Anti-patterns explicitly rejected:**
- Character-level edit history (CRDT-style). Surveillance creep, no marginal grading signal.
- Webcam or screen recording. Different threat model entirely.
- Hidden capture without disclosure. If students don't know it's there, it's a trap, not pedagogy.
- Capturing into `localStorage` keys students could clear with one console line. The capture lives inside the canonical `LabAnswers` and is sealed by the HMAC.

### 5.14 Signing service

A single Vercel serverless function at `api/sign.ts`:

```ts
// POST /api/sign
// Body: { canonical: string }   — JSON.stringify(canonicalize(labAnswers))
// Returns: { signature: string, signedAt: number }
// Errors: 400 invalid body, 405 wrong method, 413 payload too large, 500 misconfigured
```

Implementation:
- HMAC-SHA256 over `canonical || String(signedAt)`, secret from `LAB_SIGNING_SECRET` env var.
- `signedAt` is set server-side (`Date.now()`), not client-supplied.
- 5 MB hard cap on `canonical` length.
- No persistence. No logging of payload contents. Logs only the signed length and a hash prefix for debugging.
- Same-origin by default on Vercel; no CORS config needed if the frontend and function deploy together.

**Canonicalization.** The frontend serializes `LabAnswers` deterministically before sending:
- Keys sorted alphabetically at every object level.
- No whitespace.
- Numbers in shortest round-trippable form.
- Implemented via a small `canonicalize()` utility in `src/services/integrity/`, with a unit test asserting permutations of the same logical state produce identical strings.

**Verification.** A separate small route `GET /api/verify?h=<sig>&p=<canonicalHash>` (or a static `/verify` page that does it client-side using the same secret via the same function) lets a TA confirm a printed PDF matches its embedded hash. v1 can ship with just the signing endpoint and add `/verify` later if disputes warrant it.

**Local development.** `vercel dev` runs the function alongside Vite. Document this in the README. For unit tests, the function is importable directly and can be exercised with a mocked `VercelRequest`/`VercelResponse`.

**Threat model honesty.** This catches the lazy student who edits a number in Acrobat. It does not catch a determined attacker who reads `signedAt` from the PDF, modifies the canonical JSON, and re-POSTs to `/api/sign` to get a fresh signature. Closing that gap requires either binding the signature to a server-issued nonce (small backend complexity bump) or rate-limiting + logging signing requests per `studentName` (minor backend complexity, useful telemetry). v1 ships without these; if cheating proves to be a real problem, add nonce binding in v1.1. Document the limitation in the README.

---

## 6. Implementation Blueprint — Phased

Each phase is sized to one focused agent run (1–3 days of agent work, depending on lab count). Phases ship working software — never a half-migrated state. Each ends with a demo-able deliverable.

### Phase 0 — Freeze content & set up new repo

**Goal:** New repo skeleton; `Lab` and `Course` schemas typed; one lab (Snell's Law) hand-migrated to the schema; legacy app untouched.

**Deliverables:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, ESLint, Prettier, Vitest config, Playwright config.
- `src/domain/schema/lab.ts` and `course.ts` with Zod schemas.
- `src/content/labs/snellsLaw.lab.ts` — full migration of Snell's Law content from `labs/snellsLaw/`.
- `src/content/courses/general.course.ts` and `phy114.course.ts` (manifest only).
- `tests/unit/snellsLaw.schema.test.ts` — schema validates.
- `scripts/migrate-from-legacy.ts` stub — reads a legacy `LabReportForm.js` AST and emits a draft `*.lab.ts`. (Best-effort; manual cleanup required. Worth writing because there are 12 labs.)

**Definition of done:** Snell's Law schema renders to a console.log dump of `JSON.stringify(lab, null, 2)` matching the structure described in §5.4. Repo lints, types, and tests green.

#### Phase 0 — Agent prompt

```
You are setting up a new TypeScript + React + Vite project at the path the user
provides (target: clean rebuild of an existing physics lab worksheet app).

Read the rebuild spec at REBUILD_SPEC.md sections 5.1–5.4 and 5.11–5.12
for architectural intent. Read the existing legacy code at
physics-labs.up.railway.app/labs/snellsLaw/{labConfig.js,LabReportForm.js}
to see the source content you must migrate.

Tasks:
1. Scaffold the repo per §5.12: Vite + React 18 + TS strict, ESLint, Prettier,
   Vitest, Playwright. No actual app code yet.
2. Implement Zod schemas for Lab, Course, and every Section variant from §5.4,
   AND for LabAnswers including FieldValue/PasteEvent (§5.4 + §5.13). Export
   TS types via z.infer. Place under src/domain/schema/.
3. Implement src/services/integrity/canonicalize.ts (deterministic
   serialization per §5.14: keys sorted, no whitespace, shortest round-
   trippable numbers). Unit test that permutations of the same logical
   state produce identical strings.
4. Hand-migrate Snell's Law (legacy labs/snellsLaw/) into
   src/content/labs/snellsLaw.lab.ts. Faithfully preserve question text, table
   columns, derived-column formulas, point values, simulation URL,
   PDF report sections. Do NOT carry over: anti-paste, anti-tamper,
   dangerouslySetInnerHTML, the duplicated phy_114/snellsLaw fork.
5. Create the two course manifests (general, phy114) referencing snellsLaw.
   Other lab IDs may appear in the manifest with `enabled: false` and a TODO
   comment — they will be migrated in later phases.
6. Write Vitest unit tests asserting:
   (a) the Snell's Law schema parses with Zod,
   (b) derived-column formulas evaluate correctly for a known input row,
   (c) canonicalize() produces identical output for permuted-but-equivalent
       LabAnswers objects.
7. Stub scripts/migrate-from-legacy.ts that reads a legacy LabReportForm.js
   path and prints a best-effort draft schema to stdout. Best-effort is fine;
   it's a developer tool, not a production path.

Constraints:
- TS strict; no `any` outside the migration script.
- No JSX yet. This phase is content + types only.
- Ask for clarification on any prose where the legacy file is ambiguous about
  intent (e.g., a measurement with no unit field — confirm if it should be
  unitless or unit-as-input).

Deliverable: a working repo where `npm run lint && npm run typecheck && npm test`
all pass, with one fully migrated Snell's Law schema.
```

---

### Phase 1 — Schema-driven renderer (one lab, end-to-end UI, no persistence)

**Goal:** `<LabPage>` that mounts Snell's Law from the schema, renders all section kinds, lets the user fill out the form in-memory. No save, no PDF, no security yet.

**Deliverables:**
- `src/ui/sections/*` — one component per Section kind from §5.4.
- `src/ui/primitives/*` — Field, Table, Chart, ImageUploader, EquationEditor (mathlive lazy-loaded).
- `src/ui/layout/*` — TabsView, SideBySideView, LayoutToggle.
- `src/state/labStore.ts` — Zustand store holding the *current* lab's answers in-memory only.
- `src/app/Routes.tsx` — `/c/:courseId/:labId` mounts `<LabPage key={...} />`.
- `<Catalog>` page rendering the manifest with proper `<Link>` (no full-page reload).
- E2E test: open Snell's Law, fill name, fill table row 0, see `sin(θ)` derived column auto-update, switch tabs.

**Definition of done:** A user can complete every section type for Snell's Law in the browser. Switching to another lab via the catalog mounts a fresh empty form. Refreshing the page loses data (intended — persistence is Phase 2).

#### Phase 1 — Agent prompt

```
The repo from Phase 0 has Lab/Course schemas and one migrated lab (Snell's
Law). Your job is to build the schema-driven renderer that mounts that schema
into a working in-browser form.

Read REBUILD_SPEC.md sections 5.6, 5.4, and 3.1. Section 3.1 is critical —
the legacy code used full-page reloads on lab switch because their state
ownership was broken. You will avoid that by keying <LabPage> on
(courseId, labId) so React naturally unmounts/remounts on lab change.

Tasks:
1. Build src/ui/primitives/: Field (text/textarea — must capture FieldValue
   per §5.13: track InputEvent.inputType for typed/pasted/autocomplete/IME,
   accumulate PasteEvent[] on clipboard/replacement/composition events,
   maintain meta {activeMs, keystrokes, deletes, firstFocusAt, lastEditAt}.
   Treat IME compositions as a single event at compositionend. Emit
   onChange(FieldValue) — no plain strings escape the primitive),
   Table (cells are FieldValues; derived columns read .text from input
   cells and write .text on derived cells), Chart (chart.js wrapper,
   thin), ImageUploader (object-URL preview, no persistence yet),
   EquationEditor (lazy-loaded mathlive — same FieldValue contract).
2. Build src/ui/sections/: one component per Section kind. Each is <150 LOC.
   Render `instructions` via a sanitized MDX/markdown pipeline (use
   `react-markdown` + `rehype-sanitize` + KaTeX). NO dangerouslySetInnerHTML.
3. Build src/ui/layout/: TabsView, SideBySideView, LayoutToggle. Layout state
   is URL-synced via search params, not React state alone. The simulation
   iframe must NEVER be moved off-screen with -9999px; tab switching uses
   `display:none` only. Iframe should not re-mount on layout change.
4. Build src/state/labStore.ts with Zustand. In-memory only. Keyed by
   (courseId, labId). Selectors must be memoized (use Zustand's `subscribeWithSelector`
   or `useShallow`).
5. Build <Catalog> and routes. Use `<Link>`, not `<a href>`. Confirm by E2E
   test that switching labs does not produce a full-page reload (Playwright:
   `expect(page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)`).
6. Write Vitest unit tests for derived-column evaluation, schema → section
   rendering, and store actions. Write a Playwright E2E that fills Snell's
   Law's Part 1 table and asserts sin/cos derived columns update.

Constraints:
- No persistence yet — in-memory store only.
- No security/anti-tamper code. Ever.
- No onPaste/onCopy/onContextMenu interception. A11y is a hard constraint:
  every input must be labeled, focus order must match visual order.
- Use React 18, function components, hooks. No class components except the
  top-level ErrorBoundary.

Deliverable: lint + typecheck + unit tests + 1 E2E test all green; demo-ready
single-lab experience.
```

---

### Phase 1.5 — Primitive corrections (paste fidelity, markdown, charts, equation editor, iframe stability)

**Goal:** Close the gaps left by Phase 1's happy-path implementation before Phase 2 builds persistence on top of them. Six concrete fixes; no new surface area, no new lab content. The Phase 1 test suite must remain green throughout, and new tests pin down each fix so the bug does not return.

**Why this phase exists.** Phase 1 shipped working scaffolding and a green CI, but six primitives were stubbed in ways that will mislead downstream phases:

- `markFieldActivity` records the *entire post-paste field text* as `PasteEvent.text` instead of the inserted substring, with `offset = text.length` instead of the insertion point. Phase 3's `attributePastes(text, pastes)` will either italicize the entire field or fail to match anything. This is the highest-priority fix because Phase 2 will start persisting these wrong records.
- IME `compositionstart`/`compositionend` are not handled, so CJK/IME users will record one paste event per logical character.
- `keystrokes` increments on every non-delete `inputType`, including pastes and replacements. Spec §5.4 defines `keystrokes` as the count of `insertText` events.
- `InstructionsSectionView` splits on `\n` and emits `<p>` tags. Snell's Law contains `## Headers`, `**bold**`, and equation references that render as literal source. The Phase 1 prompt explicitly required `react-markdown + rehype-sanitize + KaTeX`.
- `Chart` renders points as an `<li>` list. Schema declares `fits: [...]` overlays that have nowhere to live.
- `EquationEditor` is a `<Field multiline>` rename — `mathlive` is not in `package.json`.
- `LabPage` builds the simulation iframe inline and passes it as a `ReactNode` prop into either `<TabsView>` or `<SideBySideView>`. Toggling `layout` unmounts one wrapper and mounts the other, taking the iframe with it. Spec: *"Iframe should not re-mount on layout change."*

**Deliverables:**

1. **Field-value capture correctness.**
   - `markFieldActivity(previous, target, event)` (signature change) computes the inserted substring from `target.value`, `previous.text`, and the InputEvent's `data` plus `target.selectionStart`. Records `{text: <substring>, at, offset, source}` with the actual insertion offset.
   - `keystrokes` increments only on `inputType === 'insertText'`. `deletes` continues to increment on any `inputType.startsWith('delete')`. Paste/composition/replacement events do not bump either counter.
   - `Field.tsx` registers `compositionstart` / `compositionend` handlers; during composition, `insertCompositionText` events do *not* push paste events. On `compositionend`, a single `PasteEvent {source: 'ime'}` is pushed with the composed text and the offset where composition began.
   - Drop and autocomplete events are mapped per spec: `insertFromDrop` → `clipboard`, `insertFromPaste` → `clipboard`, `insertReplacementText` → `autocomplete`.
   - `meta.activeMs` continues to accumulate from focus/blur as today.

2. **Sanitized markdown pipeline for instructions.**
   - Add `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-sanitize`, and `katex` (CSS imported once at app entry).
   - Rewrite `InstructionsSectionView` to render `section.html` through the pipeline. Sanitization schema is the rehype default plus `sub`, `sup`, and KaTeX's required spans/classes. No `dangerouslySetInnerHTML` escape hatch.
   - Confirm against Snell's Law's instruction blocks: headers render as `<h2>`/`<h3>`, bold/italic/lists/inline code/inline math (`$...$` or `\(...\)`) all display correctly.

3. **Real Chart primitive.**
   - Add `chart.js` and `react-chartjs-2`.
   - `Chart.tsx` renders a scatter plot of the (x, y) points pulled from the source table. Axes labeled per `section.xLabel` / `section.yLabel`.
   - For each `section.fits[]` entry, render the fit overlay using the simplest correct implementation (linear least-squares is fine for now; nonlinear fits are deferred until `domain/fit/` is ported in Phase 3). If a fit kind is not yet supported, render the points without an overlay and emit a single `console.warn` in dev only — do not silently ignore.
   - Chart re-renders when underlying table data changes. Verify there is no visible chart.js leak between mount/unmount cycles (chart.js needs explicit `destroy()`; `react-chartjs-2` handles this, but unit-test that mounting and unmounting the section twice in succession does not throw).

4. **Mathlive-backed EquationEditor.**
   - Add `mathlive`. Lazy-load via dynamic `import('mathlive')` inside a `useEffect` so the bundle cost does not hit catalog/lab pages that don't need it.
   - `EquationEditor` renders a `<math-field>` web component, controlled by `value.text` (LaTeX source) and emitting `FieldValue` patches via the same `markFieldActivity` contract. Paste/IME tracking still flows through the canonical capture layer.
   - During the dynamic import, render a `<Field multiline>` fallback so the field is usable before mathlive resolves. After mathlive loads, swap in the math editor without losing the in-flight `FieldValue`.
   - Verify mathlive's CSS is loaded only when the component mounts.

5. **Iframe stability across layout toggle.**
   - Hoist the simulation iframe out of the layout-toggle subtree. Render it once in `LabPage` at a stable location in the React tree; pass slot tokens (e.g., a `simulationSlotId`) to `TabsView` / `SideBySideView` and use a portal (`createPortal`) or a CSS-grid template that places the same iframe DOM node in the right cell regardless of layout. Toggling `layout` must not unmount the iframe.
   - Add a Playwright E2E that flips layout twice and asserts the iframe element identity is preserved (e.g., assert a stamped `data-mount-id` attribute set on first paint via a one-shot `useEffect` does not change after layout flips).

6. **Tests pinning each fix.**
   - Vitest unit: `markFieldActivity` captures the inserted substring on `insertFromPaste`, the correct offset on a mid-string paste, and a single `ime` paste event after a `compositionstart` → multiple `insertCompositionText` → `compositionend` sequence. Add explicit assertions that `keystrokes` does not increment on paste/composition/replacement.
   - Vitest unit: an instruction section containing a header, bold span, list, and inline math renders to the corresponding sanitized DOM with no script/iframe leakage from a hostile fixture (`<script>alert(1)</script>` in `html` source must not produce a `<script>` element).
   - Vitest unit: `Chart` renders for a 3-point fixture, axes labels appear in the rendered SVG/canvas DOM (use jsdom's canvas mock or a snapshot of chart.js's metadata), and `fits: [{id: 'linear'}]` produces a slope/intercept that matches a hand-computed value to 1e-9.
   - Vitest unit: `EquationEditor` mounts, dynamic import resolves, `<math-field>` is in the DOM, and a typed character produces a `FieldValue` patch with `keystrokes: 1`.
   - Playwright E2E (extension to `smoke.spec.ts` or new file): flip `layout` from side-by-side to tabs and back; assert the iframe's `data-mount-id` is unchanged.

**Definition of done:** All Phase 1 tests still green; six new tests added and green; `npm run lint && npm run typecheck && npm test` clean; `npx playwright test` green locally (paid forward as a CI requirement when CI is set up). Bundle size for the catalog page does not regress past the Phase 1 baseline + 50KB gzip (mathlive should be in its own async chunk).

#### Phase 1.5 — Agent prompt

```
Phase 1 left six primitives stubbed. Fix them in place. No new lab content,
no new sections, no persistence work. Test suite must stay green.

Read REBUILD_SPEC.md sections 5.4, 5.13, and the Phase 1.5 deliverables list
above. Read the current implementations:
- src/state/labStore.ts (markFieldActivity)
- src/ui/primitives/Field.tsx
- src/ui/primitives/Chart.tsx
- src/ui/primitives/EquationEditor.tsx
- src/ui/sections/InstructionsSectionView.tsx
- src/ui/LabPage.tsx + src/ui/layout/{TabsView,SideBySideView}.tsx

Tasks:

1. Fix markFieldActivity + Field.tsx FieldValue capture.
   a. Change the signature to take (previous, target, event) so the function
      can read target.selectionStart and event.data. Compute the inserted
      substring as the diff between previous.text and target.value at the
      insertion point — do NOT just record target.value.
   b. Map inputType → PasteEvent.source: insertFromPaste/insertFromDrop →
      'clipboard', insertReplacementText → 'autocomplete', insertCompositionText
      → 'ime' (but see (c)). Other inputType values do not produce a paste
      event.
   c. Add compositionstart/compositionend handlers on the input/textarea.
      During composition, suppress paste-event creation. On compositionend,
      push a single PasteEvent{source: 'ime', text: <composed substring>,
      offset: <offset where composition began>}.
   d. keystrokes increments ONLY on inputType === 'insertText'. deletes
      increments on inputType.startsWith('delete'). All other inputTypes
      touch neither counter.
   e. Unit-test edge cases listed in §6 of Phase 1.5. Pin paste substring
      capture, IME single-event behavior, and keystroke gating.

2. Add markdown pipeline.
   Install react-markdown, remark-gfm, remark-math, rehype-katex,
   rehype-sanitize, katex. Import katex CSS once in src/main.tsx.
   Rewrite InstructionsSectionView to render section.html through the
   pipeline. Default rehype-sanitize schema, extended with KaTeX's
   required attributes (use the schema export from rehype-katex docs).
   Verify Snell's Law's instruction blocks render correctly. Add the
   hostile-fixture XSS test from §6.

3. Add chart.js and react-chartjs-2.
   Replace Chart.tsx with a scatter plot. Pull (x, y) from the source
   table by xCol/yCol. Render axes from xLabel/yLabel. For each fit
   in section.fits, render the overlay. Implement linear least-squares
   inline (it's 10 lines); other fit kinds emit console.warn in dev and
   render points without overlay. Add tests per §6.

4. Add mathlive, lazy-loaded.
   EquationEditor uses a dynamic import inside useEffect. Render a
   <Field multiline> fallback during the import. After mathlive resolves,
   render a <math-field> controlled by value.text. Wire input events
   through markFieldActivity so paste/IME/keystroke tracking continues
   to work. Test mounts, dynamic import resolution, and a single
   keystroke patch.

5. Hoist the simulation iframe.
   The iframe element must not re-mount when layout toggles. Two
   acceptable approaches:
   a. Render the iframe once in LabPage and use createPortal to place
      it in a slot exposed by TabsView / SideBySideView.
   b. Render TabsView and SideBySideView at the same time with CSS that
      hides the inactive layout, with the iframe living in a stable
      grid cell that both layouts reuse.
   Pick one; document the choice in a comment. Add the data-mount-id
   E2E from §6.

6. Run npm run lint && npm run typecheck && npm test && npx playwright test.
   All green before declaring done.

Constraints:
- No persistence work (still Phase 2's job).
- No new section kinds or schema changes.
- No security/anti-tamper code. Ever.
- Keep mathlive in its own async chunk; verify with a bundle-analyzer
  pass or by inspecting the Vite manifest.
- Bundle size budget for the catalog page: Phase 1 baseline + 50KB gzip.
- Markdown sanitization must reject <script>, <iframe>, on* handlers,
  and javascript: URLs. Test with a hostile fixture.

Deliverable: six fixes in place, six new tests green, full suite green,
no Phase 1 regressions. Phase 2 can now build persistence on a correct
FieldValue.
```

---

### Phase 1.6 — Baseline legibility (color scheme, form-control contrast, toggle button hierarchy)

**Goal:** Make the app legible *right now* in both light and dark OS preferences, without trying to be Phase 5's full design system. This phase is the bridge between Phase 1's minimal CSS and Phase 5's WCAG-AA + axe-core polish, scoped narrowly enough to ship in one sitting.

**Why this phase exists.** Phase 1's `main.css` declares `background: #fff` on form controls (`input`, `textarea`, `button`, `math-field`) but never declares an explicit `color`. The `index.html` `<meta name="color-scheme" content="light dark">` tells the browser the page supports both schemes; in OS dark mode, the browser applies its dark UA stylesheet to form controls — the white background stays, but text inherits the UA's near-white color. Result: white text on white background inside every input, textarea, and button. Body prose is fine because `body { color: #111 }` is explicit.

The same root cause makes toggle buttons appear "switched": `button[aria-pressed='true']` declares `color: #1558d6` (blue), so the *selected* state is visible. The unpressed state has no explicit `color`, so it inherits the UA's white in dark mode — invisible. Austin sees the highlighted button and a blank space where the off-state button should be, which reads as the toggle being inverted.

Phase 5 (§5.10, §5.11) explicitly plans WCAG-AA contrast in both modes plus axe-core in CI. That work stays scoped to Phase 5. This phase is *not* a substitute — no design tokens, no theme toggle, no component variants, no typography pass. It is one targeted CSS fix plus a regression guard.

**Deliverables:**

1. **Force a single color scheme until Phase 5.**
   - `index.html`: change `<meta name="color-scheme" content="light dark">` to `content="light"`.
   - `src/main.css` `:root`: add `color-scheme: light;` so form-control UA defaults stay in the light-mode track regardless of OS preference.
   - Document the deferral in a one-line CSS comment pointing at Phase 5 for the proper dark-mode treatment.

2. **Explicit `color` on every form control and section surface.**
   - `input, textarea, math-field, button` all get `color: #111` (matching body).
   - `.section` already has `background: #fff`; add `color: #111` to make the surface independent of body inheritance.
   - Table cells `th, td` get explicit `color: #111` and `th` gets a subtle background (`#f3f4f6` or similar) so headers are distinguishable from data rows.
   - `.field-label` already has `font-weight: 600`; verify it inherits a readable color and add explicit `color: #111` if not.

3. **Toggle button visual hierarchy.**
   - Unpressed (`button[aria-pressed='false']` and bare `button`): outlined chip — white background, `#111` text, `#bbb` border.
   - Pressed (`button[aria-pressed='true']`): filled chip — `#1558d6` background, white text, same blue border. This is the inversion of the current rule (blue text on white) and reads correctly in both schemes regardless of UA quirks.
   - Hover and focus-visible states get a slightly darker blue (`#0f4ab8`) and a 2px focus ring. Focus rings stay visible on both pressed and unpressed.
   - Disabled state (any `button:disabled`): muted gray text, no pointer cursor.

4. **Visual hierarchy between sections.**
   - `.section` gets a subtle elevation: `box-shadow: 0 1px 2px rgba(17, 17, 17, 0.06); border: 1px solid #e0e0e0;`. Just enough to separate sections from page background without committing to a design language.
   - `.section h2, .section h3` get explicit `color: #111` and a tighter top margin so the markdown-rendered headers from Phase 1.5 don't float above their containers.

5. **Catalog page legibility.**
   - Disabled lab entries (`<span>` for `enabled: false` labs) currently inherit body color and look identical to enabled `<Link>` text. Add a `.catalog-lab--disabled` class, give it `color: #6b7280` (gray) and `font-style: italic`, so "(coming soon)" entries are visually distinct without a separate widget.
   - Active lab links keep the existing `a { color: #1558d6 }`. Add `:hover { text-decoration: underline; }` for a touch of feedback.

6. **Regression guard.**
   - Vitest unit (jsdom-based): mount `<LayoutToggle layout='side' onChange={noop} />`, read computed styles, and assert that both buttons have a non-transparent foreground color and that the pressed/unpressed pair have *different* visible backgrounds. This catches "buttons disappear in dark mode" specifically. (jsdom doesn't apply UA dark-mode styles by default, but the test pins the explicit values, which is what we care about.)
   - Playwright E2E (extension to `smoke.spec.ts` or a new `tests/e2e/legibility.spec.ts`): launch with `colorScheme: 'dark'` in the browser context, navigate to Snell's Law, screenshot, and assert via DOM inspection that an unpressed `<button>` has a foreground color whose computed value is *not* white-ish (rule out `rgb(255, 255, 255)` and the four nearest near-whites). Add a second case with `colorScheme: 'light'` to confirm parity.

**Definition of done:** All Phase 1 + Phase 1.5 tests still green; two new tests added (one unit, one E2E) and green in both `light` and `dark` browser color schemes; Austin can read the app on his current setup without changing OS preferences. Lighthouse contrast score not measured here — that's Phase 5.

**Explicit non-goals (deferred to Phase 5):**
- Dark-mode theme. The page is light-only until Phase 5 builds the proper two-theme system.
- WCAG AA contrast audit across every text/background pair. Phase 1.6 only fixes the legibility cliff.
- Design tokens / CSS custom properties for color. Phase 5 introduces those alongside the theme system.
- Typography (font sizes, line heights, font stack changes).
- Spacing rhythm, vertical baseline alignment.
- Component visual variants (primary/secondary/danger/ghost button styles).
- axe-core integration. Phase 5.

#### Phase 1.6 — Agent prompt

```
The app is legible in OS light mode and unreadable in OS dark mode because
form controls and buttons have explicit backgrounds but no explicit text
color. In OS dark mode, the browser's UA stylesheet supplies a near-white
text color, producing white text on the white background set in main.css.
Toggle buttons appear "switched" for the same reason — only the pressed
state has an explicit color rule.

This is a tactical legibility pass, not Phase 5's full a11y work. Do not
introduce design tokens, theme toggle, or component variants. Stay narrow.

Read REBUILD_SPEC.md Phase 1.6 deliverables (six items above) and
sections 5.10–5.11 for what Phase 5 will do later (WCAG AA, axe-core,
Lighthouse) — to make sure you don't accidentally do that work here.

Tasks:

1. index.html: change <meta name="color-scheme" content="light dark"> to
   content="light".

2. src/main.css :root: add `color-scheme: light;` with a one-line comment
   noting that Phase 5 will reintroduce dark mode properly.

3. Add explicit `color: #111` to:
   - input, textarea, math-field, button (existing rules)
   - .section
   - th, td (and give th a subtle #f3f4f6 background)

4. Replace the existing `button[aria-pressed='true']` rule with a filled-
   chip treatment: background #1558d6, color #fff, border #1558d6.
   Confirm bare buttons and aria-pressed='false' read as outlined chips
   (#fff bg, #111 text, #bbb border). Add :hover {background: #0f4ab8}
   on pressed buttons and a 2px focus-visible ring on all buttons.

5. .section: add `box-shadow: 0 1px 2px rgba(17,17,17,0.06)` and bump
   the border color to #e0e0e0. Add explicit color to .section h2/h3.

6. Catalog: add a `.catalog-lab--disabled` class on the <span> for
   disabled labs in src/ui/Catalog.tsx; style it `color: #6b7280;
   font-style: italic;` in main.css. Add :hover underline to `a`.

7. Tests:
   - Add tests/unit/layoutToggle.contrast.test.tsx: mount LayoutToggle,
     assert both buttons have explicit non-empty `color` style and that
     pressed/unpressed have different background-color computed values.
   - Add (or extend) tests/e2e/legibility.spec.ts: two cases with
     colorScheme: 'dark' and 'light' browser contexts; navigate to a lab,
     pick an unpressed button, assert window.getComputedStyle(btn).color
     is not in the set of white-ish values (rgb(255, 255, 255) and the
     three nearest neighbors).

8. Run npm run lint && npm run typecheck && npm test && npx playwright test.
   All green before declaring done.

Constraints:
- One CSS file (src/main.css). Do not split into modules or themes.
- No new dependencies.
- No design-token CSS custom properties; just explicit hex values for
  now. Phase 5 introduces tokens.
- Do not touch anything outside index.html, src/main.css, src/ui/Catalog.tsx
  (one className addition only), and the two new tests.
- Bundle size budget: identical to Phase 1.5 baseline ± 2KB gzip.

Deliverable: legible app in both OS color schemes; toggle buttons read
correctly; two new tests green; full suite green; no regressions to
Phase 1 or 1.5. Phase 5 still owns the proper a11y/dark-mode work.
```

---

### Phase 1.7 — Layout polish (sticky header slot, larger sim default, draggable splitter)

**Goal:** Make the side-by-side layout actually pleasant to work in. Three targeted changes: a sticky header that behaves as a stable slot for controls Phases 2/3/5 will add, a default split that gives the PhET sim more room, and a horizontal drag handle so students can rebalance the panes mid-task. No persistence work, no mobile flow, no design system.

**Why this phase exists.** PhET sims are pixel-hungry — Bending Light's ray box, sliders, and material picker need ~1024×768 to be usable, and a `1fr 1fr` grid on a 1440px viewport hands each pane roughly 700×500 after gutters. Snell's Law has 47 sections post-Phase-0 widening, so students scroll a lot; the layout toggle and back link disappear up the page within seconds, forcing a scroll-to-top to switch views. And students don't have a single best ratio — measurement-heavy parts want a big sim, writing-heavy parts want a big worksheet. A binary tab/side toggle forces extremes that neither mode satisfies.

Phase 1.7 does not solve mobile (Phase 5), does not persist the split fraction (Phase 2 owns persistence), does not introduce design tokens (Phase 5), and does not touch the tabs view. It ships three things and leaves room for the rest.

**Deliverables:**

1. **Sticky header slot.**
   - `.lab-header` becomes `position: sticky; top: 0; z-index: 10;` with the same `#fafafa` background as body and a 1px bottom border to separate it from scrolled content.
   - Header contents become a three-region flex layout: left (`Back to {course.title}` link), center (a `<div className="lab-header-slot">` placeholder for Phases 2/3/5), right (`<LayoutToggle/>`). The center slot renders nothing today — it's deliberately empty so Phase 2's "Saved 14:32" indicator and Phase 3's "Generate PDF" button drop into a stable home without a refactor.
   - Header height stays ≤ 56px to preserve vertical real estate for the lab body.
   - Document the slot contract in a comment in `src/ui/LabPage.tsx`: *"Phase 2 mounts the save indicator here; Phase 3 mounts the PDF generate button here."*

2. **Default split favors the simulation.**
   - Default split fraction is 60% sim / 40% worksheet, not 50/50.
   - `.lab-layout-side`'s `grid-template-columns` becomes `var(--split-sim) var(--split-divider) 1fr` where `--split-sim` is set inline from React state (default `60%`), `--split-divider` is the 8px drag handle, and `1fr` claims the remainder for the worksheet.
   - `.simulation-frame` `min-height` bumps from 500px to 720px to keep PhET tools readable when the sim pane is at default width.
   - Delete the dead `.side-by-side` rule in `src/main.css` (LabPage uses `.lab-layout-side` now; the older class is leftover scaffolding from the deprecated `<SideBySideView>` wrapper).

3. **Resizable splitter (drag + keyboard).**
   - New `src/ui/layout/SplitHandle.tsx`: an 8px-wide vertical bar between the panes. Hover/active state widens the visible affordance to 12px; cursor is `col-resize`.
   - Pointer interaction: `pointerdown` captures the pointer, `pointermove` updates the split fraction (clamped 25%–75%), `pointerup` releases. Use `event.target.setPointerCapture` so dragging over the iframe doesn't lose the event.
   - Keyboard interaction: handle is `tabIndex={0}` with `role="separator"` and `aria-orientation="vertical"`. Arrow Left/Right adjust by ±2%, Shift+Arrow by ±10%, Home/End jump to bounds. `aria-valuenow`, `aria-valuemin`, `aria-valuemax` reflect current state for screen readers.
   - State lives in Zustand (`useLabStore` adds a `splitFraction: number` slice with a setter). Not persisted — Phase 2 will fold it into the persisted lab state. No URL sync; the split is per-session UI state, not part of the shareable lab address.
   - Iframe stability: the split handle MUST NOT re-mount the iframe. The fix from Phase 1.5 #5 (single iframe in a stable grid cell) carries forward; the splitter only updates the grid template column, not the DOM tree.
   - Splitter is hidden in tabs layout (no panes to split).

4. **Tests pinning the new behavior.**
   - Vitest unit: `SplitHandle` mounts with default fraction, arrow key advances fraction by 2%, shift+arrow by 10%, Home/End hit bounds, fraction clamps at 25%/75%. Mock `setPointerCapture`.
   - Vitest unit: header is sticky (`getComputedStyle(header).position === 'sticky'`) and the center slot is a labeled empty container that future phases can target by class.
   - Playwright E2E (extension to `smoke.spec.ts` or new `tests/e2e/layout.spec.ts`):
     - Open Snell's Law in side-by-side. Assert the iframe's `clientWidth` is at least 55% of the lab body width (default 60% minus rounding tolerance).
     - Drag the split handle 100px to the right. Assert the iframe is now narrower; the worksheet wider.
     - Reload the page. Assert the iframe is back to default width (no persistence yet — that's Phase 2).
     - Assert the iframe's `data-mount-id` from Phase 1.5 is unchanged across the drag (the splitter must not re-mount the iframe).

**Definition of done:** All previous phase tests still green; four new tests added and green; sticky header doesn't visually overlap the lab body's first section (verify with a Playwright screenshot at scroll depth 1000px); drag splitter feels responsive at 60fps on a typical 2020-era laptop (no formal benchmark — eyeball test). `npm run lint && npm run typecheck && npm test && npx playwright test` all clean.

**Explicit non-goals (deferred):**
- *Phase 2:* Persisted split fraction. The splitter resets on reload until persistence ships.
- *Phase 5:* Mobile responsive flow (collapse to single-column with stacked sim/worksheet at narrow viewports). PhET isn't usable below ~768px wide regardless.
- *Phase 5:* Pop-out simulation into a separate window.
- *Future, unscheduled:* Multi-sim tab strip when a lab has more than one PhET (currently no lab does).
- *Future, unscheduled:* Full-screen sim mode beyond what dragging the splitter to its 75% extreme already provides.
- *Phase 5:* Design tokens / CSS custom properties for the splitter's color/width. Hardcoded hex values for now.

#### Phase 1.7 — Agent prompt

```
The side-by-side layout is functional but cramped: PhET sims need more
horizontal room than 50% of a 1440px viewport gives them, the layout
toggle scrolls out of reach on long worksheets, and students can't
rebalance the panes when their attention shifts between simulating and
writing. Three fixes, narrowly scoped.

Read REBUILD_SPEC.md Phase 1.7 deliverables (above) and section 5.6 for
the lab page structure. Read src/ui/LabPage.tsx as it stands today —
the iframe-stability fix from Phase 1.5 #5 is in place; do not regress
that. Read src/main.css to find the dead .side-by-side rule that should
be removed alongside this work.

Tasks:

1. Sticky header.
   - src/main.css `.lab-header`: position: sticky; top: 0; z-index: 10;
     background: #fafafa; border-bottom: 1px solid #e0e0e0; max-height
     56px.
   - LabPage.tsx: restructure header into three flex regions (left = back
     link, center = empty slot div with className 'lab-header-slot',
     right = LayoutToggle). Add a comment over the slot div noting that
     Phase 2's save indicator and Phase 3's PDF button mount here.
   - Verify the sticky header does not introduce a stacking-context issue
     with the iframe (use a Playwright screenshot at scroll 1000px).

2. Larger default sim.
   - .lab-layout-side: change grid-template-columns to
     `var(--split-sim, 60%) 8px 1fr`. Default value 60% is the fallback
     when the React state hasn't set it yet.
   - .simulation-frame: bump min-height from 500px to 720px.
   - Delete the obsolete .side-by-side CSS rule. Confirm no component
     references it before removing.

3. Resizable splitter.
   - Create src/ui/layout/SplitHandle.tsx: a focusable, draggable, ARIA-
     compliant vertical separator. Implementation per §3 of the
     deliverables list above. Use pointer events (pointerdown,
     pointermove, pointerup) with setPointerCapture so dragging over the
     iframe doesn't lose tracking. Keyboard support: ArrowLeft/Right ±2%,
     Shift+Arrow ±10%, Home/End to bounds. Clamp 25%–75%.
   - Update useLabStore: add `splitFraction: number` (default 0.6) and
     `setSplitFraction(value: number): void`. Not persisted — leave a
     TODO comment for Phase 2.
   - LabPage.tsx: when layout === 'side', render the split handle between
     the simulation and worksheet sections. Apply the fraction as
     `style={{'--split-sim': `${splitFraction * 100}%`}}` on the
     .lab-layout-side container.
   - When layout === 'tabs', do not render the split handle.

4. Tests per §4 of the deliverables list. Use Playwright's mouse drag
   API (mouse.move + mouse.down/up) for the drag E2E.

5. Run lint, typecheck, vitest, playwright. All clean.

Constraints:
- No new dependencies.
- No persistence (Phase 2 owns it). splitFraction is in-memory only.
- No URL sync for splitFraction (it's per-session UI state).
- The iframe's data-mount-id from Phase 1.5 must not change during a
  drag — the splitter only updates a CSS variable on the parent grid,
  not the iframe's DOM tree.
- Header height ≤ 56px. Center slot empty by design.
- No design tokens, no theme variables beyond the one CSS variable for
  the split fraction. Hardcoded #fafafa, #e0e0e0, etc. consistent with
  Phase 1.6.
- Tabs view is unchanged. Splitter is side-by-side only.

Deliverable: roomier sim, sticky controls that don't disappear on scroll,
drag-to-resize that respects iframe stability and a11y. Four new tests
green; full suite green; no regressions.
```

---

### Phase 2 — Persistence + course/student keying + recovery UX

**Goal:** Students can close the tab and resume. Per-`(course, lab, student)` isolation. Image attachments survive without quota cliffs.

**Deliverables:**
- `src/state/persistence/` — IndexedDB blob store + localStorage JSON store wrapper, exposed as a Zustand middleware.
- Storage key format `lab:${courseId}:${labId}:${studentName}` with explicit migration if studentName changes.
- Quota-error UX: a banner with "Free up storage" listing other labs' attachments by size, with delete buttons.
- Auto-save debounced 250ms; visible "Saved at HH:MM" indicator.
- Lab switch never bleeds data: E2E test fills Lab A, switches to Lab B, asserts Lab B is empty, switches back, asserts Lab A is preserved.
- "Start fresh" button per lab that wipes only that lab's keys.

**Definition of done:** All Phase 1 flows still work, plus persistence. The legacy `<a href>` reload hack is conceptually impossible because state is keyed correctly.

#### Phase 2 — Agent prompt

```
Phase 1 left us with an in-memory lab renderer. Now make it persistent.

Read REBUILD_SPEC.md sections 5.3, 5.8, 3.3, and 3.4. Section 3.4 is the
critical pitfall: the legacy app stored base64 image data URLs inside a JSON
blob in localStorage and silently dropped them on quota overrun. You will not
do that. Images go to IndexedDB; only metadata + scalar fields go to
localStorage.

Tasks:
1. Implement src/state/persistence/idb.ts (use `idb-keyval` for blob KV) and
   src/state/persistence/local.ts (JSON KV).
2. Implement a Zustand persistence middleware that:
   a. Debounces writes by 250ms.
   b. Writes JSON to localStorage under `lab:${courseId}:${labId}:${studentName}`.
   c. Writes blobs to IDB under `img:${courseId}:${labId}:${studentName}:${imageId}`.
   d. Hydrates on store init from both stores.
   e. Surfaces quota errors via store state (`status.lastError`) for UI display.
3. UI: render a "Saved 14:32" timestamp via `aria-live="polite"`. On quota
   error, render a banner that lists other-lab attachments by size with
   per-item delete buttons.
4. UI: add a per-lab "Start fresh" action that clears only that lab's keys
   (both stores) after a confirm dialog.
5. Tests:
   - Vitest: round-trip save → reload → assert state restored.
   - Vitest: simulate localStorage QuotaExceededError → assert banner shown,
     blob writes to IDB still succeeded.
   - Playwright: fill Snell's Law, navigate to a different lab in the
     catalog, assert empty form, navigate back, assert saved values present.
   - Playwright: upload a 3MB image to an ImageUploader section, reload, assert
     image still rendered (proves IDB path works).

Constraints:
- Studentname is the de-facto identity. If it changes, migrate the existing
  keys to the new name (don't strand data).
- No silent data loss on quota error. Always surface.
- Persistence must be unit-testable without a real browser — abstract behind
  the PersistenceAdapter interface from §5.8.

Deliverable: persistence works; lab switching preserves data correctly per
lab; image attachments survive a multi-megabyte payload; tests green.
```

---

### Phase 3 — PDF service (declarative, deterministic, signed)

**Goal:** Replace the html2canvas + jsPDF + setTimeout pipeline with `@react-pdf/renderer` driven by the same schema, plus `pdf-lib` post-processing to embed signed canonical JSON.

**Deliverables:**
- `src/services/pdf/Document.tsx` — `<LabReportPDF lab answers course />` that produces a `<Document>`.
- Section-by-section PDF components mirroring Phase 1 UI sections.
- Charts rendered as `<Svg>` primitives (recompute axes, points, fit overlay from `domain/fit/`). No chart.js in PDF path.
- **Pasted content rendering per §5.9:** italic for clipboard pastes that survive in `text`, dotted underline for autocomplete pastes, one-line note beneath the field for edited-out pastes. Implement a small `attributePastes(text, pastes) → Span[]` utility with unit tests covering the fuzz-tolerant matching.
- **Process Record appendix:** an end-of-document section summarizing per-section active time, keystroke totals, and paste counts (matching the integrity disclosure in §5.13).
- `src/services/integrity/sign.ts` — client wrapper that POSTs canonical JSON to `/api/sign` and returns `{signature, signedAt}`.
- `api/sign.ts` — Vercel serverless function per §5.14 (already scaffolded; this phase wires it in).
- `src/services/pdf/seal.ts` — uses `pdf-lib` to: attach `lab.json` (canonical JSON bytes), set PDF metadata with signature/signedAt, and stamp the visible footer.
- Filename templating from schema, including a short hash prefix in the filename (`SnellsLaw_AustinReaves_2026-04-29_abc12345.pdf`).
- Snapshot test per lab: rendering a fixed `LabAnswers` with an injected fixed `signedAt` produces stable PDF bytes. Round-trip test: extract attached JSON via pdf-lib, parse with Zod, re-canonicalize, recompute HMAC, assert match.

**Definition of done:** "Generate PDF Report" button produces a signed, JSON-bearing PDF without ever mutating the live UI. No `setTimeout`. No layout switch. Deterministic across runs (modulo `signedAt`).

#### Phase 3 — Agent prompt

```
Phase 2 finished persistence. Now replace the legacy PDF pipeline.

Read REBUILD_SPEC.md sections 5.9, 5.13, 5.14, and 3.5. The legacy approach
in physics-labs.up.railway.app/utils/pdfGenerator.js (1531 LOC) used
html2canvas to screenshot the live DOM after sleep(1000) and a layout
switch. You will not do that. PDFs are generated from the same Lab schema
+ LabAnswers state that drives the UI, deterministically, with
@react-pdf/renderer, then post-processed with pdf-lib to embed the
canonical JSON and signature.

Tasks:
1. Add @react-pdf/renderer and pdf-lib. Build src/services/pdf/Document.tsx
   that takes {lab, answers, course, signature, signedAt} and returns a
   <Document>.
2. Build one PDF section component per UI Section kind. Layout intent matches
   the legacy `labPdfConfig.reportSections` from each lab schema (cover sheet
   with student info + signature, then sections in order, with page breaks
   between major parts).
3. Render plot sections as <Svg> with axes, points, and the selected fit
   overlay. The fit math comes from Phase-0-ported `domain/fit/`. Do not
   depend on chart.js for PDF output.
4. Implement attributePastes(text, pastes) — for each PasteEvent, do a
   substring match against the final text with light fuzz tolerance
   (whitespace and punctuation only — do NOT do semantic matching).
   Return a Span[] with kind ∈ {typed, pasted-clipboard, pasted-autocomplete}.
   Unit-test edge cases: paste fully present, paste fully deleted, paste
   partially edited, multiple pastes in one field, overlapping pastes.
5. PDF text rendering uses these spans: italic for pasted-clipboard,
   dotted underline (or distinct color in light mode, distinct shade in
   dark) for pasted-autocomplete, normal weight for typed. Edited-out
   pastes get a one-line note beneath the field with timestamp and the
   first ~60 chars of the original paste.
6. Build a "Process Record" appendix: per-section active time, keystroke
   counts, and per-source paste counts. This must match what the integrity
   agreement (§5.13) tells students will appear.
7. Implement src/services/integrity/sign.ts: client wrapper that POSTs
   canonicalize(answers) to /api/sign and returns {signature, signedAt}.
   Handle network errors gracefully — if signing fails, the user sees a
   clear "Could not sign report (network issue). Try again." dialog and
   the PDF is NOT generated. Don't ship unsigned PDFs.
8. Implement src/services/pdf/seal.ts: takes the react-pdf byte buffer
   plus {canonical, signature, signedAt}, uses pdf-lib to attach
   `lab.json`, set PDF metadata fields, and stamp the visible footer with
   "Signed: {signedAt} — {signature.slice(0,8)}". Returns the final
   sealed PDF Blob.
9. UI: "Generate PDF" button calls sign() → renderPDF() → seal() in
   sequence, with a single Loading state. Triggers a download with the
   schema's filename template (include short hash prefix). No layout
   mutation, no setTimeout.
10. Tests:
    - Snapshot test for Snell's Law with a fixed answers fixture and
      injected fixed signedAt: PDF text extraction matches a committed
      snapshot.
    - Round-trip test: extract attached lab.json from generated PDF via
      pdf-lib, parse with Zod, canonicalize, recompute HMAC against test
      fixture secret, assert match.
    - Mock /api/sign in tests; do not hit the real endpoint.

Constraints:
- Determinism: same {Lab, LabAnswers, signedAt} → same PDF bytes.
- Pasted content rendering must match what students were told would happen
  in the integrity agreement (§5.13). Do not silently change the contract.
- File size: target < 2 MB for a typical Snell's Law PDF; flag if exceeded.

Constraints:
- Determinism: same inputs → same outputs. No clock-dependent values in the
  PDF body other than the cover-sheet "generated on" footer (which can be
  stamped from a clock injected via a test-time fake).
- No DOM screenshotting.
- File size: target < 2 MB for a typical Snell's Law PDF; flag if exceeded.

Deliverable: PDF generation works for Snell's Law; snapshot test green;
visual review by Austin matches legacy intent.
```

---

### Phase 3.5 — Pre-Phase-4 PDF polish (umbrella)

**Goal:** Close six discrete gaps in Phase 3's PDF pipeline before Phase 4 multiplies labs through it. Each sub-phase is independently shippable in a single agent run, touches mostly disjoint files, and leaves test green at the boundary.

**Why this phase exists.** Phase 3 shipped a working PDF pipeline driven by the lab schema, with HMAC signing and JSON attachment. Review against the Snell's Law output and the spec text turned up six concrete bugs and rough edges:

- **Plot fit rendering drops the intercept.** `src/services/pdf/Document.tsx` reads `fit.parameters.a` (slope) and draws a line through `(minX, slope·minX) → (maxX, slope·maxX)`, which forces the line through the origin. Proportional fits render correctly. Linear fits render an offset line that does not match the UI Chart and does not pass through the student's data. Grading integrity issue.
- **No preflight on student name.** "Generate PDF" is reachable with the studentName field empty (or whitespace), producing a PDF anchored on a placeholder name with no record of who submitted it.
- **Filename template is not implemented.** Spec §5.9 calls for `SnellsLaw_AustinReaves_2026-04-29_abc12345.pdf`. Current code (`src/ui/LabPage.tsx`) emits `${lab.id}-${hash}.pdf` → `snellslaw-a1b2c3d4.pdf`.
- **Instruction rendering is not at parity with UI.** The UI uses react-markdown + rehype-sanitize + KaTeX (Phase 1.5). The PDF does `section.html.replace(/<[^>]+>/g, '').replace(/#+\s/g, '')` and dumps the result into a single `<Text>`. TAs see source markdown, not formatted prose.
- **Derived columns hide their formula.** Data table rendering in the PDF treats `input` and `derived` columns identically. TAs auditing whether `sin(θᵢ)` was correctly computed have nothing to anchor on.
- **Process Record appendix is incomplete.** `processRecordForSection` handles fields, multiMeasurement, dataTable, and image (via captionFieldId). It does not handle `equation` or any future section kind that owns user input — those silently render zeros for activity, keystrokes, and pastes.
- **Paste fuzz tolerance is undocumented.** `attributePastes` normalizes whitespace and punctuation, then does literal substring matching. This is the right behavior, but it's an unwritten contract pinned by exactly one test case. Phase 4 will add labs with different prose styles; the boundary needs explicit tests and a documented decision before that multiplies.

**Recommended order:**

1. **Phase 3.5.1** (plot fit rendering) — integrity issue, smallest fix.
2. **Phase 3.5.2** (filename template + student info preflight) — UX issue, blocks meaningful Phase 4 fixture data.
3. **Phase 3.5.4** (derived column formula labels) — schema-touching; lands before Phase 4 starts migrating labs that have derived columns.
4. **Phase 3.5.6** (fuzz tolerance docs/tests) — pins behavior before Phase 4 multiplies prose styles.
5. **Phase 3.5.3** (markdown rendering parity in PDF) — largest change; can run in parallel with the others.
6. **Phase 3.5.5** (Process Record appendix completeness) — smallest audit; can land anywhere.

3.5.1 and 3.5.4 both touch `src/services/pdf/Document.tsx`. Sequence those, or coordinate the merge. The other sub-phases are disjoint at file granularity.

**Explicit non-goals (deferred):**

- Phase 4 lab migration. No new labs migrated in 3.5.
- Phase 5 a11y / perf / telemetry. No tagged-PDF accessibility, no bundle-splitting, no opt-in error reporting.
- Block math (display equations) in PDF instructions. Phase 3.5.3 handles inline math via Unicode substitution; block math is deferred unless and until a lab actually needs it.
- Verification UX (`/api/verify`). §9 open question, separate decision.
- Signing nonce binding. §5.14 explicitly defers this to v1.1.
- Per-lab override for fit displayed precision (sig figs in fit label). Currently default; revisit in Phase 5 if reporting changes.

---

### Phase 3.5.1 — Plot fit rendering: full slope + intercept (integrity fix)

**Goal:** The PDF plot section renders the same fit line as the UI Chart, including non-zero intercepts. A regression test fails the next time a developer drops a parameter.

**Why this phase exists.** `src/services/pdf/Document.tsx` (around line 207) reads only `fit.parameters.a` (slope) and constructs line endpoints as `(minX, slope·minX) → (maxX, slope·maxX)` — implicitly `y = slope · x`. For proportional fits (which `domain/fit/` fits as `y = a·x` with no intercept), this is correct. For linear fits (which return `y = a·x + b`), the line is wrong by exactly `b` everywhere along the x-axis. The UI shows the right line; the PDF shows the wrong one.

There is a related question the agent must answer first: **does the fit ever get persisted into `answers.fits`?** §10's v2 envelope changelog (2026-05-01) added `fits: Record<plotId, FitResultSchema>` to the canonical shape, but `Chart.tsx` may compute fits on-render-only without writing. If so, `answers.fits[plotId]` is undefined at PDF time and the PDF currently draws no line at all (the `slope !== undefined` guard short-circuits). That's a different — and worse — integrity bug than "wrong line": it's "no line where there should be one." Verify the data flow before fixing.

**Deliverables:**

1. **Fit persistence audit.**
   - Locate the UI Chart component (likely `src/ui/primitives/Chart.tsx` or similar). Inspect whether the fit result is written to `useLabStore` when computed.
   - If not: add a `setFitResult(plotId, fitResult)` action to `useLabStore`. Dispatch from Chart in a `useEffect` keyed on the source-table data hash and the selected fit id. Result must conform to `FitResultSchema` (`{kind, parameters: {a, b?}, rSquared?, ...}`).
   - If yes: confirm by reading the store value at PDF time and verifying `parameters.b` is populated for linear fits.

2. **PDF plot rendering uses both slope and intercept.**
   - In `Document.tsx`, replace the `slope`-only computation with `a` and `b` (defaulting `b` to `0` when absent, so proportional fits stay correct).
   - Compute line endpoints as `(minX, a·minX + b)` and `(maxX, a·maxX + b)`.
   - The line's `mapY` clamping must continue to use the actual data range, not the fit's extrapolated range; if the fit extends outside the plotted y-range, clip at the plot bounds rather than letting the SVG line escape the axes.

3. **UI/PDF round-trip regression test.**
   - New test `tests/unit/fitAlignment.test.ts`. Hand-construct an `answers` fixture with a `dataTable` containing 5 points sampled from `y = 2·x + 3` plus small Gaussian noise. Compute the fit via `linearLeastSquares` directly (the canonical truth).
   - Assert two things:
     - The store's `fits[plotId]` after running the UI write path matches the canonical truth to 1e-9 on `parameters.a` and `parameters.b`.
     - The PDF document's rendered SVG line endpoints (extracted from the rendered byte buffer or via a render-tree inspection) match `(minX, a·minX + b)` and `(maxX, a·maxX + b)` to 6 significant figures.
   - Add a second case for a `proportional` fit (`y = 2·x` with no intercept) to confirm that path still renders correctly — guard against regression where a future change forces non-zero intercept on proportional fits.

4. **Snapshot extension.**
   - Add a linear-fit fixture to the existing PDF snapshot suite (don't replace the proportional fixture; add a second). Snapshot test must include the SVG line element so future drift is visible in the diff.

**Definition of done:** existing tests still green; two new fit-alignment tests green; the Snell's Law PDF (which uses Snell's-law-style fits) is visually unchanged for proportional sections and now correct for linear sections; `npm run lint && npm run typecheck && npm test` clean.

#### Phase 3.5.1 — Agent prompt

```
The PDF plot section in src/services/pdf/Document.tsx reads only the
slope parameter from the stored fit and draws the line through the
origin, dropping the intercept. For linear fits with non-zero intercept
this produces a wrong line in the PDF that does not match what the
student saw in the UI Chart. Fix it.

Before fixing the rendering, verify the data flow: does the UI Chart
component actually write the computed fit result into the store at
answers.fits[plotId]? If not, the PDF currently renders no line at all
(the slope !== undefined guard short-circuits), which is a worse bug
than "wrong line." Both cases need fixing.

Read REBUILD_SPEC.md sections 3.5 and 3.5.1, plus 5.9 and §10 (envelope
v2 added the `fits` field to canonical answers). Read these files:
- src/services/pdf/Document.tsx (around line 207, the plot section)
- src/services/math/leastSquares.ts (returns {a, b, rSquared, ...})
- src/state/labStore.ts and the UI Chart component (likely
  src/ui/primitives/Chart.tsx) — find where fits get computed and
  whether they get written.
- src/domain/schema/ for FitResultSchema.

Tasks:
1. Audit fit persistence. If Chart computes on-render-only without
   writing to the store, add a setFitResult(plotId, fitResult) action
   on useLabStore and dispatch it from Chart in a useEffect keyed on
   the source-table data hash and selected fit id. Result must conform
   to FitResultSchema.
2. In Document.tsx, replace the slope-only read with `a` and `b`
   (default `b = 0` for proportional fits / when absent). Compute line
   endpoints as (minX, a*minX + b) and (maxX, a*maxX + b). If the line
   extrapolates outside the plotted y-range, clip at the plot bounds
   rather than letting the SVG line escape.
3. Write tests/unit/fitAlignment.test.ts. Two cases:
   (a) Linear fixture: 5 points from y = 2x + 3 + small noise. Run UI
       write path; assert store fits[plotId] matches linearLeastSquares
       output to 1e-9 on a and b. Render PDF; extract SVG line endpoints;
       assert match to 6 sig figs.
   (b) Proportional fixture: 5 points from y = 2x. Same assertions. Confirms
       proportional path is not regressed by the linear fix.
4. Add a linear-fit case to the existing PDF snapshot suite. Don't replace
   the proportional snapshot; add a second.
5. Run npm run lint && npm run typecheck && npm test. All green.

Constraints:
- Do not change FitResultSchema. The schema already supports {a, b?} per
  envelope v2.
- Do not recompute the fit in the PDF render path. Read it from
  answers.fits. Both UI and PDF must agree on a single canonical computation.
- If the agent finds the fit is recomputed in the PDF currently, that's a
  separate bug worth flagging — report it but do not silently re-architect.
- No DOM screenshotting, no setTimeout, no live-DOM mutation. Phase 3
  invariants stand.
- Keep the existing proportional-fit visual output bit-identical.

Deliverable: PDF fit line matches UI fit line for both linear and
proportional fits on Snell's-Law-shaped fixtures, with regression tests
that fail loudly if either path drops a parameter again.
```

---

### Phase 3.5.2 — Filename template + student info preflight

**Goal:** PDF filenames follow the spec template (`SnellsLaw_AustinReaves_2026-04-29_abc12345.pdf`). PDF generation refuses to proceed when required student info fields are empty, surfacing a clear modal listing what is missing.

**Why this phase exists.** Two related issues:

- The current filename `${lab.id}-${hash}.pdf` (e.g., `snellslaw-a1b2c3d4.pdf`) is unrecognizable to a TA collecting a Canvas drop folder of 90 submissions. The spec example `SnellsLaw_AustinReaves_2026-04-29_abc12345.pdf` packs the four fields a TA actually uses to disambiguate: which lab, which student, which date, which signed copy.
- A student can hit "Generate PDF" with an empty `studentName` field today. The placeholder `studentName: 'Student'` (or whatever the default is in `useLabStore.studentName`) ends up in the PDF metadata, in the cover sheet, and — once Phase 3.5.2 lands the filename template — in the filename itself as `Student_…`. TAs receive anonymous submissions and cannot return them to a roster.

These bundle into one phase because they share the same handler (`generatePdf` in `src/ui/LabPage.tsx`) and the empty-name case is the failure mode the filename template can't handle anyway.

**Deliverables:**

1. **Filename template, exactly defined.**
   - Build via a pure `buildPdfFilename({lab, studentName, signedAt, signature}) → string` utility in `src/services/pdf/filename.ts`.
   - Format: `{LabIdTitleCase}_{StudentNameSanitized}_{YYYY-MM-DD}_{sigPrefix8}.pdf`.
   - **LabIdTitleCase:** derive from `lab.title` (e.g., `"Snell's Law"`) by stripping non-`[A-Za-z0-9]` and concatenating: `SnellsLaw`. Document the choice in a comment. Edge case: if the resulting string is empty (lab.title was all symbols), fall back to `lab.id` verbatim.
   - **StudentNameSanitized:** ASCII TitleCase, letters and digits only. Algorithm: `String.prototype.normalize('NFKD')` → strip combining marks (`/[̀-ͯ]/g`) → split on whitespace and `[-_'`]` → keep `[A-Za-z0-9]` only per chunk → TitleCase each chunk (first char uppercase, rest lowercase) → join. So `"José Müller-Sánchez"` → `"JoseMullerSanchez"`. CJK and other non-Latin scripts get filtered out entirely; if the result is empty, the preflight (deliverable 2) blocks the path before this is reached.
   - **YYYY-MM-DD:** derived from `signedAt` (server-supplied) in UTC. Use `new Date(signedAt).toISOString().slice(0, 10)`. Do not use the client clock.
   - **sigPrefix8:** `signature.slice(0, 8)`. Existing behavior; preserve.
   - Export the function and unit-test edge cases (see deliverable 4).

2. **Student info preflight modal.**
   - Define a `validateStudentInfoForPdf(answers, requiredFields) → {ok: true} | {ok: false, missing: FieldId[]}` utility in `src/services/integrity/preflight.ts`.
   - Required fields for v1: `studentName` (must be non-empty after `.trim()`). Future fields can be added by extending the config; the validator iterates over a list defined in the course manifest or the lab schema's `studentInfo` overrides (per §5.4).
   - In `generatePdf`, run the preflight before `signAnswers`. On failure, open a modal listing the missing fields by their human label (not their fieldId), with an OK button that closes the modal and does not proceed. PDF generation does not start; the signing endpoint is not called.
   - Modal must be accessible: `role="dialog"`, `aria-modal="true"`, focus trapped, ESC closes, focus returned to the "Generate PDF" button on close.

3. **Wire it into `generatePdf`.**
   - `src/ui/LabPage.tsx:99` (`generatePdf` handler): call preflight first; bail with the modal on failure. After signing, build the filename via `buildPdfFilename(...)` instead of the hardcoded template at lines 125-126.
   - Signing must NOT happen on a preflight failure. Don't burn an API call on a request that won't produce a downloadable file.

4. **Tests.**
   - `tests/unit/buildPdfFilename.test.ts`. Cases:
     - Plain ASCII: `"Austin Reaves"` → `AustinReaves`.
     - Diacritics: `"José Müller-Sánchez"` → `JoseMullerSanchez`.
     - CJK only: `"李明"` → `""` (empty); preflight is expected to block this path before filename-build, so the test asserts the function returns the chosen empty-name sentinel (e.g., `"Student"`); document the choice.
     - Mixed: `"Mary O'Brien"` → `MaryOBrien`.
     - Apostrophes/hyphens: `"Anne-Marie"` → `AnneMarie`.
     - Lab title with apostrophe: `"Snell's Law"` → `SnellsLaw` chunk.
     - Date from signedAt = 1714521600000 (a known UTC date) → `2024-05-01`.
   - `tests/unit/preflight.test.ts`. Empty name returns missing; whitespace-only name returns missing; valid name returns ok.
   - Playwright E2E: open Snell's Law without typing a name, click Generate PDF, assert a dialog appears and contains the text "Student name", click OK, assert no PDF was downloaded. Then type a name, click Generate again, assert PDF download fires.

**Definition of done:** filename matches spec exactly; PDF cannot be generated with an empty student name; modal is accessible; new tests green; existing tests still green.

#### Phase 3.5.2 — Agent prompt

```
The PDF filename today is `${lab.id}-${signature.slice(0,8)}.pdf` and
PDF generation is reachable with an empty student name. Both ship in
Phase 3.5.2.

Read REBUILD_SPEC.md sections 3.5 and 3.5.2 plus §5.9 (filename) and
§5.4 (studentInfo). Read these files:
- src/ui/LabPage.tsx (around line 99 — generatePdf handler; lines
  125-126 — current filename construction)
- src/state/labStore.ts (studentName field, setStudentName)
- src/services/integrity/sign.ts (signAnswers; do not call before
  preflight passes)
- src/domain/schema/ (Lab, studentInfo type if present)

Tasks:
1. Create src/services/pdf/filename.ts exporting
   buildPdfFilename({lab, studentName, signedAt, signature}). Implement
   exactly per Phase 3.5.2 deliverable 1: ASCII TitleCase student name
   via NFKD-strip-combining-marks + chunk on whitespace/punct + keep
   [A-Za-z0-9]; TitleCase lab.title; YYYY-MM-DD from signedAt in UTC;
   8-char signature prefix. Empty student-name result returns a sentinel
   like 'Student' (and is expected to be unreachable in production once
   preflight is wired up — but keep it defensive).
2. Create src/services/integrity/preflight.ts exporting
   validateStudentInfoForPdf(answers, requiredFields = ['studentName']).
   Returns {ok, missing}. Trim() before non-empty check.
3. Build a modal component in src/ui/StudentInfoPreflightDialog.tsx.
   role="dialog", aria-modal, focus trap, ESC closes, focus returns
   to the Generate PDF button on close. Renders the human-readable
   labels of missing fields (use a label map keyed by fieldId).
4. Edit src/ui/LabPage.tsx generatePdf:
   - Call validateStudentInfoForPdf first.
   - On failure, open the modal and return without calling
     signAnswers / renderPDF / sealPDF.
   - On success, proceed as today; replace the lab.id-hash filename
     with buildPdfFilename(...).
5. Tests:
   - tests/unit/buildPdfFilename.test.ts: ASCII, diacritics, CJK-only,
     apostrophes, hyphens, lab title with apostrophe, date from a
     fixed signedAt epoch.
   - tests/unit/preflight.test.ts: empty, whitespace, valid name.
   - tests/e2e/pdfPreflight.spec.ts: open Snell's Law, do not type a
     name, click Generate PDF, assert dialog appears with "Student
     name" text, click OK, assert no download. Then type a name,
     click Generate, assert download fires.
6. npm run lint && npm run typecheck && npm test && npx playwright test.
   All green.

Constraints:
- Do not call /api/sign on a preflight failure. Don't burn the round trip.
- signedAt continues to come from the signing response (server clock).
  Do NOT format the filename date from Date.now() on the client.
- Modal must be keyboard-accessible. No "X" button without ESC support.
  Don't trap focus by hiding the close button.
- Filename sanitization is pure and synchronous — no async, no I/O.
- buildPdfFilename does not mutate inputs.
- Sanitization keeps digits: `"M. Curie III"` → `"MCurieIII"`. Confirm
  in the test fixtures.

Deliverable: filename template per spec; empty-name PDF generation
blocked by an accessible preflight modal; tests green; the next time
someone tries to Generate PDF with an empty name, they see exactly
which field is missing.
```

---

### Phase 3.5.3 — Markdown rendering parity in PDF

**Goal:** Instructions in the PDF render with the same formatting the student saw in the UI (headers, bold/italic, lists, inline code, inline math), via a deterministic markdown→@react-pdf primitives pipeline. No regex stripping. No `dangerouslySetInnerHTML`. No live-DOM screenshotting.

**Why this phase exists.** The UI runs `section.html` through react-markdown + remark-gfm + remark-math + rehype-katex + rehype-sanitize (Phase 1.5). The PDF currently does:

```tsx
<Text>{section.html.replace(/<[^>]+>/g, '').replace(/#+\s/g, '')}</Text>
```

A line like `## Part 1: Snell's Law` renders in the UI as a level-2 heading. In the PDF it renders as plain `Part 1: Snell's Law` — no font-size differentiation, no bold, no separation from surrounding prose. Bold text loses its emphasis. Lists become run-together sentences. Inline math (`$\sin\theta_i$`) becomes literal source `\sin\theta_i`. The TA grading the PDF cannot tell the structure of the instruction the student was given.

**Approach.** Parse the markdown source via `unified` + `remark-parse` + `remark-gfm` + `remark-math` to an mdast tree, then walk the tree and emit `@react-pdf/renderer` primitives directly. No HTML intermediate. No JSX-from-string runtime. KaTeX is the hardest piece — `@react-pdf` does not natively render math; render LaTeX source through a Unicode substitution table for the common operators encountered in physics labs (`\sin`, `\cos`, `\tan`, `\theta`, `\phi`, `\pi`, `\alpha`, `\beta`, sub/sup, `\le`/`\ge`, `\cdot`, `\times`, `\frac{a}{b}` → `(a)/(b)`). Block math is deferred. Document the limitation.

**Deliverables:**

1. **Markdown→react-pdf renderer.**
   - New module `src/services/pdf/markdown/`. Exports `renderMarkdownToPdf(markdownSource: string): React.ReactNode[]` returning a list of `@react-pdf` `<View>`/`<Text>` nodes.
   - Implementation:
     - Parse with `unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(...)`.
     - Walk the mdast tree. For each node kind, emit the corresponding @react-pdf primitive with appropriate styles. Mapping:
       - `paragraph` → `<Text>` block with default body style
       - `heading` (depth 1–6) → `<Text>` with size scaled per depth (e.g., 18 / 14 / 12 / 11 / 10 / 10 pt) and `marginTop`/`marginBottom`
       - `strong` → nested `<Text style={{fontWeight: 700}}>`
       - `emphasis` → nested `<Text style={{fontStyle: 'italic'}}>`
       - `inlineCode` → nested `<Text style={{fontFamily: 'Courier'}}>`
       - `code` (block) → `<View>` wrapping `<Text style={{fontFamily: 'Courier', backgroundColor: '#f5f5f5', padding: 4}}>`
       - `list` (ordered) → `<View>` containing `<Text>{i+1}. {item}</Text>` per item
       - `list` (unordered) → `<View>` containing `<Text>• {item}</Text>` per item
       - `listItem` → recurse into children with the bullet/number prefix
       - `link` → `<Text>` showing the URL inline (PDFs can't have hover; show URL in parens after the link text: `[label](url)` → `label (url)`)
       - `inlineMath` → `<Text>` with the LaTeX source after running through `latexToUnicode(value)` (deliverable 2)
       - `math` (block) → `<Text>` with the LaTeX source as monospace, with a one-time `console.warn` in dev that block math is not yet rendered visually
       - `thematicBreak` → `<View style={{borderBottomWidth: 0.5, borderBottomColor: '#999', marginVertical: 6}} />`
       - `blockquote` → `<View style={{borderLeftWidth: 1.5, borderLeftColor: '#999', paddingLeft: 6}}>` recurse
       - `table` (gfm) → simple PDF table; columns auto-width
       - `text` → `<Text>{value}</Text>`
   - Determinism: same markdown source → identical primitive tree across runs.

2. **`latexToUnicode` substitution.**
   - Module `src/services/pdf/markdown/latexToUnicode.ts`. Maps LaTeX commands common in physics-lab prose to Unicode glyphs:
     - Greek: `\theta` → θ, `\phi` → φ, `\alpha` → α, `\beta` → β, `\gamma` → γ, `\delta` → δ, `\lambda` → λ, `\mu` → μ, `\pi` → π, `\rho` → ρ, `\sigma` → σ, `\omega` → ω, `\Theta` → Θ, etc.
     - Operators: `\sin` → sin, `\cos` → cos, `\tan` → tan, `\log` → log, `\ln` → ln, `\sqrt{x}` → √(x), `\cdot` → ·, `\times` → ×, `\div` → ÷, `\pm` → ±, `\le` → ≤, `\ge` → ≥, `\ne` → ≠, `\approx` → ≈, `\to` → →, `\propto` → ∝.
     - Sub/sup: `_{...}` and `^{...}` map to Unicode subscript/superscript when characters are in the Unicode subscript/superscript blocks; otherwise pass through as `_x` / `^x` literally and add a one-time dev warning.
     - Fractions: `\frac{a}{b}` → `(a)/(b)`. Yes, ugly. The alternative is a second pass that emits a fraction layout via `@react-pdf` — defer to a later phase.
     - Anything not in the table passes through verbatim. No silent dropping.
   - Unit-test against a corpus pulled from current Snell's Law instructions plus a synthetic adversarial fixture (`\unknown_command`, deeply nested sub/sup, malformed braces).

3. **Hostile-input safety.**
   - Sanitization happens upstream of markdown parsing in the UI (rehype-sanitize). The PDF pipeline does not parse HTML at all — it parses markdown source — so the script-tag attack surface is closed by construction. **Verify this by adding a unit test:** input `'<script>alert(1)</script>'` as `section.html`; assert the rendered primitive tree contains no script-like content (it should render the literal text `<script>alert(1)</script>` as paragraph text, since markdown's HTML embed is allowed but `@react-pdf` doesn't execute scripts). If the test reveals that remark is interpreting embedded HTML, configure remark-parse to disallow HTML or strip it before rendering.

4. **Wire into Document.tsx.**
   - Replace the regex-replace `<Text>` at the instructions branch (around line 130) with `<View>{renderMarkdownToPdf(section.html)}</View>`.
   - The `instructions` section title (`<Text style={styles.sectionTitle}>Instructions</Text>`) stays as-is for now; it's a section heading the renderer doesn't need to produce.

5. **Tests.**
   - `tests/unit/markdownToPdf.test.ts`. Cases:
     - Header `## Part 1` → primitive tree contains a Text with size 14 and the value "Part 1".
     - `**bold**` → Text with fontWeight 700.
     - Unordered list with three items → View containing three Texts each starting with "• ".
     - Inline math `$\sin\theta_i$` → Text containing "sin θ_i" (or the chosen sub-script form).
     - Hostile fixture `<script>alert(1)</script>` → tree contains the literal string but no executable element; whatever a "script-like" primitive would be (there isn't one in @react-pdf, so this is mainly about confirming the parser doesn't crash).
   - `tests/unit/latexToUnicode.test.ts`. Greek letter map, operator map, simple sub/sup, fraction fallback, unknown-command pass-through.
   - PDF snapshot test extension: add an instructions block with a header, bold, list, and inline math to the Snell's Law fixture; assert the snapshot includes the rendered primitives at the expected positions. Snapshot must be human-readable (text content extracted, not byte-for-byte) so future drift is reviewable.

**Definition of done:** TA opening the Snell's Law PDF sees `## Part 1: Snell's Law` as a sized header, not source text. Bold is bold, lists have bullets, inline math uses Greek letters where defined. No regex stripping anywhere in the PDF instruction path. Hostile fixture neither crashes nor injects content. New tests green; existing tests still green.

**Explicit non-goals (deferred):**
- Block math (`$$...$$`) visual rendering. Falls back to monospace LaTeX source with a dev warning. Real KaTeX-to-SVG embedding is a future phase if and when a lab actually needs it.
- Custom @react-pdf fonts beyond the built-ins (Helvetica, Times-Roman, Courier). Phase 5 owns typography.
- Image rendering inside markdown (`![alt](url)`). Defer until a lab needs it; raise an explicit `not yet supported` warning.

#### Phase 3.5.3 — Agent prompt

```
The PDF instruction renderer in src/services/pdf/Document.tsx today
strips HTML tags and `#` characters with regex and dumps the rest into
a single <Text>. Replace this with a real markdown→@react-pdf pipeline.
Achieve formatting parity with the UI's react-markdown rendering for
headers, bold/italic, lists, inline code, links, and inline math.

Read REBUILD_SPEC.md sections 3.5 and 3.5.3 plus the Phase 1.5 markdown
notes (around §5.4 and Phase 1.5 deliverable 2). Read these files:
- src/services/pdf/Document.tsx (around line 130 — the instructions branch)
- src/ui/sections/InstructionsSectionView.tsx (the UI pipeline; reference
  for sanitization schema)
- src/content/labs/snellsLaw.lab.ts (real instruction blocks to test against)

Tasks:
1. Add deps if not present: unified, remark-parse, remark-gfm, remark-math.
   (Likely already in package.json from Phase 1.5; confirm and reuse.)
2. Create src/services/pdf/markdown/renderMarkdownToPdf.ts. Parse with
   unified+remark to mdast, walk, emit @react-pdf primitives per the
   mapping in Phase 3.5.3 deliverable 1. Determinism: pure function,
   same input → same primitive tree.
3. Create src/services/pdf/markdown/latexToUnicode.ts. Implement the
   Greek-letter, operator, and sub/sup substitution table per
   deliverable 2. Unknown commands pass through verbatim with a
   single dev console.warn (not per-occurrence).
4. Replace the Document.tsx instructions branch with
   <View>{renderMarkdownToPdf(section.html)}</View>. The section title
   <Text> stays.
5. Tests:
   - tests/unit/markdownToPdf.test.ts: header sizing, bold, list bullets,
     inline math substitution, hostile <script> fixture (must not crash;
     literal text okay).
   - tests/unit/latexToUnicode.test.ts: Greek letters, operators,
     sub/sup, \frac fallback, unknown-command pass-through.
   - Extend the Snell's Law PDF snapshot with an instructions block
     containing all the above; commit a text-based snapshot, not a
     byte-for-byte diff.
6. npm run lint && npm run typecheck && npm test. All green.

Constraints:
- No DOM. The PDF render path stays purely functional; no document/window.
- No HTML parsing. Markdown source goes straight to mdast.
- Block math is NOT visually rendered. Falls back to monospace LaTeX
  source with one dev warning. Document this in a comment in
  renderMarkdownToPdf.ts.
- No new fonts beyond @react-pdf built-ins (Helvetica, Times-Roman,
  Courier). Phase 5 owns typography.
- Determinism is a hard requirement: no Date.now(), no Math.random().
- Bundle: this should not pull in react-markdown. The PDF path uses
  remark directly; react-markdown is the UI's wrapper. If they happen
  to share remark, fine; if you need a separate dependency, prefer
  reusing what's already there.
- Do not parse `section.html` as HTML — it's misnamed; it's actually
  markdown source per Phase 1.5. Confirm by reading
  InstructionsSectionView.tsx.

Deliverable: Snell's Law PDF instructions render with sized headers,
bold/italic, list bullets, and inline-math Unicode glyphs. No regex
stripping. Tests green. The TA sees structure, not source.
```

---

### Phase 3.5.4 — Derived column formula labels

**Goal:** TAs auditing a PDF can see, at a glance, which table columns are derived and what their formula is, without opening the schema source. Authors get one optional string per derived column.

**Why this phase exists.** The schema's `Column` discriminated union has `kind: 'derived'` columns with a JS `formula` function. The function is canonical truth — but it's also opaque to humans. TAs reviewing a Snell's Law PDF see `sin θ` as a column header and a list of numbers, with no indication that the values were computed (rather than entered) and no record of what formula produced them. If a derived column's formula has a bug, every student's PDF carries the wrong values silently.

`Function.prototype.toString()` is not a workable substitute: it leaks variable names, parentheses, and `Math.sin(row.thetaIncidence * Math.PI / 180)` instead of a clean `sin(θᵢ)`. The right fix is a small schema addition: `formulaLabel?: string` on derived columns, populated by the lab author with the human-readable formula they want TAs to see.

**Deliverables:**

1. **Schema addition.**
   - In the `Column` discriminated union (likely `src/domain/schema/lab.ts` or similar), add `formulaLabel?: string` to the `derived` variant.
   - Update the Zod schema accordingly: `.optional()`.
   - Update TS types (`z.infer` will pick up the change automatically).
   - **Not** an envelope bump. This is the *authoring* schema (Lab), not the *answers* schema (LabAnswers). Canonicalization is unaffected.

2. **UI table header rendering.**
   - In the data-table section component (likely `src/ui/sections/DataTableSectionView.tsx` or wherever the table primitive renders headers), under the column label, render the `formulaLabel` as a small caption when present. Use a `<small>` or styled `<span>` with reduced font size and `aria-label` exposing the formula to screen readers (e.g., `aria-label="sin theta_i, derived column"`).
   - Don't render anything when `formulaLabel` is absent — backward compatibility.

3. **PDF table header rendering.**
   - In `Document.tsx`'s `dataTable` branch (around lines 167-184), when rendering the header row, if a column is `derived` and has `formulaLabel`, render the label text below the column label in a smaller font size. Layout: stack the column label and the formula label vertically inside the same `<View>` as the cell.
   - Style: column label at `fontSize: 10` (same as today); formula label at `fontSize: 8`, color `#555`. Italic optional.

4. **Migrate Snell's Law derived columns.**
   - In `src/content/labs/snellsLaw.lab.ts`, populate `formulaLabel` on every derived column. Examples:
     - `sin(θᵢ)` for the incidence-sine column
     - `sin(θᵣ)` for the refraction-sine column
     - `sin(θᵢ) / sin(θᵣ)` if there's a ratio column
   - Use the actual variable names (`θᵢ`, `θᵣ`) the instructions use, not the schema's internal column ids.

5. **Tests.**
   - `tests/unit/derivedColumnLabel.test.ts`: schema parse with and without `formulaLabel`; both succeed.
   - PDF snapshot extension: assert the formula label appears under the column label in the snapshot's text extraction.
   - Component test for the UI: render a data table with one derived column with `formulaLabel`, assert the label appears in the DOM with the expected ARIA attributes.

**Definition of done:** schema accepts `formulaLabel` on derived columns; Snell's Law PDF and UI both show `sin(θᵢ)` (or equivalent) under the column header; unlabeled derived columns continue to render exactly as today; tests green.

**Explicit non-goals:**
- Auto-extracting the formula label from the JS function. That's what we're avoiding.
- Rendering the formula in math typesetting (KaTeX). Phase 5 / future. The label is a string.

#### Phase 3.5.4 — Agent prompt

```
Add an optional `formulaLabel` string to derived columns and surface it
in both the UI and PDF table headers. Schema-touching, but
forward-compatible (LabAnswers envelope is unaffected).

Read REBUILD_SPEC.md sections 3.5 and 3.5.4 plus §5.4 (Column type).
Read these files:
- src/domain/schema/lab.ts (or wherever Column is declared) — find the
  derived variant.
- src/services/pdf/Document.tsx (around lines 167-184 — the dataTable
  branch and header row).
- The UI data-table section component (likely
  src/ui/sections/DataTableSectionView.tsx; locate it).
- src/content/labs/snellsLaw.lab.ts (derived columns to populate).

Tasks:
1. Schema: add `formulaLabel: z.string().optional()` to the derived
   Column variant. Update the TS type via z.infer (should be automatic).
   Confirm no other code path requires the field.
2. PDF (Document.tsx, dataTable branch): when rendering the header row,
   if a column is `derived` and has `formulaLabel`, stack the formula
   label under the column label in a smaller font (size 8, color #555).
   Use a vertical <View> wrapper inside the existing cell <Text>'s
   container. Don't disturb input-column rendering.
3. UI: in the data-table section component, render the formulaLabel as
   a <small> under the column header when present, with
   aria-label="<formulaLabel>, derived column".
4. Migrate snellsLaw.lab.ts: populate formulaLabel on every derived
   column with a human-readable formula in the variable names the
   instructions use (e.g., `sin(θᵢ)`, `sin(θᵣ)`, ratios). If unsure
   about a column, leave it absent — backward compat.
5. Tests:
   - tests/unit/derivedColumnLabel.test.ts: schema parses with and
     without formulaLabel.
   - Extend the PDF snapshot test for snellsLaw to include the
     derived-column label in the extracted text.
   - Component test: mount a data table with one labeled derived
     column, assert label and aria-label appear in DOM.
6. npm run lint && npm run typecheck && npm test. All green.

Constraints:
- formulaLabel is a free-form string. Do NOT parse it as LaTeX or HTML.
  Render verbatim.
- Backward compat: derived columns without formulaLabel must continue
  to render exactly as today.
- LabAnswers envelope is NOT affected. Do not bump schemaVersion.
  Canonicalization is unchanged.
- Don't auto-derive the label from the formula function via toString().
  The whole point is that the schema gives authors explicit control.

Deliverable: Snell's Law PDF and UI both show formula labels under
derived-column headers. Migration applies to snellsLaw only in this
phase; Phase 4 will populate formulaLabel on the other labs as they
migrate.
```

---

### Phase 3.5.5 — Process Record appendix completeness

**Goal:** The Process Record appendix renders correct activity data for every section kind that owns user input — including `equation` sections and any future kind. Currently `equation` silently renders zeros.

**Why this phase exists.** `processRecordForSection` in `Document.tsx` (around lines 96-127) enumerates field IDs by section kind:

```ts
if (section.kind === 'objective' || section.kind === 'measurement' || ...) {
  fieldIds.push(section.fieldId);
} else if (section.kind === 'multiMeasurement') { ... }
else if (section.kind === 'image') { fieldIds.push(section.captionFieldId); }
else if (section.kind === 'dataTable') { ... }
```

There is no branch for `equation`. Equation sections own a math-input field whose `FieldValue.meta` is captured by the same `markFieldActivity` instrumentation as text inputs (per Phase 1.5 #4) — the data is there, but the appendix doesn't read it. The appendix renders `Active time (ms): 0`, `Keystrokes: 0`, etc., for any section using mathlive. A TA looking at the appendix to confirm a student spent meaningful time on a derivation sees a misleading zero.

**Deliverables:**

1. **Equation section support.**
   - Add an `equation` branch to `processRecordForSection` that pushes `section.fieldId` (assuming the schema field is named `fieldId` per the calculation/concept pattern — verify against the schema).
   - If the equation section schema uses a different field-id convention, adapt accordingly. Document the chosen mapping with a comment.

2. **Section-kind exhaustiveness.**
   - Replace the if/else chain with a `switch` on `section.kind` that includes all current section kinds *and* a `default` clause that triggers a TypeScript exhaustiveness check via `never`: if a future Phase adds a new section kind without updating this switch, the type system flags the omission.
   - Pattern: `const _exhaustive: never = section;` in the default clause (TS will fail compilation if the discriminated union is incomplete).

3. **Plot section auditing.**
   - Plot sections own no fields directly — they read from `sourceTableId`. The appendix should report `0` for plots, but make this explicit in code (a branch that returns the empty record with a comment) rather than letting plots fall through silently. Improves auditability of the audit code.

4. **Image section: keep existing behavior.**
   - Caption field already counted via `captionFieldId`. Confirm; do not regress.

5. **Tests.**
   - `tests/unit/processRecord.test.ts`. Cases:
     - `equation` section with non-zero `meta` → appendix reports the values.
     - All section kinds (objective, measurement, multiMeasurement, dataTable, image, plot, equation, instructions) produce a record with the expected shape; instructions and plot may be zero, but they don't crash.
     - Adding a synthetic 9th kind to the union (in a test-only schema fork) should fail TypeScript compilation — assert this via a `// @ts-expect-error` line on the deliberately broken switch.

**Definition of done:** Process Record appendix renders correct activity data for equation sections; TypeScript catches missing branches at compile time; tests green.

#### Phase 3.5.5 — Agent prompt

```
The Process Record appendix in src/services/pdf/Document.tsx silently
renders zeros for equation sections because processRecordForSection
has no branch for `kind: 'equation'`. Fix that and also harden the
function against future omissions.

Read REBUILD_SPEC.md sections 3.5 and 3.5.5 plus §5.13 (process
telemetry). Read these files:
- src/services/pdf/Document.tsx (around lines 96-127, processRecordForSection)
- src/domain/schema/ (find the Section discriminated union and the
  equation variant)

Tasks:
1. Replace the if/else chain in processRecordForSection with a
   `switch (section.kind)`. Include every current variant. Add an
   `equation` branch that pushes the equation section's field id.
2. Plot and instructions branches: explicit return of an empty record,
   not an implicit fall-through. Comment why (no fields owned).
3. default branch: TypeScript exhaustiveness via `const _: never =
   section;`. This forces compilation to fail when Phase 4+ adds a new
   Section kind without updating the appendix.
4. Tests: tests/unit/processRecord.test.ts. Assert non-zero values for
   equation, the right shape for every kind, and a deliberate
   exhaustiveness test (// @ts-expect-error on a broken switch).
5. npm run lint && npm run typecheck && npm test. All green.

Constraints:
- Do not change the FieldValue capture layer. The bug is purely in
  what the appendix reads, not in what gets recorded.
- Keep backward compat: caption field path for image sections still
  works.
- Do not introduce new section kinds in this phase. That's Phase 4+.

Deliverable: equation sections report real activity in the appendix;
TypeScript prevents future regressions; tests green.
```

---

### Phase 3.5.6 — Paste-attribution fuzz tolerance: pin and document

**Goal:** Pin the current `attributePastes` matching behavior with explicit boundary tests, and document the design choice so future contributors know why this implementation was chosen over Levenshtein/LCS upgrades. No behavior change.

**Why this phase exists.** `attributePastes` in `src/services/pdf/attributePastes.ts` normalizes input by stripping whitespace and a defined set of soft punctuation (`/[\s.,;:!?'"`~\-_()[\]{}\\/|<>+=*]/`), lowercases, then does literal `String.prototype.indexOf` substring matching. It's binary: paste either appears as a contiguous normalized substring of the final text, or it doesn't. There is no edit-distance or LCS fallback.

This is the right behavior for v1. False negatives are tolerable (an edited paste loses inline italics but is still summarized in the Process Record appendix). False positives are not (typed text being marked as pasted is a grading integrity reversal). LCS-ratio and Levenshtein matching would catch more edited pastes inline but introduce a real false-positive risk on short pastes — a 5-char paste of `"1.33"` would LCS-match almost any sentence containing those digits.

But the design call is undocumented. Exactly one test pins exactly one normalization case. Phase 4 will add labs with different prose styles, and it's worth nailing down the boundaries before that multiplies. If a future contributor wants to upgrade matching, they should know what tradeoffs they are reversing.

**Deliverables:**

1. **Header comment.**
   - Top of `src/services/pdf/attributePastes.ts` gets a 6–10 line block comment stating:
     - The matching strategy (normalize + literal substring, no edit distance).
     - Why this strategy was chosen (false negatives tolerable, false positives not — Process Record appendix is the safety net).
     - Alternatives considered (LCS-ratio, Levenshtein) and why rejected (false-positive risk on short pastes).
     - A note that future upgrades require revisiting these tradeoffs and updating the test fixtures.

2. **Boundary tests.**
   - `tests/unit/attributePastes.test.ts` extension. Add cases:
     - **Paste fully present, no edits:** `"sin theta = n"` pasted into final text `"sin theta = n"` → matches, single pasted-clipboard span.
     - **Paste fully present with surrounding typed text:** paste `"1.33"` into final text `"The index of refraction is 1.33 for water"` → `"1.33"` italicized, rest typed.
     - **Paste with whitespace edits only:** paste `"sin theta"` matches final `"sin  theta"` (extra space) or `"sin theta."` (trailing punct).
     - **Paste fully deleted:** paste `"the answer is 42"` typed, then deleted (final text contains nothing of it) → no inline match; appears in `removedPastes` summary.
     - **Paste partially edited (word inserted mid-paste):** paste `"the index of refraction"` then student inserts `"approximately"` mid-paste making final text `"the index of approximately refraction"` → no inline match (substring fails), appears in `removedPastes` summary.
     - **Paste partially deleted (suffix removed):** paste `"the answer is 42 plus seven"`, student deletes `" plus seven"` → final text contains `"the answer is 42"`. Substring match requires the *entire* paste to appear, so this is a no-match → goes to removedPastes. Pin this current behavior.
     - **Multiple pastes in one field:** pastes `"first part"` and `"second part"` both matched in final text containing both.
     - **Pastes overlapping in normalized form:** pastes `"abc def"` and `"def ghi"` — both match if both appear; document the rendering behavior (which span wins on overlap).
     - **Empty paste (zero-length after normalization, e.g., pure punctuation paste):** does not produce a span. Pin this so a `","` paste doesn't claim 100% of the field.
     - **Unicode paste:** `"José"` pasted, final text contains `"jose"` (lowercase) → matches because normalize lowercases. Pin this.
     - **Autocomplete-source paste vs clipboard-source paste:** assert spans get the right `kind` per source.

3. **Decision-log entry.**
   - Add a brief `docs/decisions/0001-paste-fuzz-tolerance.md` if the repo has an ADR convention; otherwise add the rationale as a section in `docs/AUTHORING_A_LAB.md` or in the file header comment from deliverable 1. The agent should ask Austin where this should live before creating a separate file.

**Definition of done:** behavior unchanged; header comment present; ten or so new boundary tests pin the matching cases; future contributors who consider upgrading know exactly which tests they need to update and why; `npm run lint && npm run typecheck && npm test` clean.

#### Phase 3.5.6 — Agent prompt

```
attributePastes uses normalize-then-substring matching with no edit
distance. This is the right v1 behavior, but it's undocumented and
pinned by exactly one test case. Document the design call and add
boundary tests so Phase 4's lab additions don't accidentally drift
the behavior.

No code behavior change. Pure docs + tests.

Read REBUILD_SPEC.md sections 3.5 and 3.5.6, plus §5.9 (pasted content
rendering) and §5.13 (process telemetry). Read these files:
- src/services/pdf/attributePastes.ts (current implementation)
- tests/unit/attributePastes.test.ts (existing tests)

Tasks:
1. Add a 6–10 line header comment to attributePastes.ts per Phase 3.5.6
   deliverable 1. State the strategy, why it was chosen, what
   alternatives were rejected, and a note that future upgrades must
   revisit the tradeoffs.
2. Extend tests/unit/attributePastes.test.ts with the 10–11 boundary
   cases listed in deliverable 2. Each case asserts the exact behavior
   currently produced — this pins, doesn't change.
3. Ask Austin: does the repo have an ADR convention (e.g., docs/decisions/)?
   If yes, write a one-page ADR with the same rationale. If no, skip
   the separate file; the header comment is sufficient.
4. npm run lint && npm run typecheck && npm test. All green. No source
   behavior changed.

Constraints:
- DO NOT change attributePastes runtime behavior. This phase is
  documentation and test pinning only.
- If a test case reveals unexpected current behavior (e.g., empty paste
  claims a span, or overlapping pastes do something surprising),
  document the surprise but DO NOT fix it in this phase. File a
  follow-up note for Austin to triage.
- Do not introduce edit distance, LCS, or any other matching strategy.
  That's a future phase if and when called for.

Deliverable: attributePastes.ts is documented; tests pin every
boundary case from the deliverables list; no behavior change. Phase 4
can multiply labs without ambiguity about what attributePastes will do
to their prose.
```

---

### Phase 4 — Migrate remaining labs + course manifest finalization

**Goal:** All 7 distinct labs (`staticElectricity`, `chargesFields`, `capacitors`, `dcCircuits`, `magneticFieldFaraday`, `snellsLaw`, `geometricOptics`) live as schemas. Both `general` and `phy114` courses are real. Drift between `labs/` and `phy_114/` is explicitly resolved.

**Deliverables:**
- 6 more `*.lab.ts` files migrated from legacy.
- Resolution document: a short markdown listing every place the two duplicate trees diverged, with a chosen canonical version for each.
- Both courses fully populated; phy114 has the lab-numbering and access gating from the legacy `LAB_ACCESS_CONFIG`.
- Per-lab snapshot PDF tests.
- One Playwright E2E per lab: open, fill in a deterministic fixture, generate PDF, assert text snapshot.

**Definition of done:** Feature parity with legacy for content. Legacy `physics-labs.up.railway.app` folder can be deleted once Austin signs off.

#### Phase 4 — Agent prompt

```
Phase 3 finished the PDF service. Now migrate the rest of the labs.

Read REBUILD_SPEC.md section 4.1 (salvage-as-content) and section 5.5
(course manifest). Source content is at
physics-labs.up.railway.app/labs/<id>/{labConfig.js, LabReportForm.js} and
physics-labs.up.railway.app/phy_114/<id>/{labConfig.js, LabReportForm.js}.

Tasks:
1. For each lab id (staticElectricity, chargesFields, capacitors, dcCircuits,
   magneticFieldFaraday, geometricOptics):
   a. Diff the legacy `labs/<id>` against `phy_114/<id>` using `diff -u`.
   b. Document every divergence in MIGRATION_NOTES.md under a section for
      that lab. For each divergence, propose a canonical version and ask
      Austin to confirm BEFORE migrating.
   c. After confirmation, write a single src/content/labs/<id>.lab.ts that
      faithfully encodes the canonical content per the Phase 0 schema.
   d. Add unit tests asserting the schema parses and derived-column formulas
      compute correctly for a fixture row.
   e. Add a Playwright E2E that fills a deterministic fixture and snapshots
      the PDF text.
2. Update content/courses/general.course.ts and phy114.course.ts to reference
   all migrated labs, with PHY 114's access config (lab numbers, enabled
   flags from legacy `LAB_ACCESS_CONFIG`).
3. If a lab needs PHY-114-specific tweaks, encode them as schema overrides in
   the course manifest, NOT as a duplicate lab file.
4. Delete `scripts/migrate-from-legacy.ts` if no longer needed (or keep as
   reference under `scripts/legacy/`).

Constraints:
- Do not assume the two duplicate trees agree. They drift. Always diff.
- Block on Austin's confirmation for every divergence. Ambiguity here is the
  difference between correct physics instruction and a wrong answer key.
- Magnetic Field & Faraday's Law exists in `labs/` only; Geometric Optics
  exists in `phy_114/` only. These are NOT cross-course duplicates — handle
  them once each.

Deliverable: all labs migrated; MIGRATION_NOTES.md committed; per-lab tests
green; legacy folder ready to delete.
```

---

### Phase 5 — A11y, perf, telemetry, and cleanup

**Goal:** Production-quality polish. Bundle, accessibility, error reporting, and the cosmetic items that the legacy app had as half-measures.

**Deliverables:**
- Lighthouse 95+ on Performance, Accessibility, Best Practices on a representative lab page.
- axe-core zero-violation pass in CI.
- Bundle analyzer report; mathjs and mathlive split into async chunks.
- Opt-in telemetry: an `errorReporter` that sends `{labId, sectionId, error.message, error.stack}` to a configured endpoint. Off by default; configurable per course manifest.
- Validated `postMessage` to parent: only emits if `parentOrigin` matches the course's allow-list.
- README, CONTRIBUTING, and a one-page "Authoring a new lab" doc that gets a non-coding TA from zero to a working lab schema.

#### Phase 5 — Agent prompt

```
All labs are migrated. Now polish.

Tasks:
1. Run axe-core in Vitest + Playwright. Fix every violation. WCAG 2.1 AA.
2. Run Lighthouse on the deployed preview. Target 95+ on Performance,
   Accessibility, Best Practices. Code-split mathjs, mathlive, and
   @react-pdf/renderer into async chunks (lazy-load on first use).
3. Implement src/services/telemetry/. Off by default. Course manifest opts in
   with a `telemetryEndpoint`. Only sends labId, sectionId, error message,
   error stack. No answers, no PII.
4. Replace the legacy `window.parent.postMessage(payload, '*')` pattern with
   a service that:
   - reads `parentOriginAllowList` from the course manifest,
   - only posts if `window.parent !== window` AND ancestor origin is in the
     list,
   - uses the explicit allow-listed origin as the targetOrigin.
5. Documentation:
   - README.md: 1-page overview + dev setup.
   - docs/AUTHORING_A_LAB.md: end-to-end walkthrough — copy a sample, fill
     in the fields, preview locally, ship a PR. Target reader: a TA with
     light JS knowledge, no React knowledge.
   - docs/ARCHITECTURE.md: link to this REBUILD_SPEC.md and summarize.
6. Final cleanup: delete physics-labs.up.railway.app/ from the repo (after
   Austin signs off). Bump version to 1.0.0.

Constraints:
- Do not regress test coverage.
- Telemetry must be opt-in by config and disclosed in the README.

Deliverable: production-ready 1.0.0; legacy code removed; docs in place.
```

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Lab content drift between legacy and new during migration | Phase 4 forces an explicit `MIGRATION_NOTES.md` and Austin sign-off per divergence. |
| `@react-pdf/renderer` cannot match a specific legacy layout | Phase 3 has a snapshot review with Austin; if a layout is critical, fall back to `pdfmake` or a small custom layout in `<react-pdf>`'s primitives. |
| `mathjs`/`ml-levenberg-marquardt` bundle is huge | Phase 5 code-splits; the fit engine lazy-loads on first plot render. |
| LMS embedding breaks because `postMessage` semantics change | Course manifest's `parentOriginAllowList` is the contract; document it for the LMS team and version it. |
| Students lose data during cutover | Cutover plan: deploy new app behind a feature flag at a separate URL; let returning students opt in; do not migrate their localStorage data automatically (it's small enough that re-typing student name is acceptable). |
| TA can't author labs without a developer | Phase 5 doc + a copy-paste-able `docs/AUTHORING_A_LAB.md` example + Zod schema validation gives instant feedback in the IDE. |
| Lab schema becomes too rigid | The schema is versioned (`Lab.schemaVersion`). Add new section kinds without breaking old ones; a migration step in the loader bumps versions. |

---

## 8. What Not To Do (anti-patterns from the legacy)

For every coding agent reading this: do not do any of the following, even if it looks easier:

1. Do not put auto-save inside `setAnswers`. Persistence is middleware.
2. Do not store images as base64 in JSON.
3. Do not block paste, copy, context menu, or selection. Ever.
4. Do not monkey-patch `removeEventListener`.
5. Do not use `<a href>` to navigate within the SPA.
6. Do not use `setTimeout` as a synchronization primitive for PDF generation.
7. Do not screenshot the live DOM to make a PDF.
8. Do not duplicate a lab file to specialize it for a course; use a course-level override.
9. Do not parse `<>` characters in title strings as HTML.
10. Do not use `postMessage(payload, '*')`.
11. Do not write a 485-line god-hook. Split by concern.
12. Do not put security or DRM logic on the frontend. It is theater. Spend that effort on a Canvas/Turnitin integration if academic integrity matters.

---

## 9. Open questions for Austin

Resolved in design review (see §1.4):

- ~~Backend?~~ → No DB; one Vercel serverless function for HMAC signing.
- ~~Identity?~~ → `studentName` for v1; LTI launch params if/when embedded; no Canvas auth in v1.
- ~~PDF fidelity?~~ → Content-equivalent and cleaner than legacy. Not pixel-faithful.
- ~~Anti-paste?~~ → No. Capture-and-disclose process telemetry instead.

Still open and worth answering before or during Phase 0:

1. **LMS embedding origin:** What's the actual parent origin to allow-list when embedded? `https://canvas.asu.edu` is the obvious guess; confirm it's not a sub-tool URL like `https://*.instructure.com`.
2. **Lab authoring workflow:** Will TAs author labs (in which case `docs/AUTHORING_A_LAB.md` in Phase 5 matters a lot), or only you?
3. **Course expansion:** Beyond PHY 114, is there a PHY 115 / PHY 121 / etc. coming? The course-manifest design assumes yes; confirming sets priority.
4. **Custom-equation parser sandbox:** The legacy `fitCalculations.js` lets students enter arbitrary math expressions. Has there been any audit of what's reachable through `mathjs`'s `parse`/`evaluate`? (Default `mathjs` is mostly safe, but `import` and a few function paths can be exploited.) Worth one focused security pass during the Phase 0 port — students entering arbitrary expressions in a system that signs their work has interesting implications for forgery vectors.
5. **Verification UX:** Is `/verify?h=<sig>` (TA scans QR from PDF, sees pass/fail) wanted in v1, or deferred?
6. **Signing nonce binding (v1.1?):** As §5.14 notes, the v1 signing function is forgeable by anyone who can re-POST to `/api/sign` with edited content. If that becomes a real cheating problem, bind the signature to a server-issued nonce per `(studentName, labId, sessionId)`. Decide whether to design v1's API in a forward-compatible way for that change.

---

## 10. Canonical envelope changelog

## v2 (2026-05-01)

- Added: `selectedFits` (`Record<plotId, fitId | null>`) — student's chosen fit model per plot.
- Added: `fits` (`Record<plotId, FitResultSchema>`) — computed fit model + parameters at sign time.
- Migration: persisted v1 state hydrates with empty `selectedFits` and `fits`, then auto-upgrades to v2 on next autosave.
- Implication: PDFs signed against the v1 envelope cannot be regenerated bit-identical with current code. Their embedded canonical and signature remain mutually consistent (self-validation still works), but their canonical shape differs from what current code now emits.

---

*End of spec.*
