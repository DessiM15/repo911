'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'suspended': return 'danger';
    default: return 'default';
  }
}

export default function AdminAttorneysPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttorneys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/attorneys?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAttorneys(data.attorneys);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAttorneys();
  }, [fetchAttorneys]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attorney Management</h1>
        <span className="text-sm text-gray-500">{attorneys.length} attorneys</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or firm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : attorneys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No attorneys found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Bar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Fee Agreement</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attorneys.map((atty) => (
                <TableRow key={atty.id}>
                  <TableCell>
                    <Link href={`/admin/attorneys/${atty.id}`} className="font-medium text-[#1B2A4A] hover:underline">
                      {atty.first_name} {atty.last_name}
                    </Link>
                    <p className="text-xs text-gray-500">{atty.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{atty.firm_name || '—'}</TableCell>
                  <TableCell className="text-sm">{atty.bar_number} ({atty.bar_state})</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(atty.status)}>
                      {atty.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {atty.is_verified ? (
                      <span className="text-xs text-green-600">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {atty.fee_agreement_signed ? (
                      <span className="text-xs text-green-600">Signed</span>
                    ) : (
                      <span className="text-xs text-amber-500">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(atty.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
