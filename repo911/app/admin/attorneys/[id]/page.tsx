'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Mail, Phone, Globe, Shield,
  FileText, DollarSign, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function AdminAttorneyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attorney, setAttorney] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [claimedLeads, setClaimedLeads] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusEdit, setStatusEdit] = useState('');
  const [verifiedEdit, setVerifiedEdit] = useState(false);

  useEffect(() => {
    async function fetchAttorney() {
      try {
        const res = await fetch(`/api/admin/attorneys/${id}`);
        if (!res.ok) {
          setError('Failed to load attorney');
          return;
        }
        const data = await res.json();
        setAttorney(data.attorney);
        setClaimedLeads(data.claimed_leads);
        setTransactions(data.transactions);
        setTotalSpent(data.total_spent);
        setStatusEdit(data.attorney.status);
        setVerifiedEdit(data.attorney.is_verified);
      } catch {
        setError('Failed to load attorney details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAttorney();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/attorneys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusEdit, is_verified: verifiedEdit }),
      });
      if (res.ok) {
        setAttorney((prev: typeof attorney) => ({ ...prev, status: statusEdit, is_verified: verifiedEdit }));
      } else {
        setError('Failed to update attorney');
      }
    } catch {
      setError('Failed to update attorney');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !attorney) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/admin/attorneys" className="text-sm text-[#4A90D9] hover:underline mt-2 inline-block">
          Back to Attorneys
        </Link>
      </div>
    );
  }

  if (!attorney) return null;

  const hasChanges = statusEdit !== attorney.status || verifiedEdit !== attorney.is_verified;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              {attorney.first_name} {attorney.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{attorney.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{attorney.phone}</span>
              {attorney.website && <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{attorney.website}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#1B2A4A]">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-gray-500">Total spent</p>
          </div>
        </div>

        {/* Status management */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusEdit}
            onChange={(e) => setStatusEdit(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedEdit}
              onChange={(e) => setVerifiedEdit(e.target.checked)}
              className="rounded border-gray-300"
            />
            Verified
          </label>
          {hasChanges && (
            <Button size="sm" variant="primary" onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Profile Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Attorney Profile
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Firm</span><span>{attorney.firm_name || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bar Number</span><span>{attorney.bar_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bar State</span><span>{attorney.bar_state}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Licensed States</span><span>{attorney.licensed_states?.join(', ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Preferred States</span><span>{attorney.preferred_states?.join(', ') || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Case Types</span><span>{attorney.preferred_case_types?.join(', ') || 'N/A'}</span></div>
          </div>
        </div>

        {/* Onboarding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" /> Onboarding
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Fee Agreement</span>
              <span className={attorney.fee_agreement_signed ? 'text-green-600 font-medium' : 'text-amber-500'}>{attorney.fee_agreement_signed ? 'Signed' : 'Pending'}</span>
            </div>
            {attorney.fee_agreement_signed_at && (
              <div className="flex justify-between"><span className="text-gray-500">Signed At</span><span>{formatDate(attorney.fee_agreement_signed_at)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Stripe Customer</span><span className={attorney.stripe_customer_id ? 'text-green-600' : 'text-gray-400'}>{attorney.stripe_customer_id ? 'Connected' : 'Not connected'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email Notifications</span><span>{attorney.email_notifications ? 'On' : 'Off'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">SMS Notifications</span><span>{attorney.sms_notifications ? 'On' : 'Off'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Registered</span><span>{formatDate(attorney.created_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Claimed Leads */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Claimed Leads ({claimedLeads.length})
          </h3>
        </div>
        {claimedLeads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No claimed leads yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claimedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-[#1B2A4A] hover:underline">
                      {lead.first_name} {lead.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                      {lead.qualification_tier?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.qualification_score}</TableCell>
                  <TableCell>{lead.repo_state}</TableCell>
                  <TableCell className="text-sm">{lead.claimed_at ? formatDate(lead.claimed_at) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status === 'claimed' ? 'success' : 'default'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Transaction History ({transactions.length})</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No transactions yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">{formatDate(tx.created_at)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'succeeded' ? 'success' : tx.status === 'refunded' ? 'warning' : 'default'}>
                      {tx.status}
                    </Badge>
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
