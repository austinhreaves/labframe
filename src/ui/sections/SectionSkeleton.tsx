export function SectionSkeleton() {
  return (
    <section className="section section-skeleton" aria-hidden="true">
      <div className="section-skeleton-line section-skeleton-line-short" />
      <div className="section-skeleton-line" />
      <div className="section-skeleton-line section-skeleton-line-long" />
    </section>
  );
}
