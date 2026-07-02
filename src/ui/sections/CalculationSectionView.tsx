import { lazy, useEffect, useRef, useState } from 'react';
import {
  calcImageId,
  drawStorageKey,
  getResponseModes,
  resolveResponseMode,
  type ResponseMode,
} from '@/domain/calculationResponse';
import type { CalculationSection } from '@/domain/schema';
import { createEmptyFieldValue, useLabStore } from '@/state/labStore';
import { AnswerCard } from '@/ui/sections/AnswerCard';
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

const LATEX_HELP_EXAMPLES: Array<{ latex: string; description: string }> = [
  { latex: 'x^2', description: 'Exponent (superscript)' },
  { latex: 'x_1', description: 'Subscript' },
  { latex: '\\frac{a}{b}', description: 'Fraction' },
  { latex: '\\sqrt{x}', description: 'Square root' },
  { latex: '\\pi \\alpha \\theta', description: 'Greek letters' },
];

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
  const showLatexHelp = section.equationEditor && !forceTextCalc && activeMode === 'text';
  const [isLatexHelpOpen, setIsLatexHelpOpen] = useState(false);
  const latexHelpButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isLatexHelpOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLatexHelpOpen(false);
        latexHelpButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLatexHelpOpen]);

  return (
    <section className="section">
      <SectionPointsCaption points={section.points} />
      <MarkdownBlock markdown={section.prompt} />
      <AnswerCard>
        {showLatexHelp ? (
          <div className="latex-help">
            <button
              ref={latexHelpButtonRef}
              type="button"
              className="latex-help-button"
              aria-expanded={isLatexHelpOpen}
              aria-controls={`${section.fieldId}-latex-help-popover`}
              onClick={() => setIsLatexHelpOpen((open) => !open)}
            >
              How to type equations
            </button>
            {isLatexHelpOpen ? (
              <div
                id={`${section.fieldId}-latex-help-popover`}
                className="latex-help-popover"
                role="dialog"
                aria-label="How to type equations using LaTeX"
              >
                <p>Type math using LaTeX commands. A few of the basics:</p>
                <table className="latex-help-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LATEX_HELP_EXAMPLES.map((example) => (
                      <tr key={example.latex}>
                        <td>
                          <code>{example.latex}</code>
                        </td>
                        <td>{example.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  <a
                    href="https://en.wikibooks.org/wiki/LaTeX/Mathematics"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Full LaTeX math reference
                  </a>
                </p>
                <button type="button" onClick={() => setIsLatexHelpOpen(false)}>
                  Close
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
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
      </AnswerCard>
    </section>
  );
}
