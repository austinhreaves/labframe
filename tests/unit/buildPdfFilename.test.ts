import { describe, expect, it } from 'vitest';

import { snellsLawLab } from '@/content/labs';
import { buildPdfFilename } from '@/services/pdf/filename';

const FIXED_SIGNED_AT = 1714521600000;
const FIXED_SIGNATURE = 'abc12345ffffeeee0000';

describe('buildPdfFilename', () => {
  it('formats plain ASCII names', () => {
    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: 'Austin Reaves',
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_AustinReaves_2024-05-01_abc12345.pdf');
  });

  it('removes diacritics and title-cases each chunk', () => {
    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: 'José Müller-Sánchez',
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_JoseMullerSanchez_2024-05-01_abc12345.pdf');
  });

  it('returns Student sentinel when sanitized name is empty', () => {
    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: '李明',
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_Student_2024-05-01_abc12345.pdf');
  });

  it('handles apostrophes and hyphens', () => {
    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: "Mary O'Brien",
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_MaryOBrien_2024-05-01_abc12345.pdf');

    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: 'Anne-Marie',
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_AnneMarie_2024-05-01_abc12345.pdf');
  });

  it('keeps digits and roman numerals', () => {
    expect(
      buildPdfFilename({
        mode: 'signed',
        lab: snellsLawLab,
        studentName: 'M. Curie III',
        signedAt: FIXED_SIGNED_AT,
        signature: FIXED_SIGNATURE,
      }),
    ).toBe('SnellsLaw_MCurieIII_2024-05-01_abc12345.pdf');
  });

  it('adds DRAFT suffix for unsigned exports', () => {
    expect(
      buildPdfFilename({
        mode: 'draft',
        lab: snellsLawLab,
        studentName: 'Austin Reaves',
      }),
    ).toBe('SnellsLaw_AustinReaves_DRAFT.pdf');
  });
});
