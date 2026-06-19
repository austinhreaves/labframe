# Agent Handoff: Assignment Constructor Phase A (LabDoc foundations)

## Context

You are working on `labframe`, a TypeScript + React + Vite app that renders physics lab worksheets from declarative `Lab` schemas. A new feature, the **assignment constructor**, lets a client build new labs at runtime. An authored lab is serializable data (`LabDoc`), not compiled code. The full design is `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md`; the binding decisions are [ADR-0005](../decisions/0005-authored-labs-are-data.md) through [ADR-0009](../decisions/0009-labhash-binding-and-embedded-labdoc.md).

This is **Phase A**: the data foundation. It is pure logic with **no UI**. Everything you build here is consumed by later phases (import, integrity binding, the author UI).

## Required reading before you start

- `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md` sections 2 and 3 (the `LabDoc` format and the runtime seam). This handoff implements them.
- [ADR-0005](../decisions/0005-authored-labs-are-data.md) (authored labs are data) and [ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md) (the locked agreement core).
- `src/domain/schema/lab.ts` - the runtime `Lab`/`Section` schemas you compile to.
- `src/state/labStore.ts` - `recomputeDerivedColumns` shows the `column.formula(numeric)` call site you must keep compatible.
- `src/services/integrity/canonicalize.ts` - reuse this for hashing.
- `src/services/integrity/agreementText.ts` - `resolveIntegrityAgreementText`, how the runtime agreement is resolved.
- `docs/SPEC.md` section 4.4 - the untrusted-input rules your loader must enforce.

## Goal

Implement the `LabDoc` schema and the three pure functions that bridge it to the runtime: compile, load (hardened), and hash. Unit-test them thoroughly.

## Acceptance criteria

1. **New `src/domain/schema/labDoc.ts`** exporting `LabDocSchema` (Zod) and inferred types.
   - `schemaVersion: z.literal(1)`.
   - `meta`: `title`, `author` (required), `authorContact?`, `humanVersion?`, `createdAt`, `updatedAt`.
   - `simulations`: same shape as `SimulationSchema` in `lab.ts`.
   - `integrityAgreement?: { customText?: string }` (author custom text only; the core is never stored here).
   - `assets`: record of `{ mime, dataBase64, bytes }` with `mime` restricted to `image/png | image/jpeg | image/webp` (add `image/svg+xml` only if you also wire a sanitizer; otherwise leave it out).
   - `sections`: the MVP palette only - `instructions`, `objective`, `measurement`, `multiMeasurement`, `concept`, `calculation`, `image`, `dataTable` with **input columns only**, and `plot`. **Do not add derived columns or `formulaExpr`** (that is Phase E).
2. **`src/services/authoring/compileLabDoc.ts`** exporting `compileLabDoc(doc: LabDoc): { lab: Lab; assets: Record<string, Blob> }`.
   - Maps each `LabDoc` section to a runtime `Section`.
   - Decodes `assets` base64 into `Blob`s.
   - Composes the integrity agreement: `meta`/`customText` plus the **locked capture-disclosure core** (a single exported constant, e.g. `CAPTURE_DISCLOSURE_CORE`), set on `lab.studentInfo.integrityAgreementText` so `resolveIntegrityAgreementText` works unchanged. The core must always be present in the output, regardless of `customText`.
   - The result `lab` must satisfy `LabSchema` from `lab.ts` (round-trip: `LabSchema.parse(compileLabDoc(doc).lab)` succeeds).
3. **`src/services/authoring/loadUntrustedLabDoc.ts`** exporting `loadUntrustedLabDoc(input: ArrayBuffer | string): Promise<{ ok: true; doc: LabDoc; labHash: string } | { ok: false; error: string }>`.
   - try/catch JSON parse; reject on failure.
   - `LabDocSchema` validation; reject on any violation.
   - Caps (reject the whole file, never truncate): per-asset 2 MB decoded, total assets 8 MB, asset count 20, total JSON 12 MB, section count 200, markdown block 50 KB. Put the numbers in named constants.
   - Validate every `simulations[*].url` host against a `SIM_DOMAIN_ALLOWLIST` (seed with `phet.colorado.edu`; one exported constant).
   - Asset hardening per [ADR-0003](../decisions/0003-images-first-class-hashed.md): allow-listed image mimes only, `createImageBitmap()` decode round-trip, reject anything that does not decode as its declared type.
   - Cross-reference invariants: every `plot.sourceTableId`/`xCol`/`yCol` resolves to a real table and column; all `fieldId`/`tableId`/`plotId`/`captionFieldId` unique within the doc; every `asset:<id>` reference in markdown resolves to an asset.
   - Returns a student-readable `error` string on any rejection.
4. **`src/services/authoring/labHash.ts`** exporting `hashLabDoc(doc: LabDoc): Promise<string>` = hex SHA-256 of `canonicalize(doc)` via Web Crypto `crypto.subtle.digest`. `loadUntrustedLabDoc` uses it to populate `labHash`.
5. **Unit tests in `tests/unit/`** covering: a valid doc compiles and parses; the agreement core is always present in the compiled lab even when `customText` is set and when it is absent; each rejection path (malformed JSON, each schema violation class, each cap, a bad sim URL, an undecodable asset, each broken cross-reference); hash stability (same doc hashes identically across two calls) and sensitivity (a one-byte content change changes the hash).

## Implementation steps

1. Add `src/domain/schema/labDoc.ts`; export its types from `src/domain/schema/index.ts`.
2. Create `src/services/authoring/` with `compileLabDoc.ts`, `loadUntrustedLabDoc.ts`, `labHash.ts`, and an `index.ts` barrel.
3. Define `CAPTURE_DISCLOSURE_CORE` (use the disclosure wording already present in built-in labs' first `instructions` block as the reference, e.g. in `src/content/labs/phy112/capacitorsSeriesParallel.lab.ts`).
4. Write fixtures under `tests/unit/fixtures/` (a clean LabDoc, plus malformed variants).
5. Write the tests.

## Out of scope (do NOT do these)

- Any UI. No `/author` route, no catalog changes, no import handler.
- Derived columns, `formulaExpr`, or the DSL. That is Phase E and the schema must not include them yet.
- Persistence, the envelope, the PDF. Phases B and C.
- `image/svg+xml` support unless you also ship a sanitizer.

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass.
- `compileLabDoc`, `loadUntrustedLabDoc`, and `hashLabDoc` exist with the signatures above and full test coverage of the rejection paths.
- No file under `src/ui/` changed. No imports of React in `src/services/authoring/`.
- `loadUntrustedLabDoc` rejects every malformed fixture with a clear, student-readable error.
