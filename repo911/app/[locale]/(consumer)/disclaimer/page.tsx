import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Legal disclaimer — Repo911 is a lead generation service, not a law firm. No attorney-client relationship is formed by using this site.',
};

export default async function DisclaimerPage() {
  const t = await getTranslations('disclaimer');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">{t('title')}</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-900 font-semibold text-lg mb-3">{t('noticeTitle')}</p>
          <p className="text-amber-800">{t('noticeBody')}</p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s1.title')}</h2>
          <p>{t('s1.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s2.title')}</h2>
          <p>{t('s2.body')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">{t('s3.title')}</h2>
          <p>{t('s3.intro')}</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>{t('s3.item1')}</li>
            <li>{t('s3.item2')}</li>
            <li>{t('s3.item3')}</li>
            <li>{t('s3.item4')}</li>
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

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {t.rich('moreInfo', {
              privacyLink: (chunks) => (
                <Link href="/privacy" className="text-[#3474BA] dark:text-blue-300 underline">{chunks}</Link>
              ),
              termsLink: (chunks) => (
                <Link href="/terms" className="text-[#3474BA] dark:text-blue-300 underline">{chunks}</Link>
              ),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
