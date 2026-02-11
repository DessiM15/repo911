'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatDate, formatPhone } from '@/lib/utils';
import type { Lead } from '@/types';

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/attorney/my-leads');
        if (!res.ok) {
          setError('Failed to load data. Please try again.');
          return;
        }
        const data = await res.json();
        setLeads(data.leads || []);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <p className="text-sm text-gray-500 mt-1">All leads you have claimed with full contact information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Claimed Leads</h3>
          <p className="text-gray-500 text-sm mb-4">You haven&apos;t claimed any leads yet.</p>
          <Link href="/attorney/marketplace">
            <Button variant="attorney">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                    {lead.qualification_tier?.toUpperCase()}
                  </Badge>
                  <span className="font-semibold text-gray-900">{lead.first_name} {lead.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Claimed {lead.claimed_at ? formatDate(lead.claimed_at) : 'N/A'}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {formatPhone(lead.phone)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {lead.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {lead.city}, {lead.state}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ')} &bull; {lead.repo_state}
                </span>
                <Link href={`/attorney/my-leads/${lead.id}`}>
                  <Button variant="outline" size="sm">View Full Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
