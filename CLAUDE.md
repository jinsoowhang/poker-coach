# Poker Coach

Texas Hold'em poker trainer with real-time educational overlays.

## Quick Start

```bash
# Install deps (from project root)
npm install

# Run engine tests
npm run test:engine

# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build --workspace=@poker-coach/client
```

## Project Structure

npm workspaces monorepo:

```
poker-coach/
├── packages/
│   ├── engine/        # Pure TS game logic (zero DOM deps)
│   │   └── src/
│   │       ├── types.ts            # All shared types/interfaces
│   │       ├── card.ts             # Card creation, comparison, display
│   │       ├── deck.ts             # 52-card deck, shuffle, draw
│   │       ├── hand-evaluator.ts   # Wraps pokersolver
│   │       ├── hand-rank.ts        # Compare hands, find winners
│   │       ├── odds-calculator.ts  # Pot odds, outs, draw probabilities
│   │       ├── pot-manager.ts      # Main pot + side pots
│   │       ├── betting-round.ts    # Valid actions, blinds, all-in
│   │       ├── game-state.ts       # Pure reducer: applyAction()
│   │       ├── game-loop.ts        # Orchestrates hands, emits events
│   │       └── ai/
│   │           ├── decision-engine.ts   # Hand strength + personality → action
│   │           ├── personalities.ts     # TAG, LP, TP, LAG profiles
│   │           └── action-timing.ts     # Variable delay by action type + personality
│   ├── client/        # React + Vite + Tailwind frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── CardComponent.tsx          # CSS-only card rendering
│   │       │   ├── AnimatedCard.tsx           # Card with deal/flip/glow animations
│   │       │   ├── DeckPosition.tsx           # Visual card deck stack
│   │       │   ├── PokerTable.tsx             # Oval felt table layout + chip animations
│   │       │   ├── PlayerSeat.tsx             # Player info + animated cards + thinking indicator
│   │       │   ├── NavBar.tsx                 # Top navigation (Play/Dashboard/Leaderboard)
│   │       │   ├── BettingControls.tsx        # Fold/Check/Call/Raise/All-in
│   │       │   ├── PotOddsDisplay.tsx         # Pot odds overlay
│   │       │   ├── HandProbabilityOverlay.tsx  # Outs by draw type
│   │       │   ├── HandStrengthGauge.tsx      # Percentile strength bar
│   │       │   ├── PostHandModal.tsx          # Decision review modal
│   │       │   └── dashboard/
│   │       │       ├── StatCard.tsx            # Summary stat card
│   │       │       ├── ChipTrendChart.tsx      # Chip count line chart
│   │       │       ├── SkillTrendChart.tsx     # Skill score line chart
│   │       │       ├── SkillRadar.tsx          # SVG radar chart vs optimal
│   │       │       ├── RecentHandsTable.tsx    # Last 20 hands table
│   │       │       ├── CoachingInsights.tsx    # Stat-based coaching tips
│   │       │       └── MilestoneBadges.tsx     # Achievement badges
│   │       ├── hooks/
│   │       │   └── useAnimationSequence.ts    # Queue-based animation sequencer
│   │       ├── lib/
│   │       │   ├── supabase.ts         # Supabase client (null-safe)
│   │       │   ├── persistence.ts      # Save hands/sessions to Supabase
│   │       │   ├── stats.ts            # Fetch stats/leaderboard queries
│   │       │   ├── skill-calculator.ts # Compute skill score snapshots
│   │       │   └── milestones.ts       # Achievement milestone definitions
│   │       ├── stores/
│   │       │   ├── useGameStore.ts      # Zustand: game state + engine bridge
│   │       │   ├── useSettingsStore.ts  # Zustand: overlay toggles
│   │       │   ├── usePlayerStore.ts    # Zustand: anonymous player identity
│   │       │   ├── useSessionStore.ts   # Zustand: session tracking
│   │       │   └── useStatsStore.ts     # Zustand: dashboard/leaderboard data
│   │       └── pages/
│   │           ├── GamePage.tsx         # Main poker game
│   │           ├── DashboardPage.tsx    # Personal stats + charts
│   │           └── LeaderboardPage.tsx  # Ranked skill scores
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Tables, views, RLS policies
└── .github/
    └── workflows/
        └── deploy.yml  # CI + GitHub Pages deploy
```

## Tech Stack

- **Engine**: Pure TypeScript, pokersolver for hand evaluation
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Zustand, React Router, Recharts
- **Backend**: Supabase (Postgres + JS client, no Express server)
- **Testing**: Vitest (100 tests across 12 files)
- **Deploy**: GitHub Pages (static) + GitHub Actions CI
- **Design**: Casino noir — emerald felt, gold accents, Playfair Display / DM Sans / DM Mono / Crimson Text fonts

## Architecture

- **Event-driven**: GameLoop emits GameEvent → Zustand store subscribes → React re-renders
- **Human input**: Async Promise-based pattern via AWAITING_INPUT event
- **AI players**: Personality profiles (VPIP/aggression/bluff/speed) + hand strength → fold/call/raise
- **AI timing**: Variable delay by action type (800ms-4s) scaled by personality speed modifier
- **State management**: Pure immutable reducer (applyAction) in engine, Zustand stores in client
- **Persistence**: HAND_END → async Supabase insert (fire-and-forget, works offline)
- **Anonymous auth**: localStorage player ID, schema ready for Supabase Auth
- **Engine is DOM-free**: Can be used server-side or in workers

## Completed Phases

### Phase 1: Engine Core ✅
All game logic: cards, deck, hand evaluation, betting, pot management, game loop, AI.

### Phase 2: Playable Table ✅
Full React UI: poker table, card rendering, betting controls, game flow.

### Phase 3: Educational Overlays ✅
Real-time coaching: hand strength gauge, pot odds, outs/draw probabilities, post-hand review modal with coaching summaries.

### Phase 4: Persistence, Stats & Polish ✅
- Supabase integration (hand history, sessions, skill snapshots)
- Dashboard with charts (chip trend, skill trend, radar, coaching insights, milestones)
- Leaderboard with composite skill scoring
- Casino-feel card animations (deal, flip, showdown glow, chip movement)
- Variable AI timing with thinking indicator
- GitHub Actions CI + GitHub Pages deployment

## Environment Setup

Copy `packages/client/.env.example` to `packages/client/.env` and set:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

For GitHub Actions, set these as repository secrets.

## Conventions

- Commits follow conventional commits: `feat(scope):`, `fix(scope):`, etc.
- Engine tests live next to source: `foo.ts` → `foo.test.ts`
- All engine functions are pure where possible (game-state reducer is fully immutable)
- AI delay is variable: 800ms-4s base, modified by personality speed (LAG fast, TP slow)
- Package names: `@poker-coach/engine`, `@poker-coach/client`
