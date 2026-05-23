# LabFrame — Polish Spec D: Landing & Catalog

**Audience:** Austin (ASU IPL) + downstream coding agents
**Status:** Third in the Path 2 lineage, after Specs A and B.
**Working name:** Phase 5.10 — Catalog & Landing
**Prereq:** Path 1 tokens. Spec A form primitives. Spec B `Button`, `SegmentedControl`, and ideally `Menu`.

---

## 0. TL;DR

The LabFrame catalog at `/labs` (and the start-page wizard at `/`) is currently a text page: `<h1>LabFrame</h1>`, a tagline, an optional wizard box, and `<section><h2>{course}</h2><ul><li><Link></li>…</ul></section>` for every course. Coming-soon labs are italic gray spans. There is no imagery, no card grid, no status, no visual hierarchy beyond bullet indentation.

This is the first surface a student sees. For a course that wants to read as "a modern product made by people who care," this page reads as "a TA wrote a directory page in 1998."

This spec replaces the listing with:

1. A **hero band** containing the wordmark, tagline, and a one-paragraph intro (replacing the bare `<h1>` + tagline).
2. **Course sections** rendered with a real section header (title + lab count + optional badge), not just `<h2>`.
3. **Lab cards** in a responsive grid, each showing lab number, title, status badge (open / coming soon), and a subtle hover affordance.
4. A **redesigned wizard** that uses cards instead of bullet lists for course and lab selection, and a real Continue button hierarchy.
5. A **collapsed About + Privacy** below the listing, rendered as collapsible disclosure cards instead of two stacked walls of text.

It also drops the "Browse all labs" footer link inside the wizard, because the catalog list is right below it on the same page.

**Honest scope estimate:** one day for the card primitives and grid, one day for the wizard rework, half a day for hero + about/privacy disclosures. Two and a half focused days.

---

## 1. Why this matters now

A student's first impression of LabFrame is set entirely by this page. Today that impression is:

- "Looks like a course directory page."
- "Wait, am I in the right place?"
- "Where's the modern app interface I expected?"

The lab itself is much more polished than the catalog, which means students get a worse first impression than the actual product deserves. Catalog polish is the lowest-effort, highest-impression-shift work on the roadmap.

Cited evidence in [src/ui/Catalog.tsx](src/ui/Catalog.tsx):
- `CatalogList` (lines 46–93): bullet lists of `<Link>`s, "coming soon" as italic spans.
- The wizard (lines 215–315): a small bordered box with raw `<button>` lists for course/lab pick.
- `AboutAndPrivacy` (lines 95–159): two giant prose `<section>`s, ~1200 words combined, no progressive disclosure.

A handful of structural changes makes this page feel like a designed front door instead of a hand-typed index.

---

## 2. Goals & non-goals

### 2.1 Goals

1. Replace the catalog list with a card grid that has visual hierarchy and status.
2. Restyle the wizard to use cards instead of bullet lists, with a clear Continue → primary-button flow.
3. Add a hero band that establishes the brand at the top of the page.
4. Collapse the About + Privacy walls of text into expandable disclosure cards.
5. Use only Spec B's `Button` and the existing token system. Don't invent new primitives unless required.

### 2.2 Non-goals

- **No new branding / logo work.** The wordmark stays text; we just give it more breathing room and an optional accent-colored dot mark.
- **No imagery or illustrations.** No hero illustration, no course photos. (Adding imagery later is trivial once cards exist; not in scope.)
- **No search or filter.** The catalog has ≤30 labs total; search is overkill. If we later need it, add it as a separate spec.
- **No re-IA of the catalog.** Course → lab is the right hierarchy. We're polishing the rendering, not redesigning the navigation.
- **No copy rewrite.** The About and Privacy text in `Catalog.tsx` stays as-is; we change the framing (disclosure cards instead of raw sections), not the words.
- **No course-level theming** (e.g., PHY 132 in one accent, PHY 114 in another). Mentioned in [POLISH_PASS_SPEC.md §9](POLISH_PASS_SPEC.md); not in this spec.

### 2.3 What this *won't* fix

The catalog is the front door but it's still ultimately a directory. It won't suddenly feel like Linear's marketing site. The goal is "this looks like a designed product index" — not "this looks like a magazine spread."

---

## 3. Visual structure

The full page top-to-bottom, after this spec:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (slim wordmark + utility row)                   │  see §3.1
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HERO BAND                                              │  see §3.2
│  LabFrame                                               │
│  Interactive Physics Labs                               │
│  One-line description.                                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  WIZARD (if showWizard)                                 │  see §3.3
│  ┌───────────────────────────────────────────────────┐ │
│  │ Get started                                        │ │
│  │ Step 1: Enter your name → Step 2: Pick a course   │ │
│  │ → Step 3: Pick a lab                              │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  COURSES SECTION                                        │  see §3.4
│  ## PHY 132                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Lab 1 │ │Lab 2 │ │Lab 3 │ │Lab 4 │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  ## PHY 114                                             │
│  …                                                      │
├─────────────────────────────────────────────────────────┤
│  ABOUT (disclosure)                                     │  see §3.5
│  PRIVACY (disclosure)                                   │
├─────────────────────────────────────────────────────────┤
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

### 3.1 Header

The catalog page does not currently render a `lab-header`. Today the page jumps straight into `<h1>LabFrame</h1>`. Add a slim header (analogous to the lab header but with fewer controls):
- Left: wordmark
- Right: nothing for v1 (no per-page theme selector here — the lab page handles theme; the catalog inherits stored preference)

This is a couple of divs. The shared layout pattern stays simple.

### 3.2 Hero band

A single block at the top, max-width ~720px, generous vertical padding. Contents:
- Wordmark "LabFrame" at `--text-2xl`, `--weight-display`, `--tracking-tight`. Optionally with a small accent-colored dot mark before or after (e.g., a 10×10 rounded square in `--accent-bg`).
- Tagline "Interactive Physics Labs" at `--text-lg`, `--weight-medium`, `--text-secondary`.
- One-line description: "Browser-based labs for ASU physics — no install, no account, no textbook." at `--text-base`, `--text-secondary`.

**CSS skeleton (in main.css):**

```css
.catalog-hero {
  padding: var(--space-7) 0 var(--space-6);
  max-width: 720px;
}
.catalog-hero-mark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-2xl);
  font-weight: var(--weight-display);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
.catalog-hero-mark::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--accent-bg);
}
.catalog-hero-tagline {
  margin-top: var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}
.catalog-hero-description {
  margin-top: var(--space-3);
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 56ch;
  line-height: var(--leading-prose);
}
```

The dot mark is optional. If Austin prefers a pure-text wordmark, drop the `::before`. (Either is fine; the dot is the cheapest way to land any accent color on the page.)

### 3.3 Wizard

Today the wizard is a small bordered box with raw `<button>` lists. Restyle:

- **Outer container:** `.catalog-wizard` keeps its card surface but gets more padding (`--space-5`) and a slight `--shadow-2` instead of `--shadow-1` (it's the active surface; should feel raised).
- **Step indicator:** add a 3-step progress strip at the top of the wizard ("1 Name · 2 Course · 3 Lab"). Current step gets accent. Each step is a small pill with the step number and label.

```tsx
<ol className="wizard-steps" aria-label="Wizard progress">
  <li data-active={step === 'name'}>1. Name</li>
  <li data-active={step === 'course'}>2. Course</li>
  <li data-active={step === 'lab'}>3. Lab</li>
</ol>
```

- **Step 1 (Name):** keep the input. Continue button = `Button` `primary` `md`. The current "Skip to course selection" button is redundant when the name is already saved and unchanged; if the saved name === current draft, hide it (or label the single button "Continue"). Don't keep two buttons that do the same thing.
- **Step 2 (Course):** render each course as a card-button, not a bullet list. Each card shows:
  - Course title (`PHY 132`)
  - Lab count (`7 core labs, 5 enrichment labs`)
  - Optional description (one line; can be empty if we don't have one in the course schema)
  - Subtle hover: border tints to `--border-accent`, slight `translateY(-1px)`.
- **Step 3 (Lab):** same card pattern, sized smaller. Show lab number + title. Disabled "coming soon" labs aren't shown in the wizard (they're for browsing, not picking). If `enabledLabs` is empty, show a friendly empty-state message ("No labs available yet — check back soon").

**Wizard step CSS skeleton:**

```css
.wizard-steps {
  display: flex;
  gap: var(--space-1);
  margin: 0 0 var(--space-4);
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
}
.wizard-steps li {
  flex: 1;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  text-align: center;
  background: var(--surface-sunken);
  color: var(--text-tertiary);
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.wizard-steps li[data-active='true'] {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: var(--weight-semibold);
}
```

### 3.4 Course sections + lab cards

Replace `CatalogList` rendering. Each course becomes:

```tsx
<section className="catalog-course">
  <header className="catalog-course-header">
    <h2 className="catalog-course-title">{course.title}</h2>
    <p className="catalog-course-meta">{coreCount} core · {enrichmentCount} enrichment</p>
  </header>

  {coreLabs.length > 0 && (
    <>
      {hasEnrichment && <h3 className="catalog-course-subhead">Core labs</h3>}
      <ul className="catalog-lab-grid">
        {coreLabs.map((labRef) => <LabCard key={labRef.ref} … />)}
      </ul>
    </>
  )}

  {hasEnrichment && (
    <>
      <h3 className="catalog-course-subhead">Enrichment labs</h3>
      <ul className="catalog-lab-grid">
        {enrichmentLabs.map((labRef) => <LabCard key={labRef.ref} … />)}
      </ul>
    </>
  )}
</section>
```

**LabCard component (small, in Catalog.tsx or its own file):**

```tsx
type LabCardProps = {
  course: Course;
  labRef: CourseLabRef;
  lab: Lab | undefined;
};
```

Render:
- Top row: lab-number pill (e.g., "Lab 4") OR group pill ("Enrichment") if no number
- Title
- Bottom: subtle hover affordance — chevron icon on the right side that nudges in on hover
- Disabled state when `!labRef.enabled`: faded text, "Coming soon" badge replaces the chevron, no link, no hover lift

**CSS skeleton:**

```css
.catalog-course { margin-top: var(--space-6); }
.catalog-course-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-3);
}
.catalog-course-title { font-size: var(--text-lg); font-weight: var(--weight-semibold); }
.catalog-course-meta { font-size: var(--text-sm); color: var(--text-tertiary); }
.catalog-course-subhead {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-tertiary);
  margin: var(--space-4) 0 var(--space-2);
}
.catalog-lab-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-3);
}
.lab-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-decoration: none;
  color: var(--text-primary);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}
.lab-card:hover {
  border-color: var(--border-accent);
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
  text-decoration: none;
}
.lab-card:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.lab-card-pill {
  display: inline-flex;
  align-self: flex-start;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent-text);
}
.lab-card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
.lab-card-chevron {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  color: var(--text-tertiary);
  transition: transform var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.lab-card:hover .lab-card-chevron {
  color: var(--accent-text);
  transform: translateX(2px);
}
.lab-card[data-disabled='true'] {
  background: var(--surface-sunken);
  cursor: not-allowed;
  pointer-events: none;
}
.lab-card[data-disabled='true'] .lab-card-title { color: var(--text-tertiary); }
.lab-card-coming-soon {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-style: italic;
}
```

`.lab-card[data-disabled='true']` should NOT have `pointer-events: none` if we want focus indication for screen readers — instead, render it as a `<div>` (not `<Link>` / `<a>`) so it isn't focusable, and rely on `aria-disabled`. Adjust per a11y verification.

### 3.5 About + Privacy disclosures

Today both are giant `<section>`s with multiple `<p>` tags. Wrap each in a `<details>` element with a card surface:

```tsx
<details className="catalog-disclosure">
  <summary>
    <span>About LabFrame</span>
    <ChevronDown className="catalog-disclosure-chevron" />
  </summary>
  <div className="catalog-disclosure-body">
    {/* existing paragraphs unchanged */}
  </div>
</details>
```

**CSS skeleton:**

```css
.catalog-disclosure {
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  margin-top: var(--space-3);
}
.catalog-disclosure > summary {
  list-style: none;
  cursor: pointer;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: var(--weight-semibold);
  font-size: var(--text-md);
  color: var(--text-primary);
}
.catalog-disclosure > summary::-webkit-details-marker { display: none; }
.catalog-disclosure-chevron { transition: transform var(--duration-fast) var(--ease-out); }
.catalog-disclosure[open] .catalog-disclosure-chevron { transform: rotate(180deg); }
.catalog-disclosure-body {
  padding: 0 var(--space-4) var(--space-4);
  line-height: var(--leading-prose);
  max-width: 72ch;
}
.catalog-disclosure-body p { margin: var(--space-3) 0; }
```

About is collapsed by default. Privacy is collapsed by default. This is a deliberate IA shift: students see "About LabFrame" and "Your data and FERPA" as offered information they can expand, not walls of text they have to scroll past to find the lab list. The catalog list now comes *before* About/Privacy in the visual order (it was already first, this just makes the gap clearer).

---

## 4. Wizard step changes — detail

### 4.1 Step indicator

Three steps, current step highlighted. Don't make it interactive (clicking a step doesn't jump — students must commit to a name first). Pure visual.

### 4.2 Step 1: Name

```tsx
<div className="catalog-wizard-step">
  <h3>What's your name?</h3>
  <p className="catalog-wizard-help">We save your name in this browser only. It's printed on the PDF you submit.</p>
  <label className="field">
    <span className="field-label">Full name</span>
    <input … />
  </label>
  <div className="catalog-wizard-actions">
    <Button variant="primary" size="md" disabled={!nameDraft.trim()} onClick={…}>
      Continue
    </Button>
  </div>
</div>
```

Drop the "Skip to course selection" button. If `hasStoredName && nameDraft.trim() === storedName`, the button label stays "Continue" and behavior is identical (saving the name is idempotent). One button.

### 4.3 Step 2: Course

```tsx
<div className="catalog-wizard-step">
  <h3>Which course are you in?</h3>
  <ul className="catalog-wizard-cards">
    {courses.map((course) => (
      <li key={course.id}>
        <button
          type="button"
          className="catalog-wizard-card"
          onClick={() => { setSelectedCourseId(course.id); goToStep('lab'); }}
        >
          <span className="catalog-wizard-card-title">{course.title}</span>
          <span className="catalog-wizard-card-meta">
            {coreCount(course)} core · {enrichmentCount(course)} enrichment
          </span>
          <ChevronRight className="catalog-wizard-card-chevron" />
        </button>
      </li>
    ))}
  </ul>
  <Button variant="ghost" size="md" onClick={() => goToStep('name')}>
    Back
  </Button>
</div>
```

### 4.4 Step 3: Lab

```tsx
<div className="catalog-wizard-step">
  <h3>Pick a lab</h3>
  {enabledLabs.length > 0 ? (
    <ul className="catalog-wizard-cards">
      {enabledLabs.map((labRef) => (
        <li key={labRef.ref}>
          <Link to={…} className="catalog-wizard-card">
            <span className="lab-card-pill">{labRef.labNumber ? `Lab ${labRef.labNumber}` : 'Enrichment'}</span>
            <span className="catalog-wizard-card-title">{labDisplayLabel(labRef, lab)}</span>
            <ChevronRight className="catalog-wizard-card-chevron" />
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p className="catalog-empty">No labs available yet for this course.</p>
  )}
  <Button variant="ghost" size="md" onClick={() => goToStep('course')}>
    Back
  </Button>
</div>
```

The wizard cards reuse a lot of `.lab-card` styling but are slightly smaller and arranged vertically (one column, full-width). Share what makes sense via a `.wizard-card-list` modifier on `.catalog-lab-grid`.

---

## 5. File layout

```
src/ui/Catalog.tsx
  - rewritten layout; split into Hero, Wizard, CourseGrid, AboutAndPrivacy
src/ui/catalog/LabCard.tsx        (new, optional — could stay inline)
src/main.css
  - new class blocks: .catalog-hero, .catalog-course, .catalog-lab-grid,
    .lab-card, .wizard-steps, .catalog-wizard-card, .catalog-disclosure
  - existing .catalog-* rules updated / replaced
```

If we extract LabCard, it's a 30-line component. Up to the implementing agent; not required.

---

## 6. Order of operations

1. **Hero band** — add it above the wizard / catalog list. No structural changes elsewhere. Verify both themes.
2. **About + Privacy disclosures** — wrap the existing prose. No content changes. Verify both themes.
3. **Course grid + LabCard** — replace `CatalogList`. Verify lab links route correctly. Verify "coming soon" labs render disabled state with correct ARIA.
4. **Wizard step indicator** — add the 3-step strip at the top of the wizard.
5. **Wizard step 1 (Name)** — apply Spec B button variants. Remove the redundant "Skip" button.
6. **Wizard step 2 (Course)** — rewrite course list as `catalog-wizard-card` buttons.
7. **Wizard step 3 (Lab)** — rewrite lab list as `catalog-wizard-card` links.
8. **Remove dead CSS** — old `.catalog-wizard-step ul`, etc.
9. **Visual snapshots** — Playwright snapshots of: catalog full page (light + dark), wizard step 1 / 2 / 3 (light + dark), disabled lab card.
10. **axe-core** — verify cards as links have proper roles and labels; verify disabled cards aren't reachable by keyboard; verify disclosure widgets work for keyboard + AT.
11. **`npm run lint && npm run lint:styles && npm run typecheck && npm test && npx playwright test`** — all green.

---

## 7. Decisions to make

1. **Hero dot-mark: yes or no?** Recommend yes — it's the cheapest way to put any accent color on the catalog page, and it gives the wordmark a real "mark" feel. If Austin prefers pure-text, drop the `::before`.
2. **About + Privacy default-open or default-collapsed?** Collapsed. Students don't need to read the privacy notice every time they pick a lab. First-time visitors find it; returning visitors don't have to scroll past it.
3. **Should the catalog list show before or after the wizard?** Both visible. Wizard is in service of name-then-course-then-lab onboarding; the bare list is for returning users who want to deep-link. Order: wizard → courses → about/privacy.
4. **"Browse all labs" link inside the wizard:** drop it. The list is right below.
5. **Lab cards: link or button-with-onClick?** `<Link>` from react-router-dom. We want middle-click / cmd-click / right-click → copy link to work. Disabled labs render as `<div>` (no link).
6. **Should the course header show lab counts or just titles?** Counts. "PHY 132 — 7 core · 5 enrichment" tells a returning student where they are at a glance.
7. **Course meta-data: should we add a description field to the Course schema?** Not in this spec. We can add one later if it's helpful, but the current `Course` schema doesn't have a description and we shouldn't block on a schema change. Wizard course cards just show the title and lab counts for now.
8. **Should this spec restyle the per-course route at `/c/:courseId`?** Out of scope. That route renders the same `Catalog` component but with `showWizard=false` and (presumably) only that course's labs. The improvements here flow through automatically. Verify the page still looks right after the rewrite; no separate work needed.
9. **Mobile breakpoint for the grid?** `repeat(auto-fill, minmax(240px, 1fr))` handles it — one column on phones, two on tablet, more on desktop. Don't over-engineer breakpoints.

---

## 8. Definition of done

- Hero band ships above the wizard + course list.
- Course grid renders course-by-course with header (title + meta) and one or two grids (core / enrichment).
- Every lab is a `<Link>` card; disabled labs are non-interactive `<div>` cards with a "Coming soon" badge.
- Wizard uses Spec B's `Button` for primary/secondary/ghost actions. Course/lab steps render as wizard-card lists, not bullet `<ul>`s. Step indicator visible at top of wizard.
- About + Privacy are collapsed `<details>` cards by default. Content unchanged.
- All raw colors / spacings / shadows in catalog CSS replaced with tokens. Stylelint clean.
- Playwright visual snapshots: catalog full page (both themes), wizard each step (both themes), disabled lab card, expanded disclosure.
- axe-core: WCAG AA, cards are reachable and labeled, disabled cards aren't reachable, disclosure widgets keyboard + AT compatible.
- `npm run lint && npm run lint:styles && npm run typecheck && npm test && npx playwright test` — all green.
- `DESIGN_SYSTEM.md` updated with a "Catalog and cards" section (Card pattern, disclosure pattern, hero pattern).
- Before/after screenshots in PR description: catalog landing, wizard each step, course route `/c/:courseId`, both themes.

---

## 9. Risks and rollback

- **`pointer-events: none` on disabled cards** breaks focus indication. Mitigation: render disabled cards as `<div>` not `<a>`/`<Link>`; rely on `aria-disabled` for AT semantics. Verify with axe-core.
- **The `<details>` summary `list-style: none`** sometimes fails on Safari < 16. Test specifically on older Safari; if it shows a default triangle, add a Safari-specific reset.
- **Grid `auto-fill minmax(240px, 1fr)`** can leave a single wide card on awkward viewport sizes. Acceptable; users with one card per row see a wide, comfortable target. If this looks wrong on the per-course view (where there are 7 labs), test specifically that case.
- **Hero dot-mark** is the one place we introduce a non-token primitive color usage (it's directly `--accent-bg`). That's fine — it's a semantic alias, not a raw hex.

---

## 10. Agent prompt

```
Catalog and landing-page polish for LabFrame. Goal: replace the
current "directory page" rendering (text headings + bullet lists of
links) with a designed hero band, course-grouped lab card grid, and
restyled wizard. Plus collapse the About/Privacy walls of text into
expandable disclosure cards.

Read POLISH_SPEC_D_CATALOG.md end-to-end before starting. Especially
§3 (visual structure), §4 (wizard step details), §6 (order of
operations).

Prereq: POLISH_PASS_SPEC.md Path 1 tokens AND
POLISH_SPEC_B_BUTTONS_SEGMENTED.md primitives are landed. Wizard
buttons use <Button> from Spec B.

Constraints:
- No new dependencies. Lucide is already in the bundle.
- No copy changes. Existing About and Privacy paragraphs in
  src/ui/Catalog.tsx stay as-is; only the framing (disclosure cards)
  changes.
- No schema changes. The Course/Lab schemas stay as-is. Course
  descriptions are out of scope.
- No new search/filter affordances.
- The per-course route at /c/:courseId renders the same Catalog
  component with showWizard=false. Verify it still looks correct
  after the rewrite; no separate work required.

Tasks (commit per task):

1. Hero band: add .catalog-hero block above the wizard + course list
   per §3.2. Include wordmark, tagline, one-line description, and an
   optional accent-colored dot mark before the wordmark. Add CSS to
   src/main.css. Verify dark mode.

2. About + Privacy disclosure cards: wrap the existing two prose
   <section>s in <details>...<summary> with .catalog-disclosure
   styling per §3.5. Default collapsed. Verify keyboard + AT
   accessibility.

3. Course grid + LabCard:
   - Replace CatalogList rendering per §3.4.
   - Each course gets a header (title + lab counts) and one or two
     lab-card grids (Core / Enrichment).
   - Each lab card shows a pill (Lab N or Enrichment), title, and a
     hover chevron.
   - Disabled (!enabled) labs render as <div> cards with a "Coming
     soon" badge and pointer-events disabled / aria-disabled.
   - Use existing CourseLabRef / Lab data — no schema changes.

4. Wizard step indicator: add the 3-step pill strip at the top of the
   wizard panel per §3.3.

5. Wizard step 1 (Name): apply Spec B Button variants. Replace the
   two redundant buttons with a single primary Continue. Behavior
   unchanged: clicking Continue saves the name and advances.

6. Wizard step 2 (Course): rewrite the bullet list as
   .catalog-wizard-card buttons per §4.3. Each card shows course
   title, lab counts, and a right chevron.

7. Wizard step 3 (Lab): rewrite the bullet list as
   .catalog-wizard-card links per §4.4. Skip disabled labs (they're
   in the browse list below; the wizard is for picking one to start).
   Empty-state message if no enabled labs.

8. Remove "Browse all labs" link inside the wizard (the catalog list
   is right below).

9. Sweep dead CSS: .catalog-wizard-step ul, .catalog-lab--disabled
   (replaced by data-disabled attribute on lab cards), and any other
   rules made obsolete.

10. Playwright visual snapshots: catalog full page (both themes),
    wizard step 1 / 2 / 3 (both themes), disabled lab card, expanded
    About disclosure.

11. axe-core both themes. Verify cards as links have correct roles
    and labels. Verify disabled cards aren't keyboard-reachable.
    Verify disclosure widgets work with keyboard + AT.

12. Update DESIGN_SYSTEM.md with a "Catalog and cards" section: hero
    pattern, lab card pattern, disclosure pattern.

13. npm run lint && npm run lint:styles && npm run typecheck &&
    npm test && npx playwright test — all green.

14. Before/after screenshots: catalog landing, wizard step 1 / 2 / 3,
    per-course route /c/:courseId, both themes. Paste in PR
    description.

Deliverable: a LabFrame catalog that feels like the front door of a
designed product instead of a hand-typed directory index, while
preserving every existing route, navigation path, and piece of
information already present.
```
