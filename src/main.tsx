import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught EffectiveStreak error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch { /* ignore */ }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#121622] border border-red-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto text-2xl">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Application Recovery Mode</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                An unexpected local render error occurred. Click below to clear corrupt local state and reload.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-[11px] font-mono text-red-300 text-left truncate">
              {this.state.error?.message || 'Render exception detected'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95"
            >
              Reset Cache & Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
