# Authoring a New Lab

This guide is for TAs who are comfortable editing text files but are not React developers.

## 1) Copy a nearby lab as a starting point

Pick a lab in the same course and copy it:

- PHY 132 labs live in `src/content/labs/phy132/`
- PHY 114 labs live in `src/content/labs/phy114/`

Example:

```bash
cp src/content/labs/phy132/snellsLaw.lab.ts src/content/labs/phy132/myNewLab.lab.ts
```

## 2) Update the lab schema fields

In the new file, update at least:

- `id` (must be unique within the course)
- `title`
- `description`
- `simulations`
- `sections`

The app validates lab definitions against the schema in `src/domain/schema/lab.ts`.

## 3) Export the lab from the index

Open `src/content/labs/index.ts` and add an export for the new file.

Example:

```ts
export { myNewLab } from './phy132/myNewLab.lab';
```

## 4) Enable the lab in the course manifest

Open the course file:

- `src/content/courses/phy132.course.ts`
- or `src/content/courses/phy114.course.ts`

Add the lab entry in `labs` with a `ref`, `labNumber`, and `enabled: true`.

## 5) Run locally and validate

```bash
npm run dev
```

Open the course catalog page, launch the new lab, and verify:

- Sections render
- Inputs save
- Plot/table labels are correct
- PDF export works

## 6) Run checks before opening a PR

```bash
npm run typecheck
npm run lint
npm test
```

If your change affects layout or interaction behavior, also run:

```bash
npm run test:e2e
```

## Lab content conventions

### Background / theory placement (JIT pattern)

Do not front-load all theory at the top of a lab. Place a `## Background:` instructions
block immediately before the procedural section that first uses the equations it covers.
If Parts 1-3 use Snell's Law and Part 4 uses the critical-angle formula, use two separate
Background blocks: one before Part 1 and one before Part 4. The `verify-lab` skill
penalizes missing theory and flags theory that is placed too far from where it is used.

### Sin-sin plot slope convention

When a lab plots `sin(theta_1)` on the x-axis and `sin(theta_r)` on the y-axis (as
LabFrame does by default), the proportional slope equals `n_1 / n_r`, so the derived
index is `n_r = n_1 / A`. Legacy PDF lab manuals using LoggerPro had the axes
**reversed** (sin(theta_r) on x, sin(theta_1) on y), giving slope = `n_r / n_1` and
`n_r = A * n_1`. Always write calculation prompts and Background equations to match the
LabFrame axis convention, not the legacy convention.

## 7) Open a PR

In the PR description, include:

- What lab was added or updated
- Any intentional content deviations from legacy
- Which tests you ran

This keeps review fast and helps instructors validate physics content.
