-- FitBook — Supabase Setup SQL
-- Run this entire file in the Supabase SQL Editor once to set up all required tables.
-- Dashboard → SQL Editor → New query → paste this → Run

-- ─── Workout Plans ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_plans (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id        uuid          REFERENCES gyms(id)        ON DELETE CASCADE,
  member_id     uuid          REFERENCES members(id)     ON DELETE CASCADE,
  created_by    uuid          REFERENCES auth.users(id),
  created_at    timestamptz   DEFAULT now(),
  name          text          NOT NULL,
  goal          text,
  level         text          CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  days_per_week int           DEFAULT 3,
  plan_data     jsonb,
  is_active     boolean       DEFAULT true
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id              uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id uuid  REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number      int,
  exercise_id     text,
  exercise_name   text,
  body_part       text,
  equipment       text,
  gif_url         text,
  youtube_url     text,
  sets            int   DEFAULT 3,
  reps            text  DEFAULT '10-12',
  rest_seconds    int   DEFAULT 60,
  notes           text,
  order_index     int
);

ALTER TABLE workout_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Auth access" ON workout_plans    FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth access" ON workout_exercises FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Fingerprint / Face Recognition Devices ──────────────────────────────────
CREATE TABLE IF NOT EXISTS fingerprint_devices (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id          uuid          REFERENCES gyms(id)  ON DELETE CASCADE,
  name            text          NOT NULL,
  ip_address      text          NOT NULL,
  port            int           DEFAULT 80,
  username        text          DEFAULT 'admin',
  password        text,
  last_synced_at  timestamptz,
  created_at      timestamptz   DEFAULT now()
);

ALTER TABLE fingerprint_devices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Auth access" ON fingerprint_devices FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Diet Plans ───────────────────────────────────────────────────────────────
-- (if not already created)
CREATE TABLE IF NOT EXISTS diet_plans (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id      uuid        REFERENCES gyms(id)    ON DELETE CASCADE,
  member_id   uuid        REFERENCES members(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  goal        text,
  calories    int,
  plan_data   jsonb,
  notes       text
);

ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Auth access" ON diet_plans FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- All tables created. Refresh your Supabase dashboard to confirm.
