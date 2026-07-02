import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Icon } from '@/ui/primitives/Icon';
import {
  applyThemePreference,
  getStoredThemePreference,
  resolveTheme,
  storeThemePreference,
} from '@/ui/theme';

/**
 * Compact two-state light/dark pill for the lab toolbar. On a clean profile
 * nothing is stored, so the theme follows the system setting and the pill shows
 * whichever the system resolves to; the theme is applied on mount but not
 * persisted. Clicking sets the explicit opposite and stores it, so system is
 * the pre-click default only (there is no explicit "System" state here). The
 * catalog / start screen keeps its own three-state ThemeToggle.
 */
export function ThemePill() {
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredThemePreference()),
  );

  // Apply on mount without persisting, so a first-load student stays on the
  // system default until they actively pick.
  useEffect(() => {
    applyThemePreference(getStoredThemePreference());
  }, []);

  const next = resolved === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    storeThemePreference(next);
    applyThemePreference(next);
    setResolved(next);
  };

  return (
    <button
      type="button"
      className="theme-pill"
      role="switch"
      aria-checked={resolved === 'dark'}
      aria-label={`${resolved === 'dark' ? 'Dark' : 'Light'} theme. Switch to ${next} theme.`}
      title={`Switch to ${next} theme`}
      onClick={toggle}
    >
      <span className="theme-pill-icon" data-active={resolved === 'light' ? '' : undefined}>
        <Icon icon={Sun} size={14} />
      </span>
      <span className="theme-pill-icon" data-active={resolved === 'dark' ? '' : undefined}>
        <Icon icon={Moon} size={14} />
      </span>
    </button>
  );
}
