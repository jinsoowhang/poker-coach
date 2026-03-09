# Phase 4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete poker-coach with data persistence (Supabase), stats dashboard, leaderboard, casino-feel animations, AI timing, and GitHub Pages deployment.

**Architecture:** Supabase-only backend (no Express server). Anonymous player identity via localStorage, schema ready for auth. Static deploy to GitHub Pages with GitHub Actions CI. All animations pure CSS transitions.

**Tech Stack:** Supabase JS client, React Router, Recharts (charts), CSS transitions + requestAnimationFrame, GitHub Actions

**Design doc:** `docs/plans/2026-03-08-phase4-design.md`

---

## Task 1: AI Action Timing

Engine-level change. No Supabase dependency. Can be done first.

**Files:**
- Modify: `packages/engine/src/game-loop.ts` (the delay logic)
- Modify: `packages/engine/src/ai/personalities.ts` (add speed modifier)
- Modify: `packages/engine/src/types.ts` (add speed to AiPersonality)
- Create: `packages/engine/src/ai/action-timing.ts`
- Create: `packages/engine/src/ai/action-timing.test.ts`

**Step 1: Add speed modifier to AiPersonality type**

In `packages/engine/src/types.ts`, add `speedModifier` to `AiPersonality`:

```typescript
export interface AiPersonality {
  type: 'TAG' | 'LAG' | 'TP' | 'LP';
  name: string;
  vpip: number;
  aggression: number;
  bluffFrequency: number;
  speedModifier: number; // 0.7 = fast, 1.0 = normal, 1.3 = slow
}
```

**Step 2: Update personality profiles with speed modifiers**

In `packages/engine/src/ai/personalities.ts`:

```typescript
// TAG: normal speed
speedModifier: 1.0

// LAG: acts fast (impulsive)
speedModifier: 0.7

// TP: acts slow (deliberate)
speedModifier: 1.3

// LP: slightly slow (passive/uncertain)
speedModifier: 1.1
```

**Step 3: Write action-timing module with tests**

Create `packages/engine/src/ai/action-timing.ts`:

```typescript
import { ActionType, AiPersonality } from '../types.js';

const BASE_DELAYS: Record<ActionType, [number, number]> = {
  fold: [800, 1500],
  check: [1200, 2500],
  call: [1200, 2500],
  raise: [1500, 3500],
  'all-in': [2000, 4000],
};

export function getActionDelay(actionType: ActionType, personality: AiPersonality): number {
  const [min, max] = BASE_DELAYS[actionType];
  const base = min + Math.random() * (max - min);
  return Math.round(base * personality.speedModifier);
}
```

Create `packages/engine/src/ai/action-timing.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getActionDelay } from './action-timing.js';
import { TAG, LAG, TP } from './personalities.js';

describe('getActionDelay', () => {
  it('returns delay within fold range for TAG', () => {
    for (let i = 0; i < 50; i++) {
      const delay = getActionDelay('fold', TAG);
      expect(delay).toBeGreaterThanOrEqual(800 * TAG.speedModifier);
      expect(delay).toBeLessThanOrEqual(1500 * TAG.speedModifier);
    }
  });

  it('LAG is faster than TP for same action', () => {
    const lagDelays = Array.from({ length: 100 }, () => getActionDelay('raise', LAG));
    const tpDelays = Array.from({ length: 100 }, () => getActionDelay('raise', TP));
    const avgLag = lagDelays.reduce((a, b) => a + b) / lagDelays.length;
    const avgTp = tpDelays.reduce((a, b) => a + b) / tpDelays.length;
    expect(avgLag).toBeLessThan(avgTp);
  });

  it('all-in has longest base delay', () => {
    const foldDelays = Array.from({ length: 100 }, () => getActionDelay('fold', TAG));
    const allInDelays = Array.from({ length: 100 }, () => getActionDelay('all-in', TAG));
    const avgFold = foldDelays.reduce((a, b) => a + b) / foldDelays.length;
    const avgAllIn = allInDelays.reduce((a, b) => a + b) / allInDelays.length;
    expect(avgAllIn).toBeGreaterThan(avgFold);
  });
});
```

**Step 4: Run tests**

```bash
cd packages/engine && npx vitest run src/ai/action-timing.test.ts
```
Expected: 3 tests PASS

**Step 5: Integrate timing into game-loop.ts**

In `packages/engine/src/game-loop.ts`, replace the fixed delay with `getActionDelay`. The current delay is likely a simple `setTimeout` or `await sleep()`. Replace it with:

```typescript
import { getActionDelay } from './ai/action-timing.js';

// Inside the AI action section of the betting round:
const delay = getActionDelay(action.type, personality);
await new Promise(resolve => setTimeout(resolve, delay));
```

**Step 6: Export from index.ts**

Add `export { getActionDelay } from './ai/action-timing.js';` to `packages/engine/src/index.ts`.

**Step 7: Run full engine test suite**

```bash
cd packages/engine && npx vitest run
```
Expected: All tests pass (96 existing + 3 new)

**Step 8: Commit**

```bash
git add packages/engine/src/ai/action-timing.ts packages/engine/src/ai/action-timing.test.ts packages/engine/src/types.ts packages/engine/src/ai/personalities.ts packages/engine/src/game-loop.ts packages/engine/src/index.ts
git commit -m "feat(engine): add variable AI action timing by action type and personality"
```

---

## Task 2: Thinking Indicator on AI Seats

Client-side UI. No Supabase dependency.

**Files:**
- Modify: `packages/client/src/stores/useGameStore.ts` (track thinking player)
- Modify: `packages/client/src/components/PlayerSeat.tsx` (show indicator)

**Step 1: Add thinking state to game store**

In `useGameStore.ts`, add to the store interface:

```typescript
thinkingPlayerId: string | null;
```

Initialize to `null`. Set it when an AI player's turn starts (on `AWAITING_INPUT` for non-human players), clear it on `PLAYER_ACTION`.

**Step 2: Add thinking indicator to PlayerSeat**

In `PlayerSeat.tsx`, when `thinkingPlayerId === player.id`, render a pulsing dot:

```tsx
{isThinking && (
  <div className="flex items-center gap-1 text-amber-400 text-xs">
    <span className="animate-pulse">●</span>
    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
  </div>
)}
```

**Step 3: Add human turn timer**

Show a subtle elapsed-time counter on the human player's seat when it's their turn. Use a simple `useEffect` with `setInterval` that counts seconds. Display as "0:05", "0:12", etc. in muted text.

**Step 4: Verify visually**

```bash
npm run dev
```
Play a hand, observe AI thinking dots and human timer.

**Step 5: Commit**

```bash
git add packages/client/src/stores/useGameStore.ts packages/client/src/components/PlayerSeat.tsx
git commit -m "feat(client): add AI thinking indicator and human turn timer"
```

---

## Task 3: Card Dealing Animations

Pure CSS transitions. This is the biggest visual change.

**Files:**
- Create: `packages/client/src/components/AnimatedCard.tsx`
- Create: `packages/client/src/components/DeckPosition.tsx`
- Create: `packages/client/src/hooks/useAnimationSequence.ts`
- Modify: `packages/client/src/components/CardComponent.tsx` (wrap with animation)
- Modify: `packages/client/src/components/PokerTable.tsx` (add deck, chip animations)
- Modify: `packages/client/src/components/PlayerSeat.tsx` (accept animation props)
- Modify: `packages/client/src/index.css` (animation keyframes)

**Step 1: Add CSS animation keyframes**

In `packages/client/src/index.css`, add:

```css
/* Card dealing animation */
.card-deal {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.3s ease;
}

.card-deal-start {
  transform: translate(var(--deck-x), var(--deck-y)) scale(0.5);
  opacity: 0;
}

.card-deal-end {
  transform: translate(0, 0) scale(1);
  opacity: 1;
}

/* Card flip */
.card-flip {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
}

.card-face-down {
  transform: rotateY(180deg);
}

.card-face-up {
  transform: rotateY(0deg);
}

/* Winner glow */
@keyframes winner-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(234, 179, 8, 0.4); }
  50% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.8); }
}

.winner-card {
  animation: winner-glow 1.5s ease-in-out 3;
}

/* Chip slide */
.chip-to-pot {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.3s ease;
}

/* Fade losers */
.loser-fade {
  opacity: 0.4;
  transition: opacity 0.5s ease;
}
```

**Step 2: Create animation sequencing hook**

Create `packages/client/src/hooks/useAnimationSequence.ts`:

```typescript
import { useCallback, useRef } from 'react';

type AnimationStep = () => Promise<void>;

export function useAnimationSequence() {
  const queueRef = useRef<AnimationStep[]>([]);
  const runningRef = useRef(false);

  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const enqueue = useCallback((step: AnimationStep) => {
    queueRef.current.push(step);
    if (!runningRef.current) {
      runningRef.current = true;
      (async () => {
        while (queueRef.current.length > 0) {
          const next = queueRef.current.shift()!;
          await next();
        }
        runningRef.current = false;
      })();
    }
  }, []);

  return { enqueue, delay };
}
```

**Step 3: Create AnimatedCard component**

Create `packages/client/src/components/AnimatedCard.tsx`:

A wrapper around `CardComponent` that:
- Starts at deck position (off-screen top-right)
- Transitions to final position via CSS `card-deal` class
- Has a `faceUp` prop that triggers the flip transition
- Has a `winner` prop that triggers the glow animation

```tsx
import { useState, useEffect } from 'react';
import CardComponent from './CardComponent';
import { Card } from '@poker-coach/engine';

interface AnimatedCardProps {
  card: Card | null;
  faceUp: boolean;
  winner?: boolean;
  dealDelay?: number; // stagger delay in ms
}

export default function AnimatedCard({ card, faceUp, winner, dealDelay = 0 }: AnimatedCardProps) {
  const [dealt, setDealt] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const dealTimer = setTimeout(() => setDealt(true), dealDelay);
    return () => clearTimeout(dealTimer);
  }, [dealDelay]);

  useEffect(() => {
    if (faceUp && dealt) {
      const flipTimer = setTimeout(() => setFlipped(true), 200);
      return () => clearTimeout(flipTimer);
    }
  }, [faceUp, dealt]);

  return (
    <div className={`card-deal ${dealt ? 'card-deal-end' : 'card-deal-start'} ${winner ? 'winner-card' : ''}`}>
      <div className={`card-flip ${flipped ? 'card-face-up' : 'card-face-down'}`}>
        {card && flipped ? (
          <CardComponent card={card} />
        ) : (
          <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border border-blue-600" />
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create DeckPosition component**

Create `packages/client/src/components/DeckPosition.tsx`:

Small stack of card backs in the dealer area, visually showing the deck. Cards "leave" from here.

```tsx
export default function DeckPosition() {
  return (
    <div className="relative w-16 h-24">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute w-16 h-24 rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border border-blue-600"
          style={{ top: -i * 2, left: -i * 2 }}
        />
      ))}
    </div>
  );
}
```

**Step 5: Integrate animations into PokerTable and PlayerSeat**

Modify `PokerTable.tsx`:
- Add `<DeckPosition />` near dealer
- Track animation phase in game store (dealing, betting, showdown)
- Community cards use `<AnimatedCard>` with stagger delays: flop cards at 0/150/300ms, turn/river at 0ms

Modify `PlayerSeat.tsx`:
- Replace direct `<CardComponent>` with `<AnimatedCard>`
- Pass `dealDelay` based on seat index (seatIndex * 100ms stagger)
- Pass `faceUp={player.isHuman || showdown}`
- Pass `winner` when player is in winners list

**Step 6: Add chip movement animation**

In `PokerTable.tsx`, when a bet is placed:
- Render a temporary chip icon at the player's seat position
- CSS transition moves it to pot center
- Fade out after arrival

When pot is won:
- Chip icon at pot center
- CSS transition to winner's seat
- Fade out after arrival

Use a `chipAnimations` state array: `{ id, fromX, fromY, toX, toY, active }[]`

**Step 7: Add animation phase tracking to game store**

In `useGameStore.ts`, add:

```typescript
animationPhase: 'idle' | 'dealing' | 'community' | 'showdown';
```

Set on relevant events:
- `HAND_START` → `'dealing'`
- `COMMUNITY_CARDS` → `'community'`
- `SHOWDOWN` → `'showdown'`
- After animations complete → `'idle'`

**Step 8: Verify visually**

```bash
npm run dev
```
Play multiple hands. Verify: cards fly from deck, flip, community cards stagger, showdown reveals, winner glow, chip movement.

**Step 9: Commit**

```bash
git add packages/client/src/components/AnimatedCard.tsx packages/client/src/components/DeckPosition.tsx packages/client/src/hooks/useAnimationSequence.ts packages/client/src/components/CardComponent.tsx packages/client/src/components/PokerTable.tsx packages/client/src/components/PlayerSeat.tsx packages/client/src/index.css packages/client/src/stores/useGameStore.ts
git commit -m "feat(client): add casino-feel card dealing, flip, and chip animations"
```

---

## Task 4: Supabase Setup & Migrations

Foundation for all persistence.

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `packages/client/src/lib/supabase.ts`
- Modify: `packages/client/package.json` (add @supabase/supabase-js)
- Create: `packages/client/.env.example`

**Step 1: Install Supabase client**

```bash
cd packages/client && npm install @supabase/supabase-js
```

**Step 2: Create Supabase client module**

Create `packages/client/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase not configured. Stats will not persist.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

**Step 3: Create .env.example**

Create `packages/client/.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add `.env` to `.gitignore` (root level).

**Step 4: Write SQL migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Players (anonymous sessions, auth-ready)
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sessions (groups of hands)
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  hands_played int NOT NULL DEFAULT 0,
  chips_start int NOT NULL,
  chips_end int,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Individual hands
CREATE TABLE hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  session_id uuid REFERENCES sessions(id),
  hand_number int NOT NULL,
  pot_total int NOT NULL,
  community_cards jsonb NOT NULL DEFAULT '[]',
  player_results jsonb NOT NULL DEFAULT '[]',
  winners jsonb NOT NULL DEFAULT '[]',
  hero_hole_cards jsonb,
  hero_position text,
  hero_actions jsonb NOT NULL DEFAULT '[]',
  hero_chips_before int NOT NULL,
  hero_chips_after int NOT NULL,
  hero_folded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Skill snapshots (every 10 hands)
CREATE TABLE skill_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  hands_total int NOT NULL,
  skill_score float NOT NULL,
  vpip float NOT NULL,
  aggression float NOT NULL,
  win_rate float NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hands_player_id ON hands(player_id);
CREATE INDEX idx_hands_session_id ON hands(session_id);
CREATE INDEX idx_sessions_player_id ON sessions(player_id);
CREATE INDEX idx_skill_snapshots_player_id ON skill_snapshots(player_id);

-- Leaderboard stats view (minimum 20 hands)
CREATE OR REPLACE VIEW leaderboard_stats AS
SELECT
  p.id AS player_id,
  p.display_name,
  COUNT(h.id) AS hands_played,

  -- Win rate: hands where hero was a winner / total hands
  ROUND(
    COUNT(CASE WHEN h.hero_chips_after > h.hero_chips_before THEN 1 END)::numeric
    / GREATEST(COUNT(h.id), 1), 3
  ) AS win_rate,

  -- VPIP: hands where hero voluntarily put chips in preflop (not just posted blinds)
  ROUND(
    COUNT(CASE WHEN EXISTS (
      SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
      WHERE a->>'street' = 'preflop'
        AND a->>'type' IN ('call', 'raise', 'all-in')
    ) THEN 1 END)::numeric
    / GREATEST(COUNT(h.id), 1), 3
  ) AS vpip,

  -- Aggression factor: raises / calls (across all streets)
  ROUND(
    GREATEST(
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
        WHERE a->>'type' IN ('raise', 'all-in')
      ) THEN 1 END)::numeric, 0
    )
    / GREATEST(
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
        WHERE a->>'type' = 'call'
      ) THEN 1 END)::numeric, 1
    ), 2
  ) AS aggression,

  -- Showdown win %: won at showdown / went to showdown
  ROUND(
    COUNT(CASE WHEN NOT h.hero_folded AND h.hero_chips_after > h.hero_chips_before THEN 1 END)::numeric
    / GREATEST(COUNT(CASE WHEN NOT h.hero_folded THEN 1 END), 1), 3
  ) AS showdown_win_pct,

  -- Average profit per hand
  ROUND(AVG(h.hero_chips_after - h.hero_chips_before), 1) AS avg_profit,

  -- Composite skill score (0-1000 scale)
  -- Weighted: win_rate 30%, good VPIP (close to 0.22) 25%, aggression (close to 0.75) 20%, showdown 25%
  ROUND((
    -- Win rate component (0-300)
    (COUNT(CASE WHEN h.hero_chips_after > h.hero_chips_before THEN 1 END)::numeric
      / GREATEST(COUNT(h.id), 1)) * 300
    +
    -- VPIP component (0-250, optimal around 0.22, penalize deviation)
    GREATEST(250 - ABS(
      (COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
        WHERE a->>'street' = 'preflop' AND a->>'type' IN ('call', 'raise', 'all-in')
      ) THEN 1 END)::numeric / GREATEST(COUNT(h.id), 1)) - 0.22
    ) * 1000, 0)
    +
    -- Aggression component (0-200, optimal around 2.0)
    GREATEST(200 - ABS(
      GREATEST(
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
          WHERE a->>'type' IN ('raise', 'all-in')
        ) THEN 1 END)::numeric, 0
      ) / GREATEST(
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements(h.hero_actions) AS a
          WHERE a->>'type' = 'call'
        ) THEN 1 END)::numeric, 1
      ) - 2.0
    ) * 100, 0)
    +
    -- Showdown win component (0-250)
    (COUNT(CASE WHEN NOT h.hero_folded AND h.hero_chips_after > h.hero_chips_before THEN 1 END)::numeric
      / GREATEST(COUNT(CASE WHEN NOT h.hero_folded THEN 1 END), 1)) * 250
  ), 0) AS skill_score

FROM players p
JOIN hands h ON h.player_id = p.id
GROUP BY p.id, p.display_name
HAVING COUNT(h.id) >= 20;

-- Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: players can read/write their own data
CREATE POLICY "Players can read own data" ON players FOR SELECT USING (true);
CREATE POLICY "Players can insert own data" ON players FOR INSERT WITH CHECK (true);

CREATE POLICY "Hands: read own" ON hands FOR SELECT USING (player_id = (current_setting('app.current_player_id', true))::uuid);
CREATE POLICY "Hands: insert own" ON hands FOR INSERT WITH CHECK (player_id = (current_setting('app.current_player_id', true))::uuid);

CREATE POLICY "Sessions: read own" ON sessions FOR SELECT USING (player_id = (current_setting('app.current_player_id', true))::uuid);
CREATE POLICY "Sessions: insert own" ON sessions FOR INSERT WITH CHECK (player_id = (current_setting('app.current_player_id', true))::uuid);
CREATE POLICY "Sessions: update own" ON sessions FOR UPDATE USING (player_id = (current_setting('app.current_player_id', true))::uuid);

CREATE POLICY "Snapshots: read own" ON skill_snapshots FOR SELECT USING (player_id = (current_setting('app.current_player_id', true))::uuid);
CREATE POLICY "Snapshots: insert own" ON skill_snapshots FOR INSERT WITH CHECK (player_id = (current_setting('app.current_player_id', true))::uuid);
```

**Step 5: Create Supabase project**

Manual step: Go to supabase.com, create a project "poker-coach", run the migration SQL in the SQL editor, copy the URL and anon key into `packages/client/.env`.

**Step 6: Commit**

```bash
git add supabase/ packages/client/src/lib/supabase.ts packages/client/.env.example packages/client/package.json packages/client/package-lock.json .gitignore
git commit -m "feat: add Supabase client setup and database migrations"
```

---

## Task 5: Player Store (Anonymous Identity)

**Files:**
- Create: `packages/client/src/stores/usePlayerStore.ts`
- Modify: `packages/client/src/App.tsx` (initialize player on load)

**Step 1: Create usePlayerStore**

Create `packages/client/src/stores/usePlayerStore.ts`:

```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

function generateDisplayName(): string {
  const adjectives = ['Lucky', 'Bold', 'Sharp', 'Cool', 'Sly', 'Swift', 'Keen', 'Wise'];
  const nouns = ['Ace', 'King', 'Shark', 'Fox', 'Wolf', 'Hawk', 'Tiger', 'Eagle'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

interface PlayerStore {
  playerId: string | null;
  displayName: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playerId: null,
  displayName: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    // Check localStorage first
    const storedId = localStorage.getItem('poker-coach-player-id');
    const storedName = localStorage.getItem('poker-coach-display-name');

    if (storedId && storedName) {
      set({ playerId: storedId, displayName: storedName, initialized: true });
      return;
    }

    // Create new player
    const displayName = generateDisplayName();

    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .insert({ display_name: displayName })
        .select('id')
        .single();

      if (data && !error) {
        localStorage.setItem('poker-coach-player-id', data.id);
        localStorage.setItem('poker-coach-display-name', displayName);
        set({ playerId: data.id, displayName, initialized: true });
        return;
      }
    }

    // Fallback: generate local UUID if Supabase unavailable
    const localId = crypto.randomUUID();
    localStorage.setItem('poker-coach-player-id', localId);
    localStorage.setItem('poker-coach-display-name', displayName);
    set({ playerId: localId, displayName, initialized: true });
  },
}));
```

**Step 2: Initialize player in App.tsx**

In `App.tsx`, call `usePlayerStore.getState().initialize()` in a `useEffect` on mount.

**Step 3: Verify**

```bash
npm run dev
```
Open browser, check localStorage for `poker-coach-player-id` and `poker-coach-display-name`.

**Step 4: Commit**

```bash
git add packages/client/src/stores/usePlayerStore.ts packages/client/src/App.tsx
git commit -m "feat(client): add anonymous player identity with localStorage persistence"
```

---

## Task 6: Session & Hand Persistence

Wire up HAND_END to save to Supabase.

**Files:**
- Create: `packages/client/src/lib/persistence.ts`
- Create: `packages/client/src/stores/useSessionStore.ts`
- Modify: `packages/client/src/stores/useGameStore.ts` (call persistence on HAND_END)

**Step 1: Create persistence module**

Create `packages/client/src/lib/persistence.ts`:

```typescript
import { supabase } from './supabase';
import type { HandSummary, GameEvent } from '@poker-coach/engine';

interface HeroActions {
  street: string;
  type: string;
  amount: number;
}

function extractHeroActions(events: GameEvent[], heroId: string): HeroActions[] {
  const actions: HeroActions[] = [];
  let currentStreet = 'preflop';

  for (const event of events) {
    if (event.type === 'STREET_CHANGE') {
      currentStreet = event.street;
    }
    if (event.type === 'PLAYER_ACTION' && event.playerId === heroId) {
      actions.push({
        street: currentStreet,
        type: event.action.type,
        amount: event.action.amount,
      });
    }
  }

  return actions;
}

function getHeroPosition(seatIndex: number, dealerIndex: number, playerCount: number): string {
  const positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];
  const relativePos = (seatIndex - dealerIndex + playerCount) % playerCount;
  return positions[relativePos] ?? 'MP';
}

export async function saveHand(
  playerId: string,
  sessionId: string,
  summary: HandSummary,
  events: GameEvent[],
  heroId: string,
  dealerIndex: number,
  playerCount: number,
  heroSeatIndex: number
): Promise<void> {
  if (!supabase) return;

  const heroResult = summary.playerResults.find(r => r.playerId === heroId);
  if (!heroResult) return;

  const heroActions = extractHeroActions(events, heroId);
  const heroPosition = getHeroPosition(heroSeatIndex, dealerIndex, playerCount);

  await supabase.from('hands').insert({
    player_id: playerId,
    session_id: sessionId,
    hand_number: summary.handNumber,
    pot_total: summary.potTotal,
    community_cards: summary.communityCards,
    player_results: summary.playerResults,
    winners: summary.winners,
    hero_hole_cards: heroResult.holeCards,
    hero_position: heroPosition,
    hero_actions: heroActions,
    hero_chips_before: heroResult.chipsBefore,
    hero_chips_after: heroResult.chipsAfter,
    hero_folded: heroResult.folded,
  });
}

export async function createSession(playerId: string, chipsStart: number): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('sessions')
    .insert({ player_id: playerId, chips_start: chipsStart })
    .select('id')
    .single();

  return data?.id ?? null;
}

export async function endSession(sessionId: string, handsPlayed: number, chipsEnd: number): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('sessions')
    .update({ hands_played: handsPlayed, chips_end: chipsEnd, ended_at: new Date().toISOString() })
    .eq('id', sessionId);
}
```

**Step 2: Create useSessionStore**

Create `packages/client/src/stores/useSessionStore.ts`:

```typescript
import { create } from 'zustand';
import { createSession, endSession } from '../lib/persistence';

interface SessionStore {
  sessionId: string | null;
  handsPlayed: number;
  startSession: (playerId: string, chipsStart: number) => Promise<void>;
  endSession: (chipsEnd: number) => Promise<void>;
  incrementHands: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  handsPlayed: 0,

  startSession: async (playerId, chipsStart) => {
    const id = await createSession(playerId, chipsStart);
    set({ sessionId: id, handsPlayed: 0 });
  },

  endSession: async (chipsEnd) => {
    const { sessionId, handsPlayed } = get();
    if (sessionId) {
      await endSession(sessionId, handsPlayed, chipsEnd);
    }
    set({ sessionId: null, handsPlayed: 0 });
  },

  incrementHands: () => set(s => ({ handsPlayed: s.handsPlayed + 1 })),
}));
```

**Step 3: Wire persistence into useGameStore**

In `useGameStore.ts`, on `HAND_END` event:

```typescript
// After existing HAND_END handling:
const playerId = usePlayerStore.getState().playerId;
const sessionId = useSessionStore.getState().sessionId;
if (playerId && sessionId) {
  const heroId = state.players.find(p => p.isHuman)?.id;
  if (heroId) {
    saveHand(playerId, sessionId, summary, state.eventLog, heroId, state.dealerIndex, state.players.length, 0);
    useSessionStore.getState().incrementHands();
  }
}
```

**Step 4: Start session on game start**

In `useGameStore.ts` `startGame()`:

```typescript
const playerId = usePlayerStore.getState().playerId;
if (playerId) {
  useSessionStore.getState().startSession(playerId, 1000); // starting chips
}
```

**Step 5: Verify**

```bash
npm run dev
```
Play a hand with Supabase configured. Check Supabase dashboard for new rows in `hands` and `sessions` tables.

**Step 6: Commit**

```bash
git add packages/client/src/lib/persistence.ts packages/client/src/stores/useSessionStore.ts packages/client/src/stores/useGameStore.ts
git commit -m "feat(client): persist hand history and sessions to Supabase"
```

---

## Task 7: React Router & Navigation

**Files:**
- Install: `react-router-dom`
- Modify: `packages/client/src/App.tsx` (add router)
- Create: `packages/client/src/components/NavBar.tsx`
- Create: `packages/client/src/pages/DashboardPage.tsx` (placeholder)
- Create: `packages/client/src/pages/LeaderboardPage.tsx` (placeholder)

**Step 1: Install React Router**

```bash
cd packages/client && npm install react-router-dom
```

**Step 2: Create NavBar component**

Create `packages/client/src/components/NavBar.tsx`:

```tsx
import { Link, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function NavBar() {
  const location = useLocation();
  const displayName = usePlayerStore(s => s.displayName);

  const links = [
    { to: '/', label: 'Play' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-emerald-900/50">
      <div className="flex items-center gap-2">
        <span className="font-display text-xl text-amber-400">Poker Coach</span>
      </div>
      <div className="flex items-center gap-6">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm font-medium transition-colors ${
              location.pathname === link.to
                ? 'text-amber-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="text-sm text-gray-500 font-mono">
        {displayName}
      </div>
    </nav>
  );
}
```

**Step 3: Create placeholder pages**

Create `packages/client/src/pages/DashboardPage.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Dashboard — coming soon</p>
    </div>
  );
}
```

Create `packages/client/src/pages/LeaderboardPage.tsx`:

```tsx
export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Leaderboard — coming soon</p>
    </div>
  );
}
```

**Step 4: Update App.tsx with router**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import NavBar from './components/NavBar';
import GamePage from './pages/GamePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { usePlayerStore } from './stores/usePlayerStore';

export default function App() {
  useEffect(() => {
    usePlayerStore.getState().initialize();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

**Step 5: Verify routing works**

```bash
npm run dev
```
Navigate between /, /dashboard, /leaderboard. Verify nav highlights correct link.

**Step 6: Commit**

```bash
git add packages/client/src/App.tsx packages/client/src/components/NavBar.tsx packages/client/src/pages/DashboardPage.tsx packages/client/src/pages/LeaderboardPage.tsx packages/client/package.json packages/client/package-lock.json
git commit -m "feat(client): add React Router with nav bar, dashboard and leaderboard placeholders"
```

---

## Task 8: Stats Store

Fetch and compute stats from Supabase for Dashboard and Leaderboard.

**Files:**
- Create: `packages/client/src/stores/useStatsStore.ts`
- Create: `packages/client/src/lib/stats.ts`

**Step 1: Create stats query module**

Create `packages/client/src/lib/stats.ts`:

```typescript
import { supabase } from './supabase';

export interface PlayerStats {
  player_id: string;
  display_name: string;
  hands_played: number;
  win_rate: number;
  vpip: number;
  aggression: number;
  showdown_win_pct: number;
  avg_profit: number;
  skill_score: number;
}

export interface HandRecord {
  id: string;
  hand_number: number;
  pot_total: number;
  hero_hole_cards: any;
  hero_position: string;
  hero_actions: any[];
  hero_chips_before: number;
  hero_chips_after: number;
  hero_folded: boolean;
  community_cards: any[];
  winners: any[];
  created_at: string;
}

export interface SkillSnapshot {
  hands_total: number;
  skill_score: number;
  vpip: number;
  aggression: number;
  win_rate: number;
  created_at: string;
}

export async function fetchLeaderboard(): Promise<PlayerStats[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('leaderboard_stats').select('*').order('skill_score', { ascending: false });
  return data ?? [];
}

export async function fetchPlayerHands(playerId: string, limit = 20): Promise<HandRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('hands')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchSkillHistory(playerId: string): Promise<SkillSnapshot[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('skill_snapshots')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function fetchChipHistory(playerId: string): Promise<{ hand_number: number; chips: number }[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('hands')
    .select('hand_number, hero_chips_after')
    .eq('player_id', playerId)
    .order('hand_number', { ascending: true });
  return (data ?? []).map(d => ({ hand_number: d.hand_number, chips: d.hero_chips_after }));
}
```

**Step 2: Create useStatsStore**

Create `packages/client/src/stores/useStatsStore.ts`:

```typescript
import { create } from 'zustand';
import { fetchLeaderboard, fetchPlayerHands, fetchSkillHistory, fetchChipHistory } from '../lib/stats';
import type { PlayerStats, HandRecord, SkillSnapshot } from '../lib/stats';

interface StatsStore {
  leaderboard: PlayerStats[];
  recentHands: HandRecord[];
  skillHistory: SkillSnapshot[];
  chipHistory: { hand_number: number; chips: number }[];
  loading: boolean;

  loadLeaderboard: () => Promise<void>;
  loadDashboard: (playerId: string) => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  leaderboard: [],
  recentHands: [],
  skillHistory: [],
  chipHistory: [],
  loading: false,

  loadLeaderboard: async () => {
    set({ loading: true });
    const leaderboard = await fetchLeaderboard();
    set({ leaderboard, loading: false });
  },

  loadDashboard: async (playerId: string) => {
    set({ loading: true });
    const [recentHands, skillHistory, chipHistory] = await Promise.all([
      fetchPlayerHands(playerId),
      fetchSkillHistory(playerId),
      fetchChipHistory(playerId),
    ]);
    set({ recentHands, skillHistory, chipHistory, loading: false });
  },
}));
```

**Step 3: Commit**

```bash
git add packages/client/src/lib/stats.ts packages/client/src/stores/useStatsStore.ts
git commit -m "feat(client): add stats store with leaderboard and dashboard data fetching"
```

---

## Task 9: Skill Snapshots

Save a skill snapshot every 10 hands.

**Files:**
- Create: `packages/client/src/lib/skill-calculator.ts`
- Modify: `packages/client/src/lib/persistence.ts` (add snapshot saving)
- Modify: `packages/client/src/stores/useGameStore.ts` (trigger snapshot)

**Step 1: Create skill calculator**

Create `packages/client/src/lib/skill-calculator.ts`:

```typescript
import { supabase } from './supabase';

export async function computeAndSaveSnapshot(playerId: string): Promise<void> {
  if (!supabase) return;

  // Fetch all hands for this player
  const { data: hands } = await supabase
    .from('hands')
    .select('hero_actions, hero_chips_before, hero_chips_after, hero_folded')
    .eq('player_id', playerId);

  if (!hands || hands.length === 0) return;

  const total = hands.length;

  // Win rate
  const wins = hands.filter(h => h.hero_chips_after > h.hero_chips_before).length;
  const winRate = wins / total;

  // VPIP
  const vpipHands = hands.filter(h =>
    (h.hero_actions as any[]).some(
      (a: any) => a.street === 'preflop' && ['call', 'raise', 'all-in'].includes(a.type)
    )
  ).length;
  const vpip = vpipHands / total;

  // Aggression
  let raises = 0;
  let calls = 0;
  for (const h of hands) {
    for (const a of h.hero_actions as any[]) {
      if (a.type === 'raise' || a.type === 'all-in') raises++;
      if (a.type === 'call') calls++;
    }
  }
  const aggression = calls > 0 ? raises / calls : raises;

  // Showdown win %
  const showdownHands = hands.filter(h => !h.hero_folded);
  const showdownWins = showdownHands.filter(h => h.hero_chips_after > h.hero_chips_before).length;
  const showdownWinPct = showdownHands.length > 0 ? showdownWins / showdownHands.length : 0;

  // Skill score (same formula as SQL view)
  const vpipComponent = Math.max(250 - Math.abs(vpip - 0.22) * 1000, 0);
  const aggressionComponent = Math.max(200 - Math.abs(aggression - 2.0) * 100, 0);
  const skillScore = Math.round(
    winRate * 300 + vpipComponent + aggressionComponent + showdownWinPct * 250
  );

  await supabase.from('skill_snapshots').insert({
    player_id: playerId,
    hands_total: total,
    skill_score: skillScore,
    vpip: Math.round(vpip * 1000) / 1000,
    aggression: Math.round(aggression * 100) / 100,
    win_rate: Math.round(winRate * 1000) / 1000,
  });
}
```

**Step 2: Trigger snapshot every 10 hands**

In `useGameStore.ts`, after the HAND_END persistence call:

```typescript
// After saveHand call:
const { handsPlayed } = useSessionStore.getState();
if (handsPlayed > 0 && handsPlayed % 10 === 0) {
  computeAndSaveSnapshot(playerId);
}
```

**Step 3: Commit**

```bash
git add packages/client/src/lib/skill-calculator.ts packages/client/src/lib/persistence.ts packages/client/src/stores/useGameStore.ts
git commit -m "feat(client): compute and save skill snapshots every 10 hands"
```

---

## Task 10: Dashboard Page

Full dashboard with charts and stats.

**Files:**
- Install: `recharts`
- Modify: `packages/client/src/pages/DashboardPage.tsx` (full implementation)
- Create: `packages/client/src/components/dashboard/ChipTrendChart.tsx`
- Create: `packages/client/src/components/dashboard/SkillRadar.tsx`
- Create: `packages/client/src/components/dashboard/SkillTrendChart.tsx`
- Create: `packages/client/src/components/dashboard/RecentHandsTable.tsx`
- Create: `packages/client/src/components/dashboard/CoachingInsights.tsx`
- Create: `packages/client/src/components/dashboard/StatCard.tsx`

**Step 1: Install recharts**

```bash
cd packages/client && npm install recharts
```

**Step 2: Create StatCard component**

Create `packages/client/src/components/dashboard/StatCard.tsx`:

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'emerald' | 'amber' | 'red' | 'blue';
}

export default function StatCard({ label, value, subtitle, color = 'emerald' }: StatCardProps) {
  const colors = {
    emerald: 'border-emerald-800 text-emerald-400',
    amber: 'border-amber-800 text-amber-400',
    red: 'border-red-800 text-red-400',
    blue: 'border-blue-800 text-blue-400',
  };

  return (
    <div className={`bg-gray-900 border ${colors[color]} rounded-xl p-5`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-mono font-bold mt-1 ${colors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
```

**Step 3: Create ChipTrendChart**

Create `packages/client/src/components/dashboard/ChipTrendChart.tsx`:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { hand_number: number; chips: number }[];
}

export default function ChipTrendChart({ data }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Chip Count Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="hand_number" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Line type="monotone" dataKey="chips" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 4: Create SkillRadar**

Create `packages/client/src/components/dashboard/SkillRadar.tsx`:

Uses a custom SVG hexagonal radar chart comparing player stats to optimal TAG ranges. Axes: VPIP, Aggression, Win Rate, Showdown Win %, Bluff Freq.

```tsx
interface RadarPoint {
  label: string;
  value: number;   // 0-1 normalized
  optimal: number;  // 0-1 normalized
}

interface Props {
  vpip: number;
  aggression: number;
  winRate: number;
  showdownWinPct: number;
}

export default function SkillRadar({ vpip, aggression, winRate, showdownWinPct }: Props) {
  const size = 200;
  const center = size / 2;
  const radius = 80;

  // Normalize to 0-1 scale
  const points: RadarPoint[] = [
    { label: 'VPIP', value: Math.min(vpip / 0.5, 1), optimal: 0.22 / 0.5 },
    { label: 'Aggression', value: Math.min(aggression / 4, 1), optimal: 2.0 / 4 },
    { label: 'Win Rate', value: Math.min(winRate / 0.6, 1), optimal: 0.35 / 0.6 },
    { label: 'Showdown', value: Math.min(showdownWinPct / 0.8, 1), optimal: 0.55 / 0.8 },
  ];

  const angleStep = (2 * Math.PI) / points.length;

  const getPoint = (value: number, index: number) => ({
    x: center + radius * value * Math.cos(angleStep * index - Math.PI / 2),
    y: center + radius * value * Math.sin(angleStep * index - Math.PI / 2),
  });

  const playerPath = points.map((p, i) => getPoint(p.value, i)).map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const optimalPath = points.map((p, i) => getPoint(p.optimal, i)).map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Playstyle Radar</h3>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[250px] mx-auto">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={points.map((_, i) => {
              const p = getPoint(scale, i);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#374151"
            strokeWidth={0.5}
          />
        ))}
        {/* Optimal range */}
        <path d={optimalPath} fill="rgba(234,179,8,0.1)" stroke="#eab308" strokeWidth={1} strokeDasharray="4 2" />
        {/* Player stats */}
        <path d={playerPath} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth={2} />
        {/* Labels */}
        {points.map((p, i) => {
          const pos = getPoint(1.25, i);
          return (
            <text key={p.label} x={pos.x} y={pos.y} textAnchor="middle" fill="#9ca3af" fontSize={10}>
              {p.label}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-3 text-xs">
        <span className="text-emerald-400">● You</span>
        <span className="text-amber-400">● Optimal (TAG)</span>
      </div>
    </div>
  );
}
```

**Step 5: Create SkillTrendChart**

Create `packages/client/src/components/dashboard/SkillTrendChart.tsx`:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { SkillSnapshot } from '../../lib/stats';

interface Props {
  data: SkillSnapshot[];
}

export default function SkillTrendChart({ data }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Skill Score Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="hands_total" stroke="#6b7280" fontSize={12} />
          <YAxis domain={[0, 1000]} stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Line type="monotone" dataKey="skill_score" stroke="#eab308" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 6: Create RecentHandsTable**

Create `packages/client/src/components/dashboard/RecentHandsTable.tsx`:

```tsx
import type { HandRecord } from '../../lib/stats';

interface Props {
  hands: HandRecord[];
}

export default function RecentHandsTable({ hands }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Recent Hands</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Position</th>
              <th className="text-left py-2">Result</th>
              <th className="text-right py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {hands.map(h => {
              const profit = h.hero_chips_after - h.hero_chips_before;
              return (
                <tr key={h.id} className="border-t border-gray-800">
                  <td className="py-2 font-mono text-gray-400">{h.hand_number}</td>
                  <td className="py-2 text-gray-400">{h.hero_position}</td>
                  <td className="py-2">{h.hero_folded ? <span className="text-gray-500">Folded</span> : <span className="text-emerald-400">Showdown</span>}</td>
                  <td className={`py-2 text-right font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}{profit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 7: Create CoachingInsights**

Create `packages/client/src/components/dashboard/CoachingInsights.tsx`:

```tsx
interface Props {
  vpip: number;
  aggression: number;
  winRate: number;
}

interface Insight {
  message: string;
  type: 'warning' | 'success' | 'info';
}

function generateInsights(vpip: number, aggression: number, winRate: number): Insight[] {
  const insights: Insight[] = [];

  if (vpip > 0.35) {
    insights.push({ message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — you're playing too many hands. Tighten up to 20-25% for better results.`, type: 'warning' });
  } else if (vpip < 0.15) {
    insights.push({ message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — you're too tight. Open up to 20-25% to take advantage of more spots.`, type: 'warning' });
  } else {
    insights.push({ message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — solid hand selection.`, type: 'success' });
  }

  if (aggression < 1.0) {
    insights.push({ message: `Aggression factor ${aggression.toFixed(1)} is passive. Raise more and call less — aim for 2.0+.`, type: 'warning' });
  } else if (aggression > 3.5) {
    insights.push({ message: `Aggression factor ${aggression.toFixed(1)} is very high. Consider calling more in marginal spots.`, type: 'info' });
  } else {
    insights.push({ message: `Aggression factor ${aggression.toFixed(1)} — good balance of aggression.`, type: 'success' });
  }

  if (winRate < 0.25) {
    insights.push({ message: `Win rate ${(winRate * 100).toFixed(0)}% is below average. Focus on position and hand selection.`, type: 'warning' });
  }

  return insights;
}

export default function CoachingInsights({ vpip, aggression, winRate }: Props) {
  const insights = generateInsights(vpip, aggression, winRate);

  const colors = {
    warning: 'border-amber-800 bg-amber-950/30 text-amber-300',
    success: 'border-emerald-800 bg-emerald-950/30 text-emerald-300',
    info: 'border-blue-800 bg-blue-950/30 text-blue-300',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Coaching Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`border rounded-lg p-3 text-sm ${colors[insight.type]}`}>
            {insight.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 8: Assemble DashboardPage**

Update `packages/client/src/pages/DashboardPage.tsx`:

```tsx
import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useStatsStore } from '../stores/useStatsStore';
import StatCard from '../components/dashboard/StatCard';
import ChipTrendChart from '../components/dashboard/ChipTrendChart';
import SkillRadar from '../components/dashboard/SkillRadar';
import SkillTrendChart from '../components/dashboard/SkillTrendChart';
import RecentHandsTable from '../components/dashboard/RecentHandsTable';
import CoachingInsights from '../components/dashboard/CoachingInsights';

export default function DashboardPage() {
  const playerId = usePlayerStore(s => s.playerId);
  const { recentHands, skillHistory, chipHistory, loading, loadDashboard, leaderboard, loadLeaderboard } = useStatsStore();

  useEffect(() => {
    if (playerId) {
      loadDashboard(playerId);
      loadLeaderboard();
    }
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading stats...</p>
      </div>
    );
  }

  const myStats = leaderboard.find(s => s.player_id === playerId);
  const handsPlayed = myStats?.hands_played ?? recentHands.length;
  const winRate = myStats?.win_rate ?? 0;
  const vpip = myStats?.vpip ?? 0;
  const aggression = myStats?.aggression ?? 0;
  const showdownWinPct = myStats?.showdown_win_pct ?? 0;
  const skillScore = myStats?.skill_score ?? 0;
  const totalProfit = chipHistory.length > 0
    ? chipHistory[chipHistory.length - 1].chips - chipHistory[0].chips
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <h1 className="font-display text-2xl text-amber-400 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Hands Played" value={handsPlayed} />
        <StatCard label="Skill Score" value={skillScore} color="amber" subtitle="/1000" />
        <StatCard label="Win Rate" value={`${(winRate * 100).toFixed(1)}%`} color="emerald" />
        <StatCard label="Total Profit" value={totalProfit >= 0 ? `+${totalProfit}` : totalProfit} color={totalProfit >= 0 ? 'emerald' : 'red'} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChipTrendChart data={chipHistory} />
        <SkillTrendChart data={skillHistory} />
      </div>

      {/* Radar + Coaching */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <SkillRadar vpip={vpip} aggression={aggression} winRate={winRate} showdownWinPct={showdownWinPct} />
        <CoachingInsights vpip={vpip} aggression={aggression} winRate={winRate} />
      </div>

      {/* Recent hands */}
      <RecentHandsTable hands={recentHands} />
    </div>
  );
}
```

**Step 9: Verify**

```bash
npm run dev
```
Navigate to /dashboard. Should render (empty state if no hands played yet, populated after playing some hands).

**Step 10: Commit**

```bash
git add packages/client/src/pages/DashboardPage.tsx packages/client/src/components/dashboard/ packages/client/package.json packages/client/package-lock.json
git commit -m "feat(client): build dashboard page with charts, radar, coaching insights"
```

---

## Task 11: Leaderboard Page

**Files:**
- Modify: `packages/client/src/pages/LeaderboardPage.tsx`

**Step 1: Implement LeaderboardPage**

```tsx
import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useStatsStore } from '../stores/useStatsStore';

export default function LeaderboardPage() {
  const playerId = usePlayerStore(s => s.playerId);
  const { leaderboard, loading, loadLeaderboard } = useStatsStore();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl text-amber-400 mb-6">Leaderboard</h1>
      <p className="text-sm text-gray-500 mb-4">Minimum 20 hands to qualify</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase bg-gray-900/50">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Player</th>
              <th className="text-right py-3 px-4">Skill Score</th>
              <th className="text-right py-3 px-4">Hands</th>
              <th className="text-right py-3 px-4">Win Rate</th>
              <th className="text-right py-3 px-4">VPIP</th>
              <th className="text-right py-3 px-4">AGG</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, i) => {
              const isMe = player.player_id === playerId;
              return (
                <tr
                  key={player.player_id}
                  className={`border-t border-gray-800 ${isMe ? 'bg-emerald-950/20' : ''}`}
                >
                  <td className="py-3 px-4 font-mono text-gray-400">{i + 1}</td>
                  <td className={`py-3 px-4 ${isMe ? 'text-amber-400 font-semibold' : 'text-gray-300'}`}>
                    {player.display_name} {isMe && '(You)'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-400">{player.skill_score}</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-400">{player.hands_played}</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-400">{(player.win_rate * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-400">{(player.vpip * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-400">{player.aggression.toFixed(1)}</td>
                </tr>
              );
            })}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-600">
                  No players have reached 20 hands yet. Keep playing!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Verify**

```bash
npm run dev
```
Navigate to /leaderboard. Should show empty state or ranked players.

**Step 3: Commit**

```bash
git add packages/client/src/pages/LeaderboardPage.tsx
git commit -m "feat(client): build leaderboard page with ranked skill scores"
```

---

## Task 12: Milestone Badges

**Files:**
- Create: `packages/client/src/lib/milestones.ts`
- Create: `packages/client/src/components/dashboard/MilestoneBadges.tsx`
- Modify: `packages/client/src/pages/DashboardPage.tsx` (add badges)

**Step 1: Define milestones**

Create `packages/client/src/lib/milestones.ts`:

```typescript
export interface Milestone {
  id: string;
  label: string;
  description: string;
  check: (stats: { handsPlayed: number; skillScore: number; vpip: number; winRate: number }) => boolean;
}

export const MILESTONES: Milestone[] = [
  { id: 'first-10', label: 'Getting Started', description: 'Play 10 hands', check: s => s.handsPlayed >= 10 },
  { id: 'first-50', label: 'Regular', description: 'Play 50 hands', check: s => s.handsPlayed >= 50 },
  { id: 'century', label: 'Century', description: 'Play 100 hands', check: s => s.handsPlayed >= 100 },
  { id: 'bronze', label: 'Bronze', description: 'Reach skill score 300', check: s => s.skillScore >= 300 },
  { id: 'silver', label: 'Silver', description: 'Reach skill score 500', check: s => s.skillScore >= 500 },
  { id: 'gold', label: 'Gold', description: 'Reach skill score 700', check: s => s.skillScore >= 700 },
  { id: 'tight', label: 'Disciplined', description: 'VPIP under 30% with 50+ hands', check: s => s.vpip <= 0.30 && s.handsPlayed >= 50 },
  { id: 'winner', label: 'Winner', description: 'Win rate above 40%', check: s => s.winRate >= 0.40 && s.handsPlayed >= 20 },
];

export function getEarnedMilestones(stats: { handsPlayed: number; skillScore: number; vpip: number; winRate: number }): Milestone[] {
  return MILESTONES.filter(m => m.check(stats));
}
```

**Step 2: Create MilestoneBadges component**

Create `packages/client/src/components/dashboard/MilestoneBadges.tsx`:

```tsx
import { getEarnedMilestones } from '../../lib/milestones';

interface Props {
  handsPlayed: number;
  skillScore: number;
  vpip: number;
  winRate: number;
}

export default function MilestoneBadges({ handsPlayed, skillScore, vpip, winRate }: Props) {
  const earned = getEarnedMilestones({ handsPlayed, skillScore, vpip, winRate });

  if (earned.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm text-gray-400 mb-4">Milestones</h3>
      <div className="flex flex-wrap gap-2">
        {earned.map(m => (
          <div key={m.id} className="bg-amber-950/30 border border-amber-800 rounded-lg px-3 py-1.5" title={m.description}>
            <span className="text-xs font-medium text-amber-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Add to DashboardPage**

Import and render `<MilestoneBadges>` between the summary cards and charts, passing the stats.

**Step 4: Commit**

```bash
git add packages/client/src/lib/milestones.ts packages/client/src/components/dashboard/MilestoneBadges.tsx packages/client/src/pages/DashboardPage.tsx
git commit -m "feat(client): add milestone badges to dashboard"
```

---

## Task 13: GitHub Actions CI + GitHub Pages Deploy

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `packages/client/vite.config.ts` (set base path for GitHub Pages)

**Step 1: Update Vite config for GitHub Pages**

In `packages/client/vite.config.ts`, add base path:

```typescript
export default defineConfig({
  base: '/poker-coach/',
  // ... existing config
});
```

**Step 2: Create GitHub Actions workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: CI & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Type check
        run: npx tsc --noEmit --project packages/engine/tsconfig.json

      - name: Run engine tests
        run: npm run test:engine

      - name: Build client
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build --workspace=@poker-coach/client

      - name: Upload artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v3
        with:
          path: packages/client/dist

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build-and-test
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 3: Add SPA redirect for GitHub Pages**

Create `packages/client/public/404.html` — GitHub Pages SPA hack that redirects all routes to index.html:

```html
<!DOCTYPE html>
<html>
<head>
  <script>
    // Redirect all routes to index.html for SPA routing
    const path = window.location.pathname;
    const repo = '/poker-coach';
    if (path !== repo + '/' && path !== repo) {
      window.location.replace(repo + '/?redirect=' + encodeURIComponent(path));
    }
  </script>
</head>
</html>
```

And in `packages/client/src/App.tsx`, handle the redirect on mount:

```typescript
// Inside App, before BrowserRouter:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect) {
    window.history.replaceState(null, '', redirect);
  }
}, []);
```

Update the BrowserRouter to use the base path:

```tsx
<BrowserRouter basename="/poker-coach">
```

**Step 4: Verify build**

```bash
cd packages/client && npx vite build
```
Expected: Builds successfully to `dist/`.

**Step 5: Commit**

```bash
git add .github/workflows/deploy.yml packages/client/vite.config.ts packages/client/public/404.html packages/client/src/App.tsx
git commit -m "ci: add GitHub Actions workflow for CI and GitHub Pages deployment"
```

---

## Task 14: Delete Server Package

Since we're going Supabase-only, remove the unused server package.

**Files:**
- Delete: `packages/server/`
- Modify: Root `package.json` if it references server

**Step 1: Remove server directory**

```bash
rm -rf packages/server
```

**Step 2: Verify no references**

Check root package.json workspaces — `"packages/*"` glob will just pick up engine and client, so no change needed.

**Step 3: Commit**

```bash
git rm -r packages/server
git commit -m "chore: remove unused server package (replaced by Supabase)"
```

---

## Task Summary

| # | Task | Depends On | Est. Steps |
|---|---|---|---|
| 1 | AI Action Timing | — | 8 |
| 2 | Thinking Indicator | Task 1 | 5 |
| 3 | Card Dealing Animations | — | 9 |
| 4 | Supabase Setup & Migrations | — | 6 |
| 5 | Player Store | Task 4 | 4 |
| 6 | Session & Hand Persistence | Tasks 4, 5 | 6 |
| 7 | React Router & Navigation | — | 6 |
| 8 | Stats Store | Task 4 | 3 |
| 9 | Skill Snapshots | Tasks 6, 8 | 3 |
| 10 | Dashboard Page | Tasks 7, 8, 9 | 10 |
| 11 | Leaderboard Page | Tasks 7, 8 | 3 |
| 12 | Milestone Badges | Task 10 | 4 |
| 13 | GitHub Actions CI + Deploy | All above | 5 |
| 14 | Delete Server Package | — | 3 |

**Parallelizable groups:**
- Group A (no deps): Tasks 1, 3, 4, 7, 14
- Group B (after 4): Tasks 5, 8
- Group C (after 5): Task 6
- Group D (after 6): Task 9
- Group E (after 7+8): Tasks 10, 11
- Group F (after 10): Task 12
- Final: Task 13
