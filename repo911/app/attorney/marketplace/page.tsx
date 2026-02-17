'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, AlertCircle, MapPin, Calendar, Car, Camera, DollarSign } from 'lucide-react';
import { MarketplaceFilters } from '@/components/attorney/MarketplaceFilters';
import { LeadCard } from '@/components/attorney/LeadCard';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LEAD_PRICES } from '@/lib/lead-prices';
import type { MarketplaceLead, QualificationTier } from '@/types';

function getTierPrice(tier: QualificationTier | null): number {
  switch (tier) {
    case 'hot': return LEAD_PRICES.hot;
    case 'warm': return LEAD_PRICES.warm;
    case 'cold': return LEAD_PRICES.cold;
    default: return 0;
  }
}

export default function MarketplacePage() {
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tier, setTier] = useState('');
  const [state, setState] = useState('');
  const [sort, setSort] = useState('newest');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [previewLead, setPreviewLead] = useState<MarketplaceLead | null>(null);

  // Fetch subscription status once on mount
  useEffect(() => {
    fetch('/api/attorney/subscription')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setIsSubscribed(
            data.subscription_plan === 'monthly_unlimited' &&
            data.subscription_status === 'active'
          );
        }
      })
      .catch(() => { /* non-critical */ });
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (tier) params.set('tier', tier);
      if (state) params.set('state', state);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/attorney/marketplace?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load leads');
        return;
      }

      setLeads(data.leads || []);
    } catch {
      setError('Failed to load marketplace leads.');
    } finally {
      setLoading(false);
    }
  }, [tier, state, sort]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lead Marketplace</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse and claim qualified leads</p>
        </div>
        <MarketplaceFilters
          tier={tier}
          state={state}
          sort={sort}
          onTierChange={setTier}
          onStateChange={setState}
          onSortChange={setSort}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Leads Available</h3>
          {tier || state ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                No leads match your current filters. Try adjusting your criteria.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setTier(''); setState(''); }}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                No leads match your preferences. Update your profile to expand your reach.
              </p>
              <Link href="/attorney/profile">
                <Button variant="attorney">Update Profile</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} isSubscribed={isSubscribed} onPreview={setPreviewLead} />
          ))}
        </div>
      )}

      {/* Lead Preview Modal */}
      <Modal
        open={!!previewLead}
        onClose={() => setPreviewLead(null)}
        title="Lead Preview"
        size="xl"
      >
        {previewLead && (
          <div className="space-y-4">
            {/* Tier & Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={previewLead.qualification_tier === 'hot' ? 'hot' : previewLead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                  {previewLead.qualification_tier?.toUpperCase()} LEAD
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">Score: {previewLead.qualification_score}</span>
              </div>
              {isSubscribed ? (
                <Badge variant="success" className="text-xs">Included</Badge>
              ) : (
                <span className="text-lg font-bold text-[#1B2A4A] dark:text-gray-100">{formatCurrency(getTierPrice(previewLead.qualification_tier))}</span>
              )}
            </div>

            {/* Violation tags */}
            <div className="flex flex-wrap gap-1.5">
              {previewLead.violation_types.map((v) => (
                <span key={v} className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  {v}
                </span>
              ))}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span>{previewLead.repo_state}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span>{previewLead.repo_date ? formatDate(previewLead.repo_date) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Car className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span>{[previewLead.vehicle_year, previewLead.vehicle_make, previewLead.vehicle_model].filter(Boolean).join(' ') || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span>{previewLead.estimated_value_range}</span>
              </div>
            </div>

            {previewLead.lender_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Lender: {previewLead.lender_name}</p>
            )}

            {previewLead.has_evidence && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <Camera className="h-4 w-4" />
                Evidence available
              </div>
            )}

            {/* Narrative preview */}
            {previewLead.narrative_preview && (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Narrative Preview</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{previewLead.narrative_preview}</p>
              </div>
            )}

            {/* Qualification Breakdown */}
            {previewLead.qualification_breakdown && (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Qualification Breakdown</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(previewLead.qualification_breakdown)
                    .filter(([key]) => key !== 'details' && key !== 'penalties')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className={`font-medium ${(value as number) > 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                          +{value as number}
                        </span>
                      </div>
                    ))}
                  {previewLead.qualification_breakdown.penalties !== 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Penalties</span>
                      <span className="font-medium text-red-500">{previewLead.qualification_breakdown.penalties}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <Link href={`/attorney/leads/${previewLead.id}`} className="flex-1">
                <Button variant="attorney" className="w-full">
                  View Full Details
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setPreviewLead(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
