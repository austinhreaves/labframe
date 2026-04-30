LabFrame is a screen-native lab environment that pairs an interactive simulation with a structured worksheet in a single, unified view. Students work directly alongside the simulation, recording observations, calculations, and responses in context rather than on a separate document.

As they progress, LabFrame captures their work as a coherent, self-contained record of the lab—preserving both the prompts and the student’s responses. At submission, the session is rendered into a clean, standardized PDF that functions as the official artifact for grading and archiving.

The result is a lab workflow designed for fully online courses: no printing, no file juggling, and no separation between doing the experiment and documenting it

A fully online lab worksheet app for ASU PHY courses, students load a PhET simulation, fill out a structured lab report, and submit a signed PDF carrying the canonical answer JSON as an attachment.

This repo is the clean rebuild of the legacy `physics-labs.up.railway.app` codebase. The full design is in [`REBUILD_SPEC.md`](./REBUILD_SPEC.md). Read that before making non-trivial changes.

## Stack

- **Framework:** React 18 + TypeScript (strict)
- **Build:** Vite 5
- **Routing:** React Router v6
- **Schema:** Zod
- **State:** Zustand (added in Phase 1)
- **Charts:** chart.js + react-chartjs-2 (added in Phase 1)
- **PDF:** `@react-pdf/renderer` + `pdf-lib` (added in Phase 3)
- **Tests:** Vitest + Testing Library + Playwright
- **Deploy:** Vercel (static frontend + one serverless function for signing)

## Getting started

```bash
# Use the pinned Node version
nvm use      # reads .nvmrc

# Install
npm install

# Dev — UI only, no /api routes
npm run dev

# Dev — full stack with serverless functions (recommended once /api/sign matters)
npm i -g vercel        # one-time
vercel link            # one-time, links to the Vercel project
vercel env pull .env.development.local
npm run dev:vercel
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server only |
| `npm run dev:vercel` | `vercel dev` — Vite + serverless functions |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TS check, no emit |
| `npm run lint` | ESLint, zero-warning gate |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier verify |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright |
| `npm run ci` | The full CI pipeline locally |

## Repo layout

```
.
├── api/                        # Vercel serverless functions (one file = one route)
│   ├── README.md
│   └── sign.ts                 # POST /api/sign — HMAC over canonical LabAnswers
├── src/
│   ├── main.tsx                # React entry
│   ├── App.tsx                 # placeholder; Phase 0 builds out from here
│   └── main.css
├── tests/
│   ├── setup.ts                # Vitest setup (jest-dom matchers)
│   ├── unit/                   # Vitest specs
│   └── e2e/                    # Playwright specs
├── .github/workflows/ci.yml    # typecheck · lint · format · test · build
├── REBUILD_SPEC.md             # the canonical design — read this
├── package.json
├── tsconfig.json               # solution-style; references app/node/api configs
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── vercel.json                 # SPA rewrite + function config
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore                  # excludes legacy/ folders
├── .nvmrc
├── .editorconfig
└── LICENSE
```

The Phase 0 agent fleshes out `src/domain/`, `src/state/`, `src/ui/`, `src/services/`, and `src/content/` per the spec.

## Environment variables

Set these in the Vercel dashboard (Settings → Environment Variables), **never** in committed files. Use different values for `Production`, `Preview`, and `Development`.

| Var | Where used | Notes |
|-----|------------|-------|
| `LAB_SIGNING_SECRET` | `api/sign.ts` | HMAC-SHA256 secret. ≥ 32 chars. Generate with `openssl rand -hex 32`. |

`vercel env pull .env.development.local` syncs them locally for `vercel dev`. The `.env*.local` files are gitignored.

## Deployment

This repo is a Vercel project. The Vite build output (`dist/`) is the static site; `api/*.ts` are deployed as serverless functions automatically.

- **Production:** `main` branch → `https://<project>.vercel.app` (or your custom domain)
- **Previews:** every PR gets its own preview URL with `Preview`-scoped env vars
- **SPA routing:** the `vercel.json` rewrite forwards all non-`/api/*` paths to `index.html`, so deep links like `/c/phy114/snellsLaw` work on hard refresh

## Phase status

- [x] Scaffold (this commit)
- [x] **Phase 0** — Schema + one migrated lab (Snell's Law)
- [ ] **Phase 1** — Schema-driven renderer, in-memory state, paste capture
- [ ] **Phase 2** — Persistence (localStorage + IndexedDB), per-(course, lab, student) keying
- [ ] **Phase 3** — PDF service: render, sign, embed canonical JSON
- [ ] **Phase 4** — Migrate remaining labs, resolve `labs/` vs `phy_114/` drift
- [ ] **Phase 5** — A11y, perf, telemetry, docs, 1.0.0

Each phase has a self-contained agent handoff prompt in `REBUILD_SPEC.md` §6.

## Legacy code

The original codebase lives in `physics-labs.up.railway.app/` on disk and is excluded from version control. It's there as reference for content migration in Phases 0 and 4. Phase 5 deletes it from disk once Austin signs off.

Do not import from the legacy folder. Do not copy code patterns from it. If you find yourself reaching for it for anything other than instructional content (question prose, table column definitions, simulation URLs, point values), stop and re-read the spec.

## License

MIT — see [LICENSE](./LICENSE).
