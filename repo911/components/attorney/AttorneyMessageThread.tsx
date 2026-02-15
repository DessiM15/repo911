'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  created_at: string;
  sender_type: 'consumer' | 'attorney';
  content: string;
  read: boolean;
}

interface AttorneyMessageThreadProps {
  leadId: string;
}

export function AttorneyMessageThread({ leadId }: AttorneyMessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/attorney/leads/${leadId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchMessages();
    // Poll every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

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
      const res = await fetch(`/api/attorney/leads/${leadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent('');
        await fetchMessages();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mt-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#3474BA]" />
        Messages
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="max-h-96 overflow-y-auto space-y-3 mb-4">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No messages yet. Send the first message to the consumer.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'attorney' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                      msg.sender_type === 'attorney'
                        ? 'bg-blue-50 dark:bg-blue-950 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === 'attorney' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {msg.sender_type === 'attorney' ? 'You' : 'Consumer'} &middot; {formatTime(msg.created_at)}
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
              placeholder="Type a message to the consumer..."
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
              variant="attorney"
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
