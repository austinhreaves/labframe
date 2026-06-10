# Integrity Inspector Spec

**Status:** Active, not yet built. Promoted from the integrity hardening draft (formerly `INTEGRITY_DRAFT.md`, repo root) on 2026-06-10.
**Canonical rules moved:** the draft's untrusted-input handling section (render rules, size caps, prompt-injection rules, `loadUntrustedLabJson`) now lives in [`docs/SPEC.md`](../SPEC.md) section 4.4. This document keeps only the inspector itself.
**Scope change:** the draft's text-only image stance is superseded by [ADR-0003](../decisions/0003-images-first-class-hashed.md). The envelope carries hashed image references, and the inspector displays images with decoder hardening (`createImageBitmap()` round-trip, EXIF strip).

Threat model: a student's lab.json is **untrusted input** that will be parsed and rendered by code that runs in TA browsers. The student's text, paste history, field metadata, and image bytes are all attacker-controlled. Treating these inputs as adversarial is cheap; not treating them as such is how `dangerouslySetInnerHTML` ends up in a TA viewer because it was three lines shorter than the safe option. Every file the inspector accepts is processed by `loadUntrustedLabJson` (SPEC.md section 4.4) before any rendering.

---

## Integrity Inspector — sketch

A standalone static page that gives TAs the forensic view of a student's lab submission that the grading PDF deliberately does not carry. Built once, deployed once, used as needed. Not part of the student-facing app's runtime path.

**Why separate:** The grading PDF is the routine surface — italics where unambiguous, Process Record appendix for the rest, conservative substring matching per [ADR-0001](../decisions/0001-paste-attribution-matching.md). That surface should stay calm and defensible because it drives grades. The inspector is the investigation surface — fuzzy matching, edit-distance heuristics, timeline reconstruction, paste-source breakdown — used only when something is flagged. False positives in the inspector are free because no grade is assigned from it. Mixing the two surfaces makes the grading PDF noisier for the 95% case to serve the 5% case.

**Inputs.** Drag-and-drop, no upload to any server:

- A bare `lab.json` file.
- A signed PDF produced by the student-facing app — the inspector extracts the embedded `lab.json` attachment via `pdf-lib` (`PDFDocument.load(bytes)` → walk attachments dictionary → extract by name `lab.json`).

In both cases the file is processed by `loadUntrustedLabJson` (SPEC.md section 4.4) before any rendering.

**Views (single-page, three-tab layout):**

_Tab 1: Field-by-field reconstruction._ Each text field rendered side-by-side: left column is the final submitted text; right column is a stacked sequence of paste events in chronological order. Diff highlighting (LCS-based, e.g., `diff-match-patch` or `fast-diff`) shows which spans of final text overlap which paste, with overlap percentage and edit distance. A header flag per field: `78% of conclusion text matches a single paste event from 14:32:07.` Sortable by overlap percentage descending so high-signal fields surface first.

_Tab 2: Timeline._ All events across all fields rendered chronologically: pastes (with source: clipboard / autocomplete / IME), focus enters and exits, deletes, signing event. Horizontal time axis spanning the lab session, vertical lanes per field. Hover for content. Quick visual answer to _"how was this lab actually constructed?"_ — long quiet stretches with no activity are different from continuous typing, which is different from three pastes-then-submit.

_Tab 3: Paste inventory._ Flat sortable table of every paste event in the submission. Columns: timestamp, field, source, length, content (truncated with hover-to-expand), still-present-in-final (boolean from substring match), best-LCS-overlap with any field. Filterable by source and by length. Exportable to CSV for case files.

**Tech choices:**

- Vite + React + TypeScript strict, same as the main app. Single-page, no router needed.
- `@react-pdf/renderer` is **not** needed here — this tool consumes PDFs, doesn't produce them. Use `pdf-lib` for attachment extraction.
- `diff-match-patch` for LCS / diff visualization. ~30 KB gzipped, no transitive deps worth worrying about.
- Zustand for tab state; no persistence needed (the tool is per-session).
- Strict CSP headers per SPEC.md section 4.4 in the deployed `index.html`.
- No backend. No telemetry. No external requests at runtime. Lighthouse "fully offline after first load" should pass.

**Repo location.** Two options:

- **Sibling subdirectory in `labframe/`:** `tools/integrity-inspector/` with its own `vite.config.ts` and `package.json` — shares `src/domain/schema/` and `src/services/integrity/` with the main app via TypeScript path aliases. Pro: zero schema drift; one source of truth for `LabAnswers`. Con: complicates the main app's build config slightly.
- **Separate repo:** clean separation, but requires either copying the schema or publishing it as an internal package. Risk of drift.

Recommendation: sibling subdirectory. Schema drift is a real cost and the build config bump is a one-time setup.

**Deployment — client-only, fixed.** Static output (`vite build`) to a separate Vercel project or a subpath of the existing one (e.g., `labframe.app/inspector`). **No serverless functions, ever.** The tool is purely client-side: the TA drops a file, JavaScript in their browser parses it, the page renders the views. Nothing is uploaded, transmitted, logged, or persisted. This is a deliberate architectural lock, not a v1 simplification — the moment the inspector grows a "submit flagged case" button or any other server-touching feature, it becomes a system that handles student data at rest with all the FERPA, ASU IT review, and storage-policy implications that entails (see [ADR-0002](../decisions/0002-no-backend-lock.md)). Keep it client-only and the tool stays a calculator, not a record system. If TAs want to share findings, they screenshot or export a CSV from Tab 3 and route it through the existing case-management channels (Slack DM to the integrity coordinator, Canvas message, whatever the current process is).

Authentication: none required. The page can ship at a public URL because possessing a student's `lab.json` is itself the authorization to inspect it — graders already hold the file via Canvas download. If ASU IT later requires SSO at the deployment layer for unrelated reasons, add it at the Vercel project level; the application code does not change.

**Phase placement.** Next integrity build after the `/api/verify` endpoint, per SPEC.md section 4.5. Cheap now that the schema is stable. Estimated ~1–2 days of agent work given the canonical `LabAnswers` schema is the contract. Builds the same `loadUntrustedLabJson` loader that resume-from-PDF reuses.

**Definition of done:**

- Drop a `lab.json` or a signed PDF onto the page → all three tabs render with the correct data.
- All untrusted-input rules from SPEC.md section 4.4 enforced; oversized or malformed inputs rejected with a clear error.
- Snapshot tests against a hand-crafted fixture covering: clean submission, heavy-paste submission, empty submission, malformed JSON, oversized JSON, PDF without attached lab.json, PDF with corrupted attachment.
- Lighthouse: 100 / 100 / 100 / 100; CSP headers verified by `curl -I`; no external network requests in DevTools when loading a lab.json.

**Explicit non-goals:**

- Not a grading tool. Does not assign or modify grades. Does not write to Canvas.
- Not a server. No backend, no API, no database, no persistence — see the deployment section. This is locked, not deferred.
- Not a bulk-batch tool in v1. One submission at a time. Bulk batch is a follow-on if TAs ask for it; if it lands, it stays client-side (drop a folder of lab.json files, render a summary table in the same page).
- Not a cheating-detection algorithm. The inspector surfaces evidence; humans interpret.
- Does not modify the input file. Read-only.
- Image display is in scope per ADR-0003, with decoder hardening; image _forensics_ (similarity search, reverse lookup) is not.
