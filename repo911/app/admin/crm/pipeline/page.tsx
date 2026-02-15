'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const PIPELINE_COLUMNS = [
  { id: 'pending', label: 'New', color: 'bg-gray-500' },
  { id: 'qualified_hot', label: 'Hot', color: 'bg-red-500' },
  { id: 'qualified_warm', label: 'Warm', color: 'bg-yellow-500' },
  { id: 'qualified_cold', label: 'Cold', color: 'bg-blue-500' },
  { id: 'claimed', label: 'Claimed', color: 'bg-green-500' },
  { id: 'closed', label: 'Closed', color: 'bg-gray-400' },
];

interface PipelineLead {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  qualification_tier: string | null;
  qualification_score: number;
  repo_state: string | null;
  created_at: string;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crm/pipeline');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function handleDrop(newStatus: string) {
    if (!draggedId) return;

    const lead = leads.find((l) => l.id === draggedId);
    if (!lead || lead.status === newStatus) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedId ? { ...l, status: newStatus } : l))
    );
    setDraggedId(null);
    setDragOverColumn(null);

    try {
      const res = await fetch('/api/admin/crm/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: draggedId, status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setLeads((prev) =>
          prev.map((l) => (l.id === draggedId ? { ...l, status: lead.status } : l))
        );
      }
    } catch {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === draggedId ? { ...l, status: lead.status } : l))
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto">
          {PIPELINE_COLUMNS.map((col) => (
            <Skeleton key={col.id} className="h-96 w-64 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const getLeadsForColumn = (status: string) =>
    leads.filter((l) => l.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" /> Back to Contacts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pipeline</h1>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{leads.length} leads</span>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">Drag and drop leads between columns to update their status.</p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnLeads = getLeadsForColumn(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-64 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 transition-colors ${
                isOver ? 'border-[#1B2A4A] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-slate-700'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(column.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(column.id);
              }}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{column.label}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                  {columnLeads.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedId(lead.id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverColumn(null);
                    }}
                    className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${
                      draggedId === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link href={`/admin/leads/${lead.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-[#1B2A4A] dark:hover:text-blue-300 hover:underline leading-tight">
                        {lead.first_name} {lead.last_name}
                      </Link>
                      <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {lead.qualification_tier && (
                        <Badge variant={lead.qualification_tier === 'hot' ? 'hot' : lead.qualification_tier === 'warm' ? 'warm' : lead.qualification_tier === 'cold' ? 'cold' : 'default'}>
                          {lead.qualification_score}
                        </Badge>
                      )}
                      {lead.repo_state && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{lead.repo_state}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatDate(lead.created_at)}</p>
                  </div>
                ))}

                {columnLeads.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-500">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
