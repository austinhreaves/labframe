/**
 * Authorship profile + soft nudges, derived from the canonical answers envelope.
 *
 * Pure and dependency-free on purpose: no node builtins, no pdf-lib, no `@/` src imports.
 * This lets both the Vercel function (`api/verify.ts`) and the unit test import it without
 * dragging node/pdf-lib types into the app tsconfig (which includes tests/unit but not api).
 *
 * Integrity posture (ADR-0004, disclosure not prevention): everything here is advisory and
 * descriptive. It never produces a grade or a verdict. Autocomplete and IME paste counts are
 * reported for completeness but never feed a nudge or the complete-paste count - they flag
 * predictive-text device users / CJK typists, not copy-from-source.
 */

/**
 * Objective, descriptive summary of how the submission was authored.
 */
export type AuthorshipProfile = {
  activeMs: number;
  keystrokes: number;
  deletes: number;
  clipboardPastes: number;
  autocompletePastes: number;
  imePastes: number;
  fieldCount: number; // fields + table cells with non-empty text
  completePasteFields: number; // >=1 clipboard paste AND <=KEYSTROKE_FLOOR_PER_FIELD keystrokes
  label: string; // neutral descriptor
};

/**
 * A ranked, soft "look here" pointer for a human grader. Never a verdict. Every nudge is
 * gated on a conjunction of >=2 signals and ordered strongest-first by the builder.
 */
export type Nudge = {
  id: string;
  severity: 'info' | 'notice';
  text: string;
};

// Authorship-profile tuning. Conservative by design (favor false negatives): these are a
// cold-start placeholder until real per-section cohort baselines exist (see the plan's
// "Future direction"). Each nudge below combines >=2 of these so no single metric fires.
const KEYSTROKE_FLOOR_PER_FIELD = 3; // <=3 keystrokes with a clipboard paste = arrived-by-paste
const MIN_FIELDS_FOR_NUDGE = 5; // suppress all nudges on tiny labs (ratios too noisy)
const NEAR_ZERO_KS_PER_FIELD = 8; // keystrokes/field below this = near-zero original authorship
const COMPLETE_PASTE_RATIO = 0.5; // >=50% of responses are complete unedited pastes
const COMPLETE_PASTE_MIN_COUNT = 5; // and at least this many in absolute terms
const LOW_TIME_MS_PER_FIELD = 20_000; // <20s active per response is untypical for written work

type RawCell = { text?: unknown; pastes?: unknown; meta?: unknown };

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Compact "4m 43s" style duration for nudge text. Local because api cannot resolve `@/`. */
export function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/**
 * Aggregate authorship metrics from the canonical answers. Returns null when the canonical
 * does not parse or carries no fields/tables. Reads untrusted JSON defensively.
 */
export function buildAuthorshipProfile(canonical: string): AuthorshipProfile | null {
  let answers: { fields?: unknown; tables?: unknown };
  try {
    answers = JSON.parse(canonical) as { fields?: unknown; tables?: unknown };
  } catch {
    return null;
  }
  if (!answers || typeof answers !== 'object') return null;

  const cells: RawCell[] = [];
  if (answers.fields && typeof answers.fields === 'object') {
    for (const cell of Object.values(answers.fields as Record<string, unknown>)) {
      if (cell && typeof cell === 'object') cells.push(cell as RawCell);
    }
  }
  if (answers.tables && typeof answers.tables === 'object') {
    for (const table of Object.values(answers.tables as Record<string, unknown>)) {
      if (!Array.isArray(table)) continue;
      for (const row of table) {
        if (!row || typeof row !== 'object') continue;
        for (const cell of Object.values(row as Record<string, unknown>)) {
          if (cell && typeof cell === 'object') cells.push(cell as RawCell);
        }
      }
    }
  }

  if (cells.length === 0) return null;

  let activeMs = 0;
  let keystrokes = 0;
  let deletes = 0;
  let clipboardPastes = 0;
  let autocompletePastes = 0;
  let imePastes = 0;
  let fieldCount = 0;
  let completePasteFields = 0;

  for (const cell of cells) {
    const meta = (cell.meta && typeof cell.meta === 'object' ? cell.meta : {}) as Record<
      string,
      unknown
    >;
    const cellKeystrokes = asNumber(meta['keystrokes']);
    activeMs += asNumber(meta['activeMs']);
    keystrokes += cellKeystrokes;
    deletes += asNumber(meta['deletes']);

    let cellClipboard = 0;
    if (Array.isArray(cell.pastes)) {
      for (const paste of cell.pastes) {
        const source = (paste as { source?: unknown } | null)?.source;
        if (source === 'clipboard') {
          clipboardPastes += 1;
          cellClipboard += 1;
        } else if (source === 'autocomplete') {
          autocompletePastes += 1;
        } else if (source === 'ime') {
          imePastes += 1;
        }
      }
    }

    const hasText = typeof cell.text === 'string' && cell.text.trim().length > 0;
    if (hasText) {
      fieldCount += 1;
      // Complete-paste field: content arrived by clipboard and was not typed. Clipboard
      // only; IME/autocomplete never qualify (ADR-0004 false-positive guard).
      if (cellClipboard >= 1 && cellKeystrokes <= KEYSTROKE_FLOOR_PER_FIELD) {
        completePasteFields += 1;
      }
    }
  }

  if (fieldCount === 0) return null;

  let label: string;
  if (completePasteFields >= 1 && completePasteFields / fieldCount >= 0.34) {
    label = 'Substantial pasted content';
  } else if (autocompletePastes > 0 || imePastes > 0) {
    label = 'Typed, autocomplete-assisted';
  } else {
    label = 'Hand-typed throughout';
  }

  return {
    activeMs,
    keystrokes,
    deletes,
    clipboardPastes,
    autocompletePastes,
    imePastes,
    fieldCount,
    completePasteFields,
    label,
  };
}

/**
 * Build ranked soft nudges from a profile. Strongest structural signal first, weakest and
 * most gameable (time) last. Autocomplete/IME are never referenced here. Every nudge
 * requires a paste-dominant conjunct, so a fast honest typist (Students 2 and 3) is silent.
 */
export function buildNudges(profile: AuthorshipProfile): Nudge[] {
  const nudges: Nudge[] = [];
  const { fieldCount, keystrokes, activeMs, completePasteFields } = profile;

  if (fieldCount < MIN_FIELDS_FOR_NUDGE) return nudges;

  if (
    keystrokes / fieldCount < NEAR_ZERO_KS_PER_FIELD &&
    completePasteFields >= COMPLETE_PASTE_MIN_COUNT
  ) {
    nudges.push({
      id: 'near-zero-authorship',
      severity: 'notice',
      text: `Near-zero original authorship: ${keystrokes} keystrokes across ${fieldCount} responses`,
    });
  }

  if (
    completePasteFields >= COMPLETE_PASTE_MIN_COUNT &&
    completePasteFields / fieldCount >= COMPLETE_PASTE_RATIO
  ) {
    nudges.push({
      id: 'complete-paste-majority',
      severity: 'notice',
      text: `${completePasteFields} of ${fieldCount} responses are complete unedited pastes`,
    });
  }

  // Low time alone never fires; it needs the paste-context conjunct so a fast honest typist
  // who finishes quickly is not flagged.
  if (
    activeMs / fieldCount < LOW_TIME_MS_PER_FIELD &&
    completePasteFields >= COMPLETE_PASTE_MIN_COUNT
  ) {
    nudges.push({
      id: 'low-active-time',
      severity: 'info',
      text: `Total active time ${formatMs(activeMs)} is untypical for a full report`,
    });
  }

  return nudges;
}
