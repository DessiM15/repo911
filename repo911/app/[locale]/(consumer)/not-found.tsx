import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConsumerNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <Shield className="h-12 w-12 text-[#3474BA] dark:text-blue-400 mx-auto mb-4" />
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h2>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="consumer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
