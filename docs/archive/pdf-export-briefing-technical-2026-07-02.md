# PDF export / draft-save failure + student-name persistence gate: technical briefing

**Date:** 2026-07-02
**Branch:** `claude/funny-cray-cee612`
**Commits:** `da6d25f` (export self-heal + download hardening) and the follow-up commit that
adds the student-name gate and this briefing.

---

## 1. Reported symptom

A student on `labframe-gamma.vercel.app` could not export a PDF. The browser showed:

```
Failed to fetch dynamically imported module:
https://labframe-gamma.vercel.app/assets/render-DkFoUNJ.js
```

The student added: "I even tried to save the draft and that didn't work."

## 2. Root-cause analysis

### 2.1 Stale-deploy chunk 404 (primary)

The PDF pipeline is code-split. Both export handlers dynamically import the render chunk:

- Signed export: [`exportPdf`](../../src/ui/LabPage.tsx) → `import('@/services/pdf/render')`
  plus `collectImageData` / `collectDrawImages`.
- Draft export: [`exportDraftPdf`](../../src/ui/LabPage.tsx) → the **same three imports**.
- [`render.tsx`](../../src/services/pdf/render.tsx) then further dynamically imports
  `@react-pdf/renderer`, `Document`, and `registerFonts`. Fonts are bundled assets
  (content-hashed), not runtime fetches.

Vite emits content-hashed chunk filenames. On each Vercel deploy the old hashes are removed
from the CDN (Vercel serves only the latest deployment's assets). A client that loaded
`index.html` before a deploy still references the old `render-<hash>.js`; clicking export
after the deploy requests a now-404 file, and the dynamic `import()` rejects with
"Failed to fetch dynamically imported module."

**Why "save draft" also failing is confirming evidence, not a second bug.** The signed path
depends on both the render chunk _and_ the `/api/sign` network call
([`sign.ts`](../../src/services/integrity/sign.ts)); the draft path depends only on the
render chunk. Since _both_ failed, the shared dependency (the chunk) is implicated and the
signing endpoint is exonerated. `sign.ts` already has thorough status handling
(400/413/500/network → specific messages).

### 2.2 `downloadBlob` race (secondary, latent, browser-dependent)

The original `downloadBlob` in `LabPage.tsx` did:

```ts
const url = URL.createObjectURL(blob);
const anchor = document.createElement('a');
anchor.href = url;
anchor.download = filename;
anchor.click();
URL.revokeObjectURL(url); // synchronous — races the browser reading the blob URL
```

Two defects: (a) the anchor is never attached to the DOM (some browsers ignore a
programmatic click on a detached anchor); (b) `revokeObjectURL` fires synchronously right
after `click()`, which can cancel the download before the browser has read the blob — a
**silent** failure (the surrounding try/catch sees success). Affects both export paths.

### 2.3 Persistence gated on student name (discovered during review)

The persistence key embeds the student name:
[`makeLabKey`](../../src/state/persistence/keys.ts) → `lab:${courseId}:${labId}:${studentName}`
(images: `img:...:${studentName}:${imageId}`). The persistence middleware
([`labPersistenceMiddleware.ts`](../../src/state/persistence/labPersistenceMiddleware.ts))
bails in `persistNow` when `courseId`, `labId`, or `studentName` is empty. Therefore **no
worksheet answers persist until a name is set.** Students frequently defer entering their
name until the export preflight nags them, so early work sat unsaved.

Name-in-key is deliberate (shared lab machines: keeps students' work separate; gives graders
a named record), so decoupling `persistNow` from the name was rejected — it would require
key-migration logic and reintroduce a shared-machine collision bucket under a blank-name key.
The fix is to collect the name up front instead.

### 2.4 Persistence facts verified (supporting the reload-is-safe claim)

- Answers persist to **localStorage** via `saveJSON`
  ([`browserAdapter.ts`](../../src/state/persistence/browserAdapter.ts)); only image/drawing
  **blobs** go to IndexedDB (`idb-keyval`, [`idb.ts`](../../src/state/persistence/idb.ts)).
  (An earlier verbal claim of "autosaves to IndexedDB" was imprecise; corrected here.)
- Writes are debounced 250 ms, but there is a `pagehide` + `visibilitychange→hidden` flush
  ([`labStore.ts`](../../src/state/labStore.ts) ~L767) that cancels the debounce and writes
  synchronously (localStorage is sync). `window.location.reload()` fires `pagehide`, so the
  auto-reload captures in-flight edits. Reload is therefore non-destructive **once a valid
  name exists** — which §2.3's gate now guarantees before any work is done.
- Reload rehydration: `initLab` ([`labStore.ts`](../../src/state/labStore.ts) L367) builds
  the key from `get().studentName`; the restore effect in `LabPage` seeds `studentName` from
  `?student=` or `STUDENT_NAME_STORAGE_KEY` (written by `commitStudentName`, L295), enabling
  rehydration after reload. **This chain is a candidate for deeper review — see handoff.**

## 3. Changes made

### 3.1 Stale-deploy self-heal

- **New** [`src/services/app/installPreloadErrorReload.ts`](../../src/services/app/installPreloadErrorReload.ts):
  listens for Vite's `vite:preloadError`, `preventDefault()`s it, and performs a one-shot
  reload guarded by a `sessionStorage` sentinel (cleared on successful `load`) to prevent
  reload loops on a genuinely broken/offline client.
- **Wired** in [`src/main.tsx`](../../src/main.tsx) after `installGlobalTelemetryHandlers()`.

### 3.2 `downloadBlob` hardening

- [`LabPage.tsx`](../../src/ui/LabPage.tsx) `downloadBlob`: append anchor to `document.body`,
  `click()`, `removeChild`, and defer `URL.revokeObjectURL` via `setTimeout(…, 0)`.

### 3.3 Student-name gate

- **New** [`src/ui/StudentNameGateDialog.tsx`](../../src/ui/StudentNameGateDialog.tsx):
  blocking, focus-trapped modal (`role="dialog"`, `aria-modal`, `aria-labelledby`,
  `role="alert"` error, no Escape/backdrop/cancel). Validates with
  `validateStudentInfoForPdf`; rejects empty and the `"Student"` placeholder.
- [`LabPage.tsx`](../../src/ui/LabPage.tsx): `needsStudentName` memo (exempts
  `WELCOME_LAB_ID`; a name is "known" if **any** of store `studentName`, `?student=`, or
  `STUDENT_NAME_STORAGE_KEY` passes `validateStudentInfoForPdf` — see §3.5 bug); render the
  gate; `submitStudentNameGate` mirrors `commitStudentName` (writes
  `STUDENT_NAME_STORAGE_KEY` + `setStudentName`).
- CSS in [`main.css`](../../src/main.css) (`.student-name-gate-label`, `.student-name-gate-error`).

### 3.4 Test changes

- **New** [`tests/e2e/studentNameGate.spec.ts`](../../tests/e2e/studentNameGate.spec.ts):
  gate blocks fresh load; rejects empty and `"Student"`; accepts a real name and lands it on
  the header field; `?student=` skips the gate; axe pass on the open gate. Uses an inline
  onboarded-but-nameless `storageState`.
- **Updated** suite seed [`tests/e2e/onboarded.storage.json`](../../tests/e2e/onboarded.storage.json):
  added `labframe:student-name = "E2E Student"` so existing lab specs run as returning
  students and bypass the gate.
- **Rewrote** [`tests/e2e/pdfPreflight.spec.ts`](../../tests/e2e/pdfPreflight.spec.ts): the
  missing-name→preflight-dialog UI path is now unreachable (the gate enforces name up front),
  so test 1 now covers the integrity-agreement gate with a seeded name; test 2 unchanged in
  intent.
- **Updated** [`tests/e2e/onboarding.spec.ts`](../../tests/e2e/onboarding.spec.ts): the
  deep-link toast test seeds a name via `addInitScript` so the gate stays out of the way
  while the first-timer toast still shows (that test intentionally omits the onboarded flag).

### 3.5 Bug found and fixed during verification

The first `needsStudentName` implementation used
`const candidate = studentName.trim() || paramStudent || storedStudent`. Because the default
`studentName` is the `"Student"` placeholder (truthy), it short-circuited and never consulted
the stored/param name — so the gate would wrongly appear for students who _did_ have a valid
saved or deep-linked name. Fixed to: a name is "known" if **any** source passes
`validateStudentInfoForPdf`. Confirmed fixed in-browser.

## 4. Verification performed

- **Typecheck:** clean on all changed source (the only `tsc` errors are pre-existing:
  `fast-check` is not installed in this worktree, breaking two unrelated property tests).
- **Lint:** `eslint --max-warnings 0` clean on all changed `.ts/.tsx`.
- **Unit:** `tests/unit/preflight.test.ts` passes (4/4).
- **In-browser (worktree dev server):** gate renders on nameless fresh load; empty →
  "Please enter your name to continue."; `"Student"` → "Please enter your real name, not
  \"Student\"."; a real name closes the gate and writes both the header field and
  `STUDENT_NAME_STORAGE_KEY`. Also confirmed the §3.5 fix hides the gate when a saved name
  exists.
- **E2E (against the worktree build):** `studentNameGate`, `pdfPreflight`, `smoke`,
  `persistence`, `layout`, `equationKeyboard` all pass. NOTE: the committed
  `playwright.config.ts` targets port 5173, which on this machine is the **main checkout's**
  dev server; running the suite as-is reuses that server and does NOT exercise this worktree.
  Verification here used a throwaway config pointing at the worktree server (port 5273) with
  an origin-matched `storageState`. CI (fresh server, port 5173, matching seed origin) runs
  the committed config correctly.

## 5. Known pre-existing issue (not caused by this work)

`tests/e2e/onboarding.spec.ts` "first run shows the splash and Skip tutorial reveals the
catalog" fails on this machine (asserts the `/` hero heading count is 0 during first run;
gets 1). It failed identically against the untouched main-checkout server before any of this
session's code was loaded, and this work does not touch the splash/catalog. Consistent with
the known local e2e flakiness on this machine. Left alone.

## 6. Environment notes for the next agent

- `.claude/launch.json` is **gitignored**. This session added a local `dev` config on port
  **5273** (the worktree server) because 5173 is held by the main checkout. Not committed.
- Run PowerShell via `Bash` calling `pwsh -NoProfile -Command '...'`; the `PowerShell` tool
  returns exit 1 spuriously in this harness.
- Typecheck is `npm run typecheck` (`tsc -b`), not a flat `tsc`.

---

## 7. HANDOFF — for a follow-up agent

### Task A: independently verify the problems were real and are solved

1. **Confirm the stale-deploy failure mode.** Inspect the two export handlers and
   `render.tsx`; confirm the render pipeline is loaded via dynamic `import()` and that
   Vercel/Vite content-hash chunk names such that an old client 404s post-deploy. Confirm
   `installPreloadErrorReload` is registered in `main.tsx`, only reloads once (sentinel), and
   clears the sentinel on `load`. Sanity-check that a reload is non-destructive given the
   persistence + `pagehide` flush described in §2.4.
2. **Confirm the `downloadBlob` fix** attaches the anchor and defers the revoke, and that
   both export paths use it.
3. **Confirm the name gate closes the persistence gap.** Verify `persistNow` still bails on
   empty name (§2.3) and that the gate guarantees a valid name before any worksheet edit is
   possible on a fresh, nameless, non-welcome lab. Verify the §3.5 fix (gate hidden when a
   valid name exists in store/param/storage).
4. **Run the suites the right way.** Do NOT reuse the main-checkout server. Either stop the
   5173 server and let Playwright start its own from this worktree, or run against the
   worktree server with an origin-matched `storageState`. Then run at least
   `studentNameGate`, `pdfPreflight`, `persistence`, plus `npm run typecheck` and
   `npm run lint`. Treat the §5 splash test as pre-existing unless proven otherwise.

### Task B: broaden the review — hunt for any other way a student loses work or cannot export

Run `/code-review` (or a focused manual audit) over the work-loss / export surface. Suggested
scope and specific things to probe:

- **Export pipeline:** `src/ui/LabPage.tsx` (`exportPdf`, `exportDraftPdf`, `downloadBlob`),
  `src/services/pdf/*` (`render.tsx`, `Document.tsx`, `registerFonts.ts`, `collectImageData`,
  `collectDrawImages`), `src/services/integrity/{sign,canonicalize}.ts`, `api/sign.ts`,
  `api/verify.ts`. Look for: unhandled rejections that leave `isExportingPdf` stuck, payload
  size limits (413), OOM on large images in `toBlob`, font/asset 404s after deploy not
  covered by the preload guard, and any error swallowed without user feedback.
- **Persistence / localStorage / IndexedDB:** `src/state/persistence/*`,
  `src/state/labStore.ts`. Probe: the name-in-key rehydration chain (§2.4 — does a reload
  reliably restore work when the name came only from the header vs. `?student=` vs. storage?),
  the async `setStudentName` → `migrateStudentKeys` path (partial-failure, races, StrictMode
  double-invoke), localStorage quota-exceeded handling (`status.lastError` surfacing), the
  250 ms debounce vs. rapid navigation, and IndexedDB blob loss (private mode, eviction).
- **Data-shape migrations:** `migratePersistedLabState` (schema v1→v4) and `sanitizeFits` —
  confirm no silent data drop on version bumps; the `Symbol(unevaluable)` legacy unit
  artifact noted in CLAUDE.md.
- **Report the findings** ranked by likelihood of real student work-loss / export failure,
  with concrete failure scenarios. Fix or file the confirmed ones.

---

## 8. ADDENDUM - independent verification pass, 2026-07-02 (follow-up agent)

Tasks A and B were executed. All Task A claims verified except two corrections below.
Task B found and fixed one high-severity work-loss bug that predates this branch.

### 8.1 Corrections to this briefing

- **Section 2.3 is wrong about the mechanism.** `persistNow` does NOT bail on a fresh
  session: the store's default `studentName` is the truthy `'Student'` placeholder
  (`DEFAULT_STUDENT_NAME`, `labStore.ts`), so nameless work always persisted, under
  `lab:course:lab:Student`, and rehydrated fine. The gate is still the right fix, but the
  problem it solves is the shared placeholder bucket (collisions on shared machines,
  wrong-name filing, and the poison-record race in 8.2), not "nothing persists."
- **Section 2.1's "Fonts are bundled assets, not runtime fetches" is imprecise.** The
  `.ttf` imports resolve to hashed asset URLs that `@react-pdf/renderer` fetches at
  render time. A client that has the render chunk cached but not the fonts can still hit
  a stale-deploy 404 that the `vite:preloadError` guard does not see (the export fails
  with an alert instead). Narrow: requires a pre-deploy export plus HTTP cache eviction.

### 8.2 High-severity bug found (exists in production, predates this branch)

On every page load the store boots as `'Student'`; the on-load rename
(`setStudentName` -> `migrateStudentKeys`) is async. `initLab`'s synchronous reset queues
a debounced persist, and when the rename takes longer than 250 ms that persist writes an
EMPTY payload under `lab:course:lab:Student`. The NEXT load's migration then copied that
empty record over the student's real named record and deleted nothing else - total loss
of that lab's saved work. Reproduced deterministically by the chromium
`persistence.spec.ts` failures under load. A timestamp guard cannot fix it (the poison is
newer than the real record). Fixed by a content-aware guard: `migrateStudentKeys` now
refuses to copy a payload with no student work (`payloadHasStudentWork`) over an existing
destination, and deletes the artifact. Regression tests:
`tests/unit/labStore.workLoss.test.ts` (verified to fail against the pre-fix code).

### 8.3 Other defects fixed in this pass

- `initLab` hydration: text answers now land before any IndexedDB access, image metadata
  is kept through mid-hydration persists, and a rejecting `loadBlob` (broken/private-mode
  IndexedDB) no longer aborts hydration - previously it wiped all text answers via the
  pending empty persist.
- Persistence middleware: switching labs inside the debounce window now flushes the
  outgoing lab's state instead of repointing the timer at the incoming lab (which dropped
  the last <250 ms of edits and could write mid-hydration state).
- `tests/unit/labPage.exportButton.test.tsx`: 3 tests broke on this branch (the gate adds
  a second "Student name" input). CI would have been red. Fixed by seeding the store name.
- `studentNameGate.spec.ts` axe test now scopes to the dialog; the whole-page scan was
  flaky against lazily rendered background content with pre-existing violations
  (MathLive keyboard sink `aria-input-field-name`, `.table-column-formula` contrast) -
  filed separately.

### 8.4 Reported, not fixed

- Student names containing `:` break `parseImageKey` (blob migration/recovery listing
  skips them; main flow unaffected because hydration uses the stored `idbKey`).
- `sectionRenderer` / `instructionsSectionView` unit tests flake under parallel load
  (lazy chunks vs 1 s waitFor default) - filed separately.
- `fast-check` was missing from this worktree's `node_modules` (stale install, lockfile
  already correct); `npm install` fixed it, so typecheck and the property tests are green.
