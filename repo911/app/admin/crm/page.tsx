'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Contact, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { CrmContact } from '@/types';

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'attorney', label: 'Attorney' },
];

function getStageBadgeVariant(stage: string): 'info' | 'warning' | 'success' | 'default' {
  switch (stage) {
    case 'new': return 'info';
    case 'contacted': return 'warning';
    case 'engaged': return 'warning';
    case 'converted': return 'success';
    case 'closed': return 'default';
    default: return 'default';
  }
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const debouncedTag = useDebounce(tagFilter);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter) params.set('type', typeFilter);
      if (stageFilter) params.set('stage', stageFilter);
      if (debouncedTag) params.set('tag', debouncedTag);

      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      if (!res.ok) {
        setError('Failed to load data. Please try again.');
        return;
      }
      const data = await res.json();
      setContacts(data.contacts);
      setTotal(data.pagination?.total || data.contacts.length);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, stageFilter, debouncedTag, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">CRM Contacts</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} contacts</span>
          <Link href="/admin/crm/pipeline" className="px-3 py-1.5 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Pipeline View
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name or email..."
              aria-label="Search contacts"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            aria-label="Filter by type"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            aria-label="Filter by stage"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter by tag..."
              aria-label="Filter by tag"
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Contact className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No contacts found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link href={`/admin/crm/${contact.id}`} className="font-medium text-[#1B2A4A] hover:underline">
                      {contact.first_name} {contact.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.contact_type === 'attorney' ? 'info' : 'default'}>
                      {contact.contact_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{contact.email || '—'}</TableCell>
                  <TableCell>{contact.state || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getStageBadgeVariant(contact.lifecycle_stage)}>
                      {contact.lifecycle_stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(contact.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {(contact.tags || []).length > 3 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">+{contact.tags!.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {contact.next_follow_up ? (
                      <span className={new Date(contact.next_follow_up) < new Date() ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {formatDate(contact.next_follow_up)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(contact.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

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
