import { Shield, FileSearch, UserCheck, ArrowRight, ChevronRight, Clock, Lock, Scale, DollarSign } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/consumer/LoadingScreen';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Repo911',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com',
  description:
    'Free case review for wrongful vehicle repossession. Find out if your rights were violated under the FDCPA, UCC Article 9, or SCRA.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com'}/claim`,
    'query-input': 'required',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Repo911',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com',
  description:
    'Repo911 connects consumers who have experienced wrongful vehicle repossession with licensed attorneys nationwide.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I still have a case if I missed payments?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Even if you were behind on payments, the repo company must follow the law. If they breached the peace, entered a locked area, or violated other rules, you may have a valid claim.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does it cost to use Repo911?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nothing. Our case review is 100% free. If an attorney takes your case, they typically work on a contingency basis — meaning no fees unless you win.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does the case review take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The online questionnaire takes about 5 minutes. Our system reviews your case immediately, and if qualified, an attorney could reach out within 24-48 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What kind of compensation can I receive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depending on the violations, you may be entitled to $1,000-$100,000+ in statutory damages, actual damages, and attorney\'s fees.',
      },
    },
  ],
};

export default async function HomePage() {
  const t = await getTranslations('home');

  const violations = [
    { quote: t('violation1Quote'), title: t('violation1Title'), description: t('violation1Description') },
    { quote: t('violation2Quote'), title: t('violation2Title'), description: t('violation2Description') },
    { quote: t('violation3Quote'), title: t('violation3Title'), description: t('violation3Description') },
    { quote: t('violation4Quote'), title: t('violation4Title'), description: t('violation4Description') },
    { quote: t('violation5Quote'), title: t('violation5Title'), description: t('violation5Description') },
    { quote: t('violation6Quote'), title: t('violation6Title'), description: t('violation6Description') },
  ];

  const faqPreviews = [
    { q: t('faqPreview1Q'), a: t('faqPreview1A') },
    { q: t('faqPreview2Q'), a: t('faqPreview2A') },
    { q: t('faqPreview3Q'), a: t('faqPreview3A') },
    { q: t('faqPreview4Q'), a: t('faqPreview4A') },
  ];

  return (
    <LoadingScreen>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Background video */}
        <video
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/loading-screen.mp4" type="video/mp4" />
        </video>
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/75" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {t.rich('heroTitle', {
                highlight: (chunks) => <span className="text-[#3474BA] dark:text-blue-300">{chunks}</span>,
              })}
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-gray-900 dark:text-gray-100 font-semibold">
              {t('heroAmount')}
            </p>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('heroDescription')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/claim">
                <Button variant="consumer" size="lg" className="text-lg px-8 py-4">
                  {t('ctaButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#3474BA] dark:text-blue-400" />
                {t('badgeFreeReview')}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#3474BA] dark:text-blue-400" />
                {t('badgeNoObligation')}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#3474BA] dark:text-blue-400" />
                {t('badgeNationwide')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-[#1B2A4A] py-10" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 160px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            {[
              { icon: DollarSign, titleKey: 'value1Title', descKey: 'value1Description' },
              { icon: UserCheck, titleKey: 'value2Title', descKey: 'value2Description' },
              { icon: Lock, titleKey: 'value3Title', descKey: 'value3Description' },
              { icon: Shield, titleKey: 'value4Title', descKey: 'value4Description' },
              { icon: Scale, titleKey: 'value5Title', descKey: 'value5Description' },
              { icon: Clock, titleKey: 'value6Title', descKey: 'value6Description' },
            ].map((item) => (
              <div key={item.titleKey} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <item.icon className="h-5 w-5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t(item.titleKey)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-800" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{t('howItWorksTitle')}</h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">{t('howItWorksSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileSearch,
                step: '1',
                title: t('step1Title'),
                description: t('step1Description'),
              },
              {
                icon: Shield,
                step: '2',
                title: t('step2Title'),
                description: t('step2Description'),
              },
              {
                icon: UserCheck,
                step: '3',
                title: t('step3Title'),
                description: t('step3Description'),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 text-center hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#3474BA]/10 text-[#3474BA] dark:text-blue-400 mb-4">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5A623] text-gray-900 flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Violations */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-900" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {t('violationsTitle')}
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
              {t('violationsSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {violations.map((item) => (
              <Link
                key={item.title}
                href="/claim"
                className="block bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700 hover:border-[#3474BA] hover:shadow-md transition-all group"
              >
                <p className="text-[#3474BA] dark:text-blue-300 font-medium italic mb-3">{item.quote}</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                  {item.title}
                  <ChevronRight className="h-4 w-4 text-[#F5A623] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency — Statute of Limitations */}
      <section className="py-12 sm:py-16 bg-[#FEF3C7] border-y border-[#F5A623]/30" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5A623]/20">
                <Clock className="h-8 w-8 text-[#F5A623]" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('urgencyTitle')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.rich('urgencyDescription', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <Link href="/claim" className="inline-flex items-center gap-1 mt-3 text-[#2B5EA2] dark:text-blue-300 font-semibold hover:underline">
                {t('urgencyLink')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-800" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('trustTitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('trustSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3474BA]/10 text-[#3474BA] dark:text-blue-400 mb-4">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('trustLicensedTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('trustLicensedDescription')}</p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3474BA]/10 text-[#3474BA] dark:text-blue-400 mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('trustProtectedTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('trustProtectedDescription')}</p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3474BA]/10 text-[#3474BA] dark:text-blue-400 mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('trustNoFeeTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('trustNoFeeDescription')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-100 dark:border-slate-700">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">{t('trustProtectedBy')}</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">UCC Article 9</p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">{t('trustEnforcedBy')}</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">FDCPA</p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">{t('trustMilitaryProtection')}</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">SCRA</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-900" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('faqPreviewTitle')}</h2>
          </div>
          <div className="space-y-4">
            {faqPreviews.map((item) => (
              <details
                key={item.q}
                className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-slate-700">
                  {item.q}
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-[#3474BA] dark:text-blue-300 font-medium hover:underline">
              {t('viewAllFaqs')}
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 bg-[#3474BA]" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-lg text-white mb-8">
            {t('finalCtaDescription')}
          </p>
          <Link href="/claim">
            <Button
              size="lg"
              className="bg-[#F5A623] hover:bg-[#E09612] text-gray-900 text-lg px-8 py-4"
            >
              {t('finalCtaButton')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </LoadingScreen>
  );
}
