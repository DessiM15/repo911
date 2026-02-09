'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { MarketplaceFilters } from '@/components/attorney/MarketplaceFilters';
import { LeadCard } from '@/components/attorney/LeadCard';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { MarketplaceLead } from '@/types';

export default function MarketplacePage() {
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tier, setTier] = useState('');
  const [state, setState] = useState('');
  const [sort, setSort] = useState('newest');

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
          <h1 className="text-2xl font-bold text-gray-900">Lead Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and claim qualified leads</p>
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center gap-2">
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Leads Available</h3>
          <p className="text-gray-500 text-sm">
            {tier || state
              ? 'No leads match your current filters. Try adjusting your criteria.'
              : 'No qualified leads are available right now. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
