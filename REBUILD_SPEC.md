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

*End of spec.*
