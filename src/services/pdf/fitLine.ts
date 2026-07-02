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

type FitCurveArgs = {
  minX: number;
  maxX: number;
  evalY: (x: number) => number;
  samples?: number;
  mapX: (x: number) => number;
  mapY: (y: number) => number;
  plotBounds: LineBounds;
};

/**
 * Sampled polyline for a nonlinear fit curve, clipped to the plot box. Each
 * consecutive sample pair becomes a segment run through the same Liang-Barsky
 * clip as the straight fit line, so the curve can exit and re-enter the box
 * (a peaked curve taller than the y range renders as two runs with a gap).
 * Segments with a non-finite endpoint (model undefined at that x) are skipped.
 */
export function computeClippedFitCurveInPdfSvg(args: FitCurveArgs): LineSegment[] {
  const samples = args.samples ?? 60;
  const segments: LineSegment[] = [];
  let prev: { px: number; py: number } | null = null;
  for (let i = 0; i < samples; i += 1) {
    const x = args.minX + ((args.maxX - args.minX) * i) / (samples - 1);
    const y = args.evalY(x);
    const px = args.mapX(x);
    const py = args.mapY(y);
    const finite = Number.isFinite(px) && Number.isFinite(py);
    if (prev && finite) {
      const clipped = clipLineToRect({ x1: prev.px, y1: prev.py, x2: px, y2: py }, args.plotBounds);
      if (clipped) {
        segments.push(clipped);
      }
    }
    prev = finite ? { px, py } : null;
  }
  return segments;
}
