# LabFrame - agent working notes

LabFrame is an online worksheet app for ASU physics labs: students run a simulation,
fill a structured worksheet, and export a signed PDF report. React 18 + TypeScript +
Vite, Zustand state, Zod schemas, chart.js, `@react-pdf/renderer` + `pdf-lib`, Vitest +
Playwright. No backend lock-in (see `docs/decisions/0002-no-backend-lock.md`); the only
server code is `api/sign.ts` (HMAC report signing).

The source of truth for product + engineering scope is `docs/SPEC.md`. Read it before
making non-trivial product changes. Architecture overview: `docs/ARCHITECTURE.md`.

## Environment gotchas (read first)

- **The `PowerShell` tool is broken in this harness** - it returns exit 1 even on a
  trivial command. Do not use it. Run PowerShell via the `Bash` tool instead:
  `pwsh -NoProfile -Command '...'`. Plain POSIX commands also work through `Bash`.
- **Typecheck is `npm run typecheck`** (`tsc -b --noEmit`), not `npx tsc --noEmit`.
  `exactOptionalPropertyTypes` is set in `tsconfig.app.json` / `tsconfig.api.json` only,
  so a flat `tsc` invocation will not reproduce CI's results.
- Node is pinned to 22.x (`.nvmrc`); run `nvm use` if versions drift.

## Commands

| Task                        | Command                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Dev server (frontend)       | `npm run dev`                                                                          |
| Dev server with `/api/sign` | `npm run dev:vercel`                                                                   |
| Typecheck                   | `npm run typecheck`                                                                    |
| Lint (warnings fail)        | `npm run lint`                                                                         |
| Format check / write        | `npm run format:check` / `npm run format`                                              |
| Unit tests                  | `npm test` (Vitest)                                                                    |
| E2E tests                   | `npm run test:e2e` (Playwright)                                                        |
| Full local CI               | `npm run ci` (typecheck + lint + format:check + test)                                  |
| Verify a lab                | `npm run verify:lab -- <labId>` or `-- <path/to/lab.lab.ts>` (use `--all` to list IDs) |
| Verify every lab (CI gate)  | `npm run verify:labs` (`verify-lab --all`, errors-only; runs in CI after unit tests)   |
| Mutation audit (on-demand)  | `npm run test:mutation` (Stryker; scoped to the modules in `stryker.config.json`)      |

Run `npm run ci` before opening or updating a PR. Add `npm run test:e2e` for any UI,
accessibility, or routing/layout change. Lint warnings fail CI (`--max-warnings 0`).

**Mutation testing is an on-demand audit, not a CI gate.** `npm run test:mutation` runs
Stryker over the pure, high-blast-radius modules listed in `stryker.config.json`
(canonicalize, buildAnswers, latexToUnicode, leastSquares, persistence migrations) to
check whether the existing tests actually catch injected bugs. Run it periodically or
before a release, not per-PR; review the report under `reports/mutation/` and either add
the missing assertion for each survived mutant or consciously accept it. Do not widen the
`mutate` scope to UI/IO code (slow, noisy survivors); those are covered by e2e + axe.

**E2e test authoring note:** navigate directly to a lab route (`page.goto('/c/:courseId/:labId')`)
rather than clicking catalog links. Catalog visibility (`enabled`, `group`) is independent of lab
functionality; a lab can be disabled in the manifest while the route still resolves, so catalog-link
selectors break silently when a lab is hidden.

## Where things live

- `src/content/labs/<course>/` - lab definitions. The filename suffix is not the enable
  signal: the **course manifest** (`enabled: true`) is the source of truth, and many shipping
  labs are `*.draft.lab.ts`. A course can also reuse another course's lab object (the enabled
  PHY 114 sequence pulls several labs straight from `phy132/`), and some `phy114/*.draft.lab.ts`
  combined labs are `enabled: false` retired source drafts (split into the granular enabled labs,
  kept for grader record access). When auditing "the PHY 114 labs," start from the manifest, not
  the directory. Courses: `phy114`, `phy132`, with `phy112` in progress.
- `src/content/courses/` - course manifests (which labs are enabled, lab numbers).
- `src/domain/schema/` - Zod schemas; `lab.ts` validates every lab definition.
- `src/services/integrity/` - canonicalization + signing of the answer envelope.
- `src/services/pdf/` - PDF report rendering (`Document.tsx`, markdown -> PDF pipeline).
- `src/state/` - Zustand store + persistence (IndexedDB) middleware.
- `api/sign.ts` - serverless HMAC signing endpoint.
- `docs/decisions/` - ADRs. `docs/specs/` - feature specs. `docs/handoffs/` - in-flight work.
- `docs/theory/` - per-lab student-facing theory references. Each lab has a
  `lab-NN-kebab-name.md` (source of truth) and a matching `.html` (Canvas embed artifact).
  See `docs/handoffs/theory-references-handoff.md` for the authoring process and the
  folder-to-lab mapping for the external PHY 114 instructional materials.

## Authoring or editing a lab

Full steps: `docs/AUTHORING_A_LAB.md`. In short: copy a nearby `*.lab.ts`, update
`id`/`title`/`description`/`simulations`/`sections`, export it from
`src/content/labs/index.ts`, enable it in the course manifest with `enabled: true`, then
verify in the browser that sections render, inputs save, plot/table labels are right, and
**PDF export works** for the affected lab.

**Catalog rendering by manifest flags:**

- `enabled: false` - lab is completely hidden from the catalog grid (route still resolves for graders)
- `enabled: true, group: 'core'` - full clickable card in the catalog
- `enabled: true, group: 'enrichment'` - visible but grayed-out "Coming soon" card (not navigable from catalog)

To review an existing lab for defects, use the `verify-lab` skill (deterministic checks
plus a theory/physics/clarity review) or run `npm run verify:lab -- <labId>` for the
mechanical checks alone. The checker flags LaTeX that leaks as raw text in the PDF (e.g.
`\tag`, `\tfrac` are not handled by the unicode converter in
`src/services/pdf/markdown/latexToUnicode.ts`). The checker does NOT catch
`unit: 'Symbol(unevaluable)'`, a legacy-migration artifact that is a valid string but renders as
the literal column unit; grep for it and drop the field or set a real unit.

### Lab content style conventions

- **Never use em dashes (`-`)** anywhere - prose, content strings, prompts, docs, commit
  messages. Use a hyphen or rewrite.
- Givens render as callouts; concept-check prompts use warning callouts.
- Prefix procedural steps with `**Step N.**`. Use bold sparingly. Separate zones with HRs.
- **PHY 114 is algebra-based and has no uncertainty / error propagation.** Keep percent
  error, but never add uncertainty columns or propagation to 114 labs. (PHY 132 does use
  uncertainty.)

## Conventions

- Match the style of surrounding code; the repo is Prettier- and ESLint-clean.
- No secrets or `.env` values in commits.
- Telemetry payloads are deliberately minimal (no answers, no PII) - preserve that.
- Parent-frame messaging is allow-list gated (`parentOriginAllowList`); never
  `postMessage(..., '*')`.
- Branch from `main`; keep PRs focused with a summary and test plan (`CONTRIBUTING.md`).

## Keeping this file current

If you had to re-derive something this session that belongs here, run `/reflect` (or just
update this file). The goal is that the next session starts knowing what this one learned.
