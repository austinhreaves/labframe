/**
 * verify-lab: deterministic lab content checker.
 *
 * Runs the mechanical half of a lab review: schema validity, id uniqueness,
 * course wiring, math-rendering leaks (LaTeX the PDF converter cannot render),
 * and em dashes. The judgment half (JIT theory coverage, physics, clarity) is
 * handled by the `verify-lab` skill, which calls this script and reads the
 * report plus the section outline it prints.
 *
 * Usage:
 *   npm run verify:lab <labId>            # one lab by its `id`
 *   npm run verify:lab <path/to/file.ts>  # one lab by source path
 *   npm run verify:lab -- --all           # every lab in the registry
 *   npm run verify:lab -- <labId> --json  # machine-readable findings
 *
 * Exit code is 1 when any error-severity finding exists (use --strict to also
 * fail on warnings), otherwise 0. The skill ignores the exit code and reads the
 * report.
 */
import * as labModule from '../src/content/labs/index.ts';
import { LabSchema, type Lab } from '../src/domain/schema/index.ts';
import {
  phy112Course,
  phy114Course,
  phy132Course,
  welcomeCourse,
} from '../src/content/courses/index.ts';
import { latexToUnicode } from '../src/services/pdf/markdown/latexToUnicode.ts';

type Severity = 'error' | 'warning' | 'info';

interface Finding {
  severity: Severity;
  code: string;
  location: string;
  message: string;
}

const COURSES = [phy112Course, phy114Course, phy132Course, welcomeCourse];

/** Keys whose string values address an answer slot and must be unique per lab. */
const ID_KEYS = new Set(['fieldId', 'tableId', 'plotId', 'imageId', 'captionFieldId']);

function isLab(value: unknown): value is Lab {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'sections' in value &&
    Array.isArray((value as { sections?: unknown }).sections)
  );
}

/** Deduplicate the barrel's exports (some labs are exported under two names). */
function collectLabs(): Lab[] {
  const seen = new Set<Lab>();
  for (const value of Object.values(labModule)) {
    if (isLab(value)) {
      seen.add(value);
    }
  }
  return [...seen];
}

interface StringHit {
  path: string;
  key: string;
  value: string;
}

/** Walk an object and yield every string leaf with a dotted path and its key. */
function walkStrings(node: unknown, path: string, key: string, out: StringHit[]): void {
  if (typeof node === 'string') {
    out.push({ path, key, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkStrings(item, `${path}[${i}]`, key, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      walkStrings(v, path ? `${path}.${k}` : k, k, out);
    }
  }
}

/** Split text into math segments; report leftover unbalanced `$`. */
function extractMath(text: string): { segments: string[]; unbalanced: boolean } {
  const segments: string[] = [];
  let rest = text.replace(/\$\$([\s\S]+?)\$\$/g, (_full, inner: string) => {
    segments.push(inner);
    return '';
  });
  rest = rest.replace(/\$([^$\n]+?)\$/g, (_full, inner: string) => {
    segments.push(inner);
    return '';
  });
  return { segments, unbalanced: rest.includes('$') };
}

/** Commands the PDF unicode converter leaves verbatim (e.g. \tag, \tfrac). */
function unsupportedCommands(mathSegment: string): string[] {
  const converted = latexToUnicode(mathSegment);
  const leftovers = converted.match(/\\[A-Za-z]+/g);
  return leftovers ? [...new Set(leftovers)] : [];
}

function checkLab(lab: Lab): Finding[] {
  const findings: Finding[] = [];
  const labId = lab.id;

  // 1. Schema validity.
  const parsed = LabSchema.safeParse(lab);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      findings.push({
        severity: 'error',
        code: 'schema',
        location: issue.path.join('.') || '(root)',
        message: issue.message,
      });
    }
  }

  // 2. Answer-slot id uniqueness. The same id value is allowed within a single
  //    section (an image section deliberately shares imageId and captionFieldId);
  //    only a collision across different sections corrupts answer storage.
  const idStrings: StringHit[] = [];
  walkStrings(lab, '', '', idStrings);
  const sectionOf = (path: string): string => path.match(/sections\[(\d+)\]/)?.[1] ?? path;
  const seenIds = new Map<string, { path: string; section: string }>();
  for (const hit of idStrings) {
    if (!ID_KEYS.has(hit.key)) {
      continue;
    }
    const section = sectionOf(hit.path);
    const prior = seenIds.get(hit.value);
    if (prior && prior.section !== section) {
      findings.push({
        severity: 'error',
        code: 'duplicate-id',
        location: hit.path,
        message: `id "${hit.value}" also used at ${prior.path}; answer slots would collide`,
      });
    } else if (!prior) {
      seenIds.set(hit.value, { path: hit.path, section });
    }
  }

  // 2b. Orphaned simulations (Pass 5, rule 5). When a lab declares parts, every
  //     simulation should be reachable from some part. A superRefine can only
  //     fail, so the soft "authored but unreachable" check lives here as a
  //     warning. Labs without parts are unaffected (the sim picker reaches all).
  if (lab.parts && lab.parts.length > 0) {
    const usedSimIds = new Set(lab.parts.map((part) => part.simulationId));
    for (const simId of Object.keys(lab.simulations)) {
      if (!usedSimIds.has(simId)) {
        findings.push({
          severity: 'warning',
          code: 'orphan-sim',
          location: `simulations.${simId}`,
          message: `simulation "${simId}" is referenced by no part and is unreachable`,
        });
      }
    }
  }

  // 3. Course wiring.
  const refs = COURSES.flatMap((c) => c.labs.map((l) => ({ course: c.id, ...l })));
  const matches = refs.filter((r) => r.ref === labId);
  if (matches.length === 0) {
    findings.push({
      severity: 'warning',
      code: 'unwired',
      location: 'course manifest',
      message: `lab "${labId}" is exported but not referenced by any course manifest`,
    });
  }

  // 4 + 5. Text checks: math leaks, unbalanced delimiters, em dashes.
  const textHits: StringHit[] = [];
  walkStrings(lab, '', '', textHits);
  for (const hit of textHits) {
    if (hit.value.includes('—')) {
      findings.push({
        severity: 'warning',
        code: 'em-dash',
        location: hit.path,
        message: 'contains an em dash; repo style forbids them',
      });
    }
    if (!hit.value.includes('$')) {
      continue;
    }
    const { segments, unbalanced } = extractMath(hit.value);
    if (unbalanced) {
      findings.push({
        severity: 'error',
        code: 'math-delimiter',
        location: hit.path,
        message: 'unbalanced $ delimiter; math will not render',
      });
    }
    for (const segment of segments) {
      const bad = unsupportedCommands(segment);
      if (bad.length > 0) {
        findings.push({
          severity: 'error',
          code: 'math-unsupported',
          location: hit.path,
          message: `LaTeX ${bad.join(', ')} is not handled by the PDF converter and will leak as raw text in the PDF`,
        });
      }
    }
  }

  return findings;
}

/** Ordered outline of instructions headings and section kinds, for JIT review. */
function outline(lab: Lab): string[] {
  const lines: string[] = [];
  lab.sections.forEach((section, i) => {
    if (section.kind === 'instructions') {
      const heading = section.html.match(/^\s*(#{1,3})\s+(.+)$/m);
      const label = heading ? `${heading[2].trim()}` : '(no heading)';
      lines.push(`  ${String(i).padStart(2)} instructions  ${label}`);
    } else {
      lines.push(`  ${String(i).padStart(2)} ${section.kind}`);
    }
  });
  return lines;
}

function severityRank(s: Severity): number {
  return s === 'error' ? 0 : s === 'warning' ? 1 : 2;
}

function reportText(lab: Lab, findings: Finding[]): string {
  const lines: string[] = [];
  lines.push(`\nLab: ${lab.id} (${lab.title}) - ${lab.sections.length} sections`);
  lines.push('Section outline:');
  lines.push(...outline(lab));
  if (findings.length === 0) {
    lines.push('Deterministic checks: no findings.');
    return lines.join('\n');
  }
  lines.push('Deterministic findings:');
  const sorted = [...findings].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  for (const f of sorted) {
    const tag = f.severity.toUpperCase().padEnd(7);
    lines.push(`  ${tag} [${f.code}] ${f.location}: ${f.message}`);
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  lines.push(`Summary: ${errors} error(s), ${warnings} warning(s).`);
  return lines.join('\n');
}

async function resolveLabs(arg: string | undefined): Promise<Lab[]> {
  const all = collectLabs();
  if (!arg || arg === '--all') {
    return all;
  }
  if (arg.includes('/') || arg.endsWith('.ts')) {
    const mod = await import(/* @vite-ignore */ `../${arg.replace(/^(\.\/)?/, '')}`);
    const found = Object.values(mod).filter(isLab) as Lab[];
    if (found.length === 0) {
      throw new Error(`No lab export found in ${arg}`);
    }
    return found;
  }
  const match = all.find((l) => l.id === arg);
  if (!match) {
    throw new Error(`No lab with id "${arg}" in the registry. Run with --all to list.`);
  }
  return [match];
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const positional = args.find((a) => !a.startsWith('--'));

  const labs = await resolveLabs(positional ?? (args.includes('--all') ? '--all' : undefined));

  let errorCount = 0;
  let warningCount = 0;
  const jsonOut: Array<{ id: string; findings: Finding[] }> = [];

  for (const lab of labs) {
    const findings = checkLab(lab);
    errorCount += findings.filter((f) => f.severity === 'error').length;
    warningCount += findings.filter((f) => f.severity === 'warning').length;
    if (json) {
      jsonOut.push({ id: lab.id, findings });
    } else {
      process.stdout.write(reportText(lab, findings) + '\n');
    }
  }

  if (json) {
    process.stdout.write(JSON.stringify(jsonOut, null, 2) + '\n');
  } else {
    process.stdout.write(
      `\nChecked ${labs.length} lab(s): ${errorCount} error(s), ${warningCount} warning(s).\n`,
    );
  }

  if (errorCount > 0 || (strict && warningCount > 0)) {
    // Set the code rather than calling process.exit so buffered stdout flushes
    // when output is redirected to a file or pipe.
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`verify-lab failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 2;
});
