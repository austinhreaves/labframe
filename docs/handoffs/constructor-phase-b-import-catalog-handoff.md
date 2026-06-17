# Agent Handoff: Assignment Constructor Phase B (import, persistence, My Labs)

## Context

You are working on `labframe`, a TypeScript + React + Vite app that renders physics lab worksheets from declarative `Lab` schemas. The **assignment constructor** lets a client author labs as serializable `LabDoc` files that students import. Phase A built the data foundation (`src/services/authoring/`: `compileLabDoc`, `loadUntrustedLabDoc`, `hashLabDoc`). The full design is `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md`.

This is **Phase B**: the student read path. A student imports a `.labframe.json` file, sees it in a "My Labs" catalog, opens it, fills it out, and resumes later. No backend.

## Required reading before you start

- `docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md` section 4 (student read path). This handoff implements it.
- Phase A modules in `src/services/authoring/` (you call `loadUntrustedLabDoc` and `compileLabDoc`).
- `src/app/Routes.tsx` - the route table and the `labsByCourse` registry. Note `/lab/:slug` already exists; you must use `/i/:hash`.
- `src/ui/Catalog.tsx` - where "My Labs" is added.
- `src/ui/LabPage.tsx` and `src/state/labStore.ts` - `initLab(courseId, labId, lab)` and the store shape.
- `src/state/persistence/keys.ts` - the `(courseId, labId, studentName)` key scheme you reuse.
- `src/state/persistence/idb.ts`, `browserAdapter.ts`, `types.ts` - the IndexedDB adapter.

## Goal

A student can drag a `.labframe.json` onto the catalog (or use an "Open lab file" action), see it in "My Labs", open it at `/i/:hash`, fill it out with answers that persist and rehydrate, and re-import the same file to resume. Delete works.

## Acceptance criteria

1. **Import entry points:** drag-drop a `.labframe.json` onto the catalog and an explicit "Open lab file" button. Both run `loadUntrustedLabDoc`; on `ok: false`, show the returned error in the existing dialog primitive (`src/ui/AccessibleDialog.tsx`), not `window.alert`.
2. **LabDoc storage:** store the validated `LabDoc` bytes in IndexedDB at `labdoc:<labHash>`. Maintain a small index (one localStorage JSON or an IndexedDB store) of `{ labHash, title, author, humanVersion, importedAt }`. Add the helpers near `src/state/persistence/`.
3. **"My Labs" catalog section:** `src/ui/Catalog.tsx` renders a section listing imported labs from the index, each with an open link to `/i/:hash` and a delete action. Deleting removes the `labdoc:<hash>` entry and the index row, and offers to also clear that lab's answers (`lab:imported:<hash>:*`). Surface orphaned answers from superseded versions here for cleanup.
4. **Route `/i/:hash`:** add a route that loads the stored `LabDoc`, runs `compileLabDoc`, builds a synthetic imported `Course` (`{ id: 'imported', title: doc.meta.title, ... }`), and mounts `LabPage` with `key={`imported-${hash}`}`. Do **not** reuse `/lab/:slug`. If the hash is unknown, `Navigate` to `/`.
5. **Persistence keying:** answers persist at `lab:imported:<labHash>:<studentName>` and image uploads at `img:imported:<labHash>:<studentName>:<imageId>` via the existing `makeLabKey`/`makeImageKey` with `courseId: 'imported'`, `labId: labHash`. Confirm `initLab('imported', labHash, compiledLab)` hydrates and re-imports resume.
6. **Store retains the hash and doc:** the lab store keeps the active imported lab's `labHash` and its canonical `LabDoc` in state (add fields), so Phase C can bind `labHash` into the envelope at sign time. Built-in labs leave these undefined.

## Implementation steps

1. Add persistence helpers for `labdoc:<hash>` storage and the My Labs index.
2. Add the import handler (shared by drag-drop and the button) that validates, stores, indexes, and navigates to `/i/:hash`.
3. Extend `Catalog.tsx` with the My Labs section and delete flow.
4. Add the `/i/:hash` route and its page component in `src/app/Routes.tsx` (mirror `LabRoutePage`).
5. Add `labHash` and `labDoc` fields to the store state; set them on the imported-lab init path.
6. Tests: an import round-trip (load -> store -> open -> persist -> rehydrate), a delete flow, and an unknown-hash route redirect.

## Out of scope (do NOT do these)

- The envelope, `labHash` in the signature, PDF embedding, or restore-from-PDF for authored labs. That is Phase C (restore-from-PDF needs Phase C's embedded doc).
- The `/author` constructor UI. Phase D.
- Derived columns / the DSL. Phase E.
- Any backend, hosted file, or `?src=` URL loading. Import is local files only.

## Definition of done

- `npm run lint && npm run typecheck && npm test` all pass; `npm run test:e2e` if you touched layout or interaction.
- A `.labframe.json` exported from a fixture imports, appears in My Labs, opens at `/i/:hash`, persists answers, and resumes on re-import.
- Built-in labs and their routes are unchanged.
