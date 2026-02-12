'use client';

import Link from 'next/link';
import { MapPin, Calendar, Car, Camera, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LEAD_PRICES } from '@/lib/lead-prices';
import type { MarketplaceLead, QualificationTier } from '@/types';

interface LeadCardProps {
  lead: MarketplaceLead;
  isSubscribed?: boolean;
}

function getTierBadgeVariant(tier: QualificationTier | null): 'hot' | 'warm' | 'cold' | 'default' {
  switch (tier) {
    case 'hot': return 'hot';
    case 'warm': return 'warm';
    case 'cold': return 'cold';
    default: return 'default';
  }
}

function getTierPrice(tier: QualificationTier | null): number {
  switch (tier) {
    case 'hot': return LEAD_PRICES.hot;
    case 'warm': return LEAD_PRICES.warm;
    case 'cold': return LEAD_PRICES.cold;
    default: return 0;
  }
}

export function LeadCard({ lead, isSubscribed }: LeadCardProps) {
  const price = getTierPrice(lead.qualification_tier);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={getTierBadgeVariant(lead.qualification_tier)}>
            {lead.qualification_tier?.toUpperCase()} — Score: {lead.qualification_score}
          </Badge>
        </div>
        {isSubscribed ? (
          <Badge variant="success" className="text-xs">Included</Badge>
        ) : (
          <span className="text-lg font-bold text-[#1B2A4A]">{formatCurrency(price)}</span>
        )}
      </div>

      {/* Violation tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {lead.violation_types.map((v) => (
          <span key={v} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
            {v}
          </span>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {lead.repo_state}
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {lead.repo_date ? formatDate(lead.repo_date) : 'N/A'}
        </div>
        <div className="flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-gray-400" />
          {[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ') || 'N/A'}
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
          {lead.estimated_value_range}
        </div>
      </div>

      {lead.has_evidence && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3">
          <Camera className="h-3.5 w-3.5" />
          Evidence available
        </div>
      )}

      {lead.lender_name && (
        <p className="text-xs text-gray-500 mb-3">Lender: {lead.lender_name}</p>
      )}

      <Link href={`/attorney/leads/${lead.id}`}>
        <Button variant="attorney" size="sm" className="w-full">
          View Details
        </Button>
      </Link>
    </div>
  );
}
