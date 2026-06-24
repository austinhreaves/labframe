import { describe, expect, it } from 'vitest';

import { drawStorageKey } from '@/domain/calculationResponse';
import {
  DRAW_WIDTH_THIN,
  effectiveLineWidth,
  parseDrawing,
  serializeDrawing,
  type DrawDocument,
} from '@/ui/primitives/drawStrokes';

const sampleDoc: DrawDocument = {
  version: 2,
  strokes: [
    {
      color: '#111827',
      width: DRAW_WIDTH_THIN,
      points: [
        { x: 100, y: 100, pressure: 0 },
        { x: 200, y: 250, pressure: 0.6 },
      ],
    },
  ],
};

describe('drawStorageKey', () => {
  it('suffixes the field id so draw answers never collide with text answers', () => {
    expect(drawStorageKey('hand-calc')).toBe('hand-calc__draw');
  });
});

describe('serialize / parse round trip', () => {
  it('preserves strokes and pressure in logical space', () => {
    const parsed = parseDrawing(serializeDrawing(sampleDoc));
    expect(parsed).toEqual(sampleDoc);
  });

  it('upconverts a legacy v1 (pixel-space) document into logical units', () => {
    const legacy = JSON.stringify({
      version: 1,
      width: 500,
      height: 707,
      strokes: [{ color: '#111827', width: 2, points: [{ x: 250, y: 353.5, pressure: 0 }] }],
    });
    const parsed = parseDrawing(legacy);
    expect(parsed?.version).toBe(2);
    // A point at the pixel-space center lands at the logical-page center.
    expect(parsed?.strokes[0]?.points[0]?.x).toBeCloseTo(500, 0);
    expect(parsed?.strokes[0]?.points[0]?.y).toBeCloseTo(707, 0);
  });

  it('returns null for empty, malformed, or non-stroke payloads', () => {
    expect(parseDrawing(undefined)).toBeNull();
    expect(parseDrawing('')).toBeNull();
    expect(parseDrawing('not json')).toBeNull();
    expect(parseDrawing('{"version":2}')).toBeNull();
  });
});

describe('effectiveLineWidth', () => {
  it('falls back to the constant base width when pressure is unavailable', () => {
    expect(effectiveLineWidth(4, 0)).toBe(4);
  });

  it('modulates around the base width for pen pressure', () => {
    expect(effectiveLineWidth(4, 0.5)).toBe(4);
    expect(effectiveLineWidth(4, 1)).toBe(6);
    expect(effectiveLineWidth(4, 0.25)).toBe(3);
  });
});
