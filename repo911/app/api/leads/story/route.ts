import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { leadStorySchema } from '@/lib/validations/consumer';
import { transcribeAudio } from '@/lib/transcribe';
import { apiSuccess, apiError } from '@/lib/api-response';

const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 uploads per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`lead_story:${ip}`, { limit: 5, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const leadId = formData.get('leadId') as string;
    const browserTranscript = (formData.get('transcript') as string) || '';
    const audioFile = formData.get('audio') as File | null;

    // Validate JSON fields with Zod
    const parsed = leadStorySchema.safeParse({ email, leadId, transcript: browserTranscript });
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    if (!audioFile) {
      return apiError('Audio file is required.', 400);
    }

    // Validate audio type and size
    const baseType = audioFile.type.split(';')[0].trim();
    if (!ALLOWED_AUDIO_TYPES.includes(baseType)) {
      return apiError('Unsupported audio format. Please use WebM, OGG, MP4, or MPEG.', 400);
    }
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return apiError('Audio file exceeds the 10MB size limit.', 400);
    }

    const supabase = createAdminClient();

    // Verify email + lead ID match
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, email, story_audio_path')
      .eq('id', parsed.data.leadId)
      .eq('email', parsed.data.email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      return apiError('No case found matching that email and case ID.', 404);
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // If re-recording, delete the old file
    if (lead.story_audio_path) {
      await supabase.storage
        .from('lead-stories')
        .remove([lead.story_audio_path]);
    }

    // Upload audio to Supabase Storage
    const timestamp = Date.now();
    const ext = baseType === 'audio/mpeg' ? 'mp3' : baseType.split('/')[1];
    const storagePath = `${parsed.data.leadId}/${timestamp}_story.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('lead-stories')
      .upload(storagePath, audioBuffer, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Story audio upload error:', uploadError);
      return apiError('Failed to upload audio. Please try again.', 500);
    }

    // Transcribe (currently browser passthrough, swappable to Whisper)
    const { transcript } = await transcribeAudio(audioBuffer, parsed.data.transcript);

    // Update lead record
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        story_audio_path: storagePath,
        story_transcript: transcript,
        story_recorded_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.leadId);

    if (updateError) {
      console.error('Lead story update error:', updateError);
      return apiError('Audio uploaded but failed to update case record. Please contact support.', 500);
    }

    return apiSuccess({ success: true, storagePath });
  } catch (error) {
    console.error('Story upload error:', error);
    return apiError('An unexpected error occurred. Please try again.', 500);
  }
}
