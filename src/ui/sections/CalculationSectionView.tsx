import { lazy } from 'react';
import type { CalculationSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const EquationEditor = lazy(() => import('@/ui/primitives/EquationEditor'));
const FileDropzone = lazy(() =>
  import('@/ui/primitives/FileDropzone').then((m) => ({ default: m.FileDropzone })),
);
const MarkdownBlock = lazy(() => import('@/ui/primitives/MarkdownBlock'));

// Explicit opt-out of the equation editor via ?forceTextCalc in the URL,
// falling back to the plain textarea. On touch the editor stays active and
// relies on MathLive's own virtual keyboard (see EquationEditor); this flag is
// the escape hatch if that keyboard ever misbehaves on a given device.
const forceTextCalc =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('forceTextCalc');

type Props = {
  section: CalculationSection;
};

export function CalculationSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  const image = useLabStore((state) =>
    section.responseMode === 'image' && section.imageId
      ? state.images[section.imageId]
      : undefined,
  );
  const setImage = useLabStore((state) => state.setImage);

  const maxBytes = section.maxMB ? section.maxMB * 1024 * 1024 : undefined;

  let responseInput: React.ReactNode;
  if (section.responseMode === 'image') {
    responseInput = section.imageId ? (
      <FileDropzone
        id={section.imageId}
        value={
          image
            ? { fileName: image.fileName, objectUrl: image.objectUrl, sizeBytes: image.bytes }
            : undefined
        }
        maxBytes={maxBytes}
        onFileChange={(file) => setImage(section.imageId!, file)}
      />
    ) : (
      <Field
        id={section.fieldId}
        label={section.prompt}
        hideLabel
        value={value}
        multiline
        rows={4}
        onChange={(next) => setField(section.fieldId, next)}
      />
    );
  } else if (section.responseMode === 'draw') {
    // TODO: Phase C-B -- draw canvas branch
    responseInput = (
      <Field
        id={section.fieldId}
        label={section.prompt}
        hideLabel
        value={value}
        multiline
        rows={4}
        onChange={(next) => setField(section.fieldId, next)}
      />
    );
  } else if (section.equationEditor && !forceTextCalc) {
    responseInput = (
      <EquationEditor
        id={section.fieldId}
        label={section.prompt}
        hideLabel
        value={value}
        onChange={(next) => setField(section.fieldId, next)}
      />
    );
  } else {
    responseInput = (
      <Field
        id={section.fieldId}
        label={section.prompt}
        hideLabel
        value={value}
        multiline
        rows={4}
        onChange={(next) => setField(section.fieldId, next)}
      />
    );
  }

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <MarkdownBlock markdown={section.prompt} />
      {responseInput}
    </section>
  );
}
