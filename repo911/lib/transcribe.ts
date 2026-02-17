/**
 * Transcription abstraction — "Whisper-ready"
 *
 * Currently passes through the browser-provided transcript (Web Speech API).
 * To upgrade to OpenAI Whisper, replace the function body with an API call.
 */

interface TranscriptionResult {
  transcript: string;
  source: 'browser' | 'whisper';
}

export async function transcribeAudio(
  _audioBuffer: Buffer,
  browserTranscript: string
): Promise<TranscriptionResult> {
  // --- Current: browser-based passthrough ---
  return {
    transcript: browserTranscript,
    source: 'browser',
  };

  // --- Future: OpenAI Whisper ---
  // const formData = new FormData();
  // formData.append('file', new Blob([audioBuffer]), 'story.webm');
  // formData.append('model', 'whisper-1');
  //
  // const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  //   body: formData,
  // });
  // const data = await res.json();
  // return { transcript: data.text, source: 'whisper' };
}
