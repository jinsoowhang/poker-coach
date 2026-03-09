-- 001_initial_schema.sql
-- Poker Coach database schema

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,
  auth_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  hands_played  int NOT NULL DEFAULT 0,
  chips_start   int NOT NULL,
  chips_end     int,
  started_at    timestamptz NOT NULL DEFAULT now(),
  ended_at      timestamptz
);

CREATE TABLE hands (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id       uuid REFERENCES sessions(id) ON DELETE SET NULL,
  hand_number      int NOT NULL,
  pot_total        int NOT NULL,
  community_cards  jsonb NOT NULL DEFAULT '[]',
  player_results   jsonb NOT NULL DEFAULT '[]',
  winners          jsonb NOT NULL DEFAULT '[]',
  hero_hole_cards  jsonb NOT NULL DEFAULT '[]',
  hero_position    text NOT NULL,
  hero_actions     jsonb NOT NULL DEFAULT '[]',
  hero_chips_before int NOT NULL,
  hero_chips_after  int NOT NULL,
  hero_folded      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skill_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  hands_total int NOT NULL,
  skill_score float NOT NULL DEFAULT 0,
  vpip        float NOT NULL DEFAULT 0,
  aggression  float NOT NULL DEFAULT 0,
  win_rate    float NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_sessions_player_id ON sessions(player_id);
CREATE INDEX idx_hands_player_id ON hands(player_id);
CREATE INDEX idx_hands_session_id ON hands(session_id);
CREATE INDEX idx_skill_snapshots_player_id ON skill_snapshots(player_id);

-- =============================================================================
-- Views
-- =============================================================================

CREATE OR REPLACE VIEW leaderboard_stats AS
SELECT
  p.id AS player_id,
  p.display_name,
  COUNT(h.id)::int AS hands_played,

  -- Win rate: fraction of hands where hero_chips_after > hero_chips_before
  ROUND(
    AVG(CASE WHEN h.hero_chips_after > h.hero_chips_before THEN 1.0 ELSE 0.0 END),
    4
  ) AS win_rate,

  -- VPIP: fraction of hands where hero did NOT fold pre-flop (i.e. not folded overall
  -- is a rough proxy; real VPIP needs pre-flop action parsing, but hero_folded=false
  -- and hero put chips in voluntarily)
  ROUND(
    AVG(CASE WHEN h.hero_folded = false THEN 1.0 ELSE 0.0 END),
    4
  ) AS vpip,

  -- Aggression factor: (raises) / (calls) — approximate from hero_actions jsonb
  -- We count actions containing 'raise' or 'bet' vs 'call'
  ROUND(
    COALESCE(
      NULLIF(
        SUM(jsonb_array_length(
          COALESCE((
            SELECT jsonb_agg(a)
            FROM jsonb_array_elements(h.hero_actions) AS a
            WHERE a->>'action' IN ('raise', 'bet')
          ), '[]'::jsonb)
        )),
        0
      )::float
      /
      NULLIF(
        SUM(jsonb_array_length(
          COALESCE((
            SELECT jsonb_agg(a)
            FROM jsonb_array_elements(h.hero_actions) AS a
            WHERE a->>'action' = 'call'
          ), '[]'::jsonb)
        )),
        1
      )::float,
      0
    ),
    2
  ) AS aggression_factor,

  -- Showdown win %: among hands where hero did not fold, how often did they win?
  ROUND(
    AVG(
      CASE
        WHEN h.hero_folded = false AND h.hero_chips_after > h.hero_chips_before THEN 1.0
        WHEN h.hero_folded = false THEN 0.0
        ELSE NULL
      END
    ),
    4
  ) AS showdown_win_pct,

  -- Average profit per hand
  ROUND(AVG(h.hero_chips_after - h.hero_chips_before), 2) AS avg_profit,

  -- Composite skill score (0–1000)
  ROUND(
    -- Win rate component: 300 points max
    LEAST(
      AVG(CASE WHEN h.hero_chips_after > h.hero_chips_before THEN 1.0 ELSE 0.0 END) * 300,
      300
    )
    -- VPIP component: 250 points max, optimal at 0.22, bell-curve penalty
    + 250 * (1.0 - LEAST(
        ABS(AVG(CASE WHEN h.hero_folded = false THEN 1.0 ELSE 0.0 END) - 0.22) / 0.22,
        1.0
      ))
    -- Aggression component: 200 points max, optimal at 2.0
    + 200 * (1.0 - LEAST(
        ABS(
          COALESCE(
            NULLIF(
              SUM(jsonb_array_length(
                COALESCE((
                  SELECT jsonb_agg(a)
                  FROM jsonb_array_elements(h.hero_actions) AS a
                  WHERE a->>'action' IN ('raise', 'bet')
                ), '[]'::jsonb)
              )),
              0
            )::float
            /
            NULLIF(
              SUM(jsonb_array_length(
                COALESCE((
                  SELECT jsonb_agg(a)
                  FROM jsonb_array_elements(h.hero_actions) AS a
                  WHERE a->>'action' = 'call'
                ), '[]'::jsonb)
              )),
              1
            )::float,
            0
          ) - 2.0
        ) / 2.0,
        1.0
      ))
    -- Showdown component: 250 points max
    + 250 * COALESCE(
        AVG(
          CASE
            WHEN h.hero_folded = false AND h.hero_chips_after > h.hero_chips_before THEN 1.0
            WHEN h.hero_folded = false THEN 0.0
            ELSE NULL
          END
        ),
        0
      ),
    0
  ) AS skill_score

FROM players p
JOIN hands h ON h.player_id = p.id
GROUP BY p.id, p.display_name
HAVING COUNT(h.id) >= 20;

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_snapshots ENABLE ROW LEVEL SECURITY;

-- Players: anyone can read and insert (anonymous-friendly)
CREATE POLICY "players_select" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_insert" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "players_update" ON players
  FOR UPDATE USING (true);

-- Sessions: permissive for now (tighten once auth is added)
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (true);

-- Hands: permissive for now
CREATE POLICY "hands_select" ON hands
  FOR SELECT USING (true);

CREATE POLICY "hands_insert" ON hands
  FOR INSERT WITH CHECK (true);

-- Skill snapshots: permissive for now
CREATE POLICY "skill_snapshots_select" ON skill_snapshots
  FOR SELECT USING (true);

CREATE POLICY "skill_snapshots_insert" ON skill_snapshots
  FOR INSERT WITH CHECK (true);
