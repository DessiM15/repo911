import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { attorneyProfileUpdateSchema } from '@/lib/validations/attorney';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET() {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, '*');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    return apiSuccess({ attorney });
  } catch (error) {
    console.error('Profile GET error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const body = await request.json();

    const parsed = attorneyProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const updates = parsed.data;

    const { error } = await supabase
      .from('attorneys')
      .update(updates)
      .eq('id', attorney.id);

    if (error) {
      console.error('Profile update error:', error);
      return apiError('Failed to update profile', 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
