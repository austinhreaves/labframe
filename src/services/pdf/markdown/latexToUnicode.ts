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
  '\\theta': 'θ',
  '\\phi': 'φ',
  '\\pi': 'π',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\omega': 'ω',
  '\\Theta': 'Θ',
  '\\Phi': 'Φ',
  '\\Pi': 'Π',
  '\\Sigma': 'Σ',
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
  '\\le': '≤',
  '\\ge': '≥',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\to': '→',
  '\\propto': '∝',
};

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

function replaceMappedCommands(input: string): string {
  return input.replace(/\\[A-Za-z]+/g, (command: string) => {
    const mapped = COMMAND_MAP[command];
    if (mapped !== undefined) {
      return mapped;
    }
    warnOnceUnknownCommand();
    return command;
  });
}

export function latexToUnicode(input: string): string {
  let output = input;
  output = replaceFractions(output);
  output = replaceSquareRoots(output);
  output = replaceMappedCommands(output);
  output = convertSimpleSuperSub(output);
  return output;
}
