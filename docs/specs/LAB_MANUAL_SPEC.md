# Lab Manual and Concept Reference - Spec

**Status:** Design only. No code in this pass. Execute in phased passes after sign-off.

**Companion to:** `docs/SPEC.md` (product/eng scope), ADR `docs/decisions/0002-no-backend-lock.md`
(no backend), and the PHY 114 audit (`docs/lab-audit-phy114-2026-06-26.md`) whose dangling
"see Eq. (N) in the lab manual" references this feature exists to resolve.

**Sibling project:** Atlas (`C:\Users\ahreaves\atlas\atlas`). This spec treats Atlas as the
source-of-truth concept corpus. Read `atlas/00-plans/ATLAS_VISION.md` before implementing.

---

## 1. Purpose

LabFrame worksheets deliver theory just-in-time (JIT): a short `## Background:` block sits
immediately before the Part that needs it. That is correct for flow but structurally
incomplete. Several labs already reference a fuller treatment that does not exist in the app
("see Eq. (2) in the lab manual Introduction", "Pick your favorite permutation of Eq. (3)").
Those references are dangling today.

This feature gives every lab a **full manual**: a complete, navigable theory reference that a
student can open without losing their place in the worksheet, and that JIT blocks and
concept-check hints can link into by stable identifier. The manual carries the depth the
worksheet deliberately omits, so the JIT blocks can stay lean and the completeness lives
one click away.

The central architectural decision: **the manual is not new content. It is a reading surface
over the Atlas concept corpus.** Atlas already models physics as typed concept nodes with
KaTeX-rendered formulas, applicability conditions, limiting cases, misconceptions, and
prerequisite edges, seeded from OpenStax College Physics 2e. Atlas's stated mission
(`ATLAS_VISION.md`) is to be the curriculum-aligned reference "referenced weekly by ASU
PHY 114 and PHY 132 students alongside the lab sequence," with companion-platform integration
as an explicit goal. LabFrame is that companion platform. Building a second concept corpus
inside LabFrame would duplicate the thing Atlas exists to be.

### 1.1 What lives where (decided)

A JIT background block is an authored *story*, not a sequence of concept nodes. The story braids
three kinds of content, which split cleanly by coupling:

- **Canonical physics** (a law, its formula, applicability, a definition) is general and reusable.
  It lives in **Atlas concept nodes** and is the single source of truth. LabFrame embeds and links
  it, never re-types it.
- **Lab-specific connective prose** ("In Part 1B you saw the balloon attract the wall; next, in
  Part 1C...") references this worksheet's structure and means nothing outside it. It stays in
  **LabFrame** (`instructions` html).
- **Procedural steps** ("open the sim, select the Light Bulb screen, drag the green arrow") are
  coupled to the live simulation and the worksheet flow. They stay in **LabFrame**
  (`instructions` / `concept.preamble`), where they already live.

So a LabFrame JIT block remains LabFrame-authored connective prose that *embeds and links* Atlas
concept fragments. Deduping applies only to the canonical-physics layer: fix "polarization" once
in Atlas and every lab that links it updates. This is the minimal-Atlas-change boundary
(decided 2026-06-26); reusable cross-lab narrative threads and procedure steps are explicitly NOT
moved into Atlas.

## 2. Non-goals

- **A second concept corpus.** LabFrame does not author standalone concept content. Concept
  text, formulas, and figures live in Atlas. LabFrame composes and renders them.
- **Moving worksheets into Atlas.** Atlas has a `lab-question` layer, but LabFrame keeps its
  own Zod worksheet schema (`src/domain/schema/lab.ts`) as the authority for graded student
  work. The manual consumes Atlas `concept` (and selectively `variable` / `sop`) content
  only. We do not host LabFrame questions as Atlas nodes, and we do not render Atlas
  `lab-question` nodes inside LabFrame. This keeps one source of truth per artifact.
- **Importing Atlas React components.** Atlas is React 19 + JavaScript + reactflow; LabFrame
  is React 18 + TypeScript. We consume Atlas *data*, not its components. (See §7.)
- **Manual content in the answer PDF.** The signed answer PDF is the student's work. The
  manual is reference and stays out of it (decided; see §9).
- **Ingesting the legacy `.docx` manuals into LabFrame.** The `.docx` manuals are **hydration
  material for Atlas**, not LabFrame. They are a primary source for authoring and expanding the
  course-relevant Atlas concept nodes (see §10). LabFrame never ingests `.docx`; it only ever
  consumes the resulting Atlas data.
- **Author figures embedded inline in worksheet JIT blocks.** Deferred (decided). Figures live
  in the manual; JIT blocks link out. No worksheet `instructions` schema change in this feature.
- **Editing the retired combined drafts** (staticElectricity, chargesFields, capacitors,
  dcCircuits, geometricOptics). Out of scope; they are `enabled: false` and frozen.

## 3. What Atlas already provides vs. what we must build

Honest inventory, from a full read of the Atlas source on 2026-06-26.

| Capability | Atlas today | LabFrame must build |
| --- | --- | --- |
| Concept content model | Typed `concept` nodes: `id` (kebab), `title`, `formula`, `principle`, `applicability_conditions`, `limiting_cases`, `misconceptions`, `variables`, `prerequisites`, `blocks`. Schema-validated. | Nothing. Consume as-is. |
| Block types | `markdown-katex`, `image`, `table`, `embed-iframe`, `file-attachment`, `checklist`, `prompt-and-response`. | Render the subset the manual uses (markdown-katex, image, table, embed-iframe). |
| Math rendering | KaTeX at runtime via a hand-rolled minimal markdown parser (`MarkdownKatexBlock` + `KatexDelimitedText`). Handles `#`/`##` headings, `-` lists, `$...$`/`$$...$$`. | A richer reading renderer (see §8). Atlas's parser has **no link support and no inline emphasis** - insufficient for cross-references. |
| Ordered composition | `containers` exist but are **spatial** React Flow overlays; the schema **forbids** a `sequence` field. Not a linear reading order. | A linear per-lab composition (the manual order file, §6). |
| Stable anchors | `conceptId` (node) and `block_id` (within node). No equation-level labels, no resolver. | A reference/anchor registry and build-time resolver (§5). |
| Deep linking | `/?container=<slug>&node=<id>&focus=1` in the Atlas app. | LabFrame routes/popover (§4); optional deep-link out to Atlas for graph exploration. |
| Persistence | localStorage; `.atlas-container.json` export with corpus hash + checksum. | Not needed for a read-only manual. |
| Corpus provenance | `review_state` per entity, `computeCorpusHash`, `VITE_ATLAS_CORPUS_VERSION`. | Pin a corpus version per LabFrame build (§7). |

## 4. Reading surface (decided)

One canonical manual URL per lab is the source artifact; an in-context popover renders that
same content as an overlay; "open in new tab" navigates to the canonical URL at the same
anchor. Decided in alignment; restated here as the contract.

- **Canonical route:** `/lab/:labId/manual`, anchorable as `/lab/:labId/manual#<anchor>`.
  Bookmarkable, shareable, printable.
- **Popover:** an overlay onto that same content, opened from a worksheet "Manual" affordance
  and from inline cross-reference links. Because it is an overlay, dismissing it (close button,
  Esc, click-outside) returns the student to their exact worksheet scroll position. Focus-trap
  and Esc required for accessibility. Content is **lazy-loaded** so a long manual with images
  does not bloat the worksheet's initial render.
- **Open in new tab:** navigates to the canonical route at the anchor currently shown, so a
  student escalating from popover to a pinned tab loses no context.
- **Rationale for popover over side panel:** screen real estate. A persistent side panel
  competes with the worksheet on tablet/laptop widths. The overlay reclaims full width and is
  trivially dismissable.

The popover and the route render from one component and one content source; the route is the
canonical artifact, the popover is a lightweight overlay onto it.

## 5. Reference and anchor system (the net-new core)

This is the part Atlas does not provide and the part that makes the manual more than a static
page. Cross-references must be authorable, resolvable, and break loudly when content moves.

### 5.1 Reference token grammar

A reference is a token embedded in worksheet `instructions`/`concept` text or in manual prose:

```
concept:<conceptId>                     -> whole concept node
concept:<conceptId>#<blockId>           -> a specific block within the node
concept:<conceptId>#eq-<label>          -> a labeled equation (see 5.3)
```

`<conceptId>` is an Atlas node id (kebab-case). `<blockId>` is an Atlas `block_id`, already
stable and unique within a node. Authoring surface: a markdown link whose href is the token,
e.g. `[Eq. 4](concept:total-internal-reflection#eq-critical-angle)`.

### 5.2 Resolver and link-rot protection

A resolver maps tokens to URLs against the imported corpus manifest (§7):

- At **build time**, every token in every enabled lab and every manual is validated against the
  corpus. An unresolved token is a **build error**, not a silent 404. This realizes the
  "identifier registry" intent: ids are the identifier authority, the resolver is the guard.
- At **runtime**, a resolved token renders as a link that opens the popover scrolled to the
  anchor (or, for the canonical route, scrolls in place).

### 5.3 Labeled equations (small Atlas addition)

Atlas blocks have ids but no equation-level labels, so "Eq. 4" has nothing stable to point at
below block granularity. Proposed Atlas-side addition (LabFrame consumes, does not author):

- An optional `ref_label` on a block, or a labeled-equation construct inside `markdown-katex`
  (a fenced `$$ ... $$ {#eq-critical-angle}` convention). Either yields a stable
  `#eq-<label>` anchor.
- Numbering ("Eq. 4") is **presentation**, assigned by the manual's composition order at
  render time, not stored. The stable identity is the label, not the number. This avoids the
  legacy problem where renumbering a manual broke every "Eq. (N)" reference.

This is the one change this feature asks of Atlas. Everything else is read-only consumption.
It should be specced and reviewed on the Atlas side before LabFrame depends on it.

### 5.4 Related-concept hints on worksheet sections

The same resolver powers a second, lighter feature: a worksheet `concept` or `calculation`
section can surface a short "Related concepts" list of links into the manual/Atlas. This needs one
small, additive LabFrame schema change: an optional `references?: string[]` (reference tokens) on
the relevant section variants in `src/domain/schema/lab.ts`. It is text-only and distinct from the
deferred JIT-figure schema change. Candidate links can be authored explicitly or seeded from
Atlas prerequisite/edge relations for the concepts a section already references.

## 6. Per-lab composition (decided: sibling order file)

A lab's manual is an ordered list of concept references, authored in a file separate from the
worksheet definition.

- **Location/shape:** a sibling `<lab>.manual.ts` next to `<lab>.lab.ts`, exporting an ordered
  array of section refs. Each ref is a `conceptId` (full node) or a `conceptId#blockId`
  (a single block), in reading order, optionally grouped under manual-local headings.
- **Why a sibling file, not a field on `Lab`:** decouples manual evolution from the worksheet
  graph and keeps `lab.ts` lean. A lab with no manual file simply has no manual yet.
- **Reading order is explicit**, not derived from Atlas prerequisite edges. Prerequisites are a
  graph relation, not a linear narrative; the author decides manual order. (Prerequisite edges
  may still surface as "see also" links within the rendered manual.)
- **Dedup is automatic:** "Coulomb's Law" is one Atlas node; coulombsLaw, pointCharge, and
  chargeConfigurations each list it in their order files. Fix the concept once, every lab that
  references it updates.

A typed manifest validates each ref against the corpus at build (§5.2): a manual that lists a
non-existent concept id fails the build.

## 7. Reuse boundary and corpus sync (decided)

Atlas is a separate app with an incompatible React major and no TypeScript, so LabFrame consumes
Atlas's **content data** (the concept JSON corpus + a manifest), never its runtime.

**Transport: option A, a published data package (decided 2026-06-26).** Atlas emits a versioned,
framework-free artifact (`@atlas/corpus`: concept JSON + a manifest of ids / block ids / labeled-
equation anchors + the corpus hash). LabFrame depends on an **exact pinned version** (consistent
with LabFrame's existing exact-pin discipline). The version pin is the anti-drift gate: Atlas main
can churn freely; LabFrame moves to new corpus content only on a deliberate version bump, and a
breaking schema change announces itself as a major bump.

- **Local co-development:** point LabFrame at a local Atlas checkout via an npm workspace /
  `npm link` for instant iteration; CI and production builds use the pinned published version.
  This recovers submodule-like immediacy locally without giving up the release gate.
- **Rejected alternatives:** submodule/monorepo (B) reintroduces the drift it is meant to avoid
  and forces a React-major merge; build-time copy (C) has opaque SHA pinning and weak provenance;
  iframing the Atlas app (D) is kept only as the optional "explore in Atlas" escape hatch, never
  as the manual surface.

**Two stability gates, no fork (decided).** Isolating Atlas iteration from LabFrame uses
mechanisms Atlas already has, plus the version pin, not a fork:

1. **`review_state`** - LabFrame consumes only `published` entities (Atlas's reference app already
   filters this way). You churn `draft` concepts in main without affecting LabFrame.
2. **Package version** - the second gate; LabFrame upgrades on its own schedule.

A hard fork is explicitly rejected: it recreates corpus-level drift and fights Atlas's
"one artifact, one corpus" vision. Instead, carve out a **LabFrame-scoped namespace/area within
the one Atlas repo** for course-oriented content (PHY 114/132 framings, course-specific
edges/tags, the labeled-equation anchors labs depend on). The namespace is a curation/review
boundary for separation of concerns, not an isolation-from-drift mechanism (`review_state` already
provides that).

## 8. Math and markdown rendering (recommended: runtime, richer than Atlas)

The manual is HTML, not `@react-pdf`, so it can use a real math engine. Decided: KaTeX.

- **Recommended pipeline:** runtime `react-markdown` + `remark-math` + `rehype-katex`, rendering
  manual prose and Atlas `markdown-katex` block data on demand. This pairs with the lazy popover
  (no markdown build plugin) and, unlike Atlas's hand-rolled parser, supports the **links**
  cross-references require, plus inline emphasis, blockquotes/callouts, and tables.
- **Why not reuse Atlas's renderer directly:** it is ~100 lines and proven, but intentionally
  minimal (no links, no emphasis). We would have to extend it to near-`react-markdown` scope
  anyway. Porting Atlas's `KatexText` wrapper (the KaTeX call site and trusted-content posture)
  is worthwhile; reusing its block parser is not.
- **Accepted tradeoff:** LabFrame will have two math paths - the worksheet/PDF
  `latexToUnicode` subset and the manual's KaTeX. They serve different surfaces (embedded
  worksheet + printable PDF vs. rich HTML reference) and need not converge. The manual KaTeX
  path is a *superset*, so it also fixes the `\tag` / `\tfrac` leak class at the source for any
  content that lives in the manual.
- **Tables and embeds:** render Atlas `table` blocks as HTML tables and `embed-iframe` blocks
  via LabFrame's existing PhET allowlist posture (never widen the allowlist for the manual).

## 9. PDF behavior (decided: exclude)

The manual is excluded from the signed answer PDF. It is reference, not student work, and it is
always reachable via the route. A separate "download manual as PDF" affordance is possible later
but is not part of this feature. The worksheet PDF continues to render JIT blocks via the
existing `latexToUnicode` pipeline; nothing in the PDF path changes.

## 10. Source content and authoring flow

- **Concept content lives in Atlas.** For most PHY 114/132 theory the concept already exists
  (seeded from the CP2e summaries in `atlas/physics-info/college-physics-2e-summaries`) or is a
  light edit.
- **The legacy `.docx` manuals are Atlas hydration material.** They are a primary source for
  authoring and expanding the course-relevant Atlas concept nodes (and their labeled equations)
  under Atlas's review discipline. They are never ingested by LabFrame.
- **Lab-specific connective prose and procedure stay in LabFrame** (see §1.1). Only the
  canonical-physics layer is deduped into Atlas.
- **Provenance:** Atlas tracks `author` / `review_state` / `last_reviewed`. Enabled-lab manuals
  draw only from `published` entities.

## 11. Standalone concept library (decided: in scope, phased)

Beyond per-lab manuals, LabFrame exposes a browsable/searchable concept reference (the user's
"reference lookup directly in LabFrame"), so a student can look up a concept independent of any
lab. This is in scope for the spec but lands after per-lab manuals.

- **Surface:** a `/reference` route listing/searching concepts (title, tags, domain) from the
  imported corpus, each opening the same concept reading view the manual uses.
- **Relationship to Atlas:** LabFrame's library is a focused reading view scoped to the
  course-relevant corpus; the full graph exploration experience remains in Atlas, reachable via
  "explore in Atlas" deep links. We do not reimplement the React Flow graph in LabFrame.

## 12. Phasing

Each phase is independently shippable. Do not start a later phase before the earlier one is
green.

- **Phase 0 - Atlas prerequisites.** On the Atlas side: agree the labeled-equation anchor
  (§5.3) and the corpus data artifact (§7). LabFrame work is blocked on these contracts, not on
  their full implementation.
- **Phase 1 - Corpus ingestion.** Bring the pinned Atlas corpus + manifest into LabFrame via the
  chosen transport (§7). Build the resolver and the build-time token validator (§5.2). No UI yet;
  prove validation with a test corpus.
- **Phase 2 - Concept reading view + canonical route.** Render a single concept node (markdown-katex,
  image, table, embed) at `/lab/:labId/manual` and `/reference/:conceptId`, with KaTeX (§8).
- **Phase 3 - Per-lab manual composition.** The `<lab>.manual.ts` order file (§6), assembled
  linear manual with a table of contents and `#<anchor>` deep links.
- **Phase 4 - Popover + cross-reference links.** The lazy overlay (§4); worksheet JIT blocks and
  concept hints render resolved reference tokens as links that open the popover at the anchor.
  Pilot on `snellsLaw` (its concept checks already cite Eq. (1)/(4)).
- **Phase 5 - Standalone library.** The `/reference` browse/search surface (§11).
- **Phase 6 - Backfill.** Author order files for the enabled PHY 114 sequence, then PHY 132,
  resolving the dangling "see the lab manual" references the audit flagged.

## 13. Decisions

**Locked (2026-06-26):**
- **Content boundary (§1.1):** concepts in Atlas; connective prose + procedure in LabFrame.
- **Transport (§7):** option A, published `@atlas/corpus` package, exact-pinned.
- **Isolation (§7):** `review_state` + version pin + a LabFrame namespace in Atlas; no fork.
- **Reading surface (§4):** canonical route + lazy popover + open-in-new-tab.
- **Math (§8):** KaTeX; manual excluded from the answer PDF (§9).
- **Figures:** hosted in the manual; JIT blocks link out; no JIT-figure schema change.
- **Standalone library (§11):** in scope, phased after per-lab manuals.

**Remaining (mostly Atlas-side detail):**
1. **Atlas labeled-equation mechanism (§5.3).** `ref_label` on a block vs. inline
   `$$...$$ {#eq-...}`. An Atlas-side call; LabFrame consumes either.
2. **Pilot lab for Phase 4 (§12).** Recommendation: `snellsLaw` (its concept checks already
   contain the exact dangling references this resolves).
3. **Manual renderer (§8).** `react-markdown` + `rehype-katex` (recommended, for link support)
   vs. port-and-extend Atlas's renderer. An implementation choice deferrable to Phase 2.

## 14. Risks and honest caveats

- **Two-repo coupling.** A shared corpus across two apps with different stacks adds a version
  surface. The pinned-version approach (§7) contains it, but corpus upgrades become a deliberate
  LabFrame change, not automatic.
- **Atlas is the user's other active project.** This feature adds LabFrame as a consumer of
  Atlas's contracts (anchors, corpus artifact). Those contracts must be stable before LabFrame
  depends on them, or churn propagates across both repos.
- **Renderer divergence.** Two math paths (§8) is a deliberate accepted cost, not an oversight.
  If it becomes a maintenance burden, converging on KaTeX everywhere (including a KaTeX-to-PDF
  path) is a future option, explicitly out of scope here.
- **Scope gravity.** Atlas can do far more than render a manual (graph exploration, progress,
  containers). This spec deliberately consumes only the concept-reading slice. Resist pulling the
  graph canvas or container/session machinery into LabFrame; the "explore in Atlas" deep link is
  the seam.
