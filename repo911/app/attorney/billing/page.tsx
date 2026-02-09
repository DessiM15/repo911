'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Receipt, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_spent: 0, total_leads: 0, this_month: 0 });

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch('/api/attorney/billing');
        const data = await res.json();
        if (res.ok) {
          setTransactions(data.transactions || []);
          setStats(data.stats || { total_spent: 0, total_leads: 0, this_month: 0 });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Payments</h1>
        <p className="text-sm text-gray-500 mt-1">View your payment history and lead purchase receipts</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_spent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Leads Purchased</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_leads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.this_month)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable />
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No transactions yet. Claim a lead to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDate(tx.created_at)}</TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          tx.status === 'succeeded' ? 'success'
                            : tx.status === 'refunded' ? 'info'
                            : tx.status === 'failed' ? 'danger'
                            : 'warning'
                        }>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
