import { getLocale, getTranslations } from 'next-intl/server';

export async function EnglishOnlyNotice() {
  const locale = await getLocale();
  if (locale === 'en') return null;

  const t = await getTranslations('common');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        {t('englishOnly')}
      </div>
    </div>
  );
}
