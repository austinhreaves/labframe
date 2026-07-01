# LabFrame Spec

**Status:** Living document. Single source of truth for product and engineering decisions.
**Last revised:** 2026-06-10
**Supersedes:** [`docs/archive/REBUILD_SPEC.md`](./archive/REBUILD_SPEC.md), the original rebuild design and phase history, now a historical record. Where this document and any archived document disagree, this document wins.

**Conventions used here:**

- Everything without a marker describes the system **as built** on the revision date above.
- **[Decided 2026-06-10, not implemented]** marks changes agreed in the June 2026 code review that are not yet in the code. Section 7 collects them as a work queue.
- Reversing a binding decision requires an ADR in [`docs/decisions/`](./decisions/), not an edit to this file alone.

---

## 1. What LabFrame is

LabFrame is a browser-based worksheet app for fully online ASU physics lab courses (PHY 112, 114, 132). A student runs an open-source simulation (PhET and similar) and completes a structured worksheet on the same page, then exports a signed PDF report and submits it through Canvas. There is no account, no install, and no LabFrame server that stores student work.

The deliverable is a **PDF carrying a signed canonical JSON record**. The PDF is what graders read; the embedded `lab.json` attachment plus an HMAC-SHA256 signature is what auditors and dispute resolution use. Canvas is the system of record for submissions and grades.

---

## 2. Binding decisions

1. **Artifact format: PDF carrying signed canonical JSON.** The canonical `LabAnswers` JSON is embedded as a PDF file attachment; the signature appears in the footer and PDF metadata. JSON-only submission is rejected as a workflow.
2. **No backend, by design.** No server-side storage of student data, ever. One stateless Vercel function (`/api/sign`) holds the secret and signs payloads without persisting or logging them. See [ADR-0002](./decisions/0002-no-backend-lock.md).
3. **Integrity model: disclosure, not prevention.** Every text input records its construction history (pastes with content, keystroke counts, focus timing), disclosed to the student in the integrity agreement and rendered in the PDF. No paste blocking, no tamper traps, no hidden bait. See [ADR-0004](./decisions/0004-disclosure-not-prevention.md).
4. **Identity is the typed name in v1.** No Canvas auth. The `?student=` URL parameter and a localStorage key prefill it. LTI 1.3 is a future phase, and it is an authentication change, not a storage change; it must not introduce a database.
5. **Parent-frame messaging is allow-list gated.** Courses set `parentOriginAllowList`; LabFrame posts only `{type, courseId, labId}` to an exact allow-listed origin and never uses `postMessage(..., '*')`.
6. **Persistence is browser-local.** JSON in localStorage, image blobs in IndexedDB, keyed by `(courseId, labId, studentName)`. Quota errors surface to the student with a recovery action; no silent data loss.
7. **Every text value carries its history.** `FieldValue = {text, pastes, meta}` propagates through the store, the persisted state, the canonical envelope, and the PDF renderer.
8. **Images are first-class submission content.** Image sections are part of the graded artifact: the exported PDF embeds the image visually, and the canonical envelope carries a SHA-256 of the bytes so the signature covers them. See [ADR-0003](./decisions/0003-images-first-class-hashed.md). **[Decided 2026-06-10, not implemented]** (today the PDF prints only attachment metadata and the envelope has no hash).
9. **Canonical JSON is byte-deterministic everywhere.** Object keys sort by UTF-16 code unit, no whitespace, finite numbers only. **[Decided 2026-06-10, not implemented]**: the current implementation sorts with `localeCompare`, which is locale-dependent and must change with envelope v5.
10. **A signature without a verifier is theater.** Verification tooling (a stateless `/api/verify` plus the client-only integrity inspector) is committed roadmap, prioritized ahead of nonce binding. `/api/verify` and `public/verify.html` (TA Checker) are now implemented. The client-only integrity inspector remains pending. See [`docs/specs/INTEGRITY_INSPECTOR_SPEC.md`](./specs/INTEGRITY_INSPECTOR_SPEC.md).

---

## 3. Architecture as built

### 3.1 Module map

```
api/sign.ts                 stateless HMAC signing function (Vercel)
src/
  app/Routes.tsx            routing + two-level lab registry (labsByCourse)
  domain/schema/            Zod schemas: Lab, Course, LabAnswers (types + validation)
  content/courses/          course manifests (phy112, phy114, phy132)
  content/labs/<course>/    one .lab.ts file per lab (29 labs, many drafts)
  state/labStore.ts         Zustand store keyed by (courseId, labId, studentName)
  state/persistence/        adapters (localStorage JSON, IndexedDB blobs) + debounced middleware
  services/integrity/       canonicalize, buildAnswers, sign client, preflight, agreement text
  services/pdf/             react-pdf Document, render, seal (pdf-lib), draft watermark, filename
  services/embed/           allow-listed parent postMessage
  services/telemetry/       opt-in error reporter (per-course endpoint)
  ui/                       LabPage, Catalog, section views, primitives, layout, tokens.css
```

### 3.2 Runtime flow

1. Router resolves `/c/:courseId/:labId`; `LabPage` mounts with a `key` tied to the pair, so switching labs remounts the subtree.
2. `initLab` resets state, then hydrates persisted answers and image blobs for the current `(course, lab, student)` key.
3. Section views render from the lab schema; every input emits `FieldValue` patches through the capture layer.
4. Persistence middleware debounces 250ms and writes JSON + blobs.
5. Export: preflight (student name) -> `buildAnswersFromStore` -> `canonicalize` -> POST `/api/sign` -> `renderPDF` -> `sealPDF` (attach `lab.json`, stamp footer + metadata) -> download. Draft export skips signing and watermarks every page.

### 3.3 Content model

- `Lab` and `Course` are Zod schemas in `src/domain/schema/`; lab files are TypeScript objects checked structurally by `tsc`.
- Zod runtime validation currently happens **only in tests, for 4 of 29 labs**. A repo-wide content-integrity test (every lab parses; every `plot.sourceTableId`, `xCol`, `yCol` resolves; `fieldId`s unique; every enabled manifest ref resolves in the registry) is **[Decided 2026-06-10, not implemented]**.
- `enabled: false` in a course manifest hides a lab from the catalog. It is **presentation, not access control**: any lab is reachable by direct URL. This is intentional in review mode; launch gating is a separate future spec.
- Authoring conventions live in [`docs/AUTHORING_A_LAB.md`](./AUTHORING_A_LAB.md). The `instructions.html` field is Markdown (sanitized via rehype-sanitize, KaTeX after sanitize), not HTML.

### 3.4 State and persistence

- Store key: `lab:{courseId}:{labId}:{studentName}` (JSON), `img:{courseId}:{labId}:{studentName}:{imageId}` (blobs). Key segments are not yet encoded; names containing `:` break image-key parsing. **[Decided 2026-06-10, not implemented]**: percent-encode segments.
- Persisted schema is versioned (currently v4) with forward migrations on hydrate; integrity-agreement acceptance is transient and never persisted (students re-affirm each session).
- Known race conditions in `initLab` hydration and the save debounce (cross-lab merge, lost final keystrokes, no `pagehide` flush) are **[Decided 2026-06-10, not implemented]** fixes; see Section 7.
- Renaming the student migrates that course's keys to the new name. Collision with an existing name currently overwrites; a guard is **[Decided 2026-06-10, not implemented]**.

### 3.5 PDF pipeline

- `@react-pdf/renderer` renders from `(Lab, LabAnswers)`; no DOM screenshotting, no timeouts, deterministic modulo `signedAt`.
- `pdf-lib` seal step attaches canonical `lab.json`, sets metadata, stamps the visible `Signed: <ISO> - <sig8>` footer. Draft mode watermarks DRAFT, omits signature and attachment, and suffixes `_DRAFT` on the filename.
- Filename template: `{LabTitle}_{StudentName}_{YYYY-MM-DD}_{sig8}.pdf` (ASCII TitleCase sanitization).
- Markdown in instructions renders through a remark-to-react-pdf pipeline with `latexToUnicode` for inline math; block math falls back to monospace source.
- Paste attribution: normalize + literal substring matching only, by design. See [ADR-0001](./decisions/0001-paste-attribution-matching.md).
- Image sections currently print caption + "attachment metadata" only. Embedding the image is part of envelope v5 work ([ADR-0003](./decisions/0003-images-first-class-hashed.md)).

---

## 4. Integrity model

### 4.1 Capture layer

Implemented at the `Field` and `EquationEditor` primitives via `InputEvent.inputType`:

| inputType                           | Effect                                          |
| ----------------------------------- | ----------------------------------------------- |
| `insertText`                        | `meta.keystrokes += 1`                          |
| `delete*`                           | `meta.deletes += 1`                             |
| `insertFromPaste`, `insertFromDrop` | `PasteEvent {source: 'clipboard'}` with content |
| `insertReplacementText`             | `PasteEvent {source: 'autocomplete'}`           |
| composition end                     | single `PasteEvent {source: 'ime'}`             |

Focus/blur accumulates `meta.activeMs`. All capture is local-only and sealed into the signed envelope; nothing is transmitted during work.

### 4.2 Process record in the PDF

- Clipboard pastes that survive in the final text render italic; autocomplete pastes render in a distinct style; edited-out pastes get a one-line note with timestamp and preview.
- A Process Record appendix reports per-section activity. **[Implemented 2026-07-01]**: the grading PDF reports active time in coarse bands (`formatTimeBand`: under 1 min / 1-5 / 5-15 / 15-45 / over 45 min) rather than raw milliseconds, and IME paste counts are excluded from the printed appendix and from row-activity detection (they carry no integrity signal and flag CJK typists). Granular numbers stay in the signed envelope for the inspector.
- **[Implemented 2026-07-01]** Process Record rows carry a section-specific label via `processRecordLabel(section)`, used only by the appendix (`sectionTitle()` is shared with the PDF body headings and the compaction list, so it stays generic). Label priority: authored `tocLabel`, else kind-specific identity (measurement `label`, truncated `prompt` for objective/calculation/concept), else the kind name; repeats get an occurrence index (`Explain your reasoning. 2`). Presentation only; the label derives from the already-signed section, never a new signed field.
- **Precondition (met):** the active-time metric is leak-proof (see [ACTIVE_TIME_ACCRUAL_SPEC](specs/ACTIVE_TIME_ACCRUAL_SPEC.md)); banding an `activeMs` that silently undercounted on reload would have printed misleading bands.

### 4.3 Signing service

`POST /api/sign` with `{canonical: string}` returns `{signature, signedAt}`. HMAC-SHA256 over `canonical | signedAt`, secret in `LAB_SIGNING_SECRET`, 5 MB cap, no payload logging (length and signature prefix only).

**Threat model honesty:** this catches casual tampering (editing the PDF or the JSON after export). It does **not** catch a student who modifies the canonical JSON and re-POSTs for a fresh signature. Closing that requires nonce binding (deferred; revisit after verification tooling exists and if abuse appears). Origin checking and basic rate limiting on the endpoint are **[Decided 2026-06-10, not implemented]** hardening.

### 4.4 Untrusted-input handling

Adopted from the integrity draft, amended by [ADR-0003](./decisions/0003-images-first-class-hashed.md). A student's `lab.json` is signed but not sanitized; every consumer must treat it as adversarial input.

1. **No HTML injection on render.** Student text renders as React text nodes or `textContent` writes, never `innerHTML`. Markdown rendering applies to instruction prose only, never to student-supplied text. (As built in the student app today.)
2. **Schema validation with hard size caps.** **[Decided, not implemented]**: `PasteEvent.text` max 50 KB; `pastes` max 1000 per field; `FieldValue.text` max 100 KB; total JSON max 5 MB; reject the whole file on any violation. Implemented as a single `loadUntrustedLabJson()` entry point that every TA-facing consumer must use.
3. **Images are untrusted bytes.** Per ADR-0003 (supersedes the draft's text-only stance): the envelope carries `{sha256, mime, bytes}` per image, binary stays out of the JSON, and any consumer that decodes image bytes does a `createImageBitmap()` round-trip and EXIF strip.
4. **Prompt injection.** No future workflow may pass raw `FieldValue.text` or `PasteEvent.text` into an LLM as instructions; student content must be delimited as data, and no LLM-derived value may drive a grade without human review.

### 4.5 Verification roadmap

1. **TA Checker** (`public/verify.html` + `POST /api/verify`) **[Implemented 2026-06-30]**: drag-and-drop PDF verifier for TAs. Extracts the `lab.json` envelope from the PDF server-side, performs HMAC-SHA256 constant-time compare, and returns a cryptographic verdict plus advisory checks (integrity agreement, AI declaration, identity, field/table completeness, fit coverage). Access-gated by `VERIFY_PASSPHRASE` env var. Degrades gracefully for legacy PDFs (pre-envelope format) with a structural-only verdict. The `checks` response array is the extension point for future automated grading signals -- add entries here before reaching for an LLM.
2. The **Integrity Inspector**: a client-only page that accepts a `lab.json` or a signed PDF, extracts and validates via `loadUntrustedLabJson`, and renders field reconstruction, timeline, and paste inventory views. Spec: [`docs/specs/INTEGRITY_INSPECTOR_SPEC.md`](./specs/INTEGRITY_INSPECTOR_SPEC.md). Locked client-only: no upload, no backend, ever. **[Not implemented]**
3. **Resume-from-PDF**: the same untrusted loader powers a student-facing "Restore from PDF" action (drag a draft or signed PDF onto the lab page to rehydrate the store). This turns the PDF into a portable save file and is the primary mitigation for browser-local data loss. Requires drafts to carry the (unsigned) JSON attachment too. **[Not implemented]**

---

## 5. Data handling and privacy

[`docs/DATA_HANDLING.md`](./DATA_HANDLING.md) is the compliance reference (FERPA posture, data inventory, flows, retention). The promises in it that code must keep:

- The signing endpoint never logs payload contents.
- Telemetry is opt-in per course and limited to `{labId, sectionId, message, stack}`; no answers, no names. **[Decided 2026-06-10, not implemented]**: scrub storage-key patterns (which embed student names) from telemetry messages and stacks so the promise holds by construction.
- Nothing transmits during normal work; the only server call is signing at export.

Known factual drift to correct in DATA_HANDLING when envelope v5 lands: it currently states image bytes are embedded in the PDF (they are not yet), and it describes the legacy Railway URL as ASU-controlled.

---

## 6. Canonical envelope and changelog

`LabAnswers` (schemaVersion 4): `meta` (student name, semester, session, year, course title), `integrity` (signedAs, aiUsed, aiSharedLinks, agreement acceptance + verbatim text), `fields`, `tables`, `selectedFits`, `images` (refs), `fits`, `status`.

Canonicalization contract: keys sorted at every level, no whitespace, `undefined` dropped, finite numbers only, `-0` normalized to `0`.

### v2 (2026-05-01)

- Added `selectedFits` and `fits`. v1 hydrates with both empty.

### v3 (2026-05-02)

- Added `integrity.aiUsed` and `integrity.aiSharedLinks`. v2 hydrates with `aiUsed: false`.

### v4 (2026-05-22)

- Added `integrity.agreementAccepted`, `agreementAcceptedAt`, `agreementText` (transient; never persisted; re-affirmed each session). v3 hydrates unchanged; PDFs signed at v3 lack the affirmation record and must be read as "not explicitly captured", not "rejected".

### v5 (pre-registered 2026-06-10, not yet implemented)

One batched break, taken now because no signatures exist in the wild:

- **Canonicalization** sorts object keys by UTF-16 code unit (replaces `localeCompare`; required for cross-environment verification).
- **`meta.semester`** derived from `signedAt` (Jan-Apr Spring, May-Jul Summer, Aug-Dec Fall); **`meta.session`** becomes optional and is omitted until a source of truth exists; **`meta.taName`** renamed **`meta.courseTitle`** (it always held the course title).
- **`images`** entries gain `sha256` (hex of blob bytes), binding the signature to image content; the PDF embeds each image visually ([ADR-0003](./decisions/0003-images-first-class-hashed.md)).
- **`status.submitted`** dropped from the envelope (it was always `false` at sign time and carried no information). `status.lastSavedAt` stays.
- Migration: persisted v4 hydrates unchanged; the envelope changes apply at build/sign time. PDFs signed at v4 and earlier remain self-consistent against their own embedded canonical.

---

## 7. Decided, not yet implemented (work queue)

Agreed in the 2026-06-10 review, in priority order. Each item should land with a pinning test.

| #   | Item                                                                                                                                                                                                                                               | Area        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Embed uploaded images in the PDF; add `sha256` to envelope (ADR-0003, envelope v5)                                                                                                                                                                 | Product     |
| 2   | Code-unit canonicalization + the rest of envelope v5 (Section 6)                                                                                                                                                                                   | Integrity   |
| 3   | `initLab` staleness guards after every await (cross-lab data-bleed race)                                                                                                                                                                           | State       |
| 4   | Persistence: flush previous lab's state on key change, suppress saves during hydration, `pagehide` flush                                                                                                                                           | State       |
| 5   | Remove the whole-store subscription in `LabPage` (use `getState()` in export handlers)                                                                                                                                                             | Performance |
| 6   | De-flake `sectionRenderer` test (`findAllByRole` with timeout)                                                                                                                                                                                     | CI          |
| 7   | Repo-wide content-integrity test (all labs parse, cross-references resolve, ids unique)                                                                                                                                                            | Content     |
| 8   | Enforce `maxMB` + image type in `FileDropzone` (both input and drop paths)                                                                                                                                                                         | UI          |
| 9   | Derived columns: gate on `deps` parsing finite; never write `NaN`/`Infinity` into cells                                                                                                                                                            | State       |
| 10  | Percent-encode persistence key segments (names containing `:`)                                                                                                                                                                                     | State       |
| 11  | Student-rename collision guard (do not overwrite existing data)                                                                                                                                                                                    | State       |
| 12  | Telemetry scrub of storage-key patterns (names) from message/stack                                                                                                                                                                                 | Privacy     |
| 13  | `/api/sign` origin check + rate limit; security headers in `vercel.json`                                                                                                                                                                           | Security    |
| 14  | Process Record: time bands instead of raw ms; exclude IME counts; section-specific row labels via `processRecordLabel` (not the generic kind name) **[Done 2026-07-01]**                                                                           | Integrity   |
| 15  | `/api/verify` endpoint + `public/verify.html` TA Checker **[Done 2026-06-30]**                                                                                                                                                                     | Integrity   |
| 16  | Integrity Inspector (client-only; see spec)                                                                                                                                                                                                        | Integrity   |
| 17  | Resume-from-PDF (drafts gain unsigned JSON attachment; loader shared with inspector)                                                                                                                                                               | Product     |
| 18  | Remove dead schema surface: `CourseLabRef.overrides`, `requireTaName`, the `equation` process-record arm; fix or remove `splitFraction` persistence; real version/build info in the About dialog; replace `window.alert` with the dialog primitive | Cleanup     |
| 19  | Chart memoization (`points` keyed on table identity)                                                                                                                                                                                               | Performance |
| 20  | Correct the two factual claims in DATA_HANDLING (images in PDF, hosting URL) once #1 lands                                                                                                                                                         | Docs        |

Active feature specs (separate documents): [`POLISH_SPEC_B`](./specs/POLISH_SPEC_B_BUTTONS_SEGMENTED.md) (buttons + header restructure), [`POLISH_SPEC_D`](./specs/POLISH_SPEC_D_CATALOG.md) (catalog redesign; prioritized ahead of B for the review cohort), [`GRAPHING_EXPANSION_SPEC`](./specs/GRAPHING_EXPANSION_SPEC.md) (gated on lab need), [`PHY112_TIER_AB_SPEC`](./PHY112_TIER_AB_SPEC.md) (Tier B: 5 labs remaining), and the two graphing handoffs in [`docs/handoffs/`](./handoffs/) (log axes block the filter labs' quality).

---

## 8. Anti-patterns (binding)

Carried forward from the rebuild spec; these remain hard constraints for every contributor and agent:

1. No auto-save inside state setters; persistence is middleware.
2. No base64 images in JSON; blobs live in IndexedDB.
3. Never block paste, copy, context menu, or selection.
4. No monkey-patching of platform APIs.
5. No `<a href>` navigation inside the SPA.
6. No `setTimeout` as a synchronization primitive; no DOM screenshotting for PDFs.
7. No lab-file duplication to specialize per course.
8. No HTML sniffing of content strings; markdown through the sanitized pipeline only.
9. No `postMessage(payload, '*')`.
10. No god-hooks; split by concern.
11. No frontend security or DRM theater.
12. No hidden AI-trap text in instructions; the integrity model is disclosure, not entrapment.
13. New: no server-side storage of student data without an ADR superseding [ADR-0002](./decisions/0002-no-backend-lock.md).

---

## 9. Open questions

1. **LMS embed origin:** exact parent origin(s) for the Canvas allow-list (`canvas.asu.edu` vs `*.instructure.com` sub-tool URLs). Blocks enabling `parentOriginAllowList` in production manifests.
2. **Lab gating at launch:** review mode shows everything; a launch needs a decision on URL gating (`enabled` is not access control). Deferred spec: lab URL gating.
3. **Prerequisite DAG sequencing** (from the archived reorg proposal): labs currently use `labNumber`; the DAG + pacing idea died by drift, not decision. Decide explicitly, record an ADR either way.
4. **Verification UX shape:** resolved -- `public/verify.html` is a standalone TA-facing drag-and-drop checker served at `/verify.html`. Access-gated by passphrase. **[Resolved 2026-06-30]**
5. **Nonce binding (v1.1):** revisit only after verification tooling exists and if re-sign abuse is observed in practice.
6. **Course expansion:** PHY 112 Tier B is in flight; anything beyond (PHY 113/115) affects content tooling priorities.
7. **Pen test:** DATA_HANDLING recommends an independent review before broad rollout; unscheduled.

---

## 10. Document map

| Location                                 | Contents                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `README.md`, `CONTRIBUTING.md`           | Overview, setup, workflow (repo root)                                                |
| `docs/SPEC.md`                           | This document: living source of truth                                                |
| `docs/ARCHITECTURE.md`                   | Short architecture orientation                                                       |
| `docs/AUTHORING_A_LAB.md`                | TA-facing lab authoring guide                                                        |
| `docs/DESIGN_SYSTEM.md`                  | Design tokens and component rules                                                    |
| `docs/DATA_HANDLING.md` (+ exec summary) | FERPA / privacy compliance reference                                                 |
| `docs/PHY112_TIER_AB_SPEC.md`            | Active course buildout spec (path kept stable; code comments reference it)           |
| `docs/specs/`                            | Active feature specs (polish B/D, graphing expansion, integrity inspector)           |
| `docs/handoffs/`                         | Self-contained agent handoffs still pending (log axes, multi-series)                 |
| `docs/decisions/`                        | ADRs: one page per load-bearing decision                                             |
| `docs/archive/`                          | Historical record: rebuild spec, proposals, parity inventories, completed phase docs |
