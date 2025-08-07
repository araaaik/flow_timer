import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-6 bg-red-50 text-red-900">
          <h1 className="text-2xl font-bold mb-2">A runtime error occurred</h1>
          <pre className="whitespace-pre-wrap p-3 rounded bg-white border border-red-200">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p className="mt-2 text-sm">Check the browser console for full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}