# Agent Handoff: Assignment Constructor Phase D (the /author constructor, MVP palette)

## Context

You are working on `labframe`, a TypeScript + React + Vite app that renders physics lab worksheets from declarative `Lab` schemas. The **assignment constructor** lets a client build new labs without a developer. Phase A built the data layer (`src/services/authoring/`: `LabDoc` schema, `compileLabDoc`, `loadUntrustedLabDoc`, `hashLabDoc`). Phase B added import, persistence, and a "My Labs" catalog. The full design is `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md`.

This is **Phase D**: the authoring UI. A non-developer builds a lab in a client-only `/author` route, previews it live, and exports a `.labframe.json`. No backend.

## Required reading before you start

- `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md` section 6 (the constructor) and section 2 (the `LabDoc` shape you produce).
- [ADR-0008](../decisions/0008-integrity-agreement-core-disclosure.md) (the locked agreement core) and [ADR-0005](../decisions/0005-authored-labs-are-data.md).
- `src/ui/sections/SectionRenderer.tsx` and the section views in `src/ui/sections/` - the live preview uses the real renderer.
- `src/domain/schema/labDoc.ts` (Phase A) - what you build and must satisfy.
- `src/services/authoring/loadUntrustedLabDoc.ts` (Phase A) - the export self-check.
- `src/ui/primitives/` - `Field`, `Table`, `Select`, `FileDropzone`, `MarkdownBlock`, `Button`, `AccessibleDialog`. Reuse these.
- `src/ui/Catalog.tsx` (Phase B) - "Save to My Labs" stores the draft locally.

## Goal

A non-developer assembles a multi-section lab (including a data table and a plot), previews it live, exports a file that passes `loadUntrustedLabDoc`, and round-trips it back into the editor. The sim allow-list and figure embedding work; the integrity-agreement core is non-removable.

## Acceptance criteria

1. **Routes:** `/author` (new lab) and `/author/:hash` (edit a stored `LabDoc`), both **lazy-loaded** (`React.lazy`) so students never download the authoring bundle. Confirm the chunk is split (check `npm run analyze`).
2. **Two-pane layout:** a section-list editor (add, remove, reorder via the existing layout primitives) and a **live preview using `SectionRenderer`** so preview matches the student view.
3. **MVP palette only:** forms for `instructions` (markdown), `objective`, `measurement`, `multiMeasurement`, `concept`, `calculation`, `image`, `dataTable` with **input-only** columns, and `plot` over those columns (fit options chosen from the fixed menu). No derived columns (Phase E).
4. **The constructor owns ids:** authors never type `fieldId`/`tableId`/`plotId`/`captionFieldId`/`assetId`. Generate unique ids internally (unique within the doc is sufficient).
5. **Metadata form:** `title`, `author`, `humanVersion`; set `createdAt`/`updatedAt` automatically.
6. **Sim picker:** a dropdown of curated allow-listed simulations plus a URL field validated against `SIM_DOMAIN_ALLOWLIST` (Phase A). Reject out-of-list hosts inline.
7. **Figures:** an "insert figure" action uploads an image, stores it as an `asset` (base64, within Phase A caps), and inserts `![alt](asset:<id>)` into the markdown. Reuse the loader's decode hardening before accepting the image.
8. **Integrity agreement editor:** a textarea for `customText`; the locked capture-disclosure core is shown read-only and is always composed in by `compileLabDoc`. The author cannot remove or edit it.
9. **Points:** a numeric input per section writing `points`.
10. **Export:** run `loadUntrustedLabDoc` on the constructor's own serialized output as a self-check; on success download `<title>.labframe.json`; on failure show what is invalid. Also a "Save to My Labs" that stores it locally so the author can open it as a student and verify end to end (including PDF export).
11. **Round-trip:** `/author/:hash` (or an "Open" action) loads an existing `LabDoc` back into the editor for further editing.

## Implementation steps

1. Add the lazy `/author` and `/author/:hash` routes in `src/app/Routes.tsx`.
2. Build the editor state model (an in-progress `LabDoc`) and the section-form components, one per MVP section kind.
3. Wire the live preview through `compileLabDoc` + `SectionRenderer` (render-only; no persistence side effects).
4. Implement id generation, the sim picker, figure upload to `assets`, the agreement editor with the read-only core, and points inputs.
5. Implement export (with self-check) and "Save to My Labs"; implement round-trip load.
6. Tests: building a lab with a table and a plot produces a `LabDoc` that passes `loadUntrustedLabDoc`; the agreement core is always present in the export; an out-of-list sim URL is rejected; round-trip preserves content (re-export hashes identically).

## Out of scope (do NOT do these)

- Derived columns and the formula DSL. Phase E.
- Course assembly, sequencing, due dates. The unit is a single lab.
- Answer keys, rubrics, auto-grading. Points only.
- Any backend, publishing service, or shared library.
- Editing the 29 built-in labs through this UI.

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass; `npm run test:e2e` for the authoring flow.
- The `/author` bundle is code-split and not loaded on student routes.
- A lab built in the UI exports a file that imports cleanly via Phase B and renders identically to its live preview.
- The integrity-agreement core cannot be removed by the author.
