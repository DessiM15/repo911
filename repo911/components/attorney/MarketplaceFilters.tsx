'use client';

import { Select } from '@/components/ui/select';
import { US_STATES } from '@/lib/utils';

interface MarketplaceFiltersProps {
  tier: string;
  state: string;
  sort: string;
  onTierChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function MarketplaceFilters({
  tier, state, sort,
  onTierChange, onStateChange, onSortChange,
}: MarketplaceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        label=""
        value={tier}
        onChange={(e) => onTierChange(e.target.value)}
        options={[
          { value: '', label: 'All Tiers' },
          { value: 'hot', label: 'Hot Leads' },
          { value: 'warm', label: 'Warm Leads' },
          { value: 'cold', label: 'Cold Leads' },
        ]}
      />
      <Select
        label=""
        value={state}
        onChange={(e) => onStateChange(e.target.value)}
        options={[
          { value: '', label: 'All States' },
          ...US_STATES.map((s) => ({ value: s.value, label: s.label })),
        ]}
      />
      <Select
        label=""
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        options={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'score_desc', label: 'Highest Score' },
          { value: 'score_asc', label: 'Lowest Score' },
        ]}
      />
    </div>
  );
}
