import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Authentication required', 401);
    }

    // Rate limit: 10 per user per 15 minutes
    const rl = rateLimit(`consumer_upload:${user.id}`, { limit: 10, windowSeconds: 900 });
    if (!rl.success) {
      return apiError('Too many upload requests. Please try again later.', 429, undefined, {
        'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
      });
    }

    // Verify lead ownership via RLS
    const { data: lead } = await supabase
      .from('leads')
      .select('id, uploaded_files')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return apiError('Case not found', 404);
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return apiError('At least one file is required.', 400);
    }

    const existingFiles: { name: string; path: string; uploadedAt: string }[] =
      lead.uploaded_files || [];

    if (existingFiles.length + files.length > MAX_FILES) {
      return apiError(
        `Maximum ${MAX_FILES} files allowed. You already have ${existingFiles.length} uploaded.`,
        400
      );
    }

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

    // Upload to storage via admin client (no consumer RLS on storage bucket)
    const admin = createAdminClient();
    const uploadedFiles: { name: string; path: string; uploadedAt: string }[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${leadId}/${timestamp}_${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await admin.storage
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

    // Update lead record via admin client
    const allFiles = [...existingFiles, ...uploadedFiles];
    const { error: updateError } = await admin
      .from('leads')
      .update({ uploaded_files: allFiles })
      .eq('id', leadId);

    if (updateError) {
      console.error('Lead update error:', updateError);
      return apiError(
        'Files uploaded but failed to update case record. Please contact support.',
        500
      );
    }

    return apiSuccess({
      success: true,
      uploaded: uploadedFiles.length,
      total: allFiles.length,
    });
  } catch (error) {
    console.error('Consumer file upload error:', error);
    return apiError('An unexpected error occurred. Please try again.', 500);
  }
}
