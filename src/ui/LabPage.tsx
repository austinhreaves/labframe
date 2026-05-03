import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import type { Course, Lab } from '@/domain/schema';
import { clearParentMessagingContext, configureParentMessaging, postSubmitAnswersToParent } from '@/services/embed/parentPostMessage';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { canonicalize } from '@/services/integrity/canonicalize';
import { validateStudentInfoForPdf, type StudentInfoFieldId } from '@/services/integrity/preflight';
import { signAnswers } from '@/services/integrity/sign';
import { buildPdfFilename, prepareDraftPdf, sealPDF } from '@/services/pdf';
import { clearTelemetryContext, configureTelemetry, reportError } from '@/services/telemetry/errorReporter';
import { useLabStore, type RecoverableAttachment } from '@/state/labStore';
import { AccessibleDialog } from '@/ui/AccessibleDialog';
import { ProgressBar } from '@/ui/ProgressBar';
import { StudentInfoPreflightDialog } from '@/ui/StudentInfoPreflightDialog';
import { LayoutToggle } from '@/ui/layout/LayoutToggle';
import { SplitHandle } from '@/ui/layout/SplitHandle';
import { TableOfContents } from '@/ui/layout/TableOfContents';
import { Icon } from '@/ui/primitives/Icon';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';

type Props = {
  course: Course;
  lab: Lab;
};

type ThemePreference = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'labframe:theme';
const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';
const STORAGE_NOTE_DISMISSED_KEY = 'labframe:storage-note-dismissed';

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage write errors (e.g. quota/full private mode)
  }
}

type SimulationFrameProps = {
  simulationId: string;
  title: string;
  url: string;
  allow?: string;
};

function StableSimulationFrame({ simulationId, title, url, allow }: SimulationFrameProps) {
  const mountId = useRef(`${simulationId}-${Math.random().toString(36).slice(2, 10)}`);
  return <iframe title={title} src={url} allow={allow} loading="lazy" className="simulation-frame" data-mount-id={mountId.current} />;
}

function applyThemePreference(theme: ThemePreference): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const prefersDark = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.dataset.theme = resolved;
}

export function LabPage({ course, lab }: Props) {
  const initLab = useLabStore((state) => state.initLab);
  const splitFraction = useLabStore((state) => state.splitFraction);
  const setSplitFraction = useLabStore((state) => state.setSplitFraction);
  const simSide = useLabStore((state) => state.simSide);
  const setSimSide = useLabStore((state) => state.setSimSide);
  const status = useLabStore((state) => state.status);
  const studentName = useLabStore((state) => state.studentName);
  const setStudentName = useLabStore((state) => state.setStudentName);
  const setSubmitted = useLabStore((state) => state.setSubmitted);
  const clearCurrentLab = useLabStore((state) => state.clearCurrentLab);
  const listRecoverableAttachments = useLabStore((state) => state.listRecoverableAttachments);
  const deleteRecoverableAttachment = useLabStore((state) => state.deleteRecoverableAttachment);
  const store = useLabStore((state) => state);
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentNameDraft, setStudentNameDraft] = useState(studentName);
  const [recoverable, setRecoverable] = useState<RecoverableAttachment[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDraft, setIsExportingDraft] = useState(false);
  const [missingPreflightFields, setMissingPreflightFields] = useState<StudentInfoFieldId[]>([]);
  const [isPreflightDialogOpen, setIsPreflightDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isStorageInfoDialogOpen, setIsStorageInfoDialogOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [isStorageBannerDismissed, setIsStorageBannerDismissed] = useState<boolean>(() => safeStorageGet(STORAGE_NOTE_DISMISSED_KEY) === '1');
  const exportPdfButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    void initLab(course.id, lab.id, lab);
  }, [course.id, lab, initLab]);

  useEffect(() => {
    document.title = `LabFrame - ${lab.title}`;
  }, [lab.title]);

  useEffect(() => {
    const paramStudent = searchParams.get('student')?.trim() ?? '';
    const storedStudent = safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '';
    const preferredStudent = paramStudent || storedStudent;
    if (!preferredStudent) {
      return;
    }

    if (preferredStudent !== studentName) {
      void setStudentName(preferredStudent);
    }
    if (preferredStudent !== storedStudent) {
      safeStorageSet(STUDENT_NAME_STORAGE_KEY, preferredStudent);
    }
  }, [searchParams, setStudentName, studentName]);

  useEffect(() => {
    const storedTheme = safeStorageGet(THEME_STORAGE_KEY);
    const nextTheme: ThemePreference = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system';
    setThemePreference(nextTheme);
    applyThemePreference(nextTheme);
  }, []);

  useEffect(() => {
    applyThemePreference(themePreference);
    safeStorageSet(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    configureTelemetry({
      ...(course.telemetryEndpoint ? { telemetryEndpoint: course.telemetryEndpoint } : {}),
      labId: lab.id,
    });
    configureParentMessaging({
      parentOriginAllowList: course.parentOriginAllowList,
      courseId: course.id,
      labId: lab.id,
    });
    return () => {
      clearTelemetryContext();
      clearParentMessagingContext();
    };
  }, [course.id, course.parentOriginAllowList, course.telemetryEndpoint, lab.id]);

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
      return 'Not saved yet in this browser';
    }
    return `Saved ${new Date(status.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} in this browser`;
  }, [status.lastSavedAt]);

  const commitStudentName = () => {
    const nextName = studentNameDraft.trim();
    if (!nextName || nextName === studentName) {
      setStudentNameDraft(studentName);
      return;
    }
    safeStorageSet(STUDENT_NAME_STORAGE_KEY, nextName);
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

  const exportPdf = async () => {
    const preflight = validateStudentInfoForPdf({ studentName: studentNameDraft });
    if (!preflight.ok) {
      setMissingPreflightFields(preflight.missing);
      setIsPreflightDialogOpen(true);
      return;
    }

    const trimmedStudentName = studentNameDraft.trim();
    const studentNameForPdf = trimmedStudentName || studentName;

    setIsExportingPdf(true);
    try {
      const { renderPDF } = await import('@/services/pdf/render');
      const answers = buildAnswersFromStore(course, { ...store, studentName: studentNameForPdf });
      const signing = await signAnswers(answers);
      const canonical = canonicalize(answers);
      const rendered = await renderPDF({
        mode: 'signed',
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

      const filename = buildPdfFilename({
        mode: 'signed',
        lab,
        studentName: studentNameForPdf,
        signedAt: signing.signedAt,
        signature: signing.signature,
      });
      downloadBlob(sealed, filename);
      setSubmitted(true);
      postSubmitAnswersToParent();
    } catch (error) {
      void reportError({ error, sectionId: 'pdf-export', labId: lab.id });
      const message = error instanceof Error ? error.message : 'Could not sign report (network issue). Try again.';
      window.alert(message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportDraftPdf = async () => {
    const trimmedStudentName = studentNameDraft.trim();
    const studentNameForPdf = trimmedStudentName || studentName || 'Student';

    setIsExportingDraft(true);
    try {
      const { renderPDF } = await import('@/services/pdf/render');
      const answers = buildAnswersFromStore(course, { ...store, studentName: studentNameForPdf });
      const rendered = await renderPDF({
        mode: 'draft',
        lab,
        answers,
        course,
      });
      const draftBytes = await prepareDraftPdf(rendered, {
        title: `${lab.title} Draft`,
      });
      const draftBlob = new Blob([Uint8Array.from(draftBytes)], { type: 'application/pdf' });
      const filename = buildPdfFilename({
        mode: 'draft',
        lab,
        studentName: studentNameForPdf,
      });
      downloadBlob(draftBlob, filename);
    } catch (error) {
      void reportError({ error, sectionId: 'pdf-draft-export', labId: lab.id });
      const message = error instanceof Error ? error.message : 'Could not generate draft PDF. Try again.';
      window.alert(message);
    } finally {
      setIsExportingDraft(false);
    }
  };

  const closePreflightDialog = () => {
    setIsPreflightDialogOpen(false);
    exportPdfButtonRef.current?.focus();
  };

  const layout = searchParams.get('layout') === 'tabs' ? 'tabs' : 'side';
  const tab = searchParams.get('tab') === 'simulation' ? 'simulation' : 'worksheet';
  const side = searchParams.get('side') === 'right' ? 'right' : 'left';

  useEffect(() => {
    if (simSide !== side) {
      setSimSide(side);
    }
  }, [setSimSide, side, simSide]);

  // Keep simulation mounted in one stable cell and change layout with CSS/tabs only.
  const simulationPane = (
    <div className="simulation-pane">
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
      <h1>{lab.title}</h1>
      {lab.sections.map((section, index) => (
        <div key={`${section.kind}-${index}`} id={`section-${index}`} className="worksheet-section-anchor">
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );

  return (
    <main className="lab-page">
      <header className="lab-header">
        <div className="lab-header-top">
          <div className="lab-header-left">
            <Link to="/labs" className="lab-wordmark">
              LabFrame
            </Link>
            <Link to={`/c/${course.id}`} className="lab-back-link">
              Back to {course.title}
            </Link>
          </div>
          <div className="lab-header-right">
            <div className="layout-controls">
              <label className="lab-theme-select">
                Theme
                <select value={themePreference} onChange={(event) => setThemePreference(event.currentTarget.value as ThemePreference)}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <button type="button" onClick={() => setIsAboutDialogOpen(true)}>
                About
              </button>
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
              <button
                type="button"
                onClick={() => {
                  const updated = new URLSearchParams(searchParams);
                  updated.set('side', simSide === 'left' ? 'right' : 'left');
                  setSearchParams(updated);
                }}
              >
                Swap sides
              </button>
            </div>
          </div>
        </div>
        <div className="lab-header-bottom">
          <div className="lab-header-bottom-main">
            <TableOfContents sections={lab.sections} />
            <ProgressBar sections={lab.sections} />
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
              <button type="button" className="lab-save-status-info" onClick={() => setIsStorageInfoDialogOpen(true)} aria-label="Storage details">
                <Icon icon={Info} size={14} />
              </button>
            </p>
          </div>
          <div className="lab-header-actions">
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
            <button ref={exportPdfButtonRef} type="button" onClick={() => void exportPdf()} disabled={isExportingPdf}>
              {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
            </button>
            <button type="button" onClick={() => void exportDraftPdf()} disabled={isExportingDraft}>
              {isExportingDraft ? 'Saving draft...' : 'Save draft'}
            </button>
          </div>
        </div>
      </header>
      {!isStorageBannerDismissed ? (
        <section className="storage-note-banner" role="status" aria-live="polite">
          <p>
            Saved work stays in this browser only.
            <button type="button" onClick={() => setIsStorageInfoDialogOpen(true)}>
              Details
            </button>
          </p>
          <button
            type="button"
            onClick={() => {
              setIsStorageBannerDismissed(true);
              safeStorageSet(STORAGE_NOTE_DISMISSED_KEY, '1');
            }}
          >
            Got it
          </button>
        </section>
      ) : null}
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
      <StudentInfoPreflightDialog open={isPreflightDialogOpen} missing={missingPreflightFields} onClose={closePreflightDialog} />
      <AccessibleDialog open={isStorageInfoDialogOpen} title="Browser storage notice" onClose={() => setIsStorageInfoDialogOpen(false)}>
        <p>
          Your progress is saved in this browser using local storage and IndexedDB. It can be lost if browser data is cleared, if storage
          quotas are exceeded, or if you switch devices.
        </p>
      </AccessibleDialog>
      <AccessibleDialog open={isAboutDialogOpen} title="About LabFrame" onClose={() => setIsAboutDialogOpen(false)}>
        <p>Version: 1.0.0</p>
        <p>Build date: {new Date().toISOString().slice(0, 10)}</p>
        <p>Credit: ASU Online Physics Labs rebuild team.</p>
        <p>LabFrame - Built for ASU online physics labs.</p>
        <p>
          Links: <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a> |{' '}
          <a href="https://www.asu.edu" target="_blank" rel="noreferrer">
            ASU
          </a>
        </p>
      </AccessibleDialog>
      <div className={layout === 'tabs' ? 'lab-shell lab-shell-tabs' : 'lab-shell'}>
        <div
          className={
            layout === 'tabs'
              ? 'lab-layout lab-layout-tabs'
              : `lab-layout lab-layout-side ${simSide === 'right' ? 'lab-layout-sim-right' : 'lab-layout-sim-left'}`
          }
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
          <section className={layout === 'tabs' && tab !== 'simulation' ? 'layout-pane layout-pane-simulation is-hidden' : 'layout-pane layout-pane-simulation'}>
            {simulationPane}
          </section>
          {layout === 'side' ? <SplitHandle splitFraction={splitFraction} onChange={setSplitFraction} /> : null}
          <section className={layout === 'tabs' && tab !== 'worksheet' ? 'layout-pane layout-pane-worksheet is-hidden' : 'layout-pane layout-pane-worksheet'}>
            {worksheet}
          </section>
        </div>
      </div>
    </main>
  );
}
