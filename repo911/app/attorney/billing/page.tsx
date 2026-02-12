'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Receipt, Calendar, Crown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

interface SubscriptionInfo {
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total_spent: 0, total_leads: 0, this_month: 0 });
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch('/api/attorney/billing');
        if (!res.ok) {
          setError('Failed to load data. Please try again.');
          return;
        }
        const data = await res.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || { total_spent: 0, total_leads: 0, this_month: 0 });
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchSubscription() {
      try {
        const res = await fetch('/api/attorney/subscription');
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch {
        // non-critical
      } finally {
        setSubLoading(false);
      }
    }

    fetchBilling();
    fetchSubscription();
  }, []);

  async function handleUpgrade() {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/attorney/subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setError('Failed to start subscription checkout.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your current billing period.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/attorney/subscription', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to cancel subscription');
        return;
      }
      // Refresh subscription state
      setSubscription(prev => prev ? { ...prev, subscription_cancel_at_period_end: true } : prev);
    } catch {
      setError('Failed to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  }

  const isActive = subscription?.subscription_plan === 'monthly_unlimited' && subscription?.subscription_status === 'active';
  const isCancelPending = isActive && subscription?.subscription_cancel_at_period_end;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan, view payment history and lead purchase receipts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Your Plan */}
      {!subLoading && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" /> Your Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isActive ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">Monthly Unlimited</p>
                    <p className="text-sm text-gray-500">$2,000/month — Claim unlimited leads at no additional cost</p>
                  </div>
                  <Badge variant="success" className="ml-auto">Active</Badge>
                </div>

                {subscription?.subscription_current_period_end && (
                  <p className="text-sm text-gray-500">
                    {isCancelPending ? 'Access ends' : 'Renews'}: {formatDate(subscription.subscription_current_period_end)}
                  </p>
                )}

                {isCancelPending ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">Your subscription will not renew. You have full access until the end of your current billing period.</p>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    loading={actionLoading}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">Per-Lead Pricing</p>
                    <p className="text-sm text-gray-500">You currently pay per lead: Hot $1,000 / Warm $600 / Cold $300</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#1B2A4A] to-[#2d4470] rounded-lg p-5 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">Upgrade to Monthly Unlimited</p>
                      <p className="text-sm text-blue-200 mt-1">$2,000/month — Claim unlimited leads with no per-lead fees</p>
                    </div>
                    <Button
                      onClick={handleUpgrade}
                      loading={actionLoading}
                      className="bg-white text-[#1B2A4A] hover:bg-gray-100 font-semibold whitespace-nowrap"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
