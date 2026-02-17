'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AudioRecorder } from '@/components/consumer/AudioRecorder';

interface StoryRecorderCTAWrapperProps {
  leadId: string;
}

export function StoryRecorderCTAWrapper({ leadId }: StoryRecorderCTAWrapperProps) {
  const t = useTranslations('audioRecorder');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  return (
    <>
      <Button variant="consumer" onClick={() => setOpen(true)}>
        <Mic className="mr-2 h-4 w-4" />
        {t('tellYourStory')}
      </Button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEmailConfirmed(false); setEmail(''); }}
        title={t('modalTitle')}
        description={t('modalDescription')}
        size="lg"
      >
        {!emailConfirmed ? (
          <form
            onSubmit={(e) => { e.preventDefault(); if (email.trim()) setEmailConfirmed(true); }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="story-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="story-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3474BA] dark:bg-slate-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the email you used to submit your case.
              </p>
            </div>
            <Button type="submit" variant="consumer" className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <AudioRecorder email={email} leadId={leadId} />
        )}
      </Modal>
    </>
  );
}
