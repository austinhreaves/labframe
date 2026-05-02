import { describe, expect, it } from 'vitest';

import { validateStudentInfoForPdf } from '@/services/integrity/preflight';

describe('validateStudentInfoForPdf', () => {
  it('fails for empty student name', () => {
    expect(validateStudentInfoForPdf({ studentName: '' })).toEqual({
      ok: false,
      missing: ['studentName'],
    });
  });

  it('fails for whitespace-only student name', () => {
    expect(validateStudentInfoForPdf({ studentName: '   ' })).toEqual({
      ok: false,
      missing: ['studentName'],
    });
  });

  it('fails for legacy Student placeholder', () => {
    expect(validateStudentInfoForPdf({ studentName: 'Student' })).toEqual({
      ok: false,
      missing: ['studentName'],
    });
  });

  it('passes for valid student name', () => {
    expect(validateStudentInfoForPdf({ studentName: ' Austin Reaves ' })).toEqual({
      ok: true,
    });
  });
});
