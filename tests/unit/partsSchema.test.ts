import { describe, expect, it } from 'vitest';

import { LabSchema } from '@/domain/schema';

type RawLab = Parameters<typeof LabSchema.parse>[0];

function labWithParts(parts: unknown): RawLab {
  return {
    id: 'partsTest',
    title: 'Parts test',
    description: '',
    category: 'Physics',
    simulations: {
      simA: { title: 'Sim A', url: 'https://example.com/a' },
      simB: { title: 'Sim B', url: 'https://example.com/b' },
    },
    // Six trivial sections so ranges have room to be valid or out of bounds.
    sections: Array.from({ length: 6 }, () => ({ kind: 'instructions', html: 'x' })),
    parts,
  } as RawLab;
}

describe('LabSchema parts validation', () => {
  it('accepts a contiguous prefix of parts that leaves a review tail', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [0, 3] },
        { key: '2', title: 'Two', simulationId: 'simB', sectionRange: [3, 5] },
      ]),
    );
    // Parts cover [0, 5); section 5 is the allowed review tail.
    expect(result.success).toBe(true);
  });

  it('allows the same simulationId across parts', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [0, 3] },
        { key: '2', title: 'Two', simulationId: 'simA', sectionRange: [3, 6] },
      ]),
    );
    expect(result.success).toBe(true);
  });

  it('rejects parts that do not start at index 0', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [1, 3] },
        { key: '2', title: 'Two', simulationId: 'simB', sectionRange: [3, 6] },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a gap between parts', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [0, 2] },
        { key: '2', title: 'Two', simulationId: 'simB', sectionRange: [3, 6] },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a range that exceeds the section count', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [0, 3] },
        { key: '2', title: 'Two', simulationId: 'simB', sectionRange: [3, 9] },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a part whose key is the reserved "review"', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: 'review', title: 'One', simulationId: 'simA', sectionRange: [0, 3] },
        { key: '2', title: 'Two', simulationId: 'simB', sectionRange: [3, 6] },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it('rejects an unknown simulationId', () => {
    const result = LabSchema.safeParse(
      labWithParts([
        { key: '1', title: 'One', simulationId: 'simA', sectionRange: [0, 3] },
        { key: '2', title: 'Two', simulationId: 'missing', sectionRange: [3, 6] },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it('still accepts a lab with no parts', () => {
    const lab = labWithParts(undefined);
    delete (lab as { parts?: unknown }).parts;
    expect(LabSchema.safeParse(lab).success).toBe(true);
  });
});
