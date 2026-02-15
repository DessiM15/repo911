import type { Metadata } from 'next';
import Link from 'next/link';
import { EnglishOnlyNotice } from '@/components/layout/EnglishOnlyNotice';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Legal disclaimer — Repo911 is a lead generation service, not a law firm. No attorney-client relationship is formed by using this site.',
};

export default function DisclaimerPage() {
  return (
    <>
    <EnglishOnlyNotice />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Legal Disclaimer</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-900 font-semibold text-lg mb-3">Important Notice</p>
          <p className="text-amber-800">
            Repo911 is not a law firm and does not provide legal advice. The information on this website is for general informational purposes only and should not be construed as legal advice.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">No Attorney-Client Relationship</h2>
          <p>No attorney-client relationship is formed by submitting an inquiry through this website, viewing content on this website, or using any of our services. An attorney-client relationship can only be established through a direct, mutual agreement between you and a licensed attorney.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">General Information Only</h2>
          <p>The information provided on this website, including information about wrongful repossession laws, the Fair Debt Collection Practices Act (FDCPA), the Servicemembers Civil Relief Act (SCRA), and UCC Article 9, is provided for general educational purposes only. Laws vary by state and change over time. This information may not reflect the current state of the law in your jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">No Guarantee of Results</h2>
          <p>Past results do not guarantee future outcomes. Every case is unique, and the outcome of your case depends on the specific facts and circumstances involved, as well as the applicable laws in your state. Repo911 does not guarantee that:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Your case qualifies for legal representation</li>
            <li>An attorney will review or claim your case</li>
            <li>You will receive any particular outcome or compensation</li>
            <li>Any legal action will be successful</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">Consent to Contact</h2>
          <p>By submitting your information through our intake form, you consent to being contacted by Repo911 and licensed attorneys in our network via phone, email, or text message regarding your potential case. You may opt out of communications at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">Third-Party Attorneys</h2>
          <p>Attorneys in the Repo911 network are independent legal professionals. Repo911 does not control, supervise, or direct the legal services they provide. Any representation agreement is between you and the attorney directly.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">Seek Professional Advice</h2>
          <p>If you believe your vehicle was wrongfully repossessed, we strongly encourage you to consult with a licensed attorney in your state who can provide personalized legal advice based on the specific details of your situation.</p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400">
          <p>
            For more information, please review our{' '}
            <Link href="/privacy" className="text-[#3474BA] underline">Privacy Policy</Link> and{' '}
            <Link href="/terms" className="text-[#3474BA] underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
