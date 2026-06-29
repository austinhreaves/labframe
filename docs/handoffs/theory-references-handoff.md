# Handoff: PHY 114 Theory Reference Documents

## What this is

`docs/theory/` contains standalone student-facing theory references for each PHY 114 lab.
Each lab gets two files:

- `lab-NN-kebab-name.md` - Markdown source of truth, version-controlled
- `lab-NN-kebab-name.html` - self-contained HTML (inline CSS, no external deps) for Canvas page embed

**Lab 1 is complete** (`lab-01-charge-buildup.md` / `.html`). Labs 2-11 remain.

---

## Lab-to-file mapping

| #   | Lab ref               | Theory file (to create)         | Old materials folder                             |
| --- | --------------------- | ------------------------------- | ------------------------------------------------ |
| 1   | chargeBuildup         | `lab-01-charge-buildup`         | 1. Electrostatics and Coulomb's Law              |
| 2   | coulombsLaw           | `lab-02-coulombs-law`           | 1. Electrostatics and Coulomb's Law              |
| 3   | pointCharge           | `lab-03-point-charge`           | 2. Electric Fields and Electric Potential        |
| 4   | chargeConfigurations  | `lab-04-charge-configurations`  | 2. Electric Fields and Electric Potential        |
| 5   | capacitorFundamentals | `lab-05-capacitor-fundamentals` | 3. Capacitors                                    |
| 6   | capacitorNetworks     | `lab-06-capacitor-networks`     | 3. Capacitors                                    |
| 7   | ohmsLaw               | `lab-07-ohms-law`               | 4. DC Circuits - Ohm's Law and Kirchhoff's Rules |
| 8   | kirchhoffsLaws        | `lab-08-kirchhoffs-laws`        | 4. DC Circuits - Ohm's Law and Kirchhoff's Rules |
| 9   | snellsLaw             | `lab-09-snells-law`             | 7. Snell's Law                                   |
| 10  | convergingLens        | `lab-10-converging-lens`        | Geometric Optics                                 |
| 11  | divergingLens         | `lab-11-diverging-lens`         | Geometric Optics                                 |

Old materials root: `C:\Users\ahreaves\Documents\Instructional Materials\PHY 114 Online (ASUPIRT)\`

Each folder contains a current Lab Manual `.docx` and an `Archive/` subfolder with a Spring 2024
PDF manual. The PDF is usually the more comprehensive theory source. See memory entry
`reference-phy114-external-materials` for path quirks and text-extraction commands.

Labs 1+2 share a folder (they were one combined lab before the LabFrame split). Same for 3+4, 5+6, 7+8, 10+11.

---

## Process for each lab

### Step 1 -- Find the lab source file

Check the course manifest (`src/content/courses/phy114.course.ts`) for the `ref`. Several
PHY 114 labs reuse PHY 132 lab objects directly:

- chargeBuildup, chargeConfigurations, capacitorFundamentals, capacitorNetworks,
  kirchhoffsLaws -> `src/content/labs/phy132/<ref>.draft.lab.ts`
- coulombsLaw, pointCharge, ohmsLaw, convergingLens, divergingLens -> `src/content/labs/phy114/<ref>.draft.lab.ts`
- snellsLaw -> `src/content/labs/phy114/snellsLaw.lab.ts`

### Step 2 -- Extract background sections

Grep the lab file for `kind: 'instructions'` sections (these are the background/theory
blocks). Also check for `tocLabel` starting with "Background:". Skip `kind: 'concept'`
sections (those are student prompts, not theory).

The sections will contain HTML strings with Markdown-style formatting (bold, italics,
GFM callouts). Note any phrases that reference the lab context directly, such as:

- "In Part X you saw..."
- "The next simulation..."
- "watch for this directly:"
- "see the Set of Parameters"

These must be de-contextualized or removed in the standalone document.

### Step 3 -- Read the old materials

Use Python to extract text:

```python
# PDF (Spring 2024 archive manual)
import sys, pdfplumber
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import os
base = r'C:\Users\ahreaves\Documents\Instructional Materials\PHY 114 Online (ASUPIRT)'
for d in os.listdir(base):
    if '<folder prefix>' in d:   # e.g. '3. Capacitors'
        archive = os.path.join(base, d, 'Archive')
        for f in os.listdir(archive):
            if f.endswith('.pdf') and 'Manual' in f:
                with pdfplumber.open(os.path.join(archive, f)) as pdf:
                    for page in pdf.pages:
                        t = page.extract_text()
                        if t: print(t)
```

```python
# DOCX (current lab manual)
import zipfile, re, html as htmllib, os
base = r'C:\Users\ahreaves\Documents\Instructional Materials\PHY 114 Online (ASUPIRT)'
for d in os.listdir(base):
    if '<folder prefix>' in d:
        folder = os.path.join(base, d)
        for f in os.listdir(folder):
            if f.endswith('.docx') and 'Lab Manual' in f:
                with zipfile.ZipFile(os.path.join(folder, f)) as z:
                    xml = z.read('word/document.xml').decode('utf-8')
                paras = re.findall(r'<w:p[ >].*?</w:p>', xml, re.DOTALL)
                for para in paras:
                    style = (re.search(r'<w:pStyle w:val=.([^.]+).', para) or type('', (), {'group': lambda s, n: 'Normal'})()).group(1)
                    text = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', para)).strip()
                    if text:
                        prefix = '## ' if 'Heading' in style or style == 'Title' else ''
                        print(prefix + text)
```

Run these via `pwsh -NoProfile -Command "python -c \"...\""` (the PowerShell tool is broken;
use the Bash tool).

### Step 4 -- Alignment audit

Compare topics covered in the old materials against the LabFrame background sections.
Flag anything present in the old materials but absent from LabFrame. Do NOT silently
insert missing topics -- note the gap and decide with the user.

Standard content to include in every theory reference (established by Lab 1):

- **Charge quantization** (Q = n \* e) belongs in the first background section of any E+M
  lab that hasn't already established it. For Labs 2-8, include it only if the lab is the
  first one a student might read. For the optics labs (9-11), omit it.
- All topics covered by the lab's own background sections.

### Step 5 -- Write the Markdown

Create `docs/theory/lab-NN-<name>.md`. Structure:

```markdown
# Theory Reference: <Lab Title> (Lab N)

**PHY 114 | Lab N**

<one-sentence description covering the main topics>

---

## <Section heading>

<content>

---

## <Next section>

...
```

**Content guidelines:**

- No em dashes (`-`) anywhere. Use hyphens or rewrite.
- No chemistry-discipline jargon (electronegativity, electron affinity, electron donor/acceptor).
  Replace with plain-physics language: "holds electrons loosely / tightly," etc.
- Define technical terms inline on first use (e.g., "conductors -- materials, mostly metals,
  whose electrons are free to move").
- GFM callouts (`> [!NOTE]`) do not render in Canvas. Use plain blockquotes (`> **Note:**`).
- De-contextualize all lab-internal forward/backward references.
- PHY 114 is algebra-based. No uncertainty, no error propagation. Keep percent error.

### Step 6 -- Write the HTML

Create `docs/theory/lab-NN-<name>.html`. Copy the structure from
`docs/theory/lab-01-charge-buildup.html` -- it already has the right CSS (ASU maroon
header, note callout, print-friendly styles, no external deps). Update the `<title>`,
`.lab-meta`, `<h1>`, `.lab-description`, and section content. Keep all CSS identical
unless the lab needs additional element types.

### Step 7 -- Validate and preview

```bash
python -c "
from html.parser import HTMLParser
# (validation script from lab-01 session)
"
```

Preview via the theory-preview server in `.claude/launch.json`:
`npx serve docs/theory -l 5174` (note: `-l` not `--port`).

---

## Style reference: Lab 01 decisions

These were deliberated with the user and should carry forward:

| Topic                           | Decision                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Charge quantization placement   | Opening paragraph of the first E+M section                                                                                 |
| Triboelectric series            | State tendency directly ("tend to give up / take") rather than "sit high / sit low"                                        |
| "Conductor" first use           | Define inline: "materials -- mostly metals -- whose electrons are free to move"                                            |
| "Grounding" first use           | Define inline: "connected to a large neutral object, like the Earth, that can absorb or supply charge"                     |
| Polarization attraction         | Explain the mechanism: shifted molecules create a slight opposite charge facing the charged object                         |
| Spark (conduction)              | Keep as "a fast version of conduction: the voltage difference grows large enough to briefly turn the air...into a channel" |
| Induction: two-piece scenario   | "separated into two pieces while the charged object is still nearby" (not "split apart")                                   |
| "Analogous" / "macroscopically" | Avoid; say "The same idea applies" and "freely across the whole object"                                                    |

---

## What is NOT in scope for this handoff

- Updating LabFrame lab content itself (the background sections in the `.lab.ts` files)
- Writing theory references for PHY 132
- Adding the charge quantization section to LabFrame lab files (planned for a future pass)
