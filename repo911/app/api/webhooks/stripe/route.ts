import { NextRequest, NextResponse } from 'next/server';
import { stripe, LEAD_PRICES } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeadClaimedToConsumer, sendLeadClaimedToAttorney } from '@/lib/emails';
import type { QualificationTier } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
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
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { lead_id, attorney_id, tier } = session.metadata || {};

      if (!lead_id || !attorney_id) break;

      const price = tier === 'hot' ? LEAD_PRICES.hot
        : tier === 'warm' ? LEAD_PRICES.warm
        : LEAD_PRICES.cold;

      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'claimed',
          claimed_by: attorney_id,
          claimed_at: new Date().toISOString(),
          claim_price: price,
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', lead_id)
        .is('claimed_by', null); // Prevent double-claim

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
      });

      // Create fee tracking record
      await supabase.from('fee_tracking').insert({
        attorney_id,
        lead_id,
        transaction_id: null, // Will be linked by trigger or admin
        case_status: 'open',
        payment_status: 'pending',
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

        // Unclaim the lead
        await supabase
          .from('leads')
          .update({
            status: 'qualified_hot', // Reset to previous qualified status
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

  return NextResponse.json({ received: true });
}
