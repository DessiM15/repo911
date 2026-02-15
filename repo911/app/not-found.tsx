import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="text-center max-w-md">
        <Shield className="h-16 w-16 text-[#3474BA] dark:text-blue-400 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
