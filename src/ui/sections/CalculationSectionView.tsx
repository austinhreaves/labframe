import { lazy } from 'react';
import {
  calcImageId,
  drawStorageKey,
  getResponseModes,
  resolveResponseMode,
  type ResponseMode,
} from '@/domain/calculationResponse';
import type { CalculationSection } from '@/domain/schema';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import { Field } from '@/ui/primitives/Field';
const EquationEditor = lazy(() => import('@/ui/primitives/EquationEditor'));
const FileDropzone = lazy(() =>
  import('@/ui/primitives/FileDropzone').then((m) => ({ default: m.FileDropzone })),
);
const DrawCanvas = lazy(() => import('@/ui/primitives/DrawCanvas'));
const MarkdownBlock = lazy(() => import('@/ui/primitives/MarkdownBlock'));

// Explicit opt-out of the equation editor via ?forceTextCalc in the URL,
// falling back to the plain textarea. On touch the editor stays active and
// relies on MathLive's own virtual keyboard (see EquationEditor); this flag is
// the escape hatch if that keyboard ever misbehaves on a given device.
const forceTextCalc =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('forceTextCalc');

const MODE_LABELS: Record<ResponseMode, string> = {
  text: 'Type',
  draw: 'Draw',
  image: 'Photo',
};

type Props = {
  section: CalculationSection;
};

export function CalculationSectionView({ section }: Props) {
  const value = useLabStore((state) => state.fields[section.fieldId]);
  const setField = useLabStore((state) => state.setField);
  const drawKey = drawStorageKey(section.fieldId);
  const drawValue = useLabStore((state) => state.fields[drawKey]);
  const imageId = calcImageId(section);
  const image = useLabStore((state) => state.images[imageId]);
  const setImage = useLabStore((state) => state.setImage);
  const selection = useLabStore((state) => state.responseSelections[section.fieldId]);
  const setResponseSelection = useLabStore((state) => state.setResponseSelection);

  const maxBytes = section.maxMB ? section.maxMB * 1024 * 1024 : undefined;
  const modes = getResponseModes(section);
  const activeMode = resolveResponseMode(
    section,
    selection ? { [section.fieldId]: selection } : {},
  );

  const renderInput = (mode: ResponseMode): React.ReactNode => {
    if (mode === 'image') {
      return (
        <FileDropzone
          id={imageId}
          value={
            image
              ? { fileName: image.fileName, objectUrl: image.objectUrl, sizeBytes: image.bytes }
              : undefined
          }
          maxBytes={maxBytes}
          onFileChange={(file) => setImage(imageId, file)}
        />
      );
    }
    if (mode === 'draw') {
      return (
        <DrawCanvas
          id={drawKey}
          label={section.prompt}
          value={drawValue?.text}
          onChange={(serialized) =>
            setField(drawKey, { ...(drawValue ?? createEmptyFieldValue()), text: serialized })
          }
        />
      );
    }
    if (section.equationEditor && !forceTextCalc) {
      return (
        <EquationEditor
          id={section.fieldId}
          label={section.prompt}
          hideLabel
          value={value}
          onChange={(next) => setField(section.fieldId, next)}
        />
      );
    }
    return (
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
  };

  // Selection follows focus: arrow keys move along the tablist and switch mode.
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!modes) {
      return;
    }
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) {
      return;
    }
    event.preventDefault();
    const current = modes.indexOf(activeMode);
    const next = modes[(current + delta + modes.length) % modes.length]!;
    setResponseSelection(section.fieldId, next);
    document.getElementById(`${section.fieldId}-tab-${next}`)?.focus();
  };

  const panelId = `${section.fieldId}-panel`;

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <MarkdownBlock markdown={section.prompt} />
      {modes ? (
        <>
          <div className="calc-mode-switcher" role="tablist" aria-label="Response mode">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                id={`${section.fieldId}-tab-${mode}`}
                className="calc-mode-tab"
                aria-selected={mode === activeMode}
                aria-controls={panelId}
                tabIndex={mode === activeMode ? 0 : -1}
                data-active={mode === activeMode ? '' : undefined}
                onClick={() => setResponseSelection(section.fieldId, mode)}
                onKeyDown={handleTabKeyDown}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`${section.fieldId}-tab-${activeMode}`}
          >
            {renderInput(activeMode)}
          </div>
        </>
      ) : (
        renderInput(activeMode)
      )}
    </section>
  );
}
