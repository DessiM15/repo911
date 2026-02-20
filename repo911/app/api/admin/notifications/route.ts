import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationUpdateSchema } from '@/lib/validations/attorney';
import { apiSuccess, apiError } from '@/lib/api-response';

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

    // Get recent notifications (last 50)
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'admin')
      .eq('recipient_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Count unread
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_type', 'admin')
      .eq('recipient_id', admin.id)
      .eq('read', false);

    return apiSuccess({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    console.error('Admin notifications error:', error);
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
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    const body = await request.json();

    const parsed = notificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { mark_all_read, notification_id } = parsed.data;

    if (mark_all_read) {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_type', 'admin')
        .eq('recipient_id', admin.id)
        .eq('read', false);
    } else if (notification_id) {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('recipient_id', admin.id);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Admin notification update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
