# Agent Handoff: Run the Legacy Migration Batch

## Context

You are working on `labframe`, a TypeScript + React + Vite app. The repo has a migration script at `scripts/migrate-from-legacy.ts` that converts legacy lab worksheets (under `physics-labs.up.railway.app/`) into draft `*.lab.ts` files for the new schema-driven renderer.

The script's author was unable to run it in their environment due to a virtiofs mount sync issue. Your job is to run it on all 11 legacy labs in a clean environment, verify the output, and report findings.

**You are not asked to fix any TODO(human) markers in the output.** Those are pedagogical decisions for the human collaborator. Your job is to confirm the script works, surface any script bugs, and quantify the per-lab cleanup burden so the human knows what they're walking into.

## Required reading before you start

Read these files in this order:

1. `scripts/MIGRATE_FROM_LEGACY.md` — what the script does, what it handles, what it punts on
2. `scripts/migrate-from-legacy.ts` — the script itself (~750 lines, single file)
3. `LEGACY_PARITY_INVENTORY.md` (repo root) — what each legacy lab contains, where the gnarly bits are
4. `REORG_PROPOSAL.md` (repo root) — how draft outputs will eventually be split into the new lab IDs (FYI only; not your job)
5. `src/domain/schema/lab.ts` — the target schema the migrations emit against
6. `src/content/labs/phy132/snellsLaw.lab.ts` — the existing hand-migrated reference target for the smoke test

## Setup

```bash
# 1. Confirm working directory contains the legacy tree:
ls physics-labs.up.railway.app/labs/snellsLaw/labConfig.js
ls physics-labs.up.railway.app/phy_114/snellsLaw/labConfig.js
# Both should exist. If either fails, stop and report — the working directory is missing inputs.

# 2. Install deps (the v2 script added @babel/parser, @babel/traverse, @babel/types, prettier, tsx):
npm install
```

## Step 1: Smoke test on snellsLaw 132

Run the migration on Snell's Law (PHY 132 variant) and diff against the hand-migrated reference:

```bash
npm run migrate -- \
  --in physics-labs.up.railway.app/labs/snellsLaw \
  --out src/content/labs/phy132/snellsLaw.draft.lab.ts
```

Then diff against the existing hand-migrated version:

```bash
diff -u src/content/labs/phy132/snellsLaw.lab.ts src/content/labs/phy132/snellsLaw.draft.lab.ts
```

**Expected outcome:** the draft should be structurally close to the reference but with some divergences. Specifically, the draft should have:

- `fieldId: 'objective'` (auto-normalized from legacy `q1`) ✓
- Two `kind: 'plot'` sections for Mystery A and Mystery B ✓ (this was missing in v1; v2 fixed the HTML container bug)
- Auto-translated derived formulas for the four `sin(angle)` columns, with `deps: ['incidentAngle']` or `deps: ['refractedAngle']` and `precision: 4` ✓
- Integrity Agreement at top, PDF Report Notes at bottom (both `tocHidden: true`) ✓
- Deprecated alias export at the bottom ✓
- Two course-specific divergences from the reference that the script SHOULD NOT auto-fix:
  - Reference dropped the Part 2/3 uncertainty calculation sections; draft keeps them (pedagogical choice — humans handle this)
  - Reference rebalances point values (Part 1 table 1→1.5 etc.); draft keeps legacy values (pedagogical)

**Report:** the diff in summary form. Specifically answer:

1. Did the script run without errors?
2. Did the four sin formulas auto-translate correctly? Show one as evidence.
3. Did both plots emerge as `kind: 'plot'` sections? (v1 missed these because of the HTML container bug.)
4. How many TODO(human) markers in the draft? Categorize them.
5. Does `npm run typecheck` pass against the draft? If not, copy the first 5 errors verbatim.

If any of these look wrong, **stop and report before running the full batch**. The script may have a regression that needs fixing first.

## Step 2: Run the full batch

If the smoke test looks reasonable, run all 11 migrations:

```bash
# PHY 132 (5 labs — snellsLaw excluded per the reorg)
for lab in staticElectricity chargesFields capacitors dcCircuits magneticFieldFaraday; do
  npm run migrate -- \
    --in "physics-labs.up.railway.app/labs/${lab}" \
    --out "src/content/labs/phy132/${lab}.draft.lab.ts"
done

# PHY 114 (6 labs)
for lab in snellsLaw staticElectricity chargesFields capacitors dcCircuits geometricOptics; do
  npm run migrate -- \
    --in "physics-labs.up.railway.app/phy_114/${lab}" \
    --out "src/content/labs/phy114/${lab}.draft.lab.ts" \
    --strip-uncertainty
done
```

Capture the script's stdout/stderr per lab. The script prints a section count and warning count for each lab.

## Step 3: Verify each draft

For each draft, run:

```bash
# Count TODO markers
grep -c "TODO(human)" <draft-file>

# Typecheck (will check the whole project including the drafts if they're imported anywhere)
npm run typecheck 2>&1 | head -30
```

Also visually skim each draft for:
- Sections that became `'⚠️ TODO(human): legacy used <Foo>. Port manually.'` (means the script saw a component it doesn't know how to handle — list the components by name)
- `'⚠️ TODO(human): missing prompt'` markers (means a ConfigurableQuestion had an unrecognized shape)
- `kind: 'derived'` columns where the formula stayed as `(_row) => 0, // TODO(human)` (means the formula didn't match the auto-translation pattern)

## Step 4: Report

Produce a single markdown report in your final response (under 600 words total, plus the table). Use this structure:

```markdown
## Migration batch results

### Smoke test (snellsLaw 132 vs. hand-migrated reference)
[your diff summary; answer the 5 questions from Step 1]

### Per-lab results

| Lab | Course | Sections | Warnings | TODO count | Typecheck | Cleanup judgment |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ✓/✗ | light/medium/heavy |

### Script bugs found
[any place the script crashed, produced obviously-wrong output, or where the legacy
input has a pattern the script could handle better but currently doesn't.]

### Recommended script improvements
[ranked by impact: which patterns would benefit most from being added to the
script's handler set or formula auto-translator? Brief, specific. The script
maintainer wants concrete patches, not vibes.]

### Files written
[List of all draft files written and their sizes.]
```

## Constraints — what NOT to do

- **Do not resolve TODO(human) markers.** Those are pedagogical decisions reserved for the human collaborator. Leave them in the drafts.
- **Do not split drafts into the new lab IDs.** That's a separate phase per `REORG_PROPOSAL.md`. Just produce one draft per legacy folder.
- **Do not edit or commit the drafts.** Just produce them, verify they exist, and report.
- **Do not run any of the existing labs (`*.lab.ts` without `.draft`)**. They're production content; don't risk overwriting.
- **Do not attempt to "improve" the script unprompted.** If you spot a clear bug or improvement, list it under "Recommended script improvements" — don't patch the script.

## Definition of done

1. Smoke test diff reported.
2. All 11 drafts written to disk.
3. Per-lab table populated with sections / warnings / TODO count / typecheck / cleanup judgment.
4. Script bugs (if any) listed with concrete repro: which lab, which section, what the script produced vs. what it should have.
5. Recommended improvements listed (or "none").

If the script crashes on any lab, capture the full error trace and continue with the remaining labs. Don't abort the batch on a single failure.
