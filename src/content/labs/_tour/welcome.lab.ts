import type { Lab, NumericRow } from '@/domain/schema';

// Demo showcase lab for the onboarding tour (Track D of
// docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md). It contains one of every
// section type the tour spotlights, so every Phase B anchor is guaranteed to
// exist. It is not graded and not real physics; the content is intentionally a
// short example. The tour stages on it via the /welcome route.

export const welcomeIntroLab: Lab = {
  id: 'welcome-intro',
  title: 'Getting Started',
  description:
    'A short example lab that shows how LabFrame works: run a simulation, answer prompts, record data, and export a report.',
  category: 'Tutorial',
  simulations: {
    bendingLight: {
      title: 'Bending Light',
      url: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html',
      allow: 'fullscreen',
    },
  },
  sections: [
    {
      kind: 'instructions',
      html: [
        '## Welcome to LabFrame',
        'This is an example lab. Nothing here is graded. Use it to get comfortable with how a real lab works: the simulation is on one side and your worksheet is on the other.',
        'Try a few of the prompts below. Your answers save automatically in this browser as you go.',
      ].join('\n\n'),
    },
    {
      kind: 'calculation',
      fieldId: 'eq-demo',
      prompt: 'Enter the formula for kinetic energy.',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'screenshot-demo',
      responseMode: 'image',
      prompt: 'Capture a screenshot of the simulation and upload it here.',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'calculation',
      fieldId: 'draw-demo',
      responseMode: 'draw',
      prompt: 'Draw a force diagram (free-body diagram) for an object on the surface below.',
      points: 1,
    },
    {
      kind: 'dataTable',
      tableId: 'demoTable',
      rowCount: 3,
      points: 1,
      columns: [
        { id: 'time', label: 'Time (s)', kind: 'input', unit: 's' },
        {
          id: 'timeSquared',
          label: 'Time squared (s^2)',
          kind: 'derived',
          formulaLabel: 't^2',
          deps: ['time'],
          precision: 2,
          formula: (row: NumericRow): number => {
            const t = row.time ?? 0;
            return t * t;
          },
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'demoPlot',
      sourceTableId: 'demoTable',
      xCol: 'time',
      yCol: 'timeSquared',
      xLabel: 'Time (s)',
      yLabel: 'Time squared (s^2)',
      points: 1,
      fits: [{ id: 'linear', label: 'Linear (y = mx + b)' }],
    },
  ],
};
