"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-red-900/20 bg-red-950/10">
          <AlertCircle className="h-8 w-8 text-red-500/80 mb-3" />
          <h3 className="text-sm font-medium text-red-200">Something went wrong</h3>
          <p className="mt-1 text-xs text-red-300/70 max-w-sm">
            {this.state.error?.message || "An unexpected error occurred in this component."}
          </p>
          <Button onClick={this.handleReset} variant="secondary" className="mt-4 border-red-900/50 hover:bg-red-900/30">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
