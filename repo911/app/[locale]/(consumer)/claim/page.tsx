import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';

const IntakeForm = dynamic(
  () => import('@/components/consumer/IntakeForm').then((mod) => mod.IntakeForm),
  {
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Free Case Review',
  description: 'Fill out our free case review form to find out if your vehicle was wrongfully repossessed.',
};

export default async function ClaimPage() {
  const t = await getTranslations('claim');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
          {t('pageDescription')}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t.rich('requiredFieldsNote', {
            red: (chunks) => <span className="text-red-500">{chunks}</span>,
          })}
        </p>
      </div>
      <IntakeForm />
    </div>
  );
}
