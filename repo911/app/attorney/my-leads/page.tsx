'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, MapPin, Calendar, Phone, Mail, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatDate, formatPhone } from '@/lib/utils';
import type { Lead } from '@/types';

function exportLeadsCsv(leads: Lead[]) {
  const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip', 'Vehicle', 'Lender', 'Repo Date', 'Repo State', 'Tier', 'Score', 'Claimed Date'];

  const escapeCell = (val: string | null | undefined) => {
    if (val == null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = leads.map((l) => [
    escapeCell(`${l.first_name} ${l.last_name}`),
    escapeCell(l.email),
    escapeCell(l.phone),
    escapeCell(l.street_address),
    escapeCell(l.city),
    escapeCell(l.state),
    escapeCell(l.zip_code),
    escapeCell([l.vehicle_year, l.vehicle_make, l.vehicle_model].filter(Boolean).join(' ')),
    escapeCell(l.lender_name),
    escapeCell(l.repo_date),
    escapeCell(l.repo_state),
    escapeCell(l.qualification_tier?.toUpperCase()),
    escapeCell(String(l.qualification_score)),
    escapeCell(l.claimed_at),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `repo911-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All leads you have claimed with full contact information</p>
        </div>
        {leads.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportLeadsCsv(leads)}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Claimed Leads</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">You haven&apos;t claimed any leads yet.</p>
          <Link href="/attorney/marketplace">
            <Button variant="attorney">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                    {lead.qualification_tier?.toUpperCase()}
                  </Badge>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{lead.first_name} {lead.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  Claimed {lead.claimed_at ? formatDate(lead.claimed_at) : 'N/A'}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  {formatPhone(lead.phone)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  {lead.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  {lead.city}, {lead.state}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500">
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
