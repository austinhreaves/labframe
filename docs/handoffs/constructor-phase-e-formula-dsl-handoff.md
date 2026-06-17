# Agent Handoff: Assignment Constructor Phase E (the formula DSL, derived columns)

## Context

You are working on `labframe`, a TypeScript + React + Vite app. The **assignment constructor** lets a client author labs as `LabDoc` data (Phases A-D). The MVP shipped with input-only data tables. This phase adds **derived columns** to authored labs, which requires evaluating an author-supplied formula at runtime. Built-in labs do this with JavaScript functions; an authored lab cannot, because evaluating author-supplied JavaScript from an untrusted file is remote code execution in the student's browser.

This is **Phase E**, the "full" capability deferred from delivery. It is the only execution surface in the entire feature, so it is built and security-reviewed on its own. The binding decision is [ADR-0007](../decisions/0007-formula-dsl-safety.md).

## Required reading before you start

- [ADR-0007](../decisions/0007-formula-dsl-safety.md) (the DSL safety decision) and `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md` section 7.
- `src/state/labStore.ts` - `recomputeDerivedColumns` calls `column.formula(numeric)`. Your compiled formula must satisfy that exact `(row: NumericRow) => number` interface.
- `src/domain/schema/lab.ts` - `DerivedColumnSchema` (the runtime shape you compile to: `deps`, `formula`, `precision`).
- `src/domain/schema/labDoc.ts` and `src/services/authoring/compileLabDoc.ts` (Phase A) - you extend both.
- `src/services/authoring/loadUntrustedLabDoc.ts` (Phase A) - you add formula re-validation here.

## Goal

Authors add derived columns with live-validated formulas written in a small arithmetic language. The language cannot express anything but arithmetic over the table's declared input columns. The compiled formula plugs into the existing `recomputeDerivedColumns` unchanged. A malicious-input corpus is rejected or safely evaluated. No `eval`, no `new Function`.

## Acceptance criteria

1. **Parser and evaluator in `src/services/authoring/formula/`:**
   - Grammar: numbers (integer, decimal, scientific), identifiers (must resolve to a declared input-column id or a constant), binary `+ - * / ^`, unary minus, parentheses, and calls to an allow-list of functions.
   - Function allow-list: `sqrt abs exp ln log sin cos tan asin acos atan atan2 min max pow floor ceil round`. Constants: `pi`, `e`.
   - Forbidden by grammar (must not parse): statements, assignment, member/property access, strings, any call outside the allow-list.
   - Implementation: a hand-written recursive-descent parser to an AST, evaluated by an interpreter over a numeric scope. `jsep` (parser only) is acceptable; **mathjs is not**. No `eval`, no `new Function` anywhere in the path.
2. **Structural caps:** source length 500, AST depth 32, node count 200. Unknown identifiers reject at parse time. `deps` are derived from the parsed identifiers (do not ask the author to declare them).
3. **Output guard:** the evaluated result must be finite; otherwise the table cell shows an error and never writes `NaN`/`Infinity` (this also closes `docs/SPEC.md` work-queue item 9). Update `recomputeDerivedColumns` accordingly if needed.
4. **Schema:** extend `labDoc.ts` so `dataTable` columns may be derived: `{ id, label, kind: 'derived', formulaExpr: string, precision? }`. The runtime `DerivedColumnSchema` already exists.
5. **Compile:** `compileLabDoc` parses each `formulaExpr` into the `(row) => number` closure and attaches it as `column.formula`, with `deps` from the parse. Cache the compiled function per column.
6. **Re-validate on load:** `loadUntrustedLabDoc` re-parses every `formulaExpr` and rejects the doc on any deviation (it is untrusted input).
7. **Author UI:** a formula field in the Phase D data-table editor with live validation and a test-row preview (enter sample input values, see the computed result or the error).
8. **Security corpus test:** a fixture set including `constructor.constructor`, `__proto__`, `this`, property access, string literals, calls to non-allow-listed names, deeply nested expressions beyond the depth cap, oversized source, and huge exponents. Every case must reject at parse time or evaluate to a finite number. Add a fuzz test that random expressions never throw uncaught or return non-finite without the guard catching it.

## Implementation steps

1. Write the tokenizer, parser, AST types, and interpreter in `src/services/authoring/formula/`.
2. Add the caps and the identifier/allow-list resolution.
3. Extend `labDoc.ts` with the derived-column variant and update `compileLabDoc` and `loadUntrustedLabDoc`.
4. Update `recomputeDerivedColumns` for the output guard.
5. Add the derived-column editor and test-row preview to the Phase D data-table form.
6. Write the unit tests, the security corpus, and the fuzz test.

## Out of scope (do NOT do these)

- Migrating built-in labs to `LabDoc` (a separate future effort that this DSL would enable).
- Non-arithmetic functions, units, string handling, conditionals, or piecewise logic.
- Any general expression library that ships an evaluator (e.g. mathjs).

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass; `npm run test:e2e` for the authoring flow.
- The security corpus and fuzz test pass; every malicious input rejects or yields a finite number.
- `grep` confirms no `eval(` and no `new Function(` in `src/services/authoring/`.
- An authored lab with a derived column imports, computes correctly in the student app, and round-trips through `/author`.
