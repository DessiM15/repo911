'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { AuditLogEntry } from '@/types';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const params = new URLSearchParams();
        if (entityFilter) params.set('entity_type', entityFilter);
        params.set('limit', '50');

        const res = await fetch(`/api/admin/audit-log?${params}`);
        if (!res.ok) {
          setError('Failed to load audit log');
          return;
        }
        const data = await res.json();
        setEntries(data.entries);
      } catch {
        setError('Failed to load audit log');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, [entityFilter]);

  function entityLink(entry: AuditLogEntry) {
    if (!entry.entity_id) return null;
    if (entry.entity_type === 'lead') {
      return `/admin/leads/${entry.entity_id}`;
    }
    if (entry.entity_type === 'attorney') {
      return `/admin/attorneys/${entry.entity_id}`;
    }
    return null;
  }

  function formatValues(values: Record<string, unknown> | null) {
    if (!values || Object.keys(values).length === 0) return null;
    return Object.entries(values)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Audit Log
        </h1>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={entityFilter}
            onChange={(e) => {
              setLoading(true);
              setEntityFilter(e.target.value);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All entities</option>
            <option value="lead">Leads</option>
            <option value="attorney">Attorneys</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Old Values</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">New Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No audit log entries found.
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                const link = entityLink(entry);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{entry.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-600">{entry.entity_type}</span>
                      {link ? (
                        <Link href={link} className="ml-1 text-[#3474BA] hover:underline text-xs">
                          View
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {formatValues(entry.old_values) || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {formatValues(entry.new_values) || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
