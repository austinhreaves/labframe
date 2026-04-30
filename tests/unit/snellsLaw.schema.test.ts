import { describe, expect, it } from 'vitest';
import { LabSchema } from '@/domain/schema';
import { snellsLawLab } from '@/content/labs';

describe("snellsLawLab schema", () => {
  it('parses successfully with zod', () => {
    const parsed = LabSchema.parse(snellsLawLab);
    expect(parsed.id).toBe('snellsLaw');
    expect(parsed.sections.length).toBeGreaterThan(0);
  });
});
