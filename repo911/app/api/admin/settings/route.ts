import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { settingsUpdateSchema } from '@/lib/validations/admin';
import { apiSuccess, apiError } from '@/lib/api-response';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  lead_price_hot: 100000,
  lead_price_warm: 60000,
  lead_price_cold: 30000,
  notification_email_from: 'notify@repo911.com',
  platform_name: 'Repo911',
};

async function getSettings() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase.from('settings').select('key, value');

  const settings = { ...DEFAULT_SETTINGS };
  if (rows) {
    for (const row of rows) {
      settings[row.key] = row.value;
    }
  }

  // Override with env vars if set (env vars take priority)
  if (process.env.STRIPE_LEAD_PRICE_HOT) settings.lead_price_hot = parseInt(process.env.STRIPE_LEAD_PRICE_HOT);
  if (process.env.STRIPE_LEAD_PRICE_WARM) settings.lead_price_warm = parseInt(process.env.STRIPE_LEAD_PRICE_WARM);
  if (process.env.STRIPE_LEAD_PRICE_COLD) settings.lead_price_cold = parseInt(process.env.STRIPE_LEAD_PRICE_COLD);

  return settings;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    const settings = await getSettings();
    return apiSuccess({ settings });
  } catch (error) {
    console.error('Settings error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return apiError('Insufficient permissions', 403);
    }

    const body = await request.json();

    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const entries = Object.entries(parsed.data) as [string, unknown][];
    for (const [key, value] of entries) {
      if (value !== undefined) {
        await adminClient
          .from('settings')
          .upsert({
            key,
            value,
            updated_at: now,
            updated_by: admin.id,
          }, { onConflict: 'key' });
      }
    }

    return apiSuccess({
      success: true,
      message: 'Settings saved successfully.',
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
