import { describe, expect, it } from 'vitest';

import { latexToUnicode, mathToInline } from '@/services/pdf/markdown/latexToUnicode';

describe('latexToUnicode', () => {
  it('maps greek letters and operators', () => {
    expect(latexToUnicode('\\sin\\theta = \\alpha \\times \\beta \\le \\pi')).toBe(
      'sinθ = α × β ≤ π',
    );
  });

  it('converts supported subscript and superscript glyphs', () => {
    expect(latexToUnicode('x_i^2 + v_{max}')).toBe('xᵢ² + vₘₐₓ');
  });

  it('falls back fractions to parenthesized form', () => {
    expect(latexToUnicode('\\frac{a+b}{c-d}')).toBe('(a+b)/(c-d)');
  });

  it('treats \\tfrac and \\dfrac like \\frac', () => {
    expect(latexToUnicode('\\tfrac{1}{2}')).toBe('(1)/(2)');
    expect(latexToUnicode('\\dfrac{a}{b}')).toBe('(a)/(b)');
  });

  it('preserves equation tags as a trailing parenthesized number', () => {
    expect(latexToUnicode('C = \\frac{a}{b} \\tag{2}')).toBe('C = (a)/(b) (2)');
    expect(latexToUnicode('x = y\\tag{13}')).toBe('x = y (13)');
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

  // Exact strings authored in the Coulomb's Law lab (String.raw avoids escaping
  // ambiguity); these are the cases that previously leaked braces and commands.
  it('renders the real lab formulas with no leftover LaTeX', () => {
    expect(latexToUnicode(String.raw`F = k\,\frac{|Q_1 Q_2|}{d^{2}}`)).toBe('F = k (|Q₁ Q₂|)/(d²)');
    expect(
      latexToUnicode(
        String.raw`k \approx 8.988 \times 10^{9}\,\mathrm{N}\cdot\mathrm{m}^{2}/\mathrm{C}^{2}.`,
      ),
    ).toBe('k ≈ 8.988 × 10⁹ N·m²/C².');
    expect(
      latexToUnicode(String.raw`1\,\mathrm{e} \approx 1.602 \times 10^{-19}\,\mathrm{C}.`),
    ).toBe('1 e ≈ 1.602 × 10⁻¹⁹ C.');
    expect(latexToUnicode(String.raw`\mathrm{N \cdot m^{2} / C^{2}}`)).toBe('N · m² / C²');
    expect(latexToUnicode(String.raw`-3\,\mathrm{e}`)).toBe('-3 e');
  });

  it('maps \\max as a literal operator name', () => {
    expect(latexToUnicode(String.raw`\mathcal{E}_{\max} = N A \omega B_{\max}`)).toBe(
      'E_max = N A ω B_max',
    );
  });

  it('maps \\sum, \\Longrightarrow, \\ll, and \\gg', () => {
    expect(latexToUnicode(String.raw`\sum I_{\text{in}} = \sum I_{\text{out}}`)).toBe(
      '∑ Iᵢₙ = ∑ Iₒᵤₜ',
    );
    expect(
      latexToUnicode(
        String.raw`\varepsilon = I r \quad\Longrightarrow\quad I = \frac{\varepsilon}{R + r}`,
      ),
    ).toBe('ε = I r   ⟹   I = (ε)/(R + r)');
    expect(latexToUnicode(String.raw`R \ll r`)).toBe('R ≪ r');
    expect(latexToUnicode(String.raw`R \gg r`)).toBe('R ≫ r');
  });

  it('converts fractions whose arguments hold wrappers nested in subscripts', () => {
    expect(latexToUnicode(String.raw`\vec{E} = \frac{\vec{F}}{q_{\text{test}}}`)).toBe(
      'E = (F)/(qₜₑₛₜ)',
    );
    expect(latexToUnicode(String.raw`\frac{1}{C_{\text{series}}}`)).toBe('(1)/(Cₛₑᵣᵢₑₛ)');
  });

  // Capacitor lab formulas that previously leaked \tag and \tfrac verbatim.
  it('renders the capacitor formulas with tags and tfrac', () => {
    expect(latexToUnicode(String.raw`C = \frac{\varepsilon_{0} A}{d} \tag{2}`)).toBe(
      'C = (ε₀ A)/(d) (2)',
    );
    expect(latexToUnicode(String.raw`Q = C\,V \tag{1}`)).toBe('Q = C V (1)');
    expect(
      latexToUnicode(
        String.raw`U = \tfrac{1}{2}\,C V^{2} = \tfrac{1}{2}\,Q V = \tfrac{1}{2}\,\frac{Q^{2}}{C} \tag{3}`,
      ),
    ).toBe('U = (1)/(2) C V² = (1)/(2) Q V = (1)/(2) (Q²)/(C) (3)');
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
