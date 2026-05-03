import { describe, expect, it } from 'vitest';

import { LabSchema } from '@/domain/schema';
import { snellsLawLab } from '@/content/labs';

describe('Phase 0 definition of done', () => {
  it('prints and validates Snell schema structure', () => {
    const parsed = LabSchema.parse(snellsLawLab);
    const dump = JSON.stringify(parsed, null, 2);

    // eslint-disable-next-line no-console -- required by Phase 0 DoD verification.
    console.log(dump);

    expect(parsed.id).toBe('snellsLaw');
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(dump).toContain('"tableId": "part1Table"');
    expect(dump).toContain('"tableId": "part2Table"');
    expect(dump).toContain('"tableId": "part3Table"');
    expect(dump).toContain('"imageId": "part4Image"');
  });
});
