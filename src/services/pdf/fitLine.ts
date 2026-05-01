export type LineSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type LineBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type FitLineArgs = {
  minX: number;
  maxX: number;
  a: number;
  b: number;
  mapX: (x: number) => number;
  mapY: (y: number) => number;
  plotBounds: LineBounds;
};

function clipLineToRect(segment: LineSegment, bounds: LineBounds): LineSegment | null {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const edges = [
    { p: -dx, q: segment.x1 - bounds.minX },
    { p: dx, q: bounds.maxX - segment.x1 },
    { p: -dy, q: segment.y1 - bounds.minY },
    { p: dy, q: bounds.maxY - segment.y1 },
  ];

  let t0 = 0;
  let t1 = 1;

  for (const edge of edges) {
    if (edge.p === 0) {
      if (edge.q < 0) {
        return null;
      }
      continue;
    }
    const t = edge.q / edge.p;
    if (edge.p < 0) {
      t0 = Math.max(t0, t);
    } else {
      t1 = Math.min(t1, t);
    }
    if (t0 > t1) {
      return null;
    }
  }

  return {
    x1: segment.x1 + t0 * dx,
    y1: segment.y1 + t0 * dy,
    x2: segment.x1 + t1 * dx,
    y2: segment.y1 + t1 * dy,
  };
}

export function computeClippedFitLineInPdfSvg(args: FitLineArgs): LineSegment | null {
  const raw = {
    x1: args.mapX(args.minX),
    y1: args.mapY(args.a * args.minX + args.b),
    x2: args.mapX(args.maxX),
    y2: args.mapY(args.a * args.maxX + args.b),
  };
  return clipLineToRect(raw, args.plotBounds);
}
