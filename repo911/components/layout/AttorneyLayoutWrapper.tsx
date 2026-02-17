'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AttorneyNav } from './AttorneyNav';
import { createClient } from '@/lib/supabase/client';

const AUTH_ROUTES = ['/attorney/login', '/attorney/register', '/attorney/forgot-password'];

export function AttorneyLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const [sessionChecked, setSessionChecked] = useState(isAuthPage);

  useEffect(() => {
    if (isAuthPage) return;

    const hasSession = sessionStorage.getItem('attorney_session_active');
    if (!hasSession) {
      // No sessionStorage flag — tab was closed and reopened, or new tab
      const supabase = createClient();
      supabase.auth.signOut().then(() => {
        window.location.href = '/attorney/login';
      });
      return;
    }

    setSessionChecked(true);
  }, [isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2A4A] dark:border-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AttorneyNav />
      <div className="lg:ml-64">
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
