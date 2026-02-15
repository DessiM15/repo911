'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FileText, Users, DollarSign, TrendingUp, ArrowRight,
  Flame, Thermometer, XCircle,
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
  recent_leads: Pick<Lead, 'id' | 'first_name' | 'last_name' | 'status' | 'qualification_tier' | 'qualification_score' | 'repo_state' | 'created_at'>[];
  recent_transactions: Pick<Transaction, 'id' | 'amount' | 'status' | 'created_at' | 'attorney_id' | 'lead_id'>[];
}

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

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/admin/dashboard/trends');
        if (res.ok) {
          setTrends(await res.json());
        }
      } catch {
        // Non-blocking — charts simply won't render
      } finally {
        setTrendsLoading(false);
      }
    }
    fetchTrends();
  }, []);

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
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Qualified Leads"
          value={data.qualified_leads}
          icon={TrendingUp}
          sub={`${data.claim_rate}% claim rate`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Claimed Leads"
          value={data.claimed_leads}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Disqualified"
          value={data.disqualified_leads}
          icon={XCircle}
          color="bg-gray-100 text-gray-500"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          icon={DollarSign}
          sub={`${formatCurrency(data.this_month_revenue)} this month`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Total Attorneys"
          value={data.total_attorneys}
          icon={Users}
          sub={`${data.active_attorneys} active`}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Hot Leads"
          value={data.hot_leads}
          icon={Flame}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          label="Warm / Cold"
          value={`${data.warm_leads} / ${data.cold_leads}`}
          icon={Thermometer}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* Trend Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leads Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Leads (Last 30 Days)</h2>
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
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversion Funnel</h2>
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
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue (Last 6 Months)</h2>
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
            <Link href="/admin/leads" className="text-sm text-[#3474BA] hover:underline flex items-center gap-1">
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
            <Link href="/admin/transactions" className="text-sm text-[#3474BA] hover:underline flex items-center gap-1">
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
