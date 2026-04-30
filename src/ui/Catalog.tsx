import { Link } from 'react-router-dom';

import type { Course } from '@/domain/schema';

type CatalogProps = {
  courses: Course[];
};

export function Catalog({ courses }: CatalogProps) {
  return (
    <main className="catalog">
      <h1>Interactive Physics Labs</h1>
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
    </main>
  );
}
