# ADR-0009: Bind `labHash` in the envelope and embed the LabDoc in the PDF

**Status:** Accepted (design brainstorm 2026-06-16). Rides envelope v5 (`docs/SPEC.md` section 6).

## Context

Built-in labs are compiled in, so "which lab did this student complete" is implicit and trusted. Authored labs are mutable client data, so that relationship stops being self-evident: a lab edited after submission could make a correct answer look wrong, with no recourse, and a student could complete a different file than the one assigned. The integrity model already binds the student's answers with an HMAC signature; it does not bind the lab.

## Decision

**Bind the lab.** The canonical answer envelope gains an optional `labHash: string` (hex SHA-256 of the canonical `LabDoc`). It is present for imported labs and omitted for built-in labs, which keep their implicit identity (the `labId` plus the deployed app build) until they migrate to `LabDoc`. Because `labHash` is in the signed canonical string, the signature covers "these answers, for this exact authored version."

**Embed the LabDoc.** `sealPDF` attaches the canonical `LabDoc` as `lab.labframe.json` alongside the existing `lab.json` answers, for imported labs and in draft exports. The LabDoc is not in the signed string; only its hash is. It is tamper-evident: re-hash the embedded doc and compare to the signed `labHash`. This makes the PDF self-describing (lab plus answers plus signature) and powers restore-from-PDF for authored labs.

Authenticity is verified at grade time: the instructor publishes the assignment's authoritative `labHash`, and a grader confirms the submission matches. No backend is involved.

**Prerequisite:** a stable cross-environment hash requires the code-unit canonicalization fix (envelope v5, `docs/SPEC.md` work-queue item 2), which must land before or with this binding. A locale-dependent hash would produce false tampering accusations.

## Consequences

- Two grading semantics transitionally: imported labs carry `labHash`; built-ins do not. Accepted until any built-in migration.
- PDFs grow by the size of the embedded `LabDoc` (small JSON; figures are capped). The embedded doc is untrusted on re-import and must pass through `loadUntrustedLabDoc`.
- The `labHash` field and the embedded-doc attachment batch into envelope v5; no separate envelope version is spent.
- Disputes and re-grading become provable for authored labs. Building the constructor without this would leave authored labs unverifiable.
