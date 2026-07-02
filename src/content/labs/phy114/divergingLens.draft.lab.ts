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
      tocLabel: 'Background: The Diverging Lens',
      pdfHidden: true,
      html: `## Background: The Diverging Lens

A **diverging (concave) lens** is thinner in the middle than at the edges, so it spreads incoming parallel rays apart instead of bringing them together. Those rays leave the lens as if they came from a single point on the *object* side, a **virtual focal point**. By convention this makes the focal length of a diverging lens **negative** ($f < 0$).

Unlike a converging lens, a diverging lens forms the same kind of image for a real object at *any* distance:

- **Same side as the object.** The rays never actually cross; only their backward extensions meet, on the object's side. The image is always **virtual** and never switches sides.
- **Always upright**, because the rays do not cross.
- **Always smaller** than the object, and located between the lens and the focal point.

Moving the object changes the image only slightly (it stays small and upright). Because the image is virtual it cannot be projected on a screen, but looking through the lens the eye sees the object shrunk and upright.`,
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
      tocLabel: 'Background: Thin-Lens Equation with Diverging-Lens Signs',
      pdfHidden: true,
      html: `## Background: The Thin-Lens Equation with Diverging-Lens Signs

The same **thin-lens equation** from the converging-lens lab applies here:

$$\\frac{1}{f} = \\frac{1}{d_0} + \\frac{1}{d_i}$$

with the same sign conventions: $d_0$ is positive for a real object, and $d_i$ is **negative** for a virtual image. A diverging lens always forms a virtual image, so $d_i$ is always negative, and $f$ comes out **negative** as a diverging lens requires. Record the image distance as a negative number, carry the sign through, and check that your computed $f$ is negative: a positive focal length for a concave lens is the sign of a dropped minus.

---

Magnification is found the same two ways as before:

$$M = -\\frac{d_i}{d_0} = \\frac{h_i}{h_0}$$

Since $d_i$ is negative, $M = -d_i/d_0$ is **positive** (upright) and between 0 and 1 (reduced), matching what you observed. The two expressions must agree, so computing $M$ both ways checks your measurements.`,
    },
    {
      kind: 'instructions',
      html: `### Part 2B: Diverging/Concave Lens (Quantitative)


**Instructions:**



1. At the top right, grab the horizontal and vertical rulers from the toolbar.
2. With the same lens, RoC, n, and D parameters from Part 2A, use the horizontal ruler to place the object at the object distance $d_0$ (see Part 2B Parameters). You may enable rays for a visual aide if you wish.
3. Use the rulers to measure the image distance $d_i$, object height $h_0$, and image height $h_i$ and record your measurements in the Part 2B data table. Don't forget: the virtual image has a negative image distance.
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
      captionFieldId: 'part2B_caption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part2B_focalLengthCalculation',
      prompt:
        'Calculate the experimental focal length using $1/f = 1/d_0 + 1/d_i$. Show work and units.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part2B_magnificationCalculation',
      prompt:
        'Compute the magnification two ways: $M = -d_i/d_0$ and $M = h_i/h_0$. If these magnifications do not agree, please reach out for help before moving on.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Many, Principal, and Marginal Rays',
      pdfHidden: true,
      html: `## Background: Many, Principal, and Marginal Rays

Light leaves each point of the object in every direction; a ray diagram is a choice of which paths to draw.

- **Many rays** shows a fan of paths, a reminder that the image is formed by countless rays, not just a chosen few.
- **Principal rays** keeps the three rays whose paths are known by rule: one through the center of the lens (undeflected), one arriving parallel to the axis and leaving through a focal point, and one aimed at a focal point that leaves parallel to the axis. Any two of them already fix the image, which is why hand-drawn diagrams use these.
- **Marginal rays** uses the center ray plus the two that just graze the top and bottom edges of the lens, showing how the finite lens size bounds the light that forms the image.

The simulation draws a two-dimensional slice, so it shows three principal or three marginal rays; a real lens has a full cone of them around the optical axis.`,
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
      tocLabel: 'Background: The Lens-Maker Equation',
      pdfHidden: true,
      html: `## Background: The Lens-Maker Equation

The focal length of a thin lens is set by its material and the curvature of its two surfaces. For a lens of index of refraction $n$ in air,

$$\\frac{1}{f} = (n - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$$

where $R_1$ and $R_2$ are the radii of curvature of the first and second surfaces (in the order the light meets them). Each radius is positive when its center of curvature lies on the outgoing side of the surface and negative when it lies on the incoming side.

For the symmetric lenses in this simulation, both surfaces share one radius-of-curvature magnitude $R$, and the signs give a simple pair of results:

- **Symmetric convex (converging):** $f = \\frac{R}{2(n - 1)}$, a positive focal length.
- **Symmetric concave (diverging):** $f = -\\frac{R}{2(n - 1)}$, a negative focal length.

Compare each theoretical $f$ to your experimental value with a percent error.`,
    },
    {
      kind: 'instructions',
      html: `### Part 4A (Optional Extra Credit, up to +3 pts): Lens-Maker Equation and Theoretical Focal Length


**Using the Lens-Maker Equation from the background above:**`,
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
      html: '## Discussion and Conclusion',
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
