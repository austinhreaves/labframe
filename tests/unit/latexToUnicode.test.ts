import { describe, expect, it } from 'vitest';

import { latexToUnicode, mathToInline } from '@/services/pdf/markdown/latexToUnicode';

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

  it('strips styling wrappers like \\mathrm and \\text', () => {
    expect(latexToUnicode('\\mathrm{nC}')).toBe('nC');
    expect(latexToUnicode('\\text{seconds}')).toBe('seconds');
    expect(latexToUnicode('\\mathbf{F}')).toBe('F');
  });

  it('collapses thin-space macros to a single space', () => {
    expect(latexToUnicode('3\\,\\mathrm{nC}')).toBe('3 nC');
    expect(latexToUnicode('10^{-12}\\,\\mathrm{m}')).toBe('10⁻¹² m');
  });

  it('converts fractions with nested sub/superscripts', () => {
    expect(latexToUnicode('\\frac{|q_1||q_2|}{r^2}')).toBe('(|q₁||q₂|)/(r²)');
  });

  it('maps additional operators and symbols', () => {
    expect(latexToUnicode('k = 8.99 \\times 10^9')).toBe('k = 8.99 × 10⁹');
    expect(latexToUnicode('a \\ldots b')).toBe('a … b');
    expect(latexToUnicode('\\Delta x \\approx 0')).toBe('Δ x ≈ 0');
  });

  it('drops \\left and \\right sizing delimiters', () => {
    expect(latexToUnicode('\\left| q \\right|')).toBe('| q |');
  });

  it('handles a unit expression end to end', () => {
    expect(latexToUnicode('\\mathrm{N \\cdot m^2 / C^2}')).toBe('N · m² / C²');
  });
});

describe('mathToInline', () => {
  it('converts only the $...$ segments and leaves surrounding text', () => {
    expect(mathToInline('Distance $d$ (s)')).toBe('Distance d (s)');
    expect(mathToInline('Charge $Q_2B$')).toBe('Charge Q₂B');
    expect(mathToInline('$1/d^2$')).toBe('1/d²');
  });

  it('returns plain strings unchanged', () => {
    expect(mathToInline('Force')).toBe('Force');
    expect(mathToInline('')).toBe('');
  });
});
