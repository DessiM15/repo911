import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, isStripeConfigured, LEAD_PRICES } from '@/lib/stripe';
import { isSubscriptionActive } from '@/lib/subscription';
import { sendLeadClaimedToConsumer, sendLeadClaimedToAttorney } from '@/lib/emails';
import { sendLeadClaimedSms } from '@/lib/sms';
import { captureServerException } from '@/lib/error-tracking/server-tracker';
import { rateLimit } from '@/lib/rate-limit';
import { attorneyClaimSchema } from '@/lib/validations/attorney';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import type { QualificationTier, SubscriptionPlan, SubscriptionStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = attorneyClaimSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { lead_id } = parsed.data;

    if (!isStripeConfigured()) {
      return apiError('Payments are not yet available. Please check back soon.', 503);
    }

    const supabase = await createClient();

    // Verify attorney (all 4 checks: auth, table, fee agreement, status)
    const { attorney, error: authError } = await verifyAttorney(supabase, 'id, stripe_customer_id, subscription_plan, subscription_status, first_name, email, phone, referral_credits, sms_notifications');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    // Rate limit: 20 claims per attorney per hour
    const rateLimitResult = rateLimit(`attorney_claim:${attorney.id}`, { limit: 20, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many claim attempts. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    // Verify lead is available
    const { data: lead } = await supabase
      .from('leads')
      .select('id, qualification_tier, claimed_by, status, first_name, last_name, email, phone, repo_state')
      .eq('id', lead_id)
      .single();

    if (!lead) {
      return apiError('Lead not found', 404);
    }

    if (lead.claimed_by) {
      return apiError('This lead has already been claimed', 409);
    }

    const tier = lead.qualification_tier as QualificationTier;
    const price = tier === 'hot' ? LEAD_PRICES.hot
      : tier === 'warm' ? LEAD_PRICES.warm
      : LEAD_PRICES.cold;

    // --- Referral credits: free claim ---
    if (attorney.referral_credits > 0) {
      const adminSupabase = createAdminClient();

      // Atomic transaction: claim lead + decrement credit + transaction + fee_tracking + notification
      const { error: claimError } = await adminSupabase.rpc('claim_lead', {
        p_lead_id: lead_id,
        p_attorney_id: attorney.id,
        p_claim_price: 0,
        p_stripe_payment_id: null,
        p_payment_type: 'per_lead',
        p_description: `Lead claim — ${tier?.toUpperCase()} lead (referral credit)`,
        p_notification_title: 'Lead Claimed with Referral Credit',
        p_notification_message: `You used a referral credit to claim a ${tier?.toUpperCase()} lead in ${lead.repo_state}. Full contact info is now available.`,
        p_notification_link: '/attorney/my-leads',
        p_use_referral_credit: true,
      });

      if (claimError) {
        return apiError('This lead has already been claimed', 409);
      }

      // Emails (fire-and-forget)
      sendLeadClaimedToConsumer({
        to: lead.email,
        firstName: lead.first_name,
      }).catch(() => { /* non-critical */ });

      sendLeadClaimedToAttorney({
        to: attorney.email,
        attorneyName: attorney.first_name,
        leadName: `${lead.first_name} ${lead.last_name}`,
        leadEmail: lead.email,
        leadPhone: lead.phone || '',
        leadState: lead.repo_state || '',
        tier: tier || 'cold',
        amount: 0,
      }).catch(() => { /* non-critical */ });

      // SMS (fire-and-forget)
      sendLeadClaimedSms(
        { sms_notifications: attorney.sms_notifications, phone: attorney.phone },
        { id: lead.id, qualification_tier: tier || 'cold' }
      ).catch(() => { /* non-critical */ });

      return apiSuccess({
        success: true,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/my-leads?claimed=${lead.id}`,
      });
    }

    // --- Active subscription: instant claim ---
    if (isSubscriptionActive(
      attorney.subscription_plan as SubscriptionPlan,
      attorney.subscription_status as SubscriptionStatus
    )) {
      const adminSupabase = createAdminClient();

      // Atomic transaction: claim lead + transaction + fee_tracking + notification
      const { error: claimError } = await adminSupabase.rpc('claim_lead', {
        p_lead_id: lead_id,
        p_attorney_id: attorney.id,
        p_claim_price: 0,
        p_stripe_payment_id: null,
        p_payment_type: 'subscription',
        p_description: `Lead claim — ${tier?.toUpperCase()} lead (subscription)`,
        p_notification_title: 'Lead Claimed Successfully',
        p_notification_message: `You claimed a ${tier?.toUpperCase()} lead in ${lead.repo_state}. Full contact info is now available.`,
        p_notification_link: '/attorney/my-leads',
        p_use_referral_credit: false,
      });

      if (claimError) {
        return apiError('This lead has already been claimed', 409);
      }

      // Emails (fire-and-forget)
      sendLeadClaimedToConsumer({
        to: lead.email,
        firstName: lead.first_name,
      }).catch(() => { /* non-critical */ });

      sendLeadClaimedToAttorney({
        to: attorney.email,
        attorneyName: attorney.first_name,
        leadName: `${lead.first_name} ${lead.last_name}`,
        leadEmail: lead.email,
        leadPhone: lead.phone || '',
        leadState: lead.repo_state || '',
        tier: tier || 'cold',
        amount: 0,
      }).catch(() => { /* non-critical */ });

      // SMS (fire-and-forget)
      sendLeadClaimedSms(
        { sms_notifications: attorney.sms_notifications, phone: attorney.phone },
        { id: lead.id, qualification_tier: tier || 'cold' }
      ).catch(() => { /* non-critical */ });

      // CRM activity
      const { data: crmContact } = await adminSupabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', lead_id)
        .single();

      if (crmContact) {
        await adminSupabase.from('crm_activities').insert({
          contact_id: crmContact.id,
          activity_type: 'lead_claimed',
          description: `Lead claimed by attorney ${attorney.id} (subscription — $0)`,
          metadata: { attorney_id: attorney.id, tier, payment_type: 'subscription' },
        });
      }

      return apiSuccess({
        success: true,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/my-leads?claimed=${lead.id}`,
      });
    }

    // --- Per-lead: Stripe checkout flow (unchanged) ---
    const session = await stripe.checkout.sessions.create({
      customer: attorney.stripe_customer_id || undefined,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lead Claim — ${tier?.toUpperCase()} Lead`,
              description: `Repo911 lead #${lead.id.substring(0, 8)}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        lead_id: lead.id,
        attorney_id: attorney.id,
        tier: tier || 'cold',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/my-leads?claimed=${lead.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/leads/${lead.id}?cancelled=true`,
    });

    return apiSuccess({ checkout_url: session.url });
  } catch (error) {
    console.error('Claim error:', error);
    captureServerException(error instanceof Error ? error : new Error(String(error)), {
      tags: ['payment', 'claim'],
      request: { url: request.url, method: request.method },
    });
    return apiError('Failed to create checkout session', 500);
  }
}
