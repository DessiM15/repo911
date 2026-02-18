'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { AuditLogEntry } from '@/types';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  useEffect(() => {
    async function fetchAuditLog() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (entityFilter) params.set('entity_type', entityFilter);

        const res = await fetch(`/api/admin/audit-log?${params}`);
        if (!res.ok) {
          setError('Failed to load audit log');
          return;
        }
        const data = await res.json();
        setEntries(data.entries);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch {
        setError('Failed to load audit log');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, [entityFilter, page]);

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Audit Log
        </h1>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100"
          >
            <option value="">All entities</option>
            <option value="lead">Leads</option>
            <option value="attorney">Attorneys</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Old Values</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">New Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No audit log entries found.
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                const link = entityLink(entry);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-600 dark:text-gray-400">{entry.entity_type}</span>
                      {link ? (
                        <Link href={link} className="ml-1 text-[#3474BA] dark:text-blue-300 hover:underline text-xs">
                          View
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {formatValues(entry.old_values) || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {formatValues(entry.new_values) || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
