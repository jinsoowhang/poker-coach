-- 004_scenario_confidence.sql
-- Add confidence rating (1-5) per attempt for calibration scoring.

ALTER TABLE scenario_attempts
  ADD COLUMN confidence int;

-- Constrain to 1-5 range when present. NULL is allowed for legacy rows.
ALTER TABLE scenario_attempts
  ADD CONSTRAINT scenario_attempts_confidence_range
  CHECK (confidence IS NULL OR (confidence >= 1 AND confidence <= 5));

CREATE INDEX idx_scenario_attempts_confidence
  ON scenario_attempts(player_id, confidence)
  WHERE confidence IS NOT NULL;
