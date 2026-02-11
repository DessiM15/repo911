import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, Phone, ArrowRight, Info, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Submission Confirmed',
  description: 'Your wrongful repossession case has been submitted for review. An attorney may reach out to you soon.',
  robots: { index: false },
};

function getTierContent(tier: string | null) {
  switch (tier) {
    case 'hot':
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-50 border-green-200',
        title: 'Great News — You Likely Have a Strong Case!',
        description:
          'Based on the information you provided, your situation shows strong indicators of legal violations. An attorney from our network will be reaching out to you shortly to discuss your case.',
        nextSteps: [
          'A licensed attorney in your state will contact you within 24 hours.',
          'Have your loan documents and any evidence ready to share.',
          'The attorney consultation is free — you pay nothing unless they win your case.',
        ],
      };
    case 'warm':
      return {
        icon: CheckCircle,
        iconColor: 'text-[#4A90D9]',
        bgColor: 'bg-blue-50 border-blue-200',
        title: 'Your Case Shows Promise!',
        description:
          'Based on the information you provided, your situation shows potential legal violations that an attorney should review. We are working to connect you with a licensed attorney in your state.',
        nextSteps: [
          'An attorney will review your case and may reach out within 24-48 hours.',
          'Gather any documents related to your loan and the repossession.',
          'If an attorney takes your case, you pay nothing unless they win.',
        ],
      };
    case 'cold':
      return {
        icon: Clock,
        iconColor: 'text-[#4A90D9]',
        bgColor: 'bg-blue-50 border-blue-200',
        title: 'Your Case Has Been Submitted for Review',
        description:
          'Thank you for sharing your experience. While the initial indicators are less clear, an attorney may still find violations that warrant legal action. We will be in touch if an attorney is interested in reviewing your case further.',
        nextSteps: [
          'Your case will be available for attorney review.',
          'If an attorney is interested, they will contact you directly.',
          'In the meantime, keep all documents and evidence related to your repossession.',
        ],
      };
    default:
      return {
        icon: Info,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-50 border-gray-200',
        title: 'Thank You for Your Submission',
        description:
          'Based on the information you provided, your situation may not meet the typical criteria for a wrongful repossession claim. However, every case is different, and we recommend consulting with a local attorney for a personalized review of your situation.',
        nextSteps: [
          'Consider consulting with a local consumer protection attorney.',
          'Many attorneys offer free initial consultations.',
          'Keep all documents related to your repossession for your records.',
        ],
      };
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; id?: string }>;
}) {
  const { tier = null, id = null } = await searchParams;
  const content = getTierContent(tier);
  const Icon = content.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8">
        <Icon className={`h-16 w-16 mx-auto mb-4 ${content.iconColor}`} />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{content.title}</h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">{content.description}</p>
      </div>

      <div className={`rounded-xl border p-6 mb-8 ${content.bgColor}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          What Happens Next
        </h2>
        <ul className="space-y-3">
          {content.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-gray-700">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">Important Reminders</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>- Do not sign anything from your lender or repo company without consulting an attorney.</li>
          <li>- Keep records of all communication with your lender, repo company, and debt collectors.</li>
          <li>- If you receive a deficiency balance notice, do not pay it without legal advice.</li>
          <li>- Write down everything you remember about the repossession while it is still fresh.</li>
        </ul>
      </div>

      {id && (
        <div className="bg-[#F5A623]/10 rounded-xl border-2 border-[#F5A623] p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#F5A623]" />
            Upload Your Evidence
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Strengthen your case by uploading photos, videos, or documents related to your repossession.
            You can upload up to 5 files (images or PDFs, 10MB each).
          </p>
          <div className="bg-white rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Your Case ID (save this)</p>
            <p className="font-mono text-sm text-gray-900 select-all break-all">{id}</p>
          </div>
          <Link href={`/track?id=${id}`}>
            <Button variant="consumer" size="lg" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload Evidence & Track Your Case
            </Button>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
        <Link href={id ? `/track?id=${id}` : '/track'}>
          <Button variant="primary">
            Upload Evidence & Track Case <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        This is not legal advice. Submitting this form does not create an attorney-client relationship.
        Results vary based on individual circumstances and applicable law.
      </p>
    </div>
  );
}
