import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { installGlobalTelemetryHandlers } from '@/services/telemetry/errorReporter';
import { AppErrorBoundary } from '@/ui/AppErrorBoundary';
import 'katex/dist/katex.min.css';
import './main.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

installGlobalTelemetryHandlers();

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
