import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Driver } from 'driver.js';

import type { Course, CourseLabRef, Lab } from '@/domain/schema';
import { LogoMark } from '@/ui/catalog/HeroIllustration';
import { StartMotif } from '@/ui/catalog/StartMotif';
import { deriveCourseProgress, type LabProgress } from '@/ui/catalog/startProgress';
import { Button } from '@/ui/primitives/Button';
import { Icon } from '@/ui/primitives/Icon';
import { ThemeToggle } from '@/ui/ThemeToggle';
import { driver, isOnboarded, setOnboarded } from '@/ui/tour/welcomeTour';

type CatalogProps = {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
  showWizard: boolean;
};

const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';
const TA_NAME_STORAGE_KEY = 'labframe:ta-name';
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
    // Ignore quota/storage errors in catalog flow.
  }
}

function labDisplayLabel(labRef: CourseLabRef, lab: Lab | undefined): string {
  const title = lab?.title ?? labRef.ref;
  return labRef.labNumber !== undefined ? `Lab ${labRef.labNumber}: ${title}` : title;
}

function courseMetaLabel(course: Course): string {
  const visible = course.labs.filter((labRef) => labRef.enabled);
  const core = visible.filter((labRef) => (labRef.group ?? 'core') === 'core').length;
  const enrichment = visible.filter((labRef) => labRef.group === 'enrichment').length;
  const comingSoon = visible.filter((labRef) => labRef.group === 'coming-soon').length;
  const parts: string[] = [];
  if (core > 0) {
    parts.push(enrichment > 0 ? `${core} core` : `${core} ${core === 1 ? 'lab' : 'labs'}`);
  }
  if (enrichment > 0) {
    parts.push(`${enrichment} coming soon`);
  }
  if (comingSoon > 0) {
    parts.push(`${comingSoon} coming soon`);
  }
  return parts.join(' · ');
}

function byLabNumber(a: CourseLabRef, b: CourseLabRef): number {
  return (a.labNumber ?? Number.MAX_SAFE_INTEGER) - (b.labNumber ?? Number.MAX_SAFE_INTEGER);
}

/**
 * One course's On deck / Up next block. On deck is derived read-only from the
 * manifest plus saved progress: enabled playable (`core`) labs not yet
 * completed, ordered by lab number. Up next is the remaining enabled labs
 * (coming-soon / enrichment) as quiet, non-navigable chips.
 */
function CourseStartBlock({
  course,
  labsByCourse,
  progress,
  studentToken,
  showCourseLink,
}: {
  course: Course;
  labsByCourse: Record<string, Record<string, Lab>>;
  progress: Record<string, LabProgress>;
  studentToken: string;
  showCourseLink: boolean;
}) {
  const labs = labsByCourse[course.id] ?? {};
  const playable = course.labs.filter(
    (labRef) => labRef.enabled && (labRef.group ?? 'core') === 'core',
  );
  const onDeck = playable
    .filter((labRef) => progress[labRef.ref] !== 'completed')
    .sort(byLabNumber);
  const upNext = course.labs
    .filter((labRef) => labRef.enabled && labRef.group !== undefined && labRef.group !== 'core')
    .sort(byLabNumber);

  return (
    <section className="start-course" aria-label={course.title}>
      <header className="start-course-header">
        <h2 className="start-course-title">{course.title}</h2>
        {showCourseLink ? (
          <Link className="catalog-course-link" to={`/c/${course.id}`}>
            Course page
            <Icon icon={ChevronRight} size={14} />
          </Link>
        ) : null}
      </header>

      <h3 className="start-eyebrow">
        On deck
        <span className="start-eyebrow-sub"> - ready for you - based on your progress</span>
      </h3>
      {onDeck.length > 0 ? (
        <ul className="start-deck-grid">
          {onDeck.map((labRef) => {
            const lab = labs[labRef.ref];
            const inProgress = progress[labRef.ref] === 'in_progress';
            const to = `/c/${course.id}/${labRef.ref}${
              studentToken ? `?student=${encodeURIComponent(studentToken)}` : ''
            }`;
            return (
              <li key={labRef.ref}>
                <Link className="start-deck-card" to={to} aria-label={labDisplayLabel(labRef, lab)}>
                  <span className="start-deck-top">
                    {labRef.labNumber !== undefined ? (
                      <span className="start-pill">Lab {labRef.labNumber}</span>
                    ) : null}
                    <span className="start-deck-status">
                      <span className="start-deck-dot" aria-hidden="true" />
                      {inProgress ? 'In progress' : 'Ready'}
                    </span>
                  </span>
                  <span className="start-deck-title">{lab?.title ?? labRef.ref}</span>
                  {lab?.description ? (
                    <span className="start-deck-desc">{lab.description}</span>
                  ) : null}
                  <span className="start-deck-cta">
                    Start this lab
                    <Icon icon={ChevronRight} size={16} className="start-deck-chevron" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="start-deck-empty">
          Every available lab is complete. New labs land here when they open.
        </p>
      )}

      {upNext.length > 0 ? (
        <>
          <h3 className="start-eyebrow">
            Up next
            <span className="start-eyebrow-sub">
              {' '}
              - {upNext.length} {upNext.length === 1 ? 'lab' : 'labs'} coming to {course.title}
            </span>
          </h3>
          <ul className="start-upnext">
            {upNext.map((labRef) => {
              const lab = labs[labRef.ref];
              return (
                <li key={labRef.ref} className="start-upnext-chip">
                  {labRef.labNumber !== undefined ? (
                    <span className="start-pill">Lab {labRef.labNumber}</span>
                  ) : null}
                  {lab?.title ?? labRef.ref}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="catalog-disclosure">
      <summary>
        <span className="catalog-disclosure-title">{title}</span>
        <Icon icon={ChevronDown} size={16} className="catalog-disclosure-chevron" />
      </summary>
      <div className="catalog-disclosure-body">{children}</div>
    </details>
  );
}

function AboutAndPrivacy({ courseTitle }: { courseTitle: string }) {
  return (
    <section className="catalog-disclosures" aria-label="About and privacy">
      <Disclosure title="About LabFrame">
        <p>
          LabFrame is the browser-based lab environment for {courseTitle} at Arizona State
          University. There is no account to create and nothing to install. You follow a link from
          Canvas, select your lab, and work through it on a single page that holds the simulation,
          the prompts, the data tables, and the plots together. When you are done, you export a PDF
          and submit that PDF to the corresponding Canvas assignment.
        </p>
        <p>
          Every simulation in the course is openly-licensed and open-source. Most come from the{' '}
          <a href="https://phet.colorado.edu/" rel="noreferrer noopener" target="_blank">
            PhET Interactive Simulations
          </a>{' '}
          project at the University of Colorado Boulder, with additional simulations drawn from the{' '}
          <a href="https://www.compadre.org/osp/" rel="noreferrer noopener" target="_blank">
            Open Source Physics
          </a>{' '}
          community and other openly-licensed projects. All lab manuals are written for this course
          or adapted from openly-licensed material. You will not be asked to buy a textbook, an
          access code, or a lab kit. LabFrame is built on open simulations and an in-house platform:
          commercial lab platforms tend to gate basic functionality behind paywalls, send student
          interaction data to third-party vendors, and constrain courses to whatever pedagogy fits a
          publisher&apos;s product. Working with open tools lets the course evolve in response to
          what is actually working for the students taking it.
        </p>
        <p>
          LabFrame was created by{' '}
          <a href="https://github.com/austinhreaves" rel="noreferrer noopener" target="_blank">
            Austin Reaves
          </a>{' '}
          and is released under the{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            rel="noreferrer noopener"
            target="_blank"
          >
            GNU Affero General Public License v3
          </a>
          .
        </p>
      </Disclosure>
      <Disclosure title="Your data and FERPA">
        <p>
          LabFrame is designed to keep your work on your device while you do it. Your name, your TA
          names, your in-progress lab responses, your data tables, your fit selections, and any
          images you attach are stored in this browser&apos;s local storage; none of it leaves the
          browser. While you are working through a lab, nothing is transmitted to a LabFrame server,
          and no third-party analytics or vendor data harvesting is involved. The interactive
          simulations themselves load from their original open-source hosts (PhET, Open Source
          Physics, and similar projects) via embedded frames.
        </p>
        <p>
          When you click Export PDF, the report is generated locally in your browser and contains
          your worksheet responses, data tables, plots, and a process-record appendix. You submit
          that PDF to Canvas yourself; LabFrame does not separately transmit your work to anyone.
          Course instructors and TAs see your submission through the normal Canvas grading workflow.
          The process-record appendix is described in detail in the course syllabus.
        </p>
        <p>
          Because your work lives in this browser&apos;s storage, switching devices, clearing
          browser data, or working in a private or incognito window will lose your draft. Use the
          Save Draft button regularly, and export a backup PDF before walking away from a lab for a
          long time. If you are using a shared or public computer, clear your browser data after
          your session.
        </p>
      </Disclosure>
    </section>
  );
}

export function Catalog({ courses, labsByCourse, showWizard }: CatalogProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nameDraft, setNameDraft] = useState(
    () => safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '',
  );
  const [taNameDraft, setTaNameDraft] = useState(
    () => safeStorageGet(TA_NAME_STORAGE_KEY)?.trim() ?? '',
  );
  // The committed (saved) student name drives progress derivation and the
  // ?student= hand-off; the drafts above are just the form fields.
  const [savedStudentName, setSavedStudentName] = useState(
    () => safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '',
  );
  const [detailsCollapsed, setDetailsCollapsed] = useState(() => savedStudentName !== '');
  const [pinnedCourseId, setPinnedCourseId] = useState<string | null>(null);
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, Record<string, LabProgress>>
  >({});

  // Track S: first-run splash + Phase A tour driver. The splash only appears on
  // the student root (`/`, where the start screen shows) for a not-yet-onboarded
  // student; it replaces the start screen until they start or skip.
  const [onboarded, setOnboardedState] = useState<boolean>(() => isOnboarded());
  const [tourActive, setTourActive] = useState(false);
  const phaseADriverRef = useRef<Driver | null>(null);
  const phaseACompletingRef = useRef(false);
  const phaseAUnmountedRef = useRef(false);
  const nameDraftRef = useRef(nameDraft);
  nameDraftRef.current = nameDraft;
  const showSplash = showWizard && !onboarded;

  // Track O: scoping operates on academic courses only. A `role: 'resources'`
  // course (Getting Started) is never pinned, never offered in the picker, and
  // always shows alongside the pinned course.
  const academicCourses = useMemo(
    () => courses.filter((course) => course.role !== 'resources'),
    [courses],
  );
  const resourcesCourses = useMemo(
    () => courses.filter((course) => course.role === 'resources'),
    [courses],
  );

  const pinnedCourse = useMemo(
    () => academicCourses.find((course) => course.id === pinnedCourseId) ?? null,
    [academicCourses, pinnedCourseId],
  );

  // Scoping only applies to the student root (`/`). The unlinked `/labs` staff
  // index and single-course `/c/:courseId` pages are left untouched.
  const scoped = showWizard && pinnedCourse !== null;
  const displayCourses = useMemo(
    () => (scoped && pinnedCourse ? [pinnedCourse, ...resourcesCourses] : courses),
    [scoped, pinnedCourse, resourcesCourses, courses],
  );

  const standaloneCourse = !showWizard && courses.length === 1 ? courses[0] : null;
  const headerCourse = standaloneCourse ?? (scoped ? pinnedCourse : null);
  const aboutCourseTitle = standaloneCourse?.title ?? pinnedCourse?.title ?? 'your course';

  useEffect(() => {
    document.title = standaloneCourse ? `LabFrame - ${standaloneCourse.title}` : 'LabFrame';
  }, [standaloneCourse]);

  useEffect(() => {
    // Resolve the pinned course: a `?course=` param naming an academic course
    // wins and is persisted; otherwise fall back to the stored pin. Only
    // academic course ids are honored (a stale or resources id is ignored).
    const stored = safeStorageGet(COURSE_STORAGE_KEY);
    const param = searchParams.get('course');
    const paramAcademic =
      param && academicCourses.some((course) => course.id === param) ? param : null;
    if (paramAcademic) {
      if (paramAcademic !== stored) {
        safeStorageSet(COURSE_STORAGE_KEY, paramAcademic);
      }
      setPinnedCourseId(paramAcademic);
      return;
    }
    setPinnedCourseId(
      stored && academicCourses.some((course) => course.id === stored) ? stored : null,
    );
  }, [searchParams, academicCourses]);

  // Read-only progress for On deck: re-derived when the saved name changes or
  // the course set in view changes. Storage writes happen on the lab page, so a
  // fresh navigation back here re-reads the latest state.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      displayCourses.map(
        async (course) =>
          [course.id, await deriveCourseProgress(course.id, savedStudentName)] as const,
      ),
    ).then((entries) => {
      if (!cancelled) {
        setProgressByCourse(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [displayCourses, savedStudentName]);

  const saveDetails = () => {
    const value = nameDraft.trim();
    if (!value) {
      return;
    }
    safeStorageSet(STUDENT_NAME_STORAGE_KEY, value);
    safeStorageSet(TA_NAME_STORAGE_KEY, taNameDraft.trim());
    setSavedStudentName(value);
    setDetailsCollapsed(true);
  };

  const skipTutorial = () => {
    setOnboarded();
    setOnboardedState(true);
  };

  const pickTourCourse = (courseId: string) => {
    safeStorageSet(COURSE_STORAGE_KEY, courseId);
    setPinnedCourseId(courseId);
    phaseADriverRef.current?.moveNext();
  };

  // Phase A driver: starts when the tour panel is revealed (Get Started). The
  // course-picker and name anchors must exist first, so we start after the
  // panel mounts. On normal finish it navigates to the demo lab with ?tour=1;
  // an Esc / overlay dismiss instead marks the student onboarded and drops them
  // into the scoped start screen.
  useEffect(() => {
    if (!tourActive) {
      return;
    }
    phaseACompletingRef.current = false;
    phaseAUnmountedRef.current = false;
    const tourDriver = driver({
      showProgress: true,
      steps: [
        {
          popover: {
            title: 'Welcome to LabFrame',
            description: 'This takes about a minute. You can skip any step.',
          },
        },
        {
          element: '.tour-course-picker',
          popover: {
            title: 'Pick your course',
            description: 'Select the course you are enrolled in.',
          },
        },
        {
          element: '.tour-name-field',
          popover: {
            title: 'Your name',
            description:
              'Enter your name as it should appear on your lab report. It stays in this browser.',
            onNextClick: () => {
              const value = nameDraftRef.current.trim();
              if (value) {
                safeStorageSet(STUDENT_NAME_STORAGE_KEY, value);
              }
              tourDriver.moveNext();
            },
          },
        },
        {
          popover: {
            title: 'Ready?',
            description: "Let's take a look at a lab.",
            doneBtnText: 'Show me',
            onNextClick: () => {
              phaseACompletingRef.current = true;
              tourDriver.destroy();
              navigate('/welcome?tour=1');
            },
          },
        },
      ],
      onDestroyed: () => {
        if (phaseACompletingRef.current || phaseAUnmountedRef.current) {
          return;
        }
        // Esc / overlay dismiss mid-tour: count it as seen and stop nagging.
        setOnboarded();
        setOnboardedState(true);
        setTourActive(false);
      },
    });
    phaseADriverRef.current = tourDriver;
    const timer = window.setTimeout(() => tourDriver.drive(), 100);
    return () => {
      window.clearTimeout(timer);
      phaseAUnmountedRef.current = true;
      tourDriver.destroy();
    };
  }, [tourActive, navigate]);

  const savedTa = taNameDraft.trim();

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <Link to="/" className="catalog-brand">
          <LogoMark />
          <span className="catalog-brand-name">LabFrame</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="catalog">
        {showSplash ? (
          <section className="catalog-splash" aria-labelledby="catalog-splash-title">
            <h1 id="catalog-splash-title" className="catalog-splash-title">
              Welcome to LabFrame
            </h1>
            <p className="catalog-splash-lead">
              Run your physics lab, fill the worksheet, export a signed report.
            </p>
            {!tourActive ? (
              <div className="catalog-splash-actions">
                <Button variant="primary" size="lg" onClick={() => setTourActive(true)}>
                  Get Started
                </Button>
                <Button variant="ghost" size="md" onClick={skipTutorial}>
                  Skip tutorial
                </Button>
              </div>
            ) : (
              <div className="catalog-splash-tour">
                <div className="tour-course-picker">
                  <h2>Pick your course</h2>
                  <ul className="catalog-wizard-cards">
                    {academicCourses.map((course) => (
                      <li key={course.id}>
                        <button
                          type="button"
                          className="catalog-wizard-card"
                          onClick={() => pickTourCourse(course.id)}
                        >
                          <span className="catalog-wizard-card-text">
                            <span className="catalog-wizard-card-title">{course.title}</span>
                            <span className="catalog-wizard-card-meta">
                              {courseMetaLabel(course)}
                            </span>
                          </span>
                          <Icon
                            icon={ChevronRight}
                            size={16}
                            className="catalog-wizard-card-chevron"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="field tour-name-field">
                  <span className="field-label">Your name</span>
                  <input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.currentTarget.value)}
                    aria-label="Student name"
                    autoComplete="name"
                    placeholder="Full name, as it should appear on your report"
                  />
                </label>
                <label className="field">
                  <span className="field-label">TA Name(s) (optional)</span>
                  <input
                    value={taNameDraft}
                    onChange={(event) => setTaNameDraft(event.currentTarget.value)}
                    onBlur={() => {
                      const taValue = taNameDraft.trim();
                      if (taValue) {
                        safeStorageSet(TA_NAME_STORAGE_KEY, taValue);
                      }
                    }}
                    aria-label="TA name(s)"
                    placeholder="Your TA's name"
                  />
                </label>
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="start-header" aria-label="LabFrame">
              <div className="start-header-copy">
                <div className="start-wordmark-row">
                  <h1 className="start-wordmark">LabFrame</h1>
                  {headerCourse ? (
                    <span className="start-course-chip">{headerCourse.title}</span>
                  ) : null}
                </div>
                <p className="start-tagline">
                  Predict, observe, and explain, at your pace. Show your work; save as you go.
                </p>
              </div>
              <div className="start-header-motif">
                <StartMotif />
              </div>
            </section>

            <div className="start-details-row">
              <section className="start-details" aria-label="Your details">
                {detailsCollapsed ? (
                  <div className="start-details-summary start-fold">
                    <span className="start-details-check" aria-hidden="true">
                      <Icon icon={Check} size={14} />
                    </span>
                    <span className="start-details-name">{savedStudentName}</span>
                    <span className="start-details-meta">
                      {savedTa ? `TA: ${savedTa}` : 'No TA listed'} · saved on this device
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setDetailsCollapsed(false)}>
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="start-details-form start-fold">
                    <h2 className="start-details-title">Start a lab - your details</h2>
                    <label className="field">
                      <span className="field-label">Your name</span>
                      <input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.currentTarget.value)}
                        aria-label="Student name"
                        autoComplete="name"
                        placeholder="Full name, as it should appear on your report"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">TA name(s) (optional)</span>
                      <input
                        value={taNameDraft}
                        onChange={(event) => setTaNameDraft(event.currentTarget.value)}
                        aria-label="TA name(s)"
                        placeholder="Your TA's name"
                      />
                    </label>
                    <div className="start-details-actions">
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!nameDraft.trim()}
                        onClick={saveDetails}
                        trailingIcon={<Icon icon={ChevronRight} size={16} />}
                      >
                        Save &amp; continue
                      </Button>
                    </div>
                    <p className="catalog-ferpa-note">
                      Your name and TA are saved only in this browser. See the privacy section below
                      for details.
                    </p>
                  </div>
                )}
              </section>
              <Link className="start-explore" to="/sims">
                <span className="start-explore-text">
                  <span className="start-explore-title">Just explore</span>
                  <span className="start-explore-sub">
                    Open any course simulation. No worksheet, nothing recorded.
                  </span>
                </span>
                <Icon icon={ChevronRight} size={18} className="start-explore-chevron" />
              </Link>
            </div>

            <div className="start-course-blocks">
              {displayCourses.map((course) => (
                <CourseStartBlock
                  key={course.id}
                  course={course}
                  labsByCourse={labsByCourse}
                  progress={progressByCourse[course.id] ?? {}}
                  studentToken={savedStudentName}
                  showCourseLink={standaloneCourse?.id !== course.id}
                />
              ))}
            </div>

            <AboutAndPrivacy courseTitle={aboutCourseTitle} />
          </>
        )}
      </main>
    </div>
  );
}
