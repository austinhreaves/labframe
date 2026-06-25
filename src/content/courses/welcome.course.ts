import type { Course } from '@/domain/schema';

// The "Getting Started" course is a real course (it resolves at /c/welcome) but
// carries role: 'resources', so Track O never pins it, never offers it in the
// course picker, and always shows it alongside the student's pinned academic
// course. It is the home for the onboarding demo lab today and tutorials later.
export const welcomeCourse: Course = {
  id: 'welcome',
  title: 'Getting Started',
  role: 'resources',
  storagePrefix: 'welcome',
  parentOriginAllowList: [],
  labs: [{ ref: 'intro', enabled: true }],
};
