'use client';

import { useEffect, type ReactNode } from 'react';
import { errorTracker } from '@/lib/error-tracking/client-tracker';
import { ErrorBoundary } from './ErrorBoundary';

export function ErrorTrackingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1);
    const id = schedule(() => errorTracker.init());
    return () => {
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as number);
      }
    };
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
