'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ConsumerAuthNav() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthenticated(!!user);
    }
    checkAuth();
  }, []);

  // Loading — render nothing to avoid layout shift
  if (authenticated === null) return null;

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/portal/dashboard"
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#3474BA] dark:hover:text-blue-300 transition-colors"
        >
          My Cases
        </Link>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/portal/login';
          }}
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#3474BA] dark:hover:text-blue-300 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/portal/login"
      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#3474BA] dark:hover:text-blue-300 transition-colors"
    >
      Sign In
    </Link>
  );
}
