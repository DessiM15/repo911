-- 009: In-app Messaging between consumers and attorneys
-- Allows direct communication on claimed leads

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  sender_type TEXT NOT NULL,  -- 'consumer' | 'attorney'
  sender_id UUID,             -- attorney.id for attorney, NULL for consumer
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages (lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON messages (lead_id, created_at);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: attorneys can view messages for leads they own
CREATE POLICY "Attorneys can view messages for their leads"
  ON messages
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE claimed_by IN (
        SELECT id FROM attorneys WHERE supabase_auth_id = auth.uid()
      )
    )
  );

-- RLS policy: attorneys can insert messages for their leads
CREATE POLICY "Attorneys can send messages for their leads"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'attorney'
    AND lead_id IN (
      SELECT id FROM leads WHERE claimed_by IN (
        SELECT id FROM attorneys WHERE supabase_auth_id = auth.uid()
      )
    )
  );

-- RLS policy: attorneys can update read status on consumer messages for their leads
CREATE POLICY "Attorneys can mark messages as read"
  ON messages
  FOR UPDATE
  USING (
    sender_type = 'consumer'
    AND lead_id IN (
      SELECT id FROM leads WHERE claimed_by IN (
        SELECT id FROM attorneys WHERE supabase_auth_id = auth.uid()
      )
    )
  );
