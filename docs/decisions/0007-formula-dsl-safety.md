# ADR-0007: Derived-column formulas in authored labs use an interpreted arithmetic DSL, never `eval`

**Status:** Accepted (design brainstorm 2026-06-16). Implemented in Phase E of the constructor work.

## Context

Built-in labs express derived columns as JavaScript functions, which is safe only because developers write them and they compile into the bundle. An authored lab is data loaded at runtime from an untrusted file, and a derived column needs to compute a value. Evaluating an author-supplied expression with `eval` or `new Function` is remote code execution in the student's browser. Sandboxing JavaScript in a browser is unreliable (`new Function`, prototype walking, `constructor.constructor`).

## Decision

Authored derived columns are written in a small **arithmetic DSL** whose grammar cannot express anything but arithmetic over the table's declared input columns. The fix is to never accept JavaScript, not to sandbox it.

- Allowed: numbers, identifiers that must resolve to a declared input-column id or an allow-listed constant (`pi`, `e`), binary `+ - * / ^`, unary minus, parentheses, and calls to an allow-list of functions (`sqrt abs exp ln log sin cos tan asin acos atan atan2 min max pow floor ceil round`).
- Forbidden by grammar: statements, assignment, member or property access, strings, and any call outside the allow-list.
- Implementation: a hand-written recursive-descent parser to an AST, evaluated by an interpreter over a numeric scope. No `eval`, no `new Function`. `jsep` (parser only) is an acceptable dependency; mathjs is not (large, with a history of sandbox-escape CVEs).
- Structural caps: source length, AST depth, node count; unknown identifiers reject at parse time.
- Output guard: a non-finite result shows a cell error and is never written as `NaN`/`Infinity` (also closes `docs/SPEC.md` work-queue item 9).
- The expression is parsed at compile time into the `(row) => number` closure the existing table machinery calls, and re-parsed by `loadUntrustedLabDoc` because the doc is untrusted.

## Consequences

- There is no sandbox to escape: the language has no dangerous capability. The worst a malicious author produces is a wrong number. This is strictly safer than the status quo of arbitrary JS in built-in labs.
- Authored labs are less expressive than built-in ones (pure arithmetic only). Accepted; it covers the physics-lab cases and keeps the surface provably safe.
- A malicious-input corpus (prototype access, deep nesting, huge exponents, unknown identifiers) is a required pinning test for any future change to the parser or allow-list.
- Any proposal to evaluate author-supplied JavaScript, or to adopt a general expression library with an evaluator, must be argued against this ADR first.
