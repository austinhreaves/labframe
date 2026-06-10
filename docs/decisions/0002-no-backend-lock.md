# ADR-0002: No server-side storage of student data

**Status:** Accepted (design review 2026-04-29; recorded as ADR 2026-06-10)

## Context

LabFrame's defensibility to ASU rests on its data posture: internally developed instructional tool, no vendor agreement, no FERPA-protected records at rest on any server LabFrame controls, one auditable serverless function. See `docs/DATA_HANDLING.md`. Every future feature that wants a database (grading dashboards, submission records, prerequisite tracking, "did they really submit" doubts) threatens that posture, and the first server-side table of student data triggers the full compliance apparatus the design deliberately avoids.

## Decision

LabFrame stores no student data server-side. Concretely:

- Persistence is browser-local only (localStorage JSON, IndexedDB blobs).
- Server functions are stateless and transient: `/api/sign` today, `/api/verify` when it ships. Neither persists nor logs payload contents.
- Canvas is the system of record for submissions and grades; the signed PDF is the portable artifact.
- LTI 1.3, when it arrives, is an authentication change only. Launch parameters may prefill identity; they must not create server-side storage.
- The Integrity Inspector is locked client-only: no upload, no backend, ever.

Pressure valves instead of a database: route record-keeping through Canvas; route portability through the PDF (resume-from-PDF restores state from the embedded canonical JSON).

## Consequences

- Browser-local data can be lost (cleared storage, device switch, incognito). Mitigations: disclosure in the UI, draft exports, and resume-from-PDF.
- No instructor dashboards or cross-student analytics within LabFrame itself.
- Superseding this decision requires a new ADR plus a revision of `docs/DATA_HANDLING.md` and, in practice, ASU IT review.
