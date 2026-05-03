# LabFrame

LabFrame is an online worksheet app for ASU physics labs. Students run a simulation and complete a structured worksheet in the same screen, then export a signed PDF report.

This repository is the rebuild of the legacy `physics-labs.up.railway.app` app. The canonical product and engineering spec is [`REBUILD_SPEC.md`](./REBUILD_SPEC.md).

## Tech stack

- React 18 + TypeScript
- Vite
- Zustand state
- Zod schemas
- chart.js + react-chartjs-2
- `@react-pdf/renderer` + `pdf-lib`
- Vitest + Playwright

## Local development

```bash
nvm use
npm install
npm run dev
```

For local serverless signing (`/api/sign`), run:

```bash
npm run dev:vercel
```

## Core scripts

- `npm run dev` - Vite frontend dev server
- `npm run dev:vercel` - Vercel dev server with API routes
- `npm run build` - typecheck and production build
- `npm run typecheck` - TypeScript check only
- `npm run lint` - ESLint (warnings fail CI)
- `npm test` - Vitest suite
- `npm run test:e2e` - Playwright suite
- `npm run analyze` - build with bundle report at `dist/stats.html`
- `npm run ci` - local CI pipeline

## Environment variables

Configure in Vercel environment settings:

- `LAB_SIGNING_SECRET` - HMAC key used by `api/sign.ts`

For local Vercel development:

```bash
vercel env pull .env.development.local
```

## Telemetry (opt-in)

Telemetry is disabled by default. A course opts in by setting `telemetryEndpoint` in its course manifest.

When telemetry is enabled, LabFrame sends only:

- `labId`
- `sectionId` (if available)
- `error.message`
- `error.stack`

LabFrame does not send answers, student names, table contents, or uploaded image bytes.

## Security note for LMS embeds

Parent-frame messaging is allow-list gated. Courses set `parentOriginAllowList`; LabFrame only posts to an explicit allow-listed origin and never uses `postMessage(..., '*')`.

## Additional docs

- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Authoring guide: [`docs/AUTHORING_A_LAB.md`](./docs/AUTHORING_A_LAB.md)
- Contribution workflow: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## License

MIT - see [`LICENSE`](./LICENSE).
