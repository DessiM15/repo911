import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { leadUploadSchema } from '@/lib/validations/consumer';
import { apiSuccess, apiError } from '@/lib/api-response';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 uploads per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`lead_upload:${ip}`, { limit: 10, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many upload requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const leadId = formData.get('leadId') as string;
    const files = formData.getAll('files') as File[];

    // Validate JSON fields with Zod
    const parsed = leadUploadSchema.safeParse({ email, leadId });
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    if (!files || files.length === 0) {
      return apiError('At least one file is required.', 400);
    }

    const supabase = createAdminClient();

    // Verify email + lead ID match
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, email, uploaded_files')
      .eq('id', parsed.data.leadId)
      .eq('email', parsed.data.email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      return apiError('No case found matching that email and case ID.', 404);
    }

    const existingFiles: { name: string; path: string; uploadedAt: string }[] = lead.uploaded_files || [];

    // Check total file count
    if (existingFiles.length + files.length > MAX_FILES) {
      return apiError(
        `Maximum ${MAX_FILES} files allowed. You already have ${existingFiles.length} uploaded.`,
        400
      );
    }

    // Validate each file (type/size stays manual — not JSON)
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return apiError(
          `File "${file.name}" has an unsupported type. Only images (JPG, PNG, WebP) and PDFs are allowed.`,
          400
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return apiError(`File "${file.name}" exceeds the 10MB size limit.`, 400);
      }
    }

    // Upload files to Supabase Storage
    const uploadedFiles: { name: string; path: string; uploadedAt: string }[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${parsed.data.leadId}/${timestamp}_${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from('lead-evidence')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return apiError(`Failed to upload "${file.name}". Please try again.`, 500);
      }

      uploadedFiles.push({
        name: file.name,
        path: storagePath,
        uploadedAt: new Date().toISOString(),
      });
    }

    // Update lead record with file info
    const allFiles = [...existingFiles, ...uploadedFiles];
    const { error: updateError } = await supabase
      .from('leads')
      .update({ uploaded_files: allFiles })
      .eq('id', parsed.data.leadId);

    if (updateError) {
      console.error('Lead update error:', updateError);
      return apiError('Files uploaded but failed to update case record. Please contact support.', 500);
    }

    return apiSuccess({
      success: true,
      uploaded: uploadedFiles.length,
      total: allFiles.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return apiError('An unexpected error occurred. Please try again.', 500);
  }
}
