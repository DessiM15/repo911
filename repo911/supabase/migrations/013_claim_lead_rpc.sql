-- Migration: 013_claim_lead_rpc.sql
-- Wraps the critical multi-table claim writes in a single transaction
-- to prevent inconsistent state when intermediate writes fail.

CREATE OR REPLACE FUNCTION claim_lead(
  p_lead_id UUID,
  p_attorney_id UUID,
  p_claim_price INTEGER,
  p_stripe_payment_id TEXT DEFAULT NULL,
  p_payment_type TEXT DEFAULT 'per_lead',
  p_description TEXT DEFAULT '',
  p_notification_title TEXT DEFAULT 'Lead Claimed Successfully',
  p_notification_message TEXT DEFAULT '',
  p_notification_link TEXT DEFAULT '/attorney/my-leads',
  p_use_referral_credit BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- 1. Atomic claim — only succeeds if lead is still unclaimed
  UPDATE leads SET
    status = 'claimed',
    claimed_by = p_attorney_id,
    claimed_at = NOW(),
    claim_price = p_claim_price,
    stripe_payment_id = p_stripe_payment_id
  WHERE id = p_lead_id AND claimed_by IS NULL
  RETURNING id INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    RAISE EXCEPTION 'Lead already claimed';
  END IF;

  -- 2. Decrement referral credit (if applicable)
  IF p_use_referral_credit THEN
    UPDATE attorneys
    SET referral_credits = GREATEST(referral_credits - 1, 0)
    WHERE id = p_attorney_id;
  END IF;

  -- 3. Transaction record
  INSERT INTO transactions (attorney_id, lead_id, stripe_payment_intent_id, amount, currency, status, description, payment_type)
  VALUES (p_attorney_id, p_lead_id, p_stripe_payment_id, p_claim_price, 'usd', 'succeeded', p_description, p_payment_type);

  -- 4. Fee tracking
  INSERT INTO fee_tracking (attorney_id, lead_id, case_status)
  VALUES (p_attorney_id, p_lead_id, 'open');

  -- 5. Notification
  INSERT INTO notifications (recipient_type, recipient_id, title, message, type, link)
  VALUES ('attorney', p_attorney_id, p_notification_title, p_notification_message, 'lead_claimed', p_notification_link);

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;
