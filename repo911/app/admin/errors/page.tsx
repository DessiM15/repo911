'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  AlertOctagon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Clock,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrackedError, ErrorOccurrence, ErrorLevel, ErrorStatus } from '@/types';

// ---------- Constants ----------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'muted', label: 'Muted' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

// ---------- Small components ----------

function LevelBadge({ level }: { level: ErrorLevel }) {
  const config = {
    fatal:   { bg: 'bg-red-100 text-red-800', Icon: AlertOctagon },
    error:   { bg: 'bg-orange-100 text-orange-800', Icon: AlertCircle },
    warning: { bg: 'bg-yellow-100 text-yellow-700', Icon: AlertTriangle },
    info:    { bg: 'bg-blue-100 text-blue-700', Icon: Info },
  };
  const { bg, Icon } = config[level] || config.error;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: ErrorStatus }) {
  const config: Record<string, { bg: string; Icon: typeof CheckCircle2 }> = {
    unresolved: { bg: 'text-red-600', Icon: XCircle },
    resolved:   { bg: 'text-green-600', Icon: CheckCircle2 },
    ignored:    { bg: 'text-gray-400', Icon: XCircle },
    muted:      { bg: 'text-gray-400', Icon: Clock },
  };
  const { bg, Icon } = config[status] || config.unresolved;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${bg}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ---------- Main page ----------

export default function ErrorDashboard() {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, unresolved: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('unresolved');
  const [levelFilter, setLevelFilter] = useState('all');

  // Detail pane
  const [selectedError, setSelectedError] = useState<TrackedError | null>(null);
  const [occurrences, setOccurrences] = useState<ErrorOccurrence[]>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);

  const limit = 25;

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/errors?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setErrors(data.errors);
      setTotal(data.total);
      setStats(data.stats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, levelFilter, search]);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  async function loadOccurrences(error: TrackedError) {
    setSelectedError(error);
    setLoadingOccurrences(true);
    try {
      const res = await fetch(`/api/admin/errors?errorId=${error.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setOccurrences(data.occurrences || []);
    } finally {
      setLoadingOccurrences(false);
    }
  }

  async function updateStatus(errorId: string, status: string) {
    await fetch('/api/admin/errors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: errorId, status }),
    });
    fetchErrors();
    if (selectedError?.id === errorId) {
      setSelectedError((prev) => prev ? { ...prev, status: status as ErrorStatus } : null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Error Tracking</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Errors" value={stats.total} color="text-gray-900" />
        <StatCard label="Unresolved" value={stats.unresolved} color="text-red-600" />
        <StatCard label="Resolved" value={stats.total - stats.unresolved} color="text-green-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by message or error type..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
          >
            {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Split pane: Error list + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : errors.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No errors found.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">Errors ({total})</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {errors.map((err) => (
                  <button
                    key={err.id}
                    onClick={() => loadOccurrences(err)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedError?.id === err.id ? 'bg-blue-50 border-l-2 border-l-[#4A90D9]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <LevelBadge level={err.level} />
                          <StatusBadge status={err.status} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{err.error_type}</p>
                        <p className="text-xs text-gray-500 truncate">{err.message}</p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium ml-2 shrink-0">
                        {err.occurrence_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {err.tags?.length > 0 && (
                        <div className="flex gap-1">
                          {(err.tags as string[]).slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(err.last_seen).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail pane */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {selectedError ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{selectedError.error_type}</h2>
                    <p className="text-sm text-gray-500 break-words">{selectedError.message}</p>
                  </div>
                  <select
                    className="ml-3 px-2 py-1 border border-gray-300 rounded-lg text-xs shrink-0"
                    value={selectedError.status}
                    onChange={(e) => updateStatus(selectedError.id, e.target.value)}
                  >
                    <option value="unresolved">Unresolved</option>
                    <option value="resolved">Resolved</option>
                    <option value="ignored">Ignored</option>
                    <option value="muted">Muted</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Occurrences</span>
                    <p className="font-semibold text-gray-900">{selectedError.occurrence_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">First Seen</span>
                    <p className="font-semibold text-gray-900">{new Date(selectedError.first_seen).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Seen</span>
                    <p className="font-semibold text-gray-900">{new Date(selectedError.last_seen).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Recent Occurrences</h3>
                {loadingOccurrences ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto">
                    {occurrences.map((occ) => (
                      <div key={occ.id} className="border-l-2 border-[#4A90D9] pl-3 pb-3">
                        <p className="text-[10px] text-gray-400 mb-1">
                          {new Date(occ.created_at).toLocaleString()}
                        </p>

                        {occ.url && (
                          <p className="text-xs mb-1">
                            <span className="font-semibold text-gray-600">URL:</span>{' '}
                            <span className="text-gray-500 font-mono">{occ.url}</span>
                          </p>
                        )}

                        {occ.browser_name && (
                          <p className="text-xs text-gray-500 mb-1">
                            {occ.browser_name} {occ.browser_version} on {occ.os_name} ({occ.device_type})
                          </p>
                        )}

                        {occ.http_method && (
                          <p className="text-xs text-gray-500 mb-1">
                            <span className="font-mono font-semibold">{occ.http_method}</span> {occ.url}
                          </p>
                        )}

                        {occ.stack_trace && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-xs font-semibold text-gray-600 hover:text-gray-800">
                              Stack Trace
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] text-gray-600 overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
                              {occ.stack_trace}
                            </pre>
                          </details>
                        )}

                        {occ.breadcrumbs && occ.breadcrumbs.length > 0 && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-xs font-semibold text-gray-600 hover:text-gray-800">
                              Breadcrumbs ({occ.breadcrumbs.length})
                            </summary>
                            <div className="mt-1 space-y-0.5">
                              {occ.breadcrumbs.map((bc, i) => (
                                <div key={i} className="text-[10px] bg-gray-50 px-2 py-1 rounded font-mono">
                                  <span className="font-semibold text-gray-500">{bc.type}:</span> {bc.message}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Select an error to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
