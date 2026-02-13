-- =============================================
-- 005: Self-Hosted Error Tracking System
-- Replaces Sentry with Supabase-backed tracking
-- =============================================

-- ===== ERRORS TABLE (grouped by fingerprint) =====
CREATE TABLE errors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identification
  fingerprint      TEXT UNIQUE NOT NULL,
  error_type       TEXT NOT NULL,             -- e.g. "TypeError", "APIError"
  message          TEXT NOT NULL,

  -- Context
  environment      TEXT NOT NULL DEFAULT 'production',
  platform         TEXT,                      -- browser, server, api
  level            TEXT NOT NULL DEFAULT 'error',

  -- Metadata
  first_seen       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen        TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrence_count INTEGER NOT NULL DEFAULT 0,

  -- Status
  status           TEXT NOT NULL DEFAULT 'unresolved',
  assigned_to      TEXT,

  -- Categorization
  tags             JSONB NOT NULL DEFAULT '[]',

  CONSTRAINT errors_valid_level CHECK (level IN ('error', 'warning', 'fatal', 'info')),
  CONSTRAINT errors_valid_status CHECK (status IN ('unresolved', 'resolved', 'ignored', 'muted'))
);

-- ===== ERROR OCCURRENCES (individual instances) =====
CREATE TABLE error_occurrences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  error_id         UUID NOT NULL REFERENCES errors(id) ON DELETE CASCADE,

  -- Stack trace
  stack_trace      TEXT,
  source_file      TEXT,
  line_number      INTEGER,
  column_number    INTEGER,

  -- User context
  user_id          UUID,
  user_ip          TEXT,
  user_agent       TEXT,

  -- Request context
  url              TEXT,
  http_method      TEXT,
  query_params     JSONB,
  request_headers  JSONB,

  -- Trail & extra
  breadcrumbs      JSONB DEFAULT '[]',
  extra_data       JSONB DEFAULT '{}',

  -- Browser/environment info
  browser_name     TEXT,
  browser_version  TEXT,
  os_name          TEXT,
  os_version       TEXT,
  device_type      TEXT
);

-- ===== ERROR STATS (hourly rollups) =====
CREATE TABLE error_stats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id         UUID NOT NULL REFERENCES errors(id) ON DELETE CASCADE,
  hour_bucket      TIMESTAMPTZ NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  unique_users     INTEGER NOT NULL DEFAULT 0,

  UNIQUE(error_id, hour_bucket)
);

-- ===== ALERT RULES =====
CREATE TABLE alert_rules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  name                   TEXT NOT NULL,
  enabled                BOOLEAN NOT NULL DEFAULT true,

  -- Conditions
  error_level            TEXT[],        -- {'error','fatal'}
  error_types            TEXT[],        -- {'TypeError','APIError'}
  tags                   TEXT[],        -- {'payment','lead-submission'}
  threshold              INTEGER NOT NULL DEFAULT 1,
  time_window            INTEGER NOT NULL DEFAULT 60,  -- minutes

  -- Actions
  notification_channels  JSONB NOT NULL DEFAULT '{}',  -- {email: [...]}

  last_triggered         TIMESTAMPTZ
);

-- ===== INDEXES =====
CREATE INDEX idx_errors_fingerprint    ON errors(fingerprint);
CREATE INDEX idx_errors_status         ON errors(status);
CREATE INDEX idx_errors_level          ON errors(level);
CREATE INDEX idx_errors_last_seen      ON errors(last_seen DESC);
CREATE INDEX idx_errors_environment    ON errors(environment);

CREATE INDEX idx_error_occurrences_error_id   ON error_occurrences(error_id);
CREATE INDEX idx_error_occurrences_created_at ON error_occurrences(created_at DESC);

CREATE INDEX idx_error_stats_error_id    ON error_stats(error_id);
CREATE INDEX idx_error_stats_hour_bucket ON error_stats(hour_bucket DESC);

-- ===== TRIGGER: Auto-update error metadata on new occurrence =====
CREATE OR REPLACE FUNCTION update_error_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE errors
  SET
    last_seen = NEW.created_at,
    occurrence_count = occurrence_count + 1,
    updated_at = now()
  WHERE id = NEW.error_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_error_occurrence_insert
AFTER INSERT ON error_occurrences
FOR EACH ROW
EXECUTE FUNCTION update_error_metadata();

-- ===== RLS =====
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only on errors"
  ON errors FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins only on error_occurrences"
  ON error_occurrences FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins only on error_stats"
  ON error_stats FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins only on alert_rules"
  ON alert_rules FOR ALL
  USING (is_admin(auth.uid()));

-- ===== SEED: Default alert rule for fatal errors =====
INSERT INTO alert_rules (name, error_level, threshold, time_window, notification_channels)
VALUES (
  'Critical Error Alert',
  ARRAY['fatal', 'error'],
  1,
  60,
  '{"email": []}'::jsonb
);
