'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Calendar, Car, Shield, AlertTriangle,
  FileText, Camera, Users, DollarSign, User, Phone, Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Lead, Attorney, Transaction } from '@/types';

function BoolIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={value ? 'text-red-500' : 'text-gray-300'}>{value ? '\u2713' : '\u2717'}</span>
      <span className={value ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [attorney, setAttorney] = useState<Pick<Attorney, 'id' | 'first_name' | 'last_name' | 'email' | 'firm_name'> | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusEdit, setStatusEdit] = useState('');

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/admin/leads/${id}`);
        if (!res.ok) {
          setError('Failed to load lead');
          return;
        }
        const data = await res.json();
        setLead(data.lead);
        setAttorney(data.attorney);
        setTransaction(data.transaction);
        setStatusEdit(data.lead.status);
      } catch {
        setError('Failed to load lead details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLead();
  }, [id]);

  async function handleStatusUpdate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusEdit }),
      });
      if (res.ok) {
        setLead((prev) => prev ? { ...prev, status: statusEdit } as Lead : prev);
      } else {
        setError('Failed to update status');
      }
    } catch {
      setError('Failed to update status');
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

  if (error && !lead) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/admin/leads" className="text-sm text-[#4A90D9] hover:underline mt-2 inline-block">
          Back to Leads
        </Link>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Breadcrumb items={[
        { label: 'Leads', href: '/admin/leads' },
        { label: lead.first_name + ' ' + lead.last_name },
      ]} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{lead.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{lead.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{lead.city}, {lead.state} {lead.zip_code}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : lead.qualification_tier === 'cold' ? 'cold' : 'disqualified'}>
              {lead.qualification_tier?.toUpperCase() || 'PENDING'} — Score: {lead.qualification_score}
            </Badge>
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
            <option value="qualified_hot">Qualified (Hot)</option>
            <option value="qualified_warm">Qualified (Warm)</option>
            <option value="qualified_cold">Qualified (Cold)</option>
            <option value="claimed">Claimed</option>
            <option value="disqualified">Disqualified</option>
            <option value="closed">Closed</option>
          </select>
          {statusEdit !== lead.status && (
            <Button size="sm" variant="primary" onClick={handleStatusUpdate} loading={saving}>
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Claiming Attorney */}
      {attorney && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" /> Claimed by Attorney
          </h3>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Name:</span> <Link href={`/admin/attorneys/${attorney.id}`} className="font-medium text-[#1B2A4A] hover:underline">{attorney.first_name} {attorney.last_name}</Link></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{attorney.email}</span></div>
            {attorney.firm_name && <div><span className="text-gray-500">Firm:</span> <span className="font-medium">{attorney.firm_name}</span></div>}
            <div><span className="text-gray-500">Claimed:</span> <span className="font-medium">{lead.claimed_at ? formatDate(lead.claimed_at) : 'N/A'}</span></div>
          </div>
          {transaction && (
            <div className="mt-3 pt-3 border-t border-green-300 text-sm">
              <span className="text-gray-500">Payment:</span>{' '}
              <span className="font-medium">{formatCurrency(transaction.amount)}</span>{' '}
              <Badge variant={transaction.status === 'succeeded' ? 'success' : 'warning'}>
                {transaction.status}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Contact Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> Contact Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Address</span><span>{lead.street_address}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">City, State</span><span>{lead.city}, {lead.state} {lead.zip_code}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Preferred Contact</span><span className="capitalize">{lead.preferred_contact}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Best Time</span><span>{lead.best_time_to_contact || 'Anytime'}</span></div>
          </div>
        </div>

        {/* Vehicle & Repo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Car className="h-5 w-5" /> Vehicle & Repossession
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span>{[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ')}</span></div>
            {lead.vehicle_color && <div className="flex justify-between"><span className="text-gray-500">Color</span><span>{lead.vehicle_color}</span></div>}
            {lead.vin && <div className="flex justify-between"><span className="text-gray-500">VIN</span><span className="font-mono text-xs">{lead.vin}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Repo Date</span><span>{lead.repo_date ? formatDate(lead.repo_date) : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Repo State</span><span>{lead.repo_state}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Time of Day</span><span className="capitalize">{lead.repo_time_of_day?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lease/Finance</span><span className="capitalize">{lead.lease_or_finance?.replace('_', ' ')}</span></div>
          </div>
        </div>

        {/* Lender Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Lender Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Lender</span><span>{lead.lender_name || 'N/A'}</span></div>
            {lead.repo_company_name && <div className="flex justify-between"><span className="text-gray-500">Repo Company</span><span>{lead.repo_company_name}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Behind on Payments</span><span className="capitalize">{lead.behind_on_payments?.replace('_', ' ')}</span></div>
            {lead.payments_behind && <div className="flex justify-between"><span className="text-gray-500">Payments Behind</span><span>{lead.payments_behind}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Written Notice</span><span className="capitalize">{lead.received_written_notice?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Notice of Sale</span><span className="capitalize">{lead.received_notice_of_sale?.replace('_', ' ')}</span></div>
          </div>
        </div>

        {/* Violation Indicators */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Violation Indicators
          </h3>
          <div className="space-y-2">
            <BoolIndicator value={lead.physical_force_or_threats} label="Physical force or threats" />
            <BoolIndicator value={lead.entered_locked_area} label="Entered locked area" />
            <BoolIndicator value={lead.property_damage} label="Property damage" />
            <BoolIndicator value={lead.verbally_objected === 'yes'} label="Verbally objected" />
            <BoolIndicator value={lead.continued_after_objection === 'yes'} label="Continued after objection" />
            <BoolIndicator value={lead.police_assisted === 'yes'} label="Police assisted repo" />
            <BoolIndicator value={lead.repo_at_workplace} label="Repo at workplace" />
            <BoolIndicator value={lead.public_embarrassment} label="Public embarrassment" />
            <BoolIndicator value={lead.excessive_noise} label="Excessive noise" />
          </div>
        </div>

        {/* Qualification Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" /> Qualification Breakdown
          </h3>
          {lead.qualification_breakdown ? (
            <div className="space-y-2">
              {Object.entries(lead.qualification_breakdown)
                .filter(([key]) => key !== 'details' && key !== 'penalties')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`font-medium ${(value as number) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      +{value as number}
                    </span>
                  </div>
                ))}
              {lead.qualification_breakdown.penalties !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Penalties</span>
                  <span className="font-medium text-red-500">{lead.qualification_breakdown.penalties}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="font-medium text-gray-900">Total Score</span>
                <span className="font-bold text-lg text-[#1B2A4A]">{lead.qualification_score}</span>
              </div>
              {lead.qualification_breakdown.details?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Details:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {lead.qualification_breakdown.details.map((d: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">+</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No breakdown available.</p>
          )}
        </div>

        {/* Evidence & Narrative */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" /> Evidence
          </h3>
          <div className="space-y-2">
            <BoolIndicator value={lead.has_photos_videos} label="Photos / Videos" />
            <BoolIndicator value={lead.has_documents} label="Documents" />
            <BoolIndicator value={lead.has_witnesses} label="Witnesses" />
            {lead.witness_info && (
              <p className="text-xs text-gray-500 mt-1">Witness info: {lead.witness_info}</p>
            )}
          </div>
          {lead.narrative && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Consumer Narrative
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{lead.narrative}</p>
            </div>
          )}
        </div>

        {/* Belongings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Personal Belongings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Had Belongings</span><span>{lead.had_belongings ? 'Yes' : 'No'}</span></div>
            {lead.had_belongings && (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Returned</span><span className="capitalize">{lead.belongings_returned?.replace('_', ' ')}</span></div>
                {lead.belongings_list && <div><span className="text-gray-500">Items:</span> <span className="text-xs">{lead.belongings_list}</span></div>}
                {lead.belongings_value && <div className="flex justify-between"><span className="text-gray-500">Est. Value</span><span>${lead.belongings_value}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Charged Fee</span><span>{lead.charged_fee_for_belongings ? 'Yes' : 'No'}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Military */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Military / SCRA</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Military Service</span><span>{lead.military_service ? 'Yes' : 'No'}</span></div>
            {lead.military_service && (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Branch</span><span className="capitalize">{lead.military_branch?.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Active Duty at Repo</span><span className={lead.active_duty_at_repo ? 'text-red-600 font-medium' : ''}>{lead.active_duty_at_repo ? 'Yes' : 'No'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>Created: {formatDate(lead.created_at)}</span>
          <span>Updated: {formatDate(lead.updated_at)}</span>
          {lead.ip_address && <span>IP: {lead.ip_address}</span>}
          <span>E-Signature: {lead.electronic_signature}</span>
        </div>
      </div>
    </div>
  );
}
