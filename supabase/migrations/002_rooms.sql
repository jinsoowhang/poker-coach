-- 002_rooms.sql
-- Multiplayer private rooms

CREATE TABLE rooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  host_id      uuid NOT NULL REFERENCES players(id),
  status       text NOT NULL DEFAULT 'waiting',
  max_players  int NOT NULL DEFAULT 6,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_code ON rooms(code);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "rooms_insert" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "rooms_update" ON rooms
  FOR UPDATE USING (true);
