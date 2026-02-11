import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

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
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const leadId = formData.get('leadId') as string;
    const files = formData.getAll('files') as File[];

    if (!email || !leadId) {
      return NextResponse.json(
        { error: 'Email and case ID are required.' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required.' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      return NextResponse.json(
        { error: 'Invalid case ID format.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify email + lead ID match
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, email, uploaded_files')
      .eq('id', leadId)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'No case found matching that email and case ID.' },
        { status: 404 }
      );
    }

    const existingFiles: { name: string; path: string; uploadedAt: string }[] = lead.uploaded_files || [];

    // Check total file count
    if (existingFiles.length + files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed. You already have ${existingFiles.length} uploaded.` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" has an unsupported type. Only images (JPG, PNG, WebP) and PDFs are allowed.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB size limit.` },
          { status: 400 }
        );
      }
    }

    // Upload files to Supabase Storage
    const uploadedFiles: { name: string; path: string; uploadedAt: string }[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${leadId}/${timestamp}_${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from('lead-evidence')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload "${file.name}". Please try again.` },
          { status: 500 }
        );
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
      .eq('id', leadId);

    if (updateError) {
      console.error('Lead update error:', updateError);
      return NextResponse.json(
        { error: 'Files uploaded but failed to update case record. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      total: allFiles.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
