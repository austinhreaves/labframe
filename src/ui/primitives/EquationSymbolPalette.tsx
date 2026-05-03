import { useMemo, useState } from 'react';

import { EQUATION_SYMBOL_CATEGORIES, QUICK_SYMBOLS } from '@/ui/primitives/equationSymbols';

type EquationSymbolPaletteProps = {
  onInsert: (latex: string) => void;
  onRestoreFocus: () => void;
};

export function EquationSymbolPalette({ onInsert, onRestoreFocus }: EquationSymbolPaletteProps) {
  const [activeCategory, setActiveCategory] = useState(EQUATION_SYMBOL_CATEGORIES[0]?.id ?? '');
  const symbols = useMemo(
    () => EQUATION_SYMBOL_CATEGORIES.find((category) => category.id === activeCategory)?.symbols ?? [],
    [activeCategory],
  );
  const handleInsert = (latex: string) => {
    onInsert(latex);
    setTimeout(() => {
      onRestoreFocus();
    }, 0);
  };

  return (
    <div className="equation-symbol-palette" aria-label="Equation symbol palette">
      <div className="equation-symbol-quick-row">
        {QUICK_SYMBOLS.map((symbol) => (
          <button
            key={symbol.id}
            type="button"
            className="equation-symbol-quick"
            title={symbol.insert}
            aria-label={`Insert ${symbol.insert}`}
            onClick={() => handleInsert(symbol.insert)}
          >
            {symbol.label}
          </button>
        ))}
      </div>
      <details className="equation-symbol-more">
        <summary>More ▾</summary>
        <div>
          <div className="equation-symbol-tabs" role="tablist" aria-label="Symbol categories">
            {EQUATION_SYMBOL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                className="equation-symbol-tab"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="equation-symbol-grid">
            {symbols.map((symbol) => (
              <button
                key={symbol.id}
                type="button"
                className="equation-symbol-button"
                title={symbol.insert}
                aria-label={`Insert ${symbol.insert}`}
                onClick={() => handleInsert(symbol.insert)}
              >
                {symbol.label}
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
