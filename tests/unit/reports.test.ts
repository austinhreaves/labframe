import { beforeEach, describe, expect, it } from 'vitest';

import { makeReportKey } from '@/state/persistence/keys';
import { listCourseReports, type ReportMeta } from '@/state/reports';

function seedReport(meta: Omit<ReportMeta, 'key'>) {
  const key = makeReportKey(meta);
  localStorage.setItem(key, JSON.stringify({ ...meta, key }));
}

const base = {
  courseId: 'phy114',
  studentName: 'Ada Lovelace',
  signature: 'abc12345',
  filename: 'ChargeBuildup_AdaLovelace_2026-07-01_abc12345.pdf',
  bytes: 12345,
};

describe('listCourseReports', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a student course reports newest first', async () => {
    seedReport({ ...base, labId: 'chargeBuildup', submittedAt: 1_700_000_000_000 });
    seedReport({ ...base, labId: 'coulombsLaw', submittedAt: 1_800_000_000_000 });

    const reports = await listCourseReports('phy114', 'Ada Lovelace');

    expect(reports.map((r) => r.labId)).toEqual(['coulombsLaw', 'chargeBuildup']);
    expect(reports[0]?.filename).toBe(base.filename);
    expect(reports[0]?.key).toBe('report:phy114:coulombsLaw:Ada Lovelace');
  });

  it('scopes to the given student and course', async () => {
    seedReport({ ...base, labId: 'chargeBuildup', submittedAt: 1 });
    seedReport({ ...base, studentName: 'Someone Else', labId: 'coulombsLaw', submittedAt: 2 });
    seedReport({ ...base, courseId: 'phy132', labId: 'chargeBuildup', submittedAt: 3 });

    const reports = await listCourseReports('phy114', 'Ada Lovelace');

    expect(reports).toHaveLength(1);
    expect(reports[0]?.labId).toBe('chargeBuildup');
  });

  it('keeps only the latest report per lab (stable key overwrites)', async () => {
    seedReport({ ...base, labId: 'chargeBuildup', submittedAt: 1, signature: 'old00000' });
    seedReport({ ...base, labId: 'chargeBuildup', submittedAt: 2, signature: 'new11111' });

    const reports = await listCourseReports('phy114', 'Ada Lovelace');

    expect(reports).toHaveLength(1);
    expect(reports[0]?.signature).toBe('new11111');
  });

  it('returns nothing for a blank student name', async () => {
    seedReport({ ...base, labId: 'chargeBuildup', submittedAt: 1 });

    expect(await listCourseReports('phy114', '')).toEqual([]);
    expect(await listCourseReports('phy114', '   ')).toEqual([]);
  });
});
