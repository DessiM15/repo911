import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { sendAttorneyRegistrationAlert } from '@/lib/emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name, last_name, email, password, phone,
      firm_name, bar_number, bar_state, licensed_states,
      preferred_case_types, website, electronic_signature,
    } = body;

    if (!first_name || !last_name || !email || !password || !phone || !bar_number || !bar_state) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to create attorney profile.' }, { status: 500 });
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
        description: `Attorney registered. Fee agreement signed by "${electronic_signature}".`,
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

    return NextResponse.json({ id: attorney.id, status: 'pending' });
  } catch (error) {
    console.error('Attorney registration error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
