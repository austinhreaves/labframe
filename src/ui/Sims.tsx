import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Course, Lab } from '@/domain/schema';
import { LogoMark } from '@/ui/catalog/HeroIllustration';
import { Icon } from '@/ui/primitives/Icon';
import { ThemeToggle } from '@/ui/ThemeToggle';

type SimsProps = {
  courses: Course[];
  labsByCourse: Record<string, Record<string, Lab>>;
};

const COURSE_STORAGE_KEY = 'labframe:course';

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

type SimCard = {
  url: string;
  simTitle: string;
  /** Every lab mapping that references this sim URL, e.g. "Lab 1 - Charge Buildup". */
  labLabels: string[];
  sortKey: number;
};

/**
 * Single source of truth: the card list is derived from the course manifest
 * plus the resolved lab objects (`Lab.simulations[*].{title, url}`), so adding
 * a simulation to a lab makes it appear here automatically. Rows are deduped
 * by URL (a sim shared across labs appears once, listing every lab it maps
 * to) and sorted by the lowest lab number that uses them.
 */
function deriveSimCards(courses: Course[], labsByCourse: Record<string, Record<string, Lab>>) {
  const byUrl = new Map<string, SimCard>();
  for (const course of courses) {
    for (const labRef of course.labs) {
      if (!labRef.enabled) {
        continue;
      }
      const lab = labsByCourse[course.id]?.[labRef.ref];
      if (!lab) {
        continue;
      }
      const labLabel =
        labRef.labNumber !== undefined ? `Lab ${labRef.labNumber} - ${lab.title}` : lab.title;
      const sortKey = labRef.labNumber ?? Number.MAX_SAFE_INTEGER;
      for (const sim of Object.values(lab.simulations)) {
        const existing = byUrl.get(sim.url);
        if (existing) {
          if (!existing.labLabels.includes(labLabel)) {
            existing.labLabels.push(labLabel);
          }
          existing.sortKey = Math.min(existing.sortKey, sortKey);
        } else {
          byUrl.set(sim.url, { url: sim.url, simTitle: sim.title, labLabels: [labLabel], sortKey });
        }
      }
    }
  }
  return [...byUrl.values()].sort((a, b) => a.sortKey - b.sortKey);
}

/**
 * The "Just explore" page: a card grid of every PhET simulation the course in
 * view draws on. Each card links straight out to the simulation in a new tab.
 * There is no recording, no worksheet, and no report here; pure exploration.
 * Scope follows the pinned course (same key the start screen uses); with no
 * pin it lists every academic course's simulations.
 */
export function Sims({ courses, labsByCourse }: SimsProps) {
  const [pinnedCourseId] = useState(() => safeStorageGet(COURSE_STORAGE_KEY));

  const scopeCourses = useMemo(() => {
    const academic = courses.filter((course) => course.role !== 'resources');
    const pinned = academic.find((course) => course.id === pinnedCourseId);
    return pinned ? [pinned] : academic;
  }, [courses, pinnedCourseId]);

  const cards = useMemo(
    () => deriveSimCards(scopeCourses, labsByCourse),
    [scopeCourses, labsByCourse],
  );

  useEffect(() => {
    document.title = 'LabFrame - Just explore';
  }, []);

  const scopeLabel = scopeCourses.length === 1 ? scopeCourses[0]!.title : 'the LabFrame courses';

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <Link to="/" className="catalog-brand">
          <LogoMark />
          <span className="catalog-brand-name">LabFrame</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="catalog sims-page">
        <Link to="/" className="sims-back">
          <Icon icon={ArrowLeft} size={16} />
          Back to labs
        </Link>
        <h1 className="sims-title">Just explore</h1>
        <p className="sims-lead">
          Every simulation {scopeLabel} draws on, in one place. Open one and play around; there is
          no worksheet here and nothing is recorded. Each link opens the simulation on its original
          open-source host in a new tab.
        </p>
        {cards.length > 0 ? (
          <ul className="sims-grid">
            {cards.map((card) => (
              <li key={card.url}>
                <a className="sims-card" href={card.url} target="_blank" rel="noopener noreferrer">
                  <span className="sims-card-thumb" aria-hidden="true">
                    <LogoMark size={28} />
                  </span>
                  <span className="sims-card-body">
                    <span className="sims-card-title">
                      {card.simTitle}
                      <Icon icon={ExternalLink} size={14} className="sims-card-external" />
                    </span>
                    <span className="sims-card-labs">{card.labLabels.join(' · ')}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sims-empty">No simulations are available yet for this course.</p>
        )}
      </main>
    </div>
  );
}
