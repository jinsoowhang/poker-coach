-- 005_training_progress.sql
-- Leitner-box SRS state + streak tracking for Training mode (Wave 1).

-- ── Per-scenario review state ─────────────────────────────────────────────

CREATE TABLE scenario_state (
  player_id         uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scenario_id       text NOT NULL,
  box               int NOT NULL DEFAULT 1 CHECK (box >= 1 AND box <= 5),
  next_review_at    timestamptz NOT NULL,
  last_reviewed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, scenario_id)
);

CREATE INDEX idx_scenario_state_due
  ON scenario_state(player_id, next_review_at);

ALTER TABLE scenario_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenario_state_select" ON scenario_state
  FOR SELECT USING (true);

CREATE POLICY "scenario_state_insert" ON scenario_state
  FOR INSERT WITH CHECK (true);

CREATE POLICY "scenario_state_update" ON scenario_state
  FOR UPDATE USING (true);

-- ── Streak + Daily Hand on players ────────────────────────────────────────

ALTER TABLE players
  ADD COLUMN current_streak            int  NOT NULL DEFAULT 0,
  ADD COLUMN longest_streak            int  NOT NULL DEFAULT 0,
  ADD COLUMN last_practice_date        date,
  ADD COLUMN daily_hand_completed_date date;
