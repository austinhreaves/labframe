# Contributing

## Branch and PR workflow

- Create a feature branch from `main`.
- Keep PRs focused and reviewable.
- Include a short summary and test plan.

## Required local checks

Run these before opening or updating a PR:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

For UI behavior, accessibility, or routing/layout changes, also run:

```bash
npm run test:e2e
```

## Accessibility and performance expectations

- New UI should stay WCAG 2.1 AA-compatible.
- Axe checks (Vitest + Playwright) must stay green.
- Avoid loading heavy dependencies on initial page load when lazy loading is possible.

## Lab content changes

When editing course/lab content in `src/content/`:

- Validate schema compatibility
- Check section rendering in the browser
- Verify PDF export for affected labs

## Security and privacy

- Never commit secrets or `.env` values.
- Preserve telemetry payload limits (no answers, no PII).
- Preserve allow-listed parent messaging (`parentOriginAllowList`) and never use `postMessage(..., '*')`.
