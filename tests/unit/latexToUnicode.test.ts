import { describe, expect, it } from 'vitest';

import { latexToUnicode } from '@/services/pdf/markdown/latexToUnicode';

describe('latexToUnicode', () => {
  it('maps greek letters and operators', () => {
    expect(latexToUnicode('\\sin\\theta = \\alpha \\times \\beta \\le \\pi')).toBe('sinθ = α × β ≤ π');
  });

  it('converts supported subscript and superscript glyphs', () => {
    expect(latexToUnicode('x_i^2 + v_{max}')).toBe('xᵢ² + vₘₐₓ');
  });

  it('falls back fractions to parenthesized form', () => {
    expect(latexToUnicode('\\frac{a+b}{c-d}')).toBe('(a+b)/(c-d)');
  });

  it('passes unknown commands through verbatim', () => {
    expect(latexToUnicode('\\unknownCommand + \\theta')).toBe('\\unknownCommand + θ');
  });
});
