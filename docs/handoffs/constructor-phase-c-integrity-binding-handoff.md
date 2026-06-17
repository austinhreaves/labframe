# Agent Handoff: Assignment Constructor Phase C (integrity binding and PDF embed)

## Context

You are working on `labframe`, a TypeScript + React + Vite app. The **assignment constructor** lets a client author labs as `LabDoc` files (Phase A: `src/services/authoring/`) that students import (Phase B). Authored labs are mutable data, so the signed submission must prove which lab version a student completed. The full design is `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md`; the binding decision is [ADR-0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md).

This is **Phase C**: bind the LabDoc hash into the signed envelope, embed the LabDoc in the exported PDF, attest the integrity-agreement core, and enable restore-from-PDF for authored labs.

## Prerequisite

The hash must be stable across environments. `src/services/integrity/canonicalize.ts` currently sorts object keys with `localeCompare`, which is locale-dependent (see `docs/SPEC.md` section 6, envelope v5, and work-queue item 2). **The code-unit canonicalization fix must be in before this binding is authoritative.** If it has not landed, do it first (replace `localeCompare` with a UTF-16 code-unit comparison and update its tests), coordinating with the rest of the envelope v5 batch. Do not ship a `v4 + labHash` hybrid; `labHash` is part of v5.

## Required reading before you start

- `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md` section 5 and `docs/SPEC.md` section 6 (envelope v5).
- [ADR-0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md) and [ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md).
- `src/domain/schema/answers.ts` - the `LabAnswers` envelope (currently `schemaVersion: 4`).
- `src/services/integrity/buildAnswers.ts` - `buildAnswersFromStore`.
- `src/services/integrity/canonicalize.ts` - the prerequisite fix lives here.
- `src/services/pdf/seal.ts` - the `pdf-lib` attach step you extend.
- `src/services/integrity/agreementText.ts` and the Phase A `CAPTURE_DISCLOSURE_CORE` constant.
- Phase B's store fields `labHash` and `labDoc`.

## Goal

An imported lab's signed PDF carries `labHash` in the signed envelope and the canonical `LabDoc` as an embedded attachment; the embedded doc re-hashes to the bound `labHash`; restore-from-PDF reconstructs both lab and answers; the envelope attests the agreement core was present. Built-in labs are unchanged.

## Acceptance criteria

1. **Envelope v5 `labHash`:** `LabAnswers` becomes `schemaVersion: 5` with an **optional** `labHash: string`. Set it in `buildAnswersFromStore` from the store's `labHash` for imported labs; omit it for built-in labs. (Land the rest of the v5 batch per `docs/SPEC.md` section 6 with it, or coordinate so v5 ships coherently.)
2. **Agreement-core attestation:** add a field to `integrity` that asserts the locked capture-disclosure core was present and unmodified (a boolean derived by comparing the resolved agreement against `CAPTURE_DISCLOSURE_CORE`, or a hash of the canonical core). The verbatim `agreementText` continues to be recorded.
3. **PDF embeds the LabDoc:** `sealPDF` attaches the canonical `LabDoc` as `lab.labframe.json` (UTF-8 bytes, like the existing `lab.json`) for imported labs, in both signed and draft exports. The LabDoc is not added to the signed canonical string; only `labHash` is.
4. **Tamper-evidence test:** re-hashing the embedded `lab.labframe.json` equals `answers.labHash`.
5. **Restore-from-PDF (authored):** dragging a signed or draft PDF onto the catalog extracts both attachments via `pdf-lib`, runs `loadUntrustedLabDoc` and the existing untrusted answers loader, verifies the embedded doc re-hashes to `answers.labHash`, then loads the lab (`/i/:hash`) and rehydrates the answers. Reuse the Phase B import path.
6. **Built-in labs unchanged:** their envelopes omit `labHash`, their PDFs gain no `lab.labframe.json`, and existing PDF/signing tests still pass (updated only for the v5 envelope changes).

## Implementation steps

1. Confirm or implement the code-unit canonicalization fix in `canonicalize.ts` and its tests.
2. Update `src/domain/schema/answers.ts` to v5 (optional `labHash`, agreement-core attestation, plus the rest of the pre-registered v5 changes).
3. Update `buildAnswersFromStore` to set `labHash` and the attestation for imported labs.
4. Extend `sealPDF` with the second attachment, gated on the lab being imported.
5. Implement the authored restore-from-PDF extraction and wire it to the Phase B import flow.
6. Tests: envelope shape for imported vs built-in; tamper-evidence; restore-from-PDF round-trip (export -> drop PDF -> lab and answers restored); attestation true when core present.

## Out of scope (do NOT do these)

- Hashing or migrating built-in labs to `LabDoc`. Built-ins keep their implicit identity.
- The `/api/verify` endpoint or the integrity inspector (separate roadmap items); just ensure `labHash` is in the signed canonical so they can consume it later.
- The `/author` constructor UI (Phase D) and the DSL (Phase E).

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass; `npm run test:e2e` for export flows.
- An imported lab's PDF embeds a `lab.labframe.json` that re-hashes to the signed `labHash`; a built-in lab's PDF does not.
- Restore-from-PDF reconstructs an authored lab and its answers from the PDF alone.
- The envelope is internally consistent at v5; no `v4 + labHash` hybrid exists.
