import type { Metadata } from 'next';
import { EnglishOnlyNotice } from '@/components/layout/EnglishOnlyNotice';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Repo911 Privacy Policy — how we collect, use, and protect your information when you submit a wrongful repossession case review.',
};

export default function PrivacyPage() {
  return (
    <>
    <EnglishOnlyNotice />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 text-center mb-8">Last updated: February 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
          <p>When you use Repo911, we collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, mailing address, and other contact details you provide through our intake form.</li>
            <li><strong>Case Information:</strong> Details about your vehicle, loan, repossession experience, military service status, and related circumstances.</li>
            <li><strong>Uploaded Files:</strong> Photos, videos, and documents you choose to upload as evidence.</li>
            <li><strong>Technical Information:</strong> IP address, browser type, device information, and cookies for website functionality and analytics.</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on site, and interaction patterns to improve our service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Evaluate your repossession case using our qualification system</li>
            <li>Connect you with licensed attorneys in your state who may be able to assist with your case</li>
            <li>Communicate with you about your case status and next steps</li>
            <li>Process payments and manage attorney-client matching</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Information Sharing</h2>
          <p>We share your information only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>With Licensed Attorneys:</strong> When an attorney claims your lead through our marketplace, they receive your contact information and case details to evaluate and potentially represent you. You consent to this sharing when submitting the intake form.</li>
            <li><strong>Service Providers:</strong> We use trusted third-party services including Supabase (database hosting), Stripe (payment processing), Vercel (website hosting), and Resend (email delivery). These providers only access data necessary to perform their services.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or government regulation.</li>
          </ul>
          <p className="mt-2">We do not sell your personal information to third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Retention</h2>
          <p>We retain your information for as long as necessary to provide our services and fulfill the purposes described in this policy. Lead data is retained for a minimum of 3 years to support ongoing legal matters. You may request deletion of your data at any time (see Your Rights below).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal retention requirements</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact us at privacy@repo911.com.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Security</h2>
          <p>We implement industry-standard security measures to protect your information, including encryption in transit (TLS/SSL), encrypted database storage, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Cookies</h2>
          <p>We use essential cookies for website functionality and authentication. We may also use analytics cookies to understand how visitors interact with our site. You can control cookie preferences through your browser settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. California Consumer Privacy Act (CCPA)</h2>
          <p>If you are a California resident, you have additional rights under the CCPA, including the right to know what personal information is collected, the right to request deletion, and the right to opt-out of the sale of personal information. We do not sell personal information. To exercise your CCPA rights, contact us at privacy@repo911.com.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised date.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Contact Us</h2>
          <p>For privacy-related questions or requests, contact us at:</p>
          <p className="mt-2">Email: privacy@repo911.com</p>
        </section>
      </div>
    </div>
    </>
  );
}
