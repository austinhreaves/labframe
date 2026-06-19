# ADR-0008: The integrity agreement has a non-removable capture-disclosure core

**Status:** Accepted (design brainstorm 2026-06-16). Refines [ADR-0004](./0004-disclosure-not-prevention.md).

## Context

[ADR-0004](./0004-disclosure-not-prevention.md) makes LabFrame's integrity model ethical by disclosure: students are told, before they work, that pastes, autocomplete, and edit timing are captured and printed in the PDF. Capture without disclosure is a trap. The assignment constructor lets authors write lab content, and authors want to customize the integrity agreement wording per course. Letting an author freely rewrite the entire agreement would let them delete the capture disclosure, which would record students without telling them, the exact thing ADR-0004 forbids, and would make the FERPA posture in `docs/DATA_HANDLING.md` per-lab and unverifiable.

## Decision

The integrity agreement for an authored lab is composed of two parts:

- A **locked capture-disclosure core**: a short, fixed, non-removable statement that pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF. Authors cannot edit or remove it.
- An **author-editable region**: the author writes whatever course-specific text they want, before and around the core.

`compileLabDoc` always composes the core into the agreement; the `LabDoc` stores only the author's custom text (`integrityAgreement.customText`), never an editable copy of the core. The signed envelope records the full verbatim agreement text (as it does today) **plus an attestation** that the core was present and unmodified (a boolean or a hash of the canonical core compared at sign time), so verification tooling can assert the standard disclosure was shown.

## Consequences

- Authors get a full custom voice everywhere except the one sentence that makes the model ethical.
- Verification can answer "did the student accept an agreement containing the standard disclosure?" even for authored labs.
- An author wanting to weaken or remove the capture disclosure cannot, by construction. Any proposal to make the core editable must be argued against this ADR and ADR-0004.
- The "author fully controls the text" option was considered and rejected because it permits recording students without disclosure.
