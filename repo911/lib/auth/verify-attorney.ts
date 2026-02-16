import { SupabaseClient } from '@supabase/supabase-js';

export type VerifiedAttorney = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type VerifyResult =
  | { attorney: VerifiedAttorney; error: null }
  | { attorney: null; error: { message: string; status: number } };

export async function verifyAttorney(
  supabase: SupabaseClient,
  select: string = 'id'
): Promise<VerifyResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { attorney: null, error: { message: 'Unauthorized', status: 401 } };
  }

  // Ensure status and fee_agreement_signed are always selected
  let fullSelect = select;
  if (select !== '*') {
    const requiredFields = ['status', 'fee_agreement_signed'];
    const fields = select.split(',').map(f => f.trim());
    for (const req of requiredFields) {
      if (!fields.includes(req)) {
        fields.push(req);
      }
    }
    fullSelect = fields.join(', ');
  }

  const { data } = await supabase
    .from('attorneys')
    .select(fullSelect)
    .eq('supabase_auth_id', user.id)
    .single();

  const attorney = data as VerifiedAttorney | null;

  if (!attorney) {
    return { attorney: null, error: { message: 'Attorney not found', status: 403 } };
  }

  if (!attorney.fee_agreement_signed) {
    return { attorney: null, error: { message: 'Fee agreement not signed', status: 403 } };
  }

  if (attorney.status === 'suspended' || attorney.status === 'deactivated') {
    return { attorney: null, error: { message: 'Account is not active', status: 403 } };
  }

  return { attorney, error: null };
}
