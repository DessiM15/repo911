import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return !!key && !key.includes('placeholder');
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

// Backward-compatible lazy export
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { LEAD_PRICES } from './lead-prices';
