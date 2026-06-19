# ADR-0005: Authored labs are data (`LabDoc`), distinct from compiled labs

**Status:** Accepted (design brainstorm 2026-06-16)

## Context

The first external client needs to construct new labs without a developer, a git checkout, or a redeploy. Today a lab is a TypeScript module compiled into the bundle, and it contains executable code: `DerivedColumn.formula` is a JavaScript function (`src/domain/schema/lab.ts`, used in `src/state/labStore.ts`). JavaScript functions do not serialize to JSON, and evaluating author-supplied JavaScript at runtime is remote code execution in the student's browser. A runtime authoring capability cannot ship a lab as code.

## Decision

An authored lab is a serializable **`LabDoc`** (JSON, schema in `src/domain/schema/labDoc.ts`). The 29 existing labs stay as compiled TypeScript and are not migrated by this work.

There is one render path. `compileLabDoc(doc: LabDoc) -> { lab: Lab, assets, labHash }` (in `src/services/authoring/`) produces the same runtime `Lab` the section views already render. Built-in labs produce `Lab` directly; authored labs flow through the compiler. The two formats are *producers*; the renderer is a single *consumer*.

A lab's identity is the SHA-256 of its canonical `LabDoc` (`labHash`). This is collision-proof across authors and against built-in ids, and it makes re-importing the same file resume the same work. A changed file is a new identity.

Derived-column formulas in a `LabDoc` are DSL strings (`formulaExpr`), not functions; the compiler turns them into safe closures. See [ADR-0007](./0007-formula-dsl-safety.md).

## Consequences

- A transitional two-format world: compiled labs and `LabDoc`s coexist. The cost is bounded because they unify at `compileLabDoc`; only the producer differs.
- Built-in labs cannot be hashed by the same content mechanism until they migrate to `LabDoc` (their formulas are functions). This is why `labHash` is bound for authored labs first; see [ADR-0009](./0009-labhash-binding-and-embedded-labdoc.md).
- Migrating built-ins to `LabDoc` later is possible and would unify hashing, but it depends on the formula DSL existing and is out of scope for the constructor work.
- The full design is `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md`.
