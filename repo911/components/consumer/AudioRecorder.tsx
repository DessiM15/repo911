'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

// Web Speech API type declarations (not in default TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type RecorderState = 'idle' | 'recording' | 'preview' | 'uploading' | 'done';

interface AudioRecorderProps {
  email: string;
  leadId: string;
  onComplete?: () => void;
}

const MAX_DURATION = 180; // 3 minutes

export function AudioRecorder({ email, leadId, onComplete }: AudioRecorderProps) {
  const t = useTranslations('audioRecorder');
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('preview');

        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      setState('recording');
      setElapsed(0);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

      // Web Speech API for live transcription (graceful degradation)
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        let fullTranscript = '';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              fullTranscript += event.results[i][0].transcript + ' ';
              setTranscript(fullTranscript.trim());
            }
          }
        };

        recognition.onerror = () => {
          // Silently degrade — transcription is optional
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Recording error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(t('micPermissionError'));
      } else {
        setError(String(err instanceof Error ? err.message : 'Failed to start recording. Please try again.'));
      }
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reRecord = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setTranscript('');
    setElapsed(0);
    setIsPlaying(false);
    setState('idle');
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioElRef.current || !audioUrl) return;

    if (isPlaying) {
      audioElRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const handleUpload = useCallback(async () => {
    if (!audioBlobRef.current) return;
    setState('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('leadId', leadId);
      formData.append('transcript', transcript);
      formData.append('audio', audioBlobRef.current, 'story.webm');

      const res = await fetch('/api/leads/story', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('uploadError'));
        setState('preview');
        return;
      }

      setState('done');
      onComplete?.();
    } catch {
      setError(t('uploadError'));
      setState('preview');
    }
  }, [email, leadId, transcript, onComplete, t]);

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* IDLE state */}
      {state === 'idle' && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('instructions')}</p>
          <Button variant="consumer" onClick={startRecording}>
            <Mic className="mr-2 h-4 w-4" />
            {t('startRecording')}
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('maxDuration')}</p>
        </div>
      )}

      {/* RECORDING state */}
      {state === 'recording' && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('recording')}</span>
          </div>
          <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatTime(elapsed)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t('timeRemaining', { time: formatTime(MAX_DURATION - elapsed) })}
          </p>
          <Button variant="danger" onClick={stopRecording}>
            <Square className="mr-2 h-4 w-4" />
            {t('stopRecording')}
          </Button>
          {transcript && (
            <div className="mt-4 text-left bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('liveTranscript')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW state */}
      {state === 'preview' && audioUrl && (
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime(elapsed)} {t('recorded')}
            </span>
          </div>
          <audio
            ref={audioElRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          {transcript && (
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('transcript')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">{transcript}</p>
            </div>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={reRecord}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('reRecord')}
            </Button>
            <Button variant="consumer" onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              {t('submit')}
            </Button>
          </div>
        </div>
      )}

      {/* UPLOADING state */}
      {state === 'uploading' && (
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 text-[#3474BA] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('uploading')}</p>
        </div>
      )}

      {/* DONE state */}
      {state === 'done' && (
        <div className="text-center py-6">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('success')}</p>
          <Button variant="outline" size="sm" onClick={reRecord} className="mt-3">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('recordAgain')}
          </Button>
        </div>
      )}
    </div>
  );
}
