'use client';

import { useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export function LazyErrorTracking({ children }: { children: ReactNode }) {
  useEffect(() => {
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1);
    const id = schedule(() => {
      import('@/lib/error-tracking/client-tracker').then((mod) =>
        mod.errorTracker.init()
      );
    });
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
