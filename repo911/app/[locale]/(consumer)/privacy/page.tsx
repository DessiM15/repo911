import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Repo911 Privacy Policy — how we collect, use, and protect your information when you submit a wrongful repossession case review.',
};

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">{t('title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s1.title')}</h2>
          <p>{t('s1.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t.rich('s1.item1', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s1.item2', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s1.item3', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s1.item4', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s1.item5', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s2.title')}</h2>
          <p>{t('s2.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t('s2.item1')}</li>
            <li>{t('s2.item2')}</li>
            <li>{t('s2.item3')}</li>
            <li>{t('s2.item4')}</li>
            <li>{t('s2.item5')}</li>
            <li>{t('s2.item6')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s3.title')}</h2>
          <p>{t('s3.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t.rich('s3.item1', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s3.item2', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s3.item3', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
          </ul>
          <p className="mt-2">{t('s3.closing')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s4.title')}</h2>
          <p>{t('s4.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s5.title')}</h2>
          <p>{t('s5.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t.rich('s5.item1', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s5.item2', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s5.item3', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            <li>{t.rich('s5.item4', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
          </ul>
          <p className="mt-2">{t('s5.closing')}</p>
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
          <p>{t('s10.intro')}</p>
          <p className="mt-2">{t('s10.email')}</p>
        </section>
      </div>
    </div>
  );
}
