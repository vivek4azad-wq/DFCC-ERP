import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL UNCAUGHT REACT ERROR:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 text-center antialiased">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">DFCCIL ERP Recovery</h2>
              <p className="text-xs text-slate-400">
                A rendering issue was intercepted. You can reload or reset the local cache.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-xs font-mono text-red-300 max-h-36 overflow-y-auto">
                <div className="font-bold text-red-200 mb-1">{this.state.error.name}:</div>
                <div>{this.state.error.message}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="px-4 py-2.5 bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
