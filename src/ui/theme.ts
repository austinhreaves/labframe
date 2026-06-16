export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'labframe:theme';

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored =
      typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function storeThemePreference(theme: ThemePreference): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore storage write errors (quota, private mode).
  }
}

export function applyThemePreference(theme: ThemePreference): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const prefersDark =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.dataset.theme = resolved;
}
