import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { Course, Lab } from '@/domain/schema';
import { AccessibleDialog } from '@/ui/AccessibleDialog';

type CatalogProps = {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
  showWizard: boolean;
};

type WizardStep = 'name' | 'course' | 'lab';

const STUDENT_NAME_STORAGE_KEY = 'labframe:student-name';
const FERPA_DISMISSED_STORAGE_KEY = 'labframe:ferpa-popover-dismissed';

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

function CatalogList({ courses }: { courses: Course[] }) {
  return (
    <>
      {courses.map((course) => (
        <section key={course.id}>
          <h2>{course.title}</h2>
          <ul>
            {course.labs.map((lab) => (
              <li key={`${course.id}-${lab.ref}`}>
                {lab.enabled ? (
                  <Link to={`/c/${course.id}/${lab.ref}`}>
                    Lab {lab.labNumber}: {lab.ref}
                  </Link>
                ) : (
                  <span className="catalog-lab--disabled">
                    Lab {lab.labNumber}: {lab.ref} (coming soon)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function Catalog({ courses, labsByCourse, showWizard }: CatalogProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nameDraft, setNameDraft] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isFerpaDialogOpen, setIsFerpaDialogOpen] = useState(false);

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

  const ferpaDismissed = safeStorageGet(FERPA_DISMISSED_STORAGE_KEY) === '1';
  const hasStoredName = Boolean(safeStorageGet(STUDENT_NAME_STORAGE_KEY)?.trim());

  return (
    <main className="catalog">
      <h1>LabFrame</h1>
      <h2 className="catalog-tagline">Interactive Physics Labs</h2>
      {showWizard ? (
        <>
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
                Your name is saved only in this browser.
                <button
                  type="button"
                  onClick={() => {
                    setIsFerpaDialogOpen(true);
                    if (!ferpaDismissed) {
                      safeStorageSet(FERPA_DISMISSED_STORAGE_KEY, '1');
                    }
                  }}
                >
                  FERPA details
                </button>
              </p>
              <AccessibleDialog open={isFerpaDialogOpen} title="FERPA and local storage" onClose={() => setIsFerpaDialogOpen(false)}>
                <p className="catalog-ferpa-detail">
                  LabFrame stores your name and draft work in local browser storage on this device. Do not use a shared computer unless you
                  clear saved data after your session.
                </p>
              </AccessibleDialog>
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
                          Lab {labRef.labNumber}: {lab?.title ?? labRef.ref}
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
          <CatalogList courses={courses} />
        </>
      ) : (
        <CatalogList courses={courses} />
      )}
    </main>
  );
}
