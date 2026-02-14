'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Users, DollarSign, TrendingUp, ArrowRight,
  Flame, Thermometer, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Lead, Transaction } from '@/types';

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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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
    return <p className="text-gray-500">Failed to load dashboard data.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/admin/leads" className="text-sm text-[#3474BA] hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_leads.length === 0 && (
              <p className="text-sm text-gray-400">No leads yet.</p>
            )}
            {data.recent_leads.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{lead.repo_state} &middot; {formatDate(lead.created_at)}</p>
                </div>
                <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : lead.qualification_tier === 'cold' ? 'cold' : lead.status === 'disqualified' ? 'disqualified' : 'default'}>
                  {lead.qualification_tier?.toUpperCase() || lead.status?.toUpperCase()}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/admin/transactions" className="text-sm text-[#3474BA] hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_transactions.length === 0 && (
              <p className="text-sm text-gray-400">No transactions yet.</p>
            )}
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
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
          <Link href="/admin/settings" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
