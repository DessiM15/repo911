import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about wrongful vehicle repossession, your legal rights, and how Repo911 connects you with attorneys.',
};

const faqs = [
  {
    category: 'About Repo911',
    questions: [
      {
        q: 'What is Repo911?',
        a: 'Repo911 is a free service that helps people who have experienced wrongful vehicle repossession. We screen your case to identify potential legal violations, then connect you with a licensed attorney in your state who specializes in consumer protection law.',
      },
      {
        q: 'Is Repo911 a law firm?',
        a: 'No. Repo911 is not a law firm and does not provide legal advice. We are a lead generation and attorney matching service. We help you understand whether your rights may have been violated and connect you with independent licensed attorneys who can provide legal representation.',
      },
      {
        q: 'Does it cost me anything to submit my case?',
        a: 'No. Submitting your case through our intake form is completely free. There is no cost or obligation. If an attorney reviews your case and agrees to represent you, most work on a contingency basis, meaning you pay nothing unless they win your case.',
      },
    ],
  },
  {
    category: 'Wrongful Repossession',
    questions: [
      {
        q: 'What is wrongful repossession?',
        a: 'Wrongful repossession occurs when a lender or repo company violates federal or state laws during the process of repossessing your vehicle. This can include breaching the peace, entering locked property, keeping your personal belongings, failing to provide required notices, or violating debt collection laws.',
      },
      {
        q: 'What is a "breach of peace" during repossession?',
        a: 'A breach of peace occurs when a repo agent uses force, threats, or intimidation during repossession, continues after you verbally object, enters a locked garage or gated area, causes excessive noise or disturbance, damages your property, or causes a public scene. Under UCC Article 9, repossession must be conducted peacefully.',
      },
      {
        q: 'Can the repo company take my personal belongings?',
        a: 'No. Your personal property inside the vehicle (tools, electronics, clothing, child car seats, etc.) must be returned to you. If the repo company kept your belongings, refused to return them, or charged you a fee to get them back, that may be a violation of your rights.',
      },
      {
        q: 'Do I have to be behind on payments for my car to be repossessed?',
        a: 'In most states, a lender can initiate repossession after a single missed payment if the loan agreement allows it. However, many states require the lender to send you a "right to cure" notice first, giving you an opportunity to catch up on payments before repossession. If you did not receive this notice, the repossession may have been wrongful.',
      },
      {
        q: 'What if I was on active military duty when my car was repossessed?',
        a: 'The Servicemembers Civil Relief Act (SCRA) provides special protections for active duty military members. If your vehicle loan was taken out before you entered active duty, the lender generally cannot repossess your vehicle without a court order. Violations of the SCRA can result in significant penalties.',
      },
      {
        q: 'What is the FDCPA and how does it apply to repossession?',
        a: 'The Fair Debt Collection Practices Act (FDCPA) prohibits debt collectors from using abusive, unfair, or deceptive practices. If a debt collector or repo company called you at unreasonable hours, used threats or profanity, contacted your employer, misrepresented the amount owed, or harassed you, they may have violated the FDCPA.',
      },
    ],
  },
  {
    category: 'The Process',
    questions: [
      {
        q: 'How does the case review process work?',
        a: 'After you submit your information through our intake form, our system analyzes your responses to identify potential legal violations. Your case is assigned a qualification tier (based on the strength of the indicators), and qualified cases are made available to licensed attorneys in our network who specialize in your type of case.',
      },
      {
        q: 'How long does it take to hear back?',
        a: 'For cases with strong indicators of legal violations, you can typically expect to hear from an attorney within 24 hours. For other cases, it may take 24-48 hours or longer. In some cases, an attorney may not claim the case, but we will let you know either way.',
      },
      {
        q: 'What happens after an attorney claims my case?',
        a: 'The attorney will contact you directly using the contact information you provided. They will discuss the details of your situation, explain your legal options, and determine whether they can represent you. If you agree to move forward, the attorney will handle all legal proceedings on your behalf.',
      },
      {
        q: 'What if no attorney claims my case?',
        a: 'Not every case will be claimed by an attorney. If your case is not claimed, it does not necessarily mean you do not have a valid claim. We recommend consulting with a local consumer protection attorney who can review your specific situation. Many attorneys offer free initial consultations.',
      },
    ],
  },
  {
    category: 'Legal & Compensation',
    questions: [
      {
        q: 'What kind of compensation can I receive?',
        a: 'Compensation varies depending on the type and severity of violations. You may be entitled to actual damages (value of the vehicle, lost property, expenses), statutory damages under the FDCPA (up to $1,000 per violation), punitive damages in some cases, and attorney fees. An attorney can give you a more specific estimate based on your situation.',
      },
      {
        q: 'Do I have to pay the attorney upfront?',
        a: 'Most attorneys in our network work on a contingency fee basis, meaning they only get paid if they win your case. The attorney fee typically comes out of the settlement or judgment, so you pay nothing out of pocket. The specific fee arrangement is between you and the attorney.',
      },
      {
        q: 'Is there a time limit to file a wrongful repossession claim?',
        a: 'Yes. Statutes of limitations vary by state and by the type of claim. FDCPA claims generally must be filed within one year of the violation. State law claims may have different time limits. It is important to act quickly — the sooner you submit your case, the better your chances of a successful outcome.',
      },
      {
        q: 'Does submitting a form create an attorney-client relationship?',
        a: 'No. Submitting the intake form does not create an attorney-client relationship with Repo911 or with any attorney. An attorney-client relationship is only formed when you and a specific attorney mutually agree to representation, typically through a signed retainer agreement.',
      },
    ],
  },
  {
    category: 'Privacy & Data',
    questions: [
      {
        q: 'How is my information protected?',
        a: 'We take your privacy seriously. Your information is encrypted in transit and at rest, stored securely using industry-standard practices, and only shared with licensed attorneys who claim your case. We never sell your personal information for marketing purposes. See our Privacy Policy for full details.',
      },
      {
        q: 'Who will see my information?',
        a: 'Your information is only shared with licensed attorneys in our network who are reviewing or claiming your case. Before an attorney claims your case, they see only anonymized details (no name, email, phone, or address). Full contact information is only revealed after an attorney claims the case.',
      },
      {
        q: 'Can I delete my information?',
        a: 'Yes. You have the right to request deletion of your personal data at any time by contacting us at privacy@repo911.com. Some information may be retained as required by law or for ongoing legal matters.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Find answers to common questions about wrongful repossession and how Repo911 can help.
        </p>
      </div>

      <div className="space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
              {section.category}
            </h2>
            <div className="space-y-6">
              {section.questions.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-800 p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Still Have Questions?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The best way to find out if you have a case is to submit our free intake form. It only takes 5 minutes.
        </p>
        <Link href="/claim">
          <Button variant="primary">
            Start Your Free Case Review <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>
          For other questions, contact us at{' '}
          <a href="mailto:support@repo911.com" className="text-[#3474BA] dark:text-blue-300 underline">support@repo911.com</a>.
        </p>
      </div>
    </div>
  );
}
