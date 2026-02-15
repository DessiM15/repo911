import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Search, Scale, ArrowRight, Shield, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Repo911 helps you fight wrongful vehicle repossession in 3 simple steps: submit your case, get reviewed, and connect with an attorney.',
};

const steps = [
  {
    icon: ClipboardList,
    number: '1',
    title: 'Tell Us What Happened',
    description:
      'Fill out our simple questionnaire about your repossession experience. It takes about 5 minutes. We will ask about the circumstances of your repossession, how the repo company behaved, and whether your rights may have been violated.',
    details: [
      'Describe the circumstances of your repossession',
      'Tell us about any aggressive or illegal behavior',
      'Upload any evidence you have (photos, documents, videos)',
      'Provide your contact information so an attorney can reach you',
    ],
  },
  {
    icon: Search,
    number: '2',
    title: 'We Review Your Case',
    description:
      'Our system analyzes your situation against federal and state repossession laws to determine if your rights were violated. We check for violations of the UCC, FDCPA, SCRA, and state consumer protection laws.',
    details: [
      'Your case is evaluated for breach of peace violations',
      'We check for FDCPA and debt collection violations',
      'Military service members are screened for SCRA protections',
      'Your case is assigned a qualification tier based on violation strength',
    ],
  },
  {
    icon: Scale,
    number: '3',
    title: 'Get Connected to an Attorney',
    description:
      'If your case shows signs of legal violations, we connect you with a licensed attorney in your state who specializes in consumer protection law. They will review your case and fight for your compensation.',
    details: [
      'A licensed attorney in your state reviews your case',
      'The attorney contacts you directly to discuss next steps',
      'You pay nothing unless the attorney wins your case',
      'The attorney handles all legal proceedings on your behalf',
    ],
  },
];

const trustPoints = [
  {
    icon: Shield,
    title: 'Free Case Review',
    description: 'There is no cost to submit your case for review. You only pay if an attorney takes your case and wins.',
  },
  {
    icon: Clock,
    title: 'Fast Response',
    description: 'Qualified cases are matched with attorneys quickly. Most consumers hear back within 24-48 hours.',
  },
  {
    icon: DollarSign,
    title: 'No Upfront Fees',
    description: 'Attorneys in our network work on contingency. You pay nothing out of pocket — they only get paid if you win.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">How Repo911 Works</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We make it easy to find out if your vehicle was wrongfully repossessed and connect you with an attorney who can help — all in three simple steps.
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
                    <span className="text-sm font-semibold text-[#3474BA] dark:text-blue-300 uppercase tracking-wide">Step {step.number}</span>
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Common Repossession Violations</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              quote: '"The repo man broke into my garage"',
              violation: 'Illegal Entry',
              description: 'Repo agents cannot enter locked structures like garages, gated properties, or closed buildings to seize a vehicle.',
            },
            {
              quote: '"I told them to stop but they took it anyway"',
              violation: 'Breach of Peace',
              description: 'If you verbally object to the repossession and the agent continues, it may constitute an illegal breach of peace.',
            },
            {
              quote: '"They kept all my personal belongings"',
              violation: 'Property Violation',
              description: 'Your personal property inside the vehicle must be returned to you. Charging fees to return belongings may also be illegal.',
            },
            {
              quote: '"I was on active military duty"',
              violation: 'SCRA Violation',
              description: 'The Servicemembers Civil Relief Act provides special protections for active duty military. Repossession without a court order may be illegal.',
            },
            {
              quote: '"They called me at 3am threatening me"',
              violation: 'FDCPA Violation',
              description: 'The Fair Debt Collection Practices Act prohibits harassment, threats, and calls at unreasonable hours by debt collectors.',
            },
            {
              quote: '"I never received any written notice"',
              violation: 'Notice Violation',
              description: 'Many states require lenders to send a right-to-cure notice before repossession. Failing to do so may make the repo illegal.',
            },
          ].map((item) => (
            <div key={item.violation} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-2">{item.quote}</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.violation}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-[#3474BA] rounded-xl p-8 sm:p-10">
        <h2 className="text-2xl font-bold text-white mb-3">Think Your Rights Were Violated?</h2>
        <p className="text-white mb-6 max-w-lg mx-auto">
          It only takes 5 minutes to find out if you have a case. Our free case review costs you nothing and could be worth thousands.
        </p>
        <Link href="/claim">
          <Button variant="secondary" size="lg">
            Check My Case Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-8">
        This is not legal advice. Repo911 is not a law firm and does not provide legal representation.
        Results vary based on individual circumstances and applicable law.
      </p>
    </div>
  );
}
