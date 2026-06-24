/**
 * Shared free-draw stroke model for the calculation "draw" response mode (Phase
 * C-B). The same serialization and rasterization helpers back both the live
 * canvas (DrawCanvas) and the PDF export path, so what the student draws is what
 * the exported PDF embeds.
 */

export type DrawPoint = { x: number; y: number; pressure: number };

/** One pen-down to pen-up stroke. `width` is the base width (thin/thick); each
 *  point carries its own pressure, applied at render time. */
export type DrawStroke = { color: string; width: number; points: DrawPoint[] };

/** Serialized drawing document stored in `FieldValue.text` under the draw key.
 *  `width` / `height` capture the canvas size at draw time so the export path
 *  can rasterize at the same coordinate space the points were captured in. */
export type DrawDocument = {
  version: 1;
  width: number;
  height: number;
  strokes: DrawStroke[];
};

/** Canvas height is a multiple of this base, mirroring the textarea row sizing. */
export const DRAW_ROW_HEIGHT = 80;
export const DRAW_DEFAULT_ROWS = 3;

/** Preset stroke colors. Black is the default; the rest are minimal accents. */
export const DRAW_COLORS = ['#111827', '#2563eb', '#dc2626', '#16a34a'] as const;
export const DRAW_WIDTH_THIN = 2;
export const DRAW_WIDTH_THICK = 5;

export function serializeDrawing(doc: DrawDocument): string {
  return JSON.stringify(doc);
}

export function parseDrawing(text: string | undefined | null): DrawDocument | null {
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text) as Partial<DrawDocument>;
    if (!parsed || !Array.isArray(parsed.strokes)) {
      return null;
    }
    return {
      version: 1,
      width: typeof parsed.width === 'number' ? parsed.width : 0,
      height: typeof parsed.height === 'number' ? parsed.height : 0,
      strokes: parsed.strokes as DrawStroke[],
    };
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

/** Replay strokes onto a 2D context. Used by both the live canvas and the
 *  offscreen rasterizer, so on-screen and PDF output stay identical. */
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
 * Rasterize a drawing to a PNG data URL on an offscreen canvas, for embedding in
 * the exported PDF. Returns null when there is nothing to draw or no canvas is
 * available (e.g. a non-browser environment). `scale` oversamples for a crisper
 * PNG in the A4-sized PDF.
 */
export function rasterizeDrawingToDataUrl(doc: DrawDocument | null, scale = 2): string | null {
  if (!doc || doc.strokes.length === 0 || doc.width <= 0 || doc.height <= 0) {
    return null;
  }
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(doc.width * scale));
  canvas.height = Math.max(1, Math.round(doc.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.scale(scale, scale);
  // White matte so the drawing is legible on the PDF page rather than transparent.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, doc.width, doc.height);
  drawStrokesToContext(ctx, doc.strokes);
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.startsWith('data:image/png') ? dataUrl : null;
}
