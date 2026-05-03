export type EquationSymbol = {
  id: string;
  label: string;
  insert: string;
};

export type EquationSymbolCategory = {
  id: string;
  label: string;
  symbols: EquationSymbol[];
};

export const QUICK_SYMBOLS: EquationSymbol[] = [
  { id: 'alpha', label: 'α', insert: '\\alpha' },
  { id: 'theta', label: 'θ', insert: '\\theta' },
  { id: 'pi', label: 'π', insert: '\\pi' },
  { id: 'Delta', label: 'Δ', insert: '\\Delta' },
  { id: 'mu', label: 'μ', insert: '\\mu' },
  { id: 'sigma', label: 'σ', insert: '\\sigma' },
  { id: 'pm', label: '±', insert: '\\pm' },
  { id: 'to', label: '→', insert: '\\to' },
  { id: 'sqrt', label: '√', insert: '\\sqrt{}' },
  { id: 'approx', label: '≈', insert: '\\approx' },
];

export const EQUATION_SYMBOL_CATEGORIES: EquationSymbolCategory[] = [
  {
    id: 'greek',
    label: 'Greek',
    symbols: [
      { id: 'beta', label: 'β', insert: '\\beta' },
      { id: 'gamma', label: 'γ', insert: '\\gamma' },
      { id: 'delta', label: 'δ', insert: '\\delta' },
      { id: 'epsilon', label: 'ε', insert: '\\epsilon' },
      { id: 'lambda', label: 'λ', insert: '\\lambda' },
      { id: 'phi', label: 'φ', insert: '\\phi' },
      { id: 'omega', label: 'ω', insert: '\\omega' },
      { id: 'Gamma', label: 'Γ', insert: '\\Gamma' },
      { id: 'Theta', label: 'Θ', insert: '\\Theta' },
      { id: 'Lambda', label: 'Λ', insert: '\\Lambda' },
      { id: 'Pi', label: 'Π', insert: '\\Pi' },
      { id: 'Sigma', label: 'Σ', insert: '\\Sigma' },
      { id: 'Phi', label: 'Φ', insert: '\\Phi' },
      { id: 'Omega', label: 'Ω', insert: '\\Omega' },
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    symbols: [
      { id: 'nabla', label: '∇', insert: '\\nabla' },
      { id: 'partial', label: '∂', insert: '\\partial' },
      { id: 'int', label: '∫', insert: '\\int' },
      { id: 'sum', label: '∑', insert: '\\sum' },
      { id: 'prod', label: '∏', insert: '\\prod' },
      { id: 'times', label: '×', insert: '\\times' },
      { id: 'div', label: '÷', insert: '\\div' },
      { id: 'cdot', label: '·', insert: '\\cdot' },
      { id: 'leq', label: '≤', insert: '\\leq' },
      { id: 'geq', label: '≥', insert: '\\geq' },
      { id: 'neq', label: '≠', insert: '\\neq' },
      { id: 'propto', label: '∝', insert: '\\propto' },
    ],
  },
  {
    id: 'vectors',
    label: 'Vectors',
    symbols: [
      { id: 'vec', label: '⃗x', insert: '\\vec{x}' },
      { id: 'hat', label: 'x̂', insert: '\\hat{x}' },
      { id: 'dot', label: 'ẋ', insert: '\\dot{x}' },
      { id: 'ddot', label: 'ẍ', insert: '\\ddot{x}' },
    ],
  },
  {
    id: 'subsup',
    label: 'Sub/Sup',
    symbols: [
      { id: 'sub', label: 'xᵢ', insert: 'x_i' },
      { id: 'sup', label: 'x²', insert: 'x^2' },
      { id: 'sub-group', label: 'xₐᵦ', insert: 'x_{ab}' },
      { id: 'sup-group', label: 'xᵃᵇ', insert: 'x^{ab}' },
    ],
  },
];
