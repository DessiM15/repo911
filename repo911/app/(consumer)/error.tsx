'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/error-tracking/client-tracker';
import Link from 'next/link';
import { Shield, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConsumerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { level: 'fatal', tags: ['error-boundary', 'consumer'] });
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
        <p className="text-gray-500 mb-6">
          We encountered an error. Please try again or return to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="consumer" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
