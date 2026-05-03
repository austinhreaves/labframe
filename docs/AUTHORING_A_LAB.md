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

## 7) Open a PR

In the PR description, include:

- What lab was added or updated
- Any intentional content deviations from legacy
- Which tests you ran

This keeps review fast and helps instructors validate physics content.
