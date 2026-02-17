'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

const AUTH_ROUTES = ['/admin/login'];

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AdminSidebar />
      <div className="lg:ml-64">
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
