import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { latexToUnicode } from '@/services/pdf/markdown/latexToUnicode';

/**
 * No-leak invariant for the LaTeX -> unicode converter. The documented failure
 * mode is raw markup (e.g. `\tag`, `\tfrac`, stray braces) leaking verbatim into
 * the exported PDF. The example test covers specific glyphs; this asserts the
 * structural invariant over generated input built only from *supported*
 * constructs: such input must convert with no residual `\`, `{`, or `}`.
 * Surface: src/services/pdf/markdown/latexToUnicode.ts.
 */

// Argument-less commands the converter maps to a single glyph.
const mappedCommand = fc.constantFrom(
  '\\alpha',
  '\\beta',
  '\\gamma',
  '\\theta',
  '\\pi',
  '\\mu',
  '\\omega',
  '\\Delta',
  '\\Sigma',
  '\\Omega',
  '\\cdot',
  '\\times',
  '\\pm',
  '\\le',
  '\\ge',
  '\\ne',
  '\\approx',
  '\\to',
  '\\infty',
  '\\sum',
  '\\degree',
);

// Digit/letter atoms whose super/subscript and fraction forms are fully mapped.
const digits = fc.integer({ min: 0, max: 999 }).map(String);
const base = fc.constantFrom('x', 'y', 'q', 't', 'v', 'm', 'n', 'E');

const fraction = fc.tuple(digits, digits).map(([a, b]) => `\\frac{${a}}{${b}}`);
const tfraction = fc.tuple(digits, digits).map(([a, b]) => `\\tfrac{${a}}{${b}}`);
const subscript = fc.tuple(base, digits).map(([s, d]) => `${s}_{${d}}`);
const superscript = fc.tuple(base, digits).map(([s, d]) => `${s}^{${d}}`);
const sqrt = digits.map((d) => `\\sqrt{${d}}`);
const tag = digits.map((d) => `E = mc^2 \\tag{${d}}`);
const plain = fc.constantFrom('E', 'v', 'mass', 'energy', 'speed of light');

// Each token converts independently; joining with spaces avoids adjacency that
// could glue two commands together.
const token = fc.oneof(
  mappedCommand,
  fraction,
  tfraction,
  subscript,
  superscript,
  sqrt,
  tag,
  plain,
);

describe('latexToUnicode no-leak invariant', () => {
  it('leaves no backslash or brace when input uses only supported constructs', () => {
    fc.assert(
      fc.property(fc.array(token, { minLength: 1, maxLength: 6 }), (tokens) => {
        const out = latexToUnicode(tokens.join(' '));
        expect(out).not.toMatch(/[\\{}]/);
      }),
    );
  });
});
