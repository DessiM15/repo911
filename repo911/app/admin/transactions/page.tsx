'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DollarSign, Receipt, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function TransactionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [attorneys, setAttorneys] = useState<Record<string, string>>({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

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
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

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
          <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
        >
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
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
                      <Link href={`/admin/leads/${tx.lead_id}`} className="text-sm text-[#4A90D9] hover:underline">
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
      </div>
    </div>
  );
}
