import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminCreateSchema } from '@/lib/validations/admin';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const adminClient = createAdminClient();

    // Verify caller is an admin
    const { data: callerAdmin } = await adminClient
      .from('admins')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!callerAdmin) {
      return apiError('Forbidden', 403);
    }

    // List all admins
    const { data: admins, error: listError } = await adminClient
      .from('admins')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('List admins error:', listError);
      return apiError('Failed to load admins', 500);
    }

    return apiSuccess({ admins });
  } catch (error) {
    console.error('Admin list error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const adminClient = createAdminClient();

    // Verify caller is an admin with appropriate role
    const { data: callerAdmin } = await adminClient
      .from('admins')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!callerAdmin) {
      return apiError('Forbidden', 403);
    }

    if (callerAdmin.role !== 'super_admin' && callerAdmin.role !== 'admin') {
      return apiError('Insufficient permissions', 403);
    }

    const body = await request.json();

    const parsed = adminCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { email, firstName, password, lastName, role } = parsed.data;

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message?.includes('already been registered')) {
        return apiError('An account with this email already exists.', 409);
      }
      return apiError('Failed to create user account.', 500);
    }

    // Insert into admins table
    const { error: insertError } = await adminClient
      .from('admins')
      .insert({
        supabase_auth_id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName || null,
        role,
      });

    if (insertError) {
      console.error('Admin insert error:', insertError);
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return apiError('Failed to create admin record. The operation has been rolled back.', 500);
    }

    return apiSuccess({
      success: true,
      admin: {
        email,
        firstName,
        lastName: lastName || null,
        role,
      },
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
