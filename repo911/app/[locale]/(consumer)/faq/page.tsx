import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import FaqSearch from '@/components/consumer/FaqSearch';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about wrongful vehicle repossession, your legal rights, and how Repo911 connects you with attorneys.',
};

const FAQ_STRUCTURE = [
  { key: 'cat1', count: 3 },
  { key: 'cat2', count: 6 },
  { key: 'cat3', count: 4 },
  { key: 'cat4', count: 4 },
  { key: 'cat5', count: 3 },
];

export default async function FAQPage() {
  const t = await getTranslations('faq');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tKey = (key: string) => (t as any)(key);

  const faqs = FAQ_STRUCTURE.map(({ key, count }) => ({
    category: tKey(`${key}Title`),
    questions: Array.from({ length: count }, (_, i) => ({
      q: tKey(`${key}Q${i + 1}`),
      a: tKey(`${key}A${i + 1}`),
    })),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      <FaqSearch faqs={faqs} />

      {/* CTA */}
      <div className="mt-12 text-center bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-800 p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('ctaTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('ctaDescription')}
        </p>
        <Link href="/claim">
          <Button variant="primary">
            {t('ctaButton')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>
          {t.rich('contactText', {
            email: (chunks) => (
              <a href="mailto:support@repo911.com" className="text-[#3474BA] dark:text-blue-300 underline">{chunks}</a>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
