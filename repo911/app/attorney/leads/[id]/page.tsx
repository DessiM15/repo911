'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Car, Shield, AlertTriangle,
  FileText, Camera, Users, Lock, DollarSign, CheckCircle,
  Download, FileImage, File, Mic,
} from 'lucide-react';
import { AudioPlayer } from '@/components/attorney/AudioPlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LEAD_PRICES } from '@/lib/lead-prices';
import { trackEvent } from '@/lib/analytics';
import type { QualificationTier } from '@/types';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  url: string | null;
}

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
      <span className={value ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}>{value ? '\u2713' : '\u2717'}</span>
      <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>{label}</span>
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadRes, subRes] = await Promise.all([
          fetch(`/api/attorney/leads/${id}`),
          fetch('/api/attorney/subscription'),
        ]);

        const leadData = await leadRes.json();
        if (!leadRes.ok) {
          setError(leadData.error || 'Failed to load lead');
          return;
        }
        setLead(leadData.lead);
        setViolations(leadData.violations || []);
        setFullAccess(leadData.full_access);
        setHasStory(leadData.has_story || false);

        if (subRes.ok) {
          const subData = await subRes.json();
          setIsSubscribed(
            subData.subscription_plan === 'monthly_unlimited' &&
            subData.subscription_status === 'active'
          );
        }
      } catch {
        setError('Failed to load lead details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  // Fetch evidence files if attorney has full access
  useEffect(() => {
    async function fetchEvidence() {
      if (!fullAccess || !lead?.uploaded_files || lead.uploaded_files.length === 0) return;
      setEvidenceLoading(true);
      try {
        const res = await fetch(`/api/attorney/evidence?lead_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvidenceFiles(data.files || []);
        }
      } catch {
        // silently fail
      } finally {
        setEvidenceLoading(false);
      }
    }
    fetchEvidence();
  }, [fullAccess, lead, id]);

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
      if (data.redirect_url) {
        // Instant claim (subscription or referral credit)
        trackEvent('Attorney Lead Claimed');
        window.location.href = data.redirect_url;
      } else if (data.checkout_url) {
        // Per-lead Stripe checkout
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
        <Link href="/attorney/marketplace" className="text-sm text-[#3474BA] dark:text-blue-300 hover:underline mt-2 inline-block">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!lead) return null;

  const price = getTierPrice(lead.qualification_tier);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-4">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                {lead.qualification_tier?.toUpperCase()} LEAD
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">Score: {lead.qualification_score}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{lead.repo_state}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{lead.repo_date ? formatDate(lead.repo_date) : 'N/A'}</span>
              <span className="flex items-center gap-1"><Car className="h-4 w-4" />{[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ')}</span>
            </div>
          </div>

          {!fullAccess && (
            <div className="text-right">
              {isSubscribed ? (
                <Badge variant="success" className="text-sm px-3 py-1">Included in Subscription</Badge>
              ) : (
                <p className="text-2xl font-bold text-[#1B2A4A] dark:text-gray-100">{formatCurrency(price)}</p>
              )}
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
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> Consumer Contact Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium">{lead.first_name} {lead.last_name}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium">{lead.email}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium">{lead.phone}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Address:</span> <span className="font-medium">{lead.street_address}, {lead.city}, {lead.state} {lead.zip_code}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Preferred Contact:</span> <span className="font-medium">{lead.preferred_contact}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Best Time:</span> <span className="font-medium">{lead.best_time_to_contact || 'Anytime'}</span></div>
          </div>
        </div>
      )}

      {!fullAccess && (
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-4 text-center">
          <Lock className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Consumer contact information is revealed after claiming this lead.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Violation Indicators */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" /> Case Assessment
          </h3>
          {lead.qualification_breakdown && (
            <div className="space-y-3">
              {Object.entries(lead.qualification_breakdown)
                .filter(([key]) => key !== 'details' && key !== 'penalties')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-medium ${(value as number) > 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                      +{value as number}
                    </span>
                  </div>
                ))}
              {lead.qualification_breakdown.penalties !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Penalties</span>
                  <span className="font-medium text-red-500">{lead.qualification_breakdown.penalties}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">Total Score</span>
                <span className="font-bold text-lg text-[#1B2A4A] dark:text-gray-100">{lead.qualification_score}</span>
              </div>
              {lead.estimated_value_range && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Estimated value: {lead.estimated_value_range}</p>
              )}
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Additional Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Lender</span><span>{lead.lender_name || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Lease/Finance</span><span className="capitalize">{lead.lease_or_finance?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Behind on Payments</span><span className="capitalize">{lead.behind_on_payments?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Written Notice Received</span><span className="capitalize">{lead.received_written_notice?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Notice of Sale</span><span className="capitalize">{lead.received_notice_of_sale?.replace('_', ' ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Military Service</span><span>{lead.military_service ? 'Yes' : 'No'}</span></div>
            {lead.active_duty_at_repo && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Active Duty at Repo</span><span className="text-red-600 font-medium">Yes</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Debt Collector Contact</span><span>{lead.debt_collector_contact ? 'Yes' : 'No'}</span></div>
            {lead.fdcpa_violations?.length > 0 && (
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">FDCPA Violations</span><span>{lead.fdcpa_violations.length}</span></div>
            )}
          </div>
        </div>

        {/* Evidence */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" /> Evidence
          </h3>
          <div className="space-y-2">
            <BoolIndicator value={lead.has_photos_videos} label="Photos / Videos" />
            <BoolIndicator value={lead.has_documents} label="Documents" />
            <BoolIndicator value={lead.has_witnesses} label="Witnesses" />
          </div>
          {(fullAccess ? lead.narrative : lead.narrative_preview) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Narrative
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {fullAccess ? lead.narrative : lead.narrative_preview}
              </p>
            </div>
          )}

          {/* Evidence files for claimed leads */}
          {fullAccess && lead.uploaded_files && lead.uploaded_files.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                <Download className="h-4 w-4" /> Uploaded Files ({lead.uploaded_files.length})
              </p>
              {evidenceLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: lead.uploaded_files.length }).map((_: unknown, i: number) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {evidenceFiles.map((file, i) => {
                    const isImage = file.type?.startsWith('image/');
                    return (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-2.5">
                        {isImage ? (
                          <FileImage className="h-5 w-5 text-blue-500 shrink-0" />
                        ) : (
                          <File className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                          </p>
                        </div>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3474BA] dark:text-blue-300 hover:underline font-medium shrink-0"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* File count indicator for unclaimed leads */}
          {!fullAccess && lead.uploaded_files && lead.uploaded_files.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                {lead.uploaded_files.length} evidence file{lead.uploaded_files.length > 1 ? 's' : ''} available after claiming
              </p>
            </div>
          )}

          {/* Story Audio */}
          {hasStory && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                <Mic className="h-4 w-4 text-[#3474BA]" /> Consumer Audio Story
              </p>
              {fullAccess ? (
                <>
                  {lead.story_transcript && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed mb-3">
                      &ldquo;{lead.story_transcript}&rdquo;
                    </p>
                  )}
                  <AudioPlayer leadId={id} />
                </>
              ) : (
                <>
                  {lead.story_transcript_preview && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed mb-2">
                      &ldquo;{lead.story_transcript_preview}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Audio available after claiming
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
