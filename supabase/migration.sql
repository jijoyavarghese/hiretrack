-- ================================================
-- HireTrack Database Migration
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default positions
INSERT INTO positions (name) VALUES
  ('Software Engineer'),
  ('Product Manager'),
  ('Data Analyst'),
  ('HR Manager'),
  ('Sales Executive')
ON CONFLICT (name) DO NOTHING;

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  position          TEXT,
  source            TEXT DEFAULT 'Naukri India',
  status            TEXT DEFAULT 'Screening',
  experience        TEXT,
  current_ctc       TEXT,
  expected_ctc      TEXT,
  notice_period     TEXT,
  location          TEXT,
  skills            TEXT,
  resume_text       TEXT,
  resume_file_name  TEXT,
  feedback          TEXT,
  rating            INTEGER DEFAULT 0,
  interview_date    DATE,
  interviewer_name  TEXT,
  notes             TEXT,
  applied_date      DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON candidates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (recommended)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions  ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations with anon key (single-user / team use)
-- For multi-user with auth, replace with auth.uid() checks
CREATE POLICY "Allow all for anon" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON positions  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast search
CREATE INDEX IF NOT EXISTS idx_candidates_name     ON candidates(name);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_status   ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_source   ON candidates(source);
CREATE INDEX IF NOT EXISTS idx_candidates_created  ON candidates(created_at DESC);
