import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET(request: NextRequest) {
  try {
    const leadId = request.nextUrl.searchParams.get('lead_id');
    if (!leadId) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    // Verify the attorney has claimed this lead
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by, uploaded_files')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.claimed_by !== attorney.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const uploadedFiles = lead.uploaded_files as Array<{
      file_name: string;
      storage_path: string;
      file_type: string;
      size: number;
    }> | null;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json({ files: [] });
    }

    // Use admin client (service role) to generate signed URLs for storage
    const adminSupabase = createAdminClient();

    const files = await Promise.all(
      uploadedFiles.map(async (file) => {
        const { data } = await adminSupabase.storage
          .from('lead-evidence')
          .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

        return {
          name: file.file_name,
          type: file.file_type,
          size: file.size,
          url: data?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Evidence API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
