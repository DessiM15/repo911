import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify caller is an admin
    const { data: callerAdmin } = await adminClient
      .from('admins')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!callerAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // List all admins
    const { data: admins, error: listError } = await adminClient
      .from('admins')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('List admins error:', listError);
      return NextResponse.json({ error: 'Failed to load admins' }, { status: 500 });
    }

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify caller is an admin with appropriate role
    const { data: callerAdmin } = await adminClient
      .from('admins')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!callerAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (callerAdmin.role !== 'super_admin' && callerAdmin.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, password, role } = body;

    // Validate required fields
    if (!email || !firstName || !password) {
      return NextResponse.json(
        { error: 'Email, first name, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const allowedRoles = ['admin', 'viewer'];
    const adminRole = allowedRoles.includes(role) ? role : 'viewer';

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create user account.' },
        { status: 500 }
      );
    }

    // Insert into admins table
    const { error: insertError } = await adminClient
      .from('admins')
      .insert({
        supabase_auth_id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName || null,
        role: adminRole,
      });

    if (insertError) {
      console.error('Admin insert error:', insertError);
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create admin record. The operation has been rolled back.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        email,
        firstName,
        lastName: lastName || null,
        role: adminRole,
      },
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
