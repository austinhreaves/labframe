import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { Course, CourseLabRef, Lab } from '@/domain/schema';

type CatalogProps = {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
  showWizard: boolean;
};

type WizardStep = 'name' | 'course' | 'lab';

const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';

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

function CatalogList({
  courses,
  labsByCourse,
}: {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
}) {
  const renderLabItem = (course: Course, labRef: CourseLabRef) => {
    const lab = labsByCourse[course.id]?.[labRef.ref];
    const label = labDisplayLabel(labRef, lab);
    return (
      <li key={`${course.id}-${labRef.ref}`}>
        {labRef.enabled ? (
          <Link to={`/c/${course.id}/${labRef.ref}`}>{label}</Link>
        ) : (
          <span className="catalog-lab--disabled">{label} (coming soon)</span>
        )}
      </li>
    );
  };

  return (
    <>
      {courses.map((course) => {
        const coreLabs = course.labs.filter((lab) => (lab.group ?? 'core') === 'core');
        const enrichmentLabs = course.labs.filter((lab) => lab.group === 'enrichment');
        const hasEnrichment = enrichmentLabs.length > 0;
        return (
          <section key={course.id}>
            <h2>{course.title}</h2>
            {coreLabs.length > 0 ? (
              <>
                {hasEnrichment ? <h3>Core labs</h3> : null}
                <ul>{coreLabs.map((lab) => renderLabItem(course, lab))}</ul>
              </>
            ) : null}
            {hasEnrichment ? (
              <>
                <h3>Enrichment labs</h3>
                <ul>{enrichmentLabs.map((lab) => renderLabItem(course, lab))}</ul>
              </>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

function AboutAndPrivacy() {
  return (
    <>
      <section className="catalog-about" aria-labelledby="catalog-about-heading">
        <h2 id="catalog-about-heading">About LabFrame</h2>
        <p>
          LabFrame is the browser-based lab environment for PHY 132 at Arizona State University.
          There is no account to create and nothing to install. You follow a link from Canvas,
          select your lab, and work through it on a single page that holds the simulation, the
          prompts, the data tables, and the plots together. When you are done, you export a PDF and
          submit that PDF to the corresponding Canvas assignment.
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
      </section>
      <section className="catalog-privacy" aria-labelledby="catalog-privacy-heading">
        <h2 id="catalog-privacy-heading">Your data and FERPA</h2>
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
      </section>
    </>
  );
}

export function Catalog({ courses, labsByCourse, showWizard }: CatalogProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nameDraft, setNameDraft] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const step = showWizard ? normalizeStep(searchParams.get('step')) : 'name';
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );
  const enabledLabs = useMemo(
    () => (selectedCourse ? selectedCourse.labs.filter((labRef) => labRef.enabled) : []),
    [selectedCourse],
  );

  useEffect(() => {
    document.title = 'LabFrame';
  }, []);

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

  const hasStoredName = Boolean(safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim());

  return (
    <main className="catalog">
      <h1>LabFrame</h1>
      <h2 className="catalog-tagline">Interactive Physics Labs</h2>
      {showWizard ? (
        <section className="catalog-wizard">
          <h2>Get started</h2>
          {step === 'name' ? (
            <div className="catalog-wizard-step">
              <label className="field">
                <span className="field-label">Enter your name</span>
                <input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.currentTarget.value)}
                  aria-label="Student name"
                  autoComplete="name"
                />
              </label>
              <p className="catalog-ferpa-note">
                Your name is saved only in this browser. See the privacy section below for details.
              </p>
              <div className="catalog-wizard-actions">
                {nameDraft.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (saveName()) {
                        goToStep('course');
                      }
                    }}
                  >
                    Continue
                  </button>
                ) : null}
                {nameDraft.trim() && hasStoredName ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (saveName()) {
                        goToStep('course');
                      }
                    }}
                  >
                    Skip to course selection
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {step === 'course' ? (
            <div className="catalog-wizard-step">
              <h3>Select a course</h3>
              <ul>
                {courses.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        goToStep('lab');
                      }}
                    >
                      {course.title}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => goToStep('name')}>
                Back
              </button>
            </div>
          ) : null}
          {step === 'lab' ? (
            <div className="catalog-wizard-step">
              <h3>Select a lab</h3>
              {selectedCourse ? (
                <ul>
                  {enabledLabs.map((labRef) => {
                    const lab = labsByCourse[selectedCourse.id]?.[labRef.ref];
                    const cachedName = safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim() ?? '';
                    const studentToken = cachedName || nameDraft.trim();
                    return (
                      <li key={`${selectedCourse.id}-${labRef.ref}`}>
                        <Link
                          to={`/c/${selectedCourse.id}/${labRef.ref}?student=${encodeURIComponent(studentToken)}`}
                        >
                          {labDisplayLabel(labRef, lab)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Select a course first.</p>
              )}
              <button type="button" onClick={() => goToStep('course')}>
                Back
              </button>
            </div>
          ) : null}
          <p>
            <Link to="/labs">Browse all labs</Link>
          </p>
        </section>
      ) : null}
      <CatalogList courses={courses} labsByCourse={labsByCourse} />
      <AboutAndPrivacy />
    </main>
  );
}
