import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Info } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import type { Course, Lab, Section } from '@/domain/schema';
import {
  clearParentMessagingContext,
  configureParentMessaging,
  postSubmitAnswersToParent,
} from '@/services/embed/parentPostMessage';
import { buildAnswersFromStore } from '@/services/integrity/buildAnswers';
import { canonicalize } from '@/services/integrity/canonicalize';
import { validateStudentInfoForPdf, type StudentInfoFieldId } from '@/services/integrity/preflight';
import { signAnswers } from '@/services/integrity/sign';
import { buildPdfFilename, prepareDraftPdf, sealPDF } from '@/services/pdf';
import {
  clearTelemetryContext,
  configureTelemetry,
  reportError,
} from '@/services/telemetry/errorReporter';
import { useLabStore, type RecoverableAttachment } from '@/state/labStore';
import { AccessibleDialog } from '@/ui/AccessibleDialog';
import { IntegrityAgreement } from '@/ui/IntegrityAgreement';
import { ProgressBar } from '@/ui/ProgressBar';
import { StudentInfoPreflightDialog } from '@/ui/StudentInfoPreflightDialog';
import { StudentNameGateDialog } from '@/ui/StudentNameGateDialog';
import { LayoutToggle } from '@/ui/layout/LayoutToggle';
import { SplitHandle } from '@/ui/layout/SplitHandle';
import { TableOfContents } from '@/ui/layout/TableOfContents';
import { Icon } from '@/ui/primitives/Icon';
import { Select } from '@/ui/primitives/Select';
import { SectionRenderer } from '@/ui/sections/SectionRenderer';
import {
  applyThemePreference,
  getStoredThemePreference,
  storeThemePreference,
  type ThemePreference,
} from '@/ui/theme';
import {
  buildPhaseBSteps,
  depositAfterTour,
  driver,
  isOnboarded,
  setOnboarded,
  stashTourReturn,
  WELCOME_LAB_ID,
} from '@/ui/tour/welcomeTour';

type Props = {
  course: Course;
  lab: Lab;
};

const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';
const TA_NAME_STORAGE_KEY = 'labframe:ta-name';
const STORAGE_NOTE_DISMISSED_KEY = 'labframe:storage-note-dismissed';
const COURSE_STORAGE_KEY = 'labframe:course';

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

/** The answer-slot id for sections that own one, used as a stable tour anchor. */
function sectionFieldId(section: Section): string | undefined {
  return 'fieldId' in section ? section.fieldId : undefined;
}

type SimulationFrameProps = {
  simulationId: string;
  title: string;
  url: string;
  allow?: string;
};

function StableSimulationFrame({ simulationId, title, url, allow }: SimulationFrameProps) {
  const mountId = useRef(`${simulationId}-${Math.random().toString(36).slice(2, 10)}`);
  return (
    <iframe
      title={title}
      src={url}
      allow={allow}
      loading="lazy"
      className="simulation-frame"
      data-mount-id={mountId.current}
    />
  );
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
  const taName = useLabStore((state) => state.taName);
  const setTaName = useLabStore((state) => state.setTaName);
  const setSubmitted = useLabStore((state) => state.setSubmitted);
  const integrityAgreementAccepted = useLabStore((state) => state.integrityAgreementAccepted);
  const aiUsed = useLabStore((state) => state.aiUsed);
  const aiSharedLinks = useLabStore((state) => state.aiSharedLinks);
  const clearCurrentLab = useLabStore((state) => state.clearCurrentLab);
  const listRecoverableAttachments = useLabStore((state) => state.listRecoverableAttachments);
  const deleteRecoverableAttachment = useLabStore((state) => state.deleteRecoverableAttachment);
  const store = useLabStore((state) => state);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // Track O: the wordmark target depends on whether a course is pinned. Read once
  // on render; the value is stable for the life of the page.
  const pinnedCourseId = safeStorageGet(COURSE_STORAGE_KEY);
  // Track S: deep-link toast for a first-timer who landed straight on a real lab
  // (not the demo). Never shown on the demo lab itself.
  const [showTourToast, setShowTourToast] = useState<boolean>(
    () => !isOnboarded() && lab.id !== WELCOME_LAB_ID,
  );
  const phaseBFinalizingRef = useRef(false);
  const [studentNameDraft, setStudentNameDraft] = useState(studentName);
  const [taNameDraft, setTaNameDraft] = useState(taName);
  const [recoverable, setRecoverable] = useState<RecoverableAttachment[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDraft, setIsExportingDraft] = useState(false);
  const [missingPreflightFields, setMissingPreflightFields] = useState<StudentInfoFieldId[]>([]);
  const [isPreflightDialogOpen, setIsPreflightDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isStorageInfoDialogOpen, setIsStorageInfoDialogOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [isStorageBannerDismissed, setIsStorageBannerDismissed] = useState<boolean>(
    () => safeStorageGet(STORAGE_NOTE_DISMISSED_KEY) === '1',
  );
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
    const storedTa = safeStorageGet(TA_NAME_STORAGE_KEY)?.trim() ?? '';
    if (storedTa && storedTa !== taName) {
      setTaName(storedTa);
    }
  }, [setTaName, taName]);

  // Track S, Phase B: the lab-side tour. Auto-starts only on the demo lab when
  // ?tour=1 is present (set by Phase A finish, the deep-link toast, or the
  // refresher). Strips the flag, lets the DOM settle, then drives. On finish or
  // Esc-dismiss it marks the student onboarded and deposits them per S-4.
  useEffect(() => {
    if (lab.id !== WELCOME_LAB_ID) {
      return;
    }

    const tourDriver = driver({
      showProgress: true,
      steps: buildPhaseBSteps(),
      onDestroyed: () => {
        if (phaseBFinalizingRef.current) {
          return;
        }
        phaseBFinalizingRef.current = true;
        setOnboarded();
        depositAfterTour((to) => navigate(to));
      },
    });

    // Let the DOM settle, then strip the flag and drive. The flag is removed at
    // drive time (not before) so React StrictMode's double-invoked mount still
    // sees ?tour=1 on its second pass and restarts cleanly. history.replaceState
    // keeps the router from re-rendering and racing the spotlight.
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      const params = new URLSearchParams(window.location.search);
      params.delete('tour');
      const query = params.toString();
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + (query ? `?${query}` : ''),
      );
      tourDriver.drive();
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      // If the page unmounts while the tour is still up (the student navigated
      // away by other means), tear it down without firing the deposit.
      if (tourDriver.isActive()) {
        phaseBFinalizingRef.current = true;
        tourDriver.destroy();
      }
    };
  }, [lab.id, navigate]);

  const startRefresherTour = () => {
    // Stash where we are so S-4 returns the student here after the tour.
    stashTourReturn(window.location.pathname + window.location.search);
    navigate('/welcome?tour=1');
  };

  useEffect(() => {
    const nextTheme = getStoredThemePreference();
    setThemePreference(nextTheme);
    applyThemePreference(nextTheme);
  }, []);

  useEffect(() => {
    applyThemePreference(themePreference);
    storeThemePreference(themePreference);
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
    setTaNameDraft(taName);
  }, [taName]);

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

  const submitStudentNameGate = (name: string) => {
    safeStorageSet(STUDENT_NAME_STORAGE_KEY, name);
    void setStudentName(name);
  };

  // Gate a fresh lab load on a real name so work persists under the correct key
  // from the first keystroke (the persistence key embeds the student name). The
  // demo/welcome lab is exempt because it drives its own guided tour. Reads all
  // the sources the restore effect uses, so a returning or LMS deep-linked
  // student (?student=) never sees the gate flash.
  const needsStudentName = useMemo(() => {
    if (lab.id === WELCOME_LAB_ID) {
      return false;
    }
    const paramStudent = searchParams.get('student')?.trim() ?? '';
    const storedStudent = safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '';
    // The default studentName is the "Student" placeholder, which is itself
    // invalid, so check every source rather than short-circuiting on the first
    // non-empty one. A valid name from any source (store, ?student=, or a prior
    // session's saved name) means the gate is not needed.
    const known = [studentName.trim(), paramStudent, storedStudent].some(
      (name) => validateStudentInfoForPdf({ studentName: name }).ok,
    );
    return !known;
  }, [lab.id, searchParams, studentName]);

  const commitTaName = () => {
    const nextName = taNameDraft.trim();
    if (nextName === taName) {
      setTaNameDraft(taName);
      return;
    }
    safeStorageSet(TA_NAME_STORAGE_KEY, nextName);
    setTaName(nextName);
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
    // Append to the DOM before clicking: some browsers ignore a programmatic
    // click on a detached anchor. Defer the revoke so it does not race the
    // browser reading the blob URL, which can silently abort the download.
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const exportPdf = async () => {
    const preflight = validateStudentInfoForPdf({ studentName: studentNameDraft });
    if (!preflight.ok) {
      setMissingPreflightFields(preflight.missing);
      setIsPreflightDialogOpen(true);
      return;
    }

    if (!integrityAgreementAccepted) {
      // The IntegrityAgreement UI disables the button before this fires, but
      // guard the export path so the gate can't be bypassed programmatically.
      return;
    }

    if (aiUsed && aiSharedLinks.trim().length === 0) {
      return;
    }

    const trimmedStudentName = studentNameDraft.trim();
    const studentNameForPdf = trimmedStudentName || studentName;

    setIsExportingPdf(true);
    try {
      const [{ renderPDF }, { collectPdfImageData }, { collectDrawArtifacts }] = await Promise.all([
        import('@/services/pdf/render'),
        import('@/services/pdf/collectImageData'),
        import('@/services/pdf/collectDrawImages'),
      ]);
      const draw = await collectDrawArtifacts(lab, store.fields, store.responseSelections);
      const base = buildAnswersFromStore(course, { ...store, studentName: studentNameForPdf });
      // Bind rasterized drawings into the signed envelope before canonicalizing.
      const answers = { ...base, images: { ...base.images, ...draw.blobRefs } };
      const images = { ...(await collectPdfImageData(store.images)), ...draw.dataUrls };
      const signing = await signAnswers(answers);
      const canonical = canonicalize(answers);
      const rendered = await renderPDF({
        mode: 'signed',
        lab,
        answers,
        course,
        images,
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
      const message =
        error instanceof Error
          ? error.message
          : 'Could not sign report (network issue). Try again.';
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
      const [{ renderPDF }, { collectPdfImageData }, { collectDrawArtifacts }] = await Promise.all([
        import('@/services/pdf/render'),
        import('@/services/pdf/collectImageData'),
        import('@/services/pdf/collectDrawImages'),
      ]);
      const draw = await collectDrawArtifacts(lab, store.fields, store.responseSelections);
      const base = buildAnswersFromStore(course, { ...store, studentName: studentNameForPdf });
      const answers = { ...base, images: { ...base.images, ...draw.blobRefs } };
      const images = { ...(await collectPdfImageData(store.images)), ...draw.dataUrls };
      const rendered = await renderPDF({
        mode: 'draft',
        lab,
        answers,
        course,
        images,
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
      const message =
        error instanceof Error ? error.message : 'Could not generate draft PDF. Try again.';
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

  const simulationEntries = useMemo(() => Object.entries(lab.simulations), [lab.simulations]);
  const [activeSimulationId, setActiveSimulationId] = useState<string>(
    () => simulationEntries[0]?.[0] ?? '',
  );

  useEffect(() => {
    if (!simulationEntries.some(([id]) => id === activeSimulationId)) {
      setActiveSimulationId(simulationEntries[0]?.[0] ?? '');
    }
  }, [simulationEntries, activeSimulationId]);

  const activeSimulation = activeSimulationId ? lab.simulations[activeSimulationId] : undefined;

  const simulationPane = (
    <div className="simulation-pane">
      {simulationEntries.length > 1 ? (
        <label className="simulation-picker">
          Simulation
          <Select
            value={activeSimulationId}
            onChange={setActiveSimulationId}
            options={simulationEntries.map(([id, def]) => ({ value: id, label: def.title }))}
            size="md"
          />
        </label>
      ) : null}
      {activeSimulation ? (
        <StableSimulationFrame
          key={activeSimulationId}
          simulationId={activeSimulationId}
          title={activeSimulation.title}
          url={activeSimulation.url}
          {...(activeSimulation.allow ? { allow: activeSimulation.allow } : {})}
        />
      ) : null}
    </div>
  );

  const worksheet = (
    <div className="worksheet-pane">
      <h1>{lab.title}</h1>
      {lab.sections.map((section, index) => (
        <div
          key={`${section.kind}-${index}`}
          id={`section-${index}`}
          className="worksheet-section-anchor"
          data-field-id={sectionFieldId(section)}
        >
          <SectionRenderer section={section} />
        </div>
      ))}
      <IntegrityAgreement
        ref={exportPdfButtonRef}
        lab={lab}
        isExporting={isExportingPdf}
        onExport={() => void exportPdf()}
      />
    </div>
  );

  return (
    <main className="lab-page">
      <header className="lab-header">
        <div className="lab-header-top">
          <div className="lab-header-left">
            {/* Track O: a pinned student returns to their scoped course, not the
                full /labs staff index. Falls back to /labs when unpinned. */}
            <Link to={pinnedCourseId ? `/c/${pinnedCourseId}` : '/labs'} className="lab-wordmark">
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
                <Select
                  value={themePreference}
                  onChange={(next) => setThemePreference(next as ThemePreference)}
                  options={[
                    { value: 'system', label: 'System' },
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                  ]}
                  size="sm"
                />
              </label>
              <button type="button" onClick={() => setIsAboutDialogOpen(true)}>
                About
              </button>
              <button type="button" className="lab-tour-button" onClick={startRefresherTour}>
                Take the tour
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
            <label className="lab-ta-name">
              TA(s)
              <input
                value={taNameDraft}
                onChange={(event) => setTaNameDraft(event.currentTarget.value)}
                onBlur={commitTaName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitTaName();
                  }
                }}
                aria-label="TA name(s)"
              />
            </label>
            <p className="lab-save-status" aria-live="polite">
              {savedLabel}
              <button
                type="button"
                className="lab-save-status-info"
                onClick={() => setIsStorageInfoDialogOpen(true)}
                aria-label="Storage details"
              >
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
            <button type="button" onClick={() => void exportDraftPdf()} disabled={isExportingDraft}>
              {isExportingDraft ? 'Saving draft...' : 'Save draft'}
            </button>
          </div>
        </div>
      </header>
      {showTourToast ? (
        <section className="storage-note-banner lab-tour-toast" role="status" aria-live="polite">
          <p>New here? Take the tour.</p>
          <div className="lab-tour-toast-actions">
            <button
              type="button"
              onClick={() => {
                setShowTourToast(false);
                navigate('/welcome?tour=1');
              }}
            >
              Take the tour
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboarded();
                setShowTourToast(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}
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
      <StudentNameGateDialog open={needsStudentName} onSubmit={submitStudentNameGate} />
      <StudentInfoPreflightDialog
        open={isPreflightDialogOpen}
        missing={missingPreflightFields}
        onClose={closePreflightDialog}
      />
      <AccessibleDialog
        open={isStorageInfoDialogOpen}
        title="Browser storage notice"
        onClose={() => setIsStorageInfoDialogOpen(false)}
      >
        <p>
          Your progress is saved in this browser using local storage and IndexedDB. It can be lost
          if browser data is cleared, if storage quotas are exceeded, or if you switch devices.
        </p>
      </AccessibleDialog>
      <AccessibleDialog
        open={isAboutDialogOpen}
        title="About LabFrame"
        onClose={() => setIsAboutDialogOpen(false)}
      >
        <p>Version: 1.0.0</p>
        <p>Build date: {new Date().toISOString().slice(0, 10)}</p>
        <p>Credit: ASU Online Physics Labs rebuild team.</p>
        <p>LabFrame - Built for ASU online physics labs.</p>
        <p>
          Links:{' '}
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>{' '}
          |{' '}
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
          style={
            layout === 'side'
              ? ({ '--split-sim': `${splitFraction * 100}%` } as CSSProperties)
              : undefined
          }
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
          <section
            className={
              layout === 'tabs' && tab !== 'simulation'
                ? 'layout-pane layout-pane-simulation is-hidden'
                : 'layout-pane layout-pane-simulation'
            }
          >
            {simulationPane}
          </section>
          {layout === 'side' ? (
            <SplitHandle splitFraction={splitFraction} onChange={setSplitFraction} />
          ) : null}
          <section
            className={
              layout === 'tabs' && tab !== 'worksheet'
                ? 'layout-pane layout-pane-worksheet is-hidden'
                : 'layout-pane layout-pane-worksheet'
            }
          >
            {worksheet}
          </section>
        </div>
      </div>
    </main>
  );
}
