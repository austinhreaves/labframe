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

/** The concrete theme a preference resolves to right now ('system' -> OS setting). */
export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  const prefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  return prefersDark ? 'dark' : 'light';
}

export function applyThemePreference(theme: ThemePreference): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  document.documentElement.dataset.theme = resolveTheme(theme);
}
