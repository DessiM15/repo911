'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

function getCaseStatusVariant(status: string): 'info' | 'success' | 'warning' | 'default' {
  switch (status) {
    case 'open': return 'info';
    case 'settled': return 'success';
    case 'dismissed': return 'warning';
    case 'paid': return 'success';
    default: return 'default';
  }
}

export default function FeeTrackingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fees, setFees] = useState<any[]>([]);
  const [attorneys, setAttorneys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [caseStatusFilter, setCaseStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (caseStatusFilter) params.set('case_status', caseStatusFilter);

      const res = await fetch(`/api/admin/fee-tracking?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFees(data.fees);
        setAttorneys(data.attorneys);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [caseStatusFilter]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startEdit(fee: any) {
    setEditingId(fee.id);
    setEditValues({
      case_status: fee.case_status || 'open',
      attorney_total_fee: fee.attorney_total_fee?.toString() || '',
      notes: fee.notes || '',
    });
  }

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        fee_id: editingId,
        case_status: editValues.case_status,
        notes: editValues.notes || null,
      };
      if (editValues.attorney_total_fee) {
        updates.attorney_total_fee = parseFloat(editValues.attorney_total_fee);
      }

      const res = await fetch('/api/admin/fee-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setFees((prev) =>
          prev.map((f) =>
            f.id === editingId
              ? {
                  ...f,
                  case_status: editValues.case_status,
                  attorney_total_fee: editValues.attorney_total_fee ? parseFloat(editValues.attorney_total_fee) : f.attorney_total_fee,
                  notes: editValues.notes || null,
                }
              : f
          )
        );
        setEditingId(null);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Case Tracking</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={caseStatusFilter}
          onChange={(e) => setCaseStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
        >
          <option value="">All Case Statuses</option>
          <option value="open">Open</option>
          <option value="settled">Settled</option>
          <option value="dismissed">Dismissed</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No case tracking records found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Attorney</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Case Status</TableHead>
                <TableHead>Attorney Fee</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const isEditing = editingId === fee.id;
                return (
                  <TableRow key={fee.id}>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(fee.created_at)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/attorneys/${fee.attorney_id}`} className="text-sm font-medium text-[#1B2A4A] hover:underline">
                        {attorneys[fee.attorney_id] || 'Unknown'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/leads/${fee.lead_id}`} className="text-sm text-[#4A90D9] hover:underline">
                        View
                      </Link>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <select
                          value={editValues.case_status}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, case_status: e.target.value }))}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="open">Open</option>
                          <option value="settled">Settled</option>
                          <option value="dismissed">Dismissed</option>
                          <option value="paid">Paid</option>
                        </select>
                      ) : (
                        <Badge variant={getCaseStatusVariant(fee.case_status)}>
                          {fee.case_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.attorney_total_fee}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, attorney_total_fee: e.target.value }))}
                          placeholder="0.00"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      ) : (
                        <span className="text-sm">{fee.attorney_total_fee ? `$${fee.attorney_total_fee.toLocaleString()}` : '—'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.notes}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      ) : (
                        fee.notes || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="primary" onClick={handleSave} loading={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(fee)}
                          className="text-xs text-[#4A90D9] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
