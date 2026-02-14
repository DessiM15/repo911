'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DollarSign, Receipt, RefreshCw, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attorneys, setAttorneys] = useState<Record<string, string>>({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (!res.ok) {
        setError('Failed to load data. Please try again.');
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions);
      setAttorneys(data.attorneys);
      setTotalRevenue(data.total_revenue);
      setTotalRefunded(data.total_refunded);
      setTotalCount(data.pagination?.total || data.transactions.length);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function exportCSV() {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Attorney', 'Lead ID', 'Amount', 'Status', 'Stripe ID', 'Description'];
    const rows = transactions.map((tx) => [
      tx.created_at?.split('T')[0] || '',
      tx.attorney_id ? (attorneys[tx.attorney_id] || 'Unknown') : '',
      tx.lead_id || '',
      (tx.amount / 100).toFixed(2),
      tx.status,
      tx.stripe_payment_intent_id || '',
      tx.description || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={exportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Revenue</span>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Refunded</span>
            <RefreshCw className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRefunded)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Transactions</span>
            <Receipt className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by attorney name or Stripe ID..."
              aria-label="Search transactions"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by type"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            <option value="">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Attorney</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe ID</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(tx.created_at)}</TableCell>
                  <TableCell>
                    {tx.attorney_id ? (
                      <Link href={`/admin/attorneys/${tx.attorney_id}`} className="text-sm font-medium text-[#1B2A4A] hover:underline">
                        {attorneys[tx.attorney_id] || 'Unknown'}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {tx.lead_id ? (
                      <Link href={`/admin/leads/${tx.lead_id}`} className="text-sm text-[#3474BA] hover:underline">
                        View
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      tx.status === 'succeeded' ? 'success' :
                      tx.status === 'refunded' ? 'warning' :
                      tx.status === 'failed' ? 'danger' : 'default'
                    }>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 font-mono">
                    {tx.stripe_payment_intent_id ? tx.stripe_payment_intent_id.slice(0, 20) + '...' : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{tx.description || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
