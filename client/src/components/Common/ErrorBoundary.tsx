"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-zinc-400 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-outfit uppercase tracking-widest">Workspace Failure</h2>
          <p className="text-sm max-w-md mb-8 leading-relaxed">
            The Bestlink engine encountered an unexpected error. Your workspace state is safe, but the UI needs to be reset.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART STUDIO
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
