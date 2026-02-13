'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/error-tracking/client-tracker';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { level: 'fatal', tags: ['error-boundary'] });
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <Shield className="h-16 w-16 text-red-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
        <p className="text-gray-500 mb-8">
          We encountered an unexpected error. Please try again.
        </p>
        <Button variant="primary" onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
