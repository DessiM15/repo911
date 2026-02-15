import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { sendAttorneyRegistrationAlert } from '@/lib/emails';
import { rateLimit } from '@/lib/rate-limit';
import { attorneyRegistrationSchema } from '@/lib/validations/attorney-registration';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per hour
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`attorney_register:${ip}`, { limit: 5, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many registration attempts. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const body = await request.json();

    // Validate input
    const parsed = attorneyRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const {
      first_name, last_name, email, password, phone,
      firm_name, bar_number, bar_state, licensed_states,
      preferred_case_types, website,
    } = parsed.data;

    const electronic_signature = body.electronic_signature;

    const supabase = createAdminClient();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'attorney', first_name, last_name },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return apiError('An account with this email already exists.', 409);
      }
      console.error('Auth error:', authError);
      return apiError('Failed to create account.', 500);
    }

    // 2. Create Stripe Customer (skip if Stripe not configured)
    let stripeCustomerId: string | null = null;
    if (isStripeConfigured()) {
      const customer = await stripe.customers.create({
        email,
        name: `${first_name} ${last_name}`,
        metadata: {
          supabase_auth_id: authData.user.id,
          firm_name: firm_name || '',
          bar_number,
          bar_state,
        },
      });
      stripeCustomerId = customer.id;
    }

    // 3. Get metadata from request
    const ip_address =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 4. Create attorney record
    const { data: attorney, error: attorneyError } = await supabase
      .from('attorneys')
      .insert({
        supabase_auth_id: authData.user.id,
        first_name,
        last_name,
        email,
        phone,
        firm_name: firm_name || null,
        bar_number,
        bar_state,
        licensed_states: licensed_states || [],
        website: website || null,
        preferred_case_types: preferred_case_types || [],
        preferred_states: licensed_states || [],
        fee_agreement_signed: true,
        fee_agreement_signed_at: new Date().toISOString(),
        fee_agreement_ip: ip_address,
        stripe_customer_id: stripeCustomerId,
        status: 'pending',
        is_verified: false,
        email_notifications: true,
        sms_notifications: false,
      })
      .select('id')
      .single();

    if (attorneyError) {
      console.error('Attorney insert error:', attorneyError);
      // Clean up auth user if attorney record fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return apiError('Failed to create attorney profile.', 500);
    }

    // 5. Create CRM contact for attorney
    await supabase.from('crm_contacts').insert({
      contact_type: 'attorney',
      source_attorney_id: attorney.id,
      first_name,
      last_name,
      email,
      phone,
      state: bar_state,
      tags: ['new_attorney'],
      lifecycle_stage: 'new',
    });

    // 6. Log CRM activity
    const { data: crmContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('source_attorney_id', attorney.id)
      .single();

    if (crmContact) {
      await supabase.from('crm_activities').insert({
        contact_id: crmContact.id,
        activity_type: 'status_change',
        description: `Attorney registered. Lead purchase agreement signed by "${electronic_signature}".`,
        metadata: { bar_number, bar_state, licensed_states, firm_name },
      });
    }

    // Send admin alert email (fire-and-forget)
    sendAttorneyRegistrationAlert({
      attorneyName: `${first_name} ${last_name}`,
      email,
      barState: bar_state,
      firmName: firm_name || null,
    }).catch(() => { /* non-critical */ });

    return apiSuccess({ id: attorney.id, status: 'pending' });
  } catch (error) {
    console.error('Attorney registration error:', error);
    return apiError('An unexpected error occurred.', 500);
  }
}
