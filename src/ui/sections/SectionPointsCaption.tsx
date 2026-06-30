import { formatPointsLabel } from '@/domain/pointsFormatting';

type Props = {
  points: number | undefined;
};

/** Renders an inline `{N} pt` point pill when `points` is defined (including 0). */
export function SectionPointsCaption({ points }: Props) {
  if (points === undefined) {
    return null;
  }
  return <span className="section-points-pill">{formatPointsLabel(points)} pt</span>;
}
