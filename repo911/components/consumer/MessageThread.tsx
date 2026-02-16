'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  created_at: string;
  sender_type: 'consumer' | 'attorney';
  content: string;
  read: boolean;
}

interface MessageThreadProps {
  email: string;
  leadId: string;
}

export function MessageThread({ email, leadId }: MessageThreadProps) {
  const t = useTranslations('messages');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/leads/messages?email=${encodeURIComponent(email)}&leadId=${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [email, leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/leads/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, leadId, content: content.trim() }),
      });

      if (res.ok) {
        setContent('');
        await fetchMessages();
      } else {
        const data = await res.json();
        setError(data.error || t('sendError'));
      }
    } catch {
      setError(t('sendErrorRetry'));
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#3474BA] dark:text-blue-400" />
        {t('title')}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="max-h-96 overflow-y-auto space-y-3 mb-4">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {t('emptyState')}
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'consumer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                      msg.sender_type === 'consumer'
                        ? 'bg-blue-50 dark:bg-blue-950 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === 'consumer' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {msg.sender_type === 'consumer' ? t('senderYou') : t('senderAttorney')} &middot; {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('placeholder')}
              rows={2}
              maxLength={2000}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3474BA]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              variant="consumer"
              size="sm"
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="self-end"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
