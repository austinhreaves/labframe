# ADR-0006: The no-backend lock is PII-scoped; lab content may be stored and distributed

**Status:** Accepted (design brainstorm 2026-06-16)

## Context

[ADR-0002](./0002-no-backend-lock.md) locks LabFrame against server-side storage of student data. The assignment constructor needs authored labs to travel from author to student. Reading ADR-0002 as "no server may ever hold any bytes" would force awkward distribution and was never its intent: its rationale is entirely about FERPA-protected **student** records at rest and the compliance apparatus they trigger (see `docs/DATA_HANDLING.md`). A `LabDoc` is instructor-authored course content, not student PII.

## Decision

The no-backend lock in ADR-0002 is **scoped to student data**. It does not forbid storing or moving **lab content** (`LabDoc`s).

For the constructor, distribution is nonetheless **file import with no backend**: the instructor exports a `.labframe.json`, distributes it through Canvas (already the system of record), and the student imports it into LabFrame. This is the MVP and may remain permanent.

This ADR does not authorize a content backend. It removes the false belief that ADR-0002 forbids one. Should a content store or CMS for `LabDoc`s ever be proposed, it is permissible under ADR-0002 **provided it stores no student data**, but it still requires its own ADR covering availability, author authentication, and its (non-PII) threat surface.

## Consequences

- The constructor ships with zero new infrastructure: no hosting, no CORS, no `?src=` URL, no origin allow-list for fetching labs.
- Authenticity of an authored lab is established at grade time by verifying the submitted `labHash` against the instructor's published hash, not by a server. See [ADR-0009](./0009-labhash-binding-and-embedded-labdoc.md).
- ADR-0002 remains fully in force for student data. Nothing here weakens it.
