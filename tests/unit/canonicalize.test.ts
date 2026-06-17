import { describe, expect, it } from 'vitest';
import { canonicalize } from '@/services/integrity/canonicalize';
import type { LabAnswers } from '@/domain/schema';

const baseFieldValue = {
  text: 'Result',
  pastes: [{ text: 'Result', at: 1714450000000, offset: 0, source: 'clipboard' as const }],
  meta: { activeMs: 1200, keystrokes: 4, deletes: 0, firstFocusAt: 1714450000100 },
};

describe('canonicalize', () => {
  it('produces identical output for equivalent LabAnswers permutations', () => {
    const answersA: LabAnswers = {
      schemaVersion: 4,
      meta: {
        studentName: 'Test Student',
        semester: 'Spring',
        session: 'A',
        year: '2026',
        taName: 'TA One',
      },
      integrity: {
        signedAs: 'Test Student',
        aiUsed: false,
        agreementAccepted: true,
        agreementAcceptedAt: 1714450000000,
        agreementText: 'I affirm.',
      },
      fields: {
        objective: baseFieldValue,
        conclusion: { ...baseFieldValue, text: 'Conclusion text' },
      },
      tables: {
        snellsMeasurements: [
          {
            incidentDeg: { ...baseFieldValue, text: '30' },
            refractedDeg: { ...baseFieldValue, text: '19.47' },
          },
        ],
      },
      selectedFits: {
        part2FitPlot: 'proportional',
      },
      images: {
        setupPhoto: {
          idbKey: 'img:phy132:snellsLaw:test:setupPhoto',
          mime: 'image/png',
          bytes: 4567,
        },
      },
      fits: {
        snellsLawFit: { model: 'linear', parameters: { slope: 1.5, intercept: 0 }, r2: 0.998 },
      },
      status: { submitted: false, lastSavedAt: 1714450100000 },
    };

    const answersB: LabAnswers = {
      status: { lastSavedAt: 1714450100000, submitted: false },
      fits: {
        snellsLawFit: { r2: 0.998, parameters: { intercept: 0, slope: 1.5 }, model: 'linear' },
      },
      images: {
        setupPhoto: {
          bytes: 4567,
          mime: 'image/png',
          idbKey: 'img:phy132:snellsLaw:test:setupPhoto',
        },
      },
      tables: {
        snellsMeasurements: [
          {
            refractedDeg: { ...baseFieldValue, text: '19.47' },
            incidentDeg: { ...baseFieldValue, text: '30' },
          },
        ],
      },
      selectedFits: {
        part2FitPlot: 'proportional',
      },
      fields: {
        conclusion: { ...baseFieldValue, text: 'Conclusion text' },
        objective: baseFieldValue,
      },
      integrity: {
        signedAs: 'Test Student',
        aiUsed: false,
        agreementAccepted: true,
        agreementAcceptedAt: 1714450000000,
        agreementText: 'I affirm.',
      },
      meta: {
        taName: 'TA One',
        year: '2026',
        session: 'A',
        semester: 'Spring',
        studentName: 'Test Student',
      },
      schemaVersion: 4,
    };

    expect(canonicalize(answersA)).toBe(canonicalize(answersB));
  });
});

describe('canonicalize key ordering', () => {
  it('sorts object keys by UTF-16 code unit, not locale (uppercase before lowercase)', () => {
    // 'Z' (0x5A) precedes 'a' (0x61) by code unit; a locale comparator would
    // typically order 'a' before 'Z'. This pins the locale-independent contract.
    expect(canonicalize({ a: 1, Z: 2 })).toBe('{"Z":2,"a":1}');
  });

  it('orders digits and symbols ahead of letters by code unit', () => {
    expect(canonicalize({ b: 1, A: 2, _x: 3, '1': 4 })).toBe('{"1":4,"A":2,"_x":3,"b":1}');
  });

  it('produces identical output regardless of insertion order', () => {
    const left = canonicalize({ gamma: 3, Beta: 2, alpha: 1 });
    const right = canonicalize({ alpha: 1, gamma: 3, Beta: 2 });
    expect(left).toBe(right);
    expect(left).toBe('{"Beta":2,"alpha":1,"gamma":3}');
  });

  it('sorts nested object keys by code unit too', () => {
    expect(canonicalize({ outer: { b: 1, A: 2 } })).toBe('{"outer":{"A":2,"b":1}}');
  });
});
