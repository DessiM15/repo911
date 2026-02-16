import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Repo911 Terms of Service — the terms and conditions governing your use of our wrongful repossession case review platform.',
};

export default async function TermsPage() {
  const t = await getTranslations('terms');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">{t('title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s1.title')}</h2>
          <p>{t.rich('s1.body', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s2.title')}</h2>
          <p>{t('s2.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s3.title')}</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t('s3.item1')}</li>
            <li>{t('s3.item2')}</li>
            <li>{t('s3.item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s4.title')}</h2>
          <p>{t('s4.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s5.title')}</h2>
          <p>{t('s5.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s6.title')}</h2>
          <p>{t('s6.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s7.title')}</h2>
          <p>{t('s7.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s8.title')}</h2>
          <p>{t('s8.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s9.title')}</h2>
          <p>{t('s9.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s10.title')}</h2>
          <p>{t('s10.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s11.title')}</h2>
          <p>{t('s11.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s12.title')}</h2>
          <p>{t('s12.body')}</p>
        </section>
      </div>
    </div>
  );
}
