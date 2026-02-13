import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { SUBSCRIPTION_PRICE_ID } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';

// GET — Return attorney's subscription fields
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('subscription_plan, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    return NextResponse.json({
      subscription_plan: attorney.subscription_plan,
      subscription_status: attorney.subscription_status,
      subscription_current_period_end: attorney.subscription_current_period_end,
      subscription_cancel_at_period_end: attorney.subscription_cancel_at_period_end,
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// POST — Create Stripe Checkout Session for subscription
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payments are not yet available.' },
        { status: 503 }
      );
    }

    if (!SUBSCRIPTION_PRICE_ID) {
      return NextResponse.json(
        { error: 'Subscription is not configured yet.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, stripe_customer_id, status, subscription_plan, subscription_status')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney || attorney.status !== 'active') {
      return NextResponse.json({ error: 'Attorney account is not active' }, { status: 403 });
    }

    if (attorney.subscription_status === 'active') {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
    }

    // Rate limit: 10 subscription creations per attorney per hour
    const rateLimitResult = rateLimit(`attorney_sub_create:${attorney.id}`, { limit: 10, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Suppress unused variable warning
    void request;

    const session = await stripe.checkout.sessions.create({
      customer: attorney.stripe_customer_id || undefined,
      mode: 'subscription',
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        attorney_id: attorney.id,
        type: 'subscription',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/billing?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/attorney/billing?cancelled=true`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// DELETE — Cancel subscription at period end
export async function DELETE() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Payments are not yet available.' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, stripe_subscription_id, subscription_status')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    if (!attorney.stripe_subscription_id || attorney.subscription_status !== 'active') {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }

    // Rate limit: 5 cancellations per attorney per hour
    const rateLimitResult = rateLimit(`attorney_sub_cancel:${attorney.id}`, { limit: 5, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    await stripe.subscriptions.update(attorney.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (error) {
    console.error('Subscription DELETE error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
