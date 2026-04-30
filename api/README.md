# Serverless API

Single-purpose Vercel functions. No DB, no persistence, no auth state.

## `POST /api/sign`

Returns an HMAC-SHA256 signature over the canonical `LabAnswers` JSON. See
the function source and `REBUILD_SPEC.md` §5.14 for contract and threat model.

### Required environment variables

| Name | Where to set | Notes |
|------|--------------|-------|
| `LAB_SIGNING_SECRET` | Vercel project → Settings → Environment Variables | Must be ≥ 32 chars. Generate with `openssl rand -hex 32`. Set for `Production`, `Preview`, and `Development` (use a **different value** for each so a leaked dev secret can't sign production PDFs). |

### Local development

`vercel dev` runs the function alongside Vite in a single process. Without
`vercel dev`, the Vite dev server has no `/api` and signing requests will
404 — fine for UI iteration, blocking for PDF work.

```bash
# Install Vercel CLI once, globally:
npm i -g vercel

# Pull env vars from the linked project (creates .env.development.local — gitignored):
vercel env pull .env.development.local

# Run dev server with /api routes wired:
npm run dev:vercel
```

### Tests

`tests/unit/api.sign.test.ts` (added in Phase 3) exercises the handler with a
mocked `VercelRequest`/`VercelResponse` and a fixture secret. The function
exports a `_verifyForTests` helper to validate signatures round-trip
correctly.
