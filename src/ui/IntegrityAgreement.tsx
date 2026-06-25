import { forwardRef, useId } from 'react';

import type { Lab } from '@/domain/schema';
import { resolveIntegrityAgreementText } from '@/services/integrity/agreementText';
import { Checkbox } from '@/ui/primitives/Checkbox';
import { useLabStore } from '@/state/labStore';

type Props = {
  lab: Lab;
  isExporting: boolean;
  onExport: () => void;
};

export const IntegrityAgreement = forwardRef<HTMLButtonElement, Props>(function IntegrityAgreement(
  { lab, isExporting, onExport },
  exportButtonRef,
) {
  const aiUsed = useLabStore((state) => state.aiUsed);
  const setAiUsed = useLabStore((state) => state.setAiUsed);
  const aiSharedLinks = useLabStore((state) => state.aiSharedLinks);
  const setAiSharedLinks = useLabStore((state) => state.setAiSharedLinks);
  const accepted = useLabStore((state) => state.integrityAgreementAccepted);
  const setAccepted = useLabStore((state) => state.setIntegrityAgreementAccepted);

  const agreementId = useId();
  const aiUsedId = useId();
  const linksId = useId();
  const linksErrorId = useId();

  const agreementText = resolveIntegrityAgreementText(lab);
  const linksMissing = aiUsed && aiSharedLinks.trim().length === 0;
  const exportDisabled = isExporting || !accepted || linksMissing;

  return (
    <section className="integrity-agreement" aria-labelledby={`${agreementId}-heading`}>
      <h2 id={`${agreementId}-heading`}>Academic integrity</h2>

      <div className="integrity-agreement-affirm">
        <Checkbox id={agreementId} checked={accepted} onChange={setAccepted}>
          {agreementText}
        </Checkbox>
      </div>

      <div className="integrity-agreement-ai">
        <div className="integrity-agreement-ai-toggle">
          <Checkbox id={aiUsedId} checked={aiUsed} onChange={setAiUsed}>
            I used AI or LLM tools on this lab.
          </Checkbox>
        </div>

        {aiUsed ? (
          <div className="integrity-agreement-links">
            <label htmlFor={linksId}>
              Paste share links to your AI conversations (one per line):
            </label>
            <textarea
              id={linksId}
              value={aiSharedLinks}
              onChange={(event) => setAiSharedLinks(event.currentTarget.value)}
              rows={4}
              placeholder="https://chat.openai.com/share/..."
              aria-invalid={linksMissing}
              aria-describedby={linksMissing ? linksErrorId : undefined}
            />
            {linksMissing ? (
              <p id={linksErrorId} className="integrity-agreement-error" role="alert">
                Add at least one share link, or uncheck the box above.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="integrity-agreement-export">
        <button
          ref={exportButtonRef}
          type="button"
          data-tour="export-pdf"
          onClick={onExport}
          disabled={exportDisabled}
        >
          {isExporting ? 'Exporting PDF...' : 'Export PDF'}
        </button>
        {!accepted ? (
          <p className="integrity-agreement-hint">Check the box above to enable export.</p>
        ) : null}
      </div>
    </section>
  );
});
