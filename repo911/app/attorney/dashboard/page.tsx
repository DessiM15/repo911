'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, FileText, DollarSign, TrendingUp,
  ArrowRight, Clock, CalendarDays, Calculator, Scale,
  Flame, Thermometer, Snowflake,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDollars, formatDate } from '@/lib/utils';

interface DashboardData {
  available_leads: number;
  claimed_leads: number;
  total_spent: number;
  this_month_spent: number;
  avg_cost_per_lead: number;
  leads_by_tier: { hot: number; warm: number; cold: number };
  case_outcomes: { open: number; in_progress: number; settled: number; dismissed: number; closed: number; paid: number };
  total_settlement_value: number;
  recent_leads: Array<{
    id: string;
    first_name: string;
    last_name: string;
    qualification_tier: string;
    repo_state: string;
    claimed_at: string;
  }>;
}

function getCaseStatusVariant(status: string): 'info' | 'success' | 'warning' | 'default' {
  switch (status) {
    case 'open': return 'info';
    case 'in_progress': return 'warning';
    case 'settled': return 'success';
    case 'dismissed': return 'warning';
    case 'closed': return 'default';
    case 'paid': return 'success';
    default: return 'default';
  }
}

const caseStatusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  settled: 'Settled',
  dismissed: 'Dismissed',
  closed: 'Closed',
  paid: 'Paid',
};

export default function AttorneyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/attorney/dashboard');
        if (!res.ok) {
          setError('Failed to load data. Please try again.');
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here is your overview.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.available_leads ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">My Claimed Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.claimed_leads ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data?.total_spent ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <CalendarDays className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data?.this_month_spent ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Calculator className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg per Lead</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data?.avg_cost_per_lead ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Scale className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cases Settled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{(data?.case_outcomes?.settled ?? 0) + (data?.case_outcomes?.paid ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads by Tier + Case Outcomes */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Leads by Tier
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <Badge variant="hot">HOT</Badge>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data?.leads_by_tier?.hot ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-yellow-500" />
                  <Badge variant="warm">WARM</Badge>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data?.leads_by_tier?.warm ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <Badge variant="cold">COLD</Badge>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data?.leads_by_tier?.cold ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5" /> Case Outcomes
            </h3>
            {data?.case_outcomes ? (
              <div className="space-y-3">
                {Object.entries(data.case_outcomes).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900">
                    <Badge variant={getCaseStatusVariant(status)}>
                      {caseStatusLabels[status] || status}
                    </Badge>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No case data yet.</p>
            )}
            {data && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Settlements</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatDollars(data.total_settlement_value ?? 0)}
                  </span>
                </div>
                <Link href="/attorney/cases">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    View Case Tracker <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/attorney/marketplace">
                <Button variant="attorney" className="w-full justify-between">
                  Browse Marketplace <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/attorney/my-leads">
                <Button variant="outline" className="w-full justify-between">
                  View My Leads <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/attorney/billing">
                <Button variant="outline" className="w-full justify-between">
                  Payment History <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Claimed Leads */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recently Claimed
            </h3>
            {data?.recent_leads && data.recent_leads.length > 0 ? (
              <div className="space-y-3">
                {data.recent_leads.map((lead) => (
                  <Link key={lead.id} href={`/attorney/my-leads/${lead.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                          {lead.qualification_tier?.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.first_name} {lead.last_name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{lead.repo_state}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(lead.claimed_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No leads claimed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
