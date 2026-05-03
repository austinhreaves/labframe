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
      schemaVersion: 2,
      meta: {
        studentName: 'Test Student',
        semester: 'Spring',
        session: 'A',
        year: '2026',
        taName: 'TA One',
      },
      integrity: { signedAs: 'Test Student' },
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
        setupPhoto: { idbKey: 'img:phy132:snellsLaw:test:setupPhoto', mime: 'image/png', bytes: 4567 },
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
        setupPhoto: { bytes: 4567, mime: 'image/png', idbKey: 'img:phy132:snellsLaw:test:setupPhoto' },
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
      integrity: { signedAs: 'Test Student' },
      meta: {
        taName: 'TA One',
        year: '2026',
        session: 'A',
        semester: 'Spring',
        studentName: 'Test Student',
      },
      schemaVersion: 2,
    };

    expect(canonicalize(answersA)).toBe(canonicalize(answersB));
  });
});
