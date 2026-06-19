import type { Lab, Section } from '@/domain/schema';
import type { LabDoc, LabDocSection } from '@/domain/schema/labDoc';

import { base64ToBytes } from './bytes';
import { CAPTURE_DISCLOSURE_CORE } from './constants';

export type CompiledLab = {
  lab: Lab;
  assets: Record<string, Blob>;
};

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'authored-lab';
}

/**
 * Compose the integrity agreement for an authored lab (ADR-0008): the author's
 * custom text, if any, followed by the non-removable capture-disclosure core.
 * The core is always present.
 */
export function composeIntegrityAgreement(doc: LabDoc): string {
  const custom = doc.integrityAgreement?.customText?.trim();
  return custom ? `${custom}\n\n${CAPTURE_DISCLOSURE_CORE}` : CAPTURE_DISCLOSURE_CORE;
}

/**
 * Replace `asset:<id>` markdown image references with inline `data:` URLs from
 * the LabDoc's asset map, so author figures render through the normal markdown
 * pipeline (MarkdownBlock allows the `data` protocol for img). Unknown refs are
 * left as-is; the loader already rejects dangling references.
 */
function inlineAssets(markdown: string, assets: LabDoc['assets']): string {
  return markdown.replace(/asset:([A-Za-z0-9_-]+)/g, (match, id: string) => {
    const asset = assets[id];
    return asset ? `data:${asset.mime};base64,${asset.dataBase64}` : match;
  });
}

function toRuntimeSection(section: LabDocSection, assets: LabDoc['assets']): Section {
  if (section.kind === 'dataTable') {
    // Input-only columns widen to the runtime Column union unchanged.
    return { ...section, columns: section.columns.map((column) => ({ ...column })) };
  }
  if (section.kind === 'instructions') {
    return { ...section, html: inlineAssets(section.html, assets) };
  }
  if (section.kind === 'concept' && section.preamble) {
    return { ...section, preamble: inlineAssets(section.preamble, assets) };
  }
  return section;
}

/**
 * Produce the runtime artifacts the app already renders from a validated
 * LabDoc. The content hash is computed separately by `hashLabDoc` (it is async
 * via Web Crypto); `loadUntrustedLabDoc` returns both.
 */
export function compileLabDoc(doc: LabDoc): CompiledLab {
  const lab: Lab = {
    id: slugify(doc.meta.title),
    title: doc.meta.title,
    description: '',
    category: 'Custom',
    simulations: doc.simulations,
    studentInfo: { integrityAgreementText: composeIntegrityAgreement(doc) },
    sections: doc.sections.map((section) => toRuntimeSection(section, doc.assets)),
  };

  const assets: Record<string, Blob> = {};
  for (const [assetId, asset] of Object.entries(doc.assets)) {
    assets[assetId] = new Blob([base64ToBytes(asset.dataBase64)], { type: asset.mime });
  }

  return { lab, assets };
}
