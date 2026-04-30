import { describe, expect, it } from 'vitest';
import { snellsLawLab } from '@/content/labs';

describe("snellsLawLab derived formulas", () => {
  it('evaluates Part 2 sin columns for a known row', () => {
    const dataTableSection = snellsLawLab.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'part2Table',
    );

    expect(dataTableSection).toBeDefined();
    if (!dataTableSection || dataTableSection.kind !== 'dataTable') {
      throw new Error('Expected part2Table dataTable section');
    }

    const sinIncident = dataTableSection.columns.find((column) => column.id === 'sinIncidentAngle');
    const sinRefracted = dataTableSection.columns.find((column) => column.id === 'sinRefractedAngle');

    expect(sinIncident?.kind).toBe('derived');
    expect(sinRefracted?.kind).toBe('derived');

    if (!sinIncident || sinIncident.kind !== 'derived' || !sinRefracted || sinRefracted.kind !== 'derived') {
      throw new Error('Expected derived columns to exist');
    }

    const numericRow = {
      incidentAngle: 30,
      refractedAngle: 19.47122063449069,
    };

    const sinIncidentValue = sinIncident.formula(numericRow);
    const sinRefractedValue = sinRefracted.formula(numericRow);

    expect(sinIncidentValue).toBeCloseTo(0.5, 6);
    expect(sinRefractedValue).toBeCloseTo(1 / 3, 6);
  });

  it('evaluates Part 3 sin columns for a known row', () => {
    const dataTableSection = snellsLawLab.sections.find(
      (section) => section.kind === 'dataTable' && section.tableId === 'part3Table',
    );

    expect(dataTableSection).toBeDefined();
    if (!dataTableSection || dataTableSection.kind !== 'dataTable') {
      throw new Error('Expected part3Table dataTable section');
    }

    const sinIncident = dataTableSection.columns.find((column) => column.id === 'sinIncidentAngle');
    const sinRefracted = dataTableSection.columns.find((column) => column.id === 'sinRefractedAngle');

    expect(sinIncident?.kind).toBe('derived');
    expect(sinRefracted?.kind).toBe('derived');

    if (!sinIncident || sinIncident.kind !== 'derived' || !sinRefracted || sinRefracted.kind !== 'derived') {
      throw new Error('Expected derived columns to exist');
    }

    const numericRow = {
      incidentAngle: 40,
      refractedAngle: 25,
    };

    const sinIncidentValue = sinIncident.formula(numericRow);
    const sinRefractedValue = sinRefracted.formula(numericRow);

    expect(sinIncidentValue).toBeCloseTo(Math.sin((40 * Math.PI) / 180), 6);
    expect(sinRefractedValue).toBeCloseTo(Math.sin((25 * Math.PI) / 180), 6);
  });
});
