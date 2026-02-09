import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, LEAD_PRICES } from '@/lib/stripe';
import type { QualificationTier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { lead_id } = await request.json();
    if (!lead_id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify attorney
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, stripe_customer_id, status')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney || attorney.status !== 'active') {
      return NextResponse.json({ error: 'Attorney account is not active' }, { status: 403 });
    }

    // Verify lead is available
    const { data: lead } = await supabase
      .from('leads')
      .select('id, qualification_tier, claimed_by, status')
      .eq('id', lead_id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.claimed_by) {
      return NextResponse.json({ error: 'This lead has already been claimed' }, { status: 409 });
    }

    // Determine price
    const tier = lead.qualification_tier as QualificationTier;
    const price = tier === 'hot' ? LEAD_PRICES.hot
      : tier === 'warm' ? LEAD_PRICES.warm
      : LEAD_PRICES.cold;

    // Create Stripe Checkout Session
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

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
