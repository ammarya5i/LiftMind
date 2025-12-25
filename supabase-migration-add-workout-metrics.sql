-- Migration: add workout metrics and WhatsApp platform support
-- Run after the base schema has been applied

-- Users table additions
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS platform_preference VARCHAR(10) DEFAULT 'web';

-- Workouts table additions
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS session_rpe NUMERIC,
  ADD COLUMN IF NOT EXISTS total_reps INTEGER,
  ADD COLUMN IF NOT EXISTS working_sets INTEGER,
  ADD COLUMN IF NOT EXISTS total_volume NUMERIC,
  ADD COLUMN IF NOT EXISTS rpe_adjusted_volume NUMERIC,
  ADD COLUMN IF NOT EXISTS platform VARCHAR(10) DEFAULT 'web';

-- Helpful indexes for querying by platform
CREATE INDEX IF NOT EXISTS workouts_platform_idx ON workouts(platform);

