'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ErrorTrackingProvider = dynamic(
  () =>
    import('@/components/ErrorTrackingProvider').then(
      (mod) => mod.ErrorTrackingProvider
    ),
  { ssr: false }
);

export function LazyErrorTracking({ children }: { children: ReactNode }) {
  return <ErrorTrackingProvider>{children}</ErrorTrackingProvider>;
}
