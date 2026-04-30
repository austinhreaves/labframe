/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import path from 'node:path';

type DraftSection = {
  kind: string;
  note: string;
};

type DraftLab = {
  id: string;
  title: string;
  description: string;
  category: string;
  simulations: Record<string, { title: string; url: string }>;
  sections: DraftSection[];
  migrationNotes: string[];
};

function toLabId(input: string): string {
  const cleaned = input.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) {
    return 'legacyLab';
  }

  const [first, ...rest] = cleaned.split(/\s+/);
  return first.toLowerCase() + rest.map((part) => part[0]!.toUpperCase() + part.slice(1)).join('');
}

function bestEffortTitle(source: string, fallback: string): string {
  const explicitTitle =
    source.match(/labTitle\s*[:=]\s*['"`]([^'"`]+)['"`]/)?.[1] ??
    source.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i)?.[1] ??
    source.match(/<h2[^>]*>\s*([^<]+)\s*<\/h2>/i)?.[1];

  return explicitTitle?.trim() || fallback;
}

function buildDraft(source: string, filePath: string): DraftLab {
  const baseName = path.basename(filePath, path.extname(filePath));
  const title = bestEffortTitle(source, baseName);
  const id = toLabId(title);

  const sections: DraftSection[] = [];
  const migrationNotes: string[] = [
    'Best-effort migration only. Review prompts, points, units, and formulas manually.',
    'Do not carry over anti-paste, anti-tamper, or dangerouslySetInnerHTML usage.',
  ];

  if (source.includes('DataTable')) {
    sections.push({ kind: 'dataTable', note: 'Detected DataTable usage in legacy source.' });
  }

  if (source.includes('Graph')) {
    sections.push({ kind: 'plot', note: 'Detected Graph usage in legacy source.' });
  }

  if (source.includes('GenericImageUploader')) {
    sections.push({ kind: 'image', note: 'Detected image upload usage in legacy source.' });
  }

  if (source.includes('ConfigurableQuestion')) {
    sections.push({
      kind: 'concept',
      note: 'Detected configurable question blocks; map each to concept/calculation sections.',
    });
  }

  if (sections.length === 0) {
    sections.push({
      kind: 'instructions',
      note: 'No known section markers detected; create sections manually from source prose.',
    });
  }

  return {
    id,
    title,
    description: `Draft migration generated from ${path.basename(filePath)}.`,
    category: 'Physics',
    simulations: {
      simulation1: {
        title: 'TODO: extract simulation title',
        url: 'TODO: extract simulation URL',
      },
    },
    sections,
    migrationNotes,
  };
}

function main(): void {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npm run ts-node scripts/migrate-from-legacy.ts <path-to-LabReportForm.js>');
    process.exit(1);
  }

  const source = readFileSync(inputPath, 'utf8');
  const draft = buildDraft(source, inputPath);
  console.log(JSON.stringify(draft, null, 2));
}

main();
