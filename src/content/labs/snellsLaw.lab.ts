import type { Lab, NumericRow } from '@/domain/schema';

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function sinFromDegrees(fieldName: string) {
  return (row: NumericRow): number => {
    const value = row[fieldName] ?? 0;
    return Math.sin(degreesToRadians(value));
  };
}

function refractiveIndexRatio(row: NumericRow): number {
  const sinIncident = row.sinIncident ?? 0;
  const sinRefracted = row.sinRefracted ?? 0;
  if (sinRefracted === 0) {
    return 0;
  }

  return sinIncident / sinRefracted;
}

export const snellsLawLab: Lab = {
  id: 'snellsLaw',
  title: "Snell's Law",
  description:
    'Investigate refraction by measuring incident and refracted angles and compare sin(theta_i) to sin(theta_r).',
  category: 'Physics',
  simulations: {
    bendingLight: {
      title: 'PhET: Bending Light',
      // TODO: confirm exact legacy simulation URL and query params once legacy file is available.
      url: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html',
      allow: 'fullscreen',
    },
  },
  sections: [
    {
      kind: 'instructions',
      points: 0,
      html: [
        '## Integrity Agreement',
        'Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.',
      ].join('\n\n'),
    },
    {
      kind: 'objective',
      fieldId: 'objective',
      rows: 3,
      points: 4,
    },
    {
      kind: 'instructions',
      points: 6,
      html: [
        '## Part 1: Refraction Data',
        'Use the simulation to measure incident and refracted angles for multiple trials.',
        // TODO: replace with exact trial instructions/wording from legacy Snell form.
      ].join('\n\n'),
    },
    {
      kind: 'dataTable',
      tableId: 'snellsMeasurements',
      rowCount: 6,
      points: 24,
      columns: [
        { id: 'trial', label: 'Trial', kind: 'input' },
        { id: 'incidentDeg', label: 'Incident Angle (deg)', kind: 'input', unit: 'deg' },
        { id: 'refractedDeg', label: 'Refracted Angle (deg)', kind: 'input', unit: 'deg' },
        {
          id: 'sinIncident',
          label: 'sin(theta_i)',
          kind: 'derived',
          deps: ['incidentDeg'],
          precision: 4,
          formula: sinFromDegrees('incidentDeg'),
        },
        {
          id: 'sinRefracted',
          label: 'sin(theta_r)',
          kind: 'derived',
          deps: ['refractedDeg'],
          precision: 4,
          formula: sinFromDegrees('refractedDeg'),
        },
        {
          id: 'indexRatio',
          label: 'sin(theta_i) / sin(theta_r)',
          kind: 'derived',
          deps: ['sinIncident', 'sinRefracted'],
          precision: 4,
          formula: refractiveIndexRatio,
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'snellsLawFit',
      sourceTableId: 'snellsMeasurements',
      xCol: 'sinRefracted',
      yCol: 'sinIncident',
      xLabel: 'sin(theta_r)',
      yLabel: 'sin(theta_i)',
      points: 12,
      fits: [{ id: 'linear', label: 'Linear Fit' }],
    },
    {
      kind: 'calculation',
      fieldId: 'indexCalculation',
      prompt:
        'Use your slope or index-ratio results to estimate the refractive index of the second medium and compare with an expected reference value.',
      equationEditor: true,
      points: 8,
    },
    {
      kind: 'concept',
      fieldId: 'uncertaintyDiscussion',
      prompt:
        'Discuss major uncertainty sources and explain whether your results support Snell’s law over your measured range.',
      rows: 6,
      points: 10,
    },
    {
      kind: 'concept',
      fieldId: 'conclusion',
      prompt: 'Write a concise conclusion summarizing your findings and physical interpretation.',
      rows: 5,
      points: 6,
    },
    {
      kind: 'instructions',
      points: 0,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include your filled responses, table values, derived values, and process record details.',
        // TODO: confirm exact report section headings from legacy PDF configuration.
      ].join('\n\n'),
    },
  ],
};
