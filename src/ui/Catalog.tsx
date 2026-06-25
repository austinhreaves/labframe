import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Driver } from 'driver.js';

import type { Course, CourseLabRef, Lab } from '@/domain/schema';
import { HeroIllustration, LogoMark } from '@/ui/catalog/HeroIllustration';
import { Button } from '@/ui/primitives/Button';
import { Icon } from '@/ui/primitives/Icon';
import { ThemeToggle } from '@/ui/ThemeToggle';
import { driver, isOnboarded, setOnboarded } from '@/ui/tour/welcomeTour';

type CatalogProps = {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
  showWizard: boolean;
};

type WizardStep = 'name' | 'course' | 'lab';

const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';
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

function normalizeStep(value: string | null): WizardStep {
  if (value === 'course' || value === 'lab') {
    return value;
  }
  return 'name';
}

function labDisplayLabel(labRef: CourseLabRef, lab: Lab | undefined): string {
  const title = lab?.title ?? labRef.ref;
  return labRef.labNumber !== undefined ? `Lab ${labRef.labNumber}: ${title}` : title;
}

function courseMetaLabel(course: Course): string {
  const enabled = course.labs.filter((labRef) => labRef.enabled);
  const core = enabled.filter((labRef) => (labRef.group ?? 'core') === 'core').length;
  const enrichment = enabled.filter((labRef) => labRef.group === 'enrichment').length;
  const comingSoon = course.labs.length - enabled.length;
  const parts: string[] = [];
  if (core > 0) {
    parts.push(enrichment > 0 ? `${core} core` : `${core} ${core === 1 ? 'lab' : 'labs'}`);
  }
  if (enrichment > 0) {
    parts.push(`${enrichment} enrichment`);
  }
  if (comingSoon > 0) {
    parts.push(`${comingSoon} coming soon`);
  }
  return parts.join(' · ');
}

function LabCard({
  course,
  labRef,
  lab,
}: {
  course: Course;
  labRef: CourseLabRef;
  lab: Lab | undefined;
}) {
  const title = lab?.title ?? labRef.ref;
  const pill =
    labRef.labNumber !== undefined
      ? `Lab ${labRef.labNumber}`
      : labRef.group === 'enrichment'
        ? 'Enrichment'
        : null;

  if (!labRef.enabled) {
    return (
      <div className="lab-card" data-disabled="true" aria-disabled="true">
        <span className="lab-card-top">
          {pill ? <span className="lab-card-pill">{pill}</span> : null}
          <span className="lab-card-soon">Coming soon</span>
        </span>
        <span className="lab-card-title">{title}</span>
      </div>
    );
  }

  return (
    <Link
      className="lab-card"
      to={`/c/${course.id}/${labRef.ref}`}
      aria-label={labDisplayLabel(labRef, lab)}
    >
      <span className="lab-card-top">
        {pill ? <span className="lab-card-pill">{pill}</span> : null}
        <Icon icon={ChevronRight} size={16} className="lab-card-chevron" />
      </span>
      <span className="lab-card-title">{title}</span>
    </Link>
  );
}

function CourseSection({
  course,
  labsByCourse,
  standalone,
}: {
  course: Course;
  labsByCourse: Record<string, Record<string, Lab>>;
  standalone: boolean;
}) {
  const coreLabs = course.labs.filter((labRef) => (labRef.group ?? 'core') === 'core');
  const enrichmentLabs = course.labs.filter((labRef) => labRef.group === 'enrichment');
  const hasEnrichment = enrichmentLabs.length > 0;
  // Keep heading order intact: standalone course pages have no h2 course
  // header, so the group subheads step up a level.
  const Subhead = standalone ? 'h2' : 'h3';

  const renderGrid = (labRefs: CourseLabRef[]) => (
    <ul className="catalog-lab-grid">
      {labRefs.map((labRef) => (
        <li key={`${course.id}-${labRef.ref}`}>
          <LabCard course={course} labRef={labRef} lab={labsByCourse[course.id]?.[labRef.ref]} />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="catalog-course" aria-label={course.title}>
      {!standalone ? (
        <header className="catalog-course-header">
          <h2 className="catalog-course-title">{course.title}</h2>
          <p className="catalog-course-meta">{courseMetaLabel(course)}</p>
          <Link className="catalog-course-link" to={`/c/${course.id}`}>
            Course page
            <Icon icon={ChevronRight} size={14} />
          </Link>
        </header>
      ) : null}
      {coreLabs.length > 0 ? (
        <>
          {hasEnrichment ? <Subhead className="catalog-course-subhead">Core labs</Subhead> : null}
          {renderGrid(coreLabs)}
        </>
      ) : null}
      {hasEnrichment ? (
        <>
          <Subhead className="catalog-course-subhead">Enrichment labs</Subhead>
          {renderGrid(enrichmentLabs)}
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
          access code, or a lab kit. I chose to build LabFrame on open simulations and an in-house
          platform for a reason: commercial lab platforms tend to gate basic functionality behind
          paywalls, send student interaction data to third-party vendors, and constrain courses to
          whatever pedagogy fits a publisher&apos;s product. Working with open tools lets the course
          evolve in response to what is actually working for the students taking it.
        </p>
        <p>
          I currently develop and maintain LabFrame on my own, which has one nice side effect: bug
          fixes and improvements can ship the same week they are reported. If something in LabFrame
          is buggy, confusing, or getting in the way of the physics, please let me know so I can fix
          it. Instructor contact information is in the course syllabus.
        </p>
      </Disclosure>
      <Disclosure title="Your data and FERPA">
        <p>
          I designed LabFrame to keep your work on your device while you do it. Your name, your
          in-progress lab responses, your data tables, your fit selections, and any images you
          attach are stored in this browser&apos;s local storage. While you are working through a
          lab, nothing is transmitted to a LabFrame server, and no third-party analytics or vendor
          data harvesting is involved. The interactive simulations themselves load from their
          original open-source hosts (PhET, Open Source Physics, and similar projects) via embedded
          frames.
        </p>
        <p>
          When you click Export PDF, the file you generate contains your worksheet responses, data
          tables, plots, and a process-record appendix. You submit that PDF to Canvas yourself;
          LabFrame does not separately transmit your work to anyone. Course instructors and TAs see
          your submission through the normal Canvas grading workflow. The process-record appendix is
          described in detail in the course syllabus.
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

function WizardSteps({ step, hideCourseStep }: { step: WizardStep; hideCourseStep: boolean }) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'name', label: 'Name' },
    ...(hideCourseStep ? [] : [{ id: 'course' as WizardStep, label: 'Course' }]),
    { id: 'lab', label: 'Lab' },
  ];
  const activeIndex = steps.findIndex((entry) => entry.id === step);
  return (
    <ol className="wizard-steps" aria-label="Setup progress">
      {steps.map((entry, index) => (
        <li
          key={entry.id}
          data-active={entry.id === step || undefined}
          data-done={index < activeIndex || undefined}
          aria-current={entry.id === step ? 'step' : undefined}
        >
          <span className="wizard-step-num">{index + 1}</span>
          {entry.label}
        </li>
      ))}
    </ol>
  );
}

export function Catalog({ courses, labsByCourse, showWizard }: CatalogProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [nameDraft, setNameDraft] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [pinnedCourseId, setPinnedCourseId] = useState<string | null>(null);

  // Track S: first-run splash + Phase A tour driver. The splash only appears on
  // the student root (`/`, where the wizard shows) for a not-yet-onboarded
  // student; it replaces the hero + wizard + catalog until they start or skip.
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

  // Scoping only applies to the student root (`/`, which renders the wizard).
  // The unlinked `/labs` staff index and single-course `/c/:courseId` pages are
  // left untouched.
  const scoped = showWizard && pinnedCourse !== null;
  const displayCourses = scoped ? [pinnedCourse, ...resourcesCourses] : courses;

  const rawStep = showWizard ? normalizeStep(searchParams.get('step')) : 'name';
  // When scoped, the wizard collapses to name -> lab; coerce a stale course step.
  const step: WizardStep = scoped && rawStep === 'course' ? 'lab' : rawStep;

  const selectedCourse = useMemo(() => {
    if (scoped) {
      return pinnedCourse;
    }
    return academicCourses.find((course) => course.id === selectedCourseId) ?? null;
  }, [scoped, pinnedCourse, academicCourses, selectedCourseId]);
  const enabledLabs = useMemo(
    () => (selectedCourse ? selectedCourse.labs.filter((labRef) => labRef.enabled) : []),
    [selectedCourse],
  );

  const standaloneCourse = !showWizard && courses.length === 1 ? courses[0] : null;
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

  useEffect(() => {
    const storedName = safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '';
    if (storedName) {
      setNameDraft(storedName);
      if (showWizard) {
        const next = new URLSearchParams(searchParams);
        if (!next.get('step')) {
          next.set('step', 'name');
          setSearchParams(next, { replace: true });
        }
      }
    }
  }, [searchParams, setSearchParams, showWizard]);

  const saveName = () => {
    const value = nameDraft.trim();
    if (!value) {
      return false;
    }
    safeStorageSet(STUDENT_NAME_STORAGE_KEY, value);
    return true;
  };

  const goToStep = (nextStep: WizardStep) => {
    const next = new URLSearchParams(searchParams);
    next.set('step', nextStep);
    setSearchParams(next);
  };

  const skipTutorial = () => {
    setOnboarded();
    setOnboardedState(true);
  };

  const pickTourCourse = (courseId: string) => {
    safeStorageSet(COURSE_STORAGE_KEY, courseId);
    setPinnedCourseId(courseId);
    setSelectedCourseId(courseId);
    phaseADriverRef.current?.moveNext();
  };

  // Phase A driver: starts when the tour panel is revealed (Get Started). The
  // course-picker and name anchors must exist first, so we start after the
  // panel mounts. On normal finish it navigates to the demo lab with ?tour=1;
  // an Esc / overlay dismiss instead marks the student onboarded and drops them
  // into the scoped catalog.
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
              </div>
            )}
          </section>
        ) : (
          <>
            {standaloneCourse ? (
              <section className="catalog-hero catalog-hero-compact">
                <div className="catalog-hero-copy">
                  <p className="catalog-hero-eyebrow">
                    <Link to="/labs">All courses</Link>
                  </p>
                  <h1 className="catalog-hero-title">{standaloneCourse.title}</h1>
                  <p className="catalog-hero-description">{courseMetaLabel(standaloneCourse)}</p>
                </div>
              </section>
            ) : (
              <section className="catalog-hero">
                <div className="catalog-hero-copy">
                  <h1 className="catalog-hero-title">Interactive physics labs</h1>
                  <p className="catalog-hero-description">
                    Run the simulation, record your data, and export a signed report. Built for ASU
                    online physics. No account, no install, no textbook.
                  </p>
                  <ul className="catalog-hero-courses" aria-label="Courses">
                    {(scoped ? [pinnedCourse] : academicCourses).map((course) => (
                      <li key={course.id}>
                        <Link className="catalog-hero-course-chip" to={`/c/${course.id}`}>
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="catalog-hero-figure">
                  <HeroIllustration />
                </div>
              </section>
            )}

            {showWizard ? (
              <section className="catalog-wizard" aria-labelledby="catalog-wizard-heading">
                <div className="catalog-wizard-head">
                  <h2 id="catalog-wizard-heading">Start a lab</h2>
                  <WizardSteps step={step} hideCourseStep={scoped} />
                </div>
                {step === 'name' ? (
                  <div className="catalog-wizard-step">
                    <label className="field">
                      <span className="field-label">Enter your name</span>
                      <input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.currentTarget.value)}
                        aria-label="Student name"
                        autoComplete="name"
                        placeholder="Full name, as it should appear on your report"
                      />
                    </label>
                    <p className="catalog-ferpa-note">
                      Your name is saved only in this browser. See the privacy section below for
                      details.
                    </p>
                    <div className="catalog-wizard-actions">
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!nameDraft.trim()}
                        onClick={() => {
                          if (saveName()) {
                            goToStep(scoped ? 'lab' : 'course');
                          }
                        }}
                        trailingIcon={<Icon icon={ChevronRight} size={16} />}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : null}
                {step === 'course' && !scoped ? (
                  <div className="catalog-wizard-step">
                    <h3>Select a course</h3>
                    <ul className="catalog-wizard-cards">
                      {academicCourses.map((course) => (
                        <li key={course.id}>
                          <button
                            type="button"
                            className="catalog-wizard-card"
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              // Track O: picking a course pins it for this browser.
                              safeStorageSet(COURSE_STORAGE_KEY, course.id);
                              setPinnedCourseId(course.id);
                              goToStep('lab');
                            }}
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
                    <div className="catalog-wizard-actions">
                      <Button variant="ghost" size="md" onClick={() => goToStep('name')}>
                        Back
                      </Button>
                    </div>
                  </div>
                ) : null}
                {step === 'lab' ? (
                  <div className="catalog-wizard-step">
                    <h3>Select a lab</h3>
                    {selectedCourse ? (
                      enabledLabs.length > 0 ? (
                        <ul className="catalog-wizard-cards">
                          {enabledLabs.map((labRef) => {
                            const lab = labsByCourse[selectedCourse.id]?.[labRef.ref];
                            const cachedName =
                              safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '';
                            const studentToken = cachedName || nameDraft.trim();
                            return (
                              <li key={`${selectedCourse.id}-${labRef.ref}`}>
                                <Link
                                  className="catalog-wizard-card"
                                  aria-label={labDisplayLabel(labRef, lab)}
                                  to={`/c/${selectedCourse.id}/${labRef.ref}?student=${encodeURIComponent(studentToken)}`}
                                >
                                  <span className="catalog-wizard-card-text">
                                    {labRef.labNumber !== undefined ? (
                                      <span className="lab-card-pill">Lab {labRef.labNumber}</span>
                                    ) : labRef.group === 'enrichment' ? (
                                      <span className="lab-card-pill">Enrichment</span>
                                    ) : null}
                                    <span className="catalog-wizard-card-title">
                                      {lab?.title ?? labRef.ref}
                                    </span>
                                  </span>
                                  <Icon
                                    icon={ChevronRight}
                                    size={16}
                                    className="catalog-wizard-card-chevron"
                                  />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="catalog-empty">No labs available yet for this course.</p>
                      )
                    ) : (
                      <p className="catalog-empty">Select a course first.</p>
                    )}
                    <div className="catalog-wizard-actions">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => goToStep(scoped ? 'name' : 'course')}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="catalog-courses">
              {displayCourses.map((course) => (
                <CourseSection
                  key={course.id}
                  course={course}
                  labsByCourse={labsByCourse}
                  standalone={standaloneCourse?.id === course.id}
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
