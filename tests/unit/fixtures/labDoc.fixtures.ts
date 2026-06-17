import type { LabDoc } from '@/domain/schema';

// A 1x1 PNG (valid 8-byte signature through IEND). Decodes deterministically,
// so its byte length can be derived at runtime to keep fixtures honest.
export const PNG_1x1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function pngBytesLength(): number {
  return atob(PNG_1x1_BASE64).length;
}

/** A complete, schema-valid LabDoc exercising every MVP section kind. */
export function validLabDoc(overrides: Partial<LabDoc> = {}): LabDoc {
  const base: LabDoc = {
    schemaVersion: 1,
    meta: {
      title: 'Custom Pendulum Lab',
      author: 'Dr. Author',
      humanVersion: 'v1',
      createdAt: '2026-06-16T00:00:00.000Z',
      updatedAt: '2026-06-16T00:00:00.000Z',
    },
    simulations: {
      pendulum: {
        title: 'Pendulum Lab',
        url: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_all.html',
        allow: 'fullscreen',
      },
    },
    integrityAgreement: { customText: 'Welcome to PHY 999.' },
    assets: {
      fig1: { mime: 'image/png', dataBase64: PNG_1x1_BASE64, bytes: pngBytesLength() },
    },
    sections: [
      { kind: 'instructions', html: '## Setup\n\nOpen the sim.\n\n![diagram](asset:fig1)' },
      { kind: 'objective', fieldId: 'objective', prompt: 'State your objective.' },
      { kind: 'measurement', fieldId: 'lengthM', label: 'Length', unit: 'm' },
      {
        kind: 'multiMeasurement',
        rows: [
          { id: 'trial1', label: 'Trial 1', unit: 's' },
          { id: 'trial2', label: 'Trial 2', unit: 's' },
        ],
      },
      {
        kind: 'dataTable',
        tableId: 'swings',
        rowCount: 5,
        columns: [
          { id: 'length', label: 'Length', kind: 'input', unit: 'm' },
          { id: 'period', label: 'Period', kind: 'input', unit: 's' },
        ],
      },
      {
        kind: 'plot',
        plotId: 'periodVsLength',
        sourceTableId: 'swings',
        xCol: 'length',
        yCol: 'period',
        xLabel: 'L (m)',
        yLabel: 'T (s)',
      },
      { kind: 'image', imageId: 'photo', captionFieldId: 'photoCaption' },
      { kind: 'calculation', fieldId: 'gCalc', prompt: 'Compute g.', equationEditor: true },
      { kind: 'concept', fieldId: 'why', prompt: 'Why?', preamble: 'Think about it.' },
    ],
  };

  return { ...base, ...overrides };
}
