'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Car, Shield, AlertTriangle,
  FileText, Camera, Users, Lock, DollarSign, CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LEAD_PRICES } from '@/lib/lead-prices';
import type { QualificationTier } from '@/types';

function getTierPrice(tier: QualificationTier | null): number {
  switch (tier) {
    case 'hot': return LEAD_PRICES.hot;
    case 'warm': return LEAD_PRICES.warm;
    case 'cold': return LEAD_PRICES.cold;
    default: return 0;
  }
}

function BoolIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={value ? 'text-red-500' : 'text-gray-300'}>{value ? '\u2713' : '\u2717'}</span>
      <span className={value ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/attorney/leads/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load lead');
          return;
        }
        setLead(data.lead);
        setViolations(data.violations || []);
        setFullAccess(data.full_access);
      } catch {
        setError('Failed to load lead details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLead();
  }, [id]);

  async function handleClaim() {
    setClaiming(true);
    setError('');
    try {
      const res = await fetch('/api/attorney/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setError('Failed to process claim.');
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/attorney/marketplace" className="text-sm text-[#4A90D9] hover:underline mt-2 inline-block">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!lead) return null;

  const price = getTierPrice(lead.qualification_tier);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                {lead.qualification_tier?.toUpperCase()} LEAD
              </Badge>
              <span className="text-sm text-gray-500">Score: {lead.qualification_score}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{lead.repo_state}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{lead.repo_date ? formatDate(lead.repo_date) : 'N/A'}</span>
              <span className="flex items-center gap-1"><Car className="h-4 w-4" />{[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ')}</span>
            </div>
          </div>

          {!fullAccess && (
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1B2A4A]">{formatCurrency(price)}</p>
              <Button variant="attorney" onClick={handleClaim} loading={claiming} className="mt-2">
                Claim This Lead
              </Button>
            </div>
          )}

          {fullAccess && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Claimed by you</span>
            </div>
          )}
        </div>
      </div>

      {/* Full Contact Info (only if claimed) */}
      {fullAccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> Consumer Contact Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{lead.first_name} {lead.last_name}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{lead.email}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{lead.phone}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="font-medium">{lead.street_address}, {lead.city}, {lead.state} {lead.zip_code}</span></div>
            <div><span className="text-gray-500">Preferred Contact:</span> <span className="font-medium">{lead.preferred_contact}</span></div>
            <div><span className="text-gray-500">Best Time:</span> <span className="font-medium">{lead.best_time_to_contact || 'Anytime'}</span></div>
          </div>
        </div>
      )}

      {!fullAccess && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4 text-center">
          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Consumer contact information is revealed after claiming this lead.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Violation Indicators */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Violation Indicators
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {violations.map((v) => (
              <Badge key={v} variant="warning">{v}</Badge>
            ))}
          </div>
          <div className="space-y-2">
            <BoolIndicator value={lead.physical_force_or_threats} label="Physical force or threats" />
            <BoolIndicator value={lead.entered_locked_area} label="Entered locked area" />
            <BoolIndicator value={lead.property_damage} label="Property damage" />
            <BoolIndicator value={lead.verbally_objected === 'yes'} label="Verbally objected" />
            <BoolIndicator value={lead.continued_after_objection === 'yes'} label="Continued after objection" />
            <BoolIndicator value={lead.police_assisted === 'yes'} label="Police assisted repo" />
            <BoolIndicator value={lead.repo_at_workplace} label="Repo at workplace" />
            <BoolIndicator value={lead.public_embarrassment} label="Public embarrassment" />
            <BoolIndicator value={lead.excessive_noise} label="Excessive noise" />
          </div>
        </div>

        {/* Qualification Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" /> Case Assessment
          </h3>
          {lead.qualification_breakdown && (
            <div className="space-y-3">
              {Object.entries(lead.qualification_breakdown)
                .filter(([key]) => key !== 'details' && key !== 'penalties')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-medium ${(value as number) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      +{value as number}
                    </span>
                  </div>
                ))}
              {lead.qualification_breakdown.penalties !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Penalties</span>
                  <span className="font-medium text-red-500">{lead.qualification_breakdown.penalties}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="font-medium text-gray-900">Total Score</span>
                <span className="font-bold text-lg text-[#1B2A4A]">{lead.qualification_score}</span>
              </div>
              {lead.estimated_value_range && (
                <p className="text-sm text-gray-500">Estimated value: {lead.estimated_value_range}</p>
              )}
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Additional Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Lender</span><span>{lead.lender_name || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lease/Finance</span><span className="capitalize">{lead.lease_or_finance?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Behind on Payments</span><span className="capitalize">{lead.behind_on_payments?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Written Notice Received</span><span className="capitalize">{lead.received_written_notice?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Notice of Sale</span><span className="capitalize">{lead.received_notice_of_sale?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Military Service</span><span>{lead.military_service ? 'Yes' : 'No'}</span></div>
            {lead.active_duty_at_repo && <div className="flex justify-between"><span className="text-gray-500">Active Duty at Repo</span><span className="text-red-600 font-medium">Yes</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Debt Collector Contact</span><span>{lead.debt_collector_contact ? 'Yes' : 'No'}</span></div>
            {lead.fdcpa_violations?.length > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">FDCPA Violations</span><span>{lead.fdcpa_violations.length}</span></div>
            )}
          </div>
        </div>

        {/* Evidence */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" /> Evidence
          </h3>
          <div className="space-y-2">
            <BoolIndicator value={lead.has_photos_videos} label="Photos / Videos" />
            <BoolIndicator value={lead.has_documents} label="Documents" />
            <BoolIndicator value={lead.has_witnesses} label="Witnesses" />
          </div>
          {(fullAccess ? lead.narrative : lead.narrative_preview) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Narrative
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {fullAccess ? lead.narrative : lead.narrative_preview}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
