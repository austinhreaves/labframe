import { formatPointsLabel } from '@/domain/pointsFormatting';

type Props = {
  points: number | undefined;
};

/** Renders `({N} points)` when `points` is defined (including 0). */
export function SectionPointsCaption({ points }: Props) {
  if (points === undefined) {
    return null;
  }
  return (
    <p className="section-points-caption">
      ({formatPointsLabel(points)} points)
    </p>
  );
}
