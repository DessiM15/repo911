'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: 'en' | 'es') {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${isPending ? 'opacity-50' : ''}`}>
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
          locale === 'en'
            ? 'text-[#3474BA] dark:text-blue-300 font-bold'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        disabled={isPending}
      >
        EN
      </button>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <button
        onClick={() => switchLocale('es')}
        className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
          locale === 'es'
            ? 'text-[#3474BA] dark:text-blue-300 font-bold'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        disabled={isPending}
      >
        ES
      </button>
    </div>
  );
}
