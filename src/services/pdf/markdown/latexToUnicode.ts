type ImportMetaWithOptionalEnv = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

const COMMAND_MAP: Record<string, string> = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\vartheta': 'ϑ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\phi': 'φ',
  '\\varphi': 'φ',
  '\\pi': 'π',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  '\\Gamma': 'Γ',
  '\\Delta': 'Δ',
  '\\Theta': 'Θ',
  '\\Lambda': 'Λ',
  '\\Xi': 'Ξ',
  '\\Phi': 'Φ',
  '\\Pi': 'Π',
  '\\Sigma': 'Σ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
  '\\sin': 'sin',
  '\\cos': 'cos',
  '\\tan': 'tan',
  '\\log': 'log',
  '\\ln': 'ln',
  '\\cdot': '·',
  '\\times': '×',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\ast': '∗',
  '\\star': '⋆',
  '\\bullet': '•',
  '\\le': '≤',
  '\\leq': '≤',
  '\\ge': '≥',
  '\\geq': '≥',
  '\\ne': '≠',
  '\\neq': '≠',
  '\\equiv': '≡',
  '\\sim': '∼',
  '\\simeq': '≃',
  '\\approx': '≈',
  '\\propto': '∝',
  '\\to': '→',
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\mapsto': '↦',
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\ldots': '…',
  '\\dots': '…',
  '\\cdots': '⋯',
  '\\degree': '°',
  '\\circ': '∘',
  '\\angle': '∠',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\hbar': 'ℏ',
  '\\ell': 'ℓ',
  '\\langle': '⟨',
  '\\rangle': '⟩',
  '\\quad': '  ',
  '\\qquad': '    ',
};

// Wrapper commands whose only job is styling: drop the command, keep the braced
// content (which is converted in a later pass).
const WRAPPER_PATTERN =
  /\\(?:mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb|mathfrak|text|textrm|textbf|textit|textsf|texttt|operatorname|boldsymbol|vec|hat|bar|tilde|overline|underline|overrightarrow)\s*\{([^{}]*)\}/g;

// Spacing macros with non-letter names that the command map (letters only) cannot
// reach: thin/medium spaces collapse to a single space, negative space drops.
function stripSpacingMacros(input: string): string {
  return input
    .replace(/\\[,;:]/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\ /g, ' ');
}

function stripWrappers(input: string): string {
  let output = input;
  let previous: string;
  do {
    previous = output;
    output = output.replace(WRAPPER_PATTERN, '$1');
  } while (output !== previous);
  return output;
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
  y: 'ᵧ',
};

let warnedUnknownCommand = false;
let warnedUnsupportedSuperSub = false;

function isDev(): boolean {
  return Boolean((import.meta as ImportMetaWithOptionalEnv).env?.DEV);
}

function warnOnceUnknownCommand(): void {
  if (!isDev() || warnedUnknownCommand) {
    return;
  }
  warnedUnknownCommand = true;
  console.warn('[pdf-markdown] Unknown LaTeX command encountered; leaving verbatim.');
}

function warnOnceUnsupportedSuperSub(): void {
  if (!isDev() || warnedUnsupportedSuperSub) {
    return;
  }
  warnedUnsupportedSuperSub = true;
  console.warn('[pdf-markdown] Unsupported superscript/subscript characters; leaving literal fallback.');
}

function convertSuperSubContent(content: string, map: Record<string, string>, fallbackPrefix: '_' | '^'): string {
  let converted = '';
  for (const char of content) {
    const mapped = map[char];
    if (!mapped) {
      warnOnceUnsupportedSuperSub();
      return `${fallbackPrefix}${content}`;
    }
    converted += mapped;
  }
  return converted;
}

function convertSimpleSuperSub(input: string): string {
  let output = input;
  output = output.replace(/_\{([^{}]+)\}/g, (_full, content: string) => convertSuperSubContent(content, SUBSCRIPT_MAP, '_'));
  output = output.replace(/\^\{([^{}]+)\}/g, (_full, content: string) => convertSuperSubContent(content, SUPERSCRIPT_MAP, '^'));
  output = output.replace(/_([A-Za-z0-9+\-=()])/g, (_full, content: string) => convertSuperSubContent(content, SUBSCRIPT_MAP, '_'));
  output = output.replace(/\^([A-Za-z0-9+\-=()])/g, (_full, content: string) =>
    convertSuperSubContent(content, SUPERSCRIPT_MAP, '^'),
  );
  return output;
}

function replaceFractions(input: string): string {
  return input.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_full, numerator: string, denominator: string) => {
    return `(${numerator})/(${denominator})`;
  });
}

function replaceSquareRoots(input: string): string {
  return input.replace(/\\sqrt\{([^{}]+)\}/g, (_full, value: string) => `√(${value})`);
}

// Match only known commands, longest first, so a command directly followed by a
// letter (e.g. "\cdot\mathrm{m}" reduced to "\cdotm") is not swallowed whole by a
// greedy "\[A-Za-z]+".
const MAPPED_COMMAND_PATTERN = new RegExp(
  Object.keys(COMMAND_MAP)
    .sort((a, b) => b.length - a.length)
    .map((key) => key.replace(/\\/g, '\\\\'))
    .join('|'),
  'g',
);

function replaceMappedCommands(input: string): string {
  const output = input.replace(MAPPED_COMMAND_PATTERN, (command) => COMMAND_MAP[command] ?? command);
  if (/\\[A-Za-z]+/.test(output)) {
    // Something command-shaped is left over: leave it verbatim.
    warnOnceUnknownCommand();
  }
  return output;
}

export function latexToUnicode(input: string): string {
  let output = input;
  output = stripSpacingMacros(output);
  // Super/subscripts first: this collapses braces like `d^{2}` so they no longer
  // block fraction matching or wrapper stripping further down.
  output = convertSimpleSuperSub(output);
  output = stripWrappers(output);
  // Sizing delimiters carry no meaning once rendered as text.
  output = output.replace(/\\left/g, '').replace(/\\right/g, '');
  output = replaceFractions(output);
  output = replaceSquareRoots(output);
  output = replaceMappedCommands(output);
  return output;
}

/**
 * Convert inline `$...$` (and `$$...$$`) math segments inside an otherwise plain
 * string to unicode, leaving the surrounding text untouched. Used for section
 * prompts, measurement labels, and table headers that are not run through the
 * full markdown pipeline but may still contain inline math.
 */
export function mathToInline(input: string): string {
  if (!input.includes('$')) {
    return input;
  }
  return input
    .replace(/\$\$([\s\S]+?)\$\$/g, (_full, inner: string) => latexToUnicode(inner))
    .replace(/\$([^$]+)\$/g, (_full, inner: string) => latexToUnicode(inner));
}
