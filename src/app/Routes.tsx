import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { phy114Course, phy132Course } from '@/content/courses';
import {
  phy114CapacitorsLab,
  phy114ChargesFieldsLab,
  phy114DcCircuitsLab,
  phy114GeometricOpticsLab,
  phy114SnellsLawLab,
  phy114StaticElectricityLab,
  phy132CapacitorsLab,
  phy132ChargesFieldsLab,
  phy132DcCircuitsLab,
  phy132MagneticFieldFaradayLab,
  phy132SnellsLawLab,
  phy132StaticElectricityLab,
} from '@/content/labs';
import type { Course, Lab } from '@/domain/schema';
import { Catalog } from '@/ui/Catalog';
import { LabPage } from '@/ui/LabPage';

const courses: Course[] = [phy132Course, phy114Course];

const labsByCourse: Record<string, Record<string, Lab>> = {
  phy132: {
    staticElectricity: phy132StaticElectricityLab,
    chargesFields: phy132ChargesFieldsLab,
    capacitors: phy132CapacitorsLab,
    dcCircuits: phy132DcCircuitsLab,
    magneticFieldFaraday: phy132MagneticFieldFaradayLab,
    snellsLaw: phy132SnellsLawLab,
  },
  phy114: {
    staticElectricity: phy114StaticElectricityLab,
    chargesFields: phy114ChargesFieldsLab,
    capacitors: phy114CapacitorsLab,
    dcCircuits: phy114DcCircuitsLab,
    snellsLaw: phy114SnellsLawLab,
    geometricOptics: phy114GeometricOpticsLab,
  },
};

function CoursePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === (params.courseId ?? ''));

  if (!course) {
    return <Navigate to="/" replace />;
  }

  return <Catalog courses={[course]} />;
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
      <Route path="/" element={<Catalog courses={courses} />} />
      <Route path="/phy_114" element={<Navigate to="/c/phy114" replace />} />
      <Route path="/c/:courseId" element={<CoursePage />} />
      <Route path="/c/:courseId/:labId" element={<LabRoutePage />} />
      <Route path="/lab/:slug" element={<SlugLabRoutePage />} />
    </Routes>
  );
}
