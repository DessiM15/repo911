'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface FeeAgreementProps {
  onSign: (signature: string) => void;
  loading?: boolean;
}

export function FeeAgreement({ onSign, loading }: FeeAgreementProps) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setScrolledToBottom(true);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Attorney Lead Purchase Agreement</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please read the following agreement carefully. You must scroll to the bottom and sign to continue.
        </p>
      </div>

      <div
        onScroll={handleScroll}
        className="h-80 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-lg p-6 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4"
      >
        <p className="font-bold text-center text-gray-900 text-base">
          REPO911
        </p>
        <p className="font-bold text-center text-gray-900 text-base -mt-2">
          ATTORNEY LEAD PURCHASE AGREEMENT
        </p>

        <p>
          This Attorney Lead Purchase Agreement (&quot;Agreement&quot;) is entered into between{' '}
          <strong>Repo911, LLC</strong> (&quot;Company&quot;) and the undersigned licensed attorney or
          law firm (&quot;Attorney&quot;) as of the date of electronic execution below (the
          &quot;Effective Date&quot;).
        </p>

        <p className="font-semibold text-gray-900">1. Purpose and Scope</p>
        <p>
          Repo911 operates a digital lead generation platform that connects consumers who may have
          experienced wrongful vehicle repossession with licensed attorneys (&quot;Platform&quot;).
          This Agreement governs the purchase of consumer leads by Attorney through the Platform.{' '}
          <strong>
            This Agreement is a marketing services arrangement. Company does not share in, and has no
            claim to, any legal fees, settlements, judgments, or other compensation earned by Attorney
            from cases arising from leads purchased through the Platform.
          </strong>
        </p>

        <p className="font-semibold text-gray-900">2. Lead Pricing and Payment</p>

        <p>
          <strong>2.1 Payment Options.</strong> Attorney shall select one of the following payment
          plans upon registration with the Platform: (a) the Per-Lead Purchase Plan (Section 2.2),
          or (b) the Monthly Subscription Plan (Section 2.3). Attorney may switch between payment
          plans with thirty (30) days&apos; written notice to Company, effective at the start of the
          next billing cycle.
        </p>

        <p>
          <strong>2.2 Option A — Per-Lead Purchase Plan.</strong>
        </p>
        <p>
          Under the Per-Lead Purchase Plan, Attorney agrees to pay the applicable lead purchase fee
          at the time of each lead claim according to the following schedule:
        </p>
        <table className="w-full text-sm border border-gray-200 my-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Lead Tier</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Price Per Lead</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Hot Lead</td>
              <td className="border border-gray-200 px-3 py-2">$1,000</td>
              <td className="border border-gray-200 px-3 py-2">Consumer actively seeking legal representation; verified contact within 24 hours; confirmed wrongful repo facts.</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Warm Lead</td>
              <td className="border border-gray-200 px-3 py-2">$600</td>
              <td className="border border-gray-200 px-3 py-2">Consumer has expressed interest in legal help; basic facts gathered; contact information verified.</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Cold Lead</td>
              <td className="border border-gray-200 px-3 py-2">$300</td>
              <td className="border border-gray-200 px-3 py-2">Consumer inquiry received; minimal vetting; contact information provided but not independently verified.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Per-lead fees are due at the time of lead claim and are processed through the
          Platform&apos;s payment system. Attorney must maintain a valid payment method on file.
        </p>

        <p>
          <strong>2.3 Option B — Monthly Subscription Plan.</strong>
        </p>
        <table className="w-full text-sm border border-gray-200 my-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Plan</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Monthly Fee</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Includes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Repo911 Subscription</td>
              <td className="border border-gray-200 px-3 py-2">$2,000 / month</td>
              <td className="border border-gray-200 px-3 py-2">Unlimited access to all lead tiers (Hot, Warm, and Cold) for the duration of the subscription period.</td>
            </tr>
          </tbody>
        </table>
        <p>
          (a) The subscription fee is billed monthly in advance on the first day of each billing
          cycle and is processed through the Platform&apos;s payment system. Attorney must maintain a
          valid payment method on file.
        </p>
        <p>
          (b) The subscription grants Attorney unlimited access to claim leads across all tiers
          during the active subscription period. Lead exclusivity provisions under Section 3.1
          remain in full effect.
        </p>
        <p>
          (c) Subscription fees are non-refundable for any partial month. If Attorney terminates
          mid-cycle, access continues through the end of the current paid billing period.
        </p>
        <p>
          (d) Company reserves the right to implement reasonable fair-use limits on lead volume to
          prevent abuse of the subscription plan. Company will provide written notice before imposing
          any such limits.
        </p>

        <p>
          <strong>2.4 Refund Policy.</strong> Lead purchase fees and subscription fees are
          non-refundable except in the following circumstances: (a) the lead contains materially
          false or fabricated contact information attributable to Platform error; (b) the lead is a
          verified duplicate of a lead previously purchased by the same Attorney; or (c) the
          consumer had already retained counsel at the time the lead was generated. Refund requests
          must be submitted within seven (7) business days of lead purchase or discovery of the
          issue, with supporting documentation. Company will review and respond to refund requests
          within ten (10) business days. For subscription plan Attorneys, eligible refunds will be
          issued as account credits applied to the next billing cycle unless otherwise agreed.
        </p>

        <p>
          <strong>2.5 Pricing Changes.</strong> Company reserves the right to modify lead pricing or
          subscription fees with thirty (30) days&apos; prior written notice to Attorney. Continued
          use of the Platform after the effective date of any pricing change constitutes acceptance
          of the new pricing.
        </p>

        <p className="font-semibold text-gray-900">3. Lead Exclusivity and Use Restrictions</p>

        <p>
          <strong>3.1 Exclusive Leads.</strong> Each lead purchased through the Platform is exclusive
          to the purchasing Attorney. Company will not sell or distribute the same lead to any other
          attorney or law firm.
        </p>
        <p>
          <strong>3.2 Restrictions on Lead Use.</strong> Attorney shall not: (a) share, transfer,
          resell, or distribute lead information to any third party, including other attorneys or law
          firms, without prior written consent from Company; (b) use lead information for any
          purpose other than evaluating and potentially representing the consumer in a wrongful
          repossession matter; or (c) contact leads for the purpose of soliciting unrelated legal
          services unless the consumer independently requests such services.
        </p>
        <p>
          <strong>3.3 No Guarantee of Case Viability.</strong> Company makes no representations or
          warranties regarding the legal merit, viability, or value of any lead. Leads are
          informational referrals only. Attorney is solely responsible for evaluating the merits of
          any potential case and for all legal advice and services provided to consumers.
        </p>

        <p className="font-semibold text-gray-900">4. Attorney Representations and Compliance</p>

        <p>
          <strong>4.1 Licensure.</strong> Attorney represents and warrants that they are a licensed,
          active member of the bar in good standing in at least one U.S. jurisdiction, and that they
          are authorized to practice law in the jurisdiction(s) where they intend to represent
          consumers obtained through the Platform.
        </p>
        <p>
          <strong>4.2 Professional Conduct.</strong> Attorney agrees to comply with all applicable
          rules of professional conduct, including but not limited to rules governing attorney
          advertising, solicitation, and client communications, in each jurisdiction where Attorney
          practices.
        </p>
        <p>
          <strong>4.3 Insurance.</strong> Attorney represents and warrants that they maintain
          professional liability (malpractice) insurance with coverage limits reasonably adequate for
          their practice.
        </p>
        <p>
          <strong>4.4 Consumer Communication.</strong> Attorney agrees to make initial contact with
          each purchased lead within forty-eight (48) hours of purchase and to treat all consumer
          communications with professionalism and in accordance with applicable ethical rules.
        </p>

        <p className="font-semibold text-gray-900">5. Company Obligations</p>

        <p>
          <strong>5.1 Lead Quality Standards.</strong> Company will use commercially reasonable
          efforts to verify consumer contact information and to screen leads for basic indicia of a
          potential wrongful repossession claim before making them available on the Platform.
        </p>
        <p>
          <strong>5.2 Platform Availability.</strong> Company will use commercially reasonable
          efforts to maintain Platform availability but does not guarantee uninterrupted access.
          Company shall not be liable for any losses arising from temporary Platform unavailability.
        </p>
        <p>
          <strong>5.3 Data Security.</strong> Company will implement and maintain commercially
          reasonable administrative, technical, and physical safeguards to protect consumer and
          Attorney data stored on the Platform.
        </p>

        <p className="font-semibold text-gray-900">6. Data Privacy and Consumer Information</p>

        <p>
          <strong>6.1 Confidentiality.</strong> Attorney agrees to treat all consumer information
          received through the Platform as confidential and to handle such information in compliance
          with all applicable federal, state, and local privacy laws, including but not limited to
          the Texas Identity Theft Enforcement and Protection Act and any applicable provisions of
          the Gramm-Leach-Bliley Act.
        </p>
        <p>
          <strong>6.2 Data Retention.</strong> In the event Attorney declines to represent a consumer
          or the consumer declines representation, Attorney shall delete or securely destroy the
          consumer&apos;s personal information within thirty (30) days, unless retention is required
          by applicable law or rules of professional conduct.
        </p>
        <p>
          <strong>6.3 Consumer Consent.</strong> Company represents that it has obtained consent from
          each consumer to share their information with a licensed attorney for purposes of
          evaluating potential legal claims related to wrongful vehicle repossession.
        </p>

        <p className="font-semibold text-gray-900">7. Limitation of Liability</p>

        <p>
          <strong>7.1 Limitation.</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW,
          COMPANY&apos;S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL
          AMOUNT OF LEAD PURCHASE FEES PAID BY ATTORNEY TO COMPANY IN THE TWELVE (12) MONTHS
          PRECEDING THE CLAIM. IN NO EVENT SHALL COMPANY BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
          LOSS OF CLIENTS, OR REPUTATIONAL HARM, ARISING OUT OF OR RELATED TO THIS AGREEMENT.
        </p>
        <p>
          <strong>7.2 No Liability for Case Outcomes.</strong> Company shall have no liability
          whatsoever for the outcome of any legal matter, including but not limited to case
          dismissals, adverse judgments, malpractice claims, or bar complaints arising from
          Attorney&apos;s representation of consumers obtained through the Platform.
        </p>

        <p className="font-semibold text-gray-900">8. Indemnification</p>

        <p>
          <strong>8.1 By Attorney.</strong> Attorney shall indemnify, defend, and hold harmless
          Company and its officers, directors, employees, and agents from and against any and all
          claims, damages, losses, liabilities, costs, and expenses (including reasonable
          attorneys&apos; fees) arising out of or related to: (a) Attorney&apos;s provision of legal
          services to consumers; (b) Attorney&apos;s breach of this Agreement; (c) Attorney&apos;s
          violation of any applicable law or rule of professional conduct; or (d) any malpractice or
          negligence by Attorney.
        </p>
        <p>
          <strong>8.2 By Company.</strong> Company shall indemnify, defend, and hold harmless
          Attorney from and against any and all claims, damages, losses, liabilities, costs, and
          expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a)
          Company&apos;s material misrepresentation of lead information; (b) Company&apos;s breach
          of this Agreement; or (c) Company&apos;s failure to obtain adequate consumer consent as
          required under Section 6.3.
        </p>

        <p className="font-semibold text-gray-900">9. Term and Termination</p>

        <p>
          <strong>9.1 Term.</strong> This Agreement is effective as of the Effective Date and
          continues until terminated by either party in accordance with this Section.
        </p>
        <p>
          <strong>9.2 Termination for Convenience.</strong> Either party may terminate this Agreement
          with thirty (30) days&apos; written notice to the other party.
        </p>
        <p>
          <strong>9.3 Termination for Cause.</strong> Company may immediately suspend or terminate
          Attorney&apos;s account and this Agreement upon: (a) Attorney&apos;s breach of any
          material provision of this Agreement; (b) Attorney&apos;s loss of licensure or suspension
          from the practice of law; (c) fraudulent activity or material misrepresentation by
          Attorney; or (d) Attorney&apos;s failure to make required payments.
        </p>
        <p>
          <strong>9.4 Effect of Termination.</strong> Upon termination: (a) Attorney&apos;s access
          to the Platform will be revoked; (b) all outstanding lead purchase fees remain due and
          payable; (c) Attorney&apos;s obligations under Sections 3.2 (Use Restrictions), 6 (Data
          Privacy), 7 (Limitation of Liability), 8 (Indemnification), and 10 (Governing Law) shall
          survive termination.
        </p>

        <p className="font-semibold text-gray-900">10. Governing Law and Dispute Resolution</p>

        <p>
          <strong>10.1 Governing Law.</strong> This Agreement shall be governed by and construed in
          accordance with the laws of the State of Delaware, without regard to its conflict of laws
          principles.
        </p>
        <p>
          <strong>10.2 Arbitration.</strong> Any dispute, controversy, or claim arising out of or
          relating to this Agreement, including its formation, interpretation, breach, or
          termination, shall be resolved through binding arbitration administered by the American
          Arbitration Association (&quot;AAA&quot;) under its Commercial Arbitration Rules. The seat
          of arbitration shall be Houston, Texas.
        </p>
        <p>
          <strong>10.3 Waiver of Jury Trial and Class Action.</strong> BOTH PARTIES IRREVOCABLY
          WAIVE THE RIGHT TO TRIAL BY JURY AND THE RIGHT TO PARTICIPATE IN ANY CLASS ACTION,
          COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING WITH RESPECT TO ANY CLAIMS ARISING UNDER
          OR RELATED TO THIS AGREEMENT.
        </p>
        <p>
          <strong>10.4 Prevailing Party.</strong> The prevailing party in any arbitration or legal
          proceeding under this Agreement shall be entitled to recover its reasonable attorneys&apos;
          fees and costs from the non-prevailing party.
        </p>

        <p className="font-semibold text-gray-900">11. Miscellaneous</p>

        <p>
          <strong>11.1 Entire Agreement.</strong> This Agreement constitutes the entire agreement
          between the parties with respect to its subject matter and supersedes all prior or
          contemporaneous agreements, understandings, negotiations, and discussions, whether written
          or oral.
        </p>
        <p>
          <strong>11.2 Amendments.</strong> This Agreement may not be modified or amended except by a
          written instrument signed by both parties, except that Company may update Platform terms
          and lead pricing in accordance with Section 2.5.
        </p>
        <p>
          <strong>11.3 Severability.</strong> If any provision of this Agreement is held to be
          invalid, illegal, or unenforceable, the remaining provisions shall continue in full force
          and effect.
        </p>
        <p>
          <strong>11.4 Assignment.</strong> Attorney may not assign or transfer this Agreement or any
          rights or obligations hereunder without the prior written consent of Company. Company may
          assign this Agreement in connection with a merger, acquisition, or sale of all or
          substantially all of its assets.
        </p>
        <p>
          <strong>11.5 Notices.</strong> All notices under this Agreement shall be in writing and
          delivered via email to the addresses on file with the Platform, or by certified mail to the
          addresses set forth below. Notices are deemed received upon confirmed delivery.
        </p>
        <p>
          <strong>11.6 Independent Contractor.</strong> The relationship between the parties is that
          of independent contractors. Nothing in this Agreement creates a partnership, joint venture,
          employment, or agency relationship between Company and Attorney.
        </p>
        <p>
          <strong>11.7 Force Majeure.</strong> Neither party shall be liable for any failure or delay
          in performance due to circumstances beyond its reasonable control, including but not
          limited to acts of God, natural disasters, pandemics, government actions, or internet
          service disruptions.
        </p>
        <p>
          <strong>11.8 Waiver.</strong> The failure of either party to enforce any provision of this
          Agreement shall not constitute a waiver of that party&apos;s right to enforce that
          provision or any other provision in the future.
        </p>

        <p className="text-xs text-gray-400 pt-4 text-center">— End of Agreement —</p>
      </div>

      {!scrolledToBottom && (
        <p className="text-sm text-amber-600 text-center">
          Please scroll to the bottom of the agreement to continue.
        </p>
      )}

      <div className="space-y-4">
        <Input
          label="Electronic Signature (type your full legal name)"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="e.g., John A. Smith, Esq."
          disabled={!scrolledToBottom}
        />

        <Checkbox
          id="agree_to_terms"
          label="I have read and agree to the terms of this Attorney Lead Purchase Agreement."
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={!scrolledToBottom}
        />

        <Button
          variant="attorney"
          className="w-full"
          onClick={() => onSign(signature)}
          disabled={!scrolledToBottom || !signature.trim() || !agreed || loading}
          loading={loading}
        >
          Sign Agreement &amp; Complete Registration
        </Button>
      </div>
    </div>
  );
}
