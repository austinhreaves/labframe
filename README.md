# LabFrame

LabFrame is a browser-based lab worksheet tool for ASU physics courses. Students run a
PhET simulation alongside a structured worksheet, complete their measurements and
calculations, and export a tamper-evident PDF to submit through Canvas.

**Access:** [labframe-gamma.vercel.app](https://labframe-gamma.vercel.app)

No account, no install, no textbook required. Lab work saves automatically in the
browser. When finished, click "Export PDF" and submit the downloaded file through Canvas
as usual.

## Data and privacy

LabFrame does not maintain a database of student work. Everything stays in the student's
own browser until they export their PDF. The only server call is a signing request at
export time -- it receives the lab data, computes a tamper-evident signature, and
discards the data immediately. See [docs/DATA_HANDLING.md](docs/DATA_HANDLING.md) for
the full reference and FERPA posture.

## Contact

Austin Reaves, Instructional Professional, ASU Department of Physics

---

## For developers and collaborators

### Tech stack

- React 18 + TypeScript + Vite
- Zustand state, Zod schemas
- chart.js + react-chartjs-2
- `@react-pdf/renderer` + `pdf-lib`
- Vitest + Playwright

### Local development

```bash
nvm use
npm install
npm run dev
```

For local serverless signing (`/api/sign`):

```bash
npm run dev:vercel
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite frontend dev server |
| `npm run dev:vercel` | Vercel dev server with API routes |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript check only |
| `npm run lint` | ESLint (warnings fail CI) |
| `npm test` | Vitest suite |
| `npm run test:e2e` | Playwright suite |
| `npm run ci` | Full local CI pipeline |
| `npm run analyze` | Bundle report at `dist/stats.html` |

### Environment variables

Configure in Vercel environment settings:

- `LAB_SIGNING_SECRET` - HMAC key used by `api/sign.ts`

For local Vercel development:

```bash
vercel env pull .env.development.local
```

### Security notes

Parent-frame messaging is allow-list gated. Courses set `parentOriginAllowList`;
LabFrame never uses `postMessage(..., '*')`.

Error telemetry fires only when a course manifest explicitly sets a
`telemetryEndpoint`. No course currently does. Payloads contain only `labId`,
`sectionId`, and the error message/stack -- never answers, names, or table contents.

### Further reading

- [docs/SPEC.md](docs/SPEC.md) - product and engineering spec (source of truth)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - architecture overview
- [docs/AUTHORING_A_LAB.md](docs/AUTHORING_A_LAB.md) - lab authoring guide
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) - design system
- [docs/decisions/](docs/decisions/) - decision records
- [CONTRIBUTING.md](CONTRIBUTING.md) - contribution workflow

## License

GNU Affero General Public License v3 -- see [LICENSE](LICENSE).
