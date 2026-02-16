import type { Metadata } from 'next';
import { ClipboardList, Search, Scale, ArrowRight, Shield, Clock, DollarSign } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Repo911 helps you fight wrongful vehicle repossession in 3 simple steps: submit your case, get reviewed, and connect with an attorney.',
};

export default async function HowItWorksPage() {
  const t = await getTranslations('howItWorks');

  const steps = [
    {
      icon: ClipboardList,
      number: '1',
      title: t('step1Title'),
      description: t('step1Description'),
      details: [t('step1Detail1'), t('step1Detail2'), t('step1Detail3'), t('step1Detail4')],
    },
    {
      icon: Search,
      number: '2',
      title: t('step2Title'),
      description: t('step2Description'),
      details: [t('step2Detail1'), t('step2Detail2'), t('step2Detail3'), t('step2Detail4')],
    },
    {
      icon: Scale,
      number: '3',
      title: t('step3Title'),
      description: t('step3Description'),
      details: [t('step3Detail1'), t('step3Detail2'), t('step3Detail3'), t('step3Detail4')],
    },
  ];

  const trustPoints = [
    { icon: Shield, title: t('trustFreeTitle'), description: t('trustFreeDescription') },
    { icon: Clock, title: t('trustFastTitle'), description: t('trustFastDescription') },
    { icon: DollarSign, title: t('trustNoFeesTitle'), description: t('trustNoFeesDescription') },
  ];

  const violations = [
    { quote: t('violation1Quote'), title: t('violation1Title'), description: t('violation1Description') },
    { quote: t('violation2Quote'), title: t('violation2Title'), description: t('violation2Description') },
    { quote: t('violation3Quote'), title: t('violation3Title'), description: t('violation3Description') },
    { quote: t('violation4Quote'), title: t('violation4Title'), description: t('violation4Description') },
    { quote: t('violation5Quote'), title: t('violation5Title'), description: t('violation5Description') },
    { quote: t('violation6Quote'), title: t('violation6Title'), description: t('violation6Description') },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8 mb-16">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#3474BA] flex items-center justify-center">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-[#3474BA] dark:text-blue-300 uppercase tracking-wide">{t('stepLabel', { number: step.number })}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{step.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-[#3474BA] dark:text-blue-300 mt-1.5 flex-shrink-0">&#8226;</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Points */}
      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        {trustPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-800">
              <Icon className="h-8 w-8 text-[#3474BA] dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{point.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{point.description}</p>
            </div>
          );
        })}
      </div>

      {/* Common Violations */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">{t('violationsTitle')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {violations.map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-2">{item.quote}</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-[#3474BA] rounded-xl p-8 sm:p-10">
        <h2 className="text-2xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
        <p className="text-white mb-6 max-w-lg mx-auto">
          {t('ctaDescription')}
        </p>
        <Link href="/claim">
          <Button variant="secondary" size="lg">
            {t('ctaButton')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-8">
        {t('disclaimer')}
      </p>
    </div>
  );
}
