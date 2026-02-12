import type { SubscriptionPlan, SubscriptionStatus } from '@/types';

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID || '';

export function isSubscriptionActive(
  plan: SubscriptionPlan | null | undefined,
  status: SubscriptionStatus | null | undefined
): boolean {
  return plan === 'monthly_unlimited' && status === 'active';
}
