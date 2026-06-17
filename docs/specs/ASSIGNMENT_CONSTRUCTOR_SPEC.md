# Assignment Constructor Spec

**Status:** Active, not yet built. Architecture agreed in a design brainstorm on 2026-06-16.
**Audience:** engineers and agents implementing the client-facing lab authoring feature.
**Relationship to other docs:** binding decisions are recorded in [ADR-0005](../decisions/0005-authored-labs-are-data.md) through [ADR-0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md) and summarized in [`docs/SPEC.md`](../SPEC.md) section 2. Where this document and an ADR disagree, the ADR wins. Where this document and `docs/SPEC.md` disagree, `docs/SPEC.md` wins.

---

## 1. What this is and why

LabFrame is delivered to its first external client in mid-2026. The client uses the existing 29 labs for roughly six months, then needs to **construct new labs themselves**, without a developer, a git checkout, or a redeploy.

Today a lab is a TypeScript module (`src/content/labs/<course>/*.lab.ts`) compiled into the bundle, validated mostly by `tsc`, exported from an index, enabled in a course manifest, and shipped through a PR and a Vercel deploy. That is a developer workflow. A non-developer cannot use it, and it contains a hard blocker for runtime authoring: `DerivedColumn.formula` is a real JavaScript function (`(row) => number`, see [`src/domain/schema/lab.ts`](../../src/domain/schema/lab.ts) and the call site at [`src/state/labStore.ts`](../../src/state/labStore.ts) `recomputeDerivedColumns`). Functions do not serialize to JSON, and evaluating author-supplied JavaScript at runtime is remote code execution in the student's browser.

The constructor solves this by making an authored lab **data, not code**, distributed as a file the student imports, with formulas (when they arrive) expressed in a small arithmetic language that cannot execute anything but arithmetic.

### Decision ledger (binding)

| #   | Decision                                                                                                                                                                                | ADR                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | The constructor authors a single **lab worksheet** (not course assembly).                                                                                                               | this spec                                                        |
| 2   | An authored lab is a serializable **`LabDoc` (JSON)**; the 29 existing labs stay as compiled code. One render path via `compileLabDoc(doc) -> Lab`.                                     | [0005](../decisions/0005-authored-labs-are-data.md)              |
| 3   | Derived-column formulas use a **non-Turing-complete arithmetic DSL**, parsed to an AST and interpreted, never `eval`. Deferred to Phase E.                                              | [0007](../decisions/0007-formula-dsl-safety.md)                  |
| 4   | **MVP at delivery** = full safe section palette with input-only tables and plots; derived columns ship later, within the window.                                                        | this spec                                                        |
| 5   | Distribution is **file import, no backend**. The no-backend lock ([ADR-0002](../decisions/0002-no-backend-lock.md)) is **PII-scoped**, so moving lab content is allowed.                | [0006](../decisions/0006-no-backend-lock-is-pii-scoped.md)       |
| 6   | Lab identity is the **LabDoc content hash** (SHA-256).                                                                                                                                  | [0005](../decisions/0005-authored-labs-are-data.md)              |
| 7   | A redistributed (changed) file is a new hash, which is a **fresh start**; old work is recoverable only via the old file or a prior PDF.                                                 | this spec                                                        |
| 8   | The signed envelope binds **`labHash` for imported labs now** (optional field, envelope v5); built-ins get hashes only if migrated.                                                     | [0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md) |
| 9   | The exported PDF **embeds the full LabDoc** (self-describing, powers restore-from-PDF).                                                                                                 | [0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md) |
| 10  | The constructor is a **client-only `/author` route** in the same SPA, code-split.                                                                                                       | this spec                                                        |
| 11  | Author figures are **embedded in the LabDoc** (base64, capped) as `assets`.                                                                                                             | this spec                                                        |
| 12  | Simulation URLs are limited to an **allow-list of vetted domains**.                                                                                                                     | this spec                                                        |
| 13  | Authoring sets **points only**; grading stays human (no answer keys, no auto-grade).                                                                                                    | this spec                                                        |
| 14  | Imported labs **persist in IndexedDB** by hash and appear in a **"My Labs"** catalog; route `/i/:hash`.                                                                                 | this spec                                                        |
| 15  | The integrity agreement has a **non-removable capture-disclosure core**; authors edit everything else; the envelope records the verbatim text plus an attestation the core was present. | [0008](../decisions/0008-integrity-agreement-core-disclosure.md) |

---

## 2. The `LabDoc` format

`LabDoc` is the stored, serializable, author-facing form. `Lab` (in `src/domain/schema/lab.ts`) stays the runtime form the renderer already consumes. They are bridged by `compileLabDoc` (section 3).

Two independent version lines:

- **`LabDoc.schemaVersion`** versions the authoring format. Starts at `1`. Old imported files migrate forward on load.
- **`LabAnswers.schemaVersion`** versions the answer envelope (now 5; see `docs/SPEC.md` section 6). These are not coupled.

Shape (Zod, new file `src/domain/schema/labDoc.ts`):

```ts
LabDoc = {
  schemaVersion: 1,
  meta: {
    title: string,            // prints in the PDF header
    author: string,           // instructor name (instructor content, not student PII)
    authorContact?: string,
    humanVersion?: string,    // e.g. "v1", "Fall 2026" — author-facing label, not the hash
    createdAt: string,        // ISO
    updatedAt: string,        // ISO
  },
  simulations: Record<SimId, { title, url, allow? }>,  // url validated against the allow-list
  integrityAgreement?: { customText?: string },        // author's custom text only; the core is composed in, never stored editable
  assets: Record<AssetId, { mime: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml', dataBase64: string, bytes: number }>,
  sections: LabDocSection[],
}
```

`LabDocSection` mirrors the runtime `Section` discriminated union with two differences:

1. **Derived columns** carry `formulaExpr: string` (DSL source) instead of `formula: function`. At MVP, `dataTable` columns are input-only and this field does not appear; it is introduced in Phase E.
2. **Figures** live inside `instructions` markdown using an `asset:<assetId>` URL scheme (`![alt](asset:fig1)`), resolved against `LabDoc.assets`. This is distinct from the `image` section, which is a **student upload** target and is unchanged.

Caps (enforced by the loader, section 3):

- Per asset: 2 MB decoded. Total `assets`: 8 MB. Asset count: 20.
- Total LabDoc JSON: 12 MB. Section count: 200. Markdown block length: 50 KB.
- These are starting numbers; tune against real authored labs before the client uses it in anger.

---

## 3. The runtime seam: compile, load, hash

Three pure functions, all in `src/services/authoring/` (new directory), all unit-testable with fixtures and with **no UI dependency**. This is Phase A.

### 3.1 `compileLabDoc(doc: LabDoc): { lab: Lab; assets: Record<AssetId, Blob> }`

Produces the runtime artifacts the app already renders. The content hash is computed separately by `hashLabDoc` (section 3.3), because hashing is async (Web Crypto) and compilation is otherwise synchronous; `loadUntrustedLabDoc` returns both.

- Maps each `LabDocSection` to a runtime `Section`.
- Composes the integrity agreement: `customText` (if any) plus the **locked capture-disclosure core**, set on `lab.studentInfo.integrityAgreementText` so the existing `resolveIntegrityAgreementText` ([`src/services/integrity/agreementText.ts`](../../src/services/integrity/agreementText.ts)) picks it up unchanged. See [ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md).
- Decodes `assets` base64 into `Blob`s once; the renderer resolves `asset:<id>` markdown URLs to object URLs (DOM) or embedded bytes (PDF). Add `asset:` resolution to `MarkdownBlock`/`renderMarkdownToPdf` via a resolver passed through context, not a global.
- **Phase E only:** parses each `formulaExpr` into a safe `(row: NumericRow) => number` closure (section 7) and attaches it as `column.formula`, so `recomputeDerivedColumns` works without modification.

### 3.2 `loadUntrustedLabDoc(input: ArrayBuffer | string): LoadResult`

An imported LabDoc is **untrusted input** that runs in student (and later TA) browsers, exactly like a student `lab.json` (see `docs/SPEC.md` section 4.4 and `loadUntrustedLabJson`). This is the single hardened entry point every consumer must use. It:

1. Parses JSON in a try/catch; rejects on failure.
2. Validates against `LabDocSchema`; rejects on any violation.
3. Enforces all size and count caps (section 2). Rejects the whole file on any violation; never truncates.
4. Validates every `simulations[*].url` against the domain allow-list (section 6.4); rejects otherwise.
5. Treats assets as untrusted bytes per [ADR-0003](../decisions/0003-images-first-class-hashed.md): allow-listed image mimes only, `createImageBitmap()` decode round-trip, EXIF strip. Rejects anything that does not decode as the declared image type. (`image/svg+xml` is sanitized, not bitmap-decoded; if the sanitizer is not ready at MVP, drop SVG from the allowed mimes rather than ship an unsanitized path.)
6. Runs the **cross-reference invariants** (the authored-lab analog of `docs/SPEC.md` work-queue item 7): every `plot.sourceTableId`/`xCol`/`yCol` resolves to a real table and column; all `fieldId`/`tableId`/`plotId`/`captionFieldId` unique within the doc; every `asset:` reference in markdown resolves; (Phase E) every derived `deps` resolves to an input column.
7. Computes `labHash` (section 3.3).

Returns either `{ ok: true, doc, labHash }` or `{ ok: false, error }` with a student-readable message. Same loader powers import, restore-from-PDF, and the constructor's own export self-check.

### 3.3 Content hash

`labHash = sha256_hex(canonicalize(doc))`, where `canonicalize` is the shared function in [`src/services/integrity/canonicalize.ts`](../../src/services/integrity/canonicalize.ts).

**Prerequisite:** `canonicalize` currently sorts keys with `localeCompare`, which is locale-dependent (`docs/SPEC.md` section 6, v5). A locale-dependent hash produces different identities on different machines and false grading accusations. The **code-unit canonicalization fix (envelope v5, work-queue item 2) must land before or with Phase C.** Phase A can compute the hash for local use, but the hash is not authoritative for cross-environment verification until that fix is in.

The hash covers `assets` (the base64 strings), so identical content yields an identical hash and re-importing the same file resumes the same work.

---

## 4. Student read path: import, persist, catalog, restore

This is Phase B (depends on Phase A).

### 4.1 Identity and persistence keying

Imported labs reuse the existing key scheme in [`src/state/persistence/keys.ts`](../../src/state/persistence/keys.ts) with no change to the format:

- `courseId = 'imported'` (a reserved id).
- `labId = labHash` (hex, contains no `:`, so it is key-safe today).
- Answers persist at `lab:imported:<labHash>:<studentName>`; image uploads at `img:imported:<labHash>:<studentName>:<imageId>`.

The LabPage and store wire-up: `initLab('imported', labHash, compiled.lab)` (the store signature in `src/state/labStore.ts` already takes `(courseId, labId, lab)`). Construct a synthetic `Course` for imported labs (`{ id: 'imported', title: doc.meta.title, ... }`) so `buildAnswersFromStore` and the catalog work unchanged; the envelope's course-title field comes from `doc.meta.title`.

### 4.2 LabDoc storage and "My Labs"

The LabDoc bytes are stored in IndexedDB at `labdoc:<labHash>` (separate from answers). A small index (one localStorage JSON or an IndexedDB store) lists `{ labHash, title, author, humanVersion, importedAt }` for the catalog.

The Catalog ([`src/ui/Catalog.tsx`](../../src/ui/Catalog.tsx)) gains a **"My Labs"** section rendered from that index, with open and delete affordances. Deleting a LabDoc offers to also clear that lab's answers; orphaned answers from superseded versions are surfaced here for cleanup (they otherwise linger harmlessly in browser storage).

### 4.3 Routing

New route `/i/:hash` resolves a stored LabDoc, runs `compileLabDoc`, and mounts `LabPage`. **Do not reuse `/lab/:slug`** (it already maps phy132 slugs in `src/app/Routes.tsx`). Import entry points: drag-drop a `.labframe.json` onto the catalog, or an "Open lab file" action.

### 4.4 Restore from PDF (authored) **[Deferred]**

Because the PDF embeds the LabDoc (section 5.2), dragging a signed or draft PDF onto the catalog would extract both attachments, run `loadUntrustedLabDoc` and `loadUntrustedLabJson`, verify the embedded LabDoc re-hashes to `answers.labHash`, then load the lab and rehydrate the answers. This is the union of work-queue item 17 (resume-from-PDF) and the import path, and it is the primary mitigation for the "edit is a fresh start" data loss in decision 7.

**Deferred out of Phase C** (decided 2026-06-16): it depends on an untrusted _answers_ loader (`loadUntrustedLabJson`, not yet built) and an envelope-to-store rehydration path that do not exist, and is broader than the constructor. The embedded LabDoc (section 5.2) ships now so the artifact is ready when restore is built.

---

## 5. Integrity binding

This is Phase C (depends on Phase A and the envelope-v5 canonicalization fix).

**Status: landed 2026-06-16.** Envelope is now v5 with optional `labHash` and `integrity.captureDisclosureCorePresent`, `status.submitted` dropped, and `meta` cleaned up (`courseTitle`, derived `semester`, optional `session`); signed and draft PDFs embed the canonical `LabDoc` for imported labs. Deferred to their own efforts: the ADR-0003 image `sha256`/visual embed (now envelope v6) and restore-from-PDF (section 4.4). 5.2 below describes draft embedding, which ships; the "restore-from-PDF works from drafts" payoff waits on 4.4.

### 5.1 `labHash` in the envelope

Envelope v5 gains an **optional** `labHash: string`. Present for imported labs, omitted for built-in labs (which keep today's implicit identity, the `labId` plus the deployed app build, until they migrate to LabDoc, see [ADR-0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md)). `buildAnswersFromStore` ([`src/services/integrity/buildAnswers.ts`](../../src/services/integrity/buildAnswers.ts)) sets it from the store, which carries the hash for imported labs. The signature (HMAC over the canonical envelope) therefore covers `labHash`, binding "these answers, for this exact authored lab version."

### 5.2 PDF embeds the LabDoc

`sealPDF` ([`src/services/pdf/seal.ts`](../../src/services/pdf/seal.ts)) gains a second attachment for imported labs: `lab.labframe.json` (the canonical LabDoc), alongside the existing `lab.json` (answers). The LabDoc is **not** in the signed canonical string; only its hash is. The doc rides as a convenience copy and is tamper-evident: re-hash the embedded LabDoc and compare to the signed `labHash`. Draft exports embed it too (so restore-from-PDF works from drafts).

### 5.3 Grading verification

Authenticity lives at grade time, not import time. The instructor publishes the authoritative `labHash` of the assignment (in the Canvas assignment description, or surfaced by the verify tooling). A grader confirms the submitted PDF's `labHash` matches. A student who imported a different (easier) file produces a non-matching hash and is caught. No backend is required for this.

### 5.4 Agreement core attestation

The envelope already stores `integrity.agreementText` verbatim (v4). Add an attestation that the locked capture-disclosure core was present and unmodified (a boolean derived by the compiler, or a hash of the canonical core text compared at sign time). The verify/inspector tooling can then assert "the student accepted an agreement containing the standard disclosure," which decision 15 and [ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md) require.

---

## 6. The `/author` constructor

This is Phase D (depends on Phase A). Client-only, code-split, no backend.

### 6.1 Shape

- Routes `/author` (new) and `/author/:hash` (edit an existing stored LabDoc). Lazy-loaded so students never download the authoring bundle.
- Two panes: a section-list editor on the left (add, remove, reorder, per-section forms), a **live preview on the right using the real `SectionRenderer`** so what the author sees is what students get.
- A metadata form: title, author, version label.
- An export action: run `loadUntrustedLabDoc` on the constructor's own output as a self-check, then download `<title>.labframe.json`. A "Save to My Labs" action stores it locally so the author can open it as a student and verify end to end (including PDF export).

### 6.2 The constructor owns ids

Authors never type `fieldId`/`tableId`/`plotId`/`assetId`. The constructor generates unique ids internally (a short stable id per section element). Because identity is the whole-doc hash and an edit is a new identity (decision 7), ids only need to be unique within a doc, not stable across versions.

### 6.3 MVP palette (decision 4)

`instructions` (markdown, sanitized), `objective`, `measurement`, `multiMeasurement`, `concept`, `calculation` (free text or equation editor), `image` (student upload), `dataTable` with **input-only** columns, and `plot` over those input columns (fits chosen from the fixed menu; the app does the fitting math). This is the full safe set: nothing author-supplied executes. Derived columns are the only thing held back, to Phase E.

### 6.4 Simulations and figures

- **Sim picker:** a dropdown of curated, allow-listed simulations plus a URL field validated against the domain allow-list. Seed the allow-list with `phet.colorado.edu`; the concrete list is an open question (section 10). The student app embeds the sim in a sandboxed iframe; the allow-list stops the LabFrame origin from framing arbitrary content.
- **Figures:** an "insert figure" action uploads an image, stores it as an `asset` (base64, capped), and inserts `![alt](asset:<id>)` into the markdown. Reuses the asset decode hardening from the loader.

### 6.5 Integrity agreement editor

A textarea for the author's custom text. The locked capture-disclosure core is shown read-only and is always composed into the final agreement by `compileLabDoc`. Authors cannot remove or weaken it ([ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md)).

### 6.6 Points

A numeric input per section, writing `points` (the runtime schema already carries it). No answer keys, no rubric, no auto-grade (decision 13).

---

## 7. Formula DSL (Phase E, "full" not MVP)

The only execution surface in the entire feature. Built and security-reviewed on its own, after delivery, within the six-month window. See [ADR-0007](../decisions/0007-formula-dsl-safety.md).

- **Language:** numbers (integer, decimal, scientific), identifiers that must resolve to a declared input-column id or an allow-listed constant, binary `+ - * / ^`, unary minus, parentheses, and calls to an **allow-list of functions** (`sqrt abs exp ln log sin cos tan asin acos atan atan2 min max pow floor ceil round`) and constants (`pi`, `e`). No statements, no assignment, no member or property access, no strings, no calls outside the allow-list.
- **Implementation:** a hand-written recursive-descent parser to an AST, evaluated by an interpreter over a numeric scope (the row's input values). No `eval`, no `new Function`. `jsep` (a parser only, no evaluator) is an acceptable dependency if a hand parser is not wanted; **mathjs is not** (large, and its `evaluate` has a history of sandbox-escape CVEs).
- **Structural caps:** source length (500 chars), AST depth (32), node count (200). Unknown identifiers reject at parse time. `deps` are derived from the parsed identifiers, not declared by the author.
- **Output guard:** the result must be finite; otherwise the cell shows an error and never writes `NaN`/`Infinity` (this also closes work-queue item 9).
- **Compile and re-validate:** `compileLabDoc` turns `formulaExpr` into the closure; `loadUntrustedLabDoc` re-parses and rejects on any deviation, because the doc is untrusted on the student side.
- **Author UI:** a formula field with live validation and a test-row preview.

There is no sandbox to escape because the language has no dangerous capability. The worst a malicious author can produce is a wrong number. This is strictly safer than the status quo, where built-in labs carry arbitrary JavaScript.

**Migrating built-ins to LabDoc** (which would let them gain content hashes per decision 8) is explicitly out of scope here and is a separate future effort that depends on this DSL existing.

---

## 8. Threat model

- **The LabDoc is untrusted input** on every consumer (student app, restore-from-PDF, later the inspector). Everything flows through `loadUntrustedLabDoc`. No `dangerouslySetInnerHTML`, no `eval`, no `asset:` resolution that bypasses decode hardening.
- **Author trust is low-stakes for content authenticity** because grading verifies the submitted `labHash` against the published one (section 5.3). The author cannot forge a student submission, and a student cannot silently swap labs.
- **The integrity model is protected by construction** (ADR-0008): the capture disclosure cannot be removed by an author.
- **No new PII at rest.** LabDocs are instructor content, not student data, so ADR-0002 holds (ADR-0006 clarifies its scope).
- **Sim iframes** are domain-allow-listed and sandboxed.

---

## 9. Phasing and handoffs

MVP at delivery = Phases A + B + C + D. "Full" within the window = Phase E.

Dependency order: A blocks everything; B and D can proceed in parallel after A; C depends on A and the envelope-v5 canonicalization fix; E depends on A and D.

Each phase has a self-contained agent handoff in `docs/handoffs/`:

- [Phase A: LabDoc foundations](../handoffs/constructor-phase-a-labdoc-foundations-handoff.md) (schema, compile, load, hash)
- [Phase B: import, persistence, My Labs](../handoffs/constructor-phase-b-import-catalog-handoff.md)
- [Phase C: integrity binding and PDF embed](../handoffs/constructor-phase-c-integrity-binding-handoff.md)
- [Phase D: the /author constructor (MVP palette)](../handoffs/constructor-phase-d-author-ui-handoff.md)
- [Phase E: the formula DSL (derived columns)](../handoffs/constructor-phase-e-formula-dsl-handoff.md)

---

## 10. Definition of done (per phase), non-goals, open questions

**Done, Phase A:** `LabDocSchema`, `compileLabDoc`, `loadUntrustedLabDoc`, and the hash are implemented with unit tests covering valid docs, every rejection path (malformed JSON, schema violations, each cap, bad sim URL, undecodable asset, each broken cross-reference), and hash stability across two runs. No UI.

**Done, Phase B:** a student can drag a `.labframe.json` onto the catalog, see it in "My Labs", open it at `/i/:hash`, fill it out, have answers persist and rehydrate, and re-import the same file to resume. Delete works.

**Done, Phase C:** an imported lab's signed PDF carries `labHash` in the envelope and the embedded `lab.labframe.json`; the hash matches the doc; restore-from-PDF reconstructs lab plus answers; the agreement-core attestation is present. Built-in labs are unchanged.

**Done, Phase D:** a non-developer builds a multi-section lab (including a table and a plot) in `/author`, previews it live, exports a file that passes `loadUntrustedLabDoc`, and round-trips it back into the editor. Sim allow-list and figure embedding work. Integrity core is non-removable.

**Done, Phase E:** authors add derived columns with live-validated formulas; the DSL passes a malicious-input corpus (prototype access, `constructor.constructor`, deep nesting, huge exponents, unknown identifiers) with every case rejected or evaluated to a finite number; no `eval`/`Function` anywhere in the path.

**Non-goals:** course assembly or sequencing; editing the 29 built-in labs through this UI; answer keys or auto-grading; a content backend or CMS; multi-author collaboration or a shared lab library; LMS/LTI distribution; migrating built-ins to LabDoc.

**Open questions:**

1. The concrete simulation-domain allow-list beyond `phet.colorado.edu`.
2. `/author` discoverability: an unlinked route the client bookmarks is the default; an optional shared passphrase gate is available if the client wants it not trivially reachable.
3. Final size caps, tuned against real authored labs.
4. Whether the published authoritative `labHash` is surfaced by the verify tool, the inspector, or only documented for graders.
