import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { generalCourse, phy114Course } from '@/content/courses';
import { snellsLawLab } from '@/content/labs';
import type { Course, Lab } from '@/domain/schema';
import { Catalog } from '@/ui/Catalog';
import { LabPage } from '@/ui/LabPage';

const courses: Course[] = [generalCourse, phy114Course];
const labs: Record<string, Lab> = {
  snellsLaw: snellsLawLab,
};

function normalizeCourseId(raw: string): string {
  if (raw === 'phy_114') {
    return 'phy114';
  }
  return raw;
}

function CoursePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === normalizeCourseId(params.courseId ?? ''));
  if (!course) {
    return <Navigate to="/" replace />;
  }
  return <Catalog courses={[course]} />;
}

function LabRoutePage() {
  const params = useParams();
  const course = courses.find((candidate) => candidate.id === normalizeCourseId(params.courseId ?? ''));
  const lab = labs[params.labId ?? ''];

  if (!course || !lab) {
    return <Navigate to="/" replace />;
  }

  return <LabPage key={`${course.id}-${lab.id}`} course={course} lab={lab} />;
}

function SlugLabRoutePage() {
  const params = useParams();
  const lab = labs[params.slug ?? ''];
  if (!lab) {
    return <Navigate to="/" replace />;
  }
  return <LabPage key={`general-${lab.id}`} course={generalCourse} lab={lab} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Catalog courses={courses} />} />
      <Route path="/phy_114" element={<Catalog courses={[phy114Course]} />} />
      <Route path="/c/:courseId" element={<CoursePage />} />
      <Route path="/c/:courseId/:labId" element={<LabRoutePage />} />
      <Route path="/lab/:slug" element={<SlugLabRoutePage />} />
    </Routes>
  );
}
