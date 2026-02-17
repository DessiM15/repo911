'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/error-tracking/client-tracker';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AttorneyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { level: 'fatal', tags: ['error-boundary', 'attorney'] });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something Went Wrong</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          We encountered an error loading this page. Please try again or contact support if the problem persists.
        </p>
        <Button variant="primary" onClick={reset} className="bg-[#1B2A4A] hover:bg-[#2A3D66]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
