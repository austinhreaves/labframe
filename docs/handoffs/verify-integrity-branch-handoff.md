# Handoff: integrity/verify branch orientation

**For:** a fresh agent picking up branch `claude/dazzling-roentgen-fa2b66`. Self-contained;
you do not need prior conversation context. Read [`CLAUDE.md`](../../CLAUDE.md) first for
environment gotchas, then this.

**Working tree:** clean, everything below is pushed. `npm run ci` was green at last commit.

## What this branch already shipped (do not redo)

Four commits on top of `main` (`f5f39c5`):

1. **`04c2295` TA Checker** — a stateless `/api/verify` endpoint + `public/verify.html`
   drag-drop page. Drops a signed LabFrame PDF, extracts the embedded `lab.json` envelope,
   cryptographically verifies the HMAC (`valid` is strictly cryptographic), and shows
   advisory completeness checks **plus** an authorship profile and ranked soft nudges.
   - Pure, dependency-free logic lives in [`api/_authorship.ts`](../../api/_authorship.ts)
     (imported by both `api/verify.ts` and the unit test; kept free of node/pdf-lib/`@/` so
     the app tsconfig can import it). Verdict is orthogonal to profile/nudges by design.
   - Clipboard is the only integrity signal; autocomplete/IME never drive a nudge or the
     complete-paste count (ADR-0004, IME/CJK false-positive guard). Tests:
     [`tests/unit/verifyProfile.test.ts`](../../tests/unit/verifyProfile.test.ts).
   - `seal.ts` now embeds `lab.json` as a `{canonical, signature, signedAt}` envelope (was a
     raw canonical string); legacy raw-string PDFs still verify structurally.
2. **`a8c5875` PDF response contrast** — student responses render in a framed, tinted block
   (`responseFrame` in [`Document.tsx`](../../src/services/pdf/Document.tsx)) to stand out
   from instructor prose.
3. **`3eeb315` + `91dc0b0` two specs** (docs only, not implemented) — see the queue below.

Design rationale for all of the above is captured in
`.claude/plans/why-not-the-objective-valiant-key.md`.

## Ready-to-build work queue (pick in this order)

### 1. Leak-proof `activeMs` accrual ← start here, it is a precondition for #2's time work

The Process Record `activeMs` metric commits **only on blur**, so any focus session ending
without a clean blur (reload, tab close, export-while-focused, crash) banks every keystroke
but zero time. Observed symptom: rows like "942 keystrokes in 4 s"; aggregate wall-clock
undercounts by ~half. This makes time untrustworthy for the `low-active-time` nudge and the
planned cohort baseline.

- **Full design:** [`docs/specs/ACTIVE_TIME_ACCRUAL_SPEC.md`](../specs/ACTIVE_TIME_ACCRUAL_SPEC.md)
- **Build order:** [`docs/handoffs/active-time-accrual-handoff.md`](./active-time-accrual-handoff.md)
- Gist: a shared `useActiveTime` hook (dedupes identical logic in `Field.tsx` and
  `EquationEditor.tsx`), continuous accrual against a `performance.now()` anchor, flush on
  blur/`visibilitychange`/`pagehide`/unmount + heartbeat, and a debounce-bypassing
  `flushPersistence()` on unload. Note: `SPEC.md` §3.4 already lists "no `pagehide` flush" as
  a known `[Decided, not implemented]` fix, so this closes a pre-existing item too.
- Medium risk (touches the input primitive every lab uses); run `npm run test:e2e`.

### 2. Process Record section-specific row labels

Every appendix row derives from `sectionTitle()`, which returns the section _kind_
("Response" for every `concept` section), so the record reads as a wall of generic
"Response" rows. Add a dedicated `processRecordLabel(section)` used **only** by the appendix
(do not edit the shared `sectionTitle()` — it also feeds body headings and the compaction
list): prefer `title`, else truncated `prompt`, else kind name, with a disambiguating index
(`Response 3`).

- **Spec:** [`docs/SPEC.md`](../SPEC.md) §4.2 (`[Decided 2026-06-30]` bullet) and roadmap
  **item 14**, which bundles this with the already-decided "time bands instead of raw ms" +
  "exclude IME counts" changes. Do item 14 as one `Document.tsx` pass with one PDF-export
  verification. The label part does not depend on #1; the banding part does (don't band a
  leaky metric).

## Standing item (needs a human, was blocked this session)

Screenshot/browser tooling was timing out, so two things shipped without a visual eyeball:
the exported PDF `responseFrame` aesthetic, and a live `dev:vercel` drag-drop of a genuinely
signed PDF through `verify.html`. If your tooling works, do the in-browser passes described
in the plan file's Verification section. Otherwise flag it for the user.

## Environment reminders (from CLAUDE.md)

- The `PowerShell` **tool** is broken here (exit 1 on anything) — run shells via the `Bash`
  tool (`pwsh -NoProfile -Command '...'` or POSIX).
- Typecheck is `npm run typecheck` (tsc -b), **not** `npx tsc --noEmit`
  (`exactOptionalPropertyTypes` lives in tsconfig.app/api only).
- `npm run ci` before any PR; add `npm run test:e2e` for UI/routing/a11y changes.
- **No em dashes** anywhere. Local `format:check` failing on ~45 untouched files is a Windows
  CRLF artifact (CI/Linux is green) — fix line endings, don't reformat.
- Branch is `claude/dazzling-roentgen-fa2b66`, already on origin. Keep committing there unless
  the user says otherwise; open a PR only when asked.
