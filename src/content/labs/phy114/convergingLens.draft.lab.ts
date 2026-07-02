// PHY 114 Converging (Convex) Lens lab.
//
// Structural split of phy114/geometricOptics.draft.lab.ts (Part 1: 1A
// qualitative + 1B quantitative). The diverging-lens parts (2A/2B), the
// ray-types part (3A), and the lens-maker extra credit (4A) live in the
// companion phy114/divergingLens lab. Content is carried over essentially
// as-is per the "structure first, enrich later" decision; the only edit is
// dropping the Part 1A note's forward-reference to Part 3A, which is now in
// the other lab. geometricOptics was migrated with --strip-uncertainty, so
// there is no uncertainty content to remove here.
import type { Lab } from '@/domain/schema';

export const phy114ConvergingLensLab: Lab = {
  id: 'convergingLens',
  title: 'Converging (Convex) Lens',
  description:
    'Explore image formation by a converging (convex) lens using the PhET Geometric Optics simulation: where real and virtual images form, and how object distance sets image distance, size, and orientation.',
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
        'In your own words, briefly describe the objective and goals of this converging (convex) lens exercise.',
      rows: 4,
      points: 3,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Lenses, Focal Points, and Images',
      pdfHidden: true,
      html: `## Background: Lenses, Focal Points, and Images

A **lens** uses refraction to redirect light in a controlled way. A **converging (convex) lens** is thicker in the middle than at the edges, so it bends incoming rays toward one another.

Rays arriving parallel to the *optical axis* (the horizontal line through the center of the lens) are all bent through a single point on the far side, the **focal point**. The distance from the lens to that point is the **focal length** $f$. A converging lens has a focal point on each side at the same distance, and its focal length is counted as **positive**. The focal length is fixed by the lens itself; moving the object changes where the image forms, never $f$.

---

A lens forms an **image** where the rays from each point of the object are brought back together, or appear to come from.

- A **real image** forms where the refracted rays *actually* intersect, on the opposite side of the lens from the object. Real light reaches it, so it can be projected onto a screen, and for a single lens it is inverted.
- A **virtual image** forms where the rays only *appear* to come from: they spread apart after the lens, but their backward extensions meet at a point on the *same* side as the object. No light passes through that point, so a virtual image cannot land on a screen, though the eye can see it by looking through the lens. Virtual images are upright.

The honest test for real vs. virtual is whether the rays themselves intersect at the image, or only their backward extensions do.

> [!NOTE]
> This lab treats the lens as a **thin lens**: its thickness is small compared to the object and image distances, so all the ray-bending can be treated as happening at a single plane through the lens center.`,
    },
    {
      kind: 'instructions',
      html: `### Part 1A: Converging/Convex Lens (Qualitative)


**Instructions:**



1. Open the simulation and select the Lens screen.
2. At the top left, switch the image from the pencil to your favorite option (the penguin is recommended). Do NOT use the light for this part.
3. At the bottom left, under Rays select None.
4. At the bottom right, check the box for Labels.
5. Check the Part 1A Parameters (see Canvas) for the Radius of Curvature (RoC), Index of Refraction (n), and Diameter (D), then set the simulation parameters accordingly. Record the parameters in the table below.
6. Starting from the default object placement (to the left of the left-ward focal point), slowly drag the object towards the lens and answer the Part 1A Questions.



**Note:** Initially, keep the Rays setting at None to observe the image without visual ray aids. As you answer the observation questions, feel free to switch the Rays setting to Many, Marginal, or Principal to help visualize how light travels through the lens and confirm your observations.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part1A_radiusOfCurvature', label: 'Radius of Curvature (RoC)' },
        { id: 'part1A_indexOfRefraction', label: 'Index of Refraction (n)' },
        { id: 'part1A_diameter', label: 'Diameter (D)' },
      ],
    },
    {
      kind: 'instructions',
      html: '#### Part 1A Observation Questions',
    },
    {
      kind: 'concept',
      fieldId: 'part1A_observation1',
      prompt: `When the object is placed farther from the lens than the focal length, a real image forms on the opposite side of the lens. Describe your observations in this case by addressing the following:
• Where does the image appear relative to the focal point on the opposite side of the lens?
• Is the image upright or inverted?
• Where does the object need to be placed for the image to appear larger, smaller, or the same size as the object?`,
      rows: 6,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part1A_observation2',
      prompt:
        "As you slowly move the object closer to the focal point, what happens to the image distance? Does it increase, decrease, or something else? What happens to the size of the image relative to the object's size?",
      rows: 4,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part1A_observation3',
      prompt:
        "When the object is placed closer to the lens than the focal point, where does the image appear to form? Be specific. Describe the image's location in relation to the focal point on the same side of the lens.",
      rows: 4,
      points: 1,
    },
    {
      kind: 'instructions',
      html: '#### Part 1A Concept Check Questions',
    },
    {
      kind: 'concept',
      fieldId: 'part1A_concept1',
      prompt: `When the object is within the focal length, the image appears on the same side of the lens as the object. Is this image real or virtual? How do you know? And don't say "because it's labeled that way!" Specifically, describe:
• whether the light rays actually intersect at the image location,
• which side of the lens the image forms on, and
• whether the image is upright or inverted.`,
      rows: 6,
      points: 1,
    },
    {
      kind: 'concept',
      fieldId: 'part1A_concept2',
      prompt:
        'Describe the physical difference between how real and virtual images are formed. Can a real image be projected onto a screen? Can a virtual image be projected onto a screen? Why or why not?',
      rows: 5,
      points: 1,
    },
    {
      kind: 'instructions',
      tocLabel: 'Background: Thin-Lens Equation and Magnification',
      pdfHidden: true,
      html: `## Background: The Thin-Lens Equation and Magnification

The object distance $d_0$ (lens to object), the image distance $d_i$ (lens to image), and the focal length $f$ are linked by the **thin-lens equation**:

$$\\frac{1}{f} = \\frac{1}{d_0} + \\frac{1}{d_i}$$

The signs carry the geometry: $d_0$ is positive for a real object; $d_i$ is **positive** for a real image (opposite side of the lens) and **negative** for a virtual image (same side as the object); and $f$ is positive for a converging lens. Solving for $f$ with the correct sign of $d_i$ gives the focal length from your measurements.

---

The **magnification** $M$ compares the image to the object and can be found two equivalent ways:

$$M = -\\frac{d_i}{d_0} = \\frac{h_i}{h_0}$$

where $h_0$ is the object height and $h_i$ the image height, with an inverted image counted as a **negative** height. $M$ is a pure number: negative means inverted (real images), positive means upright (virtual images); $|M| > 1$ is enlarged, $|M| < 1$ reduced. Because the two expressions must agree, computing $M$ both ways checks your four measured values.`,
    },
    {
      kind: 'instructions',
      html: `### Part 1B: Converging/Convex Lens (Quantitative)


**Instructions:**



1. At the top right, grab the horizontal and vertical rulers from the toolbar.
2. With the same lens, RoC, n, and D parameters from Part 1A, use the horizontal ruler to place the object at the object distance $d_0$ (see Part 1B Parameters). You may enable rays for a visual aide if you wish.
3. Use the rulers to measure the image distance $d_i$, object height $h_0$, and image height $h_i$ and record your measurements in the table below. Don't forget: an inverted image has a negative height!
4. Take a screenshot of the simulation with all relevant labels and values clearly shown and attach it below.`,
    },
    {
      kind: 'multiMeasurement',
      rows: [
        { id: 'part1B_objectDistance', label: 'Object Distance (d₀)' },
        { id: 'part1B_imageDistance', label: 'Image Distance (dᵢ)' },
        { id: 'part1B_objectHeight', label: 'Object Height (h₀)' },
        { id: 'part1B_imageHeight', label: 'Image Height (hᵢ)' },
      ],
      points: 1,
    },
    {
      kind: 'image',
      imageId: 'part1B_screenshot',
      captionFieldId: 'part1B_caption',
      maxMB: 5,
      points: 1,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part1B_focalLengthCalculation',
      prompt:
        'Calculate the experimental focal length using $1/f = 1/d_0 + 1/d_i$. Show work and units.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'calculation',
      responseModes: ['text', 'draw', 'image'],
      fieldId: 'part1B_magnificationCalculation',
      prompt:
        'Compute the magnification two ways: $M = -d_i/d_0$ and $M = h_i/h_0$. If these magnifications do not agree, please reach out for help before moving on.',
      equationEditor: true,
      points: 1.25,
    },
    {
      kind: 'instructions',
      html: '## Discussion and Conclusion',
    },
    {
      kind: 'concept',
      fieldId: 'discussionConclusion',
      prompt:
        'Summarize your findings for the converging (convex) lens. Discuss how the image location, size, and orientation depend on where the object sits relative to the focal point, the difference between the real and virtual images you observed, and how your experimental focal length and magnification compare with your expectations. Include any sources of error and suggestions for improvement.',
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
