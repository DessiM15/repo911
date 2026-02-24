import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="text-center max-w-md">
        <Image
          src="/images/mascot.png"
          alt="Repo911 mascot looking lost"
          width={160}
          height={160}
          className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6"
        />
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Even the Repo Man Can&apos;t Find This Page</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Looks like this page has been towed away. Let&apos;s get you back on track.
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
