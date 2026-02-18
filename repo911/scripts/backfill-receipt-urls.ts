/**
 * One-time backfill script: populates receipt_url and stripe_charge_id
 * for existing transactions that have a stripe_payment_intent_id but
 * a null receipt_url.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... npx tsx repo911/scripts/backfill-receipt-urls.ts
 *
 * Safe to run multiple times (idempotent — only touches rows with null receipt_url).
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: STRIPE_SECRET_KEY, SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DELAY_MS = 200; // delay between Stripe API calls to stay within rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching transactions with missing receipt_url...');

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, stripe_payment_intent_id')
    .is('receipt_url', null)
    .not('stripe_payment_intent_id', 'is', null);

  if (error) {
    console.error('Failed to fetch transactions:', error.message);
    process.exit(1);
  }

  if (!transactions || transactions.length === 0) {
    console.log('No transactions to backfill.');
    return;
  }

  console.log(`Found ${transactions.length} transaction(s) to backfill.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const tx of transactions) {
    try {
      const pi = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id!);
      const chargeId = typeof pi.latest_charge === 'string'
        ? pi.latest_charge
        : pi.latest_charge?.id;

      if (!chargeId) {
        console.log(`  [skip] tx ${tx.id} — no charge on payment intent ${tx.stripe_payment_intent_id}`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      const charge = await stripe.charges.retrieve(chargeId);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          receipt_url: charge.receipt_url ?? null,
          stripe_charge_id: chargeId,
        })
        .eq('id', tx.id);

      if (updateError) {
        console.error(`  [error] tx ${tx.id} — DB update failed:`, updateError.message);
        failed++;
      } else {
        console.log(`  [ok] tx ${tx.id} — receipt_url set`);
        updated++;
      }
    } catch (err) {
      console.error(`  [error] tx ${tx.id} — Stripe API failed:`, err instanceof Error ? err.message : err);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main();
