-- 003_scenarios.sql
-- Training mode: scenario attempt tracking

CREATE TABLE scenario_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scenario_id     text NOT NULL,
  category        text NOT NULL,
  chosen_index    int NOT NULL,
  correct_index   int NOT NULL,
  is_correct      boolean NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenario_attempts_player_id ON scenario_attempts(player_id);
CREATE INDEX idx_scenario_attempts_category ON scenario_attempts(player_id, category);

ALTER TABLE scenario_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scenario_attempts_select" ON scenario_attempts
  FOR SELECT USING (true);

CREATE POLICY "scenario_attempts_insert" ON scenario_attempts
  FOR INSERT WITH CHECK (true);
