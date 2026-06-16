import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

import { Icon } from '@/ui/primitives/Icon';
import { Button } from '@/ui/primitives/Button';
import {
  applyThemePreference,
  getStoredThemePreference,
  storeThemePreference,
  type ThemePreference,
} from '@/ui/theme';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];
const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;
const LABELS = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' } as const;

/** Compact cycling theme button for slim headers (catalog). */
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());

  useEffect(() => {
    applyThemePreference(preference);
    storeThemePreference(preference);
  }, [preference]);

  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length] ?? 'system';

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={`${LABELS[preference]} active. Switch to ${LABELS[next].toLowerCase()}.`}
      title={LABELS[preference]}
      onClick={() => setPreference(next)}
      leadingIcon={<Icon icon={ICONS[preference]} size={16} />}
    />
  );
}
