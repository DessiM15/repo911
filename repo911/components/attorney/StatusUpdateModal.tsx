'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CaseStatusBadge } from './CaseStatusBadge';
import { VALID_TRANSITIONS } from '@/lib/validations/attorney';
import type { CaseStatus } from '@/types';

const STATUS_LABELS: Record<CaseStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  settled: 'Settled',
  dismissed: 'Dismissed',
  closed: 'Closed',
  paid: 'Paid',
};

interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  caseId: string;
  currentStatus: CaseStatus;
}

export function StatusUpdateModal({ open, onClose, onSuccess, caseId, currentStatus }: StatusUpdateModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const transitions = VALID_TRANSITIONS[currentStatus] || [];
  const isTerminal = transitions.length === 0;
  const requiresSettlement = newStatus === 'settled' || newStatus === 'paid';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) return;

    setLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = { case_status: newStatus };
      if (note.trim()) body.note = note.trim();
      if (settlementAmount) body.settlement_amount = parseFloat(settlementAmount);

      const res = await fetch(`/api/attorney/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
        return;
      }

      // Reset and close
      setNewStatus('');
      setNote('');
      setSettlementAmount('');
      onSuccess();
      onClose();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNewStatus('');
    setNote('');
    setSettlementAmount('');
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Update Case Status" size="md">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Status</p>
          <CaseStatusBadge status={currentStatus} />
        </div>

        {isTerminal ? (
          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-gray-500 dark:text-gray-400">
            This case is in a terminal state. No further transitions are available.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="New Status"
              required
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="Select new status"
              options={transitions.map((s) => ({
                value: s,
                label: STATUS_LABELS[s as CaseStatus] || s,
              }))}
            />

            {requiresSettlement && (
              <Input
                label="Settlement Amount ($)"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
              />
            )}

            <Textarea
              label="Note (optional)"
              placeholder="Add a note about this status change..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="attorney" loading={loading} disabled={!newStatus}>
                Update Status
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
