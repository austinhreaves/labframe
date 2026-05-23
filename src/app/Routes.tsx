import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { phy112Course, phy114Course, phy132Course } from '@/content/courses';
import {
  phy112CapacitorsSeriesParallelLab,
  phy112KirchhoffsRulesLab,
  phy112ResistorsSeriesParallelLab,
  phy114CapacitorsLab,
  phy114ChargesFieldsLab,
  phy114DcCircuitsLab,
  phy114GeometricOpticsLab,
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
import type { Course, Lab } from '@/domain/schema';
import { Catalog } from '@/ui/Catalog';
import { LabPage } from '@/ui/LabPage';

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
    staticElectricity: phy114StaticElectricityLab,
    chargesFields: phy114ChargesFieldsLab,
    capacitors: phy114CapacitorsLab,
    dcCircuits: phy114DcCircuitsLab,
    snellsLaw: phy114SnellsLawLab,
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
    </Routes>
  );
}
