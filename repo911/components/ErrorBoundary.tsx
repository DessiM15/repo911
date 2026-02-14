'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureException } from '@/lib/error-tracking/client-tracker';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, {
      level: 'fatal',
      tags: ['react-error-boundary'],
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We&apos;ve been notified and are working to fix the issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#3474BA] text-white py-2 px-4 rounded-lg hover:bg-[#3a7bc8] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
