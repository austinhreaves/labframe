// PHY 114 Diverging (Concave) Lens lab.
//
// Structural split of phy114/geometricOptics.draft.lab.ts. Takes Part 2
// (2A qualitative + 2B quantitative diverging lens), Part 3A (principal /
// marginal ray types), and Part 4A (lens-maker equation extra credit). The
// converging-lens parts live in the companion phy114/convergingLens lab.
// Content is carried over essentially as-is per the "structure first, enrich
// later" decision; the only edits are to the Part 4A lens-maker prompts, which
// referenced "Part 1" (now in the other lab) and have been reworded to name the
// companion Converging Lens lab. geometricOptics was migrated with
// --strip-uncertainty, so there is no uncertainty content to remove here.
import type { Lab } from '@/domain/schema';

export const phy114DivergingLensLab: Lab = {
  id: 'divergingLens',
  title: 'Diverging (Concave) Lens',
  description:
    'Explore image formation by a diverging (concave) lens using the PhET Geometric Optics simulation, compare principal and marginal ray constructions, and (optionally) check the lens-maker equation against your measured focal lengths.',
  category: 'Physics',
  simulations: {
    geometricOptics: {
      title: 'Geometric Optics',
      url: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_all.html',
      allow: 'fullscreen',
    },
  },
  sections: [
    {
      kind: 'instructions',
      tocHidden: true,
      html: `## Integrity Agreement

Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.`,
    },
    {
      kind: 'objective',
      fieldId: 'objective',
      prompt:
        'In your own words, briefly describe the objective and goals of this diverging (concave) lens exercise.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      html: `### Part 2A: Diverging/Concave Lens (Qualitative)


**Instructions:**



1. At the top of the screen select the Diverging/Concave lens.
2. Keep the same object image you used for the converging lens (penguin recommended).
3. Check the Part 2A Parameters (see Canvas) for the Radius of Curvature (RoC), Index of Refraction (n), and Diameter (D), then set the simulation parameters accordingly. Record the parameters in the table below.
4. At the bottom left, under Rays, select None. At the bottom right, make sure the box next to Labels is checked.
5. Starting from the default object placement (to the left of the left-ward focal point), slowly drag the object towards the lens and answer the Part 2A Questions.



**Note:** Initially, keep the Rays setting at None to observe the image without visual ray aids. As you answer the observation questions, feel free to switch the Rays setting to Many, Marginal, or Principal to help visualize how light travels through the lens and confirm your observations. This will prepare you for Part 3A, where you will explore the different ray types in more detail.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part2A_radiusOfCurvature', label: 'Radius of Curvature (RoC)' },
        { id: 'part2A_indexOfRefraction', label: 'Index of Refraction (n)' },
        { id: 'part2A_diameter', label: 'Diameter (D)' },
      ],
    },
    {
      kind: 'instructions',
      html: '#### Part 2A Observation Questions',
    },
    {
      kind: 'concept',
      fieldId: 'part2A_observation1',
      prompt: `When the object is placed at various distances from the diverging/concave lens, what do you notice about the image? Describe your observations by addressing:
• Which side of the lens the image appears to form on,
• Whether the image is upright or inverted,
• Whether the image is larger, smaller, or the same size as the object.`,
      rows: 5,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part2A_observation2',
      prompt: `As you move the object closer to the lens, how does the image change?
• Does its size increase, decrease, or stay the same?
• Does the image position shift significantly?`,
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '#### Part 2A Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'part2A_concept1',
      prompt:
        'Does the image ever switch sides (i.e., form on the opposite side of the lens)? Why or why not? Explain your reasoning based on your observations and what you know about diverging lenses.',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part2A_concept2',
      prompt: `For a concave lens, the image always forms on the same side of the lens as the object. Is this image real or virtual? Justify your answer by explaining:
• Whether the light rays actually intersect at the image location,
• What the ray behavior tells you about the nature of the image,
• Whether the image is upright or inverted.`,
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      html: `### Part 2B: Diverging/Concave Lens (Quantitative)


**Instructions:**



1. At the top right, grab the horizontal and vertical rulers from the toolbar.
2. With the same lens, RoC, n, and D parameters from Part 2A, use the horizontal ruler to place the object at the object distance d<sub>₀</sub> (see Part 2B Parameters). You may enable rays for a visual aide if you wish.
3. Use the rulers to measure the image distance d<sub>ᵢ</sub>, object height h<sub>₀</sub>, and image height h<sub>ᵢ</sub> and record your measurements in the Part 2B data table. Don't forget: the virtual image has a negative image distance.
4. Take a screenshot of the simulation with all relevant labels and values clearly shown and attach it below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part2B_objectDistance', label: 'Object Distance (d₀)' },
        { id: 'part2B_imageDistance', label: 'Image Distance (dᵢ)' },
        { id: 'part2B_objectHeight', label: 'Object Height (h₀)' },
        { id: 'part2B_imageHeight', label: 'Image Height (hᵢ)' },
      ],
      points: 1,
    },
    {
      kind: 'image',
      imageId: 'part2B_screenshot',
      captionFieldId: 'part2B_screenshot',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part2B_focalLengthCalculation',
      prompt:
        'Calculate the experimental focal length using 1/f = 1/d₀ + 1/dᵢ. Show work and units.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part2B_magnificationCalculation',
      prompt:
        'Compute the magnification two ways: M = -dᵢ/d₀ and M = hᵢ/h₀. If these magnifications do not agree, please reach out for help before moving on.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'instructions',
      html: `### Part 3A: Principal and Marginal Rays (Qualitative)


**Instructions:**



1. Switch back to the Converging/Convex lens.
2. Locate the Rays menu at the bottom left of the simulation. Switch the Rays setting to Many and observe how multiple light rays travel from the object through the lens to form the image.
3. Next, change the Rays setting to Principal and observe.
4. Finally, select Marginal and observe.
5. Move the object around and observe how the paths differ between these ray options.
6. Repeat these steps using the Diverging/Concave lens, then answer the Part 3A Questions.


#### Part 3A Questions`,
    },
    {
      kind: 'concept',
      fieldId: 'part3A_manyRays',
      prompt:
        'Describe what the many rays option represents. What do these rays collectively show? How many possible paths can light take from the object to the image?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part3A_principalRays',
      prompt:
        'What do the principal rays show and why are they sufficient for basic diagrams? How many principal rays are there (in the 2D simulation)?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part3A_marginalRays',
      prompt: 'What are marginal rays? How many marginal rays appear in this 2-D view?',
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      html: `### Part 4A (Optional Extra Credit, up to +3 pts): Lens-Maker Equation and Theoretical Focal Length


**Using the Lens-Maker Equation from the lab manual:**`,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part4A_convergingTheoretical',
      prompt:
        'Calculate the theoretical focal length for the converging lens you measured in the Converging Lens lab (include units).',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part4A_divergingTheoretical',
      prompt:
        'Calculate the theoretical focal length for the diverging lens used in Part 2 (include units).',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part4A_percentError',
      prompt:
        'Calculate the percent error between the experimental and theoretical focal length for each lens (the converging lens from the Converging Lens lab, and the diverging lens from Part 2).',
      equationEditor: true,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '## DISCUSSION & CONCLUSION',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Summarize your findings for the diverging (concave) lens and the ray-tracing exercise. Discuss why a diverging lens forms the kind of image you observed, what the principal and marginal rays each represent, and how ray diagrams help visualize optical phenomena. Include any sources of error and suggestions for improvement.',
      rows: 8,
      points: 4,
    },
    {
      kind: 'instructions',
      tocHidden: true,
      pdfHidden: true,
      html: `## PDF Report Notes

The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.

Review your entries before export. The signed report is the submission artifact for grading.`,
    },
  ],
};
