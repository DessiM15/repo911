'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { CaseStatusBadge } from '@/components/attorney/CaseStatusBadge';
import { StatusUpdateModal } from '@/components/attorney/StatusUpdateModal';
import { formatDollars, formatDate } from '@/lib/utils';
import type { CaseStatus } from '@/types';

interface CaseRecord {
  id: string;
  created_at: string;
  lead_id: string;
  case_status: CaseStatus;
  settlement_amount: number | null;
  status_updated_at: string | null;
  outcome_notes: string | null;
  leads: {
    first_name: string;
    last_name: string;
    vehicle_year: number | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    repo_state: string;
    qualification_tier: string;
    lender_name: string | null;
  };
}

interface Stats {
  open: number;
  in_progress: number;
  settled: number;
  dismissed: number;
  closed: number;
  paid: number;
  total_settlement_value: number;
}

const STAT_CARDS: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'open', label: 'Open', color: 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
  { key: 'settled', label: 'Settled', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' },
  { key: 'dismissed', label: 'Dismissed', color: 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400' },
  { key: 'closed', label: 'Closed', color: 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400' },
  { key: 'paid', label: 'Paid', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'settled', label: 'Settled' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'closed', label: 'Closed' },
  { value: 'paid', label: 'Paid' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'updated', label: 'Recently Updated' },
];

const TIER_VARIANT: Record<string, 'hot' | 'warm' | 'cold'> = {
  hot: 'hot',
  warm: 'warm',
  cold: 'cold',
};

export default function CaseTrackerPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('sort', sort);

      const res = await fetch(`/api/attorney/cases?${params}`);
      if (!res.ok) {
        setError('Failed to load cases');
        return;
      }
      const data = await res.json();
      setCases(data.cases || []);
      setStats(data.stats || null);
    } catch {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sort]);

  useEffect(() => {
    setLoading(true);
    fetchCases();
  }, [fetchCases]);

  function handleStatClick(key: keyof Stats) {
    if (key === 'total_settlement_value') return;
    setStatusFilter(statusFilter === key ? '' : key);
  }

  function openModal(c: CaseRecord) {
    setSelectedCase(c);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Case Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your case pipeline and track settlements.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {STAT_CARDS.map(({ key, label, color }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${statusFilter === key ? 'ring-2 ring-[#2ECC71]' : ''}`}
              onClick={() => handleStatClick(key)}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{stats[key]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatDollars(stats.total_settlement_value)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Settlements</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {cases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No cases yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {statusFilter ? 'No cases match the selected filter.' : 'Claim leads from the marketplace to start tracking cases.'}
            </p>
            {!statusFilter && (
              <Link href="/attorney/marketplace">
                <Button variant="attorney">
                  Browse Marketplace <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Lender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/attorney/my-leads/${c.lead_id}`} className="text-[#3474BA] hover:underline">
                      {c.leads.first_name} {c.leads.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.leads.vehicle_year} {c.leads.vehicle_make} {c.leads.vehicle_model}
                  </TableCell>
                  <TableCell>{c.leads.repo_state}</TableCell>
                  <TableCell>
                    <Badge variant={TIER_VARIANT[c.leads.qualification_tier] || 'cold'}>
                      {c.leads.qualification_tier?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.leads.lender_name || '—'}</TableCell>
                  <TableCell>
                    <CaseStatusBadge status={c.case_status} />
                  </TableCell>
                  <TableCell>
                    {c.settlement_amount ? formatDollars(Number(c.settlement_amount)) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {c.status_updated_at ? formatDate(c.status_updated_at) : formatDate(c.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openModal(c)}>
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Status Update Modal */}
      {selectedCase && (
        <StatusUpdateModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchCases}
          caseId={selectedCase.id}
          currentStatus={selectedCase.case_status}
        />
      )}
    </div>
  );
}
