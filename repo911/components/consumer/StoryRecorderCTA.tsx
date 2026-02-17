'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AudioRecorder } from './AudioRecorder';

interface StoryRecorderCTAProps {
  email: string;
  leadId: string;
  hasExistingStory?: boolean;
  onComplete?: () => void;
}

export function StoryRecorderCTA({ email, leadId, hasExistingStory, onComplete }: StoryRecorderCTAProps) {
  const t = useTranslations('audioRecorder');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="consumer"
        onClick={() => setOpen(true)}
      >
        <Mic className="mr-2 h-4 w-4" />
        {hasExistingStory ? t('reRecordStory') : t('tellYourStory')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('modalTitle')}
        description={t('modalDescription')}
        size="lg"
      >
        <AudioRecorder
          email={email}
          leadId={leadId}
          onComplete={() => {
            onComplete?.();
          }}
        />
      </Modal>
    </>
  );
}
