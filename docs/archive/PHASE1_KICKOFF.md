# Phase 1 Kickoff Checklist

Phase 1 goal: render Snell's Law from schema with in-memory answers only. No persistence, PDF, or integrity signing work in this phase.

## Deliverables mapped to spec

1. Route shell
   - Add course roots and lab route:
     - `/`
     - `/phy_114`
     - `/lab/:slug`
2. Schema-driven renderer primitives
   - `instructions`
   - `objective`
   - `measurement`
   - `multiMeasurement`
   - `dataTable` (includes derived columns)
   - `plot`
   - `calculation`
   - `concept`
   - `image`
3. `LabPage` composition
   - Load lab by slug.
   - Render sections in schema order.
4. Zustand answer store (in-memory only)
   - Controlled field updates.
   - `onBlur` save semantics to store actions.
   - No localStorage/IndexedDB yet (Phase 2).
5. Course catalog wiring
   - Launch Snell's Law from each course manifest.
   - Switching labs mounts a fresh empty form.

## Sequenced implementation order

1. Scaffold route shell and static lab loading (read-only render).
2. Implement section primitives with strict prop contracts.
3. Add Zustand store and controlled inputs (`onChange` + `onBlur`).
4. Wire data table derived-column recompute path.
5. Add plot rendering fed by table rows.
6. Connect catalog navigation and lab swapping behavior.
7. Add integration tests and Playwright smoke.

## Test gates before coding complete

1. Unit tests
   - Section renderer smoke tests per kind.
   - Store reducer/action tests for text and table updates.
   - Derived-column recompute tests from known rows.
2. Integration tests (Vitest + Testing Library)
   - Render `LabPage` with Snell schema and assert all section kinds appear.
   - Fill row 0 values and assert derived values update.
3. E2E smoke (Playwright)
   - Open Snell's Law route.
   - Fill student name.
   - Fill first data row.
   - Confirm derived column updates.
   - Navigate to another lab and verify a fresh empty form.

## Phase 1 done criteria

- A user can complete every section type for Snell's Law in browser.
- Switching labs remounts a clean in-memory state.
- Refresh drops data (intended for Phase 1).
- Tests for unit/integration/E2E happy path are green.
