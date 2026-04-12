-- ============================================================
-- Wartości Lidera — Supabase Schema v2
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1) Drop old table if exists
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- 2) Sessions
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code     text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  teams_enabled boolean NOT NULL DEFAULT false,
  max_members   integer NOT NULL DEFAULT 5,
  current_limit integer NOT NULL DEFAULT 10,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3) Teams (one per leader per session)
CREATE TABLE teams (
  id          text PRIMARY KEY,              -- e.g. "session-uuid_morgan"
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  leader_id   text NOT NULL,                  -- "morgan","oprah","swiatek","obama"
  custom_name text,
  photo       text,                           -- base64 data URL (resized)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4) Students
CREATE TABLE students (
  id          text PRIMARY KEY,               -- device fingerprint
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  team_id     text REFERENCES teams(id) ON DELETE SET NULL,
  device_id   text NOT NULL DEFAULT '',       -- for reconnection
  peer_id     text,                           -- current PeerJS peer id
  top10       jsonb DEFAULT '[]'::jsonb,
  ranked      jsonb DEFAULT '[]'::jsonb,
  leader_ex   jsonb,
  phase       text NOT NULL DEFAULT 'selecting',
  last_seen   timestamptz DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_session ON students(session_id);
CREATE INDEX idx_students_device  ON students(device_id, session_id);
CREATE INDEX idx_teams_session    ON teams(session_id);
CREATE INDEX idx_sessions_active  ON sessions(is_active) WHERE is_active = true;

-- 5) Row Level Security — allow anon full access (workshop tool, not public)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_sessions"  ON sessions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_teams"     ON teams     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_students"  ON students  FOR ALL USING (true) WITH CHECK (true);
