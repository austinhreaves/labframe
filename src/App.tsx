import { AppRoutes } from '@/app/Routes';
import { useLocation } from 'react-router-dom';

export function App() {
  const { pathname } = useLocation();
  const isLabRoute = pathname.startsWith('/l/') || /^\/c\/[^/]+\/[^/]+\/?$/.test(pathname);

  return (
    <>
      <AppRoutes />
      {!isLabRoute ? <footer className="app-footer">LabFrame - Built for ASU online physics labs.</footer> : null}
    </>
  );
}
