import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { AppRoutes } from '@/app/Routes';
import { applyThemePreference, getStoredThemePreference } from '@/ui/theme';

export function App() {
  const { pathname } = useLocation();
  const isLabRoute = pathname.startsWith('/l/') || /^\/c\/[^/]+\/[^/]+\/?$/.test(pathname);

  // Apply the stored theme on boot so every route (not just lab pages)
  // honors the student's preference.
  useEffect(() => {
    applyThemePreference(getStoredThemePreference());
  }, []);

  return (
    <>
      <AppRoutes />
      {!isLabRoute ? (
        <footer className="app-footer">LabFrame - Built for ASU online physics labs.</footer>
      ) : null}
    </>
  );
}
