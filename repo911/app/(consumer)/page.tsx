import Link from 'next/link';
import { Shield, FileSearch, UserCheck, ArrowRight, ChevronRight, Clock, Lock, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function HomePage() {
  return (
    <>
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
      <section className="relative bg-gradient-to-br from-[#4A90D9]/5 via-white to-[#F5A623]/5 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Was Your Car{' '}
              <span className="text-[#4A90D9]">Wrongfully Repossessed?</span>
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-gray-900 font-semibold">
              You May Be Owed $10,000–$100,000+
            </p>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Even if you missed payments, the repo company may have broken the law.
              Find out in 5 minutes — it&apos;s 100% free.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/claim">
                <Button variant="consumer" size="lg" className="text-lg px-8 py-4">
                  Check My Case Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#4A90D9]" />
                Free Case Review
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#4A90D9]" />
                No Obligation
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#4A90D9]" />
                Nationwide Coverage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="bg-[#1B2A4A] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-gray-300 mt-1">Free Case Review</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">50</p>
              <p className="text-sm text-gray-300 mt-1">States Covered</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">5 Min</p>
              <p className="text-sm text-gray-300 mt-1">Quick Questionnaire</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">24-48 Hr</p>
              <p className="text-sm text-gray-300 mt-1">Attorney Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-lg text-gray-500">Three simple steps to find out if you have a case</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileSearch,
                step: '1',
                title: 'Tell Us What Happened',
                description:
                  'Fill out our simple questionnaire about your repossession experience. It takes about 5 minutes.',
              },
              {
                icon: Shield,
                step: '2',
                title: 'We Review Your Case',
                description:
                  'Our system analyzes your situation against federal and state repossession laws to determine if your rights were violated.',
              },
              {
                icon: UserCheck,
                step: '3',
                title: 'Get Connected to an Attorney',
                description:
                  'If you have a case, we connect you with a licensed attorney in your state who can fight for your compensation. No fees unless you win.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-gray-50 rounded-2xl p-8 text-center hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#4A90D9]/10 text-[#4A90D9] mb-4">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5A623] text-white flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Violations */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Did Any of This Happen to You?
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              These are common violations that may entitle you to compensation
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: '"The repo man broke into my garage"',
                violation: 'Illegal Entry',
                description: 'Entering a locked or gated area without permission is a breach of peace under UCC Article 9.',
              },
              {
                quote: '"I told them to stop but they took it anyway"',
                violation: 'Breach of Peace',
                description: 'If you verbally objected and they continued, the repossession may be unlawful.',
              },
              {
                quote: '"They kept all my personal belongings"',
                violation: 'Property Violation',
                description: 'Lenders and repo companies are required to return your personal belongings.',
              },
              {
                quote: '"I was on active military duty"',
                violation: 'SCRA Violation',
                description: 'Active-duty military members have special protections against repossession under federal law.',
              },
              {
                quote: '"They called me at 3am threatening me"',
                violation: 'FDCPA Violation',
                description: 'Debt collectors cannot call outside certain hours or use threats and harassment.',
              },
              {
                quote: '"They caused a huge scene in front of everyone"',
                violation: 'Public Embarrassment',
                description: 'Creating a public disturbance during repossession can constitute a breach of peace.',
              },
            ].map((item) => (
              <Link
                key={item.violation}
                href="/claim"
                className="block bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-[#4A90D9] hover:shadow-md transition-all group"
              >
                <p className="text-[#4A90D9] font-medium italic mb-3">{item.quote}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-1">
                  {item.violation}
                  <ChevronRight className="h-4 w-4 text-[#F5A623] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency — Statute of Limitations */}
      <section className="py-12 sm:py-16 bg-[#FEF3C7] border-y border-[#F5A623]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5A623]/20">
                <Clock className="h-8 w-8 text-[#F5A623]" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Time May Be Running Out on Your Claim
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Most states have a <strong>statute of limitations</strong> on wrongful repossession claims — typically 2-4 years from the date of repossession. Once this window closes, you may lose your right to compensation forever. The sooner you act, the stronger your case.
              </p>
              <Link href="/claim" className="inline-flex items-center gap-1 mt-3 text-[#4A90D9] font-semibold hover:underline">
                Check your case now before it&apos;s too late <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Consumers Trust Repo911
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We connect you with experienced attorneys who specialize in wrongful repossession and consumer protection law.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4A90D9]/10 text-[#4A90D9] mb-4">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Licensed Attorneys Only</h3>
              <p className="text-sm text-gray-600">Every attorney in our network is licensed and verified in their state.</p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4A90D9]/10 text-[#4A90D9] mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Info Is Protected</h3>
              <p className="text-sm text-gray-600">Your personal information is encrypted and only shared with your matched attorney.</p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4A90D9]/10 text-[#4A90D9] mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Win, No Fee</h3>
              <p className="text-sm text-gray-600">Attorneys typically work on contingency — you pay nothing unless you win your case.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 pt-8 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">Protected by</p>
              <p className="text-lg font-bold text-gray-700 mt-1">UCC Article 9</p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">Enforced by</p>
              <p className="text-lg font-bold text-gray-700 mt-1">FDCPA</p>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider">Military Protection</p>
              <p className="text-lg font-bold text-gray-700 mt-1">SCRA</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Can I still have a case if I missed payments?',
                a: 'Yes. Even if you were behind on payments, the repo company must follow the law. If they breached the peace, entered a locked area, or violated other rules, you may have a valid claim.',
              },
              {
                q: 'How much does it cost to use Repo911?',
                a: 'Nothing. Our case review is 100% free. If an attorney takes your case, they typically work on a contingency basis — meaning no fees unless you win.',
              },
              {
                q: 'How long does the case review take?',
                a: 'The online questionnaire takes about 5 minutes. Our system reviews your case immediately, and if qualified, an attorney could reach out within 24-48 hours.',
              },
              {
                q: 'What kind of compensation can I receive?',
                a: 'Depending on the violations, you may be entitled to $1,000-$100,000+ in statutory damages, actual damages, and attorney\'s fees.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-gray-900 font-medium hover:bg-gray-50">
                  {item.q}
                  <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-[#4A90D9] font-medium hover:underline">
              View all frequently asked questions
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 bg-[#4A90D9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Out If You Have a Case?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            It only takes 5 minutes and it&apos;s completely free. No obligation.
          </p>
          <Link href="/claim">
            <Button
              size="lg"
              className="bg-[#F5A623] hover:bg-[#E09612] text-white text-lg px-8 py-4"
            >
              Check My Case Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
