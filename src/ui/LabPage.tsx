import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeftRight, Info } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import type { Course, Lab, Part, Section } from '@/domain/schema';
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
import { isCountedSection, sectionHasText } from '@/state/answered';
import { useLabStore, type RecoverableAttachment } from '@/state/labStore';
import { AccessibleDialog } from '@/ui/AccessibleDialog';
import { IntegrityAgreement } from '@/ui/IntegrityAgreement';
import { ProgressBar } from '@/ui/ProgressBar';
import { StudentInfoPreflightDialog } from '@/ui/StudentInfoPreflightDialog';
import { StudentNameGateDialog } from '@/ui/StudentNameGateDialog';
import { LayoutToggle } from '@/ui/layout/LayoutToggle';
import { OverflowMenu } from '@/ui/layout/OverflowMenu';
import { PartProgressSegments } from '@/ui/layout/PartProgressSegments';
import { SplitHandle } from '@/ui/layout/SplitHandle';
import { TableOfContents } from '@/ui/layout/TableOfContents';
import { TextSizeToggle } from '@/ui/layout/TextSizeToggle';
import { WorksheetSectionHeader } from '@/ui/layout/WorksheetSectionHeader';
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
  getStoredLayout,
  getStoredTextSize,
  storeLayout,
  storeTextSize,
  textSizeZoom,
  type LayoutMode,
  type TextSize,
} from '@/ui/viewSettings';
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
  /** Keep-alive (Pass 5): hide a non-active sim with display:none rather than
   *  unmounting, so its iframe runtime state (the wired circuit, the built-up
   *  charge) survives part navigation. Never re-key on hide; that remounts. */
  hidden?: boolean;
};

function StableSimulationFrame({
  simulationId,
  title,
  url,
  allow,
  hidden = false,
}: SimulationFrameProps) {
  const mountId = useRef(`${simulationId}-${Math.random().toString(36).slice(2, 10)}`);
  return (
    <iframe
      title={title}
      src={url}
      allow={allow}
      loading="lazy"
      className="simulation-frame"
      data-mount-id={mountId.current}
      style={hidden ? { display: 'none' } : undefined}
    />
  );
}

type PartNavProps = {
  parts: Part[];
  activePart: Part;
  onNavigate: (partKey: string) => void;
};

/**
 * Pass 6 (functional form): the bottom, non-sticky part nav at the end of a
 * part's scroll. Last part shows "Finish & review" into the review step rather
 * than advancing. The slimmer top arrows and the sticky header land in Pass 3.
 */
function PartNav({ parts, activePart, onNavigate }: PartNavProps) {
  const index = parts.findIndex((part) => part.key === activePart.key);
  const prev = index > 0 ? parts[index - 1] : undefined;
  const next = index < parts.length - 1 ? parts[index + 1] : undefined;
  return (
    <nav className="part-nav" aria-label="Part navigation">
      <div className="part-nav-side">
        {prev ? (
          <button type="button" onClick={() => onNavigate(prev.key)}>
            {'‹'} Part {prev.key}
          </button>
        ) : null}
      </div>
      <span className="part-nav-status">
        Part {activePart.key} - {index + 1} of {parts.length}
      </span>
      <div className="part-nav-side part-nav-side-end">
        {next ? (
          <button type="button" onClick={() => onNavigate(next.key)}>
            Next: Part {next.key} {'›'}
          </button>
        ) : (
          <button type="button" className="part-nav-finish" onClick={() => onNavigate('review')}>
            Finish &amp; review {'›'}
          </button>
        )}
      </div>
    </nav>
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
  const [textSize, setTextSize] = useState<TextSize>(() => getStoredTextSize());
  const [isStorageBannerDismissed, setIsStorageBannerDismissed] = useState<boolean>(
    () => safeStorageGet(STORAGE_NOTE_DISMISSED_KEY) === '1',
  );
  const exportPdfButtonRef = useRef<HTMLButtonElement | null>(null);
  const labHeaderRef = useRef<HTMLElement | null>(null);

  // Keep --lab-header-offset equal to the toolbar's real height so the sticky
  // section header (Pass 3) and the sticky simulation pane sit flush below it at
  // any width, instead of guessing with a fixed value that gaps or underlaps as
  // the one-row toolbar wraps.
  useEffect(() => {
    const header = labHeaderRef.current;
    if (!header || typeof ResizeObserver === 'undefined') {
      return;
    }
    const apply = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--lab-header-offset', `${height}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--lab-header-offset');
    };
  }, []);

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
    storeTextSize(textSize);
  }, [textSize]);

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

  // Short form in the toolbar ("Saved 22:47"); the full sentence is the hover
  // title (Pass 4), so the status stays compact in the single row.
  const { savedLabel, savedTitle } = useMemo(() => {
    if (!status.lastSavedAt) {
      const full = 'Not saved yet in this browser';
      return { savedLabel: 'Not saved yet', savedTitle: full };
    }
    const time = new Date(status.lastSavedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { savedLabel: `Saved ${time}`, savedTitle: `Saved ${time} in this browser` };
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

  // URL param wins (shareable/deep-linkable); the persisted preference is the
  // fallback when no param is present (Pass 7).
  const layoutParam = searchParams.get('layout');
  const layout: LayoutMode =
    layoutParam === 'tabs'
      ? 'tabs'
      : layoutParam === 'side'
        ? 'side'
        : (getStoredLayout() ?? 'side');
  const tab = searchParams.get('tab') === 'simulation' ? 'simulation' : 'worksheet';
  const side = searchParams.get('side') === 'right' ? 'right' : 'left';

  useEffect(() => {
    if (simSide !== side) {
      setSimSide(side);
    }
  }, [setSimSide, side, simSide]);

  // Pass 5: the optional parts grouping. A parts lab renders one part at a time
  // (sim bound to the part); `?part=review` is the terminal review step. Labs
  // without parts keep the single-scroll behavior unchanged.
  const parts = lab.parts;
  const hasParts = Boolean(parts && parts.length > 0);
  const partParam = searchParams.get('part');
  const isReview = hasParts && partParam === 'review';
  const activePart =
    hasParts && !isReview
      ? (parts!.find((part) => part.key === partParam) ?? parts![0])
      : undefined;
  const reviewTailStart = parts ? parts[parts.length - 1]!.sectionRange[1] : lab.sections.length;

  const simulationEntries = useMemo(() => Object.entries(lab.simulations), [lab.simulations]);

  // Picker state is only used by labs without parts (parts bind the sim to the
  // active part, so the picker is removed for them).
  const [pickedSimulationId, setPickedSimulationId] = useState<string>(
    () => simulationEntries[0]?.[0] ?? '',
  );
  useEffect(() => {
    if (!hasParts && !simulationEntries.some(([id]) => id === pickedSimulationId)) {
      setPickedSimulationId(simulationEntries[0]?.[0] ?? '');
    }
  }, [hasParts, simulationEntries, pickedSimulationId]);

  // The effective active simulation: bound to the active part in a parts lab,
  // otherwise the picked sim. During review the sim pane is hidden, so fall back
  // to the first part's sim purely to keep the keep-alive set coherent.
  const activeSimulationId = hasParts
    ? (activePart?.simulationId ?? parts![0]!.simulationId)
    : pickedSimulationId;

  // Keep-alive (Pass 5): the set of sim ids mounted so far (insertion order =
  // navigation order). Once a sim is mounted it stays in the tree for the
  // session, toggled with display:none, so its iframe runtime state survives
  // part navigation. Every id here is a part's simulationId, so it always
  // resolves in lab.simulations.
  const [activatedSimIds, setActivatedSimIds] = useState<Set<string>>(
    () => new Set(hasParts ? [activeSimulationId] : []),
  );
  useEffect(() => {
    if (!hasParts) {
      return;
    }
    setActivatedSimIds((prev) => {
      if (prev.has(activeSimulationId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(activeSimulationId);
      return next;
    });
  }, [hasParts, activeSimulationId]);

  const goToPart = (partKey: string) => {
    const updated = new URLSearchParams(searchParams);
    updated.set('part', partKey);
    setSearchParams(updated);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  // On entering review, auto-place the student at the review tail (the sim-less
  // discussion / conclusion) rather than the top of the long page; if there is
  // no tail, drop them at the integrity / export block. The worksheet renders
  // lazy (Suspense) section bodies whose heights settle after the first paint,
  // so re-run the scroll a few times until the target position stabilizes
  // rather than scrolling once against a still-growing layout.
  useEffect(() => {
    if (!isReview || typeof document === 'undefined') {
      return;
    }
    const hasTail = reviewTailStart < lab.sections.length;
    const scrollToTarget = () => {
      const target = hasTail ? document.getElementById(`section-${reviewTailStart}`) : null;
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
      }
    };
    scrollToTarget();
    const timers = [80, 250, 600].map((delay) => window.setTimeout(scrollToTarget, delay));
    // Stop re-pinning the moment the student takes over scrolling, so the retry
    // volley (which fights lazy layout shift) never yanks them back after they
    // have deliberately scrolled elsewhere.
    const cancel = () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, [isReview, reviewTailStart, lab.sections.length]);

  // Pass 3: the active part's answerable sections (excluding instructions / plot,
  // mirroring ProgressBar's counting) and how many are answered, for the slim
  // section header's "n/m answered" count.
  const partAnswerable = activePart
    ? lab.sections
        .slice(activePart.sectionRange[0], activePart.sectionRange[1])
        .filter(isCountedSection)
    : [];
  const partAnsweredCount = useLabStore(
    (state) => partAnswerable.filter((section) => sectionHasText(section, state)).length,
  );

  const activePartIndex =
    hasParts && activePart ? parts!.findIndex((part) => part.key === activePart.key) : -1;

  const pickedSimulation = lab.simulations[pickedSimulationId];

  const simulationPane = hasParts ? (
    <div className="simulation-pane">
      {[...activatedSimIds].map((id) => {
        const sim = lab.simulations[id];
        if (!sim) {
          return null;
        }
        return (
          <StableSimulationFrame
            key={id}
            simulationId={id}
            title={sim.title}
            url={sim.url}
            hidden={id !== activeSimulationId}
            {...(sim.allow ? { allow: sim.allow } : {})}
          />
        );
      })}
    </div>
  ) : (
    <div className="simulation-pane">
      {simulationEntries.length > 1 ? (
        <label className="simulation-picker">
          Simulation
          <Select
            value={pickedSimulationId}
            onChange={setPickedSimulationId}
            options={simulationEntries.map(([id, def]) => ({ value: id, label: def.title }))}
            size="md"
          />
        </label>
      ) : null}
      {pickedSimulation ? (
        <StableSimulationFrame
          key={pickedSimulationId}
          simulationId={pickedSimulationId}
          title={pickedSimulation.title}
          url={pickedSimulation.url}
          {...(pickedSimulation.allow ? { allow: pickedSimulation.allow } : {})}
        />
      ) : null}
    </div>
  );

  const renderSectionAt = (section: Section, index: number) => (
    <div
      key={`${section.kind}-${index}`}
      id={`section-${index}`}
      className="worksheet-section-anchor"
      data-field-id={sectionFieldId(section)}
    >
      <SectionRenderer section={section} />
    </div>
  );

  const worksheetBody =
    hasParts && !isReview && activePart
      ? lab.sections
          .slice(activePart.sectionRange[0], activePart.sectionRange[1])
          .map((section, i) => renderSectionAt(section, activePart.sectionRange[0] + i))
      : lab.sections.map((section, index) => renderSectionAt(section, index));

  // The integrity accept-gate + export live in the single scroll for non-parts
  // labs and in the review step for parts labs (never inside an individual part).
  const showSubmission = !hasParts || isReview;
  const lastPart = hasParts ? parts![parts!.length - 1]! : undefined;

  // Pass 3 + 6: the slim sticky header props. Top arrows move between parts and
  // dim at the first / last part (Finish & review is reached from the bottom nav
  // or the Sections menu, not the top arrow).
  let sectionHeader: ReactNode = null;
  if (hasParts && activePart) {
    const simTitle = lab.simulations[activePart.simulationId]?.title ?? activePart.title;
    sectionHeader = (
      <WorksheetSectionHeader
        labTitle={lab.title}
        partLabel={`Part ${activePart.key} - ${simTitle}`}
        answered={partAnsweredCount}
        total={partAnswerable.length}
        canPrev={activePartIndex > 0}
        canNext={activePartIndex < parts!.length - 1}
        onPrev={() => goToPart(parts![activePartIndex - 1]!.key)}
        onNext={() => goToPart(parts![activePartIndex + 1]!.key)}
      />
    );
  } else if (isReview && lastPart) {
    sectionHeader = (
      <WorksheetSectionHeader
        labTitle={lab.title}
        partLabel="Finish & review"
        answered={null}
        total={null}
        canPrev={true}
        canNext={false}
        onPrev={() => goToPart(lastPart.key)}
        onNext={() => undefined}
      />
    );
  }

  const worksheet = (
    <div className="worksheet-pane">
      {sectionHeader}
      {/* Text-size zoom is scoped to the worksheet content wrapper only; it must
          never sit on an ancestor of the simulation iframe (iframe-stability
          invariant), and it stays off the slim header chrome above. */}
      <div className="worksheet-zoom" style={{ zoom: textSizeZoom(textSize) }}>
        {/* In a parts lab the slim section header already shows the title, so the
            visible h1 is redundant; keep it for screen readers (heading landmark)
            but hide it visually. Non-parts labs keep the visible h1. */}
        <h1 className={hasParts ? 'visually-hidden' : undefined}>{lab.title}</h1>
        {isReview && lastPart ? (
          <div className="review-banner">
            <button type="button" onClick={() => goToPart(lastPart.key)}>
              {'‹'} Back to Part {lastPart.key}
            </button>
            <p>
              Finish &amp; review: check your work above, answer the questions below, then submit.
            </p>
          </div>
        ) : null}
        {worksheetBody}
        {hasParts && !isReview && activePart ? (
          <PartNav parts={parts!} activePart={activePart} onNavigate={goToPart} />
        ) : null}
        {showSubmission ? (
          <IntegrityAgreement
            ref={exportPdfButtonRef}
            lab={lab}
            isExporting={isExportingPdf}
            onExport={() => void exportPdf()}
          />
        ) : null}
      </div>
    </div>
  );

  // The review step forces the worksheet-only view with the simulation hidden
  // (but kept mounted, so part state survives); otherwise the chosen layout.
  const effectiveLayout = isReview ? 'tabs' : layout;
  const effectiveTab: 'simulation' | 'worksheet' = isReview ? 'worksheet' : tab;

  return (
    <main className="lab-page">
      <header className="lab-header" ref={labHeaderRef}>
        <div className="lab-toolbar">
          <div className="lab-toolbar-context">
            {/* Track O: a pinned student returns to their scoped course, not the
                full /labs staff index. Falls back to /labs when unpinned. */}
            <Link to={pinnedCourseId ? `/c/${pinnedCourseId}` : '/labs'} className="lab-wordmark">
              LabFrame
            </Link>
            <Link to={`/c/${course.id}`} className="lab-back-link">
              Back to {course.title}
            </Link>
            <span className="lab-toolbar-divider" aria-hidden="true" />
            <TableOfContents
              sections={lab.sections}
              {...(hasParts
                ? {
                    parts: parts!,
                    activePartKey: isReview ? 'review' : (activePart?.key ?? null),
                    onNavigatePart: goToPart,
                  }
                : {})}
            />
            {hasParts ? (
              <PartProgressSegments
                parts={parts!}
                sections={lab.sections}
                reviewTailStart={reviewTailStart}
                activeKey={isReview ? 'review' : (activePart?.key ?? null)}
                onNavigate={goToPart}
              />
            ) : (
              <ProgressBar sections={lab.sections} />
            )}
          </div>
          <div className="lab-toolbar-controls">
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
            <p className="lab-save-status" aria-live="polite" title={savedTitle}>
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
            <span className="lab-toolbar-divider" aria-hidden="true" />
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
            <TextSizeToggle value={textSize} onChange={setTextSize} />
            <LayoutToggle
              layout={layout}
              onChange={(next) => {
                storeLayout(next);
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
              className="lab-swap-button"
              aria-label="Swap sides"
              onClick={() => {
                const updated = new URLSearchParams(searchParams);
                updated.set('side', simSide === 'left' ? 'right' : 'left');
                setSearchParams(updated);
              }}
            >
              <Icon icon={ArrowLeftRight} size={18} />
            </button>
            <span className="lab-toolbar-divider" aria-hidden="true" />
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
            <OverflowMenu
              items={[
                { label: 'About', onSelect: () => setIsAboutDialogOpen(true) },
                { label: 'Take the tour', onSelect: startRefresherTour },
              ]}
            />
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
      <div className={effectiveLayout === 'tabs' ? 'lab-shell lab-shell-tabs' : 'lab-shell'}>
        <div
          className={
            effectiveLayout === 'tabs'
              ? 'lab-layout lab-layout-tabs'
              : `lab-layout lab-layout-side ${simSide === 'right' ? 'lab-layout-sim-right' : 'lab-layout-sim-left'}`
          }
          style={
            effectiveLayout === 'side'
              ? ({ '--split-sim': `${splitFraction * 100}%` } as CSSProperties)
              : undefined
          }
        >
          {effectiveLayout === 'tabs' && !isReview ? (
            <div className="tabs">
              <button
                type="button"
                onClick={() => {
                  const updated = new URLSearchParams(searchParams);
                  updated.set('layout', 'tabs');
                  updated.set('tab', 'simulation');
                  setSearchParams(updated);
                }}
                aria-pressed={effectiveTab === 'simulation'}
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
                aria-pressed={effectiveTab === 'worksheet'}
              >
                Worksheet
              </button>
            </div>
          ) : null}
          <section
            className={
              effectiveLayout === 'tabs' && effectiveTab !== 'simulation'
                ? 'layout-pane layout-pane-simulation is-hidden'
                : 'layout-pane layout-pane-simulation'
            }
          >
            {simulationPane}
          </section>
          {effectiveLayout === 'side' ? (
            <SplitHandle splitFraction={splitFraction} onChange={setSplitFraction} />
          ) : null}
          <section
            className={
              effectiveLayout === 'tabs' && effectiveTab !== 'worksheet'
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
