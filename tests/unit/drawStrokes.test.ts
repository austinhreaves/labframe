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
  version: 1,
  width: 400,
  height: 240,
  strokes: [
    {
      color: '#111827',
      width: DRAW_WIDTH_THIN,
      points: [
        { x: 10, y: 10, pressure: 0 },
        { x: 20, y: 25, pressure: 0.6 },
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
  it('preserves strokes, dimensions, and pressure', () => {
    const parsed = parseDrawing(serializeDrawing(sampleDoc));
    expect(parsed).toEqual(sampleDoc);
  });

  it('returns null for empty, malformed, or non-stroke payloads', () => {
    expect(parseDrawing(undefined)).toBeNull();
    expect(parseDrawing('')).toBeNull();
    expect(parseDrawing('not json')).toBeNull();
    expect(parseDrawing('{"version":1}')).toBeNull();
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
