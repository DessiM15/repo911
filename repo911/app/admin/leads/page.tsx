'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronLeft, ChevronRight, Download, ArrowUpDown } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, US_STATES } from '@/lib/utils';
import type { Lead } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'qualified_hot', label: 'Qualified (Hot)' },
  { value: 'qualified_warm', label: 'Qualified (Warm)' },
  { value: 'qualified_cold', label: 'Qualified (Cold)' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'disqualified', label: 'Disqualified' },
  { value: 'closed', label: 'Closed' },
];

const TIER_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'disqualified', label: 'Disqualified' },
];

function getTierBadgeVariant(tier: string | null): 'hot' | 'warm' | 'cold' | 'disqualified' | 'default' {
  switch (tier) {
    case 'hot': return 'hot';
    case 'warm': return 'warm';
    case 'cold': return 'cold';
    case 'disqualified': return 'disqualified';
    default: return 'default';
  }
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'info' | 'danger' | 'default' {
  if (status === 'claimed') return 'success';
  if (status.startsWith('qualified_')) return 'info';
  if (status === 'disqualified') return 'danger';
  if (status === 'closed') return 'default';
  return 'warning';
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Pick<Lead, 'id' | 'first_name' | 'last_name' | 'email' | 'phone' | 'status' | 'qualification_tier' | 'qualification_score' | 'repo_state' | 'repo_date' | 'lender_name' | 'claimed_by' | 'claimed_at' | 'created_at'>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 25;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (tierFilter) params.set('tier', tierFilter);
      if (stateFilter) params.set('state', stateFilter);
      params.set('sort', sortField);
      params.set('order', sortOrder);

      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) {
        setError('Failed to load data. Please try again.');
        return;
      }
      const data = await res.json();
      setLeads(data.leads);
      setTotal(data.total);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, tierFilter, stateFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalPages = Math.ceil(total / limit);

  function exportCSV() {
    if (leads.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Tier', 'Score', 'State', 'Lender', 'Repo Date', 'Created', 'Claimed'];
    const rows = leads.map((l) => [
      `${l.first_name} ${l.last_name}`,
      l.email,
      l.phone,
      l.status,
      l.qualification_tier || '',
      l.qualification_score,
      l.repo_state || '',
      l.lender_name || '',
      l.repo_date || '',
      l.created_at?.split('T')[0] || '',
      l.claimed_by ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Leads</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} total leads</span>
          <button
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name or email..."
              aria-label="Search leads"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by status"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            aria-label="Filter by tier"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            aria-label="Filter by state"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No leads found matching your filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>
                  <button
                    onClick={() => { setSortField('qualification_score'); setSortOrder(sortField === 'qualification_score' ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc'); setPage(1); }}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Score <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => { setSortField('repo_state'); setSortOrder(sortField === 'repo_state' ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc'); setPage(1); }}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    State <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Lender</TableHead>
                <TableHead>
                  <button
                    onClick={() => { setSortField('created_at'); setSortOrder(sortField === 'created_at' ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc'); setPage(1); }}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Claimed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-[#1B2A4A] dark:text-blue-300 hover:underline">
                      {lead.first_name} {lead.last_name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lead.status)}>
                      {lead.status.replace('qualified_', '').replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.qualification_tier && (
                      <Badge variant={getTierBadgeVariant(lead.qualification_tier)}>
                        {lead.qualification_tier.toUpperCase()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{lead.qualification_score}</TableCell>
                  <TableCell>{lead.repo_state || '—'}</TableCell>
                  <TableCell className="text-sm">{lead.lender_name || '—'}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(lead.created_at)}</TableCell>
                  <TableCell>
                    {lead.claimed_by ? (
                      <span className="text-xs text-green-600">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
