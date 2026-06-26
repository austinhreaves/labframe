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

export const phy114SnellsLawLab: Lab = {
  id: 'snellsLaw',
  title: "Snell's Law",
  description:
    'Explore light refraction across known and unknown media using simulation measurements, slope fitting, and critical-angle analysis.',
  category: 'Physics',
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
      tocHidden: true,
      html: [
        '## Integrity Agreement',
        'Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.',
      ].join('\n\n'),
    },
    {
      kind: 'objective',
      fieldId: 'objective',
      prompt:
        'Objective: Explain the goal of the experiment in your own words. Two or three sentences are sufficient.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: [
        '## Background:',
        "When light crosses the boundary between two materials it is partially reflected and partially refracted (bent). How much the beam bends depends on each material's **index of refraction**, defined as:",
        '**n = c / v** (Eq. 1)',
        'where c is the speed of light in vacuum and v is the speed of light in the material. Because v is always less than or equal to c, the index of refraction is always greater than or equal to 1.',
        '**Law of Reflection.** The angle of incidence always equals the angle of reflection, where both angles are measured from the normal (perpendicular to the boundary):',
        "**theta_1 = theta_1'** (Eq. 2)",
        "**Snell's Law.** The refracted angle theta_2 is related to the incident angle theta_1 by:",
        '**n_1 sin(theta_1) = n_2 sin(theta_2)** (Eq. 3)',
        'When n_2 > n_1, the refracted beam bends toward the normal; when n_2 < n_1, it bends away.',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## Part 1: Reflection and Refraction for Known Media',
        '**Step 1.** Launch the simulation and select the Intro view.',
        '**Step 2.** Turn on the laser by clicking the red button. The laser angle can be adjusted by clicking and dragging it.',
        '**Step 3.** Leave the upper medium as air and set the lower medium to refractive index n2 from your parameter set. Record n2 below.',
        '**Step 4.** Drag the protractor and align its center with the vertical dotted line where the laser crosses the boundary.',
        '**Step 5.** For each incident angle theta_1 in your parameter set, record incident, refracted, and reflected angles in Table 1.',
      ].join('\n\n'),
    },
    {
      kind: 'measurement',
      fieldId: 'part1_n2',
      label: 'n2',
    },
    {
      kind: 'dataTable',
      tableId: 'part1Table',
      rowCount: 3,
      points: 1.5,
      columns: [
        { id: 'incidentAngle', label: 'Incident angle (deg)', kind: 'input', unit: 'deg' },
        { id: 'refractedAngle', label: 'Refracted angle (deg)', kind: 'input', unit: 'deg' },
        { id: 'reflectedAngle', label: 'Reflected angle (deg)', kind: 'input', unit: 'deg' },
      ],
    },
    {
      kind: 'concept',
      fieldId: 'part1AngleComparisonQuestion',
      prompt:
        'How do the angles of incidence compare to the angles of reflection? Is this what you expected?',
      rows: 3,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part1SampleCalculation',
      prompt:
        "For one of the incident angles (it does not matter which), show a sample calculation of the corresponding refracted angle using Snell's Law. Show all intermediate steps. Does your calculated value agree with your measured value?",
      equationEditor: true,
      points: 2,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 2 - Refraction for Unknown Media (Mystery Material A)',
        '**Step 1.** Replace the lower medium with Mystery Material A and set the upper medium to refractive index n1 from your parameter set. Record n1 below.',
        '**Step 2.** Use incident angles 10, 20, 30, 40, and 50 degrees from vertical. Measure refracted angles and complete Table 2. Reflected angles are not needed.',
      ].join('\n\n'),
    },
    {
      kind: 'measurement',
      fieldId: 'part2_n1',
      label: 'n1',
    },
    {
      kind: 'dataTable',
      tableId: 'part2Table',
      rowCount: 5,
      points: 2,
      columns: [
        { id: 'incidentAngle', label: 'Incident angle (deg)', kind: 'input', unit: 'deg' },
        { id: 'refractedAngle', label: 'Refracted angle (deg)', kind: 'input', unit: 'deg' },
        {
          id: 'sinIncidentAngle',
          label: 'sin(theta_1)',
          kind: 'derived',
          formulaLabel: 'sin(theta_i)',
          deps: ['incidentAngle'],
          precision: 4,
          formula: sinFromDegrees('incidentAngle'),
        },
        {
          id: 'sinRefractedAngle',
          label: 'sin(theta_A)',
          kind: 'derived',
          formulaLabel: 'sin(theta_r)',
          deps: ['refractedAngle'],
          precision: 4,
          formula: sinFromDegrees('refractedAngle'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'part2FitPlot',
      sourceTableId: 'part2Table',
      xCol: 'sinIncidentAngle',
      yCol: 'sinRefractedAngle',
      xLabel: 'sin(theta_1)',
      yLabel: 'sin(theta_A)',
      points: 1,
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
    },
    {
      kind: 'instructions',
      html: '**Step 3.** On the graph, fit the data with a proportional model. Record the slope below.',
    },
    {
      kind: 'multiMeasurement',
      rows: [{ id: 'part2SlopeA', label: 'A (slope)' }],
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part2_n2Calculation',
      prompt:
        "Calculate n_A from the slope A and the value of n_1. (From Snell's Law, the slope of the sin-sin graph equals n_1 / n_A.)",
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## Part 3 - Refraction for Unknown Media (Mystery Material B)',
        '**Step 1.** Keep n1 unchanged and switch the lower medium to Mystery Material B.',
        '**Step 2.** Use incident angles 10, 20, 30, 40, and 50 degrees from vertical. Measure refracted angles and complete Table 3. Reflected angles are not needed.',
      ].join('\n\n'),
    },
    {
      kind: 'measurement',
      fieldId: 'part3_n1',
      label: 'n1',
    },
    {
      kind: 'dataTable',
      tableId: 'part3Table',
      rowCount: 5,
      points: 2,
      columns: [
        { id: 'incidentAngle', label: 'Incident angle (deg)', kind: 'input', unit: 'deg' },
        { id: 'refractedAngle', label: 'Refracted angle (deg)', kind: 'input', unit: 'deg' },
        {
          id: 'sinIncidentAngle',
          label: 'sin(theta_1)',
          kind: 'derived',
          formulaLabel: 'sin(theta_i)',
          deps: ['incidentAngle'],
          precision: 4,
          formula: sinFromDegrees('incidentAngle'),
        },
        {
          id: 'sinRefractedAngle',
          label: 'sin(theta_B)',
          kind: 'derived',
          formulaLabel: 'sin(theta_r)',
          deps: ['refractedAngle'],
          precision: 4,
          formula: sinFromDegrees('refractedAngle'),
        },
      ],
    },
    {
      kind: 'plot',
      plotId: 'part3FitPlot',
      sourceTableId: 'part3Table',
      xCol: 'sinIncidentAngle',
      yCol: 'sinRefractedAngle',
      xLabel: 'sin(theta_1)',
      yLabel: 'sin(theta_B)',
      points: 1,
      fits: [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ],
    },
    {
      kind: 'instructions',
      html: '**Step 3.** On the graph, fit the data with a proportional model. Record the slope below.',
    },
    {
      kind: 'multiMeasurement',
      rows: [{ id: 'part3SlopeA', label: 'A (slope)' }],
      points: 0.5,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part3_n2Calculation',
      prompt:
        "Calculate n_B from the slope A and the value of n_1. (From Snell's Law, the slope of the sin-sin graph equals n_1 / n_B.)",
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: [
        '## Background: Total Internal Reflection',
        'When light travels from a denser medium into a less dense one (n_1 > n_2), there is a maximum angle of incidence called the **critical angle** theta_c. At this angle, the refracted beam grazes along the boundary (theta_2 = 90 degrees). For any angle of incidence at or above theta_c, no light is transmitted and all light is reflected. This is **total internal reflection**. Setting theta_2 = 90 degrees in Eq. (3):',
        '**theta_c = arcsin(n_2 / n_1)** (Eq. 4)',
      ].join('\n\n'),
    },
    {
      kind: 'instructions',
      html: [
        '## Part 4 - Measurement of the Critical Angle and Consistency Check',
        '**Step 1.** Change the upper medium to Mystery A and leave the lower medium as Mystery B.',
        '**Step 2.** Starting at 0 degrees from vertical, increase the incident angle until the refracted beam vanishes and all light is reflected. Capture a screenshot of the simulation at the moment the refracted beam vanishes and attach it below. Record this critical angle below.',
      ].join('\n\n'),
    },
    {
      kind: 'image',
      imageId: 'part4Image',
      captionFieldId: 'part4Caption',
      maxMB: 5,
      points: 0.5,
    },
    {
      kind: 'measurement',
      fieldId: 'part4CriticalAngle',
      label: 'theta_c (critical angle)',
      unit: 'deg',
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: '**Step 3.** Use n_B from Part 3 and your measured critical angle theta_c to compute n_A. Compare this result to n_A from Part 2.',
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part4_n2Calculation',
      prompt: 'Calculate n_A using the critical angle formula (Eq. 4).',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part4PercentDifferenceCalculation',
      prompt:
        'Calculate the percent difference between your two n_A values (from Part 2 and Part 4).',
      equationEditor: true,
      points: 0.5,
    },
    {
      kind: 'instructions',
      html: '## Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck1',
      prompt:
        "1. Can a material's index of refraction be less than 1? Why or why not? Hint: See Eq. (1) and the paragraph that follows it.",
      rows: 3,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck2',
      prompt: '2. Why does total internal reflection require n1 > n2? Hint: see Eq. (4).',
      rows: 3,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck3',
      prompt: "3. According to Snell's Law, what happens when n1 = n2? Is this reasonable?",
      rows: 3,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'conceptCheck4',
      prompt:
        "4. Explain an application of Snell's Law (for example, medical imaging or ophthalmology). Summarize how Snell's Law enables that application and why it is interesting to you.",
      rows: 6,
      points: 2,
    },
    {
      kind: 'instructions',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Write your discussion and conclusion according to the guidelines given in the Lab Report Rubric found in the Course Information module on Canvas.',
      rows: 8,
      points: 5,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      pdfHidden: true,
      html: [
        '## PDF Report Notes',
        'The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.',
        'Review your entries before export. The signed report is the submission artifact for grading.',
      ].join('\n\n'),
    },
  ],
};
