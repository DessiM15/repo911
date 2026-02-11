import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 lookups per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`lead_track:${ip}`, { limit: 10, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email, leadId } = body;

    if (!email || !leadId) {
      return NextResponse.json(
        { error: 'Email and case ID are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Validate UUID format for lead ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      return NextResponse.json(
        { error: 'Invalid case ID format.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, status, qualification_tier, created_at, claimed_by, uploaded_files')
      .eq('id', leadId)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      // Don't reveal whether ID exists — generic message
      return NextResponse.json(
        { error: 'No case found matching that email and case ID combination.' },
        { status: 404 }
      );
    }

    // Return safe info only — no attorney details exposed
    const statusLabels: Record<string, string> = {
      qualified_hot: 'Qualified — High Priority',
      qualified_warm: 'Qualified — Under Review',
      qualified_cold: 'Submitted — Pending Review',
      disqualified: 'Reviewed — Does Not Qualify',
      claimed: 'Claimed by Attorney',
      contacted: 'Attorney Has Contacted You',
      retained: 'Attorney Retained',
      closed: 'Case Closed',
    };

    return NextResponse.json({
      id: lead.id,
      status: lead.status,
      statusLabel: statusLabels[lead.status] || lead.status,
      tier: lead.qualification_tier,
      submittedAt: lead.created_at,
      claimed: !!lead.claimed_by,
      uploadedFiles: lead.uploaded_files || [],
    });
  } catch (error) {
    console.error('Lead tracking error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
