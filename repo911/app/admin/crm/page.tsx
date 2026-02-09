'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Contact } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (stageFilter) params.set('stage', stageFilter);

      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, stageFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">CRM Contacts</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{contacts.length} contacts</span>
          <Link href="/admin/crm/pipeline" className="px-3 py-1.5 bg-[#1B2A4A] text-white text-sm rounded-lg hover:bg-[#2A3D66] transition-colors">
            Pipeline View
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Contact className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {(contact.tags || []).length > 3 && (
                        <span className="text-[10px] text-gray-400">+{contact.tags.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {contact.next_follow_up ? (
                      <span className={new Date(contact.next_follow_up) < new Date() ? 'text-red-500 font-medium' : 'text-gray-600'}>
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
      </div>
    </div>
  );
}
