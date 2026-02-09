'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, MapPin, Tag, Calendar,
  MessageSquare, AlertTriangle, Clock, Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const STAGES = ['new', 'contacted', 'engaged', 'converted', 'closed'];

function getActivityIcon(type: string) {
  switch (type) {
    case 'note': return MessageSquare;
    case 'email_sent': return Mail;
    case 'call': return Phone;
    case 'status_change': return Tag;
    case 'lead_claimed': return Calendar;
    case 'payment': return Calendar;
    default: return Clock;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'note': return 'bg-blue-100 text-blue-600';
    case 'email_sent': return 'bg-green-100 text-green-600';
    case 'call': return 'bg-purple-100 text-purple-600';
    case 'status_change': return 'bg-amber-100 text-amber-600';
    case 'lead_claimed': return 'bg-emerald-100 text-emerald-600';
    case 'payment': return 'bg-emerald-100 text-emerald-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function CRMContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contact, setContact] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attorney, setAttorney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [stageEdit, setStageEdit] = useState('');
  const [savingStage, setSavingStage] = useState(false);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`/api/admin/crm/contacts/${id}`);
        if (!res.ok) {
          setError('Failed to load contact');
          return;
        }
        const data = await res.json();
        setContact(data.contact);
        setActivities(data.activities);
        setLead(data.lead);
        setAttorney(data.attorney);
        setStageEdit(data.contact.lifecycle_stage);
      } catch {
        setError('Failed to load contact details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchContact();
  }, [id]);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_note: newNote }),
      });
      if (res.ok) {
        // Add to local state
        const noteActivity = {
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          activity_type: 'note',
          description: newNote,
          performed_by: 'Admin',
        };
        setActivities((prev) => [noteActivity, ...prev]);
        const noteObj = {
          timestamp: new Date().toISOString(),
          author: 'Admin',
          note_text: newNote,
        };
        setContact((prev: typeof contact) => ({
          ...prev,
          notes: [...(prev.notes || []), noteObj],
        }));
        setNewNote('');
      }
    } catch {
      setError('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }

  async function handleStageUpdate() {
    setSavingStage(true);
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifecycle_stage: stageEdit }),
      });
      if (res.ok) {
        setContact((prev: typeof contact) => ({ ...prev, lifecycle_stage: stageEdit }));
      }
    } catch {
      setError('Failed to update stage');
    } finally {
      setSavingStage(false);
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

  if (error && !contact) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <Link href="/admin/crm" className="text-sm text-[#4A90D9] hover:underline mt-2 inline-block">
          Back to CRM
        </Link>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{contact.first_name} {contact.last_name}</h1>
              <Badge variant={contact.contact_type === 'attorney' ? 'info' : 'default'}>
                {contact.contact_type}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {contact.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{contact.email}</span>}
              {contact.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{contact.phone}</span>}
              {contact.state && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{contact.city ? `${contact.city}, ` : ''}{contact.state}</span>}
            </div>
          </div>
          <div>
            {lead && (
              <Link href={`/admin/leads/${lead.id}`} className="text-sm text-[#4A90D9] hover:underline">
                View Lead &rarr;
              </Link>
            )}
            {attorney && (
              <Link href={`/admin/attorneys/${attorney.id}`} className="text-sm text-[#4A90D9] hover:underline">
                View Attorney &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Stage + Tags */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Stage:</label>
          <select
            value={stageEdit}
            onChange={(e) => setStageEdit(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {stageEdit !== contact.lifecycle_stage && (
            <Button size="sm" variant="primary" onClick={handleStageUpdate} loading={savingStage}>
              Save
            </Button>
          )}

          {contact.tags?.length > 0 && (
            <div className="flex items-center gap-1 ml-4">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              {contact.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {contact.next_follow_up && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Next follow-up:</span>
            <span className={new Date(contact.next_follow_up) < new Date() ? 'text-red-500 font-medium' : 'text-gray-700'}>
              {formatDate(contact.next_follow_up)}
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline</h3>

          {/* Add Note */}
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
            />
            <Button size="sm" variant="primary" onClick={handleAddNote} loading={addingNote} disabled={!newNote.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {activities.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
            )}
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const color = getActivityColor(activity.activity_type);
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(activity.created_at)}</span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-700 mt-0.5">{activity.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Notes ({(contact.notes || []).length})</h3>
          <div className="space-y-3">
            {(contact.notes || []).length === 0 && (
              <p className="text-sm text-gray-400">No notes yet.</p>
            )}
            {(contact.notes || []).slice().reverse().map((note: { timestamp: string; author: string; note_text: string }, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{note.note_text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>{note.author}</span>
                  <span>&middot;</span>
                  <span>{formatDate(note.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Info Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="capitalize">{contact.contact_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Created</span><span>{formatDate(contact.created_at)}</span></div>
              {contact.last_contacted_at && (
                <div className="flex justify-between"><span className="text-gray-400">Last Contacted</span><span>{formatDate(contact.last_contacted_at)}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
