'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  leadId: string;
}

export function AudioPlayer({ leadId }: AudioPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAndPlay = useCallback(async () => {
    if (url && audioRef.current) {
      // Already loaded — just toggle playback
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Lazy-load signed URL
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/attorney/story?lead_id=${leadId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load audio');
        return;
      }
      const data = await res.json();
      if (!data.url) {
        setError('Audio not available');
        return;
      }
      setUrl(data.url);

      // Wait for the audio element to be ready after state update
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    } catch {
      setError('Failed to load audio');
    } finally {
      setLoading(false);
    }
  }, [url, isPlaying, leadId]);

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
      <Button
        variant="outline"
        size="sm"
        onClick={loadAndPlay}
        disabled={loading}
        className="shrink-0"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex items-center gap-2 min-w-0">
        <Volume2 className="h-4 w-4 text-[#1B2A4A] dark:text-blue-300 shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {loading ? 'Loading audio...' : isPlaying ? 'Playing story audio' : 'Play story audio'}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {url && (
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
