import type { Metadata } from 'next';
import { EnglishOnlyNotice } from '@/components/layout/EnglishOnlyNotice';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Repo911 Terms of Service — the terms and conditions governing your use of our wrongful repossession case review platform.',
};

export default function TermsPage() {
  return (
    <>
    <EnglishOnlyNotice />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">Last updated: February 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">1. About Repo911</h2>
          <p>Repo911 is a lead generation and attorney matching service. <strong>Repo911 is not a law firm and does not provide legal advice.</strong> We connect consumers who may have experienced wrongful vehicle repossession with licensed attorneys who specialize in consumer protection law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">2. No Attorney-Client Relationship</h2>
          <p>Submitting an intake form or using any part of this website does not create an attorney-client relationship between you and Repo911, or between you and any attorney in our network. An attorney-client relationship is only formed when you and a specific attorney mutually agree to representation, typically through a signed retainer or engagement agreement.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">3. Consumer Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>You agree that all information submitted through the intake form is true and accurate to the best of your knowledge.</li>
            <li>You consent to being contacted by Repo911 and attorneys in our network regarding your case.</li>
            <li>You understand that case outcomes are not guaranteed and depend on individual circumstances and applicable law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">4. Attorney Matching</h2>
          <p>When your case qualifies based on our screening criteria, it is made available to licensed attorneys in our network. An attorney may review and claim your case, at which point they will contact you directly. Repo911 does not guarantee that an attorney will claim your case or that your case has legal merit.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">5. Attorney Fee Structure</h2>
          <p>Attorneys in our network pay a lead purchase fee to Repo911 to claim and receive qualified leads. These arrangements are between Repo911 and the attorney and do not affect any fees or costs that may apply between you and your attorney.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">6. Limitation of Liability</h2>
          <p>Repo911 is not responsible for the actions, advice, or representation provided by any attorney in our network. We do not guarantee the outcome of any legal matter. Our liability is limited to the maximum extent permitted by law. In no event shall Repo911 be liable for indirect, incidental, special, or consequential damages arising from use of our service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">7. Dispute Resolution</h2>
          <p>Any disputes arising from or related to these Terms of Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. Both parties waive the right to a jury trial and the right to participate in class action lawsuits.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">8. Account Termination</h2>
          <p>Repo911 reserves the right to terminate or suspend access to our platform for any user or attorney who violates these terms, engages in fraudulent activity, or otherwise misuses the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">9. Modifications</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Material changes will be communicated through the website. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">10. Governing Law</h2>
          <p>These Terms of Service are governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">11. Contact</h2>
          <p>For questions about these Terms of Service, contact us at legal@repo911.com.</p>
        </section>
      </div>
    </div>
    </>
  );
}
