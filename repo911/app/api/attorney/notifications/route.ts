import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    // Get recent notifications (last 50)
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'attorney')
      .eq('recipient_id', attorney.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Count unread
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_type', 'attorney')
      .eq('recipient_id', attorney.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications error:', error);
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

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    const body = await request.json();

    if (body.mark_all_read) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_type', 'attorney')
        .eq('recipient_id', attorney.id)
        .eq('read', false);
    } else if (body.notification_id) {
      // Mark single notification as read
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', body.notification_id)
        .eq('recipient_id', attorney.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
