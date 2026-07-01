import { describe, expect, it } from 'vitest';

import { buildAuthorshipProfile, buildNudges } from '../../api/_authorship';

/**
 * Compact spec for one field/table cell. Only the metrics the profile reads matter; the
 * helper synthesizes a schema-shaped `{text, pastes, meta}` from it.
 */
type CellSpec = {
  text?: string;
  keystrokes?: number;
  activeMs?: number;
  deletes?: number;
  clipboard?: number;
  autocomplete?: number;
  ime?: number;
};

function cell(spec: CellSpec) {
  const pastes: Array<{ source: string; text: string; at: number; offset: number }> = [];
  const push = (source: string, n: number) => {
    for (let i = 0; i < n; i += 1) pastes.push({ source, text: 'x', at: 0, offset: 0 });
  };
  push('clipboard', spec.clipboard ?? 0);
  push('autocomplete', spec.autocomplete ?? 0);
  push('ime', spec.ime ?? 0);
  return {
    text: spec.text ?? 'answer',
    pastes,
    meta: {
      activeMs: spec.activeMs ?? 0,
      keystrokes: spec.keystrokes ?? 0,
      deletes: spec.deletes ?? 0,
    },
  };
}

function canonicalFromFields(specs: CellSpec[]): string {
  const fields: Record<string, ReturnType<typeof cell>> = {};
  specs.forEach((spec, i) => {
    fields[`f${i}`] = cell(spec);
  });
  return JSON.stringify({ fields, tables: {} });
}

function repeat(spec: CellSpec, n: number): CellSpec[] {
  return Array.from({ length: n }, () => ({ ...spec }));
}

describe('buildAuthorshipProfile', () => {
  it('returns null for non-parsing canonical', () => {
    expect(buildAuthorshipProfile('{not json')).toBeNull();
  });

  it('returns null when there are no fields or table cells', () => {
    expect(buildAuthorshipProfile(JSON.stringify({ fields: {}, tables: {} }))).toBeNull();
  });

  it('aggregates table cells, not just fields', () => {
    const canonical = JSON.stringify({
      fields: {},
      tables: {
        t1: [{ c1: cell({ keystrokes: 10 }), c2: cell({ clipboard: 1, keystrokes: 0 }) }],
      },
    });
    const profile = buildAuthorshipProfile(canonical);
    expect(profile).not.toBeNull();
    expect(profile?.fieldCount).toBe(2);
    expect(profile?.keystrokes).toBe(10);
    expect(profile?.clipboardPastes).toBe(1);
    expect(profile?.completePasteFields).toBe(1);
  });

  it('an IME-only paste never marks a complete-paste field', () => {
    const profile = buildAuthorshipProfile(canonicalFromFields([{ ime: 1, keystrokes: 0 }]));
    expect(profile?.imePastes).toBe(1);
    expect(profile?.completePasteFields).toBe(0);
  });

  it('does not count empty-text cells toward fieldCount', () => {
    const profile = buildAuthorshipProfile(
      canonicalFromFields([
        { text: '', clipboard: 1 },
        { text: 'real', keystrokes: 5 },
      ]),
    );
    expect(profile?.fieldCount).toBe(1);
  });
});

describe('Student 1 (paste-driven)', () => {
  // 20 responses, 72 keystrokes total, one clipboard paste each, 18 complete pastes.
  const specs: CellSpec[] = [
    ...repeat({ clipboard: 1, keystrokes: 2, activeMs: 14150 }, 18),
    ...repeat({ clipboard: 1, keystrokes: 18, activeMs: 14150 }, 2),
  ];
  const profile = buildAuthorshipProfile(canonicalFromFields(specs));

  it('profiles as substantial pasted content', () => {
    expect(profile).not.toBeNull();
    expect(profile?.fieldCount).toBe(20);
    expect(profile?.keystrokes).toBe(72);
    expect(profile?.clipboardPastes).toBe(20);
    expect(profile?.completePasteFields).toBe(18);
    expect(profile?.label).toBe('Substantial pasted content');
  });

  it('yields all three nudges, strongest first', () => {
    const nudges = buildNudges(profile!);
    expect(nudges.map((n) => n.id)).toEqual([
      'near-zero-authorship',
      'complete-paste-majority',
      'low-active-time',
    ]);
  });
});

describe('Student 2 (hand-typed, no pastes)', () => {
  const profile = buildAuthorshipProfile(
    canonicalFromFields(repeat({ keystrokes: 312, deletes: 48, activeMs: 336000 }, 20)),
  );

  it('profiles as hand-typed with no nudges', () => {
    expect(profile?.label).toBe('Hand-typed throughout');
    expect(profile?.clipboardPastes).toBe(0);
    expect(buildNudges(profile!)).toEqual([]);
  });
});

describe('Student 3 (fast typist, autocomplete-assisted)', () => {
  // High keystrokes, zero clipboard, autocomplete spread across responses.
  const profile = buildAuthorshipProfile(
    canonicalFromFields(repeat({ keystrokes: 332, autocomplete: 3, activeMs: 100000 }, 20)),
  );

  it('profiles as autocomplete-assisted and never nudges on autocomplete', () => {
    expect(profile?.label).toBe('Typed, autocomplete-assisted');
    expect(profile?.clipboardPastes).toBe(0);
    expect(profile?.autocompletePastes).toBe(60);
    expect(profile?.completePasteFields).toBe(0);
    expect(buildNudges(profile!)).toEqual([]);
  });
});

describe('tiny labs', () => {
  it('suppresses all nudges below the minimum field count', () => {
    // 4 all-paste responses: would trip every gate except the field-count floor.
    const profile = buildAuthorshipProfile(
      canonicalFromFields(repeat({ clipboard: 1, keystrokes: 0, activeMs: 1000 }, 4)),
    );
    expect(profile?.completePasteFields).toBe(4);
    expect(buildNudges(profile!)).toEqual([]);
  });
});
