# Architecture Overview

LabFrame is a schema-driven React app. Course manifests and lab schemas define what the UI renders; runtime state, persistence, and PDF export are centralized services.

For full product requirements and phase history, see [`REBUILD_SPEC.md`](../REBUILD_SPEC.md).

## Runtime flow

1. Router resolves course/lab route in `src/app/Routes.tsx`.
2. `LabPage` initializes store state for the selected course/lab.
3. Section renderer reads schema and renders worksheet sections.
4. Store persistence saves progress to browser storage.
5. PDF export builds canonical answers, signs them through `/api/sign`, renders PDF, and downloads it.

## Main modules

- `src/domain/schema/` - Zod schemas for course, lab, and signed answers
- `src/content/` - course manifests and lab definitions
- `src/state/` - Zustand store and persistence middleware
- `src/ui/` - route-level pages and schema-driven section rendering
- `src/services/integrity/` - canonicalization and signing contract
- `src/services/pdf/` - PDF rendering and sealing
- `src/services/telemetry/` - opt-in error telemetry
- `src/services/embed/` - allow-listed parent `postMessage` integration

## Security and data boundaries

- Signing secret is server-side only in `api/sign.ts`.
- Telemetry is opt-in per course (`telemetryEndpoint`) and limited to `{ labId, sectionId, message, stack }`.
- Parent frame messaging is allow-list gated by `parentOriginAllowList`; wildcard target origins are never used.

## Build and performance notes

- Vite builds the frontend, with `npm run analyze` producing `dist/stats.html`.
- PDF rendering is lazy-loaded (`@react-pdf/renderer` only loads on export).
- MathLive loads on-demand in the equation editor.
