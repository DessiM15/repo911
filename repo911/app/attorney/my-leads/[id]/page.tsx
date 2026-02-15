'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Car, Calendar,
  FileText, AlertTriangle, Shield, Camera, Notebook,
  Download, FileImage, File,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AttorneyMessageThread } from '@/components/attorney/AttorneyMessageThread';
import { formatDate, formatPhone } from '@/lib/utils';
import type { Lead } from '@/types';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  url: string | null;
}

export default function MyLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [caseStatus, setCaseStatus] = useState('open');
  const [saving, setSaving] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/attorney/leads/${id}`);
        const data = await res.json();
        if (res.ok && data.full_access) {
          setLead(data.lead);
          // Load case management data from fee_tracking if available
          if (data.fee_tracking) {
            setCaseStatus(data.fee_tracking.case_status || 'open');
            setNotes(data.fee_tracking.notes || '');
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchLead();
  }, [id]);

  // Fetch evidence files once lead is loaded
  useEffect(() => {
    async function fetchEvidence() {
      if (!lead || !lead.uploaded_files || lead.uploaded_files.length === 0) return;
      setEvidenceLoading(true);
      try {
        const res = await fetch(`/api/attorney/evidence?lead_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvidenceFiles(data.files || []);
        }
      } catch {
        // silently fail
      } finally {
        setEvidenceLoading(false);
      }
    }
    fetchEvidence();
  }, [lead, id]);

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/attorney/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_status: caseStatus, notes }),
      });
      if (res.ok) {
        toast.success('Saved successfully');
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
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

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Lead not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to My Leads
      </button>

      {/* Contact Info Banner */}
      <div className="bg-[#1B2A4A] text-white rounded-xl p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5" />
              <h1 className="text-xl font-bold">{lead.first_name} {lead.last_name}</h1>
              <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : 'cold'}>
                {lead.qualification_tier?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/70 mt-2">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{formatPhone(lead.phone)}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lead.street_address}, {lead.city}, {lead.state} {lead.zip_code}</span>
            </div>
          </div>
          <div className="text-right text-sm text-white/50">
            <p>Claimed {lead.claimed_at ? formatDate(lead.claimed_at) : 'N/A'}</p>
            <p>Score: {lead.qualification_score}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Vehicle & Repo Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Car className="h-5 w-5 text-gray-400 dark:text-gray-500" /> Vehicle &amp; Repo Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Vehicle</span><span>{[lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(' ')}</span></div>
            {lead.vehicle_color && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Color</span><span>{lead.vehicle_color}</span></div>}
            {lead.vin && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">VIN</span><span className="font-mono text-xs">{lead.vin}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Type</span><span className="capitalize">{lead.lease_or_finance?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Lender</span><span>{lead.lender_name}</span></div>
            {lead.repo_company_name && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Repo Company</span><span>{lead.repo_company_name}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Repo Date</span><span>{lead.repo_date ? formatDate(lead.repo_date) : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Repo State</span><span>{lead.repo_state}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Location</span><span>{lead.repo_location?.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Behind on Payments</span><span className="capitalize">{lead.behind_on_payments?.replace('_', ' ')}</span></div>
            {lead.payments_behind && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Payments Behind</span><span>{lead.payments_behind}</span></div>}
          </div>
        </div>

        {/* Violation Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Violations
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Verbally Objected</span><span className="capitalize">{lead.verbally_objected?.replace('_', ' ')}</span></div>
            {lead.continued_after_objection && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Continued After</span><span className="capitalize">{lead.continued_after_objection}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Force/Threats</span><span>{lead.physical_force_or_threats ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Entered Locked Area</span><span>{lead.entered_locked_area ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Property Damage</span><span>{lead.property_damage ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Police Present</span><span>{lead.police_present ? 'Yes' : 'No'}</span></div>
            {lead.police_assisted && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Police Assisted</span><span className="capitalize">{lead.police_assisted}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Workplace Repo</span><span>{lead.repo_at_workplace ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Public Embarrassment</span><span>{lead.public_embarrassment ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Written Notice</span><span className="capitalize">{lead.received_written_notice?.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Notice of Sale</span><span className="capitalize">{lead.received_notice_of_sale?.replace('_', ' ')}</span></div>
          </div>
        </div>

        {/* Belongings & Military */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Belongings &amp; Military
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Had Belongings</span><span>{lead.had_belongings ? 'Yes' : 'No'}</span></div>
            {lead.belongings_returned && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Returned</span><span className="capitalize">{lead.belongings_returned}</span></div>}
            {lead.belongings_list && <div><span className="text-gray-500 dark:text-gray-400 block">Items:</span><span className="text-gray-700 dark:text-gray-300">{lead.belongings_list}</span></div>}
            {lead.belongings_value && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Value</span><span>${lead.belongings_value}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Charged Fee</span><span>{lead.charged_fee_for_belongings ? 'Yes' : 'No'}</span></div>
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700" />
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Military Service</span><span>{lead.military_service ? 'Yes' : 'No'}</span></div>
            {lead.military_branch && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Branch</span><span className="capitalize">{lead.military_branch.replace('_', ' ')}</span></div>}
            {lead.active_duty_at_repo && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Active Duty at Repo</span><span className="text-red-600 font-medium">Yes</span></div>}
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700" />
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">FDCPA Violations</span><span>{lead.fdcpa_violations?.length || 0}</span></div>
            {lead.fdcpa_violations && lead.fdcpa_violations.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{lead.fdcpa_violations.join(', ')}</div>
            )}
          </div>
        </div>

        {/* Evidence & Narrative */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" /> Evidence
          </h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Photos/Videos</span><span>{lead.has_photos_videos ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Documents</span><span>{lead.has_documents ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Witnesses</span><span>{lead.has_witnesses ? 'Yes' : 'No'}</span></div>
            {lead.witness_info && <div><span className="text-gray-500 dark:text-gray-400 block">Witness Info:</span><span>{lead.witness_info}</span></div>}
          </div>
          {lead.narrative && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Full Narrative
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{lead.narrative}</p>
            </div>
          )}

          {/* Uploaded Evidence Files */}
          {lead.uploaded_files && lead.uploaded_files.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                <Download className="h-4 w-4" /> Uploaded Files ({lead.uploaded_files.length})
              </p>
              {evidenceLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: lead.uploaded_files.length }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {evidenceFiles.map((file, i) => {
                    const isImage = file.type?.startsWith('image/');
                    return (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-2.5">
                        {isImage ? (
                          <FileImage className="h-5 w-5 text-blue-500 shrink-0" />
                        ) : (
                          <File className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                          </p>
                        </div>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3474BA] hover:underline font-medium shrink-0"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <AttorneyMessageThread leadId={id} />

      {/* Case Management */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mt-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Notebook className="h-5 w-5 text-green-500" /> Case Management
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Case Status"
            value={caseStatus}
            onChange={(e) => setCaseStatus(e.target.value)}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'settled', label: 'Settled' },
              { value: 'dismissed', label: 'Dismissed' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <div />
          <div className="sm:col-span-2">
            <Textarea
              label="Attorney Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this case..."
              rows={4}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="attorney" size="sm" onClick={handleSaveNotes} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
