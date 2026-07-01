# Active-Time Accrual Spec

**Status:** Active, not yet built. Written 2026-06-30.
**Motivation:** The Process Record `activeMs` metric systematically undercounts, so it cannot
be trusted for the TA Checker's `low-active-time` nudge or for the planned cohort-relative
time baseline (see `docs/specs/`… the cohort baseline section of the verify plan,
`.claude/plans/why-not-the-objective-valiant-key.md`). This spec makes `activeMs` solid so
time can become a first-class integrity signal instead of a display-only lower bound.

---

## 1. The defect

Two Process Record counters are committed at different moments, and only one of them
survives an interrupted session:

- **`keystrokes` / `deletes`** ([`labStore.ts` `markFieldActivity`](../../src/state/labStore.ts))
  are incremented **synchronously on every `input` event** and flow through `onChange` →
  store → debounced persist. They are effectively per-keystroke-durable. Trustworthy.
- **`activeMs`** is committed **only on `blur`**
  ([`Field.tsx` `handleBlur`](../../src/ui/primitives/Field.tsx),
  [`EquationEditor.tsx` `handleBlur`](../../src/ui/primitives/EquationEditor.tsx)). The
  elapsed wall-clock for a focus session is held in a component-local
  `focusStartedAt` ref (`Date.now() - focusStartedAt`) and is added to `activeMs` **only if
  the field is cleanly blurred.**

Any focus session that ends **without a blur** contributes all of its keystrokes but **zero
of its time**:

- page reload (student resumes work) — the field was focused, `focusStartedAt` ref is wiped
  on remount, elapsed is gone;
- tab close / navigation away;
- PDF export or programmatic focus change while a field is focused;
- browser/OS crash or sleep.

This is the observed anomaly: a response showing **942 keystrokes in 4 s** (and `1 s / 325`,
`5 s / 329`). Those are focus sessions whose blur never fired; the 4 s is leftover from some
other small blur window on the same field. In aggregate the effect is large — a record
totalling 7554 keystrokes (~31 min of typing at a brisk pace) reported only 14m39s of active
time, roughly half the plausible wall-clock.

A second, compounding leak: persistence is **debounced 250 ms and writes to IndexedDB
asynchronously** ([`labPersistenceMiddleware.ts`](../../src/state/persistence/labPersistenceMiddleware.ts)).
Even a value committed to the store moments before unload may never reach disk.

**Consequence for integrity tooling:** `keystrokes` and paste counts are sound; `activeMs`
is not. Any z-score or threshold over `activeMs` would flag careful students who reload often
rather than students who worked quickly. Until this is fixed, time must be treated as a lower
bound only.

---

## 2. Goal and non-goals

**Goal:** `activeMs` reflects focused wall-clock time to within a few seconds regardless of
how the session ends, short of a hard process kill. Bound the worst-case loss; eliminate the
"time vanishes on reload" class entirely.

**Preserve the existing semantic exactly:** `activeMs` = wall-clock time a field is focused,
**including** idle pauses while focused (reading, thinking). We are not changing what the
metric means, only stopping it from leaking. (An optional idle cap is a documented follow-up,
section 7 — out of scope here.)

**Non-goals:**

- No change to `keystrokes` / `deletes` / paste accounting — they already work.
- No change to the persisted schema shape (`activeMs` stays `number`, `FieldMeta` unchanged).
  No migration.
- No new nudge logic in this change. Re-enabling `low-active-time` with confidence and the
  cohort baseline are downstream, gated on this landing.

---

## 3. Design: continuous accrual + flush at every loss point

Replace "bank only on blur" with "accrue against a monotonic anchor and flush the delta
wherever focused time could otherwise be lost."

### 3.1 Accrual model

While a field is focused it holds an **anchor** timestamp. A **flush** computes
`delta = clock() - anchor`, does `activeMs += delta`, and resets `anchor = clock()`
(re-anchoring so a resumed session keeps counting without double-counting the already-banked
delta). Flush points:

1. **blur** — flush and clear the anchor (existing behavior, now via the shared path).
2. **`visibilitychange` → `document.hidden`** — flush; the tab is being backgrounded
   (covers most reloads, tab switches, and OS app-switch on mobile). Keep the anchor set so
   that if the tab returns to `visible` while the field is still focused, counting resumes.
   (Decision: time while the tab is hidden does **not** count — backgrounded is not "actively
   working." This is a small, defensible semantic tightening versus today's blur-only model,
   and it is the standard `visibilitychange` accrual pattern.)
3. **`pagehide`** — flush. Fires on reload, close, and bfcache eviction; the reliable
   last-gasp hook.
4. **component unmount** — flush; covers client-side route changes / conditional unmounts
   that don't fire `pagehide`.
5. **heartbeat while focused** — flush on a low-frequency interval (e.g. every 5 s) so a hard
   crash loses at most one interval's worth of time. This is the only defense against a kill
   that fires no lifecycle event.

Because at most one field is focused at a time, only the focused field's anchor is non-null,
so only it flushes a non-zero delta. No cross-field double counting.

### 3.2 Monotonic clock

Use `performance.now()` for **deltas** (`clock()` above), not `Date.now()`. `Date.now()` is
wall-clock and jumps on system sleep / NTP correction, which would inject bogus multi-hour
deltas after a laptop lid-close. `performance.now()` is monotonic and sleep-safe.

Keep `Date.now()` (`now()` in `labStore.ts`) for the **timestamps** `firstFocusAt` /
`lastEditAt` — those are meant to be wall-clock instants, and they are display/forensic only.

### 3.3 Persistence flush (bounding the async-write leak)

Fixing accrual is not enough if the last flush never reaches IndexedDB. Add a synchronous,
debounce-bypassing flush:

- Export `flushPersistence()` from `attachLabPersistence` (invoke `persistNow()` immediately,
  clearing the pending debounce timer). Return it alongside the existing dispose function.
- Register a **single** app-level `pagehide` **and** `visibilitychange`→hidden listener (in
  the store/provider setup that owns `attachLabPersistence`, not per-field) that calls
  `flushPersistence()`. The field-level flush (3.1) has already written the final `activeMs`
  into the store synchronously by the time this runs, because DOM event listeners for the same
  event fire in registration order and the store update in `onChange` is synchronous.
- IndexedDB transactions started inside `pagehide` are generally allowed to complete by
  browsers; this is best-effort but dramatically better than the 250 ms debounce. Do not
  `await` in the unload path.

With continuous accrual (3.1 heartbeat) the debounced persist already captures `activeMs`
every few seconds during the session, so even if the unload write is dropped, at most one
heartbeat interval is lost. The `flushPersistence()` hook removes even that in the common
reload/close case.

### 3.4 Shared hook (kill the duplication)

`Field.tsx` and `EquationEditor.tsx` currently duplicate the focus/blur/`focusStartedAt`
logic; a fix applied to one and not the other would silently half-work. Extract a single hook:

```ts
// src/ui/primitives/useActiveTime.ts
export function useActiveTime(args: {
  value: FieldValue;
  onChange: (next: FieldValue) => void;
}): { onFocus: () => void; onBlur: () => void };
```

Responsibilities, all internal to the hook:

- Own the `performance.now()` anchor ref.
- `onFocus`: set anchor; set `firstFocusAt` (via existing `now()`) if unset; **attach** the
  `pagehide` + `visibilitychange` listeners (attach on focus, remove on blur/unmount, so
  exactly one field's listeners are ever live — no N-listener fan-out).
- `onBlur`: flush, clear anchor, remove listeners.
- Heartbeat `setInterval` while focused; cleared on blur/unmount.
- Unmount cleanup: flush if anchored, clear interval, remove listeners.
- Use a **ref-to-latest** `{ value, onChange }` so the event/interval closures never commit
  against a stale `FieldValue` (the classic stale-closure bug — flushing must read the current
  `activeMs` and write current+delta).

`Field` and `EquationEditor` then just spread `onFocus`/`onBlur` onto their editable element
and delete their local `focusStartedAt` / `handleFocus` / `handleBlur` time logic. Their
`handleInput` / composition / paste logic is untouched.

### 3.5 Pure, testable core

Extract the arithmetic so it is unit-testable without a DOM:

```ts
// in useActiveTime.ts (or a colocated helper)
export function accrueActiveMs(
  meta: FieldMeta,
  anchor: number,
  clockNow: number,
): { meta: FieldMeta; anchor: number } {
  const delta = Math.max(0, clockNow - anchor);
  return { meta: { ...meta, activeMs: meta.activeMs + delta }, anchor: clockNow };
}
```

`Math.max(0, …)` guards a non-monotonic surprise. The hook calls this on every flush and
writes the returned `meta` back through `onChange`.

---

## 4. Files touched

| File | Change |
| --- | --- |
| `src/ui/primitives/useActiveTime.ts` | **NEW.** Hook + `accrueActiveMs` pure helper. |
| `src/ui/primitives/Field.tsx` | Replace local focus/blur time logic with `useActiveTime`. |
| `src/ui/primitives/EquationEditor.tsx` | Same. |
| `src/state/persistence/labPersistenceMiddleware.ts` | Return `flushPersistence()` from `attachLabPersistence`. |
| store/provider setup (wherever `attachLabPersistence` is called) | Register one `pagehide` + `visibilitychange` listener → `flushPersistence()`. |
| `tests/unit/useActiveTime.test.ts` | **NEW.** Pure `accrueActiveMs` + jsdom hook tests. |

No schema, no persisted-shape, no PDF-render change. `Document.tsx` Process Record rendering
is unaffected (it just sums a now-accurate `activeMs`).

---

## 5. Testing

Vitest + jsdom + `@testing-library/react` are already configured (`vitest.config.ts`
`environment: 'jsdom'`).

**Pure (`accrueActiveMs`):**

- monotonic delta adds correctly; anchor advances to `clockNow`.
- negative delta (clock regression) clamps to `+0`, anchor still advances.
- accumulates across successive flushes without double counting.

**Hook (jsdom, fake timers):**

- focus → advance `performance.now` → blur: `activeMs` equals elapsed.
- focus → advance → dispatch `visibilitychange` with `document.hidden = true` (no blur):
  `activeMs` committed. This is the regression test for the original defect.
- focus → advance → dispatch `pagehide` (no blur): committed.
- focus → advance → unmount (no blur): committed.
- heartbeat: focus → advance past one interval → assert an interim commit landed.
- hidden → visible → hidden while focused does not double-count the hidden gap.
- stale-closure guard: two focus/blur cycles accumulate onto the prior `activeMs`, not reset.

**Persistence:** unit-test that `flushPersistence()` calls the adapter's `saveJSON`
immediately (no 250 ms wait) and cancels the pending debounce.

**Regression:** existing suite stays green, especially anything asserting `FieldMeta` shape.

**Manual (per CLAUDE.md, in-browser):** open a lab, type into a response for ~30 s, **reload
mid-focus without clicking away**, resume, export PDF. Confirm the Process Record row shows
~30 s (not ~0), and that keystroke counts are unchanged. Repeat with a tab-switch instead of a
reload.

## 6. Verification

1. `npm run typecheck` (tsc -b, app + api) — watch `exactOptionalPropertyTypes`: never assign
   `undefined` to `FieldMeta` optionals; the accrual helper only touches `activeMs`.
2. `npm run lint` (`--max-warnings 0`) + `npm run format:check` — no em dashes.
3. `npm test` — new `useActiveTime.test.ts` green.
4. `npm run ci` before PR; `npm run test:e2e` (this touches a shared input primitive used
   across every lab, so exercise the UI path).

## 7. Follow-ups (out of scope, do not bundle)

- **Idle cap.** Both the old and new models count focused-but-idle time (student walks away
  with a field focused and the tab foregrounded). Optionally cap a single un-typed focused
  stretch (e.g. stop accruing after N minutes without an `input` event, resume on next input).
  This is a semantic product decision, not a leak fix; decide separately.
- **Re-enable `low-active-time`.** Once this lands and a term of clean data exists, the
  verify-plan nudge and the cohort-relative time baseline
  (`.claude/plans/why-not-the-objective-valiant-key.md`, "Future direction") can rely on
  `activeMs`. Until then keep time display-only / lower-bound.
