'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/error-tracking/client-tracker';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { level: 'fatal', tags: ['error-boundary', 'admin'] });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Error</h2>
        <p className="text-gray-500 mb-6 text-sm">
          An error occurred in the admin portal. Please try again.
        </p>
        <Button variant="primary" onClick={reset} className="bg-[#1B2A4A] hover:bg-[#2A3D66]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
