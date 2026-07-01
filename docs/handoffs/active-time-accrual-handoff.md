# Handoff: make `activeMs` (Process Record active time) leak-proof

**For:** a fresh agent. Self-contained; you do not need prior conversation context.

**Status:** ready to execute. Design is locked in
[`docs/specs/ACTIVE_TIME_ACCRUAL_SPEC.md`](../specs/ACTIVE_TIME_ACCRUAL_SPEC.md) — read it
first; this handoff is the build order, not the rationale.

**Risk:** medium. Touches `Field` and `EquationEditor`, the input primitives used by every
lab, plus the persistence middleware. No schema/migration change. Land as one focused PR.

## The bug in one paragraph

`keystrokes`/`deletes` are committed live on every input event and are durable.
`activeMs` is committed **only on `blur`** — the focus-session elapsed lives in a
component-local `focusStartedAt` ref and is lost if the field is never cleanly blurred
(reload, tab close, export while focused, crash). Result: rows like "942 keystrokes in 4 s"
and roughly half the true wall-clock missing in aggregate. The fix is continuous accrual
against a monotonic anchor, flushed at every point where focused time can be lost, plus a
debounce-bypassing persistence flush on unload. Full detail: the spec, section 1 and 3.

## Build order

### Step 1 — `src/ui/primitives/useActiveTime.ts` (NEW)

Create the shared hook and the pure helper. Spec sections 3.4 and 3.5.

- Export `accrueActiveMs(meta, anchor, clockNow)` — pure, clamps negative delta to `+0`,
  advances anchor. This is what the tests pin.
- Export `useActiveTime({ value, onChange })` returning `{ onFocus, onBlur }`.
  - Anchor ref uses `performance.now()` (deltas only). Keep `Date.now()` for `firstFocusAt`.
  - `onFocus`: set anchor; set `firstFocusAt` if unset; attach `pagehide` +
    `visibilitychange` listeners; start the heartbeat `setInterval` (5 s).
  - `onBlur`: flush via `accrueActiveMs`, clear anchor, remove listeners, clear interval.
  - `visibilitychange`→`document.hidden`: flush, keep anchor (resume on re-show).
  - `pagehide` / unmount: flush if anchored, clean up.
  - **Ref-to-latest `{ value, onChange }`** so listener/interval closures never write against a
    stale `FieldValue`. This is the one subtle correctness point — get it wrong and a flush
    resets `activeMs` instead of adding to it.
  - Attach listeners **on focus, remove on blur/unmount** so only the one focused field ever
    has live listeners (no N-field fan-out).

### Step 2 — wire the hook into both editors

- [`src/ui/primitives/Field.tsx`](../../src/ui/primitives/Field.tsx): delete the local
  `focusStartedAt` ref, `handleFocus`, and `handleBlur` **time** logic (lines ~36, ~53-81).
  Call `const { onFocus, onBlur } = useActiveTime({ value: effective, onChange })` and spread
  those onto the `<input>/<textarea>`. Leave `handleInput`, composition, and paste logic
  exactly as-is (`firstFocusAt` is now set inside the hook, so drop the duplicate set in the
  old `handleFocus`).
- [`src/ui/primitives/EquationEditor.tsx`](../../src/ui/primitives/EquationEditor.tsx): same
  surgery on its duplicated `handleFocus`/`handleBlur`/`focusStartedAt` (lines ~140-174).
  Keep `withFocusMeta`'s callers only where they aren't the time path; the hook owns
  `firstFocusAt` now.

Verify both editors still compile and behave: focus sets `firstFocusAt` once, blur banks time.

### Step 3 — persistence flush

[`src/state/persistence/labPersistenceMiddleware.ts`](../../src/state/persistence/labPersistenceMiddleware.ts):

- Change `attachLabPersistence` to also return `flushPersistence`: a function that clears the
  pending debounce `timeout` and calls `persistNow()` synchronously (fire-and-forget, do not
  `await` in an unload path). Return `{ dispose, flushPersistence }` (or return the disposer
  and expose flush — pick one shape and update the caller).

[`src/state/labStore.ts`](../../src/state/labStore.ts) line 760 (`createLabStore`, currently
discards the return):

- Capture the return of `attachLabPersistence`. Register **one** app-level listener set,
  guarded by `typeof window !== 'undefined'` (jsdom/SSR safety):
  `window.addEventListener('pagehide', flushPersistence)` and a `visibilitychange` listener
  that calls `flushPersistence()` when `document.hidden`. These fire after the field-level
  flush has already written `activeMs` into the store (same event, synchronous `onChange`),
  so the flushed value is what gets persisted.

### Step 4 — tests: `tests/unit/useActiveTime.test.ts` (NEW)

Spec section 5. jsdom + fake timers are already set up (`vitest.config.ts`
`environment: 'jsdom'`, `@testing-library/react` present).

Must include the **regression test for the original defect**: focus → advance
`performance.now` → dispatch `visibilitychange` with `document.hidden = true`, **no blur** →
assert `activeMs` was committed. Plus `pagehide`, unmount, heartbeat, no-double-count on
hidden→visible→hidden, and the stale-closure accumulation test. Pure `accrueActiveMs` tests
for the arithmetic and the negative-delta clamp.

Mock `performance.now()` (vi.spyOn) so deltas are deterministic; use `vi.useFakeTimers()` for
the heartbeat interval.

## Gotchas (repo-specific)

- **`exactOptionalPropertyTypes` is on** (tsconfig.app/api only). Never write
  `activeMs: undefined` or spread `undefined` into `FieldMeta`. `accrueActiveMs` only ever
  writes a number. Typecheck with `npm run typecheck` (tsc -b), **not** `npx tsc --noEmit` —
  the flat invocation won't reproduce CI.
- **The `PowerShell` tool is broken here** — run shells via the `Bash` tool
  (`pwsh -NoProfile -Command '...'` or plain POSIX).
- **No em dashes** anywhere (code, comments, docs, commit message). Hyphen or rewrite.
- **`performance.now()` for deltas, `Date.now()` for timestamps.** Mixing them reintroduces
  the sleep/NTP jump bug the spec calls out.

## Definition of done

- `npm run ci` green (typecheck app+api, lint 0-warnings, format:check, unit tests incl. the
  new file).
- `npm run test:e2e` green (shared input primitive — run it).
- Manual, in-browser (required by CLAUDE.md): type into a response ~30 s, **reload
  mid-focus without clicking away**, resume, export PDF. Process Record row shows ~30 s, not
  ~0; keystroke count unchanged. Repeat with a tab-switch instead of reload.
- Out of scope, do not touch: the `low-active-time` nudge, the cohort baseline, and any idle
  cap (spec section 7). This PR only makes the metric trustworthy.
