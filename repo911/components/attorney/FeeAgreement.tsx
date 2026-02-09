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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Fee-Sharing Agreement</h2>
        <p className="text-sm text-gray-600">
          Please read the following agreement carefully. You must scroll to the bottom and sign to continue.
        </p>
      </div>

      <div
        onScroll={handleScroll}
        className="h-80 overflow-y-auto border border-gray-300 rounded-lg p-6 bg-white text-sm text-gray-700 leading-relaxed space-y-4"
      >
        <p className="font-bold text-center text-gray-900 text-base">
          REPO911 ATTORNEY FEE-SHARING AGREEMENT
        </p>

        <p>
          This Fee-Sharing Agreement (&quot;Agreement&quot;) is entered into between Repo911
          (&quot;Company&quot;) and the undersigned licensed attorney (&quot;Attorney&quot;)
          as of the date of electronic execution below.
        </p>

        <p className="font-semibold text-gray-900">1. Purpose</p>
        <p>
          Repo911 operates a lead generation marketplace connecting consumers who may have experienced
          wrongful vehicle repossession with licensed attorneys. This Agreement governs the fee-sharing
          arrangement between the Company and Attorney for leads acquired through the Repo911 platform.
        </p>

        <p className="font-semibold text-gray-900">2. Fee-Sharing Terms</p>
        <p>
          Attorney agrees to pay Repo911 fifty percent (50%) of all legal fees earned from any lead
          acquired through the Repo911 platform. This includes but is not limited to contingency fees,
          settlement fees, court-awarded attorney fees, and any other compensation received in
          connection with cases originating from Repo911 leads.
        </p>

        <p className="font-semibold text-gray-900">3. Payment Terms</p>
        <p>
          Payment of Repo911&apos;s share is due within thirty (30) days of case settlement, judgment
          collection, or fee receipt by Attorney, whichever occurs first. Late payments will accrue
          interest at a rate of 1.5% per month.
        </p>

        <p className="font-semibold text-gray-900">4. Reporting Obligations</p>
        <p>
          Attorney agrees to report case outcomes and fees earned through the Repo911 platform within
          ten (10) days of case resolution. Reports must include: case outcome (settled, dismissed, judgment),
          total fees earned, and calculation of Repo911&apos;s share. Attorney agrees to provide supporting
          documentation upon request.
        </p>

        <p className="font-semibold text-gray-900">5. Audit Rights</p>
        <p>
          Repo911 reserves the right to audit Attorney&apos;s records related to leads acquired through
          the platform. Attorney agrees to maintain accurate records and make them available upon
          reasonable request.
        </p>

        <p className="font-semibold text-gray-900">6. Lead Exclusivity</p>
        <p>
          Leads acquired through Repo911 are exclusive to the claiming Attorney. Attorney may not share,
          transfer, or sell lead information to any third party, including other attorneys or law firms,
          without prior written consent from Repo911.
        </p>

        <p className="font-semibold text-gray-900">7. Survival</p>
        <p>
          The fee-sharing obligation for any lead claimed through the platform survives termination of
          Attorney&apos;s account. Attorney remains obligated to pay Repo911&apos;s share for all
          previously claimed leads regardless of account status.
        </p>

        <p className="font-semibold text-gray-900">8. Lead Claim Fees</p>
        <p>
          In addition to the fee-sharing arrangement, Attorney agrees to pay the applicable lead claim fee
          at the time of claim: Hot Lead ($150), Warm Lead ($100), Cold Lead ($50). Lead claim fees are
          non-refundable except in cases of platform error or duplicate leads.
        </p>

        <p className="font-semibold text-gray-900">9. Compliance</p>
        <p>
          Attorney represents that they are a licensed, active member of the bar in good standing in at
          least one U.S. jurisdiction. Attorney agrees to comply with all applicable rules of professional
          conduct, including those governing fee-sharing arrangements in their jurisdiction(s).
        </p>

        <p className="font-semibold text-gray-900">10. Governing Law &amp; Dispute Resolution</p>
        <p>
          This Agreement is governed by the laws of the State of Delaware. Any disputes shall be resolved
          through binding arbitration administered by the American Arbitration Association under its
          Commercial Arbitration Rules. Both parties waive the right to trial by jury and the right to
          participate in class actions.
        </p>

        <p className="font-semibold text-gray-900">11. Termination</p>
        <p>
          Either party may terminate this Agreement with thirty (30) days written notice. Termination
          does not affect the fee-sharing obligation for leads already claimed. Repo911 may immediately
          suspend or terminate Attorney&apos;s account for violations of this Agreement, fraudulent
          activity, or failure to make required payments.
        </p>

        <p className="font-semibold text-gray-900">12. Entire Agreement</p>
        <p>
          This Agreement constitutes the entire agreement between the parties and supersedes all prior
          agreements, whether written or oral. Modifications must be in writing and agreed to by both parties.
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
          label="I have read and agree to the terms of this Fee-Sharing Agreement."
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
