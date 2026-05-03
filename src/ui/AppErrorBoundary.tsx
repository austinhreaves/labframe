import { Component, type ErrorInfo, type ReactNode } from 'react';

import { reportError } from '@/services/telemetry/errorReporter';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    void reportError({ error });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="catalog">
          <h1>Something went wrong</h1>
          <p>The page hit an unexpected error. Please reload and try again.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
