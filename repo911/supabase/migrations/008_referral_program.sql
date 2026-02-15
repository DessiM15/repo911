-- 008: Attorney Referral Program
-- Adds referral codes, credits, and tracking to the attorney system

-- Add referral columns to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES attorneys(id);
CREATE INDEX IF NOT EXISTS idx_attorneys_referral_code ON attorneys (referral_code);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  referrer_id UUID NOT NULL REFERENCES attorneys(id),
  referred_id UUID NOT NULL REFERENCES attorneys(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | completed | expired
  completed_at TIMESTAMPTZ,
  credit_awarded BOOLEAN DEFAULT FALSE,
  UNIQUE(referrer_id, referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals (referrer_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Atomic credit increment function
CREATE OR REPLACE FUNCTION increment_referral_credits(attorney_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE attorneys
  SET referral_credits = referral_credits + amount,
      updated_at = NOW()
  WHERE id = attorney_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit decrement function
CREATE OR REPLACE FUNCTION decrement_referral_credits(attorney_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE attorneys
  SET referral_credits = GREATEST(0, referral_credits - amount),
      updated_at = NOW()
  WHERE id = attorney_id
  AND referral_credits >= amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
