/**
 * Shared free-draw stroke model for the calculation "draw" response mode.
 *
 * Strokes are stored in a fixed logical page space (A4 portrait,
 * DRAW_PAGE_WIDTH x DRAW_PAGE_HEIGHT units), independent of how large the canvas
 * is displayed. The live canvas maps display pixels to logical units on input
 * and back on render; the PDF rasterizer renders the same logical units at an
 * export resolution. This keeps a drawing identical inline, fullscreen, and in
 * the exported PDF, and is the basis for resizing and multi-page work.
 */

export type DrawPoint = { x: number; y: number; pressure: number };

/** One pen-down to pen-up stroke. `width` is the base width in logical units
 *  (thin/thick); each point carries its own pressure, applied at render time. */
export type DrawStroke = { color: string; width: number; points: DrawPoint[] };

/** A single logical page of strokes. */
export type DrawPage = { strokes: DrawStroke[] };

/** Serialized drawing stored in `FieldValue.text` under the draw key. An ordered
 *  list of pages, each in logical page units; the student can add pages to show
 *  longer work, and each page exports as its own image so the PDF paginates. */
export type DrawDrawing = {
  version: 3;
  pages: DrawPage[];
};

export function emptyDrawing(): DrawDrawing {
  return { version: 3, pages: [{ strokes: [] }] };
}

/** Logical page dimensions (A4 portrait ratio ~= 1.414). All stroke coordinates
 *  and widths live in this space. */
export const DRAW_PAGE_WIDTH = 1000;
export const DRAW_PAGE_HEIGHT = 1414;

/** Stroke base widths in logical units, sized for the logical page so they scale
 *  proportionally with the displayed canvas. */
export const DRAW_WIDTH_THIN = 3.5;
export const DRAW_WIDTH_THICK = 8;

/** Preset stroke colors. The first (near-black ink) is the default. */
export const DRAW_COLORS = ['#111827', '#2563eb', '#dc2626', '#16a34a'] as const;

export function serializeDrawing(drawing: DrawDrawing): string {
  return JSON.stringify(drawing);
}

type LegacyDrawDocument = {
  version?: number;
  width?: number;
  height?: number;
  strokes?: DrawStroke[];
  pages?: DrawPage[];
};

/** Scale a v1 (pixel-space) stroke into the logical page space. v1 only ever
 *  existed on this branch, so this best-effort conversion just keeps any local
 *  test drawings from vanishing; aspect distortion is acceptable. */
function upconvertLegacyStroke(stroke: DrawStroke, width: number, height: number): DrawStroke {
  const sx = DRAW_PAGE_WIDTH / width;
  const sy = DRAW_PAGE_HEIGHT / height;
  return {
    color: stroke.color,
    width: stroke.width * sx,
    points: stroke.points.map((p) => ({ x: p.x * sx, y: p.y * sy, pressure: p.pressure })),
  };
}

export function parseDrawing(text: string | undefined | null): DrawDrawing | null {
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text) as LegacyDrawDocument;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    // v3: ordered pages.
    if (parsed.version === 3) {
      if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
        return null;
      }
      const pages = parsed.pages
        .filter((page) => page && Array.isArray(page.strokes))
        .map((page) => ({ strokes: page.strokes }));
      return pages.length > 0 ? { version: 3, pages } : null;
    }
    // v1 / v2: a single page of strokes. v1 also carried pixel dimensions.
    if (!Array.isArray(parsed.strokes)) {
      return null;
    }
    const width = typeof parsed.width === 'number' && parsed.width > 0 ? parsed.width : 0;
    const height = typeof parsed.height === 'number' && parsed.height > 0 ? parsed.height : 0;
    const strokes =
      width > 0 && height > 0
        ? parsed.strokes.map((stroke) => upconvertLegacyStroke(stroke, width, height))
        : parsed.strokes;
    return { version: 3, pages: [{ strokes }] };
  } catch {
    return null;
  }
}

/**
 * Effective line width for a point. Pen pressure (0..1) modulates around the
 * base width; a pressure of 0 (mouse with no pressure, plain touch, or a device
 * that does not report it) falls back to the constant base width.
 */
export function effectiveLineWidth(base: number, pressure: number): number {
  if (pressure > 0) {
    return base * (0.5 + pressure);
  }
  return base;
}

type StrokeContext = Pick<
  CanvasRenderingContext2D,
  'beginPath' | 'moveTo' | 'lineTo' | 'stroke' | 'arc' | 'fill'
> & {
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  lineWidth: number;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
};

/** Replay strokes onto a 2D context whose transform already maps logical units
 *  to the target pixels. Used by both the live canvas and the rasterizer. */
export function drawStrokesToContext(ctx: StrokeContext, strokes: DrawStroke[]): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    const points = stroke.points;
    if (points.length === 0) {
      continue;
    }
    if (points.length === 1) {
      const point = points[0]!;
      ctx.beginPath();
      ctx.fillStyle = stroke.color;
      ctx.arc(point.x, point.y, effectiveLineWidth(stroke.width, point.pressure) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.strokeStyle = stroke.color;
    for (let i = 1; i < points.length; i += 1) {
      const from = points[i - 1]!;
      const to = points[i]!;
      ctx.beginPath();
      ctx.lineWidth = effectiveLineWidth(stroke.width, to.pressure);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
}

/**
 * Rasterize a single page to a PNG data URL on an offscreen logical-size canvas,
 * for embedding in the exported PDF. Returns null when the page is empty or no
 * canvas is available (e.g. a non-browser environment). `scale` oversamples for
 * a crisper PNG in the A4-sized PDF.
 */
export function rasterizePageToDataUrl(page: DrawPage | null, scale = 2): string | null {
  if (!page || page.strokes.length === 0) {
    return null;
  }
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(DRAW_PAGE_WIDTH * scale));
  canvas.height = Math.max(1, Math.round(DRAW_PAGE_HEIGHT * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.scale(scale, scale);
  // White matte so the drawing is legible on the PDF page rather than transparent.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DRAW_PAGE_WIDTH, DRAW_PAGE_HEIGHT);
  drawStrokesToContext(ctx, page.strokes);
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.startsWith('data:image/png') ? dataUrl : null;
}
