import { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { phy112Course, phy114Course, phy132Course, welcomeCourse } from '@/content/courses';
import {
  phy112CapacitorsSeriesParallelLab,
  phy112KirchhoffsRulesLab,
  phy112ResistorsSeriesParallelLab,
  phy114CapacitorsLab,
  phy114ChargeBuildupLab,
  phy114ChargesFieldsLab,
  phy114ConvergingLensLab,
  phy114CoulombsLawLab,
  phy114DcCircuitsLab,
  phy114DivergingLensLab,
  phy114GeometricOpticsLab,
  phy114OhmsLawLab,
  phy114PointChargeLab,
  phy114SnellsLawLab,
  phy114StaticElectricityLab,
  phy132CapacitorFundamentalsLab,
  phy132CapacitorNetworksLab,
  phy132CapacitorsLab,
  phy132ChargeBuildupLab,
  phy132ChargeConfigurationsLab,
  phy132ChargesFieldsLab,
  phy132CoulombsLawLab,
  phy132DcCircuitsLab,
  phy132FaradayInductionLab,
  phy132GeneratorLab,
  phy132KirchhoffsLawsLab,
  phy132MagneticFieldFaradayLab,
  phy132OhmsLawLab,
  phy132PointChargeLab,
  phy132RcCircuitsLab,
  phy132RcLowPassFilterLab,
  phy132RlcBandpassFilterLab,
  phy132RlHighPassFilterLab,
  phy132SnellsLawLab,
  phy132TheveninsTheoremLab,
  welcomeIntroLab,
} from '@/content/labs';
import type { Course, Lab } from '@/domain/schema';
import { Catalog } from '@/ui/Catalog';
import { LabPage } from '@/ui/LabPage';
import { Sims } from '@/ui/Sims';
import { PrimitivesShowcase } from '@/ui/visual/PrimitivesShowcase';

const courses: Course[] = [phy132Course, phy114Course, phy112Course, welcomeCourse];

const labsByCourse: Record<string, Record<string, Lab>> = {
  phy132: {
    chargeBuildup: phy132ChargeBuildupLab,
    coulombsLaw: phy132CoulombsLawLab,
    pointCharge: phy132PointChargeLab,
    chargeConfigurations: phy132ChargeConfigurationsLab,
    capacitorFundamentals: phy132CapacitorFundamentalsLab,
    capacitorNetworks: phy132CapacitorNetworksLab,
    ohmsLaw: phy132OhmsLawLab,
    kirchhoffsLaws: phy132KirchhoffsLawsLab,
    faradayInduction: phy132FaradayInductionLab,
    generator: phy132GeneratorLab,
    snellsLaw: phy132SnellsLawLab,
    chargesFields: phy132ChargesFieldsLab,
    capacitors: phy132CapacitorsLab,
    dcCircuits: phy132DcCircuitsLab,
    magneticFieldFaraday: phy132MagneticFieldFaradayLab,
    rcCircuits: phy132RcCircuitsLab,
    rcLowPassFilter: phy132RcLowPassFilterLab,
    rlHighPassFilter: phy132RlHighPassFilterLab,
    rlcBandpassFilter: phy132RlcBandpassFilterLab,
    theveninsTheorem: phy132TheveninsTheoremLab,
  },
  phy114: {
    // PHY-114-owned Charge Buildup copy carrying the Pass 5 parts grouping.
    chargeBuildup: phy114ChargeBuildupLab,
    // Core E&M reused from PHY 132 (no uncertainty content to strip).
    chargeConfigurations: phy132ChargeConfigurationsLab,
    capacitorFundamentals: phy132CapacitorFundamentalsLab,
    capacitorNetworks: phy132CapacitorNetworksLab,
    kirchhoffsLaws: phy132KirchhoffsLawsLab,
    // Core E&M: PHY-114-owned copies of 132 labs with uncertainty removed.
    coulombsLaw: phy114CoulombsLawLab,
    pointCharge: phy114PointChargeLab,
    ohmsLaw: phy114OhmsLawLab,
    // Optics: snellsLaw unchanged; geometricOptics split into the lens labs.
    snellsLaw: phy114SnellsLawLab,
    convergingLens: phy114ConvergingLensLab,
    divergingLens: phy114DivergingLensLab,
    // Retired source drafts (enabled:false in the manifest) kept resolvable so
    // graders can still reach in-flight records by direct URL.
    staticElectricity: phy114StaticElectricityLab,
    chargesFields: phy114ChargesFieldsLab,
    capacitors: phy114CapacitorsLab,
    dcCircuits: phy114DcCircuitsLab,
    geometricOptics: phy114GeometricOpticsLab,
  },
  phy112: {
    capacitorsSeriesParallel: phy112CapacitorsSeriesParallelLab,
    resistorsSeriesParallel: phy112ResistorsSeriesParallelLab,
    kirchhoffsRules: phy112KirchhoffsRulesLab,
  },
  welcome: {
    intro: welcomeIntroLab,
  },
};

const COURSE_STORAGE_KEY = 'labframe:course';

/**
 * Track O: pin a course for this browser when the student enters through an
 * academic course-scoped path. A `role: 'resources'` course (Getting Started)
 * never pins, so a `/c/welcome` visit leaves any existing pin untouched.
 */
function pinAcademicCourse(course: Course | undefined): void {
  if (!course || course.role === 'resources') {
    return;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COURSE_STORAGE_KEY, course.id);
    }
  } catch {
    // Ignore quota/private-mode write errors; scoping is best-effort obfuscation.
  }
}

function CoursePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === (params.courseId ?? ''));

  useEffect(() => {
    pinAcademicCourse(course);
  }, [course]);

  if (!course) {
    return <Navigate to="/" replace />;
  }

  return <Catalog courses={[course]} labsByCourse={labsByCourse} showWizard={false} />;
}

function LabRoutePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === (params.courseId ?? ''));
  const lab = labsByCourse[course?.id ?? '']?.[params.labId ?? ''];

  useEffect(() => {
    pinAcademicCourse(course);
  }, [course]);

  if (!course || !lab) {
    return <Navigate to="/" replace />;
  }

  return <LabPage key={`${course.id}-${lab.id}`} course={course} lab={lab} />;
}

function SlugLabRoutePage() {
  const params = useParams();
  const lab = labsByCourse[phy132Course.id]?.[params.slug ?? ''];

  if (!lab) {
    return <Navigate to="/" replace />;
  }

  return <LabPage key={`${phy132Course.id}-${lab.id}`} course={phy132Course} lab={lab} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Catalog courses={courses} labsByCourse={labsByCourse} showWizard />}
      />
      <Route
        path="/labs"
        element={<Catalog courses={courses} labsByCourse={labsByCourse} showWizard={false} />}
      />
      <Route path="/phy_114" element={<Navigate to="/c/phy114" replace />} />
      {/* "Just explore": outbound sim cards derived from the same manifest +
          lab registry the router uses (see docs/specs/SIMS_SPEC.md). */}
      <Route path="/sims" element={<Sims courses={courses} labsByCourse={labsByCourse} />} />
      {/* Friendly alias for the onboarding demo lab. Pass 2 adds ?tour=1 behavior. */}
      <Route
        path="/welcome"
        element={
          <LabPage
            key={`${welcomeCourse.id}-${welcomeIntroLab.id}`}
            course={welcomeCourse}
            lab={welcomeIntroLab}
          />
        }
      />
      <Route path="/c/:courseId" element={<CoursePage />} />
      <Route path="/c/:courseId/:labId" element={<LabRoutePage />} />
      <Route path="/lab/:slug" element={<SlugLabRoutePage />} />
      {import.meta.env.DEV ? (
        <Route path="/__visual/primitives" element={<PrimitivesShowcase />} />
      ) : null}
    </Routes>
  );
}
