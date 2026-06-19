import type { LabDoc, LabDocAsset, LabDocSection } from '@/domain/schema';
import { MAX_ASSET_BYTES } from '@/services/authoring/constants';

// Editor-side model for the assignment constructor. The constructor owns all
// internal ids; the author never types them. `draftToLabDoc` produces the
// serializable LabDoc; `labDocToDraft` reverses it for editing (round-trip).

export type DraftSimulation = {
  key: string;
  id: string;
  title: string;
  url: string;
  allow?: string;
};

export type DraftEditorSection = {
  key: string;
  section: LabDocSection;
};

export type Draft = {
  title: string;
  author: string;
  authorContact?: string;
  humanVersion?: string;
  createdAt: string;
  customAgreementText: string;
  simulations: DraftSimulation[];
  assets: Record<string, LabDocAsset>;
  sections: DraftEditorSection[];
};

export const SECTION_KINDS: { kind: LabDocSection['kind']; label: string }[] = [
  { kind: 'instructions', label: 'Instructions' },
  { kind: 'objective', label: 'Objective' },
  { kind: 'measurement', label: 'Measurement' },
  { kind: 'multiMeasurement', label: 'Multi-measurement' },
  { kind: 'dataTable', label: 'Data table' },
  { kind: 'plot', label: 'Plot' },
  { kind: 'image', label: 'Image upload' },
  { kind: 'calculation', label: 'Calculation' },
  { kind: 'concept', label: 'Concept question' },
];

export const CURATED_SIMULATIONS: { title: string; url: string }[] = [
  {
    title: 'Pendulum Lab',
    url: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_all.html',
  },
  {
    title: 'Circuit Construction Kit: DC',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
  },
  {
    title: 'Energy Skate Park',
    url: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html',
  },
  {
    title: 'Forces and Motion: Basics',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html',
  },
  {
    title: 'Wave on a String',
    url: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html',
  },
];

let idCounter = 0;

/** Unique within a doc; the random suffix avoids colliding with ids from a
 *  loaded LabDoc during round-trip editing. */
export function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}${Math.random().toString(36).slice(2, 6)}`;
}

function newSectionBody(kind: LabDocSection['kind']): LabDocSection {
  switch (kind) {
    case 'instructions':
      return { kind: 'instructions', html: '## Heading\n\nWrite instructions here.' };
    case 'objective':
      return { kind: 'objective', fieldId: genId('field'), prompt: 'State the objective.' };
    case 'measurement':
      return { kind: 'measurement', fieldId: genId('field'), label: 'Measurement' };
    case 'multiMeasurement':
      return {
        kind: 'multiMeasurement',
        rows: [{ id: genId('row'), label: 'Row 1' }],
      };
    case 'dataTable':
      return {
        kind: 'dataTable',
        tableId: genId('table'),
        columns: [{ id: genId('col'), label: 'Column 1', kind: 'input' }],
        rowCount: 5,
      };
    case 'plot':
      return {
        kind: 'plot',
        plotId: genId('plot'),
        sourceTableId: '',
        xCol: '',
        yCol: '',
        xLabel: 'x',
        yLabel: 'y',
      };
    case 'image':
      return { kind: 'image', imageId: genId('image'), captionFieldId: genId('field') };
    case 'calculation':
      return { kind: 'calculation', fieldId: genId('field'), prompt: 'Show your work.' };
    case 'concept':
      return { kind: 'concept', fieldId: genId('field'), prompt: 'Explain your reasoning.' };
  }
}

export function newSection(kind: LabDocSection['kind']): DraftEditorSection {
  return { key: genId('sec'), section: newSectionBody(kind) };
}

export function createNewDraft(): Draft {
  return {
    title: '',
    author: '',
    createdAt: new Date().toISOString(),
    customAgreementText: '',
    simulations: [],
    assets: {},
    sections: [newSection('instructions')],
  };
}

export function draftToLabDoc(draft: Draft): LabDoc {
  return {
    schemaVersion: 1,
    meta: {
      title: draft.title,
      author: draft.author,
      ...(draft.authorContact ? { authorContact: draft.authorContact } : {}),
      ...(draft.humanVersion ? { humanVersion: draft.humanVersion } : {}),
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString(),
    },
    simulations: Object.fromEntries(
      draft.simulations.map((sim) => [
        sim.id,
        { title: sim.title, url: sim.url, ...(sim.allow ? { allow: sim.allow } : {}) },
      ]),
    ),
    ...(draft.customAgreementText.trim()
      ? { integrityAgreement: { customText: draft.customAgreementText } }
      : {}),
    assets: draft.assets,
    sections: draft.sections.map((entry) => entry.section),
  };
}

export function labDocToDraft(doc: LabDoc): Draft {
  return {
    title: doc.meta.title,
    author: doc.meta.author,
    ...(doc.meta.authorContact ? { authorContact: doc.meta.authorContact } : {}),
    ...(doc.meta.humanVersion ? { humanVersion: doc.meta.humanVersion } : {}),
    createdAt: doc.meta.createdAt,
    customAgreementText: doc.integrityAgreement?.customText ?? '',
    simulations: Object.entries(doc.simulations).map(([id, sim]) => ({
      key: genId('sim'),
      id,
      title: sim.title,
      url: sim.url,
      ...(sim.allow ? { allow: sim.allow } : {}),
    })),
    assets: { ...doc.assets },
    sections: doc.sections.map((section) => ({ key: genId('sec'), section })),
  };
}

export type AssetResult =
  | { ok: true; id: string; asset: LabDocAsset }
  | { ok: false; error: string };

const ASSET_MIMES = new Set<LabDocAsset['mime']>(['image/png', 'image/jpeg', 'image/webp']);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
}

/** Validate and encode an uploaded figure into a LabDoc asset (base64). */
export async function fileToAsset(file: File): Promise<AssetResult> {
  if (!ASSET_MIMES.has(file.type as LabDocAsset['mime'])) {
    return {
      ok: false,
      error: `Unsupported image type "${file.type || 'unknown'}". Use PNG, JPEG, or WebP.`,
    };
  }
  if (file.size > MAX_ASSET_BYTES) {
    return {
      ok: false,
      error: `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB; limit 2 MB).`,
    };
  }
  const dataUrl = await readAsDataUrl(file);
  const comma = dataUrl.indexOf(',');
  const dataBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : '';
  return {
    ok: true,
    id: genId('fig'),
    asset: { mime: file.type as LabDocAsset['mime'], dataBase64, bytes: file.size },
  };
}
