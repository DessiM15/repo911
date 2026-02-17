-- 014_story_audio.sql
-- Add audio story columns to leads table for "Tell Your Story" feature

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS story_audio_path TEXT,
  ADD COLUMN IF NOT EXISTS story_transcript TEXT,
  ADD COLUMN IF NOT EXISTS story_recorded_at TIMESTAMPTZ;

-- Partial index for marketplace queries filtering leads with stories
CREATE INDEX IF NOT EXISTS idx_leads_story_recorded
  ON leads (story_recorded_at)
  WHERE story_recorded_at IS NOT NULL;
