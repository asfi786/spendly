import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Logo from './Logo';

interface State {
  hasError: boolean;
  message: string;
}

/** Friendly fallback instead of a blank crash screen. Never shows raw errors. */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(): State {
    return { hasError: true, message: '' };
  }

  componentDidCatch() {
    this.setState({ hasError: true, message: '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 dark:bg-night-950">
          <div className="card max-w-md p-8 text-center animate-scale-in">
            <div className="mx-auto mb-4 w-fit">
              <Logo size={44} />
            </div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={24} aria-hidden />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>
            <button className="btn-primary mt-5 w-full" onClick={() => window.location.reload()}>
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
