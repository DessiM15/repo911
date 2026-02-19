'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FileText, Users, DollarSign, TrendingUp, ArrowRight,
  Flame, Thermometer, XCircle, Calendar, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Lead, Transaction } from '@/types';

interface TrendsData {
  leads_over_time: { date: string; count: number }[];
  conversion_funnel: { stage: string; count: number }[];
  revenue_trend: { month: string; revenue: number }[];
}

interface DashboardData {
  total_leads: number;
  qualified_leads: number;
  claimed_leads: number;
  disqualified_leads: number;
  total_attorneys: number;
  active_attorneys: number;
  total_revenue: number;
  this_month_revenue: number;
  qualification_rate: number;
  claim_rate: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  unverified_leads: number;
  recent_leads: Pick<Lead, 'id' | 'first_name' | 'last_name' | 'status' | 'qualification_tier' | 'qualification_score' | 'repo_state' | 'created_at'>[];
  recent_transactions: Pick<Transaction, 'id' | 'amount' | 'status' | 'created_at' | 'attorney_id' | 'lead_id'>[];
}

type RangePreset = '7d' | '30d' | '90d' | '6mo' | '1yr' | 'all' | 'custom';

function getPresetDates(preset: Exclude<RangePreset, 'custom' | 'all'>): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case '6mo':
      from.setMonth(from.getMonth() - 6);
      break;
    case '1yr':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function getRangeLabel(preset: RangePreset, customFrom: string, customTo: string): string {
  switch (preset) {
    case '7d': return 'Last 7 Days';
    case '30d': return 'Last 30 Days';
    case '90d': return 'Last 90 Days';
    case '6mo': return 'Last 6 Months';
    case '1yr': return 'Last Year';
    case 'all': return 'All Time';
    case 'custom': {
      if (!customFrom && !customTo) return 'Custom';
      const fmtDate = (d: string) => {
        const [, m, day] = d.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[Number(m) - 1]} ${Number(day)}`;
      };
      if (customFrom && customTo) return `${fmtDate(customFrom)} \u2013 ${fmtDate(customTo)}`;
      if (customFrom) return `From ${fmtDate(customFrom)}`;
      return `Until ${fmtDate(customTo)}`;
    }
  }
}

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '6mo', label: '6mo' },
  { key: '1yr', label: '1yr' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

function StatCard({ label, value, icon: Icon, sub, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range state
  const [activePreset, setActivePreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) {
          setError('Failed to load data. Please try again.');
          return;
        }
        setData(await res.json());
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const fetchTrends = useCallback(async (preset: RangePreset, cFrom: string, cTo: string) => {
    setTrendsLoading(true);
    try {
      const params = new URLSearchParams();
      if (preset === 'custom') {
        if (cFrom) params.set('from', cFrom);
        if (cTo) params.set('to', cTo);
      } else if (preset !== 'all') {
        const { from, to } = getPresetDates(preset);
        params.set('from', from);
        params.set('to', to);
      }
      // 'all' sends no params — API returns defaults for leads/revenue but funnel is all-time
      const qs = params.toString();
      const res = await fetch(`/api/admin/dashboard/trends${qs ? `?${qs}` : ''}`);
      if (res.ok) {
        setTrends(await res.json());
      }
    } catch {
      // Non-blocking — charts simply won't render
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  // Initial fetch and refetch on preset/custom date change
  useEffect(() => {
    fetchTrends(activePreset, customFrom, customTo);
  }, [activePreset, customFrom, customTo, fetchTrends]);

  function handlePresetClick(preset: RangePreset) {
    setActivePreset(preset);
    if (preset !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  }

  const rangeLabel = getRangeLabel(activePreset, customFrom, customTo);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={data.total_leads}
          icon={FileText}
          sub={`${data.qualification_rate}% qualification rate`}
          color="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Qualified Leads"
          value={data.qualified_leads}
          icon={TrendingUp}
          sub={`${data.claim_rate}% claim rate`}
          color="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Claimed Leads"
          value={data.claimed_leads}
          icon={DollarSign}
          color="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Disqualified"
          value={data.disqualified_leads}
          icon={XCircle}
          color="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          icon={DollarSign}
          sub={`${formatCurrency(data.this_month_revenue)} this month`}
          color="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total Attorneys"
          value={data.total_attorneys}
          icon={Users}
          sub={`${data.active_attorneys} active`}
          color="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Hot Leads"
          value={data.hot_leads}
          icon={Flame}
          color="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Warm / Cold"
          value={`${data.warm_leads} / ${data.cold_leads}`}
          icon={Thermometer}
          color="bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          label="Unverified Leads"
          value={data.unverified_leads}
          icon={AlertTriangle}
          sub="Within 48hr verification window"
          color="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>Range</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  activePreset === key
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {activePreset === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3474BA]"
              />
              <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3474BA]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leads Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Leads ({rangeLabel})</h2>
          {trendsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : trends?.leads_over_time ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends.leads_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => String(v).slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => String(v)}
                  formatter={(value) => [value, 'Leads']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3474BA"
                  fill="#3474BA"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No data available</p>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversion Funnel ({rangeLabel})</h2>
          {trendsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : trends?.conversion_funnel ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends.conversion_funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#2ECC71" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No data available</p>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue ({rangeLabel})</h2>
          {trendsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : trends?.revenue_trend ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${(Number(v) / 100).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F5A623"
                  fill="#F5A623"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No data available</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Leads</h2>
            <Link href="/admin/leads" className="text-sm text-[#3474BA] dark:text-blue-300 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_leads.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">No leads yet.</p>
            )}
            {data.recent_leads.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-slate-700 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lead.repo_state} &middot; {formatDate(lead.created_at)}</p>
                </div>
                <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : lead.qualification_tier === 'cold' ? 'cold' : lead.status === 'disqualified' ? 'disqualified' : 'default'}>
                  {lead.qualification_tier?.toUpperCase() || lead.status?.toUpperCase()}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            <Link href="/admin/transactions" className="text-sm text-[#3474BA] dark:text-blue-300 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_transactions.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            )}
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
                <Badge variant={tx.status === 'succeeded' ? 'success' : tx.status === 'refunded' ? 'warning' : 'default'}>
                  {tx.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/leads" className="px-4 py-2 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Manage Leads
          </Link>
          <Link href="/admin/attorneys" className="px-4 py-2 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Manage Attorneys
          </Link>
          <Link href="/admin/crm" className="px-4 py-2 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            CRM Contacts
          </Link>
          <Link href="/admin/crm/pipeline" className="px-4 py-2 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Pipeline
          </Link>
          <Link href="/admin/fee-tracking" className="px-4 py-2 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Case Tracking
          </Link>
          <Link href="/admin/settings" className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
