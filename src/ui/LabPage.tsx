import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { Course, Lab } from '@/domain/schema';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { canonicalize } from '@/services/integrity/canonicalize';
import { signAnswers } from '@/services/integrity/sign';
import { renderPDF, sealPDF } from '@/services/pdf';
import { useLabStore, type RecoverableAttachment } from '@/state/labStore';
import { LayoutToggle } from '@/ui/layout/LayoutToggle';
import { SplitHandle } from '@/ui/layout/SplitHandle';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';

type Props = {
  course: Course;
  lab: Lab;
};

type SimulationFrameProps = {
  simulationId: string;
  title: string;
  url: string;
  allow?: string;
};

function StableSimulationFrame({ simulationId, title, url, allow }: SimulationFrameProps) {
  const mountId = useRef(`${simulationId}-${Math.random().toString(36).slice(2, 10)}`);
  return <iframe title={title} src={url} allow={allow} className="simulation-frame" data-mount-id={mountId.current} />;
}

export function LabPage({ course, lab }: Props) {
  const initLab = useLabStore((state) => state.initLab);
  const splitFraction = useLabStore((state) => state.splitFraction);
  const setSplitFraction = useLabStore((state) => state.setSplitFraction);
  const status = useLabStore((state) => state.status);
  const studentName = useLabStore((state) => state.studentName);
  const setStudentName = useLabStore((state) => state.setStudentName);
  const clearCurrentLab = useLabStore((state) => state.clearCurrentLab);
  const listRecoverableAttachments = useLabStore((state) => state.listRecoverableAttachments);
  const deleteRecoverableAttachment = useLabStore((state) => state.deleteRecoverableAttachment);
  const store = useLabStore((state) => state);
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentNameDraft, setStudentNameDraft] = useState(studentName);
  const [recoverable, setRecoverable] = useState<RecoverableAttachment[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    void initLab(course.id, lab.id, lab);
  }, [course.id, lab, initLab]);

  useEffect(() => {
    setStudentNameDraft(studentName);
  }, [studentName]);

  useEffect(() => {
    if (!status.lastError) {
      setRecoverable([]);
      return;
    }

    void listRecoverableAttachments().then(setRecoverable);
  }, [listRecoverableAttachments, status.lastError]);

  const savedLabel = useMemo(() => {
    if (!status.lastSavedAt) {
      return 'Not saved yet';
    }
    return `Saved ${new Date(status.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }, [status.lastSavedAt]);

  const commitStudentName = () => {
    const nextName = studentNameDraft.trim();
    if (!nextName || nextName === studentName) {
      setStudentNameDraft(studentName);
      return;
    }
    void setStudentName(nextName);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const answers = buildAnswersFromStore(course, store);
      const signing = await signAnswers(answers);
      const canonical = canonicalize(answers);
      const rendered = await renderPDF({
        lab,
        answers,
        course,
        signature: signing.signature,
        signedAt: signing.signedAt,
      });
      const sealedBytes = await sealPDF(rendered, {
        canonical,
        signature: signing.signature,
        signedAt: signing.signedAt,
        title: `${lab.title} Report`,
      });
      const normalizedBytes = Uint8Array.from(sealedBytes);
      const sealed = new Blob([normalizedBytes], { type: 'application/pdf' });

      if (sealed.size > 2 * 1024 * 1024) {
        console.warn(`[pdf] Large PDF generated: ${(sealed.size / (1024 * 1024)).toFixed(2)} MB`);
      }

      const hash = signing.signature.slice(0, 8);
      const filename = `${lab.id}-${hash}.pdf`;
      downloadBlob(sealed, filename);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign report (network issue). Try again.';
      window.alert(message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const layout = searchParams.get('layout') === 'tabs' ? 'tabs' : 'side';
  const tab = searchParams.get('tab') === 'simulation' ? 'simulation' : 'worksheet';

  // Keep simulation mounted in one stable cell and change layout with CSS/tabs only.
  const simulationPane = (
    <div className="simulation-pane">
      <h2>Simulation</h2>
      {Object.entries(lab.simulations).map(([id, simulationDef]) => (
        <StableSimulationFrame
          key={id}
          simulationId={id}
          title={simulationDef.title}
          url={simulationDef.url}
          {...(simulationDef.allow ? { allow: simulationDef.allow } : {})}
        />
      ))}
    </div>
  );

  const worksheet = (
    <div className="worksheet-pane">
      <h2>{lab.title}</h2>
      {lab.sections.map((section, index) => (
        <SectionRenderer key={`${section.kind}-${index}`} section={section} />
      ))}
    </div>
  );

  return (
    <main className="lab-page">
      <header className="lab-header">
        <div className="lab-header-left">
          <Link to={`/c/${course.id}`}>Back to {course.title}</Link>
        </div>
        <div className="lab-header-slot">
          <label className="lab-student-name">
            Student
            <input
              value={studentNameDraft}
              onChange={(event) => setStudentNameDraft(event.currentTarget.value)}
              onBlur={commitStudentName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitStudentName();
                }
              }}
              aria-label="Student name"
            />
          </label>
          <p className="lab-save-status" aria-live="polite">
            {savedLabel}
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all saved work for this lab and student?')) {
                void clearCurrentLab();
              }
            }}
          >
            Start fresh
          </button>
          <button type="button" onClick={() => void generatePdf()} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
          </button>
        </div>
        <div className="lab-header-right">
          <LayoutToggle
            layout={layout}
            onChange={(next) => {
              const updated = new URLSearchParams(searchParams);
              updated.set('layout', next);
              if (next === 'tabs' && !updated.get('tab')) {
                updated.set('tab', 'worksheet');
              }
              setSearchParams(updated);
            }}
          />
        </div>
      </header>
      {status.lastError ? (
        <section className="persistence-error-banner" role="status" aria-live="polite">
          <p>{status.lastError}</p>
          {recoverable.length > 0 ? (
            <>
              <p>Delete attachments from other labs to free space:</p>
              <ul className="persistence-error-list">
                {recoverable.map((entry) => (
                  <li key={entry.key}>
                    <span>
                      {entry.labId} / {entry.imageId} ({formatBytes(entry.bytes)})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteRecoverableAttachment(entry.key).then(() => {
                          void listRecoverableAttachments().then(setRecoverable);
                        });
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No other-lab attachments found to remove.</p>
          )}
        </section>
      ) : null}
      <div
        className={layout === 'tabs' ? 'lab-layout lab-layout-tabs' : 'lab-layout lab-layout-side'}
        style={layout === 'side' ? ({ '--split-sim': `${splitFraction * 100}%` } as CSSProperties) : undefined}
      >
        {layout === 'tabs' ? (
          <div className="tabs">
            <button
              type="button"
              onClick={() => {
                const updated = new URLSearchParams(searchParams);
                updated.set('layout', 'tabs');
                updated.set('tab', 'simulation');
                setSearchParams(updated);
              }}
              aria-pressed={tab === 'simulation'}
            >
              Simulation
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = new URLSearchParams(searchParams);
                updated.set('layout', 'tabs');
                updated.set('tab', 'worksheet');
                setSearchParams(updated);
              }}
              aria-pressed={tab === 'worksheet'}
            >
              Worksheet
            </button>
          </div>
        ) : null}
        <section className={layout === 'tabs' && tab !== 'simulation' ? 'layout-pane is-hidden' : 'layout-pane'}>{simulationPane}</section>
        {layout === 'side' ? <SplitHandle splitFraction={splitFraction} onChange={setSplitFraction} /> : null}
        <section className={layout === 'tabs' && tab !== 'worksheet' ? 'layout-pane is-hidden' : 'layout-pane'}>{worksheet}</section>
      </div>
    </main>
  );
}
