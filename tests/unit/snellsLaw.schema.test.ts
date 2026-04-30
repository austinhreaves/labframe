import { describe, expect, it } from 'vitest';
import { LabSchema } from '@/domain/schema';
import { snellsLawLab } from '@/content/labs';

describe("snellsLawLab schema", () => {
  it('parses successfully with zod', () => {
    const parsed = LabSchema.parse(snellsLawLab);
    expect(parsed.id).toBe('snellsLaw');
    expect(parsed.sections.length).toBeGreaterThan(0);

    const part1Table = parsed.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'part1Table',
    );
    const part2Table = parsed.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'part2Table',
    );
    const part3Table = parsed.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'part3Table',
    );
    const part4Image = parsed.sections.find(
      (section) => section.kind === 'image' && section.imageId === 'part4Image',
    );

    expect(part1Table).toBeDefined();
    expect(part2Table).toBeDefined();
    expect(part3Table).toBeDefined();
    expect(part4Image).toBeDefined();
  });
});
