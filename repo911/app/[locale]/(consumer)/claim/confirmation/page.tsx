import type { Metadata } from 'next';
import { CheckCircle, Clock, Phone, ArrowRight, Info, Upload, Mic } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { StoryRecorderCTAWrapper } from './StoryRecorderCTAWrapper';
import { CopyIdButton } from '@/components/consumer/CopyIdButton';

export const metadata: Metadata = {
  title: 'Submission Confirmed',
  description: 'Your wrongful repossession case has been submitted for review. An attorney may reach out to you soon.',
  robots: { index: false },
};

function getTierConfig(tier: string | null) {
  switch (tier) {
    case 'hot':
      return { key: 'hot' as const, icon: CheckCircle, iconColor: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950 border-green-200' };
    case 'warm':
      return { key: 'warm' as const, icon: CheckCircle, iconColor: 'text-[#3474BA] dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' };
    case 'cold':
      return { key: 'cold' as const, icon: Clock, iconColor: 'text-[#3474BA] dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' };
    default:
      return { key: 'default' as const, icon: Info, iconColor: 'text-gray-400', bgColor: 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700' };
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; id?: string }>;
}) {
  const { tier = null, id = null } = await searchParams;
  const t = await getTranslations('confirmation');
  const config = getTierConfig(tier);
  const Icon = config.icon;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tKey = (key: string) => (t as any)(key);
  const tierTitle = tKey(`${config.key}.title`);
  const tierDescription = tKey(`${config.key}.description`);
  const tierSteps = [tKey(`${config.key}.step1`), tKey(`${config.key}.step2`), tKey(`${config.key}.step3`)];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <Icon className={`h-16 w-16 mx-auto mb-4 ${config.iconColor}`} />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{tierTitle}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{tierDescription}</p>
      </div>

      <div className={`rounded-xl border p-6 mb-8 ${config.bgColor}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t('whatHappensNext')}
        </h2>
        <ul className="space-y-3">
          {tierSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                {i + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('importantReminders')}</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li>- {t('reminder1')}</li>
          <li>- {t('reminder2')}</li>
          <li>- {t('reminder3')}</li>
          <li>- {t('reminder4')}</li>
        </ul>
      </div>

      {id && (
        <div className="bg-[#F5A623]/10 rounded-xl border-2 border-[#F5A623] p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#F5A623]" />
            {t('uploadTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('uploadDescription')}
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('caseIdLabel')}</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-gray-900 dark:text-gray-100 select-all break-all">{id}</p>
              <CopyIdButton text={id} variant="orange" />
            </div>
          </div>
          <Link href={`/track?id=${id}`}>
            <Button variant="consumer" size="lg" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {t('uploadButton')}
            </Button>
          </Link>
        </div>
      )}

      {id && (
        <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border-2 border-[#3474BA] p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Mic className="h-5 w-5 text-[#3474BA]" />
            {t('storyTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('storyDescription')}
          </p>
          <StoryRecorderCTAWrapper leadId={id} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/">
          <Button variant="outline">{t('returnHome')}</Button>
        </Link>
        <Link href={id ? `/track?id=${id}` : '/track'}>
          <Button variant="primary">
            {t('trackCase')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-8">
        {t('disclaimer')}
      </p>
    </div>
  );
}
