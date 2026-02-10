'use client';

import { usePathname } from 'next/navigation';
import { AttorneyNav } from './AttorneyNav';

const AUTH_ROUTES = ['/attorney/login', '/attorney/register'];

export function AttorneyLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AttorneyNav />
      <div className="lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
