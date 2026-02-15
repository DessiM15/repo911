import { NextRequest } from 'next/server';
import { stripe, LEAD_PRICES } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeadClaimedToConsumer, sendLeadClaimedToAttorney } from '@/lib/emails';
import { captureServerException, captureServerMessage } from '@/lib/error-tracking/server-tracker';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { QualificationTier } from '@/types';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return apiError('No signature', 400);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    captureServerException(err instanceof Error ? err : new Error(String(err)), {
      tags: ['stripe', 'webhook', 'signature'],
      request: { url: request.url, method: request.method },
    });
    return apiError('Invalid signature', 400);
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // --- Subscription checkout ---
      if (session.mode === 'subscription') {
        const { attorney_id } = session.metadata || {};
        if (!attorney_id) break;

        const subscriptionId = session.subscription as string;

        // Fetch the subscription to get period details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = subscription.items.data[0]?.current_period_end;

        await supabase
          .from('attorneys')
          .update({
            subscription_plan: 'monthly_unlimited',
            subscription_status: subscription.status === 'active' ? 'active' : 'incomplete',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            subscription_cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('id', attorney_id);

        // Notify attorney
        await supabase.from('notifications').insert({
          recipient_type: 'attorney',
          recipient_id: attorney_id,
          title: 'Subscription Activated',
          message: 'Your Monthly Unlimited subscription is now active. You can claim leads instantly at no additional cost.',
          type: 'system',
          link: '/attorney/billing',
        });

        break;
      }

      // --- Per-lead checkout (existing logic) ---
      const { lead_id, attorney_id, tier } = session.metadata || {};

      if (!lead_id || !attorney_id) break;

      const price = tier === 'hot' ? LEAD_PRICES.hot
        : tier === 'warm' ? LEAD_PRICES.warm
        : LEAD_PRICES.cold;

      // Update lead status — atomic check prevents double-claim
      const { data: updatedLead, error: claimError } = await supabase
        .from('leads')
        .update({
          status: 'claimed',
          claimed_by: attorney_id,
          claimed_at: new Date().toISOString(),
          claim_price: price,
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', lead_id)
        .is('claimed_by', null)
        .select('id')
        .single();

      if (claimError || !updatedLead) {
        // Lead was already claimed by another attorney — refund will be needed
        console.error('Lead already claimed or not found:', lead_id, claimError);
        captureServerMessage(
          `Lead already claimed or not found: ${lead_id}`,
          'warning',
          { tags: ['stripe', 'webhook', 'claim-race'], extra: { lead_id, attorney_id } },
        );
        break;
      }

      // Create transaction record
      await supabase.from('transactions').insert({
        attorney_id,
        lead_id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: price,
        currency: 'usd',
        status: 'succeeded',
        description: `Lead claim — ${(tier as string)?.toUpperCase()} lead`,
        receipt_url: null,
        payment_type: 'per_lead',
      });

      // Create fee tracking record
      await supabase.from('fee_tracking').insert({
        attorney_id,
        lead_id,
        transaction_id: null, // Will be linked by trigger or admin
        case_status: 'open',
      });

      // Get lead info for notifications
      const { data: lead } = await supabase
        .from('leads')
        .select('first_name, last_name, email, phone, repo_state, qualification_tier')
        .eq('id', lead_id)
        .single();

      // Get attorney info for email
      const { data: attorney } = await supabase
        .from('attorneys')
        .select('first_name, email')
        .eq('id', attorney_id)
        .single();

      // Create notifications
      if (lead) {
        // In-app notification for attorney
        await supabase.from('notifications').insert({
          recipient_type: 'attorney',
          recipient_id: attorney_id,
          title: 'Lead Claimed Successfully',
          message: `You claimed a ${(lead.qualification_tier as QualificationTier)?.toUpperCase()} lead in ${lead.repo_state}. Full contact info is now available.`,
          type: 'lead_claimed',
          link: `/attorney/my-leads`,
        });

        // Email to consumer
        sendLeadClaimedToConsumer({
          to: lead.email,
          firstName: lead.first_name,
        }).catch(() => { /* non-critical */ });

        // Email to attorney with full lead details
        if (attorney) {
          sendLeadClaimedToAttorney({
            to: attorney.email,
            attorneyName: attorney.first_name,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadEmail: lead.email,
            leadPhone: lead.phone || '',
            leadState: lead.repo_state || '',
            tier: tier || 'cold',
            amount: price,
          }).catch(() => { /* non-critical */ });
        }
      }

      // Log CRM activity
      const { data: crmContact } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', lead_id)
        .single();

      if (crmContact) {
        await supabase.from('crm_activities').insert({
          contact_id: crmContact.id,
          activity_type: 'lead_claimed',
          description: `Lead claimed by attorney ${attorney_id}. Payment: $${(price / 100).toFixed(2)}`,
          metadata: { attorney_id, payment_intent: session.payment_intent, tier },
        });
      }

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const periodEnd = subscription.items?.data?.[0]?.current_period_end;

      // Map Stripe status to our SubscriptionStatus
      let mappedStatus: string;
      switch (subscription.status) {
        case 'active': mappedStatus = 'active'; break;
        case 'past_due': mappedStatus = 'past_due'; break;
        case 'canceled': mappedStatus = 'canceled'; break;
        default: mappedStatus = 'incomplete'; break;
      }

      await supabase
        .from('attorneys')
        .update({
          subscription_status: mappedStatus,
          subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          subscription_cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscriptionId);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      // Find attorney BEFORE clearing subscription fields
      const { data: atty } = await supabase
        .from('attorneys')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      // Revert attorney to per-lead (clear subscription fields)
      await supabase
        .from('attorneys')
        .update({
          subscription_plan: null,
          subscription_status: null,
          stripe_subscription_id: null,
          subscription_current_period_end: null,
          subscription_cancel_at_period_end: false,
        })
        .eq('stripe_subscription_id', subscriptionId);

      // Notify attorney
      if (atty) {
        await supabase.from('notifications').insert({
          recipient_type: 'attorney',
          recipient_id: atty.id,
          title: 'Subscription Ended',
          message: 'Your Monthly Unlimited subscription has ended. You can still claim leads on a per-lead basis.',
          type: 'system',
          link: '/attorney/billing',
        });
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (!customerId) break;

      // Find attorney by Stripe customer ID
      const { data: failedAtty } = await supabase
        .from('attorneys')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (failedAtty) {
        await supabase.from('notifications').insert({
          recipient_type: 'attorney',
          recipient_id: failedAtty.id,
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method to keep your subscription active.',
          type: 'system',
          link: '/attorney/billing',
        });
      }

      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent as string;

      if (!paymentIntentId) break;

      // Find the transaction
      const { data: transaction } = await supabase
        .from('transactions')
        .select('lead_id, attorney_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (transaction) {
        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId);

        // Look up the lead's original qualification tier to restore it
        const { data: refundLead } = await supabase
          .from('leads')
          .select('qualification_tier')
          .eq('id', transaction.lead_id)
          .single();

        const restoredStatus = refundLead?.qualification_tier
          ? `qualified_${refundLead.qualification_tier}`
          : 'qualified_hot';

        // Unclaim the lead — restore to its original qualified status
        await supabase
          .from('leads')
          .update({
            status: restoredStatus,
            claimed_by: null,
            claimed_at: null,
            claim_price: null,
            stripe_payment_id: null,
          })
          .eq('id', transaction.lead_id);
      }
      break;
    }
  }

  return apiSuccess({ received: true });
}
