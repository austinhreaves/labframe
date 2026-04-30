import { describe, expect, it } from 'vitest';
import { snellsLawLab } from '@/content/labs';

describe("snellsLawLab derived formulas", () => {
  it('evaluates sin columns and ratio for a known row', () => {
    const dataTableSection = snellsLawLab.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'snellsMeasurements',
    );

    expect(dataTableSection).toBeDefined();
    if (!dataTableSection || dataTableSection.kind !== 'dataTable') {
      throw new Error('Expected snellsMeasurements dataTable section');
    }

    const sinIncident = dataTableSection.columns.find((column) => column.id === 'sinIncident');
    const sinRefracted = dataTableSection.columns.find((column) => column.id === 'sinRefracted');
    const ratio = dataTableSection.columns.find((column) => column.id === 'indexRatio');

    expect(sinIncident?.kind).toBe('derived');
    expect(sinRefracted?.kind).toBe('derived');
    expect(ratio?.kind).toBe('derived');

    if (
      !sinIncident ||
      sinIncident.kind !== 'derived' ||
      !sinRefracted ||
      sinRefracted.kind !== 'derived' ||
      !ratio ||
      ratio.kind !== 'derived'
    ) {
      throw new Error('Expected derived columns to exist');
    }

    const numericRow = {
      incidentDeg: 30,
      refractedDeg: 19.47122063449069,
      sinIncident: sinIncident.formula({ incidentDeg: 30 }),
      sinRefracted: sinRefracted.formula({ refractedDeg: 19.47122063449069 }),
    };

    const indexRatio = ratio.formula(numericRow);

    expect(numericRow.sinIncident).toBeCloseTo(0.5, 6);
    expect(numericRow.sinRefracted).toBeCloseTo(1 / 3, 6);
    expect(indexRatio).toBeCloseTo(1.5, 6);
  });
});
