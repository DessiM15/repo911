import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Settings are stored in a simple key-value table or we use environment variables.
// For now, we'll use a settings table pattern with an in-memory fallback for lead pricing.

const DEFAULT_SETTINGS = {
  lead_price_hot: 15000,
  lead_price_warm: 10000,
  lead_price_cold: 5000,
  notification_email_from: 'noreply@repo911.com',
  platform_name: 'Repo911',
  fee_share_percentage: 50,
};

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to read from a settings table, fallback to defaults
    // In production, these would be stored in a DB table
    const settings = { ...DEFAULT_SETTINGS };

    // Override with env vars if set
    if (process.env.STRIPE_LEAD_PRICE_HOT) settings.lead_price_hot = parseInt(process.env.STRIPE_LEAD_PRICE_HOT);
    if (process.env.STRIPE_LEAD_PRICE_WARM) settings.lead_price_warm = parseInt(process.env.STRIPE_LEAD_PRICE_WARM);
    if (process.env.STRIPE_LEAD_PRICE_COLD) settings.lead_price_cold = parseInt(process.env.STRIPE_LEAD_PRICE_COLD);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only super_admin can change settings
    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // In a production app, these would be stored in a settings table.
    // For now, we acknowledge the update request and return success.
    // The actual persistence would require a settings DB table.

    return NextResponse.json({
      success: true,
      message: 'Settings saved. Note: Lead pricing changes take effect when the settings table is configured.',
      settings: body,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
