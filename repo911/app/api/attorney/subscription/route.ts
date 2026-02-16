import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { SUBSCRIPTION_PRICE_ID } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

// GET — Return attorney's subscription fields
export async function GET() {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'subscription_plan, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    return apiSuccess({
      subscription_plan: attorney.subscription_plan,
      subscription_status: attorney.subscription_status,
      subscription_current_period_end: attorney.subscription_current_period_end,
      subscription_cancel_at_period_end: attorney.subscription_cancel_at_period_end,
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return apiError('Failed to fetch subscription', 500);
  }
}

// POST — Create Stripe Checkout Session for subscription
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return apiError('Payments are not yet available.', 503);
    }

    if (!SUBSCRIPTION_PRICE_ID) {
      return apiError('Subscription is not configured yet.', 503);
    }

    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id, stripe_customer_id, subscription_plan, subscription_status');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    if (attorney.subscription_status === 'active') {
      return apiError('You already have an active subscription', 400);
    }

    // Rate limit: 10 subscription creations per attorney per hour
    const rateLimitResult = rateLimit(`attorney_sub_create:${attorney.id}`, { limit: 10, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
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

    return apiSuccess({ checkout_url: session.url });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return apiError('Failed to create checkout session', 500);
  }
}

// DELETE — Cancel subscription at period end
export async function DELETE() {
  try {
    if (!isStripeConfigured()) {
      return apiError('Payments are not yet available.', 503);
    }

    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id, stripe_subscription_id, subscription_status');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    if (!attorney.stripe_subscription_id || attorney.subscription_status !== 'active') {
      return apiError('No active subscription to cancel', 400);
    }

    // Rate limit: 5 cancellations per attorney per hour
    const rateLimitResult = rateLimit(`attorney_sub_cancel:${attorney.id}`, { limit: 5, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    await stripe.subscriptions.update(attorney.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return apiSuccess({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (error) {
    console.error('Subscription DELETE error:', error);
    return apiError('Failed to cancel subscription', 500);
  }
}
