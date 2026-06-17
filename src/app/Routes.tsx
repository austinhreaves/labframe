import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { phy112Course, phy114Course, phy132Course } from '@/content/courses';
import {
  phy112CapacitorsSeriesParallelLab,
  phy112KirchhoffsRulesLab,
  phy112ResistorsSeriesParallelLab,
  phy114CapacitorsLab,
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
} from '@/content/labs';
import type { Course, Lab, LabDoc } from '@/domain/schema';
import { compileLabDoc, loadUntrustedLabDoc } from '@/services/authoring';
import { IMPORTED_COURSE_ID, loadImportedLabText } from '@/state/importedLabs';
import { Catalog } from '@/ui/Catalog';
import { LabPage } from '@/ui/LabPage';
import { PrimitivesShowcase } from '@/ui/visual/PrimitivesShowcase';

// Code-split: students never download the authoring bundle.
const AuthorPage = lazy(() => import('@/ui/author/AuthorPage'));

const courses: Course[] = [phy132Course, phy114Course, phy112Course];

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
    // Core E&M reused from PHY 132 (no uncertainty content to strip).
    chargeBuildup: phy132ChargeBuildupLab,
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
};

function CoursePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === (params.courseId ?? ''));

  if (!course) {
    return <Navigate to="/" replace />;
  }

  return <Catalog courses={[course]} labsByCourse={labsByCourse} showWizard={false} />;
}

function LabRoutePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === (params.courseId ?? ''));
  const lab = labsByCourse[course?.id ?? '']?.[params.labId ?? ''];

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

type ImportedLabView = {
  course: Course;
  lab: Lab;
  source: { labHash: string; labDoc: LabDoc };
};

function ImportedLabRoutePage() {
  const params = useParams();
  const hash = params.hash ?? '';
  const [view, setView] = useState<ImportedLabView | 'loading' | 'notfound'>('loading');

  useEffect(() => {
    let cancelled = false;
    setView('loading');
    void (async () => {
      const text = await loadImportedLabText(hash);
      if (cancelled) return;
      if (!text) {
        setView('notfound');
        return;
      }
      const result = await loadUntrustedLabDoc(text);
      if (cancelled) return;
      // Storage is user-controlled, so re-validate and confirm the bytes still
      // hash to the requested identity before rendering.
      if (!result.ok || result.labHash !== hash) {
        setView('notfound');
        return;
      }
      const compiled = compileLabDoc(result.doc);
      const course: Course = {
        id: IMPORTED_COURSE_ID,
        title: result.doc.meta.title,
        storagePrefix: IMPORTED_COURSE_ID,
        parentOriginAllowList: [],
        labs: [{ ref: hash, enabled: true }],
      };
      // Identity is the content hash: key persistence by it, not the slug.
      setView({
        course,
        lab: { ...compiled.lab, id: hash },
        source: { labHash: hash, labDoc: result.doc },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [hash]);

  if (view === 'loading') {
    return <div className="catalog-page" aria-busy="true" />;
  }
  if (view === 'notfound') {
    return <Navigate to="/" replace />;
  }

  return (
    <LabPage
      key={`imported-${hash}`}
      course={view.course}
      lab={view.lab}
      importedSource={view.source}
    />
  );
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
      <Route path="/c/:courseId" element={<CoursePage />} />
      <Route path="/c/:courseId/:labId" element={<LabRoutePage />} />
      <Route path="/lab/:slug" element={<SlugLabRoutePage />} />
      <Route path="/i/:hash" element={<ImportedLabRoutePage />} />
      <Route
        path="/author"
        element={
          <Suspense fallback={<div className="catalog-page" aria-busy="true" />}>
            <AuthorPage />
          </Suspense>
        }
      />
      <Route
        path="/author/:hash"
        element={
          <Suspense fallback={<div className="catalog-page" aria-busy="true" />}>
            <AuthorPage />
          </Suspense>
        }
      />
      {import.meta.env.DEV ? (
        <Route path="/__visual/primitives" element={<PrimitivesShowcase />} />
      ) : null}
    </Routes>
  );
}
