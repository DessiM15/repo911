'use client';

import { useEffect, type ReactNode } from 'react';
import { errorTracker } from '@/lib/error-tracking/client-tracker';
import { ErrorBoundary } from './ErrorBoundary';

export function ErrorTrackingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    errorTracker.init();
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
